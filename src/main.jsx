import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { AppKitProvider } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { SolanaAdapter } from "@reown/appkit-adapter-solana";
import { REOWN_PROJECT_ID, CHAINS, SOLANA_NETWORK } from "./config";

const wagmiAdapter = new WagmiAdapter({ projectId: REOWN_PROJECT_ID, chains: CHAINS });
const solanaAdapter = new SolanaAdapter({ projectId: REOWN_PROJECT_ID, network: SOLANA_NETWORK });

ReactDOM.createRoot(document.getElementById("root")).render(
  <AppKitProvider adapters={[wagmiAdapter, solanaAdapter]} projectId={REOWN_PROJECT_ID}>
    <App />
  </AppKitProvider>
);