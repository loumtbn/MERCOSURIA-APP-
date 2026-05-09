/**
 * src/components/solana/CaseCard.tsx
 *
 * Displays a legal case with its status, escrow balance, and action buttons.
 * Actions adapt based on the viewer's role (client / assigned lawyer / other).
 */

import { useState } from "react";
import { PublicKey } from "@solana/web3.js";
import {
  Scale, Clock, Wallet, FileText, AlertTriangle,
  CheckCircle2, Loader2, ChevronRight, Ban,
} from "lucide-react";

import { useMercosuria } from "@/hooks/useMercosuria";
import {
  type LegalCase,
  lamportsToSOL,
  caseStatusLabel,
  caseTypeLabel,
  reputationLabel,
} from "@/lib/program";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const STATUS_COLORS: Record<string, string> = {
  open: "bg-blue-100 text-blue-800",
  inProgress: "bg-amber-100 text-amber-800",
  disputed: "bg-red-100 text-red-800",
  closed: "bg-gray-100 text-gray-600",
};

interface CaseCardProps {
  casePDA: PublicKey;
  legalCase: LegalCase;
  viewerPublicKey?: string | null;
  onRefresh?: () => void;
}

export function CaseCard({ casePDA, legalCase, viewerPublicKey, onRefresh }: CaseCardProps) {
  const { releasePayment, raiseDispute, closeCase, connected } = useMercosuria();

  const isClient = viewerPublicKey === legalCase.client.toBase58();
  const isLawyer = viewerPublicKey === legalCase.assignedLawyer?.toBase58();

  const statusKey = Object.keys(legalCase.status)[0];
  const escrowSOL = parseFloat(lamportsToSOL(legalCase.escrowedLamports));
  const budgetSOL = parseFloat(lamportsToSOL(legalCase.budgetLamports));
  const paidSOL = parseFloat(lamportsToSOL(legalCase.paidLamports));
  const escrowPct = budgetSOL > 0 ? Math.round((escrowSOL / budgetSOL) * 100) : 0;

  const deadlineDate = new Date(legalCase.deadlineTs.toNumber() * 1000);
  const isPastDeadline = deadlineDate < new Date();

  // ── Release Payment dialog ──────────────────────────────────────────────
  const [payDialog, setPayDialog] = useState(false);
  const [payAmount, setPayAmount] = useState("0.1");
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  const handleRelease = async () => {
    if (!legalCase.assignedLawyer) return;
    setPayLoading(true);
    setPayError(null);
    try {
      await releasePayment(
        legalCase.client,
        legalCase.caseId,
        legalCase.assignedLawyer,
        parseFloat(payAmount)
      );
      setPayDialog(false);
      onRefresh?.();
    } catch (e: any) {
      setPayError(e?.message ?? "Payment failed");
    } finally {
      setPayLoading(false);
    }
  };

  // ── Raise Dispute dialog ────────────────────────────────────────────────
  const [disputeDialog, setDisputeDialog] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeLoading, setDisputeLoading] = useState(false);
  const [disputeError, setDisputeError] = useState<string | null>(null);

  const handleDispute = async () => {
    if (!disputeReason.trim()) { setDisputeError("Please describe the dispute."); return; }
    setDisputeLoading(true);
    setDisputeError(null);
    try {
      await raiseDispute(casePDA, disputeReason.trim());
      setDisputeDialog(false);
      onRefresh?.();
    } catch (e: any) {
      setDisputeError(e?.message ?? "Failed to raise dispute");
    } finally {
      setDisputeLoading(false);
    }
  };

  // ── Close Case dialog ────────────────────────────────────────────────────
  const [closeDialog, setCloseDialog] = useState(false);
  const [closeNotes, setCloseNotes] = useState("");
  const [closeLoading, setCloseLoading] = useState(false);
  const [closeError, setCloseError] = useState<string | null>(null);

  const handleClose = async () => {
    if (!legalCase.assignedLawyer) return;
    setCloseLoading(true);
    setCloseError(null);
    try {
      await closeCase(legalCase.caseId, legalCase.assignedLawyer, "clientWon", closeNotes || "Case resolved.");
      setCloseDialog(false);
      onRefresh?.();
    } catch (e: any) {
      setCloseError(e?.message ?? "Failed to close case");
    } finally {
      setCloseLoading(false);
    }
  };

  return (
    <>
      <Card className="w-full hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base leading-tight">{legalCase.title}</CardTitle>
            <Badge className={STATUS_COLORS[statusKey] ?? "bg-gray-100"}>
              {caseStatusLabel(legalCase.status)}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {caseTypeLabel(legalCase.caseType)} · Case #{legalCase.caseId.toString()}
          </p>
        </CardHeader>

        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground line-clamp-2">{legalCase.description}</p>

          {/* Escrow bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Wallet className="h-3 w-3" /> Escrow remaining
              </span>
              <span>◎ {lamportsToSOL(legalCase.escrowedLamports)} / {lamportsToSOL(legalCase.budgetLamports)}</span>
            </div>
            <Progress value={escrowPct} className="h-1.5" />
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              {legalCase.documentHashes.length} doc{legalCase.documentHashes.length !== 1 ? "s" : ""}
            </span>
            <span className={`flex items-center gap-1 ${isPastDeadline ? "text-red-500" : ""}`}>
              <Clock className="h-3 w-3" />
              Deadline: {deadlineDate.toLocaleDateString()}
              {isPastDeadline && " (overdue)"}
            </span>
            {paidSOL > 0 && (
              <span className="flex items-center gap-1 text-emerald-600">
                <CheckCircle2 className="h-3 w-3" />
                ◎ {paidSOL.toFixed(4)} paid
              </span>
            )}
          </div>

          {legalCase.assignedLawyer && (
            <p className="text-xs text-muted-foreground font-mono">
              Lawyer: {legalCase.assignedLawyer.toBase58().slice(0, 8)}…
            </p>
          )}
        </CardContent>

        {/* Actions */}
        {connected && statusKey === "inProgress" && (isClient || isLawyer) && (
          <CardFooter className="gap-2 flex-wrap pt-0">
            {isClient && (
              <>
                <Button size="sm" variant="outline" className="gap-1" onClick={() => setPayDialog(true)}>
                  <Wallet className="h-3 w-3" /> Release Payment
                </Button>
                <Button size="sm" variant="outline" className="gap-1 text-red-600 border-red-200 hover:bg-red-50" onClick={() => setDisputeDialog(true)}>
                  <AlertTriangle className="h-3 w-3" /> Raise Dispute
                </Button>
                <Button size="sm" variant="outline" className="gap-1" onClick={() => setCloseDialog(true)}>
                  <Ban className="h-3 w-3" /> Close Case
                </Button>
              </>
            )}
            {isLawyer && (
              <Button size="sm" variant="outline" className="gap-1 text-red-600 border-red-200 hover:bg-red-50" onClick={() => setDisputeDialog(true)}>
                <AlertTriangle className="h-3 w-3" /> Raise Dispute
              </Button>
            )}
          </CardFooter>
        )}
      </Card>

      {/* Release Payment Dialog */}
      <Dialog open={payDialog} onOpenChange={setPayDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Release Payment</DialogTitle>
            <DialogDescription>
              Pay your lawyer from escrow. A 2.5% platform fee will be deducted.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Amount (SOL) — max ◎ {lamportsToSOL(legalCase.escrowedLamports)} in escrow</Label>
            <Input type="number" step="0.01" min="0.01" max={escrowSOL} value={payAmount} onChange={e => setPayAmount(e.target.value)} />
            {payError && <p className="text-sm text-red-600">{payError}</p>}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPayDialog(false)}>Cancel</Button>
            <Button onClick={handleRelease} disabled={payLoading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {payLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Raise Dispute Dialog */}
      <Dialog open={disputeDialog} onOpenChange={setDisputeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Raise a Dispute</DialogTitle>
            <DialogDescription>
              The escrow will be frozen until the platform arbitrates.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Reason</Label>
            <Textarea placeholder="Describe the issue…" value={disputeReason} onChange={e => setDisputeReason(e.target.value)} rows={4} />
            {disputeError && <p className="text-sm text-red-600">{disputeError}</p>}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDisputeDialog(false)}>Cancel</Button>
            <Button onClick={handleDispute} disabled={disputeLoading} variant="destructive">
              {disputeLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Raise Dispute
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close Case Dialog */}
      <Dialog open={closeDialog} onOpenChange={setCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close Case</DialogTitle>
            <DialogDescription>
              Any remaining escrow will be refunded to you. This action is final.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Resolution Notes</Label>
            <Textarea placeholder="Summarize how the matter was resolved…" value={closeNotes} onChange={e => setCloseNotes(e.target.value)} rows={3} />
            {closeError && <p className="text-sm text-red-600">{closeError}</p>}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCloseDialog(false)}>Cancel</Button>
            <Button onClick={handleClose} disabled={closeLoading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {closeLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Close & Refund Escrow
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
