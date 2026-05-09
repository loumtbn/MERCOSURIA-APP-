# Mercosuria — Solana Anchor Program

> On-chain legal case management, escrow, and reputation for the MERCOSUR LawTech platform.

---

## Overview

This Anchor program backs the Mercosuria web app with five core modules:

| Module | What it does |
|---|---|
| **Platform** | Admin-owned global state; configures platform fees (default 2.5%) |
| **Lawyer Registry** | Lawyers register with stake, bar number, jurisdiction, and hourly rate |
| **Legal Cases** | Clients open cases with SOL deposited into a PDA escrow |
| **Document Verification** | SHA-256 document hashes anchored immutably on-chain |
| **Dispute Resolution** | Either party can raise a dispute; platform admin arbitrates |

---

## Program Architecture

```
PlatformState (PDA: "platform")
│
├── LawyerProfile (PDA: "lawyer" + wallet)
│   └── Staked SOL · Reputation 0-1000 · Case stats
│
├── LegalCase (PDA: "case" + client + caseId)
│   ├── CaseEscrow (PDA: "case_escrow" + client + caseId) ← holds client SOL
│   ├── CaseApplication (PDA: "application" + case + lawyer)
│   ├── DocumentRecord (PDA: "document" + case + index)
│   ├── LawyerReview (PDA: "review" + case)
│   └── Dispute (PDA: "dispute" + case)
```

### Case Lifecycle

```
Client opens case → [OPEN]
   └── Lawyer applies → Client accepts → [IN PROGRESS]
         ├── Client releases partial payments (with 2.5% fee to treasury)
         ├── Either party raises dispute → [DISPUTED]
         │     └── Admin resolves (favor client / favor lawyer / split)
         └── Client closes case → [CLOSED]
               ├── Unspent escrow refunded to client
               ├── Lawyer reputation updated (+/-20 points)
               └── Client can submit 1-5 star review
```

---

## Instructions

| Instruction | Signer | Description |
|---|---|---|
| `initialize_platform` | Admin | Set fee BPS + treasury |
| `register_lawyer` | Lawyer | Create on-chain profile with stake |
| `update_lawyer_profile` | Lawyer | Change rate / availability |
| `open_case` | Client | Deposit SOL escrow, create case |
| `apply_to_case` | Lawyer | Submit proposal + fee |
| `accept_lawyer` | Client | Assign lawyer, move to InProgress |
| `attach_document` | Client or Lawyer | Hash anchored on-chain |
| `release_payment` | Client | Pay lawyer from escrow (fee deducted) |
| `close_case` | Client | Refund remaining escrow, update stats |
| `submit_review` | Client | 1-5 star rating after closure |
| `raise_dispute` | Client or Lawyer | Freeze escrow, escalate |
| `resolve_dispute` | Admin | Arbitrate with FavorClient / FavorLawyer / Split |

---

## Setup

### Prerequisites
- [Rust](https://www.rust-lang.org/tools/install)
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools) `>= 1.18`
- [Anchor CLI](https://www.anchor-lang.com/docs/installation) `= 0.30.0`
- [Node.js](https://nodejs.org/) `>= 18`
- [Yarn](https://yarnpkg.com/)

### Install

```bash
cd mercosuria-program
yarn install
anchor build
```

### Test (localnet)

```bash
# Start local validator
solana-test-validator

# In another terminal
anchor test --skip-local-validator
```

### Deploy to Devnet

```bash
solana config set --url devnet
solana airdrop 2

anchor build
anchor deploy --provider.cluster devnet
```

---

## Integrating with the React App

Copy the SDK file into your frontend:

```bash
cp sdk/mercosuria.ts ../src/lib/mercosuria.ts
```

Then use in any component:

```tsx
import { useMercosuria } from "@/lib/mercosuria";

// Inside component:
const { openCase, fetchAllLawyers, hashFile, reputationLabel } = useMercosuria(program);

// Open a case
const { tx, casePDA } = await openCase({
  title: "Trade Dispute — ARG/URY",
  description: "...",
  caseType: "tradeLaw",
  budgetSOL: 2,
  deadlineDate: new Date("2026-08-01"),
});

// Hash a PDF before attaching
const hash = await hashFile(selectedFile);
await attachDocument(casePDA, hash, "contract.pdf", "contract");

// Browse lawyers
const lawyers = await fetchAllLawyers();
lawyers.forEach(l => {
  console.log(l.name, reputationLabel(l.reputationScore.toNumber()));
});
```

---

## Accounts & Space

| Account | Space (bytes) |
|---|---|
| PlatformState | ~120 |
| LawyerProfile | ~420 |
| LegalCase | ~1,080 |
| CaseApplication | ~680 |
| DocumentRecord | ~360 |
| LawyerReview | ~700 |
| Dispute | ~700 |

---

## Security Notes

- **Escrow PDAs** are program-owned — only the program can move funds
- **Fee cap** enforced at 10% (`FeeTooHigh` error above that)
- **Reputation slashing** on dispute ruling against lawyer
- **Unauthorized** errors on all signer validation (client can't impersonate lawyer, etc.)
- **Document hashes** are immutable once written — only metadata, no actual files stored on-chain
- Minimum **1 SOL stake** required for lawyer registration (skin in the game)

---

## Program ID

```
MERCzKpGn4jqf9eFZSPVKMeS7WGmP4QhEGGdNLVwx1U
```

Replace with the actual deployed program ID after running `anchor deploy`.
