import React, { useState, useEffect } from 'react';
import { piService } from '../../services/piService';
import { useCart } from '../../context/CartContext';
import { CURRENCIES } from '../../utils/constants';

const PiPayment = ({ onSuccess, onError }) => {
  const [loading, setLoading] = useState(false);
  const [piReady, setPiReady] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const { getCartTotal, clearCart, cartItems } = useCart();

  // --- CONFIGURATION GCV ---
  const GCV_VALUE = 314159; 

  useEffect(() => {
    const init = async () => {
      try {
        await piService.initialize();
        
        if (window.Pi) {
          await window.Pi.authenticate(['username', 'payments'], (payment) => {
            console.log("Paiement incomplet (Client) :", payment);
          });
          console.log("✅ Client Double King Shop authentifié");
        }
        
        setPiReady(true);
      } catch (error) {
        setPiReady(false);
        console.error("Erreur Initialisation:", error);
        if (onError) onError('Veuillez utiliser le Pi Browser.');
      }
    };
    init();
  }, [onError]);

  const handlePayment = async () => {
    try {
      setLoading(true);
      setPaymentStatus('initializing');

      const totalAmountUSD = getCartTotal();
      // Calcul GCV : Montant en USD divisé par 314,159
      const amountInPi = (totalAmountUSD / GCV_VALUE).toFixed(8);

      await piService.createPayment(
        amountInPi, 
        `DKS Order #${Date.now()} (GCV)`,
        cartItems,
        {
          onSuccess: (result) => {
  setPaymentStatus('completed');
  clearCart();
  
  // ✅ AJOUTE CECI : Pour informer l'utilisateur et rafraîchir
  alert("Paiement réussi ! Votre commande est en cours de préparation.");
  
  // Redirige vers le tableau de bord ou l'accueil
  window.location.href = "/admin/dashboard"; 
  
  if (onSuccess) onSuccess(result);
  setLoading(false);
},

          onCancel: () => {
            setPaymentStatus(null);
            setLoading(false);
          },
          onError: (err) => {
            setPaymentStatus('failed');
            setLoading(false);
            if (onError) onError(err);
          }
        }
      );

    } catch (error) {
      setLoading(false);
      setPaymentStatus('failed');
      console.error('Erreur Paiement:', error);
      if (onError) onError(error.message);
    }
  };

  if (!piReady) {
    return (
      <div className="p-8 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600 mx-auto mb-4"></div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Initialisation Pi Network...</p>
      </div>
    );
  }

  const totalAmountUSD = getCartTotal();
  const amountInPi = (totalAmountUSD / GCV_VALUE).toFixed(8);

  return (
    <div className="bg-white rounded-3xl p-8 shadow-2xl border border-gray-100">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-xl font-black text-gray-900 italic uppercase tracking-tighter">Paiement Pi (GCV)</h3>
        <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">Mainnet Ready</span>
      </div>

      <div className="mb-8 p-6 bg-slate-900 rounded-3xl text-center shadow-inner">
        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Montant au taux GCV</p>
        {/* Affichage avec 8 décimales pour la précision GCV */}
        <p className="text-3xl font-black text-yellow-500 mb-1">{amountInPi} Π</p>
        <p className="text-xs text-gray-400 font-bold italic">≈ {totalAmountUSD.toFixed(2)} $ USD</p>
      </div>

      {paymentStatus && paymentStatus !== 'completed' && (
        <div className="mb-6 p-4 bg-blue-50 rounded-2xl text-[11px] text-blue-700 font-black uppercase text-center animate-pulse">
           {paymentStatus === 'initializing' ? '⏳ Ouverture du Wallet Pi...' : 'En attente de confirmation...'}
        </div>
      )}

      <button
        onClick={handlePayment}
        disabled={loading || paymentStatus === 'completed'}
        className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 shadow-xl ${
          loading || paymentStatus === 'completed'
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-blue-600 text-white shadow-blue-100 hover:bg-blue-700'
        }`}
      >
        {loading ? 'Traitement...' : 'Confirmer et Payer'}
      </button>

      <div className="mt-8 pt-6 border-t border-gray-100 text-center">
        <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.2em]">Double King Shop • GCV Consensus</p>
      </div>
    </div>
  );
};

export default PiPayment;
