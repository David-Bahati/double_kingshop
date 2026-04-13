import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import ProductCard from '../components/Product/ProductCard';
import apiService from '../services/api';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [sortBy, setSortBy] = useState('name');
  const { getCartCount, cartItems, removeFromCart, updateQuantity, clearCart, isCartOpen, setIsCartOpen } = useCart();
  const { isDarkMode, toggleTheme } = useTheme();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await apiService.request('/products');
        setProducts(data);
        setFilteredProducts(data);
        
        // Extraire les catégories uniques
        const uniqueCategories = [...new Set(data.map(product => product.category).filter(Boolean))];
        setCategories(['Tous', ...uniqueCategories]);
      } catch (err) {
        setError('Erreur lors du chargement des produits');
        console.error('Erreur:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Filtrage et recherche en temps réel
  useEffect(() => {
    let filtered = products;

    // Filtre par recherche
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtre par catégorie
    if (selectedCategory !== 'Tous') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    // Tri
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        default:
          return 0;
      }
    });

    setFilteredProducts(filtered);
  }, [products, searchTerm, selectedCategory, sortBy]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des produits...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Double King Shop</h1>
              <span className="ml-2 text-yellow-600 text-2xl font-serif">♔</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/orders"
                className="text-gray-600 hover:text-blue-600 font-medium dark:text-gray-300 dark:hover:text-blue-400"
              >
                📋 Mes commandes
              </Link>
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
                title={isDarkMode ? 'Mode clair' : 'Mode sombre'}
              >
                {isDarkMode ? '☀️' : '🌙'}
              </button>
              <Link
                to="/login"
                className="text-blue-600 hover:text-blue-800 font-medium dark:text-blue-400 dark:hover:text-blue-300"
              >
                Connexion Admin
              </Link>
              <div className="relative">
                <button
                  onClick={() => setIsCartOpen(true)}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  🛒 Panier ({getCartCount()})
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Barre de recherche et filtres */}
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Recherche */}
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Rechercher des produits..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="absolute left-3 top-2.5 text-gray-400">🔍</div>
            </div>

            {/* Filtre par catégorie */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            {/* Tri */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="name">Trier par nom</option>
              <option value="price-low">Prix croissant</option>
              <option value="price-high">Prix décroissant</option>
              <option value="newest">Plus récent</option>
            </select>
          </div>
        </div>
      </section>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Bienvenue chez Double King Shop
          </h2>
          <p className="text-xl mb-8">
            Découvrez notre sélection de produits de qualité. Commandez facilement et payez avec Pi Network.
          </p>
          <div className="flex justify-center space-x-4">
            <span className="text-2xl">Π</span>
            <span className="text-lg">Paiement sécurisé avec Pi Network</span>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl font-bold text-center mb-12 text-gray-900">
            Nos Produits
          </h3>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                {products.length === 0 ? 'Aucun produit disponible pour le moment.' : 'Aucun produit ne correspond à vos critères.'}
              </p>
              {products.length > 0 && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('Tous');
                    setSortBy('name');
                  }}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Réinitialiser les filtres
                </button>
              )}
            </div>
          ) : (
            <>
              <p className="text-center text-gray-600 mb-8">
                {filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''} trouvé{filteredProducts.length > 1 ? 's' : ''}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2024 Double King Shop. Tous droits réservés.</p>
          <p className="mt-2 text-gray-400">
            Système de gestion complet avec paiement Pi Network
          </p>
        </div>
      </footer>

      {/* Modal Panier */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn">
            <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
              <h2 className="text-xl font-bold uppercase tracking-tight">Votre Panier</h2>
              <button onClick={() => setIsCartOpen(false)} className="text-2xl hover:scale-110 transition-transform">✕</button>
            </div>
            
            <div className="p-6 max-h-96 overflow-y-auto">
              {cartItems.length === 0 ? (
                <p className="text-center text-gray-500">Votre panier est vide</p>
              ) : (
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                      <img src={`http://localhost:3001${item.image}`} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />
                      <div className="flex-1">
                        <p className="font-bold text-sm">{item.name}</p>
                        <p className="text-blue-600 font-black text-sm">{item.price} $</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">-</button>
                        <span className="font-bold">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">+</button>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-700">🗑️</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {cartItems.length > 0 && (
              <div className="p-6 border-t bg-gray-50">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-bold">Total:</span>
                  <span className="text-xl font-black text-blue-600">{cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)} $</span>
                </div>
                <div className="flex gap-3">
                  <button onClick={clearCart} className="flex-1 bg-red-500 text-white py-2 rounded-lg font-bold hover:bg-red-600">Vider</button>
                  <Link to="/checkout" onClick={() => setIsCartOpen(false)} className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 text-center">Commander</Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;