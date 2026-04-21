// src/pages/Customers.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Users, Search, Plus, Mail, Phone, MapPin, Calendar, 
  MoreVertical, Edit2, Trash2, X, Loader, AlertCircle,
  ShoppingBag, DollarSign, Filter, Download
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { ROLES } from '../utils/constants';
import apiService from '../services/api';

const Customers = () => {
  const { user, isAuthenticated } = useAuth();
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();
  
  // 🎯 Protection Admin
  useEffect(() => {
    if (!isAuthenticated || user?.role !== ROLES.ADMIN) {
      navigate('/login', { replace: true, state: { from: { pathname: '/customers' } } });
    }
  }, [isAuthenticated, user, navigate]);

  // 🎯 États
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, inactive
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', address: '', notes: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🎯 Chargement des clients (mock data pour l'instant)
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        setLoading(true);
        // 🔹 Option 1 : Charger depuis API (quand disponible)
        // const data = await apiService.request('/api/customers');
        // setCustomers(data || []);
        
        // 🔹 Option 2 : Données de démonstration
        const mockCustomers = [          { id: 1, name: 'Jean-Pierre Mbombo', email: 'jp.mbombo@email.cd', phone: '+243 999 123 456', address: 'Avenue de la Paix, Bunia', totalOrders: 12, totalSpent: 450.50, lastOrder: '2024-01-15', status: 'active' },
          { id: 2, name: 'Marie Kambale', email: 'marie.k@email.cd', phone: '+243 818 789 012', address: 'Quartier Kayove, Bunia', totalOrders: 5, totalSpent: 125.00, lastOrder: '2024-01-10', status: 'active' },
          { id: 3, name: 'Patrick Nzuzi', email: 'p.nzuzi@email.cd', phone: '+243 977 456 789', address: 'Centre-ville, Bunia', totalOrders: 0, totalSpent: 0, lastOrder: null, status: 'inactive' },
          { id: 4, name: 'Grace Mwamba', email: 'grace.m@email.cd', phone: '+243 855 321 654', address: 'Quartier Kasenyi, Bunia', totalOrders: 8, totalSpent: 280.75, lastOrder: '2024-01-18', status: 'active' },
        ];
        setCustomers(mockCustomers);
      } catch (err) {
        console.error('Erreur chargement clients:', err);
        showError('Impossible de charger la liste des clients');
      } finally {
        setLoading(false);
      }
    };
    
    if (isAuthenticated && user?.role === ROLES.ADMIN) {
      loadCustomers();
    }
  }, [isAuthenticated, user]);

  // 🎯 Filtrage combiné
  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => {
      const matchesSearch = customer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           customer.phone?.includes(searchQuery);
      const matchesStatus = filterStatus === 'all' || customer.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [customers, searchQuery, filterStatus]);

  // 🎯 Stats rapides
  const stats = useMemo(() => {
    const active = customers.filter(c => c.status === 'active').length;
    const totalSpent = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
    const totalOrders = customers.reduce((sum, c) => sum + (c.totalOrders || 0), 0);
    return { total: customers.length, active, totalSpent, totalOrders };
  }, [customers]);

  // 🎯 Gestion du formulaire
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Le nom est requis';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {      errors.email = 'Email invalide';
    }
    if (formData.phone && !/^\+?[0-9\s\-()]{8,20}$/.test(formData.phone)) {
      errors.phone = 'Numéro de téléphone invalide';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      // 🔹 Option 1 : API (quand disponible)
      // if (editingCustomer) {
      //   await apiService.request(`/api/customers/${editingCustomer.id}`, {
      //     method: 'PUT', body: JSON.stringify(formData)
      //   });
      // } else {
      //   await apiService.request('/api/customers', {
      //     method: 'POST', body: JSON.stringify(formData)
      //   });
      // }
      
      // 🔹 Option 2 : Mock pour démo
      if (editingCustomer) {
        setCustomers(prev => prev.map(c => 
          c.id === editingCustomer.id ? { ...c, ...formData } : c
        ));
        showSuccess('Client mis à jour avec succès');
      } else {
        const newCustomer = {
          id: Date.now(),
          ...formData,
          totalOrders: 0,
          totalSpent: 0,
          lastOrder: null,
          status: 'active',
          createdAt: new Date().toISOString()
        };
        setCustomers(prev => [newCustomer, ...prev]);
        showSuccess('Client ajouté avec succès');
      }
      
      handleCloseModal();
    } catch (err) {
      console.error('Erreur sauvegarde client:', err);
      showError('Échec de l\'opération');    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      notes: customer.notes || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (customer) => {
    if (!window.confirm(`Supprimer le client "${customer.name}" ?`)) return;
    
    try {
      // 🔹 Option 1 : API
      // await apiService.request(`/api/customers/${customer.id}`, { method: 'DELETE' });
      
      // 🔹 Option 2 : Mock
      setCustomers(prev => prev.filter(c => c.id !== customer.id));
      showSuccess('Client supprimé');
    } catch (err) {
      showError('Échec de la suppression');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCustomer(null);
    setFormData({ name: '', email: '', phone: '', address: '', notes: '' });
    setFormErrors({});
  };

  const handleExport = () => {
    // Export CSV simple
    const headers = ['Nom', 'Email', 'Téléphone', 'Commandes', 'Total Dépensé', 'Statut'];
    const rows = customers.map(c => [
      c.name, c.email, c.phone, c.totalOrders, `${c.totalSpent.toFixed(2)}$`, c.status
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');    a.href = url;
    a.download = `clients-dks-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    showSuccess('Export CSV téléchargé');
  };

  // 🎯 Rendu Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="animate-spin mx-auto mb-4 text-blue-600" size={48} />
          <p className="text-slate-500 font-medium">Chargement des clients...</p>
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
                <MoreVertical size={20} className="rotate-90" />
              </Link>
              <div>
                <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                  <Users size={20} className="text-blue-600" />
                  Clients
                </h1>
                <p className="text-sm text-slate-500">Gestion de la clientèle DKS</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button                 onClick={handleExport}
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition"
              >
                <Download size={16} /> Export CSV
              </button>
              <button 
                onClick={() => { setEditingCustomer(null); setShowModal(true); }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition shadow-sm"
              >
                <Plus size={16} /> Nouveau client
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 🎯 CONTENU PRINCIPAL */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        
        {/* 📊 Stats rapides */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Clients</p>
            <p className="text-2xl font-black text-slate-900">{stats.total}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Actifs</p>
            <p className="text-2xl font-black text-emerald-600">{stats.active}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Commandes</p>
            <p className="text-2xl font-black text-blue-600">{stats.totalOrders}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Revenus</p>
            <p className="text-2xl font-black text-indigo-600">${stats.totalSpent.toFixed(0)}</p>
          </div>
        </div>

        {/* 🔍 Barre de recherche et filtres */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher un client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition"              />
            </div>
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              >
                <option value="all">Tous les statuts</option>
                <option value="active">Actifs</option>
                <option value="inactive">Inactifs</option>
              </select>
              <button className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 transition">
                <Filter size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* 📋 Tableau des clients */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="p-5 font-bold text-slate-600 text-xs uppercase tracking-wider">Client</th>
                  <th className="p-5 font-bold text-slate-600 text-xs uppercase tracking-wider hidden md:table-cell">Contact</th>
                  <th className="p-5 font-bold text-slate-600 text-xs uppercase tracking-wider text-center">Commandes</th>
                  <th className="p-5 font-bold text-slate-600 text-xs uppercase tracking-wider text-right">Total</th>
                  <th className="p-5 font-bold text-slate-600 text-xs uppercase tracking-wider text-center">Statut</th>
                  <th className="p-5 font-bold text-slate-600 text-xs uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                          {customer.name?.charAt(0)?.toUpperCase() || 'C'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{customer.name}</p>
                          <p className="text-xs text-slate-400 md:hidden">{customer.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-5 hidden md:table-cell">
                      <div className="space-y-1">
                        {customer.email && (                          <p className="text-sm text-slate-600 flex items-center gap-2">
                            <Mail size={14} className="text-slate-400" />
                            {customer.email}
                          </p>
                        )}
                        {customer.phone && (
                          <p className="text-sm text-slate-600 flex items-center gap-2">
                            <Phone size={14} className="text-slate-400" />
                            {customer.phone}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="p-5 text-center">
                      <div className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-bold">
                        <ShoppingBag size={12} />
                        {customer.totalOrders}
                      </div>
                    </td>
                    <td className="p-5 text-right">
                      <p className="font-black text-slate-900">${customer.totalSpent?.toFixed(2) || '0.00'}</p>
                      {customer.lastOrder && (
                        <p className="text-[10px] text-slate-400">
                          Dernier: {new Date(customer.lastOrder).toLocaleDateString('fr-FR')}
                        </p>
                      )}
                    </td>
                    <td className="p-5 text-center">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold ${
                        customer.status === 'active' 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {customer.status === 'active' ? '✓ Actif' : '⊘ Inactif'}
                      </span>
                    </td>
                    <td className="p-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEdit(customer)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition"
                          title="Modifier"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(customer)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition"
                          title="Supprimer"
                        >                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                
                {/* État vide */}
                {filteredCustomers.length === 0 && (
                  <tr>
                    <td colSpan="6" className="p-12 text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                        <Users size={32} className="text-slate-400" />
                      </div>
                      <p className="text-slate-500 font-medium mb-2">
                        {searchQuery || filterStatus !== 'all' 
                          ? 'Aucun client ne correspond à votre recherche' 
                          : 'Aucun client enregistré'}
                      </p>
                      <p className="text-slate-400 text-sm mb-4">
                        {searchQuery || filterStatus !== 'all' 
                          ? 'Essayez de modifier vos filtres' 
                          : 'Commencez par ajouter votre premier client'}
                      </p>
                      {(searchQuery || filterStatus !== 'all') ? (
                        <button 
                          onClick={() => { setSearchQuery(''); setFilterStatus('all'); }}
                          className="text-blue-600 font-bold text-sm hover:underline"
                        >
                          Réinitialiser les filtres
                        </button>
                      ) : (
                        <button 
                          onClick={() => setShowModal(true)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition"
                        >
                          <Plus size={16} /> Ajouter un client
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

      {/* 🎯 MODAL AJOUT/MODIFICATION CLIENT */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
            onClick={handleCloseModal}
          />
          
          <div className="relative bg-white rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl animate-slideUp">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-5 text-white flex justify-between items-center">
              <div>
                <h2 className="text-lg font-black uppercase tracking-tight">
                  {editingCustomer ? '✏️ Modifier le Client' : '➕ Nouveau Client'}
                </h2>
                <p className="text-blue-100 text-xs mt-0.5">
                  {editingCustomer ? 'Mettre à jour les informations' : 'Ajouter un client au catalogue DKS'}
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
            <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              
              {/* Nom */}
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

              {/* Email & Téléphone */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Email</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`w-full pl-9 pr-4 py-3 bg-slate-50 border rounded-xl text-sm font-medium outline-none transition-all focus:ring-2 ${
                        formErrors.email ? 'border-red-300 focus:ring-red-200' : 'border-slate-200 focus:ring-blue-200'
                      }`}
                      placeholder="client@email.cd"
                      disabled={isSubmitting}
                    />
                  </div>
                  {formErrors.email && (
                    <p className="text-[10px] text-red-500 mt-1 ml-1">{formErrors.email}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Téléphone</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className={`w-full pl-9 pr-4 py-3 bg-slate-50 border rounded-xl text-sm font-medium outline-none transition-all focus:ring-2 ${
                        formErrors.phone ? 'border-red-300 focus:ring-red-200' : 'border-slate-200 focus:ring-green-200'
                      }`}
                      placeholder="+243 999 123 456"
                      disabled={isSubmitting}
                    />
                  </div>
                  {formErrors.phone && (
                    <p className="text-[10px] text-red-500 mt-1 ml-1">{formErrors.phone}</p>
                  )}
                </div>
              </div>

              {/* Adresse */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Adresse</label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3 top-3 text-slate-400" />
                  <textarea
                    rows="2"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none transition-all focus:ring-2 focus:ring-blue-200 resize-none"
                    placeholder="Ex: Avenue de la Paix, Bunia"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Notes internes</label>
                <textarea
                  rows="3"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none transition-all focus:ring-2 focus:ring-blue-200 resize-none"
                  placeholder="Informations utiles pour l'équipe..."
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
                    editingCustomer ? '💾 Mettre à jour' : '✅ Ajouter'
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

export default Customers;