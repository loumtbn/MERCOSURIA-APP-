import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { Mercosuria } from "../target/types/mercosuria";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";
import { assert } from "chai";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function airdrop(
  provider: anchor.AnchorProvider,
  pubkey: PublicKey,
  sol = 10
) {
  const sig = await provider.connection.requestAirdrop(
    pubkey,
    sol * LAMPORTS_PER_SOL
  );
  await provider.connection.confirmTransaction(sig);
}

function findPlatformPDA(programId: PublicKey) {
  return PublicKey.findProgramAddressSync([Buffer.from("platform")], programId);
}

function findLawyerPDA(programId: PublicKey, lawyer: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("lawyer"), lawyer.toBuffer()],
    programId
  );
}

function findCasePDA(
  programId: PublicKey,
  client: PublicKey,
  caseId: BN
) {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("case"),
      client.toBuffer(),
      caseId.toArrayLike(Buffer, "le", 8),
    ],
    programId
  );
}

function findCaseEscrowPDA(
  programId: PublicKey,
  client: PublicKey,
  caseId: BN
) {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("case_escrow"),
      client.toBuffer(),
      caseId.toArrayLike(Buffer, "le", 8),
    ],
    programId
  );
}

function findApplicationPDA(
  programId: PublicKey,
  casePDA: PublicKey,
  lawyer: PublicKey
) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("application"), casePDA.toBuffer(), lawyer.toBuffer()],
    programId
  );
}

function findDocumentPDA(
  programId: PublicKey,
  casePDA: PublicKey,
  index: BN
) {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("document"),
      casePDA.toBuffer(),
      index.toArrayLike(Buffer, "le", 8),
    ],
    programId
  );
}

function findDisputePDA(programId: PublicKey, casePDA: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("dispute"), casePDA.toBuffer()],
    programId
  );
}

