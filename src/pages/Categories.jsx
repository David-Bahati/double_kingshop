import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Eye, EyeOff } from 'lucide-react';
import apiService from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../utils/constants';

const Categories = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [productCounts, setProductCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });

  const isAdmin = user?.role === ROLES.ADMIN;

  useEffect(() => {
    loadData();
  }, []);

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
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();    if (!isAdmin) return;
    try {
      await apiService.addCategory(newCategory);
      setShowModal(false);
      setNewCategory({ name: '', description: '' });
      loadData();
    } catch (err) {
      alert("Erreur lors de l'ajout");
    }
  };

  const handleDelete = async (id) => {
    if (!isAdmin) return;
    if (window.confirm("Supprimer cette catégorie ? Les produits associés ne seront pas effacés.")) {
      try {
        await apiService.deleteCategory(id);
        loadData();
      } catch (err) {
        alert("Erreur lors de la suppression");
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Catégories</h1>
            <p className="text-sm text-slate-500">Organisation du stock DKS.</p>
          </div>
          <div className="flex gap-2">
            {isAdmin && (
              <button 
                onClick={() => setShowModal(true)} 
                className="bg-blue-600 text-white px-6 py-3 rounded-full font-bold shadow-lg hover:bg-blue-700 transition"
              >
                + Catégorie
              </button>
            )}
            <Link to="/products" className="bg-white border px-6 py-3 rounded-full font-bold shadow-sm hover:bg-slate-50 transition">
               Produits
            </Link>
            <Link to="/admin/dashboard" className="bg-white border px-6 py-3 rounded-full font-bold shadow-sm hover:bg-slate-50 transition">
               ← Dashboard
            </Link>
          </div>
        </div>

        {loading ? (          <p className="text-center text-slate-500">Chargement...</p>
        ) : (
          <div className="bg-white rounded-[2rem] shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="p-6 font-bold text-slate-700">Catégorie</th>
                  <th className="p-6 font-bold text-slate-700 text-center">Produits</th>
                  <th className="p-6 font-bold text-slate-700 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {categories.map((cat) => {
                  const count = productCounts[cat.name] || 0;
                  const hasProducts = count > 0;
                  
                  return (
                    <tr key={cat.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-6">
                        <span className="font-medium text-slate-900">{cat.name}</span>
                        <p className="text-xs text-slate-400">{cat.description || 'Aucune description'}</p>
                      </td>
                      
                      {/* 🎯 Compteur de produits avec lien vers filtrage */}
                      <td className="p-6 text-center">
                        <Link 
                          to={`/products?category=${encodeURIComponent(cat.name)}`}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition ${
                            hasProducts 
                              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                              : 'bg-slate-100 text-slate-400 cursor-default'
                          }`}
                          onClick={(e) => !hasProducts && e.preventDefault()}
                        >
                          <Package size={12} />
                          {count} {count === 1 ? 'produit' : 'produits'}
                        </Link>
                      </td>
                      
                      <td className="p-6 text-right">
                        {isAdmin ? (
                          <button 
                            onClick={() => handleDelete(cat.id)}
                            className={`p-2 rounded-lg transition ${
                              hasProducts 
                                ? 'text-slate-300 cursor-not-allowed' 
                                : 'text-red-500 hover:bg-red-50'
                            }`}
                            disabled={hasProducts}
                            title={hasProducts ? "Impossible : des produits utilisent cette catégorie" : "Supprimer"}                          >
                            Supprimer
                          </button>
                        ) : (
                          <span className="text-xs text-slate-300 italic">Lecture seule</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {categories.length === 0 && (
                  <tr>
                    <td colSpan="3" className="p-10 text-center text-slate-400">
                      Aucune catégorie trouvée.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL D'AJOUT */}
      {showModal && isAdmin && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6">Nouvelle Catégorie</h2>
            <form onSubmit={handleAddCategory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nom *</label>
                <input 
                  type="text" 
                  required 
                  className="w-full p-4 bg-slate-50 border rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none" 
                  placeholder="ex: Claviers, Souris..."
                  value={newCategory.name}
                  onChange={e => setNewCategory({...newCategory, name: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea 
                  className="w-full p-4 bg-slate-50 border rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none" 
                  rows="3"
                  value={newCategory.description}
                  onChange={e => setNewCategory({...newCategory, description: e.target.value})}
                ></textarea>
              </div>
              <div className="flex gap-2 pt-4">                <button type="submit" className="flex-1 bg-blue-600 text-white p-4 rounded-2xl font-bold hover:bg-blue-700 transition">
                  Enregistrer
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-slate-100 p-4 rounded-2xl font-bold hover:bg-slate-200 transition">
                  Annuler
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