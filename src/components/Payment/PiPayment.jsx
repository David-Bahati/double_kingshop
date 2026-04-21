// src/components/Payment/PiPayment.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Wallet, Loader, CheckCircle, AlertCircle, X, 
  Copy, ExternalLink, Info, RefreshCw, Shield 
} from 'lucide-react';

import { piService } from '../../services/piService';
import { useCart } from '../../context/CartContext';
import { useNotification } from '../../context/NotificationContext';
import { CURRENCIES } from '../../utils/constants';

// 🎯 Configuration GCV (Global Consensus Value)
const GCV_CONFIG = {
  rate: 314159, // 1 Pi = 314,159 USD (taux GCV)
  decimals: 8,  // Précision Pi Network
  label: 'GCV Consensus'
};

const PiPayment = ({ 
  totalUsd: propTotalUsd, 
  cartItems = [], 
  customerInfo = {},
  onSuccess, 
  onError, 
  onCancel 
}) => {
  const { getCartTotal, clearCart } = useCart();
  const { showSuccess, showError, showInfo, showWarning } = useNotification();
  
  // 🎯 États
  const [piReady, setPiReady] = useState(false);
  const [piInitializing, setPiInitializing] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState('idle'); // idle | initializing | pending | completed | failed | cancelled
  const [paymentError, setPaymentError] = useState(null);
  const [showGcvInfo, setShowGcvInfo] = useState(false);
  const [copied, setCopied] = useState(false);

  // 🎯 Calculs
  const totalUsd = propTotalUsd ?? getCartTotal();
  const amountInPi = useCallback(() => {
    return (totalUsd / GCV_CONFIG.rate).toFixed(GCV_CONFIG.decimals);
  }, [totalUsd]);

  const piRate = useCallback(() => {
    return (1 / GCV_CONFIG.rate).toFixed(GCV_CONFIG.decimals + 2);
  }, []);

  // 🎯 Initialisation Pi SDK
  useEffect(() => {    let isMounted = true;
    let authCleanup = null;

    const initPi = async () => {
      try {
        setPiInitializing(true);
        
        // Attendre que Pi soit disponible
        await piService.initialize();
        
        if (!isMounted) return;
        
        if (window.Pi && typeof window.Pi.authenticate === 'function') {
          // Authentification avec scopes requis
          authCleanup = await window.Pi.authenticate(
            ['username', 'payments'], 
            handleIncompletePayment
          );
          
          if (isMounted) {
            setPiReady(true);
            showInfo('Pi Network prêt pour le paiement');
          }
        } else {
          throw new Error('Pi SDK non disponible');
        }
      } catch (error) {
        console.error('Erreur init Pi:', error);
        if (isMounted) {
          setPiReady(false);
          showError('Veuillez ouvrir cette page dans le Pi Browser pour payer avec Pi');
          onError?.('Pi Browser requis pour les paiements');
        }
      } finally {
        if (isMounted) {
          setPiInitializing(false);
        }
      }
    };

    initPi();

    // Cleanup
    return () => {
      isMounted = false;
      if (authCleanup && typeof authCleanup === 'function') {
        authCleanup();
      }
    };
  }, [showError, showInfo, onError]);
  // 🎯 Gestion paiement incomplet (récupération)
  const handleIncompletePayment = useCallback((payment) => {
    console.log('⚠️ Paiement incomplet détecté:', payment);
    showWarning('Un paiement précédent n\'a pas été finalisé. Veuillez contacter le support.');
    // Optionnel : envoyer au backend pour récupération
    // apiService.recoverIncompletePayment(payment.identifier);
  }, [showWarning]);

  // 🎯 Lancer le paiement
  const handlePayment = async () => {
    if (!piReady || paymentStatus !== 'idle') return;
    
    try {
      setPaymentStatus('initializing');
      setPaymentError(null);

      const memo = `DKS Order #${Date.now().toString().slice(-6)} • ${customerInfo.name || 'Client'}`;
      
      // Lancer le flux de paiement via piService
      await piService.createPayment(
        amountInPi(),
        memo,
        cartItems,
        {
          onReadyForServerApproval: async (paymentId) => {
            setPaymentStatus('pending');
            showInfo('Approbation en cours...');
            // Le backend approuve via apiService.approvePiPayment
            return true;
          },
          
          onReadyForServerCompletion: async (paymentId, txid) => {
            setPaymentStatus('completing');
            showInfo('Validation de la transaction...');
            // Le backend complète via apiService.completePiOrder
            return true;
          },
          
          onSuccess: (result) => {
            setPaymentStatus('completed');
            showSuccess('Paiement réussi ! Votre commande est confirmée.');
            clearCart();
            onSuccess?.(result);
          },
          
          onCancel: (paymentId) => {
            setPaymentStatus('cancelled');
            showInfo('Paiement annulé par l\'utilisateur');
            onCancel?.(paymentId);          },
          
          onError: (error, payment) => {
            setPaymentStatus('failed');
            setPaymentError(error?.message || 'Erreur de paiement');
            showError(error?.message || 'Échec du paiement. Veuillez réessayer.');
            onError?.(error);
          }
        }
      );
    } catch (error) {
      console.error('Erreur paiement Pi:', error);
      setPaymentStatus('failed');
      setPaymentError(error.message);
      showError(error.message || 'Erreur inattendue');
      onError?.(error);
    }
  };

  // 🎯 Copier l'adresse Pi (info)
  const handleCopyInfo = async () => {
    try {
      await navigator.clipboard.writeText(`Taux GCV: 1 Pi = ${GCV_CONFIG.rate.toLocaleString()} USD`);
      setCopied(true);
      showInfo('Information copiée');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showWarning('Impossible de copier');
    }
  };

  // 🎯 Réinitialiser pour nouvel essai
  const handleRetry = () => {
    if (paymentStatus === 'failed' || paymentStatus === 'cancelled') {
      setPaymentStatus('idle');
      setPaymentError(null);
    }
  };

  // 🎯 États de chargement
  if (piInitializing) {
    return (
      <div className="p-8 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
        <Loader className="animate-spin mx-auto mb-4 text-blue-600" size={32} />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Connexion à Pi Network...
        </p>
        <p className="text-[9px] text-slate-300 mt-2">
          Assurez-vous d'utiliser le Pi Browser
        </p>      </div>
    );
  }

  // 🎯 Pi non disponible
  if (!piReady) {
    return (
      <div className="p-6 text-center bg-amber-50 rounded-[2rem] border border-amber-200">
        <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle size={24} className="text-amber-600" />
        </div>
        <h3 className="font-bold text-amber-800 mb-2">Pi Browser requis</h3>
        <p className="text-sm text-amber-700 mb-4">
          Pour payer avec Pi Network, ouvrez cette page dans l'application Pi Browser.
        </p>
        <a
          href="https://minepi.com/browser"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700 transition"
        >
          <ExternalLink size={14} /> Ouvrir Pi Browser
        </a>
      </div>
    );
  }

  // 🎯 Paiement complété
  if (paymentStatus === 'completed') {
    return (
      <div className="p-8 text-center bg-emerald-50 rounded-[2rem] border border-emerald-200">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-emerald-600" />
        </div>
        <h3 className="font-black text-emerald-800 text-lg mb-2">Paiement Réussi !</h3>
        <p className="text-sm text-emerald-700 mb-4">
          Votre commande a été confirmée. Un reçu vous sera envoyé.
        </p>
        <div className="p-3 bg-white rounded-xl border border-emerald-100 mb-4">
          <p className="text-xs text-slate-500">Montant payé</p>
          <p className="text-xl font-black text-emerald-600">{amountInPi()} Π</p>
          <p className="text-[10px] text-slate-400">≈ ${totalUsd.toFixed(2)} USD</p>
        </div>
        <button
          onClick={() => window.location.href = '/orders'}
          className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition"
        >
          Voir ma commande
        </button>
      </div>    );
  }

  // 🎯 Erreur de paiement
  if (paymentStatus === 'failed' && paymentError) {
    return (
      <div className="p-6 text-center bg-red-50 rounded-[2rem] border border-red-200">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle size={24} className="text-red-600" />
        </div>
        <h3 className="font-bold text-red-800 mb-2">Échec du paiement</h3>
        <p className="text-sm text-red-700 mb-4">{paymentError}</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition flex items-center gap-2"
          >
            <RefreshCw size={14} /> Réessayer
          </button>
          <button
            onClick={() => onCancel?.()}
            className="px-4 py-2 bg-white border border-red-200 text-red-700 rounded-xl text-xs font-bold hover:bg-red-50 transition"
          >
            Annuler
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-500 to-amber-600 p-5 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-xl">
            <Wallet size={20} />
          </div>
          <div>
            <h3 className="font-black uppercase tracking-tight flex items-center gap-2">
              Paiement Pi Network
              {showGcvInfo && (
                <span className="text-[10px] font-normal bg-white/20 px-2 py-0.5 rounded-full">
                  {GCV_CONFIG.label}
                </span>
              )}
            </h3>
            <p className="text-yellow-100 text-xs">Paiement crypto sécurisé</p>
          </div>        </div>
        
        {/* Info GCV toggle */}
        <button
          onClick={() => setShowGcvInfo(!showGcvInfo)}
          className="p-2 hover:bg-white/20 rounded-full transition"
          title="Info taux GCV"
        >
          <Info size={18} />
        </button>
      </div>

      {/* Contenu */}
      <div className="p-6 space-y-6">
        
        {/* Info GCV (expandable) */}
        {showGcvInfo && (
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 animate-fadeIn">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-blue-800 mb-1">Taux GCV (Global Consensus Value)</p>
                <p className="text-sm text-blue-700">
                  1 Π = <span className="font-black">{GCV_CONFIG.rate.toLocaleString()}</span> USD
                </p>
                <p className="text-[10px] text-blue-500 mt-1">
                  Taux de consensus utilisé par la communauté Pi pour les échanges réels.
                </p>
              </div>
              <button
                onClick={handleCopyInfo}
                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                title="Copier l'info"
              >
                {copied ? <CheckCircle size={16} className="text-emerald-600" /> : <Copy size={16} />}
              </button>
            </div>
          </div>
        )}

        {/* Montant à payer */}
        <div className="text-center p-6 bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2rem] text-white">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
            Montant à payer (taux GCV)
          </p>
          <div className="flex items-baseline justify-center gap-2">
            <span className="text-4xl font-black text-yellow-400">{amountInPi()}</span>
            <span className="text-2xl font-black text-yellow-300">Π</span>
          </div>
          <p className="text-sm text-slate-400 mt-2">
            ≈ <span className="font-bold text-white">${totalUsd.toFixed(2)} USD</span>          </p>
          
          {/* Détail taux */}
          <p className="text-[10px] text-slate-500 mt-3 font-mono">
            1 Π = {piRate()} USD • Précision: {GCV_CONFIG.decimals} décimales
          </p>
        </div>

        {/* Statut du paiement */}
        {paymentStatus === 'initializing' && (
          <div className="flex items-center justify-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <Loader className="animate-spin text-blue-600" size={20} />
            <p className="text-sm font-bold text-blue-700">Ouverture du wallet Pi...</p>
          </div>
        )}
        
        {paymentStatus === 'pending' && (
          <div className="flex items-center justify-center gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200">
            <Loader className="animate-spin text-amber-600" size={20} />
            <p className="text-sm font-bold text-amber-700">En attente de confirmation dans votre wallet...</p>
          </div>
        )}

        {paymentStatus === 'completing' && (
          <div className="flex items-center justify-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
            <Loader className="animate-spin text-emerald-600" size={20} />
            <p className="text-sm font-bold text-emerald-700">Validation de la transaction...</p>
          </div>
        )}

        {/* Bouton Payer */}
        <button
          onClick={handlePayment}
          disabled={paymentStatus !== 'idle' || !piReady}
          className={`
            w-full py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all 
            flex items-center justify-center gap-3 shadow-lg
            ${paymentStatus !== 'idle' || !piReady
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
              : 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white hover:from-yellow-600 hover:to-amber-700 shadow-amber-200 active:scale-[0.98]'
            }
          `}
        >
          {paymentStatus === 'idle' ? (
            <>
              <Wallet size={18} />
              Confirmer et Payer {amountInPi()} Π
            </>
          ) : paymentStatus === 'initializing' ? (
            <>              <Loader className="animate-spin" size={18} />
              Initialisation...
            </>
          ) : paymentStatus === 'pending' ? (
            <>
              <Loader className="animate-spin" size={18} />
              Confirmez dans le wallet...
            </>
          ) : paymentStatus === 'completing' ? (
            <>
              <Loader className="animate-spin" size={18} />
              Validation...
            </>
          ) : (
            'Traitement...'
          )}
        </button>

        {/* Sécurité & Info */}
        <div className="flex items-center justify-center gap-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2 text-[10px] text-slate-400">
            <Shield size={12} className="text-emerald-500" />
            <span>Paiement sécurisé Pi Network</span>
          </div>
          <button
            onClick={() => window.open('https://minepi.com', '_blank')}
            className="flex items-center gap-1 text-[10px] text-blue-600 hover:underline"
          >
            Qu'est-ce que Pi ? <ExternalLink size={10} />
          </button>
        </div>

        {/* Footer DKS */}
        <div className="text-center pt-2">
          <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">
            Double King Shop • Bunia • GCV Consensus
          </p>
        </div>
      </div>

      {/* 🎨 Animations CSS */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
      `}</style>
    </div>
  );
};

export default PiPayment;