import React, { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { CURRENCIES } from '../../utils/constants';
import apiService from '../../services/api';

const MobileMoneyPayment = ({ onSuccess, onError }) => {
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [provider, setProvider] = useState('airtel');
  const [phoneNumber, setPhoneNumber] = useState('09'); // Préfixe par défaut
  const { getCartTotal, clearCart, cartItems } = useCart();

  const cdfRate = CURRENCIES?.CDF?.rate || 2800;
  const totalUSD = getCartTotal();
  const totalCDF = totalUSD * cdfRate;

  // Mise à jour automatique du préfixe selon l'opérateur
  useEffect(() => {
    if (provider === 'airtel') setPhoneNumber('09');
    else if (provider === 'vodacom') setPhoneNumber('08');
    else if (provider === 'orange') setPhoneNumber('08');
    else if (provider === 'africell') setPhoneNumber('09');
  }, [provider]);

  const handlePayment = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      alert('Veuillez entrer un numéro complet (ex: 0812345678)');
      return;
    }

    try {
      setLoading(true);
      setPaymentStatus('initializing');

      const data = await apiService.request('/api/mobile-money/initiate', {
        method: 'POST',
        body: JSON.stringify({
          phoneNumber,
          provider,
          amountUSD: totalUSD,
          items: cartItems,
        }),
      });

      setPaymentStatus('pending');
      alert(`Paiement initié via ${provider.toUpperCase()}. Validez l'opération sur votre téléphone.`);

      // MODIFICATION À FAIRE DANS MobileMoneyPayment.jsx
      // Simulation de la validation réseau
      setTimeout(async () => {
        try {
          const response = await apiService.request('/api/mobile-money/confirm', {
            method: 'POST',
            body: JSON.stringify({
              transactionId: data.transactionId,
              cartItems: cartItems,
              totalAmount: totalUSD,
              provider: provider
            }),
          });

          if (response.success) {
            setPaymentStatus('completed');
            clearCart();
            if (onSuccess) onSuccess();
          } else {
            setPaymentStatus('failed');
            if (onError) onError('Le serveur a refusé la transaction.');
          }
        } catch (error) {
          console.error("Erreur de confirmation:", error);
          setPaymentStatus('failed');
          if (onError) onError('Erreur technique lors de la validation.');
        }
      }, 4000);


    } catch (error) {
      setPaymentStatus('failed');
      if (onError) onError('Erreur technique lors de l\'envoi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xl">
      <h3 className="text-center font-black italic uppercase tracking-tighter mb-6 text-gray-900">Mobile Money RDC</h3>

      <div className="space-y-4">
        {/* Sélection Opérateur */}
        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Choisir l'opérateur</label>
          <div className="grid grid-cols-2 gap-2">
            {['airtel', 'vodacom', 'orange', 'africell'].map((op) => (
              <button
                key={op}
                onClick={() => setProvider(op)}
                className={`py-3 rounded-xl text-[10px] font-black uppercase border-2 transition-all ${
                  provider === op ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-100 text-gray-400'
                }`}
              >
                {op === 'vodacom' ? 'M-PESA' : op}
              </button>
            ))}
          </div>
        </div>

        {/* Champ Numéro avec préfixe dynamique */}
        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Numéro de téléphone</label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="w-full p-4 bg-gray-50 border-none rounded-2xl font-black text-lg text-gray-800 focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Montant en FC */}
        <div className="bg-slate-900 p-6 rounded-3xl text-center shadow-inner">
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Total à payer</p>
          <p className="text-3xl font-black text-white">{totalCDF.toLocaleString()} <span className="text-green-500 text-sm">FC</span></p>
          <p className="text-[10px] text-gray-400 font-bold italic mt-1">{totalUSD.toFixed(2)} $ USD</p>
        </div>

        <button
          onClick={handlePayment}
          disabled={loading}
          className="w-full bg-green-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-green-100 active:scale-95 transition-all"
        >
          {loading ? 'Connexion réseau...' : `Payer avec ${provider.toUpperCase()}`}
        </button>

        {paymentStatus && (
          <div className={`p-4 rounded-2xl text-[10px] font-black uppercase text-center ${
            paymentStatus === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700 animate-pulse'
          }`}>
            {paymentStatus === 'pending' ? 'Attente de confirmation USSD...' : 'Paiement Réussi ✅'}
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileMoneyPayment;
