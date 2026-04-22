import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// ✅ Correction de l'URL avec HTTPS et détection d'environnement améliorée
const isProduction = process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT === 'production';
const API_URL = process.env.VITE_API_URL || 'https://doublekingshop-production-5fdb.up.railway.app/api';

export default defineConfig({
  // ✅ Indique à Vite que l'application est à la racine du domaine
  base: '/', 

  plugins: [
    react(),
    // ✅ Indispensable pour FedaPay (gère crypto, path, etc.)
    nodePolyfills({
      include: ['path', 'crypto', 'util', 'buffer', 'process'],
      globals: { Buffer: true, global: true, process: true },
    }),
    
    isProduction && VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png', 'robots.txt'],
      manifest: {
        name: 'Double King Shop',
        short_name: 'DKS',
        description: 'Boutique informatique à Bunia. Paiements Pi, Mobile Money et Cash.',
        theme_color: '#2563eb',
        background_color: '#f8fafc',
        display: 'standalone',
        icons: [
          { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/sdk\.minepi\.com\/.*/i,
            handler: 'NetworkFirst',
            options: { cacheName: 'pi-sdk-cache' }
          }
        ]
      }
    })
  ].filter(Boolean),

  resolve: {
    alias: {
      '@': '/src',
      '@components': '/src/components',
      '@pages': '/src/pages'
    }
  },

  build: {
    outDir: 'dist',
    emptyOutDir: true, // Nettoie le dossier dist avant chaque build
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react')) return 'vendor-core';
            return 'vendor-utils';
          }
        },
        entryFileNames: 'assets/js/[name]-[hash].js',
        chunkFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]'
      }
    }
  },

  // ✅ Important pour les SDK Pi et FedaPay
  define: {
    'global': 'globalThis',
    'process.env': process.env, // Transmet toutes les variables d'env
    'process.env.VITE_API_URL': JSON.stringify(API_URL)
  }
});
