/**
 * src/pages/MyCasesPage.tsx
 *
 * Shows the connected wallet's open legal cases fetched from on-chain.
 * Each case card exposes: status badge, escrow balance, document upload,
 * release payment, and raise dispute actions.
 */

import React, { useEffect, useState, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import {
  useMercosuria,
  type OpenCaseParams,
} from "@/context/SolanaProvider";
import { useTx, TxStatus } from "@/components/solana/TxStatus";
import { WalletButton } from "@/components/solana/WalletButton";
import type { LegalCase } from "@/lib/mercosuria";
import {
  Scale,
  Upload,
  CreditCard,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// ─── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Record<string, object> }) {
  const map: Record<string, { label: string; cls: string }> = {
    open:       { label: "Open",        cls: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
    inProgress: { label: "In Progress", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300" },
    disputed:   { label: "Disputed",    cls: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300" },
    closed:     { label: "Closed",      cls: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
  };
  const key = Object.keys(status)[0];
  const { label, cls } = map[key] ?? { label: key, cls: "bg-slate-100 text-slate-600" };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}

// ─── Case card ─────────────────────────────────────────────────────────────────

function CaseCard({
  pubkey,
  account,
}: {
  pubkey: PublicKey;
  account: LegalCase;
}) {
  const {
    attachDocument,
    hashFile,
    releasePayment,
    raiseDispute,
    caseStatusLabel,
    caseTypeLabel,
    lamportsToSOL,
  } = useMercosuria();

  const { execute: execDoc,  status: docStatus,  reset: resetDoc  } = useTx();
  const { execute: execPay,  status: payStatus,  reset: resetPay  } = useTx();
  const { execute: execDisp, status: dispStatus, reset: resetDisp } = useTx();

  const [expanded, setExpanded] = useState(false);
  const [payAmount, setPayAmount] = useState("0.1");
  const [disputeReason, setDisputeReason] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await execDoc(async () => {
      const hash = await hashFile(file);
      return attachDocument(pubkey, hash, file.name, "contract");
    });
    e.target.value = "";
  };

  const handlePay = async () => {
    await execPay(() =>
      releasePayment(
        account.caseId,
        account.client,
        account.assignedLawyer!,
        parseFloat(payAmount),
        // Treasury defaults to platform — replace with actual treasury pubkey
        new PublicKey("11111111111111111111111111111111")
      )
    );
  };

  const handleDispute = async () => {
    if (!disputeReason.trim()) return;
    await execDisp(() => raiseDispute(pubkey, disputeReason));
  };

  const canPay = account.assignedLawyer && "inProgress" in account.status;
  const canDispute = "inProgress" in account.status;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      {/* Header */}
      <div
        className="flex cursor-pointer items-start justify-between gap-4 px-5 py-4"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={account.status} />
            <span className="text-xs text-slate-400">
              {caseTypeLabel(account.caseType)}
            </span>
          </div>
          <h3 className="truncate font-semibold text-slate-900 dark:text-white">
            {account.title}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Escrow: <strong>{lamportsToSOL(account.escrowedLamports)} SOL</strong>
            {" · "}Paid: {lamportsToSOL(account.paidLamports)} SOL
          </p>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 flex-shrink-0 text-slate-400" />
        ) : (
          <ChevronDown className="h-4 w-4 flex-shrink-0 text-slate-400" />
        )}
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="space-y-4 border-t border-slate-100 px-5 pb-5 pt-4 dark:border-slate-800">
          {/* Description */}
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {account.description}
          </p>

          {/* Docs */}
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Documents ({account.documentHashes.length})
            </p>
            {account.documentHashes.length > 0 && (
              <ul className="mb-2 space-y-1">
                {account.documentHashes.map((h, i) => (
                  <li key={i} className="truncate font-mono text-xs text-slate-500">
                    {h}
                  </li>
                ))}
              </ul>
            )}
            <input ref={fileRef} type="file" className="hidden" onChange={handleUpload} />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={docStatus.type === "pending"}
              className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Upload className="h-3 w-3" /> Attach Document
            </button>
            <TxStatus status={docStatus} onDismiss={resetDoc} />
          </div>

          {/* Release payment */}
          {canPay && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Release Payment
              </p>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0.001"
                  step="0.001"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-28 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                />
                <span className="self-center text-sm text-slate-500">SOL</span>
                <button
                  onClick={handlePay}
                  disabled={payStatus.type === "pending"}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  <CreditCard className="h-3.5 w-3.5" />
                  Pay Lawyer
                </button>
              </div>
              <TxStatus status={payStatus} onDismiss={resetPay} />
            </div>
          )}

          {/* Dispute */}
          {canDispute && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Raise Dispute
              </p>
              <textarea
                rows={2}
                placeholder="Describe the issue…"
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              />
              <button
                onClick={handleDispute}
                disabled={!disputeReason.trim() || dispStatus.type === "pending"}
                className="flex items-center gap-1.5 rounded-lg border border-amber-400 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-50 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300"
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                Raise Dispute
              </button>
              <TxStatus status={dispStatus} onDismiss={resetDisp} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export function MyCasesPage() {
  const { connected } = useWallet();
  const { fetchMyCases } = useMercosuria();
  const [cases, setCases] = useState<Array<{ pubkey: PublicKey; account: LegalCase }>>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const data = await fetchMyCases();
    // Sort by caseId descending (newest first)
    data.sort((a, b) => b.account.caseId.toNumber() - a.account.caseId.toNumber());
    setCases(data);
    setLoading(false);
  };

  useEffect(() => {
    if (connected) load();
  }, [connected]);

  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <Scale className="h-12 w-12 text-emerald-500 opacity-60" />
        <p className="text-lg font-medium text-slate-700 dark:text-slate-300">
          Connect your wallet to view your cases
        </p>
        <WalletButton />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 py-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Scale className="h-7 w-7 text-emerald-600" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            My Cases
          </h1>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-400"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {loading && (
        <p className="text-center text-sm text-slate-400">Loading cases…</p>
      )}

      {!loading && cases.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center dark:border-slate-600">
          <p className="text-slate-500">No cases found. Open your first case to get started.</p>
        </div>
      )}

      {cases.map(({ pubkey, account }) => (
        <CaseCard key={pubkey.toBase58()} pubkey={pubkey} account={account} />
      ))}
    </div>
  );
}
