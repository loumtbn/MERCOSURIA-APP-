/**
 * src/components/solana/OpenCaseForm.tsx
 *
 * Form that lets a client open a new legal case with SOL escrow deposit.
 * Calls useMercosuria().openCase() on submit.
 *
 * ── Usage ────────────────────────────────────────────────────────────────────
 *   <OpenCaseForm onSuccess={(tx, casePDA) => navigate(`/cases/${casePDA}`)} />
 */

import { useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { Loader2, Scale, AlertCircle, CheckCircle2 } from "lucide-react";

import { useMercosuria } from "@/hooks/useMercosuria";
import type { CaseType } from "@/lib/program";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const CASE_TYPES: { value: CaseType; label: string }[] = [
  { value: "tradeLaw", label: "Trade Law" },
  { value: "arbitrationMercosur", label: "MERCOSUR Arbitration" },
  { value: "contractDispute", label: "Contract Dispute" },
  { value: "commercialLaw", label: "Commercial Law" },
  { value: "laborLaw", label: "Labor Law" },
  { value: "consumerProtection", label: "Consumer Protection" },
  { value: "regulatoryCompliance", label: "Regulatory Compliance" },
  { value: "intellectualProperty", label: "Intellectual Property" },
  { value: "other", label: "Other" },
];

interface OpenCaseFormProps {
  onSuccess?: (tx: string, casePDA: PublicKey, caseId: BN) => void;
}

export function OpenCaseForm({ onSuccess }: OpenCaseFormProps) {
  const { openCase, connected } = useMercosuria();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [caseType, setCaseType] = useState<CaseType>("tradeLaw");
  const [budgetSOL, setBudgetSOL] = useState("0.5");
  const [deadlineDate, setDeadlineDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successTx, setSuccessTx] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessTx(null);

    if (!title.trim()) { setError("Title is required."); return; }
    if (!description.trim()) { setError("Description is required."); return; }
    const budget = parseFloat(budgetSOL);
    if (isNaN(budget) || budget <= 0) { setError("Budget must be a positive number."); return; }
    const deadline = new Date(deadlineDate);
    if (deadline <= new Date()) { setError("Deadline must be in the future."); return; }

    setLoading(true);
    try {
      const { tx, casePDA, caseId } = await openCase({
        title: title.trim(),
        description: description.trim(),
        caseType,
        budgetSOL: budget,
        deadlineDate: deadline,
      });
      setSuccessTx(tx);
      onSuccess?.(tx, casePDA, caseId);
    } catch (err: any) {
      setError(err?.message ?? "Transaction failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scale className="h-5 w-5 text-emerald-600" />
          Open a Legal Case
        </CardTitle>
        <CardDescription>
          Your SOL budget will be locked in escrow and released to your lawyer as the case progresses.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title">Case Title</Label>
            <Input
              id="title"
              placeholder="e.g. Breach of Trade Agreement — ARG/URY"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={128}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the legal matter, parties involved, and what outcome you're seeking…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={512}
              required
            />
            <p className="text-xs text-muted-foreground text-right">
              {description.length}/512
            </p>
          </div>

          {/* Case Type */}
          <div className="space-y-1.5">
            <Label>Case Type</Label>
            <Select value={caseType} onValueChange={(v) => setCaseType(v as CaseType)}>
              <SelectTrigger>
                <SelectValue placeholder="Select case type" />
              </SelectTrigger>
              <SelectContent>
                {CASE_TYPES.map((ct) => (
                  <SelectItem key={ct.value} value={ct.value}>
                    {ct.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Budget + Deadline row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="budget">Budget (SOL)</Label>
              <Input
                id="budget"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.5"
                value={budgetSOL}
                onChange={(e) => setBudgetSOL(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Deposited into on-chain escrow
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="deadline">Deadline</Label>
              <Input
                id="deadline"
                type="date"
                value={deadlineDate}
                onChange={(e) => setDeadlineDate(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Errors */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success */}
          {successTx && (
            <Alert className="border-emerald-600 bg-emerald-50">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <AlertDescription className="text-emerald-800">
                Case opened!{" "}
                <a
                  href={`https://explorer.solana.com/tx/${successTx}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-medium"
                >
                  View transaction
                </a>
              </AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            disabled={loading || !connected}
          >
            {loading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Opening case…</>
            ) : (
              "Open Case & Deposit Escrow"
            )}
          </Button>

          {!connected && (
            <p className="text-sm text-center text-muted-foreground">
              Connect your wallet to open a case.
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
