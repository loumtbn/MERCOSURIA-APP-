/**
 * src/main.tsx  — REPLACE the existing file with this
 *
 * Wraps <App /> with <ProgramProvider> which bootstraps:
 *  · Solana ConnectionProvider (devnet / mainnet via VITE_SOLANA_NETWORK env var)
 *  · WalletProvider (Phantom, Solflare, Backpack)
 *  · WalletModalProvider (modal UI)
 *  · Anchor Program context available via useProgramContext()
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { ProgramProvider } from "./context/ProgramContext";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ProgramProvider>
      <App />
    </ProgramProvider>
  </StrictMode>
);
