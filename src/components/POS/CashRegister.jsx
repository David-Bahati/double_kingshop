import React, { useState } from 'react';
import apiService from '../../services/api';

const CashRegister = ({ products, onSaleSuccess }) => {
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState('');

  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.id === product.id ? {...item, quantity: item.quantity + 1} : item));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleFinalizeSale = async () => {
    if (cart.length === 0) return alert("Panier vide !");
    try {
      const response = await apiService.request('/pos/cash-sale', {
        method: 'POST',
        body: JSON.stringify({ cartItems: cart, customerName: customer, total })
      });
      if (response.success) {
        alert("Vente enregistrée ! Imprimez le reçu.");
        setCart([]);
        setCustomer('');
        onSaleSuccess(); // Pour rafraîchir le stock sur le dashboard
      }
    } catch (e) { alert("Erreur vente"); }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Liste des produits cliquables */}
      <div>
        <h3 className="font-black uppercase text-xs text-gray-400 mb-4 tracking-widest">Sélectionner Articles</h3>
        <div className="grid grid-cols-2 gap-3 h-[400px] overflow-y-auto pr-2">
          {products.map(p => (
            <button key={p.id} onClick={() => addToCart(p)} className="p-3 bg-gray-50 rounded-2xl border hover:border-blue-500 transition-all text-left">
              <p className="font-bold text-xs truncate">{p.name}</p>
              <p className="text-blue-600 font-black text-xs">{p.price} $</p>
            </button>
          ))}
        </div>
      </div>

      {/* Panier et Total */}
      <div className="bg-gray-900 rounded-2xl p-6 text-white flex flex-col">
        <input placeholder="Nom du Client (Optionnel)" className="bg-gray-800 border-none rounded-xl p-3 mb-4 text-sm outline-none focus:ring-2 ring-blue-500" value={customer} onChange={e => setCustomer(e.target.value)} />
        
        <div className="flex-1 overflow-y-auto space-y-3 mb-4">
          {cart.map(item => (
            <div key={item.id} className="flex justify-between text-xs">
              <span>{item.name} x{item.quantity}</span>
              <span className="font-bold">{(item.price * item.quantity).toFixed(2)} $</span>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-700 pt-4">
          <div className="flex justify-between items-end mb-4">
            <span className="text-gray-400 text-[10px] font-bold uppercase">Total à Payer</span>
            <span className="text-3xl font-black text-blue-400">{total.toFixed(2)} $</span>
          </div>
          <button onClick={handleFinalizeSale} className="w-full bg-blue-600 hover:bg-blue-700 py-4 rounded-xl font-black uppercase text-xs shadow-lg active:scale-95 transition-all">
            Valider Vente Cash
          </button>
        </div>
      </div>
    </div>
  );
};

export default CashRegister;
