// src/components/Product/ProductCard.jsx
import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { CURRENCIES } from '../../utils/constants';
import { 
  ShoppingCart, Tag, Laptop, Eye, Pencil, Trash2, 
  Sparkles, AlertTriangle, Zap 
} from 'lucide-react';

const ProductCard = ({ 
  product, 
  showAdminActions = false, 
  onQuickView, 
  onEdit, 
  onDelete, 
  onTogglePublish 
}) => {
  const { addToCart } = useCart();
  const [imageError, setImageError] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // 🎯 Calcul prix Pi
  const priceInPi = (product.price / (CURRENCIES.PI?.rate || 1)).toFixed(9);

  // 🎯 Gestion URL Image
  const imageUrl = !imageError && product.image 
    ? (product.image.startsWith('http') ? product.image : `${window.location.origin}${product.image}`)
    : null;

  // 🎯 Badge "NOUVEAU" si < 7 jours
  const isNew = product.createdAt && new Date(product.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // 🎯 Statut Stock
  const getStockStatus = (stock) => {
    if (stock <= 0) return { color: 'bg-red-100 text-red-700 border-red-200', label: 'Rupture', pulse: false };
    if (stock < 5) return { color: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Faible', pulse: true };
    return { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Dispo', pulse: false };
  };
  const stockStatus = getStockStatus(product.stock);

  // 🎯 Handlers
  const handleAddToCart = async () => {
    if (product.stock <= 0) return;
    setIsAdding(true);
    try {
      await addToCart(product);
      setTimeout(() => setIsAdding(false), 600);
    } catch (err) {
      console.error('Erreur ajout panier:', err);
      setIsAdding(false);    }
  };

  const handleQuickView = (e) => { e.stopPropagation(); onQuickView?.(product); };
  const handleEdit = (e) => { e.stopPropagation(); onEdit?.(product); };
  const handleDelete = (e) => { e.stopPropagation(); if (onDelete) onDelete(product.id); };
  const handleTogglePublish = (e) => { e.stopPropagation(); onTogglePublish?.(product); };

  return (
    <article 
      className="group relative bg-white rounded-[2.5rem] p-4 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-100/50 hover:-translate-y-1 border border-slate-100 flex flex-col h-full cursor-default"
      aria-labelledby={`product-${product.id}-title`}
    >
      
      {/* 🏷️ BADGES SUPERPOSÉS */}
      <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-start gap-2 pointer-events-none">
        
        {/* Catégorie */}
        <span className="flex items-center gap-1.5 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm border border-slate-100 pointer-events-auto">
          <Tag size={10} className="text-blue-600" />
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-700">
            {product.category || "Accessoire"}
          </span>
        </span>

        {/* Badges Droite */}
        <div className="flex flex-col items-end gap-1.5">
          
          {/* 🆕 Badge Nouveau */}
          {isNew && (
            <span className="flex items-center gap-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-2.5 py-1 rounded-full shadow-sm pointer-events-auto">
              <Sparkles size={9} className="animate-pulse" />
              <span className="text-[8px] font-black uppercase tracking-tighter">New</span>
            </span>
          )}

          {/* 👁️ Badge Publié/Brouillon (Admin) */}
          {showAdminActions && (
            <span className={`flex items-center gap-1 px-2 py-1 rounded-full border text-[8px] font-black uppercase tracking-tighter pointer-events-auto cursor-pointer hover:opacity-80 transition ${
              product.published 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`} onClick={handleTogglePublish}>
              {product.published ? <Eye size={9} /> : <AlertTriangle size={9} />}
              {product.published ? 'Publié' : 'Brouillon'}
            </span>
          )}

          {/* 📦 Badge Stock */}
          <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-[8px] font-black uppercase tracking-tighter pointer-events-auto ${stockStatus.color}`}>            {stockStatus.label}
          </span>
        </div>
      </div>

      {/* 🛠️ ACTIONS ADMIN (Survol) */}
      {showAdminActions && (
        <div className="absolute top-20 right-4 z-30 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0 pointer-events-auto">
          <button onClick={handleEdit} className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg transition-all active:scale-95" title="Modifier">
            <Pencil size={14} />
          </button>
          <button onClick={handleDelete} className="p-2 bg-red-600 text-white rounded-xl hover:bg-red-700 shadow-lg transition-all active:scale-95" title="Supprimer">
            <Trash2 size={14} />
          </button>
        </div>
      )}

      {/* 🖼️ ZONE IMAGE + QUICK VIEW */}
      <div 
        className="relative aspect-square overflow-hidden rounded-[2rem] bg-slate-50 mb-6 flex items-center justify-center cursor-pointer group/image"
        onClick={handleQuickView}
      >
        {imageUrl ? (
          <>
            <img 
              src={imageUrl} 
              alt={product.name}
              loading="lazy"
              className={`h-full w-full object-cover transition-transform duration-700 group-hover/image:scale-110 ${imageError ? 'opacity-0' : 'opacity-100'}`}
              onError={() => setImageError(true)}
            />
            {/* Overlay Quick View */}
            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/image:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
              <span className="bg-white/90 backdrop-blur px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider text-slate-900 shadow-lg flex items-center gap-2">
                <Eye size={14} /> Aperçu rapide
              </span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center text-slate-300">
            <div className="p-4 bg-slate-100 rounded-2xl mb-2">
              <Laptop size={40} className="text-slate-400" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">DKS Bunia</span>
          </div>
        )}
      </div>

      {/* 📝 INFOS PRODUIT */}
      <div className="flex-1 px-2">        <h3 
          id={`product-${product.id}-title`}
          className="text-lg font-black text-slate-900 leading-tight uppercase italic tracking-tighter mb-1 truncate"
          title={product.name}
        >
          {product.name}
        </h3>
        <p className="text-slate-400 text-[11px] font-medium line-clamp-2 mb-4 min-h-[2.5rem]">
          {product.description || "Équipement informatique professionnel disponible chez Double King Shop."}
        </p>
        
        {/* 💰 DOUBLE PRIX (USD / Pi) */}
        <div className="flex justify-between items-end mb-6 bg-slate-50 p-3 rounded-2xl border border-slate-100">
          <div>
            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Prix USD</p>
            <p className="text-xl font-black text-blue-600 tracking-tighter">{product.price.toFixed(2)}$</p>
          </div>
          <div className="text-right">
            <p className="text-[8px] text-yellow-600 font-black uppercase tracking-widest">Paiement Pi</p>
            <p className="text-sm font-black text-yellow-700 tabular-nums">
              {parseFloat(priceInPi) < 0.001 ? priceInPi : parseFloat(priceInPi).toFixed(4)} π
            </p>
          </div>
        </div>
      </div>

      {/* 🛒 BOUTON PANIER */}
      <button 
        onClick={handleAddToCart}
        disabled={product.stock <= 0 || isAdding}
        className={`
          w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] transition-all relative overflow-hidden
          ${product.stock > 0 
            ? 'bg-slate-900 text-white hover:bg-blue-600 shadow-lg active:scale-[0.98]' 
            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          }
        `}
        aria-label={product.stock > 0 ? `Ajouter ${product.name} au panier` : `Rupture de stock`}
      >
        {isAdding && <span className="absolute inset-0 bg-white/20 animate-pulse" />}
        <ShoppingCart size={16} className={`transition-transform ${isAdding ? 'animate-bounce' : ''}`} />
        <span className="relative z-10">
          {product.stock <= 0 ? 'Rupture de stock' : isAdding ? 'Ajout...' : 'Ajouter au panier'}
        </span>
      </button>

      {/* ⚠️ ALERTE STOCK FAIBLE */}
      {product.stock > 0 && product.stock < 5 && (
        <p className="text-[9px] text-amber-600 font-bold text-center mt-2 flex items-center justify-center gap-1">
          <Zap size={10} className="fill-amber-600" /> Plus que {product.stock} en stock !        </p>
      )}
    </article>
  );
};

export default ProductCard;