import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import PiPayment from '../components/Payment/PiPayment';
import MobileMoneyPayment from '../components/Payment/MobileMoneyPayment';
import { useCart } from '../context/CartContext';

const Checkout = () => {
  const { cartItems, getCartTotal, clearCart } = useCart();
  const [paymentMethod, setPaymentMethod] = useState('pi'); // 'pi' or 'mobile-money'

  const handleSuccess = () => {
    clearCart();
    alert('Paiement réussi !');
  };

  const handleError = (error) => {
    alert('Erreur de paiement: ' + error);
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg">Votre panier est vide</p>
          <Link to="/" className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-blue-600 p-6 text-white">
            <h1 className="text-2xl font-bold">Finaliser votre commande</h1>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Résumé de la commande */}
              <div>
                <h2 className="text-xl font-bold mb-4">Votre commande</h2>
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                      <img src={`http://localhost:3001${item.image}`} alt={item.name} className="w-16 h-16 rounded-lg object-cover" />
                      <div className="flex-1">
                        <p className="font-bold">{item.name}</p>
                        <p className="text-blue-600 font-black">{item.price} $ x {item.quantity}</p>
                      </div>
                      <p className="font-bold text-lg">{(item.price * item.quantity).toFixed(2)} $</p>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-6 border-t">
                  <div className="flex justify-between items-center text-xl font-bold">
                    <span>Total:</span>
                    <span className="text-blue-600">{getCartTotal().toFixed(2)} $</span>
                  </div>
                </div>
              </div>
              
              {/* Paiement */}
              <div>
                <h2 className="text-xl font-bold mb-4">Mode de Paiement</h2>
                
                {/* Sélection du mode de paiement */}
                <div className="mb-6">
                  <div className="flex gap-4 mb-4">
                    <button
                      onClick={() => setPaymentMethod('pi')}
                      className={`flex-1 py-3 px-4 rounded-lg font-bold transition-colors ${
                        paymentMethod === 'pi'
                          ? 'bg-yellow-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Π Pi Network
                    </button>
                    <button
                      onClick={() => setPaymentMethod('mobile-money')}
                      className={`flex-1 py-3 px-4 rounded-lg font-bold transition-colors ${
                        paymentMethod === 'mobile-money'
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      📱 Mobile Money
                    </button>
                  </div>
                </div>

                {/* Composant de paiement selon la sélection */}
                {paymentMethod === 'pi' ? (
                  <PiPayment onSuccess={handleSuccess} onError={handleError} />
                ) : (
                  <MobileMoneyPayment onSuccess={handleSuccess} onError={handleError} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;