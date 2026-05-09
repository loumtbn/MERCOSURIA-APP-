/**
 * src/pages/OpenCasePage.tsx  (or drop into any component tree)
 *
 * Full form for a client to open a new legal case and deposit SOL escrow.
 * Connects to the Mercosuria Anchor program via useMercosuria().
 */

import React, { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useMercosuria, type OpenCaseParams } from "@/context/SolanaProvider";
import { useTx, TxStatus } from "@/components/solana/TxStatus";
import { WalletButton } from "@/components/solana/WalletButton";
import { Scale, Briefcase, FileText, DollarSign, Calendar } from "lucide-react";

const CASE_TYPES = [
  { value: "tradeLaw",             label: "Trade Law" },
  { value: "arbitrationMercosur", label: "MERCOSUR Arbitration" },
  { value: "contractDispute",     label: "Contract Dispute" },
  { value: "commercialLaw",       label: "Commercial Law" },
  { value: "laborLaw",            label: "Labor Law" },
  { value: "consumerProtection",  label: "Consumer Protection" },
  { value: "regulatoryCompliance","label": "Regulatory Compliance" },
  { value: "intellectualProperty","label": "Intellectual Property" },
  { value: "other",               label: "Other" },
] as const;

export function OpenCasePage() {
  const { connected } = useWallet();
  const { openCase } = useMercosuria();
  const { status, execute, reset } = useTx();

  const [form, setForm] = useState<{
    title: string;
    description: string;
    caseType: OpenCaseParams["caseType"];
    budgetSOL: string;
    deadline: string;
  }>({
    title: "",
    description: "",
    caseType: "tradeLaw",
    budgetSOL: "0.5",
    deadline: "",
  });

  const [result, setResult] = useState<{ tx: string; casePDA: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const sig = await execute(async () => {
      const deadline = new Date(form.deadline);
      const { tx, casePDA } = await openCase({
        title: form.title,
        description: form.description,
        caseType: form.caseType,
        budgetSOL: parseFloat(form.budgetSOL),
        deadlineDate: deadline,
      });
      setResult({ tx, casePDA: casePDA.toBase58() });
      return tx;
    });
  };

  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <Scale className="h-12 w-12 text-emerald-500 opacity-60" />
        <p className="text-lg font-medium text-slate-700 dark:text-slate-300">
          Connect your wallet to open a legal case
        </p>
        <WalletButton />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <div className="flex items-center gap-3">
        <Scale className="h-7 w-7 text-emerald-600" />
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Open Legal Case
        </h1>
      </div>

      <p className="text-sm text-slate-500 dark:text-slate-400">
        Your SOL deposit is held in a secure on-chain escrow and only released
        to the lawyer upon your approval.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
        <div className="space-y-1">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            <Briefcase className="h-4 w-4" /> Case Title
          </label>
          <input
            type="text"
            required
            maxLength={128}
            placeholder="e.g. Trade Dispute — Argentina/Uruguay"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          />
        </div>

        {/* Description */}
        <div className="space-y-1">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            <FileText className="h-4 w-4" /> Description
          </label>
          <textarea
            required
            maxLength={512}
            rows={4}
            placeholder="Describe the legal matter, facts, and what you need from a lawyer…"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          />
        </div>

        {/* Case Type */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Case Type
          </label>
          <select
            value={form.caseType}
            onChange={(e) =>
              setForm({ ...form, caseType: e.target.value as OpenCaseParams["caseType"] })
            }
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          >
            {CASE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Budget */}
        <div className="space-y-1">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            <DollarSign className="h-4 w-4" /> Budget (SOL)
          </label>
          <input
            type="number"
            required
            min="0.001"
            step="0.001"
            value={form.budgetSOL}
            onChange={(e) => setForm({ ...form, budgetSOL: e.target.value })}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          />
          <p className="text-xs text-slate-400">
            This amount will be deposited into on-chain escrow immediately.
          </p>
        </div>

        {/* Deadline */}
        <div className="space-y-1">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            <Calendar className="h-4 w-4" /> Case Deadline
          </label>
          <input
            type="datetime-local"
            required
            value={form.deadline}
            onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          />
        </div>

        {/* Status */}
        <TxStatus status={status} onDismiss={reset} />

        {/* Success details */}
        {result && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm dark:border-emerald-800 dark:bg-emerald-950">
            <p className="font-semibold text-emerald-800 dark:text-emerald-200">
              ✅ Case created on-chain
            </p>
            <p className="mt-1 break-all text-xs text-emerald-700 dark:text-emerald-400">
              Case PDA: <code>{result.casePDA}</code>
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={status.type === "pending"}
          className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow transition hover:bg-emerald-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status.type === "pending" ? "Confirming…" : "Open Case & Deposit SOL"}
        </button>
      </form>
    </div>
  );
}
