// src/components/Payment/MobileMoneyPayment.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Smartphone, CreditCard, Loader, CheckCircle, AlertCircle, X, 
  Phone, MapPin, DollarSign, RefreshCw, ExternalLink, Shield, Info
} from 'lucide-react';

import { useCart } from '../../context/CartContext';
import { useNotification } from '../../context/NotificationContext';
import { CURRENCIES } from '../../utils/constants';
import apiService from '../../services/api';

// 🎯 Configuration des opérateurs RDC
const OPERATORS = {
  vodacom: { 
    name: 'M-Pesa', 
    prefix: ['08', '09'], 
    color: 'from-red-500 to-red-600',
    icon: '📱',
    fee: 0.02 // 2% de frais
  },
  airtel: { 
    name: 'Airtel Money', 
    prefix: ['09'], 
    color: 'from-red-400 to-red-500',
    icon: '💰',
    fee: 0.015
  },
  orange: { 
    name: 'Orange Money', 
    prefix: ['08'], 
    color: 'from-orange-400 to-orange-500',
    icon: '🧡',
    fee: 0.02
  },
  africell: { 
    name: 'Africell Money', 
    prefix: ['09'], 
    color: 'from-green-500 to-green-600',
    icon: '🌍',
    fee: 0.015
  }
};

// 🎯 Validation numéro RDC
const validateDRCPhone = (phone, operator) => {
  const clean = phone.replace(/\D/g, '');
  const prefixes = OPERATORS[operator]?.prefix || [];
  
  // Format: 08/09 + 7 chiffres = 9 chiffres total  if (clean.length !== 9) return false;
  if (!prefixes.includes(clean.slice(0, 2))) return false;
  
  return true;
};

