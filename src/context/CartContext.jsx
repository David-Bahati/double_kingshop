// src/context/CartContext.jsx
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useNotification } from './NotificationContext';

const CartContext = createContext(null);

// 🎯 Clé localStorage pour la persistance du panier
const CART_STORAGE_KEY = 'dks_cart';

export const CartProvider = ({ children }) => {
  const { showSuccess, showError, showInfo } = useNotification?.() || {};
  
  // 🎯 Initialisation avec chargement depuis localStorage
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (err) {
      console.error('Erreur lecture panier localStorage:', err);
      return [];
    }
  });
  
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  // 🎯 Persistance automatique dans localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
      setLastUpdate(Date.now());
    } catch (err) {
      console.error('Erreur sauvegarde panier:', err);
    }
  }, [cartItems]);

  // 🎯 Nettoyer le panier si un produit n'est plus disponible (optionnel)
  const validateCartItems = useCallback((items, availableProducts = []) => {
    if (availableProducts.length === 0) return items;
    
    return items.filter(item => {
      const product = availableProducts.find(p => p.id === item.id);
      return product && product.published && product.stock > 0;
    }).map(item => {
      const product = availableProducts.find(p => p.id === item.id);
      // Ajuster la quantité si le stock a diminué
      if (product && item.quantity > product.stock) {
        return { ...item, quantity: product.stock };
      }
      return item;    });
  }, []);

  // 🎯 Ajouter au panier avec validations
  const addToCart = useCallback((product, quantity = 1) => {
    // 🔒 Validation : produit doit être publié et en stock
    if (!product?.published) {
      showError?.('Ce produit n\'est pas disponible à la vente');
      return false;
    }
    
    if (product.stock <= 0) {
      showError?.('Rupture de stock');
      return false;
    }
    
    // 🔒 Validation : quantité demandée
    if (quantity <= 0) {
      showError?.('Quantité invalide');
      return false;
    }
    
    if (quantity > product.stock) {
      showError?.(`Stock insuffisant : seulement ${product.stock} disponible(s)`);
      return false;
    }

    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      
      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        
        // 🔒 Vérifier que la nouvelle quantité ne dépasse pas le stock
        if (newQuantity > product.stock) {
          showError?.(`Quantité maximale atteinte : ${product.stock} disponible(s)`);
          return prevItems;
        }
        
        showInfo?.(`${product.name} : quantité mise à jour`);
        return prevItems.map(item =>
          item.id === product.id
            ? { ...item, quantity: newQuantity }
            : item
        );
      }
      
      // 🔒 Ajouter seulement si le produit est valide
      const newItem = {
        id: product.id,        name: product.name,
        price: product.price,
        stock: product.stock,
        category: product.category,
        image: product.image,
        published: product.published,
        quantity: Math.min(quantity, product.stock) // Sécurité supplémentaire
      };
      
      showSuccess?.(`${product.name} ajouté au panier`);
      return [...prevItems, newItem];
    });
    
    // Ouvrir le panier automatiquement au premier ajout
    if (cartItems.length === 0) {
      setIsCartOpen(true);
    }
    
    return true;
  }, [cartItems.length, showError, showInfo, showSuccess]);

  // 🎯 Retirer du panier
  const removeFromCart = useCallback((productId) => {
    setCartItems(prevItems => {
      const item = prevItems.find(i => i.id === productId);
      if (item) {
        showInfo?.(`${item.name} retiré du panier`);
      }
      return prevItems.filter(item => item.id !== productId);
    });
  }, [showInfo]);

  // 🎯 Mettre à jour la quantité
  const updateQuantity = useCallback((productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCartItems(prevItems => {
      const item = prevItems.find(i => i.id === productId);
      if (!item) return prevItems;
      
      // 🔒 Vérifier le stock disponible
      if (quantity > item.stock) {
        showError?.(`Stock insuffisant : seulement ${item.stock} disponible(s)`);
        return prevItems;
      }
      
      return prevItems.map(i =>        i.id === productId ? { ...i, quantity } : i
      );
    });
  }, [removeFromCart, showError]);

  // 🎯 Vider le panier
  const clearCart = useCallback(() => {
    setCartItems([]);
    showInfo?.('Panier vidé');
  }, [showInfo]);

  // 🎯 Calcul du total
  const getCartTotal = useCallback(() => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  }, [cartItems]);

  // 🎯 Nombre total d'articles (somme des quantités)
  const getCartCount = useCallback(() => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  }, [cartItems]);

  // 🎯 Nombre de lignes distinctes dans le panier
  const getCartItemsCount = useCallback(() => {
    return cartItems.length;
  }, [cartItems]);

  // 🎯 Vérifier si un produit est dans le panier
  const isInCart = useCallback((productId) => {
    return cartItems.some(item => item.id === productId);
  }, [cartItems]);

  // 🎯 Obtenir la quantité d'un produit dans le panier
  const getQuantityInCart = useCallback((productId) => {
    const item = cartItems.find(i => i.id === productId);
    return item?.quantity || 0;
  }, [cartItems]);

  // 🎯 Vérifier la disponibilité pour un produit (stock restant après panier)
  const getAvailableStock = useCallback((product) => {
    const inCart = getQuantityInCart(product.id);
    return Math.max(0, (product.stock || 0) - inCart);
  }, [getQuantityInCart]);

  // 🎯 Export du panier pour commande
  const getCartForOrder = useCallback(() => {
    return cartItems.map(item => ({
      productId: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,      subtotal: item.price * item.quantity
    }));
  }, [cartItems]);

  // 🎯 Valeurs exposées par le contexte
  const value = {
    // États
    cartItems,
    isCartOpen,
    lastUpdate,
    
    // Actions
    setIsCartOpen,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    
    // Calculs
    getCartTotal,
    getCartCount,
    getCartItemsCount,
    
    // Helpers
    isInCart,
    getQuantityInCart,
    getAvailableStock,
    getCartForOrder,
    validateCartItems
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

// 🎯 Hook personnalisé avec vérification
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart doit être utilisé dans un CartProvider');
  }
  return context;
};

export default CartContext;