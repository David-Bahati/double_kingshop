import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { CURRENCIES } from '../../utils/constants';
import apiService from '../../services/api';

const MobileMoneyPayment = ({ onSuccess, onError }) => {
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [provider, setProvider] = useState('airtel');
  const { getCartTotal, clearCart, cartItems } = useCart();

  // On récupère le taux CDF depuis tes constantes (ex: 2800)
  const cdfRate = CURRENCIES?.CDF?.rate || 2800;
  const totalUSD = getCartTotal();
  const totalCDF = totalUSD * cdfRate;

  const handlePayment = async () => {
    // Validation du numéro format RDC
    if (!phoneNumber || phoneNumber.length < 9) {
      alert('Veuillez entrer un numéro de téléphone valide (ex: 099...)');
      return;
    }

    try {
      setLoading(true);
      setPaymentStatus('initializing');

      // 1. Initiation de la transaction sur ton serveur Railway
      const data = await apiService.request('/api/mobile-money/initiate', {
        method: 'POST',
        body: JSON.stringify({
          phoneNumber,
          provider,
          amountUSD: totalUSD,
          amountCDF: totalCDF,
          items: cartItems,
        }),
      });

      setPaymentStatus('pending');
      
      // Simulation du délai de validation USSD par le client sur son téléphone
      alert(`Paiement initié sur votre téléphone ${phoneNumber}. Veuillez confirmer avec votre code secret.`);

      // 2. Simulation de la confirmation (En prod, c'est le serveur qui reçoit le webhook)
      setTimeout(async () => {
        try {
          await apiService.request('/api/mobile-money/confirm', {
            method: 'POST',
            body: JSON.stringify({
              transactionId: data.transactionId || `DKS-${Date.now()}`,
              cartItems,
              totalAmount: totalUSD
            }),
          });

          setPaymentStatus('completed');
          clearCart();
          if (onSuccess) onSuccess();
          
        } catch (error) {
          setPaymentStatus('failed');
          if (onError) onError('Le client n\'a pas validé le paiement.');
        }
      }, 4000);

    } catch (error) {
      console.error('Mobile Money error:', error);
      setPaymentStatus('failed');
      if (onError) onError('Erreur technique lors de l\'initiation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
      <div className="flex flex-col items-center mb-6">
        <div className="bg-green-100 p-3 rounded-2xl mb-2">
          <span className="text-2xl">📱</span>
        </div>
        <h3 className="text-lg font-black text-gray-900 italic uppercase tracking-tighter">Mobile Money RDC</h3>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Opérateur</label>
          <div className="grid grid-cols-3 gap-2">
            {['airtel', 'orange', 'africell'].map((op) => (
              <button
                key={op}
                onClick={() => setProvider(op)}
                className={`py-2 rounded-xl text-[10px] font-bold uppercase border-2 transition-all ${
                  provider === op ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-100 text-gray-400'
                }`}
              >
                {op}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Numéro de téléphone</label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="08X XXX XXXX"
            className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-green-500 font-bold text-gray-800"
          />
        </div>

        <div className="bg-slate-900 p-6 rounded-3xl shadow-inner text-center">
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Montant à payer</p>
          <p className="text-2xl font-black text-white">
            {totalCDF.toLocaleString()} <span className="text-green-500 text-sm">FC</span>
          </p>
          <p className="text-[10px] text-gray-400 font-bold italic mt-1">({totalUSD.toFixed(2)} $ USD)</p>
        </div>

        <button
          onClick={handlePayment}
          disabled={loading || !phoneNumber}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-200 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-green-100 flex items-center justify-center gap-3"
        >
          {loading ? 'Traitement en cours...' : `Payer avec ${provider.toUpperCase()} Money`}
        </button>

        {paymentStatus && (
          <div className={`p-4 rounded-2xl text-[10px] font-black uppercase text-center tracking-widest ${
            paymentStatus === 'completed' ? 'bg-green-100 text-green-700' :
            paymentStatus === 'failed' ? 'bg-red-100 text-red-700' :
            'bg-yellow-100 text-yellow-700 animate-pulse'
          }`}>
            {paymentStatus === 'initializing' && 'Initialisation...'}
            {paymentStatus === 'pending' && 'Attente confirmation USSD...'}
            {paymentStatus === 'completed' && 'Paiement Réussi ✅'}
            {paymentStatus === 'failed' && 'Paiement Échoué ❌'}
          </div>
        )}
      </div>

      <p className="mt-6 text-[9px] text-gray-300 font-black text-center uppercase tracking-widest">
        Double King Shop • Service Bunia
      </p>
    </div>
  );
};

export default MobileMoneyPayment;
