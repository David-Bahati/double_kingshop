import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PiPayment from '../components/Payment/PiPayment';
import MobileMoneyPayment from '../components/Payment/MobileMoneyPayment';
import { useCart } from '../context/CartContext';

const Checkout = () => {
  const { cartItems, getCartTotal, clearCart } = useCart();
  const [paymentMethod, setPaymentMethod] = useState('pi');
  const navigate = useNavigate();

  const handleSuccess = () => {
    clearCart();
    alert('Paiement réussi ! Double King Shop vous remercie.');
    navigate('/orders'); 
  };

  const handleError = (error) => {
    alert('Erreur de paiement: ' + error);
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg">
          <p className="text-gray-500 text-lg mb-4 font-bold">Votre panier est vide</p>
          <Link to="/" className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition">
            Retour au Marché
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        
        {/* BOUTON RETOUR AJOUTÉ ICI */}
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 mb-6 text-gray-600 font-black uppercase text-[10px] tracking-widest bg-white py-3 px-6 rounded-2xl shadow-sm border border-gray-100 active:scale-95 transition-all"
        >
          ← Retour à la boutique
        </button>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
          <div className="bg-blue-600 p-8 text-white flex justify-between items-center">
            <h1 className="text-2xl font-black italic uppercase tracking-tighter">Finaliser la Commande</h1>
            <span className="text-blue-200 text-xs font-bold uppercase tracking-widest">DKS • Bunia</span>
          </div>
          
          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Résumé de la commande */}
              <div>
                <h2 className="text-lg font-black text-gray-800 mb-6 uppercase tracking-tight">Votre Panier</h2>
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <img 
                        src={item.image.startsWith('http') ? item.image : `${item.image}`} 
                        alt={item.name} 
                        className="w-16 h-16 rounded-xl object-cover bg-white shadow-sm" 
                      />
                      <div className="flex-1">
                        <p className="font-bold text-gray-900">{item.name}</p>
                        <p className="text-blue-600 font-black text-sm">{item.price} $ x {item.quantity}</p>
                      </div>
                      <p className="font-black text-gray-900">{(item.price * item.quantity).toFixed(2)} $</p>
                    </div>
                  ))}
                </div>
                <div className="mt-8 pt-6 border-t-2 border-dashed border-gray-100">
                  <div className="flex justify-between items-center text-2xl font-black text-gray-900">
                    <span>Total:</span>
                    <span className="text-blue-600">{getCartTotal().toFixed(2)} $</span>
                  </div>
                </div>
              </div>
              
              {/* Section Paiement */}
              <div>
                <h2 className="text-lg font-black text-gray-800 mb-6 uppercase tracking-tight">Mode de Paiement</h2>
                
                <div className="flex gap-4 mb-8">
                  <button
                    onClick={() => setPaymentMethod('pi')}
                    className={`flex-1 py-4 px-2 rounded-2xl font-black transition-all active:scale-95 text-xs uppercase tracking-widest ${
                      paymentMethod === 'pi'
                        ? 'bg-yellow-500 text-white shadow-lg shadow-yellow-100'
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                    }`}
                  >
                    Π Pi Network
                  </button>
                  <button
                    onClick={() => setPaymentMethod('mobile-money')}
                    className={`flex-1 py-4 px-2 rounded-2xl font-black transition-all active:scale-95 text-xs uppercase tracking-widest ${
                      paymentMethod === 'mobile-money'
                        ? 'bg-green-600 text-white shadow-lg shadow-green-100'
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                    }`}
                  >
                    📱 M-Pesa / Airtel
                  </button>
                </div>

                <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                  {paymentMethod === 'pi' ? (
                    <PiPayment totalUsd={getCartTotal()} onSuccess={handleSuccess} onError={handleError} />
                  ) : (
                    <MobileMoneyPayment totalUsd={getCartTotal()} onSuccess={handleSuccess} onError={handleError} />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
