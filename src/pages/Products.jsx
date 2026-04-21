import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, X, Loader, Edit2, Trash2, AlertCircle, Eye, EyeOff, Tag } from 'lucide-react';

// Contextes
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNotification } from '../context/NotificationContext';
import { ROLES } from '../utils/constants';

// Composants & Services
import ProductCard from '../components/Product/ProductCard';
import apiService from '../services/api';

const Products = () => {
  const { user, isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const { showSuccess, showError } = useNotification();
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // États pour le modal (Ajout/Modification)
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' ou 'edit'
  const [submitting, setSubmitting] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '', // ⚠️ OBLIGATOIRE
    stock: '',
    image: '',
    published: false // 🎯 Nouveau champ : statut de publication
  });

  // Liste des catégories disponibles (à charger dynamiquement si besoin)
  const CATEGORIES = [
    { value: 'Laptop', label: '💻 Laptop' },
    { value: 'Accessoire', label: '🔌 Accessoire' },
    { value: 'Périphérique', label: '🖱️ Périphérique' },
    { value: 'Composant', label: '⚙️ Composant' },
    { value: 'Réseau', label: '📡 Réseau' },
    { value: 'Stockage', label: '💾 Stockage' }
  ];

  // Vérifie si l'utilisateur est ADMIN (seul peut gérer les produits)  const isAdmin = isAuthenticated && user?.role === ROLES.ADMIN;

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await apiService.getProducts();
      
      // 🎯 FILTRE : Les non-admins ne voient QUE les produits publiés
      const visibleProducts = isAdmin 
        ? (data || []) 
        : (data || []).filter(p => p.published === true);
      
      setProducts(visibleProducts);
      setError(null);
    } catch (err) {
      console.error('Erreur produits:', err);
      setError('Impossible de charger les produits.');
      showError('Erreur de chargement des produits');
    } finally {
      setLoading(false);
    }
  };

  // Gestion des champs du formulaire
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  // Ouvrir le modal en mode AJOUT
  const handleOpenAddModal = () => {
    if (!isAdmin) return;
    setModalMode('add');
    setCurrentProduct(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      category: '', // ⚠️ Doit être sélectionné
      stock: '',
      image: '',
      published: false // Par défaut : non publié (brouillon)
    });    setShowModal(true);
  };

  // Ouvrir le modal en mode MODIFICATION
  const handleOpenEditModal = (product) => {
    if (!isAdmin) return;
    setModalMode('edit');
    setCurrentProduct(product);
    setFormData({
      name: product.name || '',
      description: product.description || '',
      price: product.price?.toString() || '',
      category: product.category || '',
      stock: product.stock?.toString() || '',
      image: product.image || '',
      published: product.published || false
    });
    setShowModal(true);
  };

  // Soumission du formulaire (Ajout ou Modification)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    
    // ⚠️ Validation : Catégorie obligatoire
    if (!formData.category) {
      showError('Veuillez sélectionner une catégorie');
      return;
    }
    
    setSubmitting(true);

    try {
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock, 10),
        published: formData.published // ✅ Inclure le statut de publication
      };

      let result;
      if (modalMode === 'add') {
        result = await apiService.createProduct(productData);
        setProducts(prev => [result, ...prev]);
        showSuccess(formData.published 
          ? 'Produit ajouté et publié avec succès !' 
          : 'Produit enregistré en brouillon');
      } else {
        result = await apiService.updateProduct(currentProduct.id, productData);        setProducts(prev => prev.map(p => p.id === currentProduct.id ? result : p));
        showSuccess(formData.published 
          ? 'Produit publié avec succès !' 
          : 'Produit mis en brouillon');
      }
      
      setShowModal(false);
      setFormData({ name: '', description: '', price: '', category: '', stock: '', image: '', published: false });
      
    } catch (err) {
      console.error('Erreur produit:', err);
      showError(modalMode === 'add' ? 'Échec de l\'ajout du produit' : 'Échec de la modification');
    } finally {
      setSubmitting(false);
    }
  };

  // SUPPRESSION d'un produit
  const handleDelete = async (product) => {
    if (!isAdmin) return;
    
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer "${product.name}" ?`)) {
      return;
    }

    try {
      await apiService.deleteProduct(product.id);
      setProducts(prev => prev.filter(p => p.id !== product.id));
      showSuccess('Produit supprimé avec succès !');
    } catch (err) {
      console.error('Erreur suppression:', err);
      showError('Échec de la suppression du produit');
    }
  };

  // 🎯 TOGGLE PUBLICATION (Admin uniquement)
  const handleTogglePublish = async (product) => {
    if (!isAdmin) return;
    
    const newStatus = !product.published;
    
    try {
      const updated = await apiService.updateProduct(product.id, {
        ...product,
        published: newStatus
      });
      
      setProducts(prev => prev.map(p => p.id === product.id ? updated : p));
      showSuccess(newStatus 
        ? `✅ "${product.name}" est maintenant publié`         : `📦 "${product.name}" est en brouillon`);
    } catch (err) {
      console.error('Erreur publication:', err);
      showError('Échec de la mise à jour du statut');
    }
  };

  // Fermer le modal avec Échap
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') setShowModal(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Catalogue des produits</h1>
            <p className="text-sm text-slate-500">
              {isAdmin 
                ? 'Gérez les produits disponibles sur Double King Shop.' 
                : 'Tous les articles disponibles sur Double King Shop.'}
            </p>
          </div>
          
          <div className="flex gap-3">
            {/* 👉 BOUTON + PRODUIT : Uniquement pour ADMIN */}
            {isAdmin && (
              <button 
                onClick={handleOpenAddModal}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700 transition shadow-lg active:scale-95"
              >
                <Plus size={18} /> Ajouter Produit
              </button>
            )}
            
            <Link 
              to="/" 
              className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              ← Accueil
            </Link>
          </div>
        </div>
        {/* LISTE DES PRODUITS */}
        {loading ? (
          <div className="rounded-3xl bg-white p-12 text-center text-slate-500">
            <Loader className="animate-spin mx-auto mb-3" size={24} />
            Chargement des produits...
          </div>
        ) : error ? (
          <div className="rounded-3xl bg-white p-8 text-center text-red-600 font-medium">
            <AlertCircle className="mx-auto mb-2" size={32} />
            {error}
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-3xl bg-white p-8 text-center text-slate-500">
            <p className="mb-4">
              {isAdmin 
                ? 'Aucun produit enregistré. Commencez par en ajouter un !' 
                : 'Aucun produit disponible pour le moment.'}
            </p>
            {isAdmin && (
              <button 
                onClick={handleOpenAddModal} 
                className="inline-flex items-center gap-2 text-blue-600 font-bold hover:underline"
              >
                <Plus size={16} /> Ajouter le premier produit
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <div key={product.id} className="relative group">
                
                {/* 🎯 BADGE STATUT PUBLICATION (Admin uniquement) */}
                {isAdmin && (
                  <div className="absolute top-4 left-4 z-20">
                    <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      product.published 
                        ? 'bg-green-100 text-green-700 border border-green-200' 
                        : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                    }`}>
                      {product.published ? <Eye size={10} /> : <EyeOff size={10} />}
                      {product.published ? 'Publié' : 'Brouillon'}
                    </span>
                  </div>
                )}

                {/* 🎯 BOUTONS ADMIN (Edit, Delete, Publish) - Uniquement visible par ADMIN */}
                {isAdmin && (
                  <div className="absolute top-4 right-4 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">                    
                    {/* 🔘 Bouton Publier/Dépublier */}
                    <button
                      onClick={() => handleTogglePublish(product)}
                      className={`p-2 rounded-full shadow-lg transition active:scale-95 ${
                        product.published 
                          ? 'bg-yellow-500 text-white hover:bg-yellow-600' 
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                      title={product.published ? 'Dépublier (mettre en brouillon)' : 'Publier sur le site'}
                    >
                      {product.published ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    
                    {/* ✏️ Bouton Modifier */}
                    <button
                      onClick={() => handleOpenEditModal(product)}
                      className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 shadow-lg transition active:scale-95"
                      title="Modifier"
                    >
                      <Edit2 size={14} />
                    </button>
                    
                    {/* 🗑️ Bouton Supprimer */}
                    <button
                      onClick={() => handleDelete(product)}
                      className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-lg transition active:scale-95"
                      title="Supprimer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
                
                {/* Carte Produit */}
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}

        {/* MODAL D'AJOUT / MODIFICATION */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay */}
            <div 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => !submitting && setShowModal(false)}
            />
                        {/* Contenu du modal */}
            <div className="relative bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
              
              {/* Header du modal */}
              <div className="sticky top-0 bg-white/95 backdrop-blur px-6 py-4 border-b border-slate-100 flex items-center justify-between rounded-t-3xl">
                <h3 className="text-xl font-black text-slate-900">
                  {modalMode === 'add' ? '➕ Nouveau Produit' : '✏️ Modifier le Produit'}
                </h3>
                <button 
                  onClick={() => !submitting && setShowModal(false)}
                  disabled={submitting}
                  className="p-2 hover:bg-slate-100 rounded-full transition disabled:opacity-50"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Formulaire */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Nom du produit *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Ex: Laptop HP ProBook 450"
                    className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    required
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Brève description du produit..."
                    rows="2"
                    className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none"
                    disabled={submitting}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Prix USD *
                    </label>
                    <input
                      type="number"
                      name="price"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                      required
                      disabled={submitting}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Stock *
                    </label>
                    <input
                      type="number"
                      name="stock"
                      min="0"
                      value={formData.stock}
                      onChange={handleInputChange}
                      placeholder="0"
                      className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                      required
                      disabled={submitting}
                    />
                  </div>
                </div>

                {/* ⚠️ CATÉGORIE OBLIGATOIRE */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Catégorie * <span className="text-red-500">(obligatoire)</span>
                  </label>
                  <div className="relative">
                    <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full pl-9 pr-3 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white"
                      required                      disabled={submitting}
                    >
                      <option value="">-- Sélectionner une catégorie --</option>
                      {CATEGORIES.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                  {!formData.category && modalMode === 'add' && (
                    <p className="text-[10px] text-yellow-600 mt-1 flex items-center gap-1">
                      <AlertCircle size={10} /> Un produit doit appartenir à une catégorie
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    URL de l'image (optionnel)
                  </label>
                  <input
                    type="url"
                    name="image"
                    value={formData.image}
                    onChange={handleInputChange}
                    placeholder="https://exemple.com/image.jpg"
                    className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    disabled={submitting}
                  />
                </div>

                {/* 🎯 TOGGLE PUBLICATION (Admin uniquement) */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${formData.published ? 'bg-green-100' : 'bg-yellow-100'}`}>
                      {formData.published ? <Eye size={16} className="text-green-600"/> : <EyeOff size={16} className="text-yellow-600"/>}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        {formData.published ? 'Produit publié' : 'Produit en brouillon'}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {formData.published 
                          ? 'Visible sur la page d\'accueil et le catalogue' 
                          : 'Visible uniquement par l\'administrateur'}
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="published"
                      checked={formData.published}
                      onChange={handleInputChange}
                      className="sr-only peer"
                      disabled={submitting}
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    disabled={submitting}
                    className="flex-1 py-3.5 rounded-xl font-black uppercase text-xs tracking-wider bg-slate-100 text-slate-600 hover:bg-slate-200 transition disabled:opacity-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-3.5 rounded-xl font-black uppercase text-xs tracking-wider bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-70 flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader className="animate-spin" size={16} /> 
                        {modalMode === 'add' ? 'Enregistrement...' : 'Modification...'}
                      </>
                    ) : (
                      modalMode === 'add' 
                        ? (formData.published ? '🚀 Ajouter & Publier' : '💾 Enregistrer en brouillon')
                        : '💾 Enregistrer les modifications'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Products;