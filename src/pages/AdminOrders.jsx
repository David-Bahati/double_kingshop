// src/pages/AdminOrders.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, Filter, Download, Eye, Printer, RefreshCw, 
  ArrowLeft, Package, User, Calendar, DollarSign, 
  CheckCircle, Clock, AlertCircle, Loader, X
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { ROLES } from '../utils/constants';
import apiService from '../services/api';

const AdminOrders = () => {
  const { user, isAuthenticated } = useAuth();
  const { showSuccess, showError, showInfo } = useNotification();
  const navigate = useNavigate();
  
  // 🎯 Protection Admin/Cashier
  useEffect(() => {
    if (!isAuthenticated || !user?.role || user.role === 'salesman') {
      navigate('/login', { replace: true, state: { from: { pathname: '/admin/orders' } } });
    }
  }, [isAuthenticated, user, navigate]);

  // 🎯 États principaux
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // 🎯 Filtres & Recherche
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPayment, setFilterPayment] = useState('all');
  const [filterDate, setFilterDate] = useState('all');
  
  // 🎯 Modal détails commande
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  // 🎯 Chargement des commandes
  useEffect(() => {
    if (isAuthenticated && (user?.role === ROLES.ADMIN || user?.role === ROLES.CASHIER)) {
      loadOrders();
    }
  }, [isAuthenticated, user]);

  const loadOrders = async () => {
    try {      setLoading(true);
      const data = await apiService.getOrders();
      setOrders(data || []);
    } catch (err) {
      console.error('Erreur chargement commandes:', err);
      showError('Impossible de charger les commandes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 🎯 Rafraîchir les données
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    showInfo('Données actualisées');
  };

  // 🎯 Filtrage combiné
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Recherche texte
      const matchesSearch = searchQuery === '' || 
        order.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.txid?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Filtre statut
      const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
      
      // Filtre paiement
      const matchesPayment = filterPayment === 'all' || order.paymentMethod === filterPayment;
      
      // Filtre date
      let matchesDate = true;
      if (filterDate !== 'all') {
        const orderDate = new Date(order.createdAt);
        const now = new Date();
        if (filterDate === 'today') {
          matchesDate = orderDate.toDateString() === now.toDateString();
        } else if (filterDate === 'week') {
          const weekAgo = new Date(now.setDate(now.getDate() - 7));
          matchesDate = orderDate >= weekAgo;
        } else if (filterDate === 'month') {
          const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
          matchesDate = orderDate >= monthAgo;
        }
      }
            return matchesSearch && matchesStatus && matchesPayment && matchesDate;
    });
  }, [orders, searchQuery, filterStatus, filterPayment, filterDate]);

  // 🎯 Stats rapides
  const stats = useMemo(() => {
    const total = orders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
    const completed = orders.filter(o => o.status === 'completed').length;
    const pending = orders.filter(o => o.status === 'pending').length;
    const piPayments = orders.filter(o => o.paymentMethod === 'pi_network').length;
    
    return { total, count: orders.length, completed, pending, piPayments };
  }, [orders]);

  // 🎯 Helpers d'affichage
  const getStatusConfig = (status) => {
    const configs = {
      completed: { label: 'Validé', class: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle },
      pending: { label: 'En attente', class: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
      cancelled: { label: 'Annulé', class: 'bg-red-100 text-red-700 border-red-200', icon: X },
      failed: { label: 'Échoué', class: 'bg-red-100 text-red-700 border-red-200', icon: AlertCircle }
    };
    return configs[status] || configs.pending;
  };

  const getPaymentLabel = (method) => {
    const labels = {
      pi_network: 'Π Pi Network',
      mobile_money: '📱 Mobile Money',
      cash: '💵 Cash',
      fedapay: '💳 FedaPay'
    };
    return labels[method] || method;
  };

  const getPaymentBadgeClass = (method) => {
    const classes = {
      pi_network: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      mobile_money: 'bg-green-100 text-green-700 border-green-200',
      cash: 'bg-blue-100 text-blue-700 border-blue-200',
      fedapay: 'bg-purple-100 text-purple-700 border-purple-200'
    };
    return classes[method] || 'bg-slate-100 text-slate-700 border-slate-200';
  };

  // 🎯 Export CSV
  const handleExport = () => {
    try {
      const headers = ['ID', 'Client', 'Total', 'Méthode', 'Statut', 'Date', 'Transaction ID'];
      const rows = filteredOrders.map(o => [        o.id,
        o.customerName || 'Client DKS',
        o.total,
        o.paymentMethod,
        o.status,
        new Date(o.createdAt).toLocaleString('fr-FR'),
        o.txid || '-'
      ]);
      
      const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `commandes-dks-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      showSuccess('Export CSV téléchargé');
    } catch (err) {
      console.error('Erreur export:', err);
      showError('Échec de l\'export');
    }
  };

  // 🎯 Imprimer un reçu
  const handlePrintReceipt = (order) => {
    const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
    const itemsHtml = items?.map(i => `<tr><td>${i.quantity}x ${i.name}</td><td class="text-right">$${(i.price * i.quantity).toFixed(2)}</td></tr>`).join('') || '<tr><td colspan="2">Aucun article</td></tr>';
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showError('Impossible d\'ouvrir la fenêtre d\'impression');
      return;
    }
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Reçu DKS #${order.id?.slice(-6)}</title>
        <style>
          body { font-family: 'Courier New', monospace; padding: 20px; color: #333; }
          .receipt { max-width: 320px; margin: auto; border: 1px solid #eee; padding: 15px; }
          .header { text-align: center; border-bottom: 2px dashed #ccc; padding-bottom: 10px; margin-bottom: 10px; }
          .logo { font-size: 24px; font-weight: 900; color: #2563eb; font-style: italic; }
          .shop { font-size: 14px; font-weight: bold; text-transform: uppercase; }
          .address { font-size: 10px; color: #666; }
          .line { border-top: 1px dashed #ccc; margin: 10px 0; }
          table { width: 100%; font-size: 11px; }          td { padding: 3px 0; }
          .total { font-size: 16px; font-weight: 900; text-align: right; border-top: 2px solid #000; padding-top: 8px; margin-top: 10px; }
          .footer { font-size: 9px; text-align: center; color: #999; margin-top: 20px; }
          @media print { body { padding: 0; } .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <div class="logo">DKS</div>
            <div class="shop">Double King Shop</div>
            <div class="address">Bunia, Ituri • +243 999 123 456</div>
          </div>
          <p><strong>REÇU N°:</strong> ${order.id?.slice(-6).toUpperCase()}</p>
          <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleString('fr-FR')}</p>
          <p><strong>Client:</strong> ${order.customerName || 'Client DKS'}</p>
          <div class="line"></div>
          <table>${itemsHtml}</table>
          <div class="line"></div>
          <p><strong>Paiement:</strong> ${getPaymentLabel(order.paymentMethod)}</p>
          ${order.txid ? `<p><strong>TxID:</strong> <span style="font-size:9px">${order.txid.slice(0, 20)}...</span></p>` : ''}
          <div class="total">TOTAL: $${parseFloat(order.total).toFixed(2)}</div>
          <div class="footer">
            Merci de votre confiance !<br/>
            Double King Shop • Bunia
          </div>
        </div>
        <script>window.onload = function() { window.focus(); window.print(); };</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  // 🎯 Ouvrir le modal détails
  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  // 🎯 Mettre à jour le statut (Admin uniquement)
  const handleUpdateStatus = async (orderId, newStatus) => {
    if (user?.role !== ROLES.ADMIN) return;
    
    try {
      await apiService.updateOrderStatus(orderId, newStatus);
      await loadOrders();
      showSuccess('Statut mis à jour');
    } catch (err) {
      showError('Échec de la mise à jour');    }
  };

  // 🎯 Rendu Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="animate-spin mx-auto mb-4 text-blue-600" size={48} />
          <p className="text-slate-500 font-medium">Chargement des commandes...</p>
        </div>
      </div>
    );
  }

  // 🎯 Rendu Non autorisé
  if (!isAuthenticated || (user?.role !== ROLES.ADMIN && user?.role !== ROLES.CASHIER)) {
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
                <ArrowLeft size={20} />
              </Link>
              <div>
                <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                  <Package size={20} className="text-blue-600" />
                  Commandes
                </h1>
                <p className="text-sm text-slate-500">Suivi des ventes DKS</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition disabled:opacity-50"
                title="Actualiser"              >
                <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
              </button>
              <button 
                onClick={handleExport}
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition"
              >
                <Download size={16} /> Export CSV
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
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Ventes</p>
            <p className="text-2xl font-black text-slate-900">${stats.total.toFixed(2)}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Commandes</p>
            <p className="text-2xl font-black text-blue-600">{stats.count}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Validées</p>
            <p className="text-2xl font-black text-emerald-600">{stats.completed}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pi Network</p>
            <p className="text-2xl font-black text-yellow-600">{stats.piPayments}</p>
          </div>
        </div>

        {/* 🔍 Barre de recherche et filtres */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Recherche */}
            <div className="relative flex-1">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher (client, ID, txid)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition"
              />            </div>
            
            {/* Filtres */}
            <div className="flex flex-wrap gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              >
                <option value="all">Tous statuts</option>
                <option value="completed">✓ Validées</option>
                <option value="pending">⏳ En attente</option>
                <option value="cancelled">✗ Annulées</option>
              </select>
              
              <select
                value={filterPayment}
                onChange={(e) => setFilterPayment(e.target.value)}
                className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              >
                <option value="all">Tous paiements</option>
                <option value="pi_network">Π Pi Network</option>
                <option value="mobile_money">📱 Mobile Money</option>
                <option value="cash">💵 Cash</option>
              </select>
              
              <select
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              >
                <option value="all">Toutes dates</option>
                <option value="today">Aujourd'hui</option>
                <option value="week">Cette semaine</option>
                <option value="month">Ce mois</option>
              </select>
              
              <button 
                onClick={() => { setSearchQuery(''); setFilterStatus('all'); setFilterPayment('all'); setFilterDate('all'); }}
                className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 transition"
                title="Réinitialiser"
              >
                <Filter size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* 📋 Tableau des commandes */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="p-5 font-bold text-slate-600 text-xs uppercase tracking-wider">Date & ID</th>
                  <th className="p-5 font-bold text-slate-600 text-xs uppercase tracking-wider">Client</th>
                  <th className="p-5 font-bold text-slate-600 text-xs uppercase tracking-wider text-right">Total</th>
                  <th className="p-5 font-bold text-slate-600 text-xs uppercase tracking-wider text-center">Paiement</th>
                  <th className="p-5 font-bold text-slate-600 text-xs uppercase tracking-wider text-center">Statut</th>
                  <th className="p-5 font-bold text-slate-600 text-xs uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((order) => {
                  const statusConfig = getStatusConfig(order.status);
                  const StatusIcon = statusConfig.icon;
                  
                  return (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="p-5">
                        <div className="space-y-1">
                          <p className="text-xs text-slate-400 flex items-center gap-1">
                            <Calendar size={12} />
                            {new Date(order.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                          </p>
                          <p className="text-xs font-mono font-bold text-blue-600">
                            #{order.id?.slice(-8).toUpperCase()}
                          </p>
                        </div>
                      </td>
                      
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                            {(order.customerName || 'C').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{order.customerName || 'Client DKS'}</p>
                            <p className="text-[10px] text-slate-400">
                              {typeof order.items === 'string' ? JSON.parse(order.items).length : order.items?.length || 0} article(s)
                            </p>
                          </div>
                        </div>
                      </td>
                      
                      <td className="p-5 text-right">
                        <p className="font-black text-slate-900">${parseFloat(order.total).toFixed(2)}</p>
                        {order.txid && (
                          <p className="text-[10px] text-slate-400 font-mono truncate max-w-[120px]" title={order.txid}>
                    {order.txid.slice(0, 12)}...
                          </p>
                        )}
                      </td>
                      
                      <td className="p-5 text-center">
                        <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-bold border ${getPaymentBadgeClass(order.paymentMethod)}`}>
                          {getPaymentLabel(order.paymentMethod)}
                        </span>
                      </td>
                      
                      <td className="p-5 text-center">
                        <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border ${statusConfig.class}`}>
                          <StatusIcon size={12} />
                          {statusConfig.label}
                        </span>
                      </td>
                      
                      <td className="p-5 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleViewOrder(order)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition"
                            title="Voir détails"
                          >
                            <Eye size={16} />
                          </button>
                          <button 
                            onClick={() => handlePrintReceipt(order)}
                            className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition"
                            title="Imprimer reçu"
                          >
                            <Printer size={16} />
                          </button>
                          {/* Menu statut (Admin uniquement) */}
                          {user?.role === ROLES.ADMIN && order.status === 'pending' && (
                            <div className="relative group/status">
                              <button className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition">
                                <CheckCircle size={16} />
                              </button>
                              <div className="absolute right-0 mt-2 w-32 bg-white rounded-xl shadow-lg border border-slate-200 py-2 opacity-0 invisible group-hover/status:opacity-100 group-hover/status:visible transition-all z-10">
                                <button 
                                  onClick={() => handleUpdateStatus(order.id, 'completed')}
                                  className="w-full px-4 py-2 text-left text-xs text-emerald-700 hover:bg-emerald-50 flex items-center gap-2"
                                >
                                  <CheckCircle size={12} /> Valider
                                </button>
                                <button 
                                  onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                                  className="w-full px-4 py-2 text-left text-xs text-red-700 hover:bg-red-50 flex items-center gap-2"
                                >
                                  <X size={12} /> Annuler
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                
                {/* État vide */}
                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan="6" className="p-12 text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                        <Package size={32} className="text-slate-400" />
                      </div>
                      <p className="text-slate-500 font-medium mb-2">
                        {searchQuery || filterStatus !== 'all' || filterPayment !== 'all' || filterDate !== 'all'
                          ? 'Aucune commande ne correspond à votre recherche'
                          : 'Aucune commande enregistrée'}
                      </p>
                      <p className="text-slate-400 text-sm mb-4">
                        {searchQuery || filterStatus !== 'all' || filterPayment !== 'all' || filterDate !== 'all'
                          ? 'Essayez de modifier vos filtres'
                          : 'Les commandes apparaîtront ici après les premières ventes'}
                      </p>
                      {(searchQuery || filterStatus !== 'all' || filterPayment !== 'all' || filterDate !== 'all') && (
                        <button 
                          onClick={() => { setSearchQuery(''); setFilterStatus('all'); setFilterPayment('all'); setFilterDate('all'); }}
                          className="text-blue-600 font-bold text-sm hover:underline"
                        >
                          Réinitialiser les filtres
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

      {/* 🎯 MODAL DÉTAILS COMMANDE */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
            onClick={() => setShowOrderModal(false)}
          />
          
          <div className="relative bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl animate-slideUp">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white flex justify-between items-start">
              <div>
                <h2 className="text-lg font-black uppercase tracking-tight">Détails de la commande</h2>
                <p className="text-blue-100 text-xs mt-1">#{selectedOrder.id?.slice(-8).toUpperCase()}</p>
              </div>
              <button 
                onClick={() => setShowOrderModal(false)}
                className="p-2 hover:bg-white/20 rounded-full transition"
                aria-label="Fermer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Contenu */}
            <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
              
              {/* Infos client */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Client</p>
                  <p className="font-bold text-slate-900">{selectedOrder.customerName || 'Client DKS'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Date</p>
                  <p className="font-bold text-slate-900">
                    {new Date(selectedOrder.createdAt).toLocaleString('fr-FR')}
                  </p>
                </div>
              </div>

              {/* Articles */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-3">Articles commandés</p>
                <div className="space-y-3">
                  {(typeof selectedOrder.items === 'string' ? JSON.parse(selectedOrder.items) : selectedOrder.items || []).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{item.name}</p>
                        <p className="text-[10px] text-slate-400">{item.category || 'Non classé'}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-900">{item.quantity}x ${item.price?.toFixed(2)}</p>
                        <p className="text-[10px] text-slate-400">= ${(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Paiement */}
              <div className="p-4 bg-slate-50 rounded-xl space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">Sous-total</span>
                  <span className="font-bold">${parseFloat(selectedOrder.total).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">Paiement</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${getPaymentBadgeClass(selectedOrder.paymentMethod)}`}>
                    {getPaymentLabel(selectedOrder.paymentMethod)}
                  </span>
                </div>
                {selectedOrder.txid && (
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Transaction ID</span>
                    <span className="text-[10px] font-mono text-slate-400 truncate max-w-[200px]" title={selectedOrder.txid}>
                      {selectedOrder.txid}
                    </span>
                  </div>
                )}
                <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
                  <span className="text-lg font-black text-slate-900">Total</span>
                  <span className="text-2xl font-black text-blue-600">${parseFloat(selectedOrder.total).toFixed(2)}</span>
                </div>
              </div>

              {/* Statut & Actions */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  {(() => {
                    const config = getStatusConfig(selectedOrder.status);
                    const Icon = config.icon;
                    return (
                      <>
                        <div className={`p-2 rounded-lg ${config.class.replace('text-', 'bg-').replace('700', '100').replace('border-', '')}`}>
                          <Icon size={18} className={config.class.split(' ')[1]} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">Statut</p>
                          <p className={`text-xs font-bold ${config.class.split(' ')[1]}`}>{config.label}</p>
                        </div>
                      </>
                    );
                  })()}
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => handlePrintReceipt(selectedOrder)}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition"
                  >
                    <Printer size={14} /> Reçu
                  </button>
                  {user?.role === ROLES.ADMIN && selectedOrder.status === 'pending' && (
                    <button 
                      onClick={() => { handleUpdateStatus(selectedOrder.id, 'completed'); setShowOrderModal(false); }}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition"
                    >
                      <CheckCircle size={14} /> Valider
                    </button>
                  )}
                </div>
              </div>
            </div>
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

export default AdminOrders;