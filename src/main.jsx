// src/main.jsx
import React, { StrictMode, Suspense, startTransition } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

// 🎯 Styles globaux
import './index.css';

// 🎯 Providers (ordre important : Notification → Theme → Auth → Cart)
import { NotificationProvider, NotificationContainer, GlobalStyles } from './context/NotificationContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// 🎯 Application principale (lazy load pour code splitting)
const App = React.lazy(() => import('./App'));

// 🎯 Fallback de chargement pendant le lazy load
const LoadingFallback = () => (
  <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center transition-colors">
    <div className="text-center">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-900 rounded-full animate-pulse" />
        <div className="absolute inset-0 w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
      <p className="mt-4 text-slate-600 dark:text-slate-300 font-medium">
        Chargement de Double King Shop...
      </p>
      <p className="text-xs text-slate-400 mt-1">Bunia, Ituri • RDC</p>
    </div>
  </div>
);

// 🎯 Error Boundary pour capturer les erreurs React
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // 🎯 Logger l'erreur (à remplacer par Sentry/autre en prod)
    console.error('❌ ErrorBoundary caught an error:', error, errorInfo);
    
    // Optionnel : envoyer à un service de monitoring
    // if (import.meta.env.PROD) {    //   reportErrorToService(error, errorInfo);
    // }
    
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4 transition-colors">
          <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-[2rem] p-8 shadow-xl border border-slate-200 dark:border-slate-700 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">
              Oups ! Une erreur est survenue
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
              {this.state.error?.message || 'Erreur inattendue'}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition"
              >
                🔄 Recharger la page
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="px-6 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-sm transition"
              >
                🏠 Retour à l'accueil
              </button>
            </div>
            {import.meta.env.DEV && this.state.errorInfo && (
              <details className="mt-6 text-left">
                <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-600 dark:hover:text-slate-300">
                  Détails techniques (dev only)
                </summary>
                <pre className="mt-2 p-3 bg-slate-100 dark:bg-slate-900 rounded-lg text-[10px] overflow-auto max-h-40 text-slate-600 dark:text-slate-400">
                  {this.state.error?.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );    }

    return this.props.children;
  }
}

// 🎯 Initialisation de l'application
const initializeApp = async () => {
  // 🎯 Préchargement des ressources critiques
  if ('connection' in navigator) {
    const connection = navigator.connection;
    // Ne pas précharger si connexion lente
    if (connection?.saveData || connection?.effectiveType === '2g') {
      console.log('📶 Connexion lente : chargement minimal activé');
    }
  }

  // 🎯 Vérifier le support du navigateur
  if (!window.Promise || !window.fetch) {
    document.body.innerHTML = `
      <div style="text-align:center;padding:40px;font-family:sans-serif">
        <h2>🔧 Navigateur non supporté</h2>
        <p>Double King Shop nécessite un navigateur moderne.</p>
        <p>Mettez à jour Chrome, Firefox, Safari ou Edge.</p>
      </div>
    `;
    return;
  }

  // 🎯 Enregistrer le Service Worker (PWA)
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      console.log('✅ Service Worker enregistré:', registration.scope);
      
      // Écouter les mises à jour du SW
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // Nouvelle version disponible
            console.log('🔄 Nouvelle version disponible');
            // Optionnel : notifier l'utilisateur
            // showUpdateNotification();
          }
        });
      });
    } catch (error) {      console.error('❌ Échec enregistrement Service Worker:', error);
    }
  }

  // 🎯 Initialiser l'application dans un transition concurrente (React 18)
  startTransition(() => {
    renderApp();
  });
};

// 🎯 Rendu de l'application avec tous les providers
const renderApp = () => {
  const rootElement = document.getElementById('root');
  
  if (!rootElement) {
    console.error('❌ Élément #root non trouvé');
    return;
  }

  // 🎯 Créer la root React 18
  const root = createRoot(rootElement);

  // 🎯 Rendu avec StrictMode + ErrorBoundary + Providers
  root.render(
    <StrictMode>
      <ErrorBoundary>
        <NotificationProvider>
          <ThemeProvider>
            <AuthProvider>
              <CartProvider>
                <BrowserRouter 
                  basename={import.meta.env.BASE_URL}
                  future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
                >
                  {/* 🎯 Container des notifications (toujours visible) */}
                  <NotificationContainer position="top-right" />
                  
                  {/* 🎯 Global styles pour animations */}
                  <GlobalStyles />
                  
                  {/* 🎯 App avec lazy loading + Suspense */}
                  <Suspense fallback={<LoadingFallback />}>
                    <App />
                  </Suspense>
                </BrowserRouter>
              </CartProvider>
            </AuthProvider>
          </ThemeProvider>
        </NotificationProvider>
      </ErrorBoundary>    </StrictMode>
  );
};

// 🎯 Gestion de la visibilité de la page (pause/reprise)
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Page cachée : optionnel, pause des animations ou polling
    console.log('👁️ Page cachée');
  } else {
    // Page visible : reprendre les activités
    console.log('👁️ Page visible');
  }
});

// 🎯 Gestion de la déconnexion réseau
window.addEventListener('offline', () => {
  console.log('🔌 Hors ligne');
  // Optionnel : afficher une notification
});

window.addEventListener('online', () => {
  console.log('🔌 En ligne');
  // Optionnel : re-synchroniser les données
});

// 🎯 Démarrage de l'application
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// 🎯 Cleanup au déchargement de la page
window.addEventListener('beforeunload', () => {
  // Optionnel : sauvegarder l'état du panier ou autres données
  console.log('👋 Application fermée');
});