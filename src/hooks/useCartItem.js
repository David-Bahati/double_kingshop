// src/hooks/useCartItem.js
import { useCart } from '../context/CartContext';

export const useCartItem = (product) => {
  const { 
    isInCart, 
    getQuantityInCart, 
    getAvailableStock,
    addToCart,
    removeFromCart,
    updateQuantity
  } = useCart();

  const inCart = isInCart(product?.id);
  const quantity = getQuantityInCart(product?.id);
  const available = getAvailableStock(product);
  const canAdd = available > 0 && product?.published;

  const handleAdd = () => canAdd && addToCart(product, 1);
  const handleRemove = () => removeFromCart(product?.id);
  const handleIncrement = () => canAdd && updateQuantity(product?.id, quantity + 1);
  const handleDecrement = () => quantity > 1 
    ? updateQuantity(product?.id, quantity - 1) 
    : handleRemove();

  return {
    inCart,
    quantity,
    available,
    canAdd,
    handleAdd,
    handleRemove,
    handleIncrement,
    handleDecrement
  };
};