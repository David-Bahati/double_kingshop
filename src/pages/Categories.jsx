import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiService from '../services/api';
import { useAuth } from '../context/AuthContext'; // Import pour gérer les rôles
import { ROLES } from '../utils/constants';

const Categories = () => {
  const { user } = useAuth(); // On récupère l'utilisateur connecté
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });

  // Vérification si l'utilisateur est Admin
  const isAdmin = user?.role === ROLES.ADMIN;

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await apiService.getCategories();
      setCategories(data || []);
    } catch (err) {
      console.error("Erreur chargement catégories:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!isAdmin) return; // Sécurité supplémentaire

    try {
      await apiService.addCategory(newCategory);
      setShowModal(false);
      setNewCategory({ name: '', description: '' });
      loadCategories();
    } catch (err) {
      alert("Erreur lors de l'ajout");
    }
  };

  const handleDelete = async (id) => {
    if (!isAdmin) return;
    if (window.confirm("Supprimer cette catégorie ? Cela n'effacera pas les produits associés.")) {
      try {
        await apiService.deleteCategory(id);
        loadCategories();
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
            {/* Affiche le bouton SEULEMENT si c'est l'Admin */}
            {isAdmin && (
              <button 
                onClick={() => setShowModal(true)} 
                className="bg-blue-600 text-white px-6 py-3 rounded-full font-bold shadow-lg"
              >
                + Catégorie
              </button>
            )}
            
            <Link to="/products" className="bg-white border px-6 py-3 rounded-full font-bold shadow-sm">
               Produits
            </Link>
            
            <Link to="/admin/dashboard" className="bg-white border px-6 py-3 rounded-full font-bold shadow-sm">
               ← Dashboard
            </Link>
          </div>
        </div>

        {loading ? (
          <p className="text-center text-slate-500">Chargement des catégories...</p>
        ) : (
          <div className="bg-white rounded-[2rem] shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="p-6 font-bold text-slate-700">Nom de la catégorie</th>
                  <th className="p-6 font-bold text-slate-700 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-6">
                      <span className="font-medium text-slate-900">{cat.name}</span>
                      <p className="text-xs text-slate-400">{cat.description || 'Aucune description'}</p>
                    </td>
                    <td className="p-6 text-right">
                      {/* Les actions de suppression sont réservées à l'Admin */}
                      {isAdmin ? (
                        <button 
                          onClick={() => handleDelete(cat.id)}
                          className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                        >
                          Supprimer
                        </button>
                      ) : (
                        <span className="text-xs text-slate-300 italic">Lecture seule</span>
                      )}
                    </td>
                  </tr>
                ))}
                {categories.length === 0 && (
                  <tr>
                    <td colSpan="2" className="p-10 text-center text-slate-400">
                      Aucune catégorie trouvée.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL D'AJOUT (Uniquement accessible par l'Admin) */}
      {showModal && isAdmin && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6">Nouvelle Catégorie</h2>
            <form onSubmit={handleAddCategory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nom</label>
                <input 
                  type="text" 
                  required 
                  className="w-full p-4 bg-slate-50 border rounded-2xl" 
                  placeholder="ex: Claviers, Souris..."
                  onChange={e => setNewCategory({...newCategory, name: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description (optionnel)</label>
                <textarea 
                  className="w-full p-4 bg-slate-50 border rounded-2xl" 
                  onChange={e => setNewCategory({...newCategory, description: e.target.value})}
                ></textarea>
              </div>
              <div className="flex gap-2 pt-4">
                <button type="submit" className="flex-1 bg-blue-600 text-white p-4 rounded-2xl font-bold">Enregistrer</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-slate-100 p-4 rounded-2xl font-bold">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
