import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { createAppKit } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { REOWN_PROJECT_ID, CHAINS } from "./config";

const queryClient = new QueryClient();

const wagmiAdapter = new WagmiAdapter({
  projectId: REOWN_PROJECT_ID,
  chains: CHAINS
});

createAppKit({
  adapters: [wagmiAdapter],
  projectId: REOWN_PROJECT_ID,
  networks: CHAINS,
  metadata: {
    name: "Web3 dApp",
    description: "Native balance sender",
    url: "http://localhost:5173",
    icons: []
  }
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);
