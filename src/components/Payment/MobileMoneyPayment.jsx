import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { CURRENCIES } from '../utils/constants';

const MobileMoneyPayment = ({ onSuccess, onError }) => {
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [provider, setProvider] = useState('airtel'); // airtel, orange, etc.
  const { getCartTotal, clearCart, cartItems } = useCart();

  const handlePayment = async () => {
    if (!phoneNumber || phoneNumber.length < 9) {
      alert('Veuillez entrer un numéro de téléphone valide');
      return;
    }

    try {
      setLoading(true);
      setPaymentStatus('initializing');

      const totalAmount = getCartTotal();

      // Simulation de l'appel API Mobile Money
      // En production, remplacer par l'appel réel à l'API du fournisseur
      const response = await fetch('/api/mobile-money/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber,
          provider,
          amount: totalAmount,
          items: cartItems,
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'initiation du paiement');
      }

      const data = await response.json();

      // Simulation de la confirmation (en production, attendre la callback)
      setPaymentStatus('pending');
      alert(`Paiement initié. Veuillez confirmer sur votre téléphone ${phoneNumber} avec ${provider.toUpperCase()}.`);

      // Simuler la réussite après 3 secondes
      setTimeout(async () => {
        try {
          const confirmResponse = await fetch('/api/mobile-money/confirm', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              transactionId: data.transactionId,
              cartItems,
              totalAmount,
              phoneNumber,
              provider,
            }),
          });

          if (confirmResponse.ok) {
            setPaymentStatus('completed');
            clearCart();
            if (onSuccess) onSuccess();
          } else {
            throw new Error('Paiement échoué');
          }
        } catch (error) {
          setPaymentStatus('failed');
          if (onError) onError('Paiement Mobile Money échoué');
        }
      }, 3000);

    } catch (error) {
      console.error('Mobile Money payment error:', error);
      setPaymentStatus('failed');
      if (onError) onError('Erreur de paiement Mobile Money');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border">
      <h3 className="text-lg font-bold mb-4 text-center">Paiement Mobile Money</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fournisseur Mobile Money
          </label>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="airtel">Airtel Money</option>
            <option value="orange">Orange Money</option>
            <option value="africell">Africell Money</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Numéro de téléphone
          </label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="Ex: +243 8XX XXX XXX"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            Entrez votre numéro avec l'indicatif +243
          </p>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="font-medium">Montant à payer:</span>
            <span className="text-xl font-bold text-blue-600">
              {getCartTotal().toFixed(2)} CDF
            </span>
          </div>
        </div>

        <button
          onClick={handlePayment}
          disabled={loading || !phoneNumber}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Traitement...
            </>
          ) : (
            <>
              💰 Payer avec {provider.toUpperCase()} Money
            </>
          )}
        </button>

        {paymentStatus && (
          <div className={`p-3 rounded-lg text-center ${
            paymentStatus === 'completed' ? 'bg-green-100 text-green-800' :
            paymentStatus === 'failed' ? 'bg-red-100 text-red-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {paymentStatus === 'initializing' && 'Initiation du paiement...'}
            {paymentStatus === 'pending' && 'En attente de confirmation...'}
            {paymentStatus === 'completed' && 'Paiement réussi !'}
            {paymentStatus === 'failed' && 'Paiement échoué'}
          </div>
        )}
      </div>

      <div className="mt-4 text-xs text-gray-500 text-center">
        <p>Compatible avec Airtel Money, Orange Money et Africell Money</p>
        <p>Service disponible à Bunia et dans toute la RDC</p>
      </div>
    </div>
  );
};

export default MobileMoneyPayment;