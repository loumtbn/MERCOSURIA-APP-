/**
 * src/pages/RegisterLawyerPage.tsx
 *
 * Form for lawyers to register their on-chain profile.
 * Requires at least 1 SOL in the connected wallet (stake check).
 */

import React, { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useMercosuria } from "@/context/SolanaProvider";
import { useTx, TxStatus } from "@/components/solana/TxStatus";
import { WalletButton } from "@/components/solana/WalletButton";
import { UserCheck, Globe, Hash, Briefcase, Clock } from "lucide-react";

const JURISDICTIONS = [
  "Argentina",
  "Brazil",
  "Paraguay",
  "Uruguay",
  "Venezuela",
  "EU / Belgium",
  "EU / Spain",
  "EU / France",
  "EU / Germany",
  "Regional — MERCOSUR",
  "International",
];

export function RegisterLawyerPage() {
  const { connected } = useWallet();
  const { registerLawyer } = useMercosuria();
  const { status, execute, reset } = useTx();

  const [form, setForm] = useState({
    name: "",
    barNumber: "",
    jurisdiction: "Argentina",
    specialization: "",
    hourlyRateSOL: "0.05",
  });

  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const sig = await execute(async () => {
      const tx = await registerLawyer({
        name: form.name,
        barNumber: form.barNumber,
        jurisdiction: form.jurisdiction,
        specialization: form.specialization,
        hourlyRateSOL: parseFloat(form.hourlyRateSOL),
      });
      setDone(true);
      return tx;
    });
  };

  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <UserCheck className="h-12 w-12 text-emerald-500 opacity-60" />
        <p className="text-lg font-medium text-slate-700 dark:text-slate-300">
          Connect your wallet to register as a lawyer
        </p>
        <WalletButton />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <div className="flex items-center gap-3">
        <UserCheck className="h-7 w-7 text-emerald-600" />
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Register as a Lawyer
        </h1>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
        <strong>Stake requirement:</strong> Your wallet must hold at least 1 SOL.
        This is verified on-chain and acts as professional collateral.
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Field icon={<UserCheck className="h-4 w-4" />} label="Full Name">
          <input
            type="text" required maxLength={128}
            placeholder="e.g. María González"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={inputCls}
          />
        </Field>

        <Field icon={<Hash className="h-4 w-4" />} label="Bar Number / License ID">
          <input
            type="text" required maxLength={32}
            placeholder="e.g. ARG-2019-4821"
            value={form.barNumber}
            onChange={(e) => setForm({ ...form, barNumber: e.target.value })}
            className={inputCls}
          />
        </Field>

        <Field icon={<Globe className="h-4 w-4" />} label="Jurisdiction">
          <select
            value={form.jurisdiction}
            onChange={(e) => setForm({ ...form, jurisdiction: e.target.value })}
            className={inputCls}
          >
            {JURISDICTIONS.map((j) => (
              <option key={j} value={j}>{j}</option>
            ))}
          </select>
        </Field>

        <Field icon={<Briefcase className="h-4 w-4" />} label="Specialization">
          <input
            type="text" required maxLength={64}
            placeholder="e.g. MERCOSUR Trade Law, Commercial Arbitration"
            value={form.specialization}
            onChange={(e) => setForm({ ...form, specialization: e.target.value })}
            className={inputCls}
          />
        </Field>

        <Field icon={<Clock className="h-4 w-4" />} label="Hourly Rate (SOL)">
          <input
            type="number" required min="0.001" step="0.001"
            value={form.hourlyRateSOL}
            onChange={(e) => setForm({ ...form, hourlyRateSOL: e.target.value })}
            className={inputCls}
          />
          <p className="mt-1 text-xs text-slate-400">
            Visible to clients browsing for lawyers.
          </p>
        </Field>

        <TxStatus status={status} onDismiss={reset} />

        {done && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm dark:border-emerald-800 dark:bg-emerald-950">
            <p className="font-semibold text-emerald-800 dark:text-emerald-200">
              ✅ Profile registered on-chain! Clients can now find and hire you.
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={status.type === "pending" || done}
          className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow transition hover:bg-emerald-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status.type === "pending" ? "Confirming…" : done ? "Registered ✓" : "Register Profile"}
        </button>
      </form>
    </div>
  );
}

// ─── Tiny helpers ─────────────────────────────────────────────────────────────

const inputCls =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white";

function Field({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
        {icon} {label}
      </label>
      {children}
    </div>
  );
}
