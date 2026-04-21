// src/components/POS/CashRegister.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Search, Plus, Minus, Trash2, ShoppingCart, User, 
  CreditCard, Smartphone, DollarSign, CheckCircle, 
  Printer, X, Package, AlertCircle, Loader, Scan
} from 'lucide-react';

import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/constants';
import apiService from '../../services/api';

const CashRegister = ({ products = [], onSaleSuccess }) => {
  const { showSuccess, showError, showInfo, showWarning } = useNotification();
  const { user } = useAuth();
  
  // 🎯 États principaux
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState({ name: '', phone: '' });
  const [paymentMethod, setPaymentMethod] = useState('cash'); // cash, pi, mobile_money
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState(null);

  // 🎯 Calculs
  const subtotal = useMemo(() => 
    cart.reduce((sum, item) => sum + (item.price * item.quantity), 0), 
    [cart]
  );
  
  const taxRate = 0; // À récupérer depuis Settings si implémenté
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  // 🎯 Catégories disponibles (pour filtre)
  const categories = useMemo(() => 
    ['all', ...new Set(products.map(p => p.category).filter(Boolean))], 
    [products]
  );

  // 🎯 Produits filtrés
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           p.category?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
      const inStock = p.stock > 0 && p.published;      return matchesSearch && matchesCategory && inStock;
    });
  }, [products, searchQuery, categoryFilter]);

  // 🎯 Ajouter au panier avec validation stock
  const addToCart = useCallback((product, quantity = 1) => {
    // Validation stock
    const inCart = cart.find(i => i.id === product.id)?.quantity || 0;
    const available = product.stock - inCart;
    
    if (available <= 0) {
      showWarning('Rupture de stock');
      return;
    }
    
    const qtyToAdd = Math.min(quantity, available);
    
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + qtyToAdd }
            : item
        );
      }
      return [...prev, { 
        ...product, 
        quantity: qtyToAdd,
        // Snapshot des données au moment de l'ajout
        snapshotPrice: product.price,
        snapshotStock: product.stock
      }];
    });
    
    showInfo(`${product.name} ajouté au panier`);
  }, [cart, showInfo, showWarning]);

  // 🎯 Mettre à jour quantité
  const updateQuantity = useCallback((productId, newQty) => {
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }
    
    const product = products.find(p => p.id === productId);
    const inCart = cart.find(i => i.id === productId)?.quantity || 0;
    const available = (product?.stock || 0) + inCart; // Stock total disponible
    
    if (newQty > available) {      showWarning(`Stock max: ${available}`);
      return;
    }
    
    setCart(prev => prev.map(item =>
      item.id === productId ? { ...item, quantity: newQty } : item
    ));
  }, [cart, products, showWarning]);

  // 🎯 Retirer du panier
  const removeFromCart = useCallback((productId) => {
    setCart(prev => {
      const item = prev.find(i => i.id === productId);
      if (item) showInfo(`${item.name} retiré`);
      return prev.filter(item => item.id !== productId);
    });
  }, [showInfo]);

  // 🎯 Vider le panier
  const clearCart = useCallback(() => {
    if (cart.length > 0 && window.confirm('Vider le panier ?')) {
      setCart([]);
      showInfo('Panier vidé');
    }
  }, [cart.length, showInfo]);

  // 🎯 Finaliser la vente
  const handleFinalizeSale = async () => {
    if (cart.length === 0) {
      showWarning('Le panier est vide');
      return;
    }
    
    if (!customer.name.trim()) {
      showWarning('Veuillez entrer un nom de client');
      return;
    }

    setIsProcessing(true);
    
    try {
      // Préparer les données de commande
      const orderData = {
        customerName: customer.name.trim(),
        customerPhone: customer.phone.trim() || null,
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.snapshotPrice || item.price,
          quantity: item.quantity,          category: item.category
        })),
        subtotal,
        tax: taxAmount,
        total,
        paymentMethod,
        status: 'completed',
        cashierId: user?.id,
        createdAt: new Date().toISOString()
      };

      // 🔹 Option 1 : Envoyer au backend
      // const response = await apiService.createOrder(orderData);
      
      // 🔹 Option 2 : Mock pour démo (à remplacer)
      console.log('📦 Vente cash:', orderData);
      
      // Mettre à jour les stocks localement (optimistic update)
      // En production, le backend gère ça
      onSaleSuccess?.();
      
      // Sauvegarder pour le reçu
      setLastSale({ ...orderData, id: `CASH-${Date.now().toString().slice(-6)}` });
      setShowReceipt(true);
      
      showSuccess('Vente enregistrée avec succès !');
      
      // Reset
      setCart([]);
      setCustomer({ name: '', phone: '' });
      
    } catch (err) {
      console.error('Erreur vente:', err);
      showError('Échec de l\'enregistrement de la vente');
    } finally {
      setIsProcessing(false);
    }
  };

  // 🎯 Imprimer le reçu
  const handlePrintReceipt = () => {
    if (!lastSale) return;
    
    const items = lastSale.items;
    const itemsHtml = items.map(i => 
      `<tr><td>${i.quantity}x ${i.name}</td><td class="text-right">$${(i.price * i.quantity).toFixed(2)}</td></tr>`
    ).join('');
    
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) {      showError('Impossible d\'ouvrir l\'impression');
      return;
    }
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Reçu DKS #${lastSale.id}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Courier New', monospace; padding: 15px; color: #000; background: #fff; }
          .receipt { max-width: 320px; margin: auto; }
          .header { text-align: center; border-bottom: 2px dashed #ccc; padding-bottom: 10px; margin-bottom: 10px; }
          .logo { font-size: 22px; font-weight: 900; color: #2563eb; font-style: italic; }
          .shop { font-size: 13px; font-weight: bold; text-transform: uppercase; margin: 2px 0; }
          .address { font-size: 9px; color: #666; }
          .line { border-top: 1px dashed #ccc; margin: 8px 0; }
          table { width: 100%; font-size: 10px; border-collapse: collapse; }
          td { padding: 2px 0; }
          .qty { text-align: center; width: 30px; }
          .price { text-align: right; }
          .total { font-size: 14px; font-weight: 900; text-align: right; border-top: 2px solid #000; padding-top: 6px; margin-top: 8px; }
          .footer { font-size: 8px; text-align: center; color: #666; margin-top: 15px; }
          .meta { font-size: 9px; color: #666; margin: 4px 0; }
          @media print { body { padding: 0; } .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <div class="logo">DKS</div>
            <div class="shop">Double King Shop</div>
            <div class="address">Bunia, Ituri • +243 999 123 456</div>
          </div>
          <p class="meta"><strong>REÇU N°:</strong> ${lastSale.id}</p>
          <p class="meta"><strong>Date:</strong> ${new Date(lastSale.createdAt).toLocaleString('fr-FR')}</p>
          <p class="meta"><strong>Caissier:</strong> ${lastSale.cashierName || user?.name || 'DKS'}</p>
          <p class="meta"><strong>Client:</strong> ${lastSale.customerName}</p>
          ${lastSale.customerPhone ? `<p class="meta"><strong>Tél:</strong> ${lastSale.customerPhone}</p>` : ''}
          <div class="line"></div>
          <table>
            <thead><tr><th>Article</th><th class="qty">Qté</th><th class="price">Total</th></tr></thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          <div class="line"></div>
          <p class="meta"><strong>Paiement:</strong> ${lastSale.paymentMethod === 'pi_network' ? 'Π Pi Network' : lastSale.paymentMethod === 'mobile_money' ? '📱 Mobile Money' : '💵 Cash'}</p>
          <div class="total">TOTAL: $${lastSale.total.toFixed(2)}</div>
          <div class="footer">
            Merci de votre confiance !<br/>            Double King Shop • Bunia<br/>
            www.doublekingshop.cd
          </div>
        </div>
        <script>
          window.onload = function() { 
            setTimeout(() => { 
              window.focus(); 
              window.print();
              // Optionnel: fermer après impression
              // setTimeout(() => window.close(), 500);
            }, 300);
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  // 🎯 Raccourcis clavier pour caisse (optionnel)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // F2: Nouveau panier
      if (e.key === 'F2' && !isProcessing) {
        e.preventDefault();
        clearCart();
      }
      // F5: Finaliser vente
      if (e.key === 'F5' && cart.length > 0 && !isProcessing) {
        e.preventDefault();
        handleFinalizeSale();
      }
      // Échap: Fermer reçu
      if (e.key === 'Escape' && showReceipt) {
        setShowReceipt(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart.length, isProcessing, showReceipt, clearCart]);

  // 🎯 Rendu Modal Reçu
  if (showReceipt && lastSale) {
    return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden animate-slideUp">
          
          {/* Header Reçu */}          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-5 text-white flex justify-between items-center">
            <div>
              <h2 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                <CheckCircle size={18} /> Vente Validée
              </h2>
              <p className="text-blue-100 text-xs mt-0.5">#{lastSale.id}</p>
            </div>
            <button 
              onClick={() => setShowReceipt(false)}
              className="p-2 hover:bg-white/20 rounded-full transition"
              aria-label="Fermer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Contenu Reçu */}
          <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            
            {/* Infos client */}
            <div className="p-4 bg-slate-50 rounded-xl space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-slate-500">Client</span>
                <span className="font-bold text-slate-900">{lastSale.customerName}</span>
              </div>
              {lastSale.customerPhone && (
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">Téléphone</span>
                  <span className="font-bold text-slate-900">{lastSale.customerPhone}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-sm text-slate-500">Paiement</span>
                <span className="font-bold text-slate-900 capitalize">
                  {lastSale.paymentMethod.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* Articles */}
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Articles</p>
              <div className="space-y-2">
                {lastSale.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-slate-600">{item.quantity}x {item.name}</span>
                    <span className="font-bold text-slate-900">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>            </div>

            {/* Total */}
            <div className="border-t-2 border-slate-200 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-slate-900">Total</span>
                <span className="text-3xl font-black text-blue-600">${lastSale.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setShowReceipt(false); setLastSale(null); }}
                className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 transition"
              >
                Nouvelle Vente
              </button>
              <button
                onClick={handlePrintReceipt}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition flex items-center justify-center gap-2"
              >
                <Printer size={16} /> Imprimer
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden">
      
      {/* Header Caisse */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-5 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-xl">
            <ShoppingCart size={20} />
          </div>
          <div>
            <h2 className="text-lg font-black uppercase tracking-tight">Caisse DKS</h2>
            <p className="text-slate-400 text-xs">Vente rapide • Bunia</p>
          </div>
        </div>
        {cart.length > 0 && (
          <button 
            onClick={clearCart}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-300 rounded-xl text-xs font-bold hover:bg-red-500/30 transition"
          >            <Trash2 size={14} /> Vider
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:divide-x divide-slate-200">
        
        {/* 🛒 Colonne Gauche : Produits */}
        <div className="p-5 space-y-4">
          
          {/* Recherche + Filtres */}
          <div className="space-y-3">
            <div className="relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher un produit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
            
            {/* Filtres catégories */}
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition ${
                    categoryFilter === cat
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat === 'all' ? 'Tous' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Grille Produits */}
          <div className="h-[400px] overflow-y-auto custom-scrollbar pr-2">
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {filteredProducts.map(product => {
                  const inCart = cart.find(i => i.id === product.id)?.quantity || 0;
                  const available = product.stock - inCart;
                  
                  return (                    <button
                      key={product.id}
                      onClick={() => addToCart(product)}
                      disabled={available <= 0}
                      className={`p-4 rounded-2xl border text-left transition-all group ${
                        available <= 0
                          ? 'bg-slate-50 border-slate-200 cursor-not-allowed opacity-50'
                          : 'bg-slate-50 border-slate-200 hover:border-blue-400 hover:shadow-md hover:-translate-y-0.5'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="w-12 h-12 rounded-xl bg-slate-200 flex items-center justify-center overflow-hidden">
                          {product.image ? (
                            <img 
                              src={product.image.startsWith('http') ? product.image : `${window.location.origin}${product.image}`} 
                              alt={product.name}
                              className="w-full h-full object-cover"
                              onError={(e) => { e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 7h10v10H7z"/></svg>'; }}
                            />
                          ) : (
                            <Package size={24} className="text-slate-400" />
                          )}
                        </div>
                        {inCart > 0 && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold">
                            {inCart}x
                          </span>
                        )}
                      </div>
                      
                      <p className="font-bold text-slate-900 text-sm truncate" title={product.name}>
                        {product.name}
                      </p>
                      <p className="text-blue-600 font-black text-sm mt-0.5">
                        ${product.price?.toFixed(2)}
                      </p>
                      <p className={`text-[10px] mt-1 ${available <= 0 ? 'text-red-500' : 'text-slate-400'}`}>
                        {available <= 0 ? 'Rupture' : `${available} en stock`}
                      </p>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <Search size={48} className="mb-4 opacity-50" />
                <p className="text-sm font-medium">Aucun produit trouvé</p>
                <p className="text-xs">Essayez une autre recherche</p>
              </div>
            )}
          </div>
        </div>

        {/* 💳 Colonne Droite : Panier & Paiement */}
        <div className="p-5 bg-slate-50 flex flex-col">
          
          {/* Info Client */}
          <div className="mb-4">
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 flex items-center gap-1">
              <User size={12} /> Client
            </label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Nom *"
                value={customer.name}
                onChange={(e) => setCustomer(prev => ({ ...prev, name: e.target.value }))}
                className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition"
                required
              />
              <input
                type="tel"
                placeholder="Téléphone"
                value={customer.phone}
                onChange={(e) => setCustomer(prev => ({ ...prev, phone: e.target.value }))}
                className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
          </div>

          {/* Panier */}
          <div className="flex-1 overflow-y-auto custom-scrollbar mb-4">
            {cart.length > 0 ? (
              <div className="space-y-3">
                {cart.map(item => (
                  <div 
                    key={item.id} 
                    className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200"
                  >
                    {/* Info produit */}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 text-sm truncate">{item.name}</p>
                      <p className="text-blue-600 text-xs font-black">${item.price?.toFixed(2)}</p>
                    </div>
                    
                    {/* Contrôles quantité */}
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center text-sm font-bold transition"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center font-bold text-slate-900 text-sm">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center text-sm font-bold transition"
                        disabled={item.quantity >= item.stock}
                      >
                        <Plus size={14} />
                      </button>
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition ml-1"
                        title="Retirer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    
                    {/* Sous-total ligne */}
                    <div className="text-right min-w-[70px]">
                      <p className="font-black text-slate-900">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <ShoppingCart size={48} className="mb-4 opacity-50" />
                <p className="text-sm font-medium">Panier vide</p>
                <p className="text-xs">Ajoutez des produits pour commencer</p>
              </div>
            )}
          </div>

          {/* Totaux & Paiement */}
          <div className="border-t border-slate-200 pt-4 space-y-4">
            
            {/* Résumé prix */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Sous-total</span>
                <span className="font-bold text-slate-900">${subtotal.toFixed(2)}</span>
              </div>
              {taxRate > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Taxes ({taxRate}%)</span>
                  <span className="font-bold text-slate-900">${taxAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <span className="text-lg font-black text-slate-900">Total</span>
                <span className="text-2xl font-black text-blue-600">${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Sélection paiement */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 flex items-center gap-1">
                <CreditCard size={12} /> Mode de Paiement
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'cash', label: '💵 Cash', icon: DollarSign },
                  { id: 'pi_network', label: 'Π Pi', icon: null },
                  { id: 'mobile_money', label: '📱 Mobile', icon: Smartphone }
                ].map(method => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`p-3 rounded-xl border-2 transition-all text-center ${
                      paymentMethod === method.id
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {method.icon && <method.icon size={18} className="mx-auto mb-1" />}
                    <span className="text-[10px] font-bold uppercase">{method.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Bouton Finaliser */}
            <button
              onClick={handleFinalizeSale}
              disabled={isProcessing || cart.length === 0 || !customer.name.trim()}
              className={`w-full py-4 rounded-xl font-black uppercase text-xs tracking-wider transition-all flex items-center justify-center gap-2 ${
                isProcessing || cart.length === 0 || !customer.name.trim()
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white hover:from-blue-700 hover:to-indigo-800 shadow-lg shadow-blue-200 active:scale-[0.98]'
              }`}
            >
              {isProcessing ? (
                <>
                  <Loader className="animate-spin" size={18} /> Traitement...
                </>
              ) : (
                <>
                  <CheckCircle size={18} /> Valider Vente (${total.toFixed(2)})
                </>
              )}
            </button>

            {/* Raccourcis clavier info */}
            <p className="text-[10px] text-slate-400 text-center">
              <kbd className="px-1.5 py-0.5 bg-slate-200 rounded text-slate-600">F2</kbd> Nouveau panier • 
              <kbd className="px-1.5 py-0.5 bg-slate-200 rounded text-slate-600 ml-1">F5</kbd> Valider
            </p>
          </div>
        </div>
      </div>

      {/* 🎨 Styles CSS personnalisés */}
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-slideUp {
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default CashRegister;