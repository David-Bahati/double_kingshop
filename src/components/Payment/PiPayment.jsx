import React, { useState, useEffect } from 'react';
import { piService } from '../../services/piService';
import { useCart } from '../../context/CartContext';
import { CURRENCIES } from '../../utils/constants';

const PiPayment = ({ onSuccess, onError }) => {
  const [loading, setLoading] = useState(false);
  const [piReady, setPiReady] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const { getCartTotal, clearCart } = useCart();

  useEffect(() => {
    const init = async () => {
      try {
        await piService.initialize();
        setPiReady(true);
      } catch (error) {
        console.error('Pi initialization failed:', error);
        setPaymentStatus('failed');
        if (onError) onError('Pi Network non disponible');
      }
    };
    init();
  }, [onError]);

  const handlePayment = async () => {
    try {
      setLoading(true);
      setPaymentStatus('initializing');

      // Calcul du montant total à partir du panier
      const totalAmount = getCartTotal();
      const piRate = CURRENCIES?.PI?.rate || 1;
      const amountInPi = totalAmount / piRate;

      // On lance le flux de paiement (les callbacks dans piService gèrent l'approbation/complétion)
      await piService.createPayment(
        amountInPi.toFixed(4), 
        `Commande Double King Shop #${Date.now()}`,
        { 
          order_id: `DKS-${Date.now()}`,
          usd_amount: totalAmount.toFixed(2)
        }
      );

      // Si le flux se termine sans erreur :
      setPaymentStatus('completed');
      clearCart();
      if (onSuccess) onSuccess();

    } catch (error) {
      console.error('Payment error:', error);
      setPaymentStatus('failed');
      if (onError) onError(error.message || 'Erreur lors du paiement');
    } finally {
      setLoading(false);
    }
  };

  const getStatusMessage = () => {
    switch (paymentStatus) {
      case 'initializing': return 'Initialisation du paiement...';
      case 'pending': return 'En attente de confirmation Pi...';
      case 'completed': return 'Paiement réussi ! ✅';
      case 'failed': return 'Paiement échoué ❌';
      default: return '';
    }
  };

  if (!piReady) {
    return (
      <div className="p-4 text-center text-gray-500">
        Initialisation de Pi Network...
      </div>
    );
  }

  const totalAmount = getCartTotal();
  const piRate = CURRENCIES?.PI?.rate || 1;
  const amountInPi = (totalAmount / piRate).toFixed(4);

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg border border-gray-100">
      <h3 className="text-xl font-bold mb-4 flex items-center">
        <span className="text-2xl mr-2 text-yellow-600 font-serif">Π</span>
        Paiement Pi Network
      </h3>

      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-gray-600 mb-2 font-medium">Montant à payer :</p>
        <p className="text-3xl font-bold text-blue-700">
          {amountInPi} Π
        </p>
        <p className="text-sm text-blue-500 italic mt-1">
          Équivalent à {totalAmount.toFixed(2)} $ USD
        </p>
      </div>

      {paymentStatus && (
        <div className={`mb-4 p-3 rounded-lg text-sm text-center font-medium ${
          paymentStatus === 'completed' ? 'bg-green-100 text-green-800' :
          paymentStatus === 'failed' ? 'bg-red-100 text-red-800' :
          'bg-blue-100 text-blue-800'
        }`}>
          {getStatusMessage()}
        </div>
      )}

      <button
        onClick={handlePayment}
        disabled={loading || paymentStatus === 'completed'}
        className={`w-full py-4 px-4 rounded-xl font-bold text-lg transition-all transform active:scale-95 ${
          loading || paymentStatus === 'completed'
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md'
        }`}
      >
        {loading ? (
          <span className="flex items-center justify-center">
             Traitement...
          </span>
        ) : (
          'Confirmer et Payer'
        )}
      </button>

      <div className="mt-6 flex flex-col items-center opacity-60">
        <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Sécurité Double King Shop</p>
        <p className="text-[10px] text-gray-500">Transaction sécurisée par la Blockchain Pi</p>
      </div>
    </div>
  );
};

export default PiPayment;
