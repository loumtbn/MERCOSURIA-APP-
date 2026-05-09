/**
 * src/lib/mercosuria.ts
 *
 * Hand-authored TypeScript types + Anchor program client for the Mercosuria program.
 * This file is the single source of truth for all on-chain interaction in the frontend.
 *
 * After running `anchor build` the real IDL ends up at
 *   ../mercosuria-program/target/idl/mercosuria.json
 * and types at
 *   ../mercosuria-program/target/types/mercosuria.ts
 * You can swap this file for those generated outputs without changing any import paths
 * by updating the re-export at the bottom.
 */

import { Program, AnchorProvider, BN, web3 } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import type { Idl } from "@coral-xyz/anchor";
import IDL from "./mercosuria_idl.json";

// ─── Constants ───────────────────────────────────────────────────────────────

export const MERCOSURIA_PROGRAM_ID = new PublicKey(
  "MERCzKpGn4jqf9eFZSPVKMeS7WGmP4QhEGGdNLVwx1U"
);

export const MERCOSURIA_IDL = IDL as Idl;

// ─── Enum helpers (match Anchor's camelCase variant encoding) ────────────────

export const CaseTypeVariants = {
  contractDispute:      { contractDispute: {} },
  intellectualProperty: { intellectualProperty: {} },
  commercialLaw:        { commercialLaw: {} },
  laborLaw:             { laborLaw: {} },
  consumerProtection:   { consumerProtection: {} },
  regulatoryCompliance: { regulatoryCompliance: {} },
  arbitrationMercosur:  { arbitrationMercosur: {} },
  tradeLaw:             { tradeLaw: {} },
  other:                { other: {} },
} as const;

export type CaseTypeKey = keyof typeof CaseTypeVariants;

export const DocumentTypeVariants = {
  contract:         { contract: {} },
  evidence:         { evidence: {} },
  legalBrief:       { legalBrief: {} },
  courtOrder:       { courtOrder: {} },
  settlement:       { settlement: {} },
  invoiceReceipt:   { invoiceReceipt: {} },
  identityDocument: { identityDocument: {} },
  other:            { other: {} },
} as const;

export type DocumentTypeKey = keyof typeof DocumentTypeVariants;

export const CaseOutcomeVariants = {
  clientWon:        { clientWon: {} },
  clientLost:       { clientLost: {} },
  settledAmicably:  { settledAmicably: {} },
  dismissed:        { dismissed: {} },
} as const;

export type CaseOutcomeKey = keyof typeof CaseOutcomeVariants;

export const DisputeRulingVariants = {
  favorClient: { favorClient: {} },
  favorLawyer: { favorLawyer: {} },
  splitEvenly: { splitEvenly: {} },
} as const;

export type DisputeRulingKey = keyof typeof DisputeRulingVariants;

// ─── Account type interfaces ─────────────────────────────────────────────────

export interface PlatformState {
  authority: PublicKey;
  treasury: PublicKey;
  feeBps: BN;
  totalCases: BN;
  totalResolved: BN;
  bump: number;
}

export interface LawyerProfile {
  wallet: PublicKey;
  name: string;
  barNumber: string;
  jurisdiction: string;
  specialization: string;
  hourlyRateLamports: BN;
  reputationScore: BN;
  casesHandled: BN;
  casesWon: BN;
  totalEarnedLamports: BN;
  isActive: boolean;
  stakedLamports: BN;
  registeredAt: BN;
  bump: number;
}

export interface LegalCase {
  caseId: BN;
  client: PublicKey;
  assignedLawyer: PublicKey | null;
  title: string;
  description: string;
  caseType: Record<string, object>;
  status: Record<string, object>;
  budgetLamports: BN;
  escrowedLamports: BN;
  paidLamports: BN;
  deadlineTs: BN;
  openedAt: BN;
  closedAt: BN | null;
  documentHashes: string[];
  bump: number;
}

export interface CaseApplication {
  caseId: BN;
  lawyer: PublicKey;
  proposal: string;
  proposedFeeLamports: BN;
  appliedAt: BN;
  accepted: boolean;
  bump: number;
}

export interface DocumentRecord {
  caseId: BN;
  uploader: PublicKey;
  docHash: string;
  docTitle: string;
  docType: Record<string, object>;
  uploadedAt: BN;
  bump: number;
}

export interface LawyerReview {
  caseId: BN;
  reviewer: PublicKey;
  lawyer: PublicKey;
  rating: number;
  comment: string;
  createdAt: BN;
  bump: number;
}

