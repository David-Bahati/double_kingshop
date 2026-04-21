import React from 'react';
import { useCart } from '../context/CartContext';
import { CURRENCIES } from '../utils/constants';
import { ShoppingCart, Tag, Laptop } from 'lucide-react';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  
  // Calcul du prix en Pi basé sur ton taux de change (Conservé)
  const priceInPi = (product.price / (CURRENCIES.PI?.rate || 1)).toFixed(9);


  // Gestion de l'URL de l'image (Adapté pour Railway/Vercel)
  const imageUrl = product.image 
  ? (product.image.startsWith('http') ? product.image : `${window.location.origin}${product.image}`)
  : null;


  return (
    <div className="group relative bg-white rounded-[2.5rem] p-4 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-100 border border-slate-100 flex flex-col h-full">
      
      {/* BADGE DE CATÉGORIE & STOCK */}
      <div className="absolute top-6 left-6 right-6 z-10 flex justify-between items-center">
        <span className="flex items-center gap-1.5 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm border border-slate-100">
          <Tag size={10} className="text-blue-600" />
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-700">
            {product.category || "Accessoire"}
          </span>
        </span>
        
        <span className="bg-slate-900/80 backdrop-blur-md text-white text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-tighter">
          Stock: {product.stock}
        </span>
      </div>

      {/* ZONE IMAGE VISUELLE */}
      <div className="relative aspect-square overflow-hidden rounded-[2rem] bg-slate-50 mb-6 flex items-center justify-center">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="flex flex-col items-center text-slate-200">
            <Laptop size={48} />
            <span className="text-[10px] font-black uppercase mt-2">DKS Bunia</span>
          </div>
        )}
        <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>

      {/* INFOS PRODUIT & DOUBLE PRIX */}
      <div className="flex-1 px-2">
        <h3 className="text-lg font-black text-slate-900 leading-tight uppercase italic tracking-tighter mb-1 truncate">
          {product.name}
        </h3>
        <p className="text-slate-400 text-[11px] font-medium line-clamp-1 mb-4">
          {product.description || "Équipement informatique disponible chez Double King."}
        </p>
        
        <div className="flex justify-between items-end mb-6 bg-slate-50 p-3 rounded-2xl border border-slate-100">
          <div>
            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Prix USD</p>
            <p className="text-xl font-black text-blue-600 tracking-tighter">{product.price}$</p>
          </div>
          <div className="text-right">
            <p className="text-[8px] text-yellow-600 font-black uppercase tracking-widest">Paiement Pi</p>
            <p className="text-sm font-black text-yellow-700">{priceInPi} π</p>
           
          </div>
        </div>
      </div>

      {/* BOUTON AJOUTER AU PANIER */}
      <button 
        onClick={() => addToCart(product)}
        disabled={product.stock <= 0}
        className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] transition-all ${
          product.stock > 0 
          ? 'bg-slate-900 text-white hover:bg-blue-600 shadow-lg active:scale-95' 
          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
        }`}
      >
        <ShoppingCart size={16} />
        {product.stock > 0 ? "Ajouter au panier" : "Rupture de stock"}
      </button>
    </div>
  );
};

export default ProductCard;