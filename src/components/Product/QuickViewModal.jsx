// src/components/Product/QuickViewModal.jsx
import React, { useState, useEffect } from 'react';
import { 
  X, ShoppingCart, Tag, Laptop, Eye, AlertTriangle, 
  Loader, Pencil, Trash2, Zap 
} from 'lucide-react';
import { CURRENCIES } from '../../utils/constants';

const QuickViewModal = ({ 
  product, 
  isOpen, 
  onClose, 
  onAddToCart, 
  onEdit, 
  onDelete, 
  isAdmin = false 
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [imageError, setImageError] = useState(false);

  // 🎯 Calculs et états
  const priceInPi = product?.price 
    ? (product.price / (CURRENCIES.PI?.rate || 1)).toFixed(9) 
    : '0';

  const images = product?.image 
    ? [product.image.startsWith('http') ? product.image : `${window.location.origin}${product.image}`]
    : [];

  // Statut du stock
  const getStockStatus = (stock) => {
    if (stock <= 0) return { color: 'text-red-600 bg-red-50 border-red-100', label: 'Rupture de stock', icon: AlertTriangle };
    if (stock < 5) return { color: 'text-amber-600 bg-amber-50 border-amber-100', label: `Plus que ${stock} en stock !`, icon: Zap };
    return { color: 'text-emerald-600 bg-emerald-50 border-emerald-100', label: 'En stock', icon: Tag };
  };
  const stockStatus = getStockStatus(product?.stock || 0);
  const StockIcon = stockStatus.icon;

  // 🎯 Gestionnaire Ajout Panier
  const handleAddToCart = async () => {
    if (!product || product.stock <= 0) return;
    setIsAdding(true);
    try {
      await onAddToCart(product);
      // Petit délai visuel avant fermeture ou succès
      setTimeout(() => setIsAdding(false), 800);
    } catch (err) {
      console.error('Erreur ajout panier:', err);
      setIsAdding(false);
    }  };

  // 🎯 Fermer avec Échap
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // 🎯 Bloquer le scroll du body
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6">
      {/* Overlay avec Blur */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-white rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl animate-slideUp flex flex-col md:flex-row">
        
        {/* Bouton Fermer */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 bg-white/90 backdrop-blur rounded-full shadow-lg hover:bg-slate-100 transition-colors"
          aria-label="Fermer"
        >
          <X size={20} className="text-slate-600" />
        </button>

        {/* 🖼️ Section Image (Gauche - Desktop) */}
        <div className="relative w-full md:w-1/2 bg-gradient-to-br from-slate-50 to-slate-100 p-8 flex items-center justify-center">
          {images.length > 0 && !imageError ? (
            <img 
              src={images[0]} 
              alt={product.name}
              className="w-full h-full max-h-[350px] object-contain drop-shadow-xl"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex flex-col items-center text-slate-300">
              <div className="p-6 bg-slate-200/50 rounded-3xl mb-4">                <Laptop size={64} className="text-slate-400" />
              </div>
              <span className="text-sm font-black uppercase tracking-wider text-slate-400">DKS Bunia</span>
            </div>
          )}
        </div>

        {/* 📝 Section Infos (Droite - Desktop) */}
        <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col overflow-y-auto custom-scrollbar">
          
          {/* Header : Catégorie + Statut */}
          <div className="flex items-start justify-between mb-4">
            <span className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full">
              <Tag size={14} className="text-blue-600" />
              <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                {product.category || 'Non classé'}
              </span>
            </span>
            
            {/* Badge Publié/Brouillon (Admin) */}
            {isAdmin && (
              <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase border ${
                product.published 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {product.published ? '✓ Publié' : '✗ Brouillon'}
              </span>
            )}
          </div>

          {/* Titre + Description */}
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 uppercase italic tracking-tighter mb-3">
            {product.name}
          </h2>
          <p className="text-slate-500 text-sm leading-relaxed mb-6">
            {product.description || "Équipement informatique professionnel disponible chez Double King Shop. Qualité garantie, support technique inclus."}
          </p>

          {/* 💰 Prix Double */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 p-4 rounded-2xl border border-slate-100 mb-6">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Prix USD</p>
                <p className="text-3xl font-black text-blue-600 tracking-tighter">
                  {product.price?.toFixed(2)}<span className="text-xl align-top">$</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-yellow-600 font-black uppercase tracking-widest mb-1">Paiement Pi</p>                <p className="text-lg font-black text-yellow-700 tabular-nums">
                  {parseFloat(priceInPi) < 0.001 ? priceInPi : parseFloat(priceInPi).toFixed(4)} π
                </p>
              </div>
            </div>
          </div>

          {/* Stock Status */}
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border mb-6 ${stockStatus.color}`}>
            <StockIcon size={20} />
            <span className="text-sm font-bold">{stockStatus.label}</span>
          </div>

          {/* Actions */}
          <div className="mt-auto space-y-4">
            <button 
              onClick={handleAddToCart}
              disabled={product.stock <= 0 || isAdding}
              className={`
                w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all
                ${product.stock > 0 
                  ? 'bg-gradient-to-r from-slate-900 to-slate-800 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-blue-200 active:scale-[0.98]' 
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }
              `}
            >
              {isAdding ? (
                <>
                  <Loader className="animate-spin" size={18} />
                  AJOUT EN COURS...
                </>
              ) : (
                <>
                  <ShoppingCart size={18} />
                  {product.stock > 0 ? 'AJOUTER AU PANIER' : 'RUPTURE DE STOCK'}
                </>
              )}
            </button>

            {/* Actions Admin (Modifier / Supprimer) */}
            {isAdmin && (
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => { onClose(); onEdit?.(product); }}
                  className="flex items-center justify-center gap-2 py-3 bg-blue-50 text-blue-700 rounded-xl font-bold text-xs hover:bg-blue-100 transition"
                >
                  <Pencil size={14} /> Modifier
                </button>
                <button 
                  onClick={() => {                     if(window.confirm(`Supprimer "${product.name}" ?`)) { 
                      onClose(); 
                      onDelete?.(product.id); 
                    } 
                  }}
                  className="flex items-center justify-center gap-2 py-3 bg-red-50 text-red-700 rounded-xl font-bold text-xs hover:bg-red-100 transition"
                >
                  <Trash2 size={14} /> Supprimer
                </button>
              </div>
            )}

            {/* Footer Info */}
            <div className="text-center pt-2">
              <p className="text-[10px] text-slate-400">
                SKU: <span className="font-mono text-slate-600">DKS-{product.id?.toString().slice(-6).toUpperCase()}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickViewModal;