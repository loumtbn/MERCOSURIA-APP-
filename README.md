# Clone your repo
git clone https://github.com/loumtbn/MERCOSURIA-APP-.git
cd MERCOSURIA-APP-

# Copy the Solana program
cp -r /path/to/mercosuria-program ./mercosuria-program

# Copy frontend integration files
cp -r /path/to/mercosuria-frontend/src/context ./src/
cp -r /path/to/mercosuria-frontend/src/hooks ./src/
cp -r /path/to/mercosuria-frontend/src/lib ./src/
cp -r /path/to/mercosuria-frontend/src/components/solana ./src/components/
cp /path/to/mercosuria-frontend/src/main.tsx ./src/main.tsx
cp /path/to/mercosuria-frontend/vite.config.ts ./vite.config.ts
cp /path/to/mercosuria-frontend/INTEGRATION.md ./INTEGRATION.md
cp /path/to/mercosuria-frontend/.env.example ./.env.example

# Commit and push
git add .
git commit -m "feat: add Mercosuria Solana program + frontend integration

- Anchor program (programs/mercosuria/src/lib.rs)
  - Platform, LawyerRegistry, LegalCases, Documents, Disputes
  - Full escrow lifecycle with 2.5% fee
- Frontend SDK
  - ProgramContext, useMercosuria hook
  - WalletButton, OpenCaseForm, CaseCard, LawyerCard
  - DocumentUploader (SHA-256 on-chain anchoring)
- Updated vite.config.ts with node polyfills
- Integration guide (INTEGRATION.md)"

git push origin main
