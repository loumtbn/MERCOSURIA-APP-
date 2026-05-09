/**
 * src/context/SolanaProvider.tsx
 *
 * Wraps the entire app with:
 *  1. Solana ConnectionProvider  (RPC endpoint)
 *  2. WalletProvider             (phantom, solflare, backpack…)
 *  3. WalletModalProvider        (shadcn-compatible connect button)
 *  4. MercosuriaProvider         (Anchor program + all hooks)
 *
 * Drop this file into your existing src/context/ folder and wrap <App /> with
 * <SolanaProvider> in main.tsx (see the patched main.tsx file for the exact diff).
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import {
  ConnectionProvider,
  WalletProvider,
  useAnchorWallet,
  useConnection,
  useWallet,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  BackpackWalletAdapter,
  LedgerWalletAdapter,
  TorusWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { AnchorProvider, BN, Program } from "@coral-xyz/anchor";
import { PublicKey, LAMPORTS_PER_SOL, SystemProgram } from "@solana/web3.js";

import {
  MERCOSURIA_PROGRAM_ID,
  MERCOSURIA_IDL,
  getMercosuriaProgram,
  pdas,
  hashFile as hashFileFn,
  lamportsToSOL,
  reputationLabel,
  caseStatusLabel,
  caseTypeLabel,
  CaseTypeVariants,
  DocumentTypeVariants,
  CaseOutcomeVariants,
  DisputeRulingVariants,
  type CaseTypeKey,
  type DocumentTypeKey,
  type CaseOutcomeKey,
  type DisputeRulingKey,
  type LawyerProfile,
  type LegalCase,
  type PlatformState,
  type CaseApplication,
  type DocumentRecord,
  type LawyerReview,
  type Dispute,
} from "@/lib/mercosuria";

// ─── RPC endpoint ─────────────────────────────────────────────────────────────

// Use VITE_SOLANA_RPC from .env (falls back to devnet public endpoint).
// Example .env:
//   VITE_SOLANA_RPC=https://api.devnet.solana.com
//   VITE_SOLANA_NETWORK=devnet
const RPC_ENDPOINT =
  import.meta.env.VITE_SOLANA_RPC ?? "https://api.devnet.solana.com";

// ─── Wallet adapters ──────────────────────────────────────────────────────────

const WALLETS = [
  new PhantomWalletAdapter(),
  new SolflareWalletAdapter(),
  new BackpackWalletAdapter(),
  new LedgerWalletAdapter(),
  new TorusWalletAdapter(),
];

// ─── Mercosuria context type ──────────────────────────────────────────────────

export interface OpenCaseParams {
  title: string;
  description: string;
  caseType: CaseTypeKey;
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

interface MercosuriaContextValue {
  // Program instance (null when wallet not connected)
  program: Program | null;

  // ── Platform ──
  fetchPlatform: () => Promise<PlatformState | null>;

  // ── Lawyers ──
  registerLawyer: (params: RegisterLawyerParams) => Promise<string>;
  updateLawyerProfile: (params: { hourlyRateSOL?: number; isActive?: boolean }) => Promise<string>;
  fetchLawyer: (wallet: PublicKey) => Promise<LawyerProfile | null>;
  fetchAllActiveLawyers: () => Promise<LawyerProfile[]>;

  // ── Cases ──
  openCase: (params: OpenCaseParams) => Promise<{ tx: string; casePDA: PublicKey }>;
  applyToCase: (casePDA: PublicKey, caseId: BN, clientPubkey: PublicKey, proposal: string, proposedFeeSOL: number) => Promise<string>;
  acceptLawyer: (casePDA: PublicKey, lawyerPubkey: PublicKey) => Promise<string>;
  fetchCase: (casePDA: PublicKey) => Promise<LegalCase | null>;
  fetchMyCases: () => Promise<Array<{ pubkey: PublicKey; account: LegalCase }>>;
  fetchOpenCases: () => Promise<Array<{ pubkey: PublicKey; account: LegalCase }>>;

  // ── Documents ──
  attachDocument: (casePDA: PublicKey, docHash: string, docTitle: string, docType: DocumentTypeKey) => Promise<string>;
  hashFile: (file: File) => Promise<string>;

  // ── Payments ──
  releasePayment: (caseId: BN, clientPubkey: PublicKey, lawyerPubkey: PublicKey, amountSOL: number, treasuryPubkey: PublicKey) => Promise<string>;
  closeCase: (caseId: BN, outcome: CaseOutcomeKey, notes: string, lawyerPubkey: PublicKey) => Promise<string>;
  submitReview: (caseId: BN, lawyerPubkey: PublicKey, rating: 1 | 2 | 3 | 4 | 5, comment: string) => Promise<string>;

  // ── Disputes ──
  raiseDispute: (casePDA: PublicKey, reason: string) => Promise<string>;

  // ── Utils ──
  lamportsToSOL: (lamports: BN | number) => string;
  reputationLabel: (score: BN | number) => string;
  caseStatusLabel: (status: Record<string, object>) => string;
  caseTypeLabel: (caseType: Record<string, object>) => string;
  pdas: typeof pdas;
}

const MercosuriaContext = createContext<MercosuriaContextValue | null>(null);

// ─── Inner provider (needs wallet adapter hooks) ──────────────────────────────

function MercosuriaProvider({ children }: { children: ReactNode }) {
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();
  const { publicKey } = useWallet();

  const provider = useMemo(() => {
    if (!anchorWallet) return null;
    return new AnchorProvider(connection, anchorWallet, {
      commitment: "confirmed",
      preflightCommitment: "confirmed",
    });
  }, [connection, anchorWallet]);

  const program = useMemo(
    () => (provider ? getMercosuriaProgram(provider) : null),
    [provider]
  );

  // ── Platform ──────────────────────────────────────────────────────────────

  const fetchPlatform = useCallback(async (): Promise<PlatformState | null> => {
    if (!program) return null;
    try {
      const [pda] = pdas.platform();
      return (await program.account["platformState"].fetch(pda)) as PlatformState;
    } catch {
      return null;
    }
  }, [program]);

  // ── Lawyers ───────────────────────────────────────────────────────────────

  const registerLawyer = useCallback(
    async (params: RegisterLawyerParams): Promise<string> => {
      if (!program || !publicKey) throw new Error("Wallet not connected");
      const [lawyerPDA] = pdas.lawyer(publicKey);
      return program.methods
        .registerLawyer(
          params.name,
          params.barNumber,
          params.jurisdiction,
          params.specialization,
          new BN(Math.round(params.hourlyRateSOL * LAMPORTS_PER_SOL))
        )
        .accounts({
          lawyerProfile: lawyerPDA,
          lawyerVault: publicKey,
          lawyer: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
    },
    [program, publicKey]
  );

  const updateLawyerProfile = useCallback(
    async (params: { hourlyRateSOL?: number; isActive?: boolean }): Promise<string> => {
      if (!program || !publicKey) throw new Error("Wallet not connected");
      const [lawyerPDA] = pdas.lawyer(publicKey);
      return program.methods
        .updateLawyerProfile(
          params.hourlyRateSOL != null
            ? new BN(Math.round(params.hourlyRateSOL * LAMPORTS_PER_SOL))
            : null,
          params.isActive ?? null
        )
        .accounts({ lawyerProfile: lawyerPDA, lawyer: publicKey })
        .rpc();
    },
    [program, publicKey]
  );

  const fetchLawyer = useCallback(
    async (wallet: PublicKey): Promise<LawyerProfile | null> => {
      if (!program) return null;
      try {
        const [pda] = pdas.lawyer(wallet);
        return (await program.account["lawyerProfile"].fetch(pda)) as LawyerProfile;
      } catch {
        return null;
      }
    },
    [program]
  );

  const fetchAllActiveLawyers = useCallback(async (): Promise<LawyerProfile[]> => {
    if (!program) return [];
    const accounts = await program.account["lawyerProfile"].all();
    return accounts
      .map((a) => a.account as LawyerProfile)
      .filter((l) => l.isActive);
  }, [program]);

  // ── Cases ─────────────────────────────────────────────────────────────────

  const openCase = useCallback(
    async (params: OpenCaseParams): Promise<{ tx: string; casePDA: PublicKey }> => {
      if (!program || !publicKey) throw new Error("Wallet not connected");
      const platform = await fetchPlatform();
      if (!platform) throw new Error("Platform not initialized");

      const caseId = platform.totalCases;
      const [casePDA] = pdas.case(publicKey, caseId);
      const [caseEscrowPDA] = pdas.caseEscrow(publicKey, caseId);
      const [platformPDA] = pdas.platform();

      const tx = await program.methods
        .openCase(
          params.title,
          params.description,
          CaseTypeVariants[params.caseType],
          new BN(Math.round(params.budgetSOL * LAMPORTS_PER_SOL)),
          new BN(Math.floor(params.deadlineDate.getTime() / 1000))
        )
        .accounts({
          platform: platformPDA,
          legalCase: casePDA,
          caseEscrow: caseEscrowPDA,
          client: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return { tx, casePDA };
    },
    [program, publicKey, fetchPlatform]
  );

  const applyToCase = useCallback(
    async (
      casePDA: PublicKey,
      _caseId: BN,
      _clientPubkey: PublicKey,
      proposal: string,
      proposedFeeSOL: number
    ): Promise<string> => {
      if (!program || !publicKey) throw new Error("Wallet not connected");
      const [lawyerPDA] = pdas.lawyer(publicKey);
      const [applicationPDA] = pdas.application(casePDA, publicKey);
      return program.methods
        .applyToCase(
          proposal,
          new BN(Math.round(proposedFeeSOL * LAMPORTS_PER_SOL))
        )
        .accounts({
          legalCase: casePDA,
          caseApplication: applicationPDA,
          lawyerProfile: lawyerPDA,
          lawyer: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
    },
    [program, publicKey]
  );

  const acceptLawyer = useCallback(
    async (casePDA: PublicKey, lawyerPubkey: PublicKey): Promise<string> => {
      if (!program || !publicKey) throw new Error("Wallet not connected");
      const [applicationPDA] = pdas.application(casePDA, lawyerPubkey);
      return program.methods
        .acceptLawyer()
        .accounts({
          legalCase: casePDA,
          caseApplication: applicationPDA,
          lawyer: lawyerPubkey,
          client: publicKey,
        })
        .rpc();
    },
    [program, publicKey]
  );

  const fetchCase = useCallback(
    async (casePDA: PublicKey): Promise<LegalCase | null> => {
      if (!program) return null;
      try {
        return (await program.account["legalCase"].fetch(casePDA)) as LegalCase;
      } catch {
        return null;
      }
    },
    [program]
  );

  const fetchMyCases = useCallback(async () => {
    if (!program || !publicKey) return [];
    const all = await program.account["legalCase"].all();
    return all
      .filter((a) => (a.account as LegalCase).client.equals(publicKey))
      .map((a) => ({ pubkey: a.publicKey, account: a.account as LegalCase }));
  }, [program, publicKey]);

  const fetchOpenCases = useCallback(async () => {
    if (!program) return [];
    const all = await program.account["legalCase"].all();
    return all
      .filter((a) => "open" in (a.account as LegalCase).status)
      .map((a) => ({ pubkey: a.publicKey, account: a.account as LegalCase }));
  }, [program]);

  // ── Documents ─────────────────────────────────────────────────────────────

  const attachDocument = useCallback(
    async (
      casePDA: PublicKey,
      docHash: string,
      docTitle: string,
      docType: DocumentTypeKey
    ): Promise<string> => {
      if (!program || !publicKey) throw new Error("Wallet not connected");
      const lc = await fetchCase(casePDA);
      if (!lc) throw new Error("Case not found");
      const [docPDA] = pdas.document(casePDA, lc.documentHashes.length);
      return program.methods
        .attachDocument(docHash, docTitle, DocumentTypeVariants[docType])
        .accounts({
          legalCase: casePDA,
          documentRecord: docPDA,
          signer: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
    },
    [program, publicKey, fetchCase]
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
      if (!program || !publicKey) throw new Error("Wallet not connected");
      const [platformPDA] = pdas.platform();
      const [casePDA] = pdas.case(clientPubkey, caseId);
      const [caseEscrowPDA] = pdas.caseEscrow(clientPubkey, caseId);
      const [lawyerPDA] = pdas.lawyer(lawyerPubkey);
      return program.methods
        .releasePayment(new BN(Math.round(amountSOL * LAMPORTS_PER_SOL)))
        .accounts({
          platform: platformPDA,
          legalCase: casePDA,
          caseEscrow: caseEscrowPDA,
          lawyerProfile: lawyerPDA,
          lawyerWallet: lawyerPubkey,
          treasury: treasuryPubkey,
          client: publicKey,
        })
        .rpc();
    },
    [program, publicKey]
  );

  const closeCase = useCallback(
    async (
      caseId: BN,
      outcome: CaseOutcomeKey,
      notes: string,
      lawyerPubkey: PublicKey
    ): Promise<string> => {
      if (!program || !publicKey) throw new Error("Wallet not connected");
      const [platformPDA] = pdas.platform();
      const [casePDA] = pdas.case(publicKey, caseId);
      const [caseEscrowPDA] = pdas.caseEscrow(publicKey, caseId);
      const [lawyerPDA] = pdas.lawyer(lawyerPubkey);
      return program.methods
        .closeCase(CaseOutcomeVariants[outcome], notes)
        .accounts({
          platform: platformPDA,
          legalCase: casePDA,
          caseEscrow: caseEscrowPDA,
          lawyerProfile: lawyerPDA,
          client: publicKey,
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
      if (!program || !publicKey) throw new Error("Wallet not connected");
      const [casePDA] = pdas.case(publicKey, caseId);
      const [reviewPDA] = pdas.review(casePDA);
      const [lawyerPDA] = pdas.lawyer(lawyerPubkey);
      return program.methods
        .submitReview(rating, comment)
        .accounts({
          legalCase: casePDA,
          lawyerReview: reviewPDA,
          lawyerProfile: lawyerPDA,
          lawyer: lawyerPubkey,
          client: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
    },
    [program, publicKey]
  );

  // ── Disputes ──────────────────────────────────────────────────────────────

  const raiseDispute = useCallback(
    async (casePDA: PublicKey, reason: string): Promise<string> => {
      if (!program || !publicKey) throw new Error("Wallet not connected");
      const [disputePDA] = pdas.dispute(casePDA);
      return program.methods
        .raiseDispute(reason)
        .accounts({
          legalCase: casePDA,
          dispute: disputePDA,
          signer: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
    },
    [program, publicKey]
  );

  const value: MercosuriaContextValue = {
    program,
    fetchPlatform,
    registerLawyer,
    updateLawyerProfile,
    fetchLawyer,
    fetchAllActiveLawyers,
    openCase,
    applyToCase,
    acceptLawyer,
    fetchCase,
    fetchMyCases,
    fetchOpenCases,
    attachDocument,
    hashFile: hashFileFn,
    releasePayment,
    closeCase,
    submitReview,
    raiseDispute,
    lamportsToSOL,
    reputationLabel,
    caseStatusLabel,
    caseTypeLabel,
    pdas,
  };

  return (
    <MercosuriaContext.Provider value={value}>
      {children}
    </MercosuriaContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useMercosuria(): MercosuriaContextValue {
  const ctx = useContext(MercosuriaContext);
  if (!ctx)
    throw new Error("useMercosuria must be used inside <SolanaProvider>");
  return ctx;
}

// ─── Top-level export (wraps everything) ──────────────────────────────────────

export function SolanaProvider({ children }: { children: ReactNode }) {
  return (
    <ConnectionProvider endpoint={RPC_ENDPOINT}>
      <WalletProvider wallets={WALLETS} autoConnect>
        <WalletModalProvider>
          <MercosuriaProvider>{children}</MercosuriaProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
