// src/pages/Products.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Loader, AlertCircle, Filter, Search } from 'lucide-react';

// Contextes
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNotification } from '../context/NotificationContext';
import { ROLES } from '../utils/constants';

// Composants
import ProductCard from '../components/Product/ProductCard';
import QuickViewModal from '../components/Product/QuickViewModal';
import AddProductModal from '../components/Product/AddProductModal';

// Services
import apiService from '../services/api';

const Products = () => {
  const { user, isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const { showSuccess, showError } = useNotification();
  const [searchParams] = useSearchParams();
  
  // États principaux
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filtres & Recherche
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'published' | 'draft'
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showQuickView, setShowQuickView] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  
  // Permissions
  const isAdmin = isAuthenticated && user?.role === ROLES.ADMIN;

  // 🎯 Chargement initial
  useEffect(() => {
    loadData();
  }, []);
  // 🎯 Filtrage par catégorie depuis l'URL (?category=Laptop)
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      setCategoryFilter(categoryParam);
    }
  }, [searchParams]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [prods, cats] = await Promise.all([
        apiService.getProducts(),
        apiService.getCategories()
      ]);
      
      setProducts(prods || []);
      setCategories(cats || []);
      setError(null);
    } catch (err) {
      console.error('Erreur chargement:', err);
      setError('Impossible de charger les produits.');
      showError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  // 🎯 Filtrage combiné (recherche + catégorie + statut)
  const filteredProducts = useMemo(() => {
    let result = products;
    
    // Filtrage par statut de publication
    if (!isAdmin) {
      result = result.filter(p => p.published === true);
    } else if (statusFilter !== 'all') {
      result = result.filter(p => statusFilter === 'published' ? p.published : !p.published);
    }
    
    // Filtrage par catégorie
    if (categoryFilter !== 'all') {
      result = result.filter(p => p.category === categoryFilter);
    }
    
    // Recherche textuelle
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name?.toLowerCase().includes(query) || 
        p.description?.toLowerCase().includes(query) ||        p.category?.toLowerCase().includes(query)
      );
    }
    
    return result;
  }, [products, isAdmin, statusFilter, categoryFilter, searchQuery]);

  // 🎯 Liste des catégories uniques pour le filtre
  const availableCategories = useMemo(() => {
    const cats = [...new Set(products.map(p => p.category).filter(Boolean))];
    return ['all', ...cats];
  }, [products]);

  // ==================== ACTIONS PRODUITS ====================

  // ➕ Ajout d'un produit
  const handleAddProduct = async (formData, mode, productId) => {
    try {
      let result;
      if (mode === 'add') {
        result = await apiService.addProduct(formData);
        setProducts(prev => [result, ...prev]);
        showSuccess('Produit ajouté avec succès !');
      } else {
        result = await apiService.updateProduct(productId, formData);
        setProducts(prev => prev.map(p => p.id === productId ? result : p));
        showSuccess('Produit mis à jour !');
      }
      setShowAddModal(false);
      setEditingProduct(null);
    } catch (err) {
      console.error('Erreur produit:', err);
      showError(err.message || 'Échec de l\'opération');
      throw err;
    }
  };

  // ✏️ Ouvrir l'édition
  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowAddModal(true);
  };

  // 🗑️ Suppression
  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Supprimer définitivement ce produit ?')) return;
    
    try {
      await apiService.deleteProduct(productId);
      setProducts(prev => prev.filter(p => p.id !== productId));      showSuccess('Produit supprimé');
    } catch (err) {
      showError('Erreur lors de la suppression');
    }
  };

  // 👁️ Toggle publication (rapide)
  const handleTogglePublish = async (product) => {
    try {
      const updated = await apiService.updateProduct(product.id, {
        ...product,
        published: !product.published
      });
      setProducts(prev => prev.map(p => p.id === product.id ? updated : p));
      showSuccess(updated.published ? 'Produit publié ✅' : 'Produit mis en brouillon 📦');
    } catch (err) {
      showError('Erreur de mise à jour');
    }
  };

  // 👁️ Quick View
  const handleQuickView = (product) => {
    setQuickViewProduct(product);
    setShowQuickView(true);
  };

  // 🔄 Rafraîchir les données
  const handleRefresh = async () => {
    await loadData();
    showSuccess('Données actualisées');
  };

  // ==================== RENDER ====================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="animate-spin mx-auto mb-4 text-blue-600" size={48} />
          <p className="text-slate-500 font-medium">Chargement du catalogue...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md text-center shadow-sm border border-red-100">
          <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />          <h2 className="text-xl font-bold text-slate-900 mb-2">Oups !</h2>
          <p className="text-slate-500 mb-6">{error}</p>
          <button 
            onClick={handleRefresh}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      
      {/* 🎯 HEADER */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Titre + Stats */}
            <div>
              <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                Catalogue DKS
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                {filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''} • 
                {isAdmin && ` ${products.filter(p => p.published).length} publiés`}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {/* Recherche */}
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-slate-100 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none w-48"
                />
              </div>

              {/* Filtre Catégorie */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}                className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="all">Toutes catégories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>

              {/* Filtre Statut (Admin uniquement) */}
              {isAdmin && (
                <div className="flex bg-slate-100 rounded-xl p-1">
                  {['all', 'published', 'draft'].map(status => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                        statusFilter === status 
                          ? 'bg-white text-blue-600 shadow-sm' 
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {status === 'all' ? 'Tous' : status === 'published' ? 'Publiés' : 'Brouillons'}
                    </button>
                  ))}
                </div>
              )}

              {/* Bouton Ajouter (Admin) */}
              {isAdmin && (
                <button 
                  onClick={() => { setEditingProduct(null); setShowAddModal(true); }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition shadow-sm"
                >
                  <Plus size={16} /> Ajouter
                </button>
              )}

              {/* Refresh */}
              <button 
                onClick={handleRefresh}
                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition"
                title="Actualiser"
              >
                <Filter size={18} />
              </button>

              {/* Retour Accueil */}
              <Link 
                to="/" 
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition"              >
                ← Accueil
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* 🎯 CONTENU PRINCIPAL */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Message si aucun résultat */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
              <AlertCircle size={32} className="text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Aucun produit trouvé</h3>
            <p className="text-slate-500 mb-6">
              {searchQuery || categoryFilter !== 'all' || (isAdmin && statusFilter !== 'all')
                ? 'Essayez de modifier vos filtres de recherche.'
                : isAdmin 
                  ? 'Commencez par ajouter votre premier produit !' 
                  : 'Revenez plus tard pour découvrir nos nouveautés.'}
            </p>
            {isAdmin && !searchQuery && categoryFilter === 'all' && statusFilter === 'all' && (
              <button 
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition"
              >
                <Plus size={18} /> Ajouter un produit
              </button>
            )}
          </div>
        ) : (
          /* Grille de produits */
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product}
                showAdminActions={isAdmin}
                onQuickView={handleQuickView}
                onEdit={handleEditProduct}
                onDelete={handleDeleteProduct}
                onTogglePublish={handleTogglePublish}
              />
            ))}
          </div>
        )}      </main>

      {/* 🎯 MODAL AJOUT/MODIFICATION */}
      <AddProductModal 
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); setEditingProduct(null); }}
        onAdd={handleAddProduct}
        categories={categories}
        product={editingProduct}
        mode={editingProduct ? 'edit' : 'add'}
      />

      {/* 🎯 MODAL QUICK VIEW */}
      <QuickViewModal 
        product={quickViewProduct}
        isOpen={showQuickView}
        onClose={() => { setShowQuickView(false); setQuickViewProduct(null); }}
        onAddToCart={addToCart}
        onEdit={handleEditProduct}
        onDelete={handleDeleteProduct}
        isAdmin={isAdmin}
      />

    </div>
  );
};

export default Products;