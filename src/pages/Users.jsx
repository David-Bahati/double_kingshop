// src/pages/Users.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Users, Plus, Search, Edit2, Trash2, X, Loader, 
  AlertCircle, CheckCircle, Key, UserCheck, Shield,
  MapPin, Phone, Filter, MoreVertical
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { ROLES } from '../utils/constants';
import apiService from '../services/api';

const Users = () => {
  const { user, isAuthenticated } = useAuth();
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();
  
  // 🎯 Protection Admin uniquement
  useEffect(() => {
    if (!isAuthenticated || user?.role !== ROLES.ADMIN) {
      navigate('/login', { replace: true, state: { from: { pathname: '/users' } } });
    }
  }, [isAuthenticated, user, navigate]);

  // 🎯 États principaux
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  
  // 🎯 Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ 
    name: '', role: 'vendeur', pin: '', location: 'Bunia' 
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🎯 Chargement des utilisateurs
  useEffect(() => {
    if (isAuthenticated && user?.role === ROLES.ADMIN) {
      loadUsers();
    }
  }, [isAuthenticated, user]);

  const loadUsers = async () => {    try {
      setLoading(true);
      const data = await apiService.getUsers();
      setUsers(data || []);
    } catch (err) {
      console.error('Erreur chargement utilisateurs:', err);
      showError('Impossible de charger la liste des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  // 🎯 Filtrage combiné
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           u.location?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = filterRole === 'all' || u.role === filterRole;
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, filterRole]);

  // 🎯 Stats rapides
  const stats = useMemo(() => {
    return {
      total: users.length,
      admins: users.filter(u => u.role === 'administrator').length,
      cashiers: users.filter(u => u.role === 'cashier' || u.role === 'caissier').length,
      salesmen: users.filter(u => u.role === 'salesman' || u.role === 'vendeur').length
    };
  }, [users]);

  // 🎯 Validation du formulaire
  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) errors.name = 'Le nom est requis';
    if (!formData.pin || !/^\d{4}$/.test(formData.pin)) {
      errors.pin = 'Le PIN doit contenir exactement 4 chiffres';
    }
    
    // Vérifier doublon de PIN (sauf en mode édition sur le même user)
    const pinExists = users.some(u => 
      u.pin === formData.pin && (!editingUser || u.id !== editingUser.id)
    );
    if (pinExists) errors.pin = 'Ce PIN est déjà utilisé';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  // 🎯 Gestion des changements de formulaire
  const handleInputChange = (field, value) => {
    // Formatage spécial pour le PIN (4 chiffres max)
    if (field === 'pin') {
      value = value.replace(/\D/g, '').slice(0, 4);
    }
    
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // 🎯 Ouvrir le modal en mode AJOUT
  const handleOpenAddModal = () => {
    setModalMode('add');
    setEditingUser(null);
    setFormData({ name: '', role: 'vendeur', pin: '', location: 'Bunia' });
    setFormErrors({});
    setShowModal(true);
  };

  // 🎯 Ouvrir le modal en mode ÉDITION
  const handleOpenEditModal = (userData) => {
    setModalMode('edit');
    setEditingUser(userData);
    setFormData({
      name: userData.name || '',
      role: userData.role || 'vendeur',
      pin: userData.pin || '',
      location: userData.location || 'Bunia'
    });
    setFormErrors({});
    setShowModal(true);
  };

  // 🎯 Soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      if (modalMode === 'add') {
        await apiService.createUser(formData);
        showSuccess('Utilisateur ajouté avec succès');
      } else {
        await apiService.updateUser(editingUser.id, formData);        showSuccess('Utilisateur mis à jour avec succès');
      }
      
      handleCloseModal();
      loadUsers();
    } catch (err) {
      console.error('Erreur sauvegarde utilisateur:', err);
      showError(err.message || 'Échec de l\'opération');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🎯 Suppression d'un utilisateur
  const handleDelete = async (userData) => {
    // Protection : empêcher la suppression du dernier admin
    if (userData.role === 'administrator') {
      const adminCount = users.filter(u => u.role === 'administrator').length;
      if (adminCount <= 1) {
        showError('Impossible de supprimer le dernier administrateur');
        return;
      }
    }
    
    if (!window.confirm(`Supprimer l'accès de "${userData.name}" ?`)) return;
    
    try {
      await apiService.deleteUser(userData.id);
      showSuccess('Utilisateur supprimé');
      loadUsers();
    } catch (err) {
      console.error('Erreur suppression:', err);
      showError(err.message || 'Échec de la suppression');
    }
  };

  // 🎯 Fermeture du modal
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setFormData({ name: '', role: 'vendeur', pin: '', location: 'Bunia' });
    setFormErrors({});
  };

  // 🎯 Helper pour afficher le rôle en français
  const getRoleLabel = (role) => {
    const labels = {
      'administrator': 'Administrateur',
      'admin': 'Administrateur',
      'cashier': 'Caissier',      'caissier': 'Caissier',
      'salesman': 'Commercial',
      'vendeur': 'Commercial'
    };
    return labels[role?.toLowerCase()] || role;
  };

  // 🎯 Helper pour la couleur du badge rôle
  const getRoleBadgeClass = (role) => {
    const r = role?.toLowerCase();
    if (r === 'administrator' || r === 'admin') {
      return 'bg-purple-100 text-purple-700 border-purple-200';
    }
    if (r === 'cashier' || r === 'caissier') {
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    }
    return 'bg-blue-100 text-blue-700 border-blue-200';
  };

  // 🎯 Rendu Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="animate-spin mx-auto mb-4 text-blue-600" size={48} />
          <p className="text-slate-500 font-medium">Chargement des utilisateurs...</p>
        </div>
      </div>
    );
  }

  // 🎯 Rendu Non autorisé
  if (!isAuthenticated || user?.role !== ROLES.ADMIN) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      
      {/* 🎯 HEADER */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                to="/admin/dashboard" 
                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition"
                aria-label="Retour au dashboard"
              >
                <MoreVertical size={20} className="rotate-90" />              </Link>
              <div>
                <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                  <Users size={20} className="text-blue-600" />
                  Utilisateurs
                </h1>
                <p className="text-sm text-slate-500">Gestion des accès staff DKS</p>
              </div>
            </div>
            
            <button 
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition shadow-sm"
            >
              <Plus size={16} /> Nouveau membre
            </button>
          </div>
        </div>
      </header>

      {/* 🎯 CONTENU PRINCIPAL */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        
        {/* 📊 Stats rapides */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total</p>
            <p className="text-2xl font-black text-slate-900">{stats.total}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Admins</p>
            <p className="text-2xl font-black text-purple-600">{stats.admins}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Caissiers</p>
            <p className="text-2xl font-black text-emerald-600">{stats.cashiers}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vendeurs</p>
            <p className="text-2xl font-black text-blue-600">{stats.salesmen}</p>
          </div>
        </div>

        {/* 🔍 Recherche et filtres */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"                placeholder="Rechercher un utilisateur..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              >
                <option value="all">Tous les rôles</option>
                <option value="administrator">Administrateurs</option>
                <option value="cashier">Caissiers</option>
                <option value="vendeur">Vendeurs</option>
              </select>
              <button className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 transition">
                <Filter size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* 📋 Tableau des utilisateurs */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="p-5 font-bold text-slate-600 text-xs uppercase tracking-wider">Utilisateur</th>
                  <th className="p-5 font-bold text-slate-600 text-xs uppercase tracking-wider">Rôle</th>
                  <th className="p-5 font-bold text-slate-600 text-xs uppercase tracking-wider text-center">PIN</th>
                  <th className="p-5 font-bold text-slate-600 text-xs uppercase tracking-wider hidden sm:table-cell">Localisation</th>
                  <th className="p-5 font-bold text-slate-600 text-xs uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((userData) => (
                  <tr key={userData.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                          {userData.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{userData.name}</p>
                          <p className="text-xs text-slate-400 sm:hidden flex items-center gap-1">
                            <MapPin size={10} /> {userData.location || 'Bunia'}
                          </p>                        </div>
                      </div>
                    </td>
                    
                    <td className="p-5">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold border ${getRoleBadgeClass(userData.role)}`}>
                        <UserCheck size={12} className="mr-1" />
                        {getRoleLabel(userData.role)}
                      </span>
                    </td>
                    
                    <td className="p-5 text-center">
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-full text-xs font-mono font-bold">
                        <Key size={12} />
                        {userData.pin || '••••'}
                      </span>
                    </td>
                    
                    <td className="p-5 hidden sm:table-cell">
                      <p className="text-sm text-slate-600 flex items-center gap-2">
                        <MapPin size={14} className="text-slate-400" />
                        {userData.location || 'Bunia'}
                      </p>
                    </td>
                    
                    <td className="p-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleOpenEditModal(userData)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition"
                          title="Modifier"
                          aria-label={`Modifier ${userData.name}`}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(userData)}
                          disabled={userData.role === 'administrator' && stats.admins <= 1}
                          className={`p-2 rounded-xl transition ${
                            userData.role === 'administrator' && stats.admins <= 1
                              ? 'text-slate-300 cursor-not-allowed'
                              : 'text-red-600 hover:bg-red-50'
                          }`}
                          title={userData.role === 'administrator' && stats.admins <= 1 
                            ? 'Impossible : dernier administrateur' 
                            : 'Supprimer'}
                          aria-label={`Supprimer ${userData.name}`}
                        >
                          <Trash2 size={16} />
                        </button>                      </div>
                    </td>
                  </tr>
                ))}
                
                {/* État vide */}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-12 text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                        <Users size={32} className="text-slate-400" />
                      </div>
                      <p className="text-slate-500 font-medium mb-2">
                        {searchQuery || filterRole !== 'all'
                          ? 'Aucun utilisateur ne correspond à votre recherche'
                          : 'Aucun utilisateur enregistré'}
                      </p>
                      <p className="text-slate-400 text-sm mb-4">
                        {searchQuery || filterRole !== 'all'
                          ? 'Essayez de modifier vos filtres'
                          : 'Commencez par ajouter votre premier membre du staff'}
                      </p>
                      {(searchQuery || filterRole !== 'all') ? (
                        <button 
                          onClick={() => { setSearchQuery(''); setFilterRole('all'); }}
                          className="text-blue-600 font-bold text-sm hover:underline"
                        >
                          Réinitialiser les filtres
                        </button>
                      ) : (
                        <button 
                          onClick={handleOpenAddModal}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition"
                        >
                          <Plus size={16} /> Ajouter un utilisateur
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

      {/* 🎯 MODAL AJOUT/MODIFICATION UTILISATEUR */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
          <div             className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
            onClick={handleCloseModal}
          />
          
          <div className="relative bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl animate-slideUp">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-5 text-white flex justify-between items-center">
              <div>
                <h2 className="text-lg font-black uppercase tracking-tight">
                  {modalMode === 'add' ? '➕ Nouveau Membre' : '✏️ Modifier l\'Utilisateur'}
                </h2>
                <p className="text-blue-100 text-xs mt-0.5">
                  {modalMode === 'add' ? 'Créer un accès pour le staff DKS' : 'Mettre à jour les informations'}
                </p>
              </div>
              <button 
                onClick={handleCloseModal} 
                disabled={isSubmitting}
                className="p-2 hover:bg-white/20 rounded-full transition-colors disabled:opacity-50"
                aria-label="Fermer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Formulaire */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              
             {/* Nom complet */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
                  Nom complet <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm font-medium outline-none transition-all focus:ring-2 ${
                    formErrors.name ? 'border-red-300 focus:ring-red-200' : 'border-slate-200 focus:ring-blue-200'
                  }`}
                  placeholder="Ex: Jean-Pierre Mbombo"
                  disabled={isSubmitting}
                />
                {formErrors.name && (
                  <p className="text-[10px] text-red-500 mt-1 ml-1 flex items-center gap-1">
                    <AlertCircle size={10} /> {formErrors.name}
                  </p>
                )}
              </div>

              {/* PIN (4 chiffres) */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5 flex items-center gap-1">
                  <Key size={12} />
                  Code PIN d'accès <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="\d{4}"
                  maxLength={4}
                  required
                  value={formData.pin}
                  onChange={(e) => handleInputChange('pin', e.target.value)}
                  className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm font-medium outline-none transition-all focus:ring-2 font-mono tracking-widest text-center ${
                    formErrors.pin ? 'border-red-300 focus:ring-red-200' : 'border-slate-200 focus:ring-blue-200'
                  }`}
                  placeholder="••••"
                  disabled={isSubmitting}
                />
                {formErrors.pin ? (
                  <p className="text-[10px] text-red-500 mt-1 ml-1 flex items-center gap-1">
                    <AlertCircle size={10} /> {formErrors.pin}
                  </p>
                ) : (
                  <p className="text-[10px] text-slate-400 mt-1 ml-1">
                    {formData.pin.length}/4 chiffres • Utilisé pour la connexion
                  </p>
                )}
              </div>

              {/* Rôle */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5 flex items-center gap-1">
                  <Shield size={12} />
                  Rôle d'accès
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => handleInputChange('role', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none transition-all focus:ring-2 focus:ring-blue-200 appearance-none cursor-pointer"
                  disabled={isSubmitting}
                >
                  <option value="vendeur">👤 Commercial / Vendeur</option>
                  <option value="cashier">💰 Caissier</option>
                  <option value="administrator">🔐 Administrateur</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1 ml-1">
                  {formData.role === 'administrator' && '⚠️ Accès complet à toutes les fonctions'}
                  {formData.role === 'cashier' && '✅ Caisse, ventes, consultation produits'}
                  {formData.role === 'vendeur' && '✅ Catalogue, création de ventes clients'}
                </p>
              </div>

              {/* Localisation */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5 flex items-center gap-1">
                  <MapPin size={12} />
                  Localisation
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none transition-all focus:ring-2 focus:ring-blue-200"
                  placeholder="Ex: Bunia, Kayove, Centre-ville..."
                  disabled={isSubmitting}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-200 transition disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader className="animate-spin" size={16} /> Enregistrement...
                    </>
                  ) : (
                    modalMode === 'add' ? '✅ Créer l\'accès' : '💾 Mettre à jour'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🎨 Animations CSS */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
        .animate-slideUp { animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
    </div>
  );
};

export default Users;