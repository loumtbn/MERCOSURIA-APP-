/**
 * Mercosuria Solana Program SDK
 * Drop-in helpers for the React/Vite frontend (uses @coral-xyz/anchor + @solana/web3.js)
 *
 * Usage:
 *   import { useMercosuria } from "./sdk/mercosuria";
 *   const { openCase, registerLawyer, releasePayment } = useMercosuria();
 */

import {
  Program,
  AnchorProvider,
  BN,
  setProvider,
  workspace,
  web3,
} from "@coral-xyz/anchor";
import {
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
  Connection,
} from "@solana/web3.js";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { useCallback, useMemo } from "react";

// Import the generated IDL and type (produced by `anchor build`)
// import { Mercosuria } from "../target/types/mercosuria";
// import idl from "../target/idl/mercosuria.json";

export const PROGRAM_ID = new PublicKey(
  "MERCzKpGn4jqf9eFZSPVKMeS7WGmP4QhEGGdNLVwx1U"
);

// ─── PDA Derivation ──────────────────────────────────────────────────────────

export const pdas = {
  platform: () =>
    PublicKey.findProgramAddressSync([Buffer.from("platform")], PROGRAM_ID),

  lawyer: (wallet: PublicKey) =>
    PublicKey.findProgramAddressSync(
      [Buffer.from("lawyer"), wallet.toBuffer()],
      PROGRAM_ID
    ),

  case: (client: PublicKey, caseId: BN) =>
    PublicKey.findProgramAddressSync(
      [
        Buffer.from("case"),
        client.toBuffer(),
        caseId.toArrayLike(Buffer, "le", 8),
      ],
      PROGRAM_ID
    ),

  caseEscrow: (client: PublicKey, caseId: BN) =>
    PublicKey.findProgramAddressSync(
      [
        Buffer.from("case_escrow"),
        client.toBuffer(),
        caseId.toArrayLike(Buffer, "le", 8),
      ],
      PROGRAM_ID
    ),

  application: (casePDA: PublicKey, lawyer: PublicKey) =>
    PublicKey.findProgramAddressSync(
      [Buffer.from("application"), casePDA.toBuffer(), lawyer.toBuffer()],
      PROGRAM_ID
    ),

  document: (casePDA: PublicKey, index: number) =>
    PublicKey.findProgramAddressSync(
      [
        Buffer.from("document"),
        casePDA.toBuffer(),
        new BN(index).toArrayLike(Buffer, "le", 8),
      ],
      PROGRAM_ID
    ),

  dispute: (casePDA: PublicKey) =>
    PublicKey.findProgramAddressSync(
      [Buffer.from("dispute"), casePDA.toBuffer()],
      PROGRAM_ID
    ),

  review: (casePDA: PublicKey) =>
    PublicKey.findProgramAddressSync(
      [Buffer.from("review"), casePDA.toBuffer()],
      PROGRAM_ID
    ),
};

// ─── Type Definitions ─────────────────────────────────────────────────────────

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

export type DocumentType =
  | "contract"
  | "evidence"
  | "legalBrief"
  | "courtOrder"
  | "settlement"
  | "invoiceReceipt"
  | "identityDocument"
  | "other";

export type CaseOutcome =
  | "clientWon"
  | "clientLost"
  | "settledAmicably"
  | "dismissed";

export type DisputeRuling = "favorClient" | "favorLawyer" | "splitEvenly";

export interface OpenCaseParams {
  title: string;
  description: string;
  caseType: CaseType;
  budgetSOL: number;
  deadlineDate: Date;
}

export interface RegisterLawyerParams {
  name: string;
  barNumber: string;
  jurisdiction: string;
  specialization: string;
  hourlyRateSOL: number;
}

export interface ApplyToCaseParams {
  casePDA: PublicKey;
  caseId: BN;
  clientPubkey: PublicKey;
  proposal: string;
  proposedFeeSOL: number;
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
}

export interface LegalCaseAccount {
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
}

// ─── Main Hook ────────────────────────────────────────────────────────────────

/**
 * useMercosuria — React hook providing all program interactions
 * Requires WalletAdapterProvider + ConnectionProvider in the tree
 */