export interface Dispute {
  caseId: BN;
  raisedBy: PublicKey;
  reason: string;
  arbitrator: PublicKey | null;
  resolved: boolean;
  raisedAt: BN;
  bump: number;
}

// ─── PDA derivation ───────────────────────────────────────────────────────────

export const pdas = {
  platform: (): [PublicKey, number] =>
    PublicKey.findProgramAddressSync(
      [Buffer.from("platform")],
      MERCOSURIA_PROGRAM_ID
    ),

  lawyer: (wallet: PublicKey): [PublicKey, number] =>
    PublicKey.findProgramAddressSync(
      [Buffer.from("lawyer"), wallet.toBuffer()],
      MERCOSURIA_PROGRAM_ID
    ),

  case: (client: PublicKey, caseId: BN): [PublicKey, number] =>
    PublicKey.findProgramAddressSync(
      [
        Buffer.from("case"),
        client.toBuffer(),
        caseId.toArrayLike(Buffer, "le", 8),
      ],
      MERCOSURIA_PROGRAM_ID
    ),

  caseEscrow: (client: PublicKey, caseId: BN): [PublicKey, number] =>
    PublicKey.findProgramAddressSync(
      [
        Buffer.from("case_escrow"),
        client.toBuffer(),
        caseId.toArrayLike(Buffer, "le", 8),
      ],
      MERCOSURIA_PROGRAM_ID
    ),

  application: (casePDA: PublicKey, lawyer: PublicKey): [PublicKey, number] =>
    PublicKey.findProgramAddressSync(
      [Buffer.from("application"), casePDA.toBuffer(), lawyer.toBuffer()],
      MERCOSURIA_PROGRAM_ID
    ),

  document: (casePDA: PublicKey, index: number): [PublicKey, number] =>
    PublicKey.findProgramAddressSync(
      [
        Buffer.from("document"),
        casePDA.toBuffer(),
        new BN(index).toArrayLike(Buffer, "le", 8),
      ],
      MERCOSURIA_PROGRAM_ID
    ),

  dispute: (casePDA: PublicKey): [PublicKey, number] =>
    PublicKey.findProgramAddressSync(
      [Buffer.from("dispute"), casePDA.toBuffer()],
      MERCOSURIA_PROGRAM_ID
    ),

  review: (casePDA: PublicKey): [PublicKey, number] =>
    PublicKey.findProgramAddressSync(
      [Buffer.from("review"), casePDA.toBuffer()],
      MERCOSURIA_PROGRAM_ID
    ),
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Hash a File using the Web Crypto API (SHA-256, hex string) */
export async function hashFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hash = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Convert BN lamports to a human-readable SOL string */
export function lamportsToSOL(lamports: BN | number): string {
  const n = typeof lamports === "number" ? lamports : lamports.toNumber();
  return (n / LAMPORTS_PER_SOL).toFixed(4);
}

/** Map a reputation score (0–1000) to a label */
export function reputationLabel(score: BN | number): string {
  const n = typeof score === "number" ? score : score.toNumber();
  if (n >= 900) return "⭐ Elite";
  if (n >= 750) return "🏅 Senior";
  if (n >= 600) return "✅ Verified";
  if (n >= 400) return "🔵 Junior";
  return "🔘 New";
}

/** Human-readable case status from Anchor enum object */
export function caseStatusLabel(status: Record<string, object>): string {
  if ("open" in status) return "Open";
  if ("inProgress" in status) return "In Progress";
  if ("disputed" in status) return "Disputed";
  if ("closed" in status) return "Closed";
  return "Unknown";
}

/** Human-readable case type from Anchor enum object */
export function caseTypeLabel(caseType: Record<string, object>): string {
  const map: Record<string, string> = {
    contractDispute:      "Contract Dispute",
    intellectualProperty: "Intellectual Property",
    commercialLaw:        "Commercial Law",
    laborLaw:             "Labor Law",
    consumerProtection:   "Consumer Protection",
    regulatoryCompliance: "Regulatory Compliance",
    arbitrationMercosur:  "MERCOSUR Arbitration",
    tradeLaw:             "Trade Law",
    other:                "Other",
  };
  const key = Object.keys(caseType)[0];
  return map[key] ?? key;
}

/** Build the Anchor program instance (call once per provider) */
export function getMercosuriaProgram(provider: AnchorProvider): Program {
  return new Program(MERCOSURIA_IDL, provider);
}
