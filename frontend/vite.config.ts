import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [
    react({
      babel: {
        presets: [
          ['@babel/preset-react', { runtime: 'automatic' }],
        ],
      },
    }),
    nodePolyfills({
      include: ['buffer', 'crypto', 'stream', 'http', 'https', 'os', 'assert', 'url', 'process', 'util', 'vm'],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      protocolImports: true,
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'process/browser': path.resolve(__dirname, './node_modules/process/browser.js'),
    },
  },
  define: {
    'process.env': {},
    global: 'globalThis',
  },
  build: {
    target: 'es2022',
    minify: 'esbuild',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-wagmi': ['wagmi', 'viem', '@tanstack/react-query'],
          'vendor-ui': ['framer-motion', 'lucide-react', 'sonner', 'recharts'],
          'vendor-web3': ['@rainbow-me/rainbowkit', '@walletconnect/ethereum-provider', '@metamask/sdk', '@coinbase/wallet-sdk'],
          'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'wagmi',
      'viem',
      '@tanstack/react-query',
      'framer-motion',
      'lucide-react',
      'sonner',
      'recharts',
      'axios',
    ],
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
  },
});