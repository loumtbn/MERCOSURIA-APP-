# Integrating the Mercosuria Solana Program into the React App

Complete step-by-step guide. All paths are relative to the repo root.

---

## 1 — Install the one new dev dependency

```bash
yarn add -D vite-plugin-node-polyfills
```

> **Why?** `@solana/web3.js` and `@coral-xyz/anchor` use Node.js globals
> (`Buffer`, `process`, `crypto`) that don't exist in the browser. This
> Vite plugin injects the polyfills automatically.

---

## 2 — Copy the new files into `src/`

```
src/
├── lib/
│   ├── mercosuria_idl.json     ← program IDL (discriminators + account schemas)
│   └── mercosuria.ts           ← types, PDA helpers, enum constants, utils
├── context/
│   └── SolanaProvider.tsx      ← wallet + Anchor context, useMercosuria() hook
├── components/
│   └── solana/
│       ├── WalletButton.tsx    ← connect/disconnect button (Tailwind, no extra CSS)
│       └── TxStatus.tsx        ← tx loading/confirmed/error banner + useTx() hook
└── pages/
    ├── OpenCasePage.tsx        ← client form: open a case + deposit SOL escrow
    ├── RegisterLawyerPage.tsx  ← lawyer registration form
    └── MyCasesPage.tsx         ← dashboard: view cases, upload docs, pay, dispute
```

---

## 3 — Replace `src/main.tsx`

Replace the file contents with the provided `src/main.tsx`. The only
additions are:

```tsx
import "@solana/wallet-adapter-react-ui/styles.css"; // wallet modal CSS
import { SolanaProvider } from "@/context/SolanaProvider";

// Wrap <App /> with <SolanaProvider>:
<SolanaProvider>
  <App />
</SolanaProvider>
```

---

## 4 — Replace `vite.config.ts`

Replace with the provided `vite.config.ts`. Additions over the original:

```ts
import { nodePolyfills } from "vite-plugin-node-polyfills";

plugins: [
  react(),
  nodePolyfills({ ... }),   // ← new
],

define: {
  "globalThis.global": "globalThis",  // ← new
},
```

---

## 5 — Add `.env` values

Copy `.env.example` to `.env` and fill in your values:

```
VITE_SOLANA_RPC=https://api.devnet.solana.com
VITE_SOLANA_NETWORK=devnet
```

---

## 6 — Wire up pages in your Router

In your existing `App.tsx` (or wherever you define routes), add:

```tsx
import { OpenCasePage }       from "@/pages/OpenCasePage";
import { RegisterLawyerPage } from "@/pages/RegisterLawyerPage";
import { MyCasesPage }        from "@/pages/MyCasesPage";

// Inside your <Routes>:
<Route path="/open-case"       element={<OpenCasePage />} />
<Route path="/register-lawyer" element={<RegisterLawyerPage />} />
<Route path="/my-cases"        element={<MyCasesPage />} />
```

---

## 7 — Add the WalletButton to your nav

In whichever component renders your top nav:

```tsx
import { WalletButton } from "@/components/solana/WalletButton";

// Inside your nav JSX:
<WalletButton />
```

---

## 8 — Deploy and configure the Solana program

### Devnet
```bash
cd mercosuria-program
anchor build
anchor deploy --provider.cluster devnet

# Note the program ID from the output, then update:
# - src/lib/mercosuria.ts  → MERCOSURIA_PROGRAM_ID
# - src/lib/mercosuria_idl.json  → "address" field
# - mercosuria-program/programs/mercosuria/src/lib.rs  → declare_id!(...)
```

### Initialize the platform (one-time, from admin wallet)
```bash
# In your app or via a script:
const { initializePlatform } = program.methods;
# Or use the Anchor CLI test file as a reference.
```

---

## Using useMercosuria() in your own components

```tsx
import { useMercosuria } from "@/context/SolanaProvider";
import { useTx } from "@/components/solana/TxStatus";

function MyComponent() {
  const { openCase, fetchAllActiveLawyers, hashFile, reputationLabel } = useMercosuria();
  const { execute, status } = useTx();

  // Open a case
  const handleOpen = () =>
    execute(() =>
      openCase({
        title: "Trade Dispute",
        description: "...",
        caseType: "tradeLaw",
        budgetSOL: 1,
        deadlineDate: new Date("2026-09-01"),
      }).then(({ tx }) => tx)
    );

  // Browse lawyers
  useEffect(() => {
    fetchAllActiveLawyers().then(lawyers => {
      lawyers.forEach(l =>
        console.log(l.name, reputationLabel(l.reputationScore))
      );
    });
  }, []);
}
```

---

## File map — what each file does

| File | Role |
|---|---|
| `src/lib/mercosuria_idl.json` | Static IDL — discriminators, account layouts, error codes |
| `src/lib/mercosuria.ts` | Types, PDA derivation, enum helpers, lamports↔SOL, reputation labels |
| `src/context/SolanaProvider.tsx` | `SolanaProvider` wrapper + `useMercosuria()` context hook with all 12 program interactions |
| `src/components/solana/WalletButton.tsx` | Styled connect/disconnect button (no extra CSS required) |
| `src/components/solana/TxStatus.tsx` | `useTx()` hook + `<TxStatus>` banner for tx state feedback |
| `src/pages/OpenCasePage.tsx` | Full form for clients to open a case and deposit SOL escrow |
| `src/pages/RegisterLawyerPage.tsx` | Lawyer profile registration form |
| `src/pages/MyCasesPage.tsx` | Case dashboard: view, upload documents, pay lawyer, raise dispute |
| `src/main.tsx` | Patched entry point — wraps `<App>` with `<SolanaProvider>` |
| `vite.config.ts` | Patched build config — adds Node polyfills for Solana deps |
