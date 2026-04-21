// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// 🎯 Configuration de l'environnement
const isProduction = process.env.NODE_ENV === 'production';
const API_URL = process.env.VITE_API_URL || 'http://localhost:3001';

export default defineConfig({
  // 🎯 Plugins
  plugins: [
    react(),
    
    // 📱 PWA Plugin (Production uniquement)
    isProduction && VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png', 'robots.txt'],
      manifest: {
        name: 'Double King Shop',
        short_name: 'DKS',
        description: 'Votre boutique informatique professionnelle à Bunia, Ituri. Paiements Pi Network, Mobile Money et Cash.',
        theme_color: '#2563eb',
        background_color: '#f8fafc',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        scope: '/',
        lang: 'fr',
        categories: ['shopping', 'business', 'finance'],
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        screenshots: [
          {
            src: '/screenshots/home-light.png',
            sizes: '1280x720',
            type: 'image/png',
            form_factor: 'wide'          },
          {
            src: '/screenshots/home-dark.png',
            sizes: '1280x720',
            type: 'image/png',
            form_factor: 'wide'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
        runtimeCaching: [
          {
            // 🥧 Pi Network SDK - Network first
            urlPattern: /^https:\/\/sdk\.minepi\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pi-sdk-cache',
              expiration: { maxEntries: 5, maxAgeSeconds: 60 * 60 * 24 }, // 1 jour
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            // 💳 FedaPay API - Network first
            urlPattern: /^https:\/\/api\.fedapay\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'fedapay-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 30 }, // 30 min
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            // 🖼️ Images externes - Cache first
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 7 }, // 7 jours
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            // 📦 API locale - Network first avec fallback cache
            urlPattern: /^\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 5 }, // 5 min
              cacheableResponse: { statuses: [0, 200] }            }
          }
        ],
        // Exclure les routes admin du cache (données sensibles)
        navigateFallbackDenylist: [/^\/admin\/.*/, /^\/login/, /^\/checkout/]
      },
      // Options de développement
      devOptions: {
        enabled: false, // Désactiver en dev pour éviter les conflits de cache
        type: 'module',
        navigateFallback: '/'
      }
    })
  ].filter(Boolean), // Filtre les plugins null (PWA en prod seulement)

  // 🎯 Résolution des modules
  resolve: {
    alias: {
      '@': '/src',
      '@components': '/src/components',
      '@pages': '/src/pages',
      '@context': '/src/context',
      '@services': '/src/services',
      '@utils': '/src/utils',
      '@assets': '/src/assets'
    }
  },

  // 🎯 Configuration du serveur de développement
  server: {
    host: '0.0.0.0', // Accessible depuis le réseau local
    port: 3000,
    strictPort: true, // Erreur si le port est déjà utilisé
    open: true, // Ouvrir le navigateur au démarrage
    hmr: {
      host: 'localhost',
      protocol: 'ws'
    },
    // 🔗 Proxy API vers le backend
    proxy: {
      '/api': {
        target: API_URL,
        changeOrigin: true,
        secure: false, // Pour le développement avec HTTP
        ws: true, // Support WebSocket si besoin
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('❌ Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {            console.log('📤 Proxy request:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('📥 Proxy response:', proxyRes.statusCode, req.url);
          });
        }
      }
    },
    // 🗂️ Watch les fichiers pour le hot reload
    watch: {
      usePolling: true, // Utile pour Docker/WSL
      ignored: ['**/node_modules/**', '**/.git/**', '**/dist/**']
    }
  },

  // 🎯 Configuration du build de production
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    
    // 🗜️ Minification et optimisation
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: isProduction, // Supprimer les console.log en prod
        drop_debugger: isProduction
      },
      format: {
        comments: false // Supprimer les commentaires
      }
    },
    
    // 📦 Chunk splitting pour le code splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // 🔧 Vendor libraries
          'vendor-core': ['react', 'react-dom', 'react-router-dom'],
          'vendor-state': ['recharts'],
          'vendor-icons': ['lucide-react'],
          'vendor-utils': ['axios'],
          
          // 🥧 Pi Network SDK (lazy load)
          'pi-sdk': ['pi-sdk'],
          
          // 💳 FedaPay (lazy load)
          'fedapay': ['fedapay']
        },
        // 🎨 Nommage des assets avec hash pour le cache busting        entryFileNames: 'assets/js/[name]-[hash].js',
        chunkFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'assets/css/[name]-[hash][extname]';
          }
          if (/\.(png|jpe?g|gif|svg|webp)$/.test(assetInfo.name || '')) {
            return 'assets/images/[name]-[hash][extname]';
          }
          if (/\.(woff2?|eot|ttf|otf)$/.test(assetInfo.name || '')) {
            return 'assets/fonts/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        }
      }
    },
    
    // 🗜️ Compression des assets
    assetsInlineLimit: 4096, // Inline les fichiers <4KB
    cssCodeSplit: true, // Split CSS par chunk JS
    sourcemap: !isProduction, // Sourcemaps uniquement en dev
    
    // 🚀 Options avancées
    reportCompressedSize: true,
    chunkSizeWarningLimit: 1000 // Avertissement si chunk >1MB
  },

  // 🎯 Optimisation des dépendances (pre-bundling)
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'lucide-react',
      'recharts'
    ],
    exclude: ['pi-sdk', 'fedapay'], // Exclure les SDK externes du pre-bundling
    esbuildOptions: {
      target: 'es2020',
      define: {
        global: 'globalThis'
      }
    }
  },

  // 🎯 Configuration CSS
  css: {
    modules: {
      localsConvention: 'camelCaseOnly',
      generateScopedName: isProduction ? '[hash:base64:8]' : '[name]__[local]'    },
    postcss: {
      plugins: [
        // Ajoute Tailwind ici si tu l'utilises
        // require('tailwindcss'),
        // require('autoprefixer'),
      ]
    },
    preprocessorOptions: {
      // Variables SCSS globales si tu utilises SCSS
      // scss: { additionalData: `@import "@/styles/variables.scss";` }
    }
  },

  // 🎯 Variables d'environnement
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    'process.env.VITE_API_URL': JSON.stringify(API_URL),
    'process.env.VITE_APP_VERSION': JSON.stringify(process.env.npm_package_version || '1.0.0')
  },

  // 🎯 Logging personnalisé
  customLogger: {
    info: (msg, options) => {
      if (msg.includes('built in')) {
        console.log(`✅ Build terminé en ${msg.split('in ')[1]}`);
      } else {
        console.log(msg, options);
      }
    },
    warn: (msg, options) => console.warn('⚠️', msg, options),
    error: (msg, options) => console.error('❌', msg, options),
    clearScreen: false,
    hasErrorLogged: () => false,
    hasWarned: false
  }
});