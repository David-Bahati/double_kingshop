import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/Product/ProductCard';
import apiService from '../services/api';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await apiService.getProducts();
        setProducts(data || []);
      } catch (err) {
        console.error('Erreur produits:', err);
        setError('Impossible de charger les produits pour le moment.');
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Catalogue des produits</h1>
            <p className="text-sm text-slate-500">Tous les articles disponibles sur Double King Shop.</p>
          </div>
          <Link to="/" className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition">
            ← Retour à l'accueil
          </Link>
        </div>

        {loading ? (
          <div className="rounded-3xl bg-white p-8 text-center">Chargement des produits...</div>
        ) : error ? (
          <div className="rounded-3xl bg-white p-8 text-center text-red-600">{error}</div>
        ) : products.length === 0 ? (
          <div className="rounded-3xl bg-white p-8 text-center">Aucun produit disponible pour le moment.</div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;
