import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiService from '../services/api';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // États pour l'ajout d'un nouvel utilisateur
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ 
    name: '', 
    role: 'vendeur', 
    pin: '', 
    location: 'Bunia' 
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      // On utilise apiService pour rester cohérent avec le reste de l'app
      const data = await apiService.request('/api/users');
      setUsers(data || []);
    } catch (err) {
      console.error('Erreur utilisateurs:', err);
      setError('Impossible de charger les utilisateurs.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await apiService.request('/api/users', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      setShowModal(false);
      setFormData({ name: '', role: 'vendeur', pin: '', location: 'Bunia' });
      loadUsers(); // Rafraîchir la liste
    } catch (err) {
      alert("Erreur lors de l'ajout de l'utilisateur");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Voulez-vous vraiment supprimer cet accès ?")) {
      try {
        await apiService.request(`/api/users/${id}`, { method: 'DELETE' });
        loadUsers();
      } catch (err) {
        alert(err.message || "Erreur de suppression");
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* EN-TÊTE REPRIS DE TON CODE AVEC BOUTON AJOUT */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Gestion des utilisateurs</h1>
            <p className="text-sm text-slate-500">Membres du staff Double King Shop.</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowModal(true)}
              className="inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition shadow-lg"
            >
              + Nouveau membre
            </button>
            <Link to="/admin/dashboard" className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm">
              ← Retour
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="rounded-3xl bg-white p-8 text-center shadow-sm">Chargement...</div>
        ) : error ? (
          <div className="rounded-3xl bg-white p-8 text-center text-red-600 shadow-sm">{error}</div>
        ) : users.length === 0 ? (
          <div className="rounded-3xl bg-white p-8 text-center shadow-sm">Aucun utilisateur trouvé.</div>
        ) : (
          /* TABLEAU REPRIS ET AMÉLIORÉ */
          <div className="overflow-x-auto rounded-3xl bg-white shadow-sm border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Nom</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Rôle</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">PIN</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Localisation</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-slate-700">{user.name}</td>
                    <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${user.role === 'administrator' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                            {user.role}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-slate-400">{user.pin}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{user.location || 'Bunia'}</td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleDelete(user.id)}
                        className="text-red-400 hover:text-red-600 font-bold transition-colors"
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL D'AJOUT (Optimisé pour ton Pixel 8) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold mb-6 text-slate-800">Ajouter un accès</h2>
            <form onSubmit={handleAdd} className="space-y-4">
              <input 
                type="text" placeholder="Nom complet" required 
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500" 
                onChange={e => setFormData({...formData, name: e.target.value})} 
              />
              
              <div className="flex gap-2">
                <input 
                  type="password" placeholder="PIN (4 chiffres)" maxLength="4" required 
                  className="w-1/2 p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none" 
                  onChange={e => setFormData({...formData, pin: e.target.value})} 
                />
                <select 
                  className="w-1/2 p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none" 
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value})}
                >
                  <option value="vendeur">Vendeur</option>
                  <option value="caissier">Caissier</option>
                  <option value="administrator">Admin</option>
                </select>
              </div>

              <input 
                type="text" placeholder="Localisation" 
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none" 
                value={formData.location} 
                onChange={e => setFormData({...formData, location: e.target.value})} 
              />
              
              <div className="flex gap-2 pt-4">
                <button type="submit" className="flex-1 bg-blue-600 text-white p-4 rounded-2xl font-bold shadow-lg hover:bg-blue-700 transition">
                    Valider
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="flex-1 bg-slate-100 text-slate-600 p-4 rounded-2xl font-bold transition"
                >
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

export default Users;
