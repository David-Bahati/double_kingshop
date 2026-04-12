import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/Product/ProductCard';
import apiService from '../services/api';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { getCartCount } = useCart();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await apiService.request('/products');
        setProducts(data);
      } catch (err) {
        setError('Erreur lors du chargement des produits');
        console.error('Erreur:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

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
                to="/login"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Connexion Admin
              </Link>
              <div className="relative">
                <Link
                  to="#cart"
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  🛒 Panier ({getCartCount()})
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

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

          {products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">Aucun produit disponible pour le moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                />
              ))}
            </div>
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
    </div>
  );
};

export default Home;