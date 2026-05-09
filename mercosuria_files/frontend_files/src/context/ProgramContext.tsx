/**
 * src/context/ProgramContext.tsx
 *
 * Wraps the whole app with:
 *  1. Solana WalletAdapterProvider (Phantom, Solflare, etc.)
 *  2. Anchor Program instance bound to the connected wallet
 *  3. useProgramContext() hook for any child component
 *
 * ── Usage ────────────────────────────────────────────────────────────────────
 * Wrap your App:
 *
 *   <ProgramProvider>
 *     <App />
 *   </ProgramProvider>
 *
 * Use inside a component:
 *
 *   const { program, wallet, connected } = useProgramContext();
 */

import React, {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { clusterApiUrl, Connection } from "@solana/web3.js";
import {
  ConnectionProvider,
  WalletProvider,
  useAnchorWallet,
  useConnection,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  BackpackWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { AnchorProvider, Program } from "@coral-xyz/anchor";

import { PROGRAM_ID } from "@/lib/program";
import { MERCOSURIA_IDL, type MercosuriaIDL } from "@/lib/idl";

// Import wallet-adapter CSS (required for the modal)
import "@solana/wallet-adapter-react-ui/styles.css";

// ─── Config ───────────────────────────────────────────────────────────────────

// Switch to "mainnet-beta" when going live
const SOLANA_NETWORK = (import.meta.env.VITE_SOLANA_NETWORK ?? "devnet") as
  | "devnet"
  | "mainnet-beta"
  | "testnet";

const RPC_URL =
  import.meta.env.VITE_SOLANA_RPC_URL ?? clusterApiUrl(SOLANA_NETWORK);

// ─── Context ─────────────────────────────────────────────────────────────────

interface ProgramContextValue {
  program: Program<MercosuriaIDL> | null;
  connected: boolean;
  publicKey: string | null;
  network: string;
}

const ProgramContext = createContext<ProgramContextValue>({
  program: null,
  connected: false,
  publicKey: null,
  network: SOLANA_NETWORK,
});

// ─── Inner provider (has access to wallet adapter hooks) ──────────────────────

function ProgramContextInner({ children }: { children: ReactNode }) {
  const anchorWallet = useAnchorWallet();
  const { connection } = useConnection();

  const program = useMemo<Program<MercosuriaIDL> | null>(() => {
    if (!anchorWallet) return null;
    const provider = new AnchorProvider(connection, anchorWallet, {
      commitment: "confirmed",
      preflightCommitment: "confirmed",
    });
    return new Program<MercosuriaIDL>(MERCOSURIA_IDL as any, provider);
  }, [anchorWallet, connection]);

  const value: ProgramContextValue = {
    program,
    connected: !!anchorWallet,
    publicKey: anchorWallet?.publicKey.toBase58() ?? null,
    network: SOLANA_NETWORK,
  };

  return (
    <ProgramContext.Provider value={value}>{children}</ProgramContext.Provider>
  );
}

// ─── Public Provider ──────────────────────────────────────────────────────────

export function ProgramProvider({ children }: { children: ReactNode }) {
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new BackpackWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={RPC_URL}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <ProgramContextInner>{children}</ProgramContextInner>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useProgramContext() {
  return useContext(ProgramContext);
}