const MobileMoneyPayment = ({ 
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
  const [provider, setProvider] = useState('vodacom');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('idle'); // idle | initializing | pending | polling | completed | failed | cancelled
  const [paymentError, setPaymentError] = useState(null);
  const [transactionId, setTransactionId] = useState(null);
  const [showOperatorInfo, setShowOperatorInfo] = useState(false);
  
  // 🎯 Refs pour polling
  const pollIntervalRef = useRef(null);
  const isMountedRef = useRef(true);

  // 🎯 Calculs
  const totalUsd = propTotalUsd ?? getCartTotal();
  const cdfRate = CURRENCIES?.CDF?.rate || 2850;
  const totalCdf = totalUsd * cdfRate;
  const operatorFee = totalUsd * (OPERATORS[provider]?.fee || 0);
  const totalWithFee = totalUsd + operatorFee;

  // 🎯 Mise à jour préfixe selon opérateur
  useEffect(() => {
    const prefix = OPERATORS[provider]?.prefix?.[0] || '08';
    if (!phoneNumber.startsWith(prefix)) {
      setPhoneNumber(prefix);
    }
  }, [provider]);

  // 🎯 Cleanup polling au démontage
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);      }
    };
  }, []);

  // 🎯 Validation en temps réel
  const phoneValidation = useCallback(() => {
    const clean = phoneNumber.replace(/\D/g, '');
    
    if (clean.length === 0) return { valid: false, message: '' };
    if (clean.length < 9) return { valid: false, message: `${9 - clean.length} chiffre(s) manquant(s)` };
    if (clean.length > 9) return { valid: false, message: 'Numéro trop long' };
    
    const prefixes = OPERATORS[provider]?.prefix || [];
    if (!prefixes.includes(clean.slice(0, 2))) {
      return { valid: false, message: `Préfixe invalide pour ${OPERATORS[provider]?.name}` };
    }
    
    return { valid: true, message: '✓ Numéro valide' };
  }, [phoneNumber, provider]);

  const validation = phoneValidation();

  // 🎯 Lancer le paiement
  const handlePayment = async () => {
    if (!validation.valid) {
      showWarning(validation.message || 'Numéro de téléphone invalide');
      return;
    }

    if (!customerInfo.name?.trim()) {
      showWarning('Veuillez entrer votre nom');
      return;
    }

    try {
      setPaymentStatus('initializing');
      setPaymentError(null);
      setLoading(true);

      // Initier la transaction via FedaPay
      const response = await apiService.initiateMobileMoney({
        phoneNumber: phoneNumber.replace(/\D/g, ''),
        provider,
        amountUSD: totalWithFee,
        amountCDF: totalCdf,
        currency: 'CDF',
        customer: {
          name: customerInfo.name,
          phone: phoneNumber,
          email: customerInfo.email || null        },
        items: cartItems,
        metadata: {
          shopName: 'Double King Shop',
          location: 'Bunia, Ituri',
          gcvRate: CURRENCIES?.PI?.rate || 314159
        }
      });

      if (!response.success || !response.url) {
        throw new Error(response.error || 'Échec de l\'initiation du paiement');
      }

      setTransactionId(response.transaction_id);
      setPaymentStatus('pending');
      showInfo('Redirection vers la caisse sécurisée...');

      // Ouvrir la page de paiement FedaPay
      const popup = window.open(response.url, '_blank', 'width=450,height=650');
      
      if (!popup || popup.closed) {
        throw new Error('Impossible d\'ouvrir la page de paiement. Vérifiez vos bloqueurs de popup.');
      }

      // 🎯 Démarrer le polling pour vérifier le statut
      startPolling(response.transaction_id);

    } catch (error) {
      console.error('Erreur paiement Mobile Money:', error);
      setPaymentStatus('failed');
      setPaymentError(error.message);
      showError(error.message || 'Échec de l\'initiation du paiement');
      onError?.(error);
    } finally {
      setLoading(false);
    }
  };

  // 🎯 Polling pour vérifier le statut de paiement
  const startPolling = useCallback((transactionId) => {
    setPaymentStatus('polling');
    
    pollIntervalRef.current = setInterval(async () => {
      try {
        const response = await apiService.verifyMobileMoney(transactionId);
        
        if (response.status === 'completed' || response.status === 'success') {
          // Paiement réussi
          clearInterval(pollIntervalRef.current);
          setPaymentStatus('completed');          showSuccess('Paiement confirmé ! Votre commande est validée.');
          clearCart();
          onSuccess?.(response);
        } else if (response.status === 'failed' || response.status === 'cancelled') {
          // Paiement échoué ou annulé
          clearInterval(pollIntervalRef.current);
          setPaymentStatus(response.status === 'cancelled' ? 'cancelled' : 'failed');
          setPaymentError(response.message || 'Paiement non confirmé');
          if (response.status === 'cancelled') {
            showInfo('Paiement annulé');
            onCancel?.(response);
          } else {
            showError(response.message || 'Échec du paiement');
            onError?.(new Error(response.message));
          }
        }
        // Si 'pending', continuer le polling
      } catch (error) {
        console.error('Erreur polling:', error);
        // Continuer le polling en cas d'erreur réseau temporaire
      }
    }, 3000); // Vérifier toutes les 3 secondes

    // Timeout après 5 minutes
    setTimeout(() => {
      if (pollIntervalRef.current && paymentStatus === 'polling') {
        clearInterval(pollIntervalRef.current);
        setPaymentStatus('failed');
        setPaymentError('Délai d\'attente dépassé. Veuillez vérifier votre transaction.');
        showWarning('Délai d\'attente dépassé. Contactez le support si nécessaire.');
      }
    }, 5 * 60 * 1000);
  }, [paymentStatus, showSuccess, showError, showInfo, showWarning, onSuccess, onError, onCancel, clearCart]);

  // 🎯 Réinitialiser pour nouvel essai
  const handleRetry = () => {
    if (['failed', 'cancelled'].includes(paymentStatus)) {
      setPaymentStatus('idle');
      setPaymentError(null);
      setTransactionId(null);
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    }
  };

  // 🎯 Copier info opérateur
  const handleCopyOperatorInfo = async () => {
    const info = `${OPERATORS[provider]?.name}: Numéro doit commencer par ${OPERATORS[provider]?.prefix?.join(' ou ')} + 7 chiffres`;
    try {      await navigator.clipboard.writeText(info);
      showInfo('Information copiée');
    } catch {
      showWarning('Impossible de copier');
    }
  };

  // 🎯 Loading state helper
  const isLoading = paymentStatus === 'initializing' || paymentStatus === 'pending' || paymentStatus === 'polling';

  // 🎯 Rendu: Paiement complété
  if (paymentStatus === 'completed') {
    return (
      <div className="p-8 text-center bg-emerald-50 rounded-[2.5rem] border border-emerald-200">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-emerald-600" />
        </div>
        <h3 className="font-black text-emerald-800 text-lg mb-2">Paiement Réussi !</h3>
        <p className="text-sm text-emerald-700 mb-4">
          Votre commande a été confirmée via {OPERATORS[provider]?.name}.
        </p>
        <div className="p-4 bg-white rounded-xl border border-emerald-100 mb-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Montant</span>
            <span className="font-bold text-slate-900">{totalCdf.toLocaleString()} FC</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Frais</span>
            <span className="font-bold text-slate-900">{(operatorFee * cdfRate).toLocaleString()} FC</span>
          </div>
          <div className="border-t border-emerald-100 pt-2 flex justify-between">
            <span className="font-black text-slate-900">Total</span>
            <span className="font-black text-emerald-600">{(totalWithFee * cdfRate).toLocaleString()} FC</span>
          </div>
        </div>
        {transactionId && (
          <p className="text-[10px] text-slate-400 font-mono mb-4">
            Transaction: {transactionId.slice(0, 12)}...
          </p>
        )}
        <button
          onClick={() => window.location.href = '/orders'}
          className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition"
        >
          Voir ma commande
        </button>
      </div>
    );
  }
  // 🎯 Rendu: Échec ou annulation
  if ((paymentStatus === 'failed' || paymentStatus === 'cancelled') && paymentError) {
    return (
      <div className="p-6 text-center bg-red-50 rounded-[2.5rem] border border-red-200">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle size={24} className="text-red-600" />
        </div>
        <h3 className="font-bold text-red-800 mb-2">
          {paymentStatus === 'cancelled' ? 'Paiement Annulé' : 'Échec du Paiement'}
        </h3>
        <p className="text-sm text-red-700 mb-4">{paymentError}</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition flex items-center gap-2"
          >
            <RefreshCw size={14} /> Réessayer
          </button>
          <button
            onClick={() => { onCancel?.(); handleRetry(); }}
            className="px-4 py-2 bg-white border border-red-200 text-red-700 rounded-xl text-xs font-bold hover:bg-red-50 transition"
          >
            Changer de méthode
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden">
      
      {/* Header */}
      <div className={`bg-gradient-to-r ${OPERATORS[provider]?.color} p-5 text-white flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-xl">
            <Smartphone size={20} />
          </div>
          <div>
            <h3 className="font-black uppercase tracking-tight flex items-center gap-2">
              {OPERATORS[provider]?.icon} {OPERATORS[provider]?.name}
              {showOperatorInfo && (
                <span className="text-[10px] font-normal bg-white/20 px-2 py-0.5 rounded-full">
                  RDC • Bunia
                </span>
              )}
            </h3>
            <p className="text-white/90 text-xs">Paiement mobile sécurisé</p>
          </div>
        </div>        
        {/* Info toggle */}
        <button
          onClick={() => setShowOperatorInfo(!showOperatorInfo)}
          className="p-2 hover:bg-white/20 rounded-full transition"
          title="Info opérateur"
        >
          <Info size={18} />
        </button>
      </div>

      {/* Contenu */}
      <div className="p-6 space-y-6">
        
        {/* Info opérateur (expandable) */}
        {showOperatorInfo && (
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 animate-fadeIn">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-blue-800 mb-1">Format numéro {OPERATORS[provider]?.name}</p>
                <p className="text-sm text-blue-700 font-mono">
                  {OPERATORS[provider]?.prefix?.join(' ou ')} + 7 chiffres
                </p>
                <p className="text-[10px] text-blue-500 mt-1">
                  Ex: {OPERATORS[provider]?.prefix?.[0]}40 123 456
                </p>
              </div>
              <button
                onClick={handleCopyOperatorInfo}
                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                title="Copier le format"
              >
                <Smartphone size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Sélection opérateur */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-3 flex items-center gap-1">
            <CreditCard size={12} /> Choisir l'opérateur
          </label>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(OPERATORS).map(([key, op]) => (
              <button
                key={key}
                onClick={() => setProvider(key)}
                disabled={isLoading}
                className={`p-4 rounded-2xl border-2 transition-all text-left disabled:opacity-50 ${                  provider === key
                    ? `border-${key === 'vodacom' ? 'red' : key === 'airtel' ? 'red' : key === 'orange' ? 'orange' : 'green'}-500 bg-${key === 'vodacom' ? 'red' : key === 'airtel' ? 'red' : key === 'orange' ? 'orange' : 'green'}-50`
                    : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{op.icon}</span>
                  <span className={`font-bold text-sm ${provider === key ? `text-${key === 'vodacom' ? 'red' : key === 'airtel' ? 'red' : key === 'orange' ? 'orange' : 'green'}-700` : 'text-slate-700'}`}>
                    {op.name}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Frais: {(op.fee * 100).toFixed(1)}%
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Champ numéro de téléphone */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 flex items-center gap-1">
            <Phone size={12} /> Numéro de téléphone
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
              +243
            </span>
            <input
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={9}
              value={phoneNumber}
              onChange={(e) => {
                const clean = e.target.value.replace(/\D/g, '').slice(0, 9);
                setPhoneNumber(clean);
                if (paymentError) setPaymentError(null);
              }}
              disabled={isLoading}
              placeholder="8XX XXX XXX"
              className={`w-full pl-14 pr-4 py-4 bg-slate-50 border rounded-2xl text-lg font-bold outline-none transition-all focus:ring-2 ${
                validation.valid 
                  ? 'border-slate-200 focus:ring-green-500 focus:border-green-400' 
                  : phoneNumber.length > 0 
                    ? 'border-red-300 focus:ring-red-200' 
                    : 'border-slate-200 focus:ring-blue-500'
              }`}
            />
          </div>          
          {/* Validation message */}
          {phoneNumber.length > 0 && (
            <p className={`text-[10px] mt-2 ml-1 flex items-center gap-1 ${validation.valid ? 'text-emerald-600' : 'text-red-500'}`}>
              {validation.valid ? <CheckCircle size={10} /> : <AlertCircle size={10} />}
              {validation.message}
            </p>
          )}
          
          {/* Format hint */}
          {!validation.message && phoneNumber.length === 0 && (
            <p className="text-[10px] text-slate-400 mt-2 ml-1">
              Format: {OPERATORS[provider]?.prefix?.[0]}XX XXX XXX
            </p>
          )}
        </div>

        {/* Montant à payer */}
        <div className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2rem] text-white text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
            Total à payer ({OPERATORS[provider]?.name})
          </p>
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-3xl font-black text-white">{totalCdf.toLocaleString('fr-FR')}</span>
            <span className="text-xl font-black text-green-400">FC</span>
          </div>
          <p className="text-sm text-slate-400 mt-2">
            ≈ <span className="font-bold text-white">${totalWithFee.toFixed(2)} USD</span>
          </p>
          
          {/* Détail frais */}
          {operatorFee > 0 && (
            <p className="text-[10px] text-slate-500 mt-3">
              Dont frais {(OPERATORS[provider]?.fee * 100).toFixed(1)}%: {(operatorFee * cdfRate).toLocaleString('fr-FR')} FC
            </p>
          )}
          
          {/* Taux de change */}
          <p className="text-[9px] text-slate-600 mt-2 font-mono">
            Taux: 1 USD = {cdfRate.toLocaleString('fr-FR')} FC
          </p>
        </div>

        {/* Statut du paiement */}
        {paymentStatus === 'initializing' && (
          <div className="flex items-center justify-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <Loader className="animate-spin text-blue-600" size={20} />
            <p className="text-sm font-bold text-blue-700">Connexion à {OPERATORS[provider]?.name}...</p>
          </div>
        )}        
        {paymentStatus === 'pending' && (
          <div className="flex items-center justify-center gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200">
            <ExternalLink className="text-amber-600" size={20} />
            <p className="text-sm font-bold text-amber-700">Veuillez confirmer dans la fenêtre ouverte</p>
          </div>
        )}
        
        {paymentStatus === 'polling' && (
          <div className="flex items-center justify-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
            <Loader className="animate-spin text-emerald-600" size={20} />
            <p className="text-sm font-bold text-emerald-700">Vérification du paiement en cours...</p>
  </div>
        )}

        {/* Bouton Payer */}
        <button
          onClick={handlePayment}
          disabled={isLoading || !validation.valid || !customerInfo.name?.trim()}
          className={`
            w-full py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all 
            flex items-center justify-center gap-3 shadow-lg
            ${isLoading || !validation.valid || !customerInfo.name?.trim()
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
              : `bg-gradient-to-r ${OPERATORS[provider]?.color} text-white hover:opacity-90 shadow-${provider === 'vodacom' ? 'red' : provider === 'airtel' ? 'red' : provider === 'orange' ? 'orange' : 'green'}-200 active:scale-[0.98]`
            }
          `}
        >
          {isLoading ? (
            paymentStatus === 'polling' ? (
              <>
                <Loader className="animate-spin" size={18} />
                Vérification...
              </>
            ) : (
              <>
                <Loader className="animate-spin" size={18} />
                Traitement...
              </>
            )
          ) : (
            <>
              <Smartphone size={18} />
              Payer {totalCdf.toLocaleString('fr-FR')} FC
            </>
          )}
        </button>

        {/* Sécurité & Info */}
        <div className="flex items-center justify-center gap-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2 text-[10px] text-slate-400">
            <Shield size={12} className="text-emerald-500" />
            <span>Paiement sécurisé FedaPay</span>
          </div>
          <button
            onClick={() => window.open('https://fedapay.com', '_blank')}
            className="flex items-center gap-1 text-[10px] text-blue-600 hover:underline"
          >
            Qu'est-ce que FedaPay ? <ExternalLink size={10} />
          </button>
        </div>

        {/* Footer DKS */}
        <div className="text-center pt-2">
          <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">
            Double King Shop • Bunia, Ituri • RDC
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

export default MobileMoneyPayment;