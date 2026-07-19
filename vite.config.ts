import { defineConfig } from 'vite'
import { fileURLToPath } from 'url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'

export default defineConfig({
  plugins: [
    (wasm as unknown as () => any)(),
    (topLevelAwait as unknown as () => any)(),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      'cross-fetch': fileURLToPath(new URL('./src/lib/shims/cross-fetch-shim.ts', import.meta.url)),
    },
  },
  optimizeDeps: {
    exclude: [
      '@midnight-ntwrk/ledger',
      '@midnight-ntwrk/ledger-v8',
      '@midnight-ntwrk/compact-runtime',
      '@midnight-ntwrk/compact-js',
      '@midnight-ntwrk/midnight-js-contracts',
      '@midnight-ntwrk/midnight-js-types',
      '@midnight-ntwrk/midnight-js-fetch-zk-config-provider',
      '@midnight-ntwrk/midnight-js-indexer-public-data-provider',
      '@midnight-ntwrk/midnight-js-network-id',
    ],
    include: [
      'buffer',
      '@midnight-ntwrk/midnight-js-utils',
      '@midnight-ntwrk/wallet-sdk-address-format',
      'object-inspect',
    ],
  },
  build: { target: 'esnext' },
  worker: { format: 'es' },
  define: {
    global: 'globalThis',
  },
})
