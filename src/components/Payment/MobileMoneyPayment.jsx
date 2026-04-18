import React, { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { CURRENCIES } from '../../utils/constants';
import apiService from '../../services/api';

const MobileMoneyPayment = ({ onSuccess, onError }) => {
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [provider, setProvider] = useState('airtel');
  const [phoneNumber, setPhoneNumber] = useState('09'); 
  const { getCartTotal, clearCart, cartItems } = useCart();

  const cdfRate = CURRENCIES?.CDF?.rate || 2800; // Taux local à Bunia
  const totalUSD = getCartTotal();
  const totalCDF = totalUSD * cdfRate;

  useEffect(() => {
    if (provider === 'airtel') setPhoneNumber('09');
    else if (provider === 'vodacom') setPhoneNumber('08');
    else if (provider === 'orange') setPhoneNumber('08');
    else if (provider === 'africell') setPhoneNumber('09');
  }, [provider]);

  const handlePayment = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      alert('Veuillez entrer un numéro complet (ex: 0823038945)');
      return;
    }

    try {
      setLoading(true);
      setPaymentStatus('initializing');

      // 1. Appel au backend pour créer la transaction FedaPay
      const data = await apiService.request('/api/mobile-money/initiate', {
        method: 'POST',
        body: JSON.stringify({
          phoneNumber,
          provider,
          amountUSD: totalUSD
        }),
      });

      if (data.success && data.url) {
        setPaymentStatus('pending');
        
        // 2. REDIRECTION VERS FEDAPAY
        // Cela ouvre l'interface sécurisée de FedaPay pour le client
        window.location.href = data.url;

        /** * NOTE POUR DOUBLE KING SHOP :
         * Une fois le paiement fini, FedaPay renverra le client vers ton site.
         * Tu devras alors appeler /api/mobile-money/confirm pour valider le stock.
         **/
      } else {
        throw new Error("Impossible de générer le lien de paiement.");
      }

    } catch (error) {
      console.error("Erreur Initiation:", error);
      setPaymentStatus('failed');
      if (onError) onError('Erreur technique lors de la connexion au service.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xl">
      <h3 className="text-center font-black italic uppercase tracking-tighter mb-6 text-gray-900">
        Mobile Money RDC
      </h3>

      <div className="space-y-4">
        {/* Sélection Opérateur */}
        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
            Choisir l'opérateur
          </label>
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

        {/* Champ Numéro */}
        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
            Numéro de téléphone
          </label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="w-full p-4 bg-gray-50 border-none rounded-2xl font-black text-lg text-gray-800 focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Montant avec taux de Bunia */}
        <div className="bg-slate-900 p-6 rounded-3xl text-center shadow-inner">
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Total à payer</p>
          <p className="text-3xl font-black text-white">
            {totalCDF.toLocaleString()} <span className="text-green-500 text-sm">FC</span>
          </p>
          <p className="text-[10px] text-gray-400 font-bold italic mt-1">{totalUSD.toFixed(2)} $ USD</p>
        </div>

        <button
          onClick={handlePayment}
          disabled={loading}
          className="w-full bg-green-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-green-100 active:scale-95 transition-all"
        >
          {loading ? 'Connexion FedaPay...' : `Payer avec ${provider.toUpperCase()}`}
        </button>

        {paymentStatus && (
          <div className={`p-4 rounded-2xl text-[10px] font-black uppercase text-center ${
            paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-700 animate-pulse' : 'bg-red-100 text-red-700'
          }`}>
            {paymentStatus === 'pending' ? 'Redirection vers la caisse sécurisée...' : 'Échec de la connexion'}
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileMoneyPayment;