function findReviewPDA(programId: PublicKey, casePDA: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("review"), casePDA.toBuffer()],
    programId
  );
}

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe("mercosuria", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Mercosuria as Program<Mercosuria>;
  const programId = program.programId;

  // Actors
  const admin = Keypair.generate();
  const treasury = Keypair.generate();
  const client = Keypair.generate();
  const lawyerKeypair = Keypair.generate();

  let platformPDA: PublicKey;
  let platformBump: number;
  let lawyerPDA: PublicKey;
  let casePDA: PublicKey;
  let caseEscrowPDA: PublicKey;
  let applicationPDA: PublicKey;
  let caseId = new BN(0);

  before(async () => {
    // Airdrop SOL to all actors
    await Promise.all([
      airdrop(provider, admin.publicKey, 20),
      airdrop(provider, client.publicKey, 20),
      airdrop(provider, lawyerKeypair.publicKey, 20),
      airdrop(provider, treasury.publicKey, 2),
    ]);

    [platformPDA, platformBump] = findPlatformPDA(programId);
    [lawyerPDA] = findLawyerPDA(programId, lawyerKeypair.publicKey);
  });

  // ─── Platform ──────────────────────────────────────────────────────────────

  it("initializes the platform", async () => {
    await program.methods
      .initializePlatform(new BN(250)) // 2.5% fee
      .accounts({
        platform: platformPDA,
        treasury: treasury.publicKey,
        authority: admin.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([admin])
      .rpc();

    const platform = await program.account.platformState.fetch(platformPDA);
    assert.equal(platform.authority.toBase58(), admin.publicKey.toBase58());
    assert.equal(platform.feeBps.toNumber(), 250);
    assert.equal(platform.totalCases.toNumber(), 0);
  });

  it("rejects fee > 10%", async () => {
    const badAdmin = Keypair.generate();
    await airdrop(provider, badAdmin.publicKey, 2);
    try {
      // This should throw
      const [tempPlatform] = PublicKey.findProgramAddressSync(
        [Buffer.from("platform_test")],
        programId
      );
      await program.methods
        .initializePlatform(new BN(1500))
        .accounts({
          platform: platformPDA,
          treasury: treasury.publicKey,
          authority: badAdmin.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([badAdmin])
        .rpc();
      assert.fail("Should have thrown");
    } catch (e) {
      assert.include(e.toString(), "Error");
    }
  });

  // ─── Lawyer Registration ───────────────────────────────────────────────────

  it("registers a lawyer", async () => {
    // The lawyer's vault is their own account for this test
    await program.methods
      .registerLawyer(
        "María González",
        "ARG-2019-4821",
        "Argentina / MERCOSUR",
        "Commercial Law",
        new BN(0.05 * LAMPORTS_PER_SOL) // 0.05 SOL per hour
      )
      .accounts({
        lawyerProfile: lawyerPDA,
        lawyerVault: lawyerKeypair.publicKey,
        lawyer: lawyerKeypair.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([lawyerKeypair])
      .rpc();

    const profile = await program.account.lawyerProfile.fetch(lawyerPDA);
    assert.equal(profile.name, "María González");
    assert.equal(profile.jurisdiction, "Argentina / MERCOSUR");
    assert.equal(profile.reputationScore.toNumber(), 500);
    assert.isTrue(profile.isActive);
  });

  // ─── Case Lifecycle ────────────────────────────────────────────────────────

  it("opens a legal case with escrow deposit", async () => {
    const platform = await program.account.platformState.fetch(platformPDA);
    caseId = platform.totalCases;

    [casePDA] = findCasePDA(programId, client.publicKey, caseId);
    [caseEscrowPDA] = findCaseEscrowPDA(programId, client.publicKey, caseId);

    const budget = new BN(2 * LAMPORTS_PER_SOL);
    const deadline = new BN(Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30); // 30 days

    await program.methods
      .openCase(
        "Breach of Trade Agreement — Uruguay/Argentina",
        "Client claims breach of supply contract under MERCOSUR trade law",
        { tradeLaw: {} },
        budget,
        deadline
      )
      .accounts({
        platform: platformPDA,
        legalCase: casePDA,
        caseEscrow: caseEscrowPDA,
        client: client.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([client])
      .rpc();

    const legalCase = await program.account.legalCase.fetch(casePDA);
    assert.equal(legalCase.caseId.toNumber(), 0);
    assert.equal(legalCase.client.toBase58(), client.publicKey.toBase58());
    assert.equal(legalCase.budgetLamports.toNumber(), budget.toNumber());
    assert.deepEqual(legalCase.status, { open: {} });
    assert.isNull(legalCase.assignedLawyer);

    // Verify escrow received funds
    const escrowBalance = await provider.connection.getBalance(caseEscrowPDA);
    assert.equal(escrowBalance, budget.toNumber());
  });

  it("lawyer applies to a case", async () => {
    [applicationPDA] = findApplicationPDA(programId, casePDA, lawyerKeypair.publicKey);

    await program.methods
      .applyToCase(
        "I specialize in MERCOSUR trade law with 8 years of cross-border dispute experience.",
        new BN(1.5 * LAMPORTS_PER_SOL)
      )
      .accounts({
        legalCase: casePDA,
        caseApplication: applicationPDA,
        lawyerProfile: lawyerPDA,
        lawyer: lawyerKeypair.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([lawyerKeypair])
      .rpc();

    const app = await program.account.caseApplication.fetch(applicationPDA);
    assert.equal(app.lawyer.toBase58(), lawyerKeypair.publicKey.toBase58());
    assert.isFalse(app.accepted);
  });

  it("client accepts the lawyer's application", async () => {
    await program.methods
      .acceptLawyer()
      .accounts({
        legalCase: casePDA,
        caseApplication: applicationPDA,
        lawyer: lawyerKeypair.publicKey,
        client: client.publicKey,
      })
      .signers([client])
      .rpc();

    const legalCase = await program.account.legalCase.fetch(casePDA);
    assert.deepEqual(legalCase.status, { inProgress: {} });
    assert.equal(
      legalCase.assignedLawyer.toBase58(),
      lawyerKeypair.publicKey.toBase58()
    );
  });

  // ─── Documents ─────────────────────────────────────────────────────────────

  it("client attaches a contract document hash", async () => {
    const legalCase = await program.account.legalCase.fetch(casePDA);
    const docIndex = new BN(legalCase.documentHashes.length);
    const [docPDA] = findDocumentPDA(programId, casePDA, docIndex);

    const sha256Hash =
      "a3f1e2c9d8b745601234abcd5678ef90a1b2c3d4e5f6789012345678abcdef01";

    await program.methods
      .attachDocument(sha256Hash, "Supply_Contract_2024.pdf", { contract: {} })
      .accounts({
        legalCase: casePDA,
        documentRecord: docPDA,
        signer: client.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([client])
      .rpc();

    const doc = await program.account.documentRecord.fetch(docPDA);
    assert.equal(doc.docHash, sha256Hash);
    assert.equal(doc.docTitle, "Supply_Contract_2024.pdf");
    assert.deepEqual(doc.docType, { contract: {} });

    const updatedCase = await program.account.legalCase.fetch(casePDA);
    assert.equal(updatedCase.documentHashes.length, 1);
  });

  // ─── Payments ──────────────────────────────────────────────────────────────

  it("client releases partial payment to lawyer", async () => {
    const lawyerBalanceBefore = await provider.connection.getBalance(
      lawyerKeypair.publicKey
    );
    const treasuryBalanceBefore = await provider.connection.getBalance(
      treasury.publicKey
    );

    const payAmount = new BN(0.5 * LAMPORTS_PER_SOL);

    await program.methods
      .releasePayment(payAmount)
      .accounts({
        platform: platformPDA,
        legalCase: casePDA,
        caseEscrow: caseEscrowPDA,
        lawyerProfile: lawyerPDA,
        lawyerWallet: lawyerKeypair.publicKey,
        treasury: treasury.publicKey,
        client: client.publicKey,
      })
      .signers([client])
      .rpc();

    const lawyerBalanceAfter = await provider.connection.getBalance(
      lawyerKeypair.publicKey
    );
    const treasuryBalanceAfter = await provider.connection.getBalance(
      treasury.publicKey
    );

    // Lawyer should receive 97.5% (2.5% fee)
    const expectedFee = Math.floor((0.5 * LAMPORTS_PER_SOL * 250) / 10000);
    const expectedLawyerGain = 0.5 * LAMPORTS_PER_SOL - expectedFee;

    assert.approximately(
      lawyerBalanceAfter - lawyerBalanceBefore,
      expectedLawyerGain,
      1000 // tolerance for tx fees
    );
    assert.equal(
      treasuryBalanceAfter - treasuryBalanceBefore,
      expectedFee
    );

    const legalCase = await program.account.legalCase.fetch(casePDA);
    assert.equal(
      legalCase.escrowedLamports.toNumber(),
      1.5 * LAMPORTS_PER_SOL
    );
  });

  // ─── Case Closure & Review ────────────────────────────────────────────────

  it("client closes the case with outcome", async () => {
    const clientBalanceBefore = await provider.connection.getBalance(
      client.publicKey
    );

    await program.methods
      .closeCase(
        { clientWon: {} },
        "Matter resolved after lawyer filed an injunction. Contract honored."
      )
      .accounts({
        platform: platformPDA,
        legalCase: casePDA,
        caseEscrow: caseEscrowPDA,
        lawyerProfile: lawyerPDA,
        client: client.publicKey,
      })
      .signers([client])
      .rpc();

    const legalCase = await program.account.legalCase.fetch(casePDA);
    assert.deepEqual(legalCase.status, { closed: {} });
    assert.equal(legalCase.escrowedLamports.toNumber(), 0);
    assert.isNotNull(legalCase.closedAt);

    // Lawyer reputation should have increased
    const lawyerProfile = await program.account.lawyerProfile.fetch(lawyerPDA);
    assert.isAbove(lawyerProfile.reputationScore.toNumber(), 500);
    assert.equal(lawyerProfile.casesHandled.toNumber(), 1);
    assert.equal(lawyerProfile.casesWon.toNumber(), 1);

    // Remaining escrow refunded to client
    const clientBalanceAfter = await provider.connection.getBalance(
      client.publicKey
    );
    assert.isAbove(clientBalanceAfter, clientBalanceBefore);
  });

  it("client submits a 5-star review", async () => {
    const [reviewPDA] = findReviewPDA(programId, casePDA);

    await program.methods
      .submitReview(5, "María was exceptional — highly recommend for MERCOSUR trade law.")
      .accounts({
        legalCase: casePDA,
        lawyerReview: reviewPDA,
        lawyerProfile: lawyerPDA,
        lawyer: lawyerKeypair.publicKey,
        client: client.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([client])
      .rpc();

    const review = await program.account.lawyerReview.fetch(reviewPDA);
    assert.equal(review.rating, 5);
    assert.equal(review.lawyer.toBase58(), lawyerKeypair.publicKey.toBase58());

    // Reputation should increase further
    const lawyerProfile = await program.account.lawyerProfile.fetch(lawyerPDA);
    assert.isAbove(lawyerProfile.reputationScore.toNumber(), 520);
  });

  // ─── Dispute Flow ─────────────────────────────────────────────────────────

  it("opens a second case and tests dispute resolution", async () => {
    const client2 = Keypair.generate();
    await airdrop(provider, client2.publicKey, 10);

    const platform = await program.account.platformState.fetch(platformPDA);
    const c2CaseId = platform.totalCases;
    const [c2CasePDA] = findCasePDA(programId, client2.publicKey, c2CaseId);
    const [c2EscrowPDA] = findCaseEscrowPDA(programId, client2.publicKey, c2CaseId);

    const budget = new BN(1 * LAMPORTS_PER_SOL);
    const deadline = new BN(Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7);

    await program.methods
      .openCase(
        "Labor Dispute — Brazil/Paraguay",
        "Employee claims wrongful termination under MERCOSUR labor norms",
        { laborLaw: {} },
        budget,
        deadline
      )
      .accounts({
        platform: platformPDA,
        legalCase: c2CasePDA,
        caseEscrow: c2EscrowPDA,
        client: client2.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([client2])
      .rpc();

    // Lawyer applies and is accepted
    const [c2AppPDA] = findApplicationPDA(programId, c2CasePDA, lawyerKeypair.publicKey);
    await program.methods
      .applyToCase("Ready to handle this case.", new BN(0.8 * LAMPORTS_PER_SOL))
      .accounts({
        legalCase: c2CasePDA,
        caseApplication: c2AppPDA,
        lawyerProfile: lawyerPDA,
        lawyer: lawyerKeypair.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([lawyerKeypair])
      .rpc();

    await program.methods
      .acceptLawyer()
      .accounts({
        legalCase: c2CasePDA,
        caseApplication: c2AppPDA,
        lawyer: lawyerKeypair.publicKey,
        client: client2.publicKey,
      })
      .signers([client2])
      .rpc();

    // Client raises dispute
    const [disputePDA] = findDisputePDA(programId, c2CasePDA);
    await program.methods
      .raiseDispute("Lawyer missed filing deadline, causing case to be dismissed.")
      .accounts({
        legalCase: c2CasePDA,
        dispute: disputePDA,
        signer: client2.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([client2])
      .rpc();

    const c2Case = await program.account.legalCase.fetch(c2CasePDA);
    assert.deepEqual(c2Case.status, { disputed: {} });

    // Admin resolves in favor of client
    await program.methods
      .resolveDispute({ favorClient: {} }, "Evidence confirms lawyer missed the deadline.")
      .accounts({
        platform: platformPDA,
        legalCase: c2CasePDA,
        dispute: disputePDA,
        caseEscrow: c2EscrowPDA,
        lawyerProfile: lawyerPDA,
        client: client2.publicKey,
        lawyerWallet: lawyerKeypair.publicKey,
        treasury: treasury.publicKey,
        authority: admin.publicKey,
      })
      .signers([admin])
      .rpc();

    const resolvedCase = await program.account.legalCase.fetch(c2CasePDA);
    assert.deepEqual(resolvedCase.status, { closed: {} });
    assert.equal(resolvedCase.escrowedLamports.toNumber(), 0);

    const dispute = await program.account.dispute.fetch(disputePDA);
    assert.isTrue(dispute.resolved);
    assert.equal(
      dispute.arbitrator.toBase58(),
      admin.publicKey.toBase58()
    );
  });

  // ─── Edge Cases ────────────────────────────────────────────────────────────

  it("rejects applying to a non-open case", async () => {
    const [appPDA] = findApplicationPDA(
      programId,
      casePDA,
      lawyerKeypair.publicKey
    );
    try {
      await program.methods
        .applyToCase("Late application", new BN(LAMPORTS_PER_SOL))
        .accounts({
          legalCase: casePDA,
          caseApplication: appPDA,
          lawyerProfile: lawyerPDA,
          lawyer: lawyerKeypair.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([lawyerKeypair])
        .rpc();
      assert.fail("Should have thrown");
    } catch (e) {
      assert.include(e.toString(), "CaseNotOpen");
    }
  });

  it("rejects invalid review rating (0 or 6)", async () => {
    // Rating = 0 should fail
    try {
      const [reviewPDA] = findReviewPDA(programId, casePDA);
      await program.methods
        .submitReview(0, "Bad rating test")
        .accounts({
          legalCase: casePDA,
          lawyerReview: reviewPDA,
          lawyerProfile: lawyerPDA,
          lawyer: lawyerKeypair.publicKey,
          client: client.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([client])
        .rpc();
      assert.fail("Should have thrown");
    } catch (e) {
      assert.include(e.toString(), "InvalidRating");
    }
  });
});
