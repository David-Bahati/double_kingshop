import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/Product/ProductCard';
import apiService from '../services/api';

const Home = () => {
  const categories = ['Électronique', 'Vêtements', 'Alimentation', 'Maison', 'Beauté'];
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const {
    cartItems,
    getCartCount,
    getCartTotal,
    removeFromCart,
    updateQuantity,
    clearCart,
    isCartOpen,
    setIsCartOpen
  } = useCart();

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await apiService.getProducts();
        setProducts(data || []);
      } catch (err) {
        console.error('Erreur chargement produits:', err);
        setError('Impossible de charger les produits pour le moment.');
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Link to="/" className="text-3xl font-bold tracking-tight text-slate-900 hover:text-blue-600 transition">
              Double King Shop
            </Link>
            <p className="mt-2 text-sm text-slate-500">Marketplace professionnel pour le commerce moderne.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsCartOpen(!isCartOpen)}
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              🛒 Panier ({getCartCount()})
            </button>
            <Link to="/login" className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">
              Accéder à l'administration
            </Link>
            <a href="#products" className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900">
              Nos produits
            </a>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-600 text-white py-24">
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.15),_transparent_30%)]" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] items-center">
              <div className="space-y-8">
                <p className="inline-flex rounded-full bg-white/10 px-4 py-2 text-sm uppercase tracking-[0.35em] text-cyan-200">
                  Marché professionnel
                </p>
                <h1 className="text-5xl font-bold leading-tight sm:text-6xl">
                  Une vitrine digitale façonnée pour vos ventes en ligne.
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-slate-200">
                  Double King Shop offre un parcours d’achat propre, fluide et fiable, avec gestion de stock et paiement simplifié.
                </p>
                <div className="flex flex-col gap-4 sm:flex-row">
                  <a href="#products" className="inline-flex items-center justify-center rounded-full bg-white px-7 py-4 text-base font-semibold text-slate-950 shadow-lg transition hover:bg-slate-100">
                    Explorer nos produits
                  </a>
                  <Link to="/login" className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-7 py-4 text-base font-semibold text-white transition hover:bg-white/15">
                    Se connecter
                  </Link>
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-white/10 p-8 shadow-2xl backdrop-blur-xl">
                <div className="grid gap-6">
                  <div className="rounded-3xl bg-white/10 p-6">
                    <p className="text-sm uppercase tracking-[0.3em] text-cyan-100">Gestion</p>
                    <h2 className="mt-4 text-2xl font-semibold">Stocks en temps réel</h2>
                    <p className="mt-2 text-slate-200">Pilotez votre inventaire et vos commandes depuis un tableau de bord clair.</p>
                  </div>
                  <div className="rounded-3xl bg-white/10 p-6">
                    <p className="text-sm uppercase tracking-[0.3em] text-cyan-100">Paiement</p>
                    <h2 className="mt-4 text-2xl font-semibold">Paiement simplifié</h2>
                    <p className="mt-2 text-slate-200">Offrez un paiement rapide et sécurisé à vos clients.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {isCartOpen && (
          <div className="fixed right-4 top-24 z-50 w-full max-w-md rounded-3xl border border-slate-200 bg-white shadow-2xl p-6 transition-transform duration-300">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Votre panier</h2>
                <p className="text-sm text-slate-500">{cartItems.length} article{cartItems.length > 1 ? 's' : ''}</p>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            {cartItems.length === 0 ? (
              <div className="rounded-3xl bg-slate-50 p-6 text-center text-slate-500">
                Votre panier est vide.
              </div>
            ) : (
              <div className="space-y-4">
                {cartItems.map(item => (
                  <div key={item.id} className="rounded-3xl border border-slate-200 p-4 bg-slate-50">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-bold text-slate-900">{item.name}</p>
                        <p className="text-sm text-slate-500">{item.price} $</p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-500 text-xs font-bold"
                      >
                        Supprimer
                      </button>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="h-8 w-8 rounded-full bg-slate-200 text-slate-700"
                      >
                        -
                      </button>
                      <span className="font-bold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="h-8 w-8 rounded-full bg-slate-200 text-slate-700"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}

                <div className="rounded-3xl border border-slate-200 bg-white p-4">
                  <div className="flex justify-between text-slate-600 mb-2">
                    <span>Total</span>
                    <span className="font-bold text-slate-900">{getCartTotal().toFixed(2)} $</span>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => clearCart()}
                      className="flex-1 rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      Vider
                    </button>
                    <Link
                      to="/checkout"
                      onClick={() => setIsCartOpen(false)}
                      className="flex-1 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white text-center hover:bg-blue-700"
                    >
                      Valider
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <section id="products" className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-10 text-center">
              <p className="text-sm uppercase tracking-[0.35em] text-blue-600">Marché</p>
              <h2 className="mt-3 text-4xl font-bold text-slate-900">Catégories populaires</h2>
              <p className="mt-3 text-slate-600 max-w-2xl mx-auto">
                Parcourez des catégories de produits bien organisées pour trouver rapidement ce qui vous convient.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {loading ? (
                <div className="col-span-full rounded-3xl bg-white p-8 shadow-lg border border-slate-200 text-center">
                  Chargement des produits...
                </div>
              ) : error ? (
                <div className="col-span-full rounded-3xl bg-white p-8 shadow-lg border border-slate-200 text-center text-red-600">
                  {error}
                </div>
              ) : products.length > 0 ? (
                products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))
              ) : (
                <div className="col-span-full rounded-3xl bg-white p-8 shadow-lg border border-slate-200 text-center">
                  Aucun produit disponible pour le moment.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="py-16 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-200">
                <h3 className="text-xl font-semibold text-slate-900">Visibilité</h3>
                <p className="mt-3 text-slate-600">Mettez en avant vos produits avec un design propre et professionnel.</p>
              </div>
              <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-200">
                <h3 className="text-xl font-semibold text-slate-900">Performance</h3>
                <p className="mt-3 text-slate-600">Offrez une navigation rapide et fluide à vos visiteurs.</p>
              </div>
              <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-200">
                <h3 className="text-xl font-semibold text-slate-900">Confiance</h3>
                <p className="mt-3 text-slate-600">Gérez vos ventes en toute confiance grâce à un système clair et sécurisé.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Home;
