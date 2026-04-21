// src/pages/Checkout.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, ShoppingCart, CheckCircle, AlertCircle, Loader,
  CreditCard, Smartphone, Package, DollarSign, Tag, MapPin
} from 'lucide-react';

import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import PiPayment from '../components/Payment/PiPayment';
import MobileMoneyPayment from '../components/Payment/MobileMoneyPayment';

const Checkout = () => {
  const { cartItems, getCartTotal, clearCart, updateQuantity, removeFromCart } = useCart();
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();
  
  // 🎯 États
  const [paymentMethod, setPaymentMethod] = useState('pi');
  const [customerInfo, setCustomerInfo] = useState({
    name: user?.name || '',
    phone: '',
    address: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderSummary, setOrderSummary] = useState(null);

  // 🎯 Redirection si panier vide
  useEffect(() => {
    if (cartItems.length === 0) {
      navigate('/', { replace: true });
    }
  }, [cartItems, navigate]);

  // 🎯 Calculs
  const subtotal = getCartTotal();
  const taxRate = 0; // À récupérer depuis Settings si implémenté
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  // 🎯 Gestion des infos client
  const handleCustomerChange = (field, value) => {
    setCustomerInfo(prev => ({ ...prev, [field]: value }));
  };

  // 🎯 Callbacks de paiement
  const handlePaymentSuccess = async (paymentData) => {    try {
      setIsProcessing(true);
      
      // Préparer les données de commande
      const orderData = {
        customerName: customerInfo.name || 'Client DKS',
        customerPhone: customerInfo.phone,
        customerAddress: customerInfo.address,
        items: cartItems.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        subtotal,
        tax: taxAmount,
        total,
        paymentMethod,
        paymentData,
        status: 'completed',
        createdAt: new Date().toISOString()
      };

      // 🔹 Option 1 : Envoyer au backend via apiService
      // await apiService.createOrder(orderData);
      
      // 🔹 Option 2 : Mock pour démo (à remplacer par l'API)
      console.log('📦 Commande créée:', orderData);
      
      // Nettoyer et rediriger
      clearCart();
      setOrderSummary(orderData);
      showSuccess('Paiement réussi ! Votre commande est confirmée.');
      
      // Redirection vers historique ou confirmation
      setTimeout(() => {
        navigate('/orders', { state: { newOrder: orderData } });
      }, 2000);
      
    } catch (err) {
      console.error('Erreur validation commande:', err);
      showError('Erreur lors de la validation de votre commande');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentError = (error) => {
    console.error('Erreur paiement:', error);
    showError(error?.message || 'Échec du paiement. Veuillez réessayer.');    setIsProcessing(false);
  };

  const handlePaymentCancel = () => {
    showError('Paiement annulé');
    setIsProcessing(false);
  };

  // 🎯 Rendu Panier Vide (sécurité)
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100 max-w-md">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingCart size={32} className="text-slate-400" />
          </div>
          <h2 className="text-xl font-black text-slate-900 mb-2">Votre panier est vide</h2>
          <p className="text-slate-500 mb-6">Ajoutez des produits pour passer commande.</p>
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition"
          >
            <ArrowLeft size={16} /> Retour au catalogue
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      
      {/* 🎯 HEADER */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => navigate(-1)} 
              className="flex items-center gap-2 text-slate-600 hover:text-blue-600 font-bold text-sm transition"
            >
              <ArrowLeft size={18} /> Retour
            </button>
            <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <CreditCard size={18} className="text-blue-600" />
              Finaliser la commande
            </h1>
            <div className="text-right">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Double King Shop</p>
              <p className="text-xs font-bold text-slate-600">Bunia, Ituri</p>
            </div>          </div>
        </div>
      </header>

      {/* 🎯 CONTENU PRINCIPAL */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        
        {/* 📋 Résumé de commande + Paiement */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* 🛒 Colonne Gauche : Récapitulatif */}
          <div className="space-y-6">
            
            {/* Carte Résumé */}
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <ShoppingCart size={20} className="text-blue-600" />
                  Votre Panier
                </h2>
                <p className="text-sm text-slate-500 mt-1">{cartItems.length} article{cartItems.length > 1 ? 's' : ''}</p>
              </div>
              
              {/* Liste des articles */}
              <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <img 
                      src={item.image?.startsWith('http') ? item.image : `${window.location.origin}${item.image}`} 
                      alt={item.name} 
                      className="w-16 h-16 rounded-xl object-cover bg-white shadow-sm" 
                      onError={(e) => { e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="%23cbd5e1" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 7h10v10H7z"/></svg>'; }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 truncate">{item.name}</p>
                      <p className="text-blue-600 text-sm font-black">{item.price?.toFixed(2)} $</p>
                      
                      {/* Contrôles quantité */}
                      <div className="flex items-center gap-2 mt-2">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 flex items-center justify-center text-sm font-bold transition"
                          disabled={item.quantity <= 1}
                        >
                          −
                        </button>
                        <span className="w-8 text-center font-bold text-slate-900">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 flex items-center justify-center text-sm font-bold transition"                          disabled={item.quantity >= (item.stock || 99)}
                        >
                          +
                        </button>
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="ml-auto p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                          title="Retirer"
                        >
                          <AlertCircle size={16} />
                        </button>
                      </div>
                    </div>
                    <p className="font-black text-slate-900 self-center">
                      {(item.price * item.quantity).toFixed(2)} $
                    </p>
                  </div>
                ))}
              </div>
              
              {/* Totaux */}
              <div className="p-6 bg-slate-50 border-t border-slate-100 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Sous-total</span>
                  <span className="font-bold text-slate-900">{subtotal.toFixed(2)} $</span>
                </div>
                {taxRate > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Taxes ({taxRate}%)</span>
                    <span className="font-bold text-slate-900">{taxAmount.toFixed(2)} $</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                  <span className="text-lg font-black text-slate-900">Total</span>
                  <span className="text-2xl font-black text-blue-600">{total.toFixed(2)} $</span>
                </div>
              </div>
            </div>

            {/* 📝 Infos Client (Optionnel) */}
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6">
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <MapPin size={16} className="text-blue-600" />
                Informations de livraison
              </h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Nom complet"
                  value={customerInfo.name}                  onChange={(e) => handleCustomerChange('name', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="tel"
                  placeholder="Téléphone (optionnel)"
                  value={customerInfo.phone}
                  onChange={(e) => handleCustomerChange('phone', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
                <textarea
                  placeholder="Adresse de livraison (optionnel)"
                  rows="2"
                  value={customerInfo.address}
                  onChange={(e) => handleCustomerChange('address', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>
          </div>

          {/* 💳 Colonne Droite : Paiement */}
          <div className="space-y-6">
            
            {/* Sélection mode de paiement */}
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <CreditCard size={20} className="text-blue-600" />
                Mode de Paiement
              </h2>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setPaymentMethod('pi')}
                  className={`p-4 rounded-2xl border-2 transition-all text-left ${
                    paymentMethod === 'pi'
                      ? 'border-yellow-500 bg-yellow-50 ring-2 ring-yellow-200'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      paymentMethod === 'pi' ? 'bg-yellow-500' : 'bg-slate-200'
                    }`}>
                      <span className={`text-lg font-black ${paymentMethod === 'pi' ? 'text-white' : 'text-slate-500'}`}>Π</span>
                    </div>
                    <div>
                      <p className={`font-bold text-sm ${paymentMethod === 'pi' ? 'text-yellow-700' : 'text-slate-700'}`}>
                        Pi Network
                      </p>                      <p className="text-[10px] text-slate-400">Paiement crypto sécurisé</p>
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => setPaymentMethod('mobile-money')}
                  className={`p-4 rounded-2xl border-2 transition-all text-left ${
                    paymentMethod === 'mobile-money'
                      ? 'border-green-500 bg-green-50 ring-2 ring-green-200'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      paymentMethod === 'mobile-money' ? 'bg-green-600' : 'bg-slate-200'
                    }`}>
                      <Smartphone size={20} className={paymentMethod === 'mobile-money' ? 'text-white' : 'text-slate-500'} />
                    </div>
                    <div>
                      <p className={`font-bold text-sm ${paymentMethod === 'mobile-money' ? 'text-green-700' : 'text-slate-700'}`}>
                        Mobile Money
                      </p>
                      <p className="text-[10px] text-slate-400">M-Pesa, Airtel Money</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Composant de paiement dynamique */}
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6">
              {isProcessing ? (
                <div className="text-center py-12">
                  <Loader className="animate-spin mx-auto mb-4 text-blue-600" size={48} />
                  <p className="text-slate-500 font-medium">Traitement du paiement...</p>
                  <p className="text-[10px] text-slate-400 mt-2">Ne fermez pas cette page</p>
                </div>
              ) : paymentMethod === 'pi' ? (
                <PiPayment 
                  totalUsd={total}
                  cartItems={cartItems}
                  customerInfo={customerInfo}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                  onCancel={handlePaymentCancel}
                />
              ) : (
                <MobileMoneyPayment 
                  totalUsd={total}                  cartItems={cartItems}
                  customerInfo={customerInfo}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                  onCancel={handlePaymentCancel}
                />
              )}
            </div>

            {/* 🔒 Sécurité */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
              <div className="flex items-start gap-3">
                <CheckCircle size={18} className="text-emerald-600 mt-0.5" />
                <div className="text-[10px] text-slate-500">
                  <p className="font-bold text-slate-700">Paiement sécurisé</p>
                  <p>Vos données sont protégées. Aucune information bancaire n'est stockée sur nos serveurs.</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* 🎨 Styles CSS personnalisés */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </div>
  );
};

export default Checkout;