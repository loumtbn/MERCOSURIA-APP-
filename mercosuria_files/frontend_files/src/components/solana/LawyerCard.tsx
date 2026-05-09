/**
 * src/components/solana/LawyerCard.tsx
 *
 * Displays an on-chain lawyer profile in the marketplace.
 * Includes an "Apply" button that lets a lawyer apply to an open case.
 */

import { useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { Star, Briefcase, MapPin, Clock, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

import { useMercosuria } from "@/hooks/useMercosuria";
import {
  type LawyerProfile,
  lamportsToSOL,
  reputationLabel,
} from "@/lib/program";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface LawyerCardProps {
  lawyerProfile: LawyerProfile;
  lawyerPubkey: PublicKey;
  /** If set, shows an "Apply to this case" button */
  applyToCasePDA?: PublicKey;
  /** Viewer's wallet key — hides apply button on own profile */
  viewerPublicKey?: string | null;
}

export function LawyerCard({
  lawyerProfile,
  lawyerPubkey,
  applyToCasePDA,
  viewerPublicKey,
}: LawyerCardProps) {
  const { applyToCase, connected } = useMercosuria();

  const reputation = lawyerProfile.reputationScore.toNumber();
  const winRate =
    lawyerProfile.casesHandled.toNumber() > 0
      ? Math.round(
          (lawyerProfile.casesWon.toNumber() /
            lawyerProfile.casesHandled.toNumber()) *
            100
        )
      : null;

  const isOwnProfile = viewerPublicKey === lawyerPubkey.toBase58();

  // ── Apply dialog ──────────────────────────────────────────────────────────
  const [applyOpen, setApplyOpen] = useState(false);
  const [proposal, setProposal] = useState("");
  const [feeSOL, setFeeSOL] = useState(
    lamportsToSOL(lawyerProfile.hourlyRateLamports)
  );
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [appliedTx, setAppliedTx] = useState<string | null>(null);

  const handleApply = async () => {
    if (!applyToCasePDA) return;
    if (!proposal.trim()) { setApplyError("Please write a proposal."); return; }
    setApplying(true);
    setApplyError(null);
    try {
      const tx = await applyToCase({
        casePDA: applyToCasePDA,
        proposal: proposal.trim(),
        proposedFeeSOL: parseFloat(feeSOL),
      });
      setAppliedTx(tx);
    } catch (e: any) {
      setApplyError(e?.message ?? "Application failed");
    } finally {
      setApplying(false);
    }
  };

  return (
    <>
      <Card className="w-full hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-base">{lawyerProfile.name}</h3>
              <p className="text-xs text-muted-foreground font-mono">
                {lawyerPubkey.toBase58().slice(0, 8)}…
              </p>
            </div>
            <Badge
              className={
                lawyerProfile.isActive
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-gray-100 text-gray-500"
              }
            >
              {lawyerProfile.isActive ? "Available" : "Unavailable"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {lawyerProfile.jurisdiction}
            </span>
            <span className="flex items-center gap-1">
              <Briefcase className="h-3.5 w-3.5" />
              {lawyerProfile.specialization}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              ◎ {lamportsToSOL(lawyerProfile.hourlyRateLamports)}/hr
            </span>
          </div>

          {/* Reputation bar */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Star className="h-3 w-3 text-amber-500" />
                Reputation
              </span>
              <span className="text-xs font-medium">{reputationLabel(reputation)} ({reputation}/1000)</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${Math.min(100, (reputation / 1000) * 100)}%` }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span><strong className="text-foreground">{lawyerProfile.casesHandled.toString()}</strong> cases</span>
            {winRate !== null && (
              <span><strong className="text-foreground">{winRate}%</strong> win rate</span>
            )}
            <span>
              ◎ <strong className="text-foreground">{lamportsToSOL(lawyerProfile.totalEarnedLamports)}</strong> earned
            </span>
          </div>

          <p className="text-xs text-muted-foreground font-mono">
            Bar: {lawyerProfile.barNumber}
          </p>
        </CardContent>

        {applyToCasePDA && connected && !isOwnProfile && (
          <CardFooter className="pt-0">
            <Button
              size="sm"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => setApplyOpen(true)}
            >
              Apply to This Case
            </Button>
          </CardFooter>
        )}
      </Card>

      {/* Apply dialog */}
      <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply to Case</DialogTitle>
            <DialogDescription>
              Write your proposal and set your fee. The client will review your application.
            </DialogDescription>
          </DialogHeader>
          {appliedTx ? (
            <Alert className="border-emerald-600 bg-emerald-50">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <AlertDescription className="text-emerald-800">
                Application submitted!{" "}
                <a
                  href={`https://explorer.solana.com/tx/${appliedTx}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  View on Explorer
                </a>
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Your Proposal</Label>
                <Textarea
                  placeholder="Describe your experience and approach to this case…"
                  value={proposal}
                  onChange={(e) => setProposal(e.target.value)}
                  rows={4}
                  maxLength={512}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Proposed Fee (SOL)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={feeSOL}
                  onChange={(e) => setFeeSOL(e.target.value)}
                />
              </div>
              {applyError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{applyError}</AlertDescription>
                </Alert>
              )}
            </div>
          )}
          <DialogFooter>
            {!appliedTx && (
              <>
                <Button variant="ghost" onClick={() => setApplyOpen(false)}>Cancel</Button>
                <Button
                  onClick={handleApply}
                  disabled={applying}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {applying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Submit Application
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