export function useMercosuria(program: Program<any>) {
  const wallet = useAnchorWallet();
  const { connection } = useConnection();

  const provider = useMemo(() => {
    if (!wallet) return null;
    return new AnchorProvider(connection, wallet, {
      commitment: "confirmed",
    });
  }, [connection, wallet]);

  // ── Platform ──────────────────────────────────────────────────────────────

  const fetchPlatform = useCallback(async () => {
    const [platformPDA] = pdas.platform();
    return program.account.platformState.fetch(platformPDA);
  }, [program]);

  // ── Lawyers ───────────────────────────────────────────────────────────────

  const registerLawyer = useCallback(
    async (params: RegisterLawyerParams): Promise<string> => {
      if (!wallet) throw new Error("Wallet not connected");
      const [lawyerPDA] = pdas.lawyer(wallet.publicKey);

      const tx = await program.methods
        .registerLawyer(
          params.name,
          params.barNumber,
          params.jurisdiction,
          params.specialization,
          new BN(params.hourlyRateSOL * LAMPORTS_PER_SOL)
        )
        .accounts({
          lawyerProfile: lawyerPDA,
          lawyerVault: wallet.publicKey,
          lawyer: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return tx;
    },
    [program, wallet]
  );

  const fetchLawyer = useCallback(
    async (lawyerPubkey: PublicKey): Promise<LawyerProfile | null> => {
      try {
        const [lawyerPDA] = pdas.lawyer(lawyerPubkey);
        return program.account.lawyerProfile.fetch(lawyerPDA);
      } catch {
        return null;
      }
    },
    [program]
  );

  const fetchAllLawyers = useCallback(async (): Promise<LawyerProfile[]> => {
    const accounts = await program.account.lawyerProfile.all([
      { memcmp: { offset: 73, bytes: "1" } }, // filter isActive = true
    ]);
    return accounts.map((a) => a.account as LawyerProfile);
  }, [program]);

  // ── Cases ─────────────────────────────────────────────────────────────────

  const openCase = useCallback(
    async (params: OpenCaseParams): Promise<{ tx: string; casePDA: PublicKey }> => {
      if (!wallet) throw new Error("Wallet not connected");

      const platform = await fetchPlatform();
      const caseId: BN = platform.totalCases;
      const [casePDA] = pdas.case(wallet.publicKey, caseId);
      const [caseEscrowPDA] = pdas.caseEscrow(wallet.publicKey, caseId);
      const [platformPDA] = pdas.platform();

      const deadlineTs = new BN(Math.floor(params.deadlineDate.getTime() / 1000));
      const budget = new BN(params.budgetSOL * LAMPORTS_PER_SOL);
      const caseTypeArg = { [params.caseType]: {} };

      const tx = await program.methods
        .openCase(
          params.title,
          params.description,
          caseTypeArg,
          budget,
          deadlineTs
        )
        .accounts({
          platform: platformPDA,
          legalCase: casePDA,
          caseEscrow: caseEscrowPDA,
          client: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return { tx, casePDA };
    },
    [program, wallet, fetchPlatform]
  );

  const applyToCase = useCallback(
    async (params: ApplyToCaseParams): Promise<string> => {
      if (!wallet) throw new Error("Wallet not connected");
      const [lawyerPDA] = pdas.lawyer(wallet.publicKey);
      const [applicationPDA] = pdas.application(params.casePDA, wallet.publicKey);

      return program.methods
        .applyToCase(
          params.proposal,
          new BN(params.proposedFeeSOL * LAMPORTS_PER_SOL)
        )
        .accounts({
          legalCase: params.casePDA,
          caseApplication: applicationPDA,
          lawyerProfile: lawyerPDA,
          lawyer: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
    },
    [program, wallet]
  );

  const acceptLawyer = useCallback(
    async (
      casePDA: PublicKey,
      lawyerPubkey: PublicKey
    ): Promise<string> => {
      if (!wallet) throw new Error("Wallet not connected");
      const [applicationPDA] = pdas.application(casePDA, lawyerPubkey);

      return program.methods
        .acceptLawyer()
        .accounts({
          legalCase: casePDA,
          caseApplication: applicationPDA,
          lawyer: lawyerPubkey,
          client: wallet.publicKey,
        })
        .rpc();
    },
    [program, wallet]
  );

  const fetchCase = useCallback(
    async (casePDA: PublicKey): Promise<LegalCaseAccount | null> => {
      try {
        return program.account.legalCase.fetch(casePDA);
      } catch {
        return null;
      }
    },
    [program]
  );

  const fetchClientCases = useCallback(
    async (clientPubkey: PublicKey): Promise<LegalCaseAccount[]> => {
      const accounts = await program.account.legalCase.all([
        {
          memcmp: {
            offset: 8, // after discriminator
            bytes: clientPubkey.toBase58(),
          },
        },
      ]);
      return accounts.map((a) => a.account as LegalCaseAccount);
    },
    [program]
  );

  // ── Documents ─────────────────────────────────────────────────────────────

  const attachDocument = useCallback(
    async (
      casePDA: PublicKey,
      docHash: string,
      docTitle: string,
      docType: DocumentType
    ): Promise<string> => {
      if (!wallet) throw new Error("Wallet not connected");

      const legalCase = await fetchCase(casePDA);
      if (!legalCase) throw new Error("Case not found");

      const docIndex = legalCase.documentHashes.length;
      const [docPDA] = pdas.document(casePDA, docIndex);

      return program.methods
        .attachDocument(docHash, docTitle, { [docType]: {} })
        .accounts({
          legalCase: casePDA,
          documentRecord: docPDA,
          signer: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
    },
    [program, wallet, fetchCase]
  );

  // ── Payments ──────────────────────────────────────────────────────────────

  const releasePayment = useCallback(
    async (
      caseId: BN,
      clientPubkey: PublicKey,
      lawyerPubkey: PublicKey,
      amountSOL: number,
      treasuryPubkey: PublicKey
    ): Promise<string> => {
      if (!wallet) throw new Error("Wallet not connected");
      const [platformPDA] = pdas.platform();
      const [casePDA] = pdas.case(clientPubkey, caseId);
      const [caseEscrowPDA] = pdas.caseEscrow(clientPubkey, caseId);
      const [lawyerPDA] = pdas.lawyer(lawyerPubkey);

      return program.methods
        .releasePayment(new BN(amountSOL * LAMPORTS_PER_SOL))
        .accounts({
          platform: platformPDA,
          legalCase: casePDA,
          caseEscrow: caseEscrowPDA,
          lawyerProfile: lawyerPDA,
          lawyerWallet: lawyerPubkey,
          treasury: treasuryPubkey,
          client: wallet.publicKey,
        })
        .rpc();
    },
    [program, wallet]
  );

  // ── Close & Review ────────────────────────────────────────────────────────

  const closeCase = useCallback(
    async (
      caseId: BN,
      outcome: CaseOutcome,
      resolutionNotes: string,
      lawyerPubkey: PublicKey
    ): Promise<string> => {
      if (!wallet) throw new Error("Wallet not connected");
      const [platformPDA] = pdas.platform();
      const [casePDA] = pdas.case(wallet.publicKey, caseId);
      const [caseEscrowPDA] = pdas.caseEscrow(wallet.publicKey, caseId);
      const [lawyerPDA] = pdas.lawyer(lawyerPubkey);

      return program.methods
        .closeCase({ [outcome]: {} }, resolutionNotes)
        .accounts({
          platform: platformPDA,
          legalCase: casePDA,
          caseEscrow: caseEscrowPDA,
          lawyerProfile: lawyerPDA,
          client: wallet.publicKey,
        })
        .rpc();
    },
    [program, wallet]
  );

  const submitReview = useCallback(
    async (
      caseId: BN,
      lawyerPubkey: PublicKey,
      rating: 1 | 2 | 3 | 4 | 5,
      comment: string
    ): Promise<string> => {
      if (!wallet) throw new Error("Wallet not connected");
      const [casePDA] = pdas.case(wallet.publicKey, caseId);
      const [reviewPDA] = pdas.review(casePDA);
      const [lawyerPDA] = pdas.lawyer(lawyerPubkey);

      return program.methods
        .submitReview(rating, comment)
        .accounts({
          legalCase: casePDA,
          lawyerReview: reviewPDA,
          lawyerProfile: lawyerPDA,
          lawyer: lawyerPubkey,
          client: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
    },
    [program, wallet]
  );

  // ── Disputes ──────────────────────────────────────────────────────────────

  const raiseDispute = useCallback(
    async (casePDA: PublicKey, reason: string): Promise<string> => {
      if (!wallet) throw new Error("Wallet not connected");
      const [disputePDA] = pdas.dispute(casePDA);

      return program.methods
        .raiseDispute(reason)
        .accounts({
          legalCase: casePDA,
          dispute: disputePDA,
          signer: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
    },
    [program, wallet]
  );

  // ── Utility ───────────────────────────────────────────────────────────────

  /** Compute SHA-256 hash of a File in browser */
  const hashFile = useCallback(async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }, []);

  /** Format reputation score as a human-readable label */
  const reputationLabel = (score: number): string => {
    if (score >= 900) return "⭐ Elite";
    if (score >= 750) return "🏅 Senior";
    if (score >= 600) return "✅ Verified";
    if (score >= 400) return "🔵 Junior";
    return "🔘 New";
  };

  /** Convert lamports to display SOL string */
  const lamportsToSOL = (lamports: BN): string =>
    (lamports.toNumber() / LAMPORTS_PER_SOL).toFixed(4);

  return {
    // Platform
    fetchPlatform,
    // Lawyers
    registerLawyer,
    fetchLawyer,
    fetchAllLawyers,
    // Cases
    openCase,
    applyToCase,
    acceptLawyer,
    fetchCase,
    fetchClientCases,
    // Documents
    attachDocument,
    hashFile,
    // Payments
    releasePayment,
    closeCase,
    submitReview,
    // Disputes
    raiseDispute,
    // Utils
    reputationLabel,
    lamportsToSOL,
    pdas,
    PROGRAM_ID,
  };
}
