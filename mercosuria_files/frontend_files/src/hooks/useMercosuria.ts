/**
 * src/hooks/useMercosuria.ts
 *
 * One hook that exposes every Mercosuria on-chain operation.
 * Requires <ProgramProvider> in the tree.
 *
 * ── Example ─────────────────────────────────────────────────────────────────
 *   const {
 *     openCase, fetchClientCases, registerLawyer, releasePayment
 *   } = useMercosuria();
 */

import { useCallback } from "react";
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";

import { useProgramContext } from "@/context/ProgramContext";
import {
  pdas,
  TREASURY_PUBKEY,
  type CaseType,
  type CaseOutcome,
  type DocumentType,
  type LawyerProfile,
  type LegalCase,
  type CaseApplication,
  type DocumentRecord,
  type PlatformState,
  type Dispute,
  type LawyerReview,
  hashFile as hashFileUtil,
} from "@/lib/program";

// ─── Param types ─────────────────────────────────────────────────────────────

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
  proposal: string;
  proposedFeeSOL: number;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useMercosuria() {
  const { program, publicKey, connected } = useProgramContext();

  /** Throw a helpful error if wallet disconnected */
  function requireConnected() {
    if (!program || !publicKey) {
      throw new Error("Wallet not connected — please connect your wallet first.");
    }
    return { program, wallet: new PublicKey(publicKey) };
  }

  // ── Platform ───────────────────────────────────────────────────────────────

  const fetchPlatform = useCallback(async (): Promise<PlatformState | null> => {
    if (!program) return null;
    const [platformPDA] = pdas.platform();
    try {
      return (await program.account.platformState.fetch(platformPDA)) as PlatformState;
    } catch {
      return null;
    }
  }, [program]);

  // ── Lawyers ────────────────────────────────────────────────────────────────

  const registerLawyer = useCallback(
    async (params: RegisterLawyerParams): Promise<string> => {
      const { program, wallet } = requireConnected();
      const [lawyerPDA] = pdas.lawyer(wallet);

      return program.methods
        .registerLawyer(
          params.name,
          params.barNumber,
          params.jurisdiction,
          params.specialization,
          new BN(Math.floor(params.hourlyRateSOL * LAMPORTS_PER_SOL))
        )
        .accounts({
          lawyerProfile: lawyerPDA,
          lawyerVault: wallet,   // stake validation: checks wallet balance >= 1 SOL
          lawyer: wallet,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
    },
    [program, publicKey]
  );

  const updateLawyerProfile = useCallback(
    async (hourlyRateSOL?: number, isActive?: boolean): Promise<string> => {
      const { program, wallet } = requireConnected();
      const [lawyerPDA] = pdas.lawyer(wallet);

      return program.methods
        .updateLawyerProfile(
          hourlyRateSOL != null
            ? new BN(Math.floor(hourlyRateSOL * LAMPORTS_PER_SOL))
            : null,
          isActive ?? null
        )
        .accounts({
          lawyerProfile: lawyerPDA,
          lawyer: wallet,
        })
        .rpc();
    },
    [program, publicKey]
  );

  const fetchLawyer = useCallback(
    async (lawyerPubkey: PublicKey): Promise<LawyerProfile | null> => {
      if (!program) return null;
      const [lawyerPDA] = pdas.lawyer(lawyerPubkey);
      try {
        return (await program.account.lawyerProfile.fetch(lawyerPDA)) as LawyerProfile;
      } catch {
        return null;
      }
    },
    [program]
  );

  const fetchMyLawyerProfile = useCallback(async (): Promise<LawyerProfile | null> => {
    if (!publicKey || !program) return null;
    return fetchLawyer(new PublicKey(publicKey));
  }, [program, publicKey, fetchLawyer]);

  const fetchAllLawyers = useCallback(async (): Promise<
    Array<{ publicKey: PublicKey; account: LawyerProfile }>
  > => {
    if (!program) return [];
    const accounts = await program.account.lawyerProfile.all();
    return accounts as Array<{ publicKey: PublicKey; account: LawyerProfile }>;
  }, [program]);

  const fetchActiveLawyers = useCallback(async (): Promise<
    Array<{ publicKey: PublicKey; account: LawyerProfile }>
  > => {
    const all = await fetchAllLawyers();
    return all.filter((a) => a.account.isActive);
  }, [fetchAllLawyers]);

  // ── Cases ──────────────────────────────────────────────────────────────────

  const openCase = useCallback(
    async (
      params: OpenCaseParams
    ): Promise<{ tx: string; casePDA: PublicKey; caseId: BN }> => {
      const { program, wallet } = requireConnected();

      const platform = await fetchPlatform();
      const caseId: BN = platform?.totalCases ?? new BN(0);

      const [casePDA] = pdas.legalCase(wallet, caseId);
      const [caseEscrowPDA] = pdas.caseEscrow(wallet, caseId);
      const [platformPDA] = pdas.platform();

      const tx = await program.methods
        .openCase(
          params.title,
          params.description,
          { [params.caseType]: {} },
          new BN(Math.floor(params.budgetSOL * LAMPORTS_PER_SOL)),
          new BN(Math.floor(params.deadlineDate.getTime() / 1000))
        )
        .accounts({
          platform: platformPDA,
          legalCase: casePDA,
          caseEscrow: caseEscrowPDA,
          client: wallet,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return { tx, casePDA, caseId };
    },
    [program, publicKey, fetchPlatform]
  );

  const fetchCase = useCallback(
    async (casePDA: PublicKey): Promise<LegalCase | null> => {
      if (!program) return null;
      try {
        return (await program.account.legalCase.fetch(casePDA)) as LegalCase;
      } catch {
        return null;
      }
    },
    [program]
  );

  const fetchClientCases = useCallback(
    async (
      clientPubkey?: PublicKey
    ): Promise<Array<{ publicKey: PublicKey; account: LegalCase }>> => {
      if (!program) return [];
      const key = clientPubkey ?? (publicKey ? new PublicKey(publicKey) : null);
      if (!key) return [];

      const allCases = await program.account.legalCase.all();
      return (allCases as Array<{ publicKey: PublicKey; account: LegalCase }>).filter(
        (c) => c.account.client.toBase58() === key.toBase58()
      );
    },
    [program, publicKey]
  );

  const fetchAllOpenCases = useCallback(async (): Promise<
    Array<{ publicKey: PublicKey; account: LegalCase }>
  > => {
    if (!program) return [];
    const all = await program.account.legalCase.all();
    return (all as Array<{ publicKey: PublicKey; account: LegalCase }>).filter(
      (c) => "open" in c.account.status
    );
  }, [program]);

  const applyToCase = useCallback(
    async (params: ApplyToCaseParams): Promise<string> => {
      const { program, wallet } = requireConnected();
      const [lawyerPDA] = pdas.lawyer(wallet);
      const [applicationPDA] = pdas.application(params.casePDA, wallet);

      return program.methods
        .applyToCase(
          params.proposal,
          new BN(Math.floor(params.proposedFeeSOL * LAMPORTS_PER_SOL))
        )
        .accounts({
          legalCase: params.casePDA,
          caseApplication: applicationPDA,
          lawyerProfile: lawyerPDA,
          lawyer: wallet,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
    },
    [program, publicKey]
  );

  const fetchApplications = useCallback(
    async (
      casePDA: PublicKey
    ): Promise<Array<{ publicKey: PublicKey; account: CaseApplication }>> => {
      if (!program) return [];
      const all = await program.account.caseApplication.all();
      return (all as Array<{ publicKey: PublicKey; account: CaseApplication }>).filter(
        (a) => {
          // applications are seeded with case + lawyer; filter by matching case
          // We can also check caseId field if available
          return true; // fetch all and filter client-side by caseId
        }
      );
    },
    [program]
  );

  const acceptLawyer = useCallback(
    async (casePDA: PublicKey, lawyerPubkey: PublicKey): Promise<string> => {
      const { program, wallet } = requireConnected();
      const [applicationPDA] = pdas.application(casePDA, lawyerPubkey);

      return program.methods
        .acceptLawyer()
        .accounts({
          legalCase: casePDA,
          caseApplication: applicationPDA,
          lawyer: lawyerPubkey,
          client: wallet,
        })
        .rpc();
    },
    [program, publicKey]
  );

  // ── Documents ──────────────────────────────────────────────────────────────

  const attachDocument = useCallback(
    async (
      casePDA: PublicKey,
      docHash: string,
      docTitle: string,
      docType: DocumentType
    ): Promise<string> => {
      const { program, wallet } = requireConnected();
      const caseAccount = await fetchCase(casePDA);
      if (!caseAccount) throw new Error("Case not found");

      const docIndex = caseAccount.documentHashes.length;
      const [docPDA] = pdas.document(casePDA, docIndex);

      return program.methods
        .attachDocument(docHash, docTitle, { [docType]: {} })
        .accounts({
          legalCase: casePDA,
          documentRecord: docPDA,
          signer: wallet,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
    },
    [program, publicKey, fetchCase]
  );

  // ── Payments ───────────────────────────────────────────────────────────────

  const releasePayment = useCallback(
    async (
      clientPubkey: PublicKey,
      caseId: BN,
      lawyerPubkey: PublicKey,
      amountSOL: number
    ): Promise<string> => {
      const { program, wallet } = requireConnected();
      const [platformPDA] = pdas.platform();
      const [casePDA] = pdas.legalCase(clientPubkey, caseId);
      const [caseEscrowPDA] = pdas.caseEscrow(clientPubkey, caseId);
      const [lawyerPDA] = pdas.lawyer(lawyerPubkey);

      return program.methods
        .releasePayment(new BN(Math.floor(amountSOL * LAMPORTS_PER_SOL)))
        .accounts({
          platform: platformPDA,
          legalCase: casePDA,
          caseEscrow: caseEscrowPDA,
          lawyerProfile: lawyerPDA,
          lawyerWallet: lawyerPubkey,
          treasury: TREASURY_PUBKEY,
          client: wallet,
        })
        .rpc();
    },
    [program, publicKey]
  );

  const closeCase = useCallback(
    async (
      caseId: BN,
      lawyerPubkey: PublicKey,
      outcome: CaseOutcome,
      resolutionNotes: string
    ): Promise<string> => {
      const { program, wallet } = requireConnected();
      const [platformPDA] = pdas.platform();
      const [casePDA] = pdas.legalCase(wallet, caseId);
      const [caseEscrowPDA] = pdas.caseEscrow(wallet, caseId);
      const [lawyerPDA] = pdas.lawyer(lawyerPubkey);

      return program.methods
        .closeCase({ [outcome]: {} }, resolutionNotes)
        .accounts({
          platform: platformPDA,
          legalCase: casePDA,
          caseEscrow: caseEscrowPDA,
          lawyerProfile: lawyerPDA,
          client: wallet,
        })
        .rpc();
    },
    [program, publicKey]
  );

  const submitReview = useCallback(
    async (
      caseId: BN,
      lawyerPubkey: PublicKey,
      rating: 1 | 2 | 3 | 4 | 5,
      comment: string
    ): Promise<string> => {
      const { program, wallet } = requireConnected();
      const [casePDA] = pdas.legalCase(wallet, caseId);
      const [reviewPDA] = pdas.review(casePDA);
      const [lawyerPDA] = pdas.lawyer(lawyerPubkey);

      return program.methods
        .submitReview(rating, comment)
        .accounts({
          legalCase: casePDA,
          lawyerReview: reviewPDA,
          lawyerProfile: lawyerPDA,
          lawyer: lawyerPubkey,
          client: wallet,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
    },
    [program, publicKey]
  );

  // ── Disputes ───────────────────────────────────────────────────────────────

  const raiseDispute = useCallback(
    async (casePDA: PublicKey, reason: string): Promise<string> => {
      const { program, wallet } = requireConnected();
      const [disputePDA] = pdas.dispute(casePDA);

      return program.methods
        .raiseDispute(reason)
        .accounts({
          legalCase: casePDA,
          dispute: disputePDA,
          signer: wallet,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
    },
    [program, publicKey]
  );

  const fetchDispute = useCallback(
    async (casePDA: PublicKey): Promise<Dispute | null> => {
      if (!program) return null;
      const [disputePDA] = pdas.dispute(casePDA);
      try {
        return (await program.account.dispute.fetch(disputePDA)) as Dispute;
      } catch {
        return null;
      }
    },
    [program]
  );

  // ── Utils ──────────────────────────────────────────────────────────────────

  const hashFile = useCallback(hashFileUtil, []);

  return {
    // State
    connected,
    publicKey,

    // Platform
    fetchPlatform,

    // Lawyers
    registerLawyer,
    updateLawyerProfile,
    fetchLawyer,
    fetchMyLawyerProfile,
    fetchAllLawyers,
    fetchActiveLawyers,

    // Cases
    openCase,
    fetchCase,
    fetchClientCases,
    fetchAllOpenCases,
    applyToCase,
    fetchApplications,
    acceptLawyer,

    // Documents
    attachDocument,
    hashFile,

    // Payments & Closure
    releasePayment,
    closeCase,
    submitReview,

    // Disputes
    raiseDispute,
    fetchDispute,

    // PDA helpers (for direct use)
    pdas,
  };
}
