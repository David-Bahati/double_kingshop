// src/pages/Categories.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Package, Eye, EyeOff, Plus, Trash2, X, Loader, 
  AlertCircle, Tag, ArrowLeft 
} from 'lucide-react';

import apiService from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { ROLES } from '../utils/constants';

const Categories = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();
  
  const [categories, setCategories] = useState([]);
  const [productCounts, setProductCounts] = useState({});
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });

  const isAdmin = user?.role === ROLES.ADMIN;

  // 🎯 Chargement initial
  useEffect(() => {
    if (!isAdmin) {
      // Rediriger les non-admins vers le catalogue
      navigate('/products');
      return;
    }
    loadData();
  }, [isAdmin, navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cats, products] = await Promise.all([
        apiService.getCategories(),
        apiService.getProducts()
      ]);
      
      setCategories(cats || []);
            // 🎯 Compter les produits par catégorie (filtrage par statut)
      const counts = {};
      (products || []).forEach(p => {
        // Seul l'admin voit tous les produits, les autres seulement les publiés
        if (isAdmin || p.published) {
          counts[p.category] = (counts[p.category] || 0) + 1;
        }
      });
      setProductCounts(counts);
      
    } catch (err) {
      console.error("Erreur chargement:", err);
      showError('Impossible de charger les catégories');
    } finally {
      setLoading(false);
    }
  };

  // 🎯 Validation du formulaire
  const validateForm = () => {
    const errors = {};
    if (!newCategory.name.trim()) errors.name = 'Le nom est requis';
    if (newCategory.name.length < 2) errors.name = 'Minimum 2 caractères';
    
    // Vérifier les doublons
    const exists = categories.some(c => 
      c.name.toLowerCase() === newCategory.name.trim().toLowerCase()
    );
    if (exists) errors.name = 'Cette catégorie existe déjà';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 🎯 Ajout de catégorie
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!isAdmin || !validateForm()) return;
    
    setIsSubmitting(true);
    try {
      await apiService.addCategory({
        name: newCategory.name.trim(),
        description: newCategory.description.trim()
      });
      
      showSuccess('Catégorie ajoutée avec succès');
      setShowModal(false);
      setNewCategory({ name: '', description: '' });
      setFormErrors({});      loadData();
    } catch (err) {
      console.error('Erreur ajout:', err);
      showError(err.message || 'Échec de l\'ajout');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🎯 Suppression de catégorie
  const handleDelete = async (id, categoryName) => {
    if (!isAdmin) return;
    
    const hasProducts = productCounts[categoryName] > 0;
    if (hasProducts) {
      showError(`Impossible : ${productCounts[categoryName]} produit(s) utilisent cette catégorie`);
      return;
    }
    
    if (window.confirm(`Supprimer définitivement "${categoryName}" ?`)) {
      try {
        await apiService.deleteCategory(id);
        showSuccess('Catégorie supprimée');
        loadData();
      } catch (err) {
        console.error('Erreur suppression:', err);
        showError('Échec de la suppression');
      }
    }
  };

  // 🎯 Fermeture du modal avec nettoyage
  const handleCloseModal = () => {
    setShowModal(false);
    setNewCategory({ name: '', description: '' });
    setFormErrors({});
  };

  // 🎯 Rendu Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="animate-spin mx-auto mb-4 text-blue-600" size={48} />
          <p className="text-slate-500 font-medium">Chargement des catégories...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-slate-50">
      
      {/* 🎯 HEADER */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                to="/admin/dashboard" 
                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition"
                aria-label="Retour au dashboard"
              >
                <ArrowLeft size={20} />
              </Link>
              <div>
                <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                  Catégories
                </h1>
                <p className="text-sm text-slate-500">Organisation du catalogue DKS</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Link 
                to="/products" 
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition"
              >
                <Package size={16} /> Voir les produits
              </Link>
              
              {isAdmin && (
                <button 
                  onClick={() => setShowModal(true)} 
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition shadow-sm"
                >
                  <Plus size={16} /> Nouvelle catégorie
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 🎯 CONTENU PRINCIPAL */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        
        {/* Stats rapides */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total</p>
            <p className="text-2xl font-black text-slate-900">{categories.length}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avec produits</p>
            <p className="text-2xl font-black text-blue-600">
              {Object.values(productCounts).filter(c => c > 0).length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vides</p>
            <p className="text-2xl font-black text-slate-600">
              {Object.values(productCounts).filter(c => c === 0).length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Produits</p>
            <p className="text-2xl font-black text-emerald-600">
              {Object.values(productCounts).reduce((a, b) => a + b, 0)}
            </p>
          </div>
        </div>

        {/* Tableau des catégories */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
          
          {/* En-tête du tableau */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="p-5 font-bold text-slate-600 text-xs uppercase tracking-wider">Catégorie</th>
                  <th className="p-5 font-bold text-slate-600 text-xs uppercase tracking-wider text-center">Produits</th>
                  <th className="p-5 font-bold text-slate-600 text-xs uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              
              <tbody className="divide-y divide-slate-100">
                {categories.map((cat) => {
                  const count = productCounts[cat.name] || 0;
                  const hasProducts = count > 0;
                  
                  return (
                    <tr key={cat.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-50 rounded-xl">
                            <Tag size={16} className="text-blue-600" />
                          </div>
                          <div>                            <span className="font-bold text-slate-900">{cat.name}</span>
                            {cat.description && (
                              <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                                {cat.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      
                      {/* 🎯 Compteur avec lien vers filtrage */}
                      <td className="p-5 text-center">
                        <Link 
                          to={`/products?category=${encodeURIComponent(cat.name)}`}
                          className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                            hasProducts 
                              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 hover:scale-105' 
                              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          }`}
                          onClick={(e) => !hasProducts && e.preventDefault()}
                          aria-label={`Voir les ${count} produit(s) de ${cat.name}`}
                        >
                          <Package size={12} />
                          {count} {count === 1 ? 'produit' : 'produits'}
                        </Link>
                      </td>
                      
                      {/* 🎯 Actions Admin */}
                      <td className="p-5 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleDelete(cat.id, cat.name)}
                            disabled={hasProducts}
                            className={`p-2 rounded-xl transition-all ${
                              hasProducts 
                                ? 'text-slate-300 cursor-not-allowed' 
                                : 'text-red-500 hover:bg-red-50 hover:text-red-600'
                            }`}
                            title={hasProducts ? "Catégorie utilisée par des produits" : "Supprimer"}
                            aria-label={`Supprimer ${cat.name}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        {!hasProducts && (
                          <span className="text-[10px] text-slate-400 italic group-hover:hidden">
                            Actions
                          </span>
                        )}
                      </td>                    </tr>
                  );
                })}
                
                {/* État vide */}
                {categories.length === 0 && (
                  <tr>
                    <td colSpan="3" className="p-12 text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                        <Package size={32} className="text-slate-400" />
                      </div>
                      <p className="text-slate-500 font-medium mb-2">Aucune catégorie</p>
                      <p className="text-slate-400 text-sm mb-4">Commencez par créer votre première catégorie</p>
                      {isAdmin && (
                        <button 
                          onClick={() => setShowModal(true)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition"
                        >
                          <Plus size={16} /> Créer une catégorie
                        </button>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* 🎯 MODAL D'AJOUT */}
      {showModal && isAdmin && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
            onClick={handleCloseModal}
          />
          
          {/* Modal Content */}
          <div className="relative bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl animate-slideUp">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-5 text-white flex justify-between items-center">
              <div>
                <h2 className="text-lg font-black uppercase tracking-tight">Nouvelle Catégorie</h2>
                <p className="text-blue-100 text-xs mt-0.5">Organisez votre catalogue</p>
              </div>
              <button 
                onClick={handleCloseModal}                 disabled={isSubmitting}
                className="p-2 hover:bg-white/20 rounded-full transition-colors disabled:opacity-50"
                aria-label="Fermer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Formulaire */}
            <form onSubmit={handleAddCategory} className="p-6 space-y-5">
              
              {/* Nom */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
                  Nom de la catégorie <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  required 
                  value={newCategory.name}
                  onChange={(e) => {
                    setNewCategory({...newCategory, name: e.target.value});
                    if (formErrors.name) setFormErrors(prev => ({...prev, name: ''}));
                  }}
                  className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm font-medium outline-none transition-all focus:ring-2 ${
                    formErrors.name 
                      ? 'border-red-300 focus:ring-red-200' 
                      : 'border-slate-200 focus:ring-blue-200 focus:border-blue-400'
                  }`}
                  placeholder="Ex: Claviers, Souris, Écrans..."
                  disabled={isSubmitting}
                  maxLength={50}
                />
                {formErrors.name && (
                  <p className="text-[10px] text-red-500 mt-1 ml-1 flex items-center gap-1">
                    <AlertCircle size={10} /> {formErrors.name}
                  </p>
                )}
                <p className="text-[10px] text-slate-400 mt-1">{newCategory.name.length}/50 caractères</p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
                  Description <span className="text-slate-400 font-normal">(optionnel)</span>
                </label>
                <textarea 
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none transition-all focus:ring-2 focus:ring-blue-200 resize-none"                  rows="3"
                  placeholder="Brève description de cette catégorie..."
                  disabled={isSubmitting}
                  maxLength={200}
                />
                <p className="text-[10px] text-slate-400 mt-1 text-right">{newCategory.description.length}/200</p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newCategory.name.trim()}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader className="animate-spin" size={16} /> Création...
                    </>
                  ) : (
                    '✅ Créer'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;