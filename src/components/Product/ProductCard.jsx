import React from 'react';
import { useCart } from '../../context/CartContext';
import { CURRENCIES } from '../../utils/constants';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  
  // Calcul du prix en Pi basé sur ton taux de change
  const priceInPi = (product.price / (CURRENCIES.PI?.rate || 1)).toFixed(4);

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 border border-gray-100">
      <div className="h-48 bg-gray-200 relative">
        {product.image && product.image !== '/uploads/default.jpg' ? (
          <img src={`http://localhost:3001${product.image}`} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <span className="text-4xl">IT</span>
          </div>
        )}
        <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
          Stock: {product.stock}
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-lg font-bold text-gray-800 truncate">{product.name}</h3>
        <p className="text-sm text-gray-500 mb-3 h-10 overflow-hidden">{product.description}</p>
        
        <div className="flex justify-between items-end mb-4">
          <div>
            <p className="text-xs text-gray-400">Prix</p>
            <p className="text-xl font-bold text-blue-700">{product.price} $</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-yellow-600 font-bold uppercase">Payez en Pi</p>
            <p className="text-md font-semibold text-yellow-700">{priceInPi} Π</p>
          </div>
        </div>

        <button
          onClick={() => addToCart(product)}
          className="w-full bg-gray-900 hover:bg-blue-600 text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          <span>🛒</span> Ajouter au panier
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
