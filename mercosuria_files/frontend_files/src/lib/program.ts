import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";

// ─── Program ID ───────────────────────────────────────────────────────────────
// Replace with your deployed program ID after `anchor deploy`
export const PROGRAM_ID = new PublicKey(
  "MERCzKpGn4jqf9eFZSPVKMeS7WGmP4QhEGGdNLVwx1U"
);

// Treasury wallet that collects the 2.5% platform fee
// Replace with the actual admin treasury key
export const TREASURY_PUBKEY = new PublicKey(
  "11111111111111111111111111111111" // placeholder — set your treasury address
);

export const PLATFORM_FEE_BPS = 250; // 2.5%

// ─── PDA Derivation ───────────────────────────────────────────────────────────

export const pdas = {
  platform: (): [PublicKey, number] =>
    PublicKey.findProgramAddressSync([Buffer.from("platform")], PROGRAM_ID),

  lawyer: (wallet: PublicKey): [PublicKey, number] =>
    PublicKey.findProgramAddressSync(
      [Buffer.from("lawyer"), wallet.toBuffer()],
      PROGRAM_ID
    ),

  legalCase: (client: PublicKey, caseId: BN): [PublicKey, number] =>
    PublicKey.findProgramAddressSync(
      [
        Buffer.from("case"),
        client.toBuffer(),
        caseId.toArrayLike(Buffer, "le", 8),
      ],
      PROGRAM_ID
    ),

  caseEscrow: (client: PublicKey, caseId: BN): [PublicKey, number] =>
    PublicKey.findProgramAddressSync(
      [
        Buffer.from("case_escrow"),
        client.toBuffer(),
        caseId.toArrayLike(Buffer, "le", 8),
      ],
      PROGRAM_ID
    ),

  application: (casePDA: PublicKey, lawyer: PublicKey): [PublicKey, number] =>
    PublicKey.findProgramAddressSync(
      [Buffer.from("application"), casePDA.toBuffer(), lawyer.toBuffer()],
      PROGRAM_ID
    ),

  document: (casePDA: PublicKey, index: number): [PublicKey, number] =>
    PublicKey.findProgramAddressSync(
      [
        Buffer.from("document"),
        casePDA.toBuffer(),
        new BN(index).toArrayLike(Buffer, "le", 8),
      ],
      PROGRAM_ID
    ),

  dispute: (casePDA: PublicKey): [PublicKey, number] =>
    PublicKey.findProgramAddressSync(
      [Buffer.from("dispute"), casePDA.toBuffer()],
      PROGRAM_ID
    ),

  review: (casePDA: PublicKey): [PublicKey, number] =>
    PublicKey.findProgramAddressSync(
      [Buffer.from("review"), casePDA.toBuffer()],
      PROGRAM_ID
    ),
};

// ─── Type Helpers ─────────────────────────────────────────────────────────────

export type CaseType =
  | "contractDispute"
  | "intellectualProperty"
  | "commercialLaw"
  | "laborLaw"
  | "consumerProtection"
  | "regulatoryCompliance"
  | "arbitrationMercosur"
  | "tradeLaw"
  | "other";

export type CaseStatus = "open" | "inProgress" | "disputed" | "closed";

export type CaseOutcome =
  | "clientWon"
  | "clientLost"
  | "settledAmicably"
  | "dismissed";

export type DocumentType =
  | "contract"
  | "evidence"
  | "legalBrief"
  | "courtOrder"
  | "settlement"
  | "invoiceReceipt"
  | "identityDocument"
  | "other";

export type DisputeRuling = "favorClient" | "favorLawyer" | "splitEvenly";

// Parsed account shapes (returned from program.account.*.fetch)
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

// ─── Display Helpers ─────────────────────────────────────────────────────────

export const LAMPORTS_PER_SOL = 1_000_000_000;

export const reputationLabel = (score: number): string => {
  if (score >= 900) return "⭐ Elite";
  if (score >= 750) return "🏅 Senior";
  if (score >= 600) return "✅ Verified";
  if (score >= 400) return "🔵 Junior";
  return "🔘 New";
};

export const lamportsToSOL = (lamports: BN | number): string => {
  const n = typeof lamports === "number" ? lamports : lamports.toNumber();
  return (n / LAMPORTS_PER_SOL).toFixed(4);
};

export const caseStatusLabel = (status: Record<string, object>): string => {
  if ("open" in status) return "Open";
  if ("inProgress" in status) return "In Progress";
  if ("disputed" in status) return "Disputed";
  if ("closed" in status) return "Closed";
  return "Unknown";
};

export const caseTypeLabel = (ct: Record<string, object>): string => {
  if ("contractDispute" in ct) return "Contract Dispute";
  if ("intellectualProperty" in ct) return "Intellectual Property";
  if ("commercialLaw" in ct) return "Commercial Law";
  if ("laborLaw" in ct) return "Labor Law";
  if ("consumerProtection" in ct) return "Consumer Protection";
  if ("regulatoryCompliance" in ct) return "Regulatory Compliance";
  if ("arbitrationMercosur" in ct) return "MERCOSUR Arbitration";
  if ("tradeLaw" in ct) return "Trade Law";
  return "Other";
};

/** SHA-256 a File in the browser, returns hex string */
export async function hashFile(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
