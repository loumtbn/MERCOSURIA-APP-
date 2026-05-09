/**
 * vite.config.ts  — REPLACE the existing file with this
 *
 * Adds `vite-plugin-node-polyfills` so Buffer, process, crypto
 * are available in the browser (required by @solana/web3.js and @coral-xyz/anchor).
 *
 * Install the plugin:
 *   yarn add -D vite-plugin-node-polyfills
 */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: 5173,
    allowedHosts: true,
    watch: { usePolling: true },
  },
  plugins: [
    react(),
    nodePolyfills({
      globals: { Buffer: true, global: true, process: true },
      protocolImports: true,
    }),
  ],
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  optimizeDeps: {
    exclude: ["lucide-react"],
    include: [
      "@coral-xyz/anchor",
      "@solana/web3.js",
      "@solana/wallet-adapter-react",
      "@solana/wallet-adapter-react-ui",
    ],
  },
  define: { global: "globalThis" },
});
