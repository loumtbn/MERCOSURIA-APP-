/**
 * src/components/solana/TxStatus.tsx
 *
 * A small utility component + hook for surfacing Solana transaction
 * status (loading / confirmed / error) via a toast-style banner.
 *
 * Usage:
 *   const { execute, status } = useTx();
 *   <button onClick={() => execute(() => releasePayment(...))}>Pay</button>
 *   <TxStatus status={status} />
 */

import React from "react";
import { Loader2, CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import { useConnection } from "@solana/wallet-adapter-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type TxState =
  | { type: "idle" }
  | { type: "pending" }
  | { type: "confirmed"; signature: string }
  | { type: "error"; message: string };

// ─── Hook ─────────────────────────────────────────────────────────────────────

import { useState, useCallback } from "react";

export function useTx() {
  const [status, setStatus] = useState<TxState>({ type: "idle" });

  const execute = useCallback(
    async (fn: () => Promise<string>): Promise<string | null> => {
      setStatus({ type: "pending" });
      try {
        const sig = await fn();
        setStatus({ type: "confirmed", signature: sig });
        // Auto-clear after 8 s
        setTimeout(() => setStatus({ type: "idle" }), 8000);
        return sig;
      } catch (err: any) {
        const msg =
          err?.message ??
          (typeof err === "string" ? err : "Transaction failed");
        setStatus({ type: "error", message: msg });
        return null;
      }
    },
    []
  );

  const reset = useCallback(() => setStatus({ type: "idle" }), []);

  return { status, execute, reset };
}

// ─── Component ────────────────────────────────────────────────────────────────

const CLUSTER = import.meta.env.VITE_SOLANA_NETWORK ?? "devnet";
const EXPLORER_BASE =
  CLUSTER === "mainnet-beta"
    ? "https://explorer.solana.com/tx"
    : `https://explorer.solana.com/tx?cluster=${CLUSTER}`;

function explorerUrl(sig: string) {
  return `${EXPLORER_BASE === "https://explorer.solana.com/tx" ? EXPLORER_BASE : "https://explorer.solana.com/tx"}/${sig}${CLUSTER !== "mainnet-beta" ? `?cluster=${CLUSTER}` : ""}`;
}

interface TxStatusProps {
  status: TxState;
  onDismiss?: () => void;
}

export function TxStatus({ status, onDismiss }: TxStatusProps) {
  if (status.type === "idle") return null;

  const baseClass =
    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm shadow-lg border";

  if (status.type === "pending") {
    return (
      <div className={`${baseClass} border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200`}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Sending transaction…</span>
      </div>
    );
  }

  if (status.type === "confirmed") {
    return (
      <div className={`${baseClass} border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200`}>
        <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-500" />
        <span className="flex-1">Transaction confirmed!</span>
        <a
          href={explorerUrl(status.signature)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 underline underline-offset-2 opacity-70 hover:opacity-100"
        >
          View <ExternalLink className="h-3 w-3" />
        </a>
        {onDismiss && (
          <button onClick={onDismiss} className="ml-2 opacity-50 hover:opacity-100">
            ✕
          </button>
        )}
      </div>
    );
  }

  if (status.type === "error") {
    return (
      <div className={`${baseClass} border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200`}>
        <XCircle className="h-4 w-4 flex-shrink-0 text-red-500" />
        <span className="flex-1 break-all">{status.message}</span>
        {onDismiss && (
          <button onClick={onDismiss} className="ml-2 opacity-50 hover:opacity-100">
            ✕
          </button>
        )}
      </div>
    );
  }

  return null;
}
