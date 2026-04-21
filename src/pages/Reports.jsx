// src/pages/Reports.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { 
  Download, Calendar, Filter, ArrowLeft, TrendingUp, TrendingDown, 
  Package, ShoppingCart, DollarSign, AlertCircle, Loader, RefreshCw 
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { ROLES } from '../utils/constants';
import apiService from '../services/api';

// 🎯 Couleurs pour les graphiques (cohérentes avec DKS)
const CHART_COLORS = {
  primary: '#2563eb',    // blue-600
  success: '#10b981',    // emerald-500
  warning: '#f59e0b',    // amber-500
  error: '#ef4444',      // red-500
  info: '#6366f1',       // indigo-500
  gray: '#64748b'        // slate-500
};

const Reports = () => {
  const { user, isAuthenticated } = useAuth();
  const { showSuccess, showError, showInfo } = useNotification();
  const navigate = useNavigate();
  
  // 🎯 Protection Admin
  useEffect(() => {
    if (!isAuthenticated || user?.role !== ROLES.ADMIN) {
      navigate('/login', { replace: true, state: { from: { pathname: '/reports' } } });
    }
  }, [isAuthenticated, user, navigate]);

  // 🎯 États
  const [stats, setStats] = useState({
    totalSales: 0,
    totalExpenses: 0,
    netProfit: 0,
    ordersCount: 0,
    avgOrderValue: 0,
    topCategory: ''
  });
  const [orders, setOrders] = useState([]);
  const [expenses, setExpenses] = useState([]);  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // 🎯 Filtres de date
  const [dateRange, setDateRange] = useState('30days'); // '7days', '30days', '90days', 'all'
  const [customDate, setCustomDate] = useState({ start: '', end: '' });
  
  // 🎯 Données pour graphiques
  const [salesData, setSalesData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [paymentData, setPaymentData] = useState([]);

  // 🎯 Calcul de la période de date
  const getDateRange = useMemo(() => {
    const now = new Date();
    const ranges = {
      '7days': { start: new Date(now.setDate(now.getDate() - 7)), end: new Date() },
      '30days': { start: new Date(now.setDate(now.getDate() - 30)), end: new Date() },
      '90days': { start: new Date(now.setDate(now.getDate() - 90)), end: new Date() },
      'all': { start: new Date(2024, 0, 1), end: new Date() }
    };
    
    if (customDate.start && customDate.end) {
      return { start: new Date(customDate.start), end: new Date(customDate.end) };
    }
    return ranges[dateRange] || ranges['30days'];
  }, [dateRange, customDate]);

  // 🎯 Chargement des données
  useEffect(() => {
    if (isAuthenticated && user?.role === ROLES.ADMIN) {
      loadReports();
    }
  }, [isAuthenticated, user, getDateRange]);

  const loadReports = async () => {
    try {
      setLoading(true);
      
      // Charger commandes et dépenses en parallèle
      const [ordersData, expensesData] = await Promise.all([
        apiService.getOrders(),
        apiService.getExpenses?.() || [] // Fallback si endpoint non implémenté
      ]);
      
      // 🔒 Filtrage par période
      const { start, end } = getDateRange;
      const filteredOrders = (ordersData || []).filter(o => {
        const orderDate = new Date(o.createdAt);
        return orderDate >= start && orderDate <= end;      });
      
      const filteredExpenses = (expensesData || []).filter(e => {
        const expenseDate = new Date(e.date || e.createdAt);
        return expenseDate >= start && expenseDate <= end;
      });
      
      setOrders(filteredOrders);
      setExpenses(filteredExpenses);
      
      // 📊 Calcul des stats
      const totalSales = filteredOrders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
      const totalExpenses = filteredExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
      const ordersCount = filteredOrders.length;
      
      setStats({
        totalSales: totalSales.toFixed(2),
        totalExpenses: totalExpenses.toFixed(2),
        netProfit: (totalSales - totalExpenses).toFixed(2),
        ordersCount,
        avgOrderValue: ordersCount > 0 ? (totalSales / ordersCount).toFixed(2) : '0.00',
        topCategory: getCategoryLeader(filteredOrders)
      });
      
      // 📈 Préparation des données graphiques
      prepareChartData(filteredOrders, filteredExpenses);
      
    } catch (err) {
      console.error('Erreur rapports:', err);
      showError('Impossible de charger les rapports');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 🎯 Helper : Trouver la catégorie la plus vendue
  const getCategoryLeader = (orders) => {
    const counts = {};
    orders.forEach(order => {
      const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
      items?.forEach(item => {
        const cat = item.category || 'Non classé';
        counts[cat] = (counts[cat] || 0) + (item.quantity || 1);
      });
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Aucune';
  };

  // 🎯 Préparation des données pour graphiques  const prepareChartData = (orders, expenses) => {
    // 📊 Ventes par jour
    const dailySales = {};
    orders.forEach(order => {
      const date = new Date(order.createdAt).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });
      dailySales[date] = (dailySales[date] || 0) + (parseFloat(order.total) || 0);
    });
    setSalesData(Object.entries(dailySales).map(([day, total]) => ({ day, total })));
    
    // 🥧 Répartition par catégorie
    const categoryCounts = {};
    orders.forEach(order => {
      const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
      items?.forEach(item => {
        const cat = item.category || 'Non classé';
        const value = (item.price || 0) * (item.quantity || 1);
        categoryCounts[cat] = (categoryCounts[cat] || 0) + value;
      });
    });
    setCategoryData(Object.entries(categoryCounts).map(([name, value]) => ({ 
      name, value, color: getRandomColor() 
    })));
    
    // 💳 Méthodes de paiement
    const paymentCounts = {};
    orders.forEach(order => {
      const method = order.paymentMethod || 'inconnu';
      paymentCounts[method] = (paymentCounts[method] || 0) + 1;
    });
    setPaymentData(Object.entries(paymentCounts).map(([name, count]) => ({ 
      name: name === 'pi_network' ? 'Pi Network' : name === 'mobile_money' ? 'Mobile Money' : name,
      count 
    })));
  };

  // 🎯 Couleur aléatoire pour les graphiques
  const getRandomColor = () => {
    const colors = Object.values(CHART_COLORS);
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // 🎯 Rafraîchir les données
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadReports();
    showInfo('Données actualisées');
  };

  // 🎯 Export CSV
  const handleExport = (type) => {    try {
      let data, filename, headers;
      
      if (type === 'orders') {
        data = orders;
        filename = `commandes-dks-${new Date().toISOString().split('T')[0]}.csv`;
        headers = ['ID', 'Client', 'Total', 'Méthode', 'Statut', 'Date'];
      } else if (type === 'expenses') {
        data = expenses;
        filename = `depenses-dks-${new Date().toISOString().split('T')[0]}.csv`;
        headers = ['ID', 'Description', 'Montant', 'Catégorie', 'Date'];
      } else {
        // Export combiné
        data = [
          ['=== COMMANDES ==='],
          ['ID', 'Client', 'Total', 'Méthode', 'Statut', 'Date'],
          ...orders.map(o => [o.id, o.customerName, o.total, o.paymentMethod, o.status, o.createdAt]),
          [''],
          ['=== DÉPENSES ==='],
          ['ID', 'Description', 'Montant', 'Catégorie', 'Date'],
          ...expenses.map(e => [e.id, e.description, e.amount, e.category, e.date || e.createdAt])
        ];
        filename = `rapport-complet-dks-${new Date().toISOString().split('T')[0]}.csv`;
        headers = null;
      }
      
      // Générer CSV
      const csvContent = data.map(row => 
        Array.isArray(row) ? row.map(cell => `"${cell}"`).join(',') : row
      ).join('\n');
      
      // Télécharger
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
      
      showSuccess('Export téléchargé avec succès');
    } catch (err) {
      console.error('Erreur export:', err);
      showError('Échec de l\'export');
    }
  };

  // 🎯 Formatage des nombres
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'USD' }).format(value);  };

  // 🎯 Rendu Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="animate-spin mx-auto mb-4 text-blue-600" size={48} />
          <p className="text-slate-500 font-medium">Génération des rapports...</p>
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
                <ArrowLeft size={20} />
              </Link>
              <div>
                <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                  <TrendingUp size={20} className="text-blue-600" />
                  Rapports & Analyses
                </h1>
                <p className="text-sm text-slate-500">Performance de Double King Shop</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Filtres de date */}
              <div className="hidden md:flex items-center gap-2 bg-slate-100 rounded-xl p-1">
                {['7days', '30days', '90days', 'all'].map(range => (
                  <button
                    key={range}
                    onClick={() => { setDateRange(range); setCustomDate({ start: '', end: '' }); }}                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                      dateRange === range && !customDate.start
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {range === '7days' ? '7j' : range === '30days' ? '30j' : range === '90days' ? '90j' : 'Tout'}
                  </button>
                ))}
              </div>
              
              {/* Boutons d'action */}
              <button 
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition disabled:opacity-50"
                title="Actualiser"
              >
                <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
              </button>
              
              <div className="relative group">
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition shadow-sm">
                  <Download size={16} /> Export
                </button>
                {/* Dropdown export */}
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                  <button 
                    onClick={() => handleExport('orders')}
                    className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <ShoppingCart size={14} /> Commandes
                  </button>
                  <button 
                    onClick={() => handleExport('expenses')}
                    className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <DollarSign size={14} /> Dépenses
                  </button>
                  <button 
                    onClick={() => handleExport('full')}
                    className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 border-t border-slate-100 mt-1 pt-2"
                  >
                    <Download size={14} /> Rapport complet
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>      </header>

      {/* 🎯 CONTENU PRINCIPAL */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        
        {/* 📊 Cartes de stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Ventes */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ventes</p>
                <p className="text-2xl font-black text-slate-900 mt-1">${stats.totalSales}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <ShoppingCart size={20} className="text-blue-600" />
              </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-3">{stats.ordersCount} commandes</p>
          </div>
          
          {/* Dépenses */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dépenses</p>
                <p className="text-2xl font-black text-red-600 mt-1">${stats.totalExpenses}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-xl">
                <TrendingDown size={20} className="text-red-600" />
              </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-3">Frais opérationnels</p>
          </div>
          
          {/* Bénéfice */}
          <div className={`bg-white p-5 rounded-2xl border border-slate-100 shadow-sm ${parseFloat(stats.netProfit) >= 0 ? '' : 'border-red-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bénéfice</p>
                <p className={`text-2xl font-black mt-1 ${parseFloat(stats.netProfit) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  ${stats.netProfit}
                </p>
              </div>
              <div className={`p-3 rounded-xl ${parseFloat(stats.netProfit) >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
                <DollarSign size={20} className={parseFloat(stats.netProfit) >= 0 ? 'text-emerald-600' : 'text-red-600'} />
              </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-3">Revenu net DKS</p>
          </div>          
          {/* Panier moyen */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Panier moyen</p>
                <p className="text-2xl font-black text-indigo-600 mt-1">${stats.avgOrderValue}</p>
              </div>
              <div className="p-3 bg-indigo-50 rounded-xl">
                <Package size={20} className="text-indigo-600" />
              </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-3">Par commande</p>
          </div>
        </div>

        {/* 📈 Graphiques */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          
          {/* Évolution des ventes */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-blue-600" />
              Évolution des ventes
            </h3>
            <div className="h-64">
              {salesData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(v) => `$${v}`} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value) => [`$${value}`, 'Ventes']}
                      labelFormatter={(label) => `Période: ${label}`}
                    />
                    <Line type="monotone" dataKey="total" stroke={CHART_COLORS.primary} strokeWidth={2} dot={{ fill: CHART_COLORS.primary, strokeWidth: 2, r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                  Aucune donnée pour cette période
                </div>
              )}
            </div>
          </div>
          
          {/* Répartition par catégorie */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Package size={16} className="text-blue-600" />
              Ventes par catégorie
            </h3>
            <div className="h-64">
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                    <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                  Aucune donnée pour cette période
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 💳 Méthodes de paiement */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <CreditCardIcon size={16} className="text-blue-600" />
            Méthodes de paiement utilisées
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {paymentData.length > 0 ? paymentData.map((item, index) => (
              <div key={index} className="p-4 bg-slate-50 rounded-xl text-center">
                <p className="text-2xl font-black text-slate-900">{item.count}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">{item.name}</p>
              </div>
            )) : (
              <p className="text-slate-400 text-sm col-span-full text-center">Aucune donnée</p>
            )}
          </div>
        </div>

        {/* 📋 Tableau des dernières commandes */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Dernières commandes</h3>
            <Link to="/admin/orders" className="text-xs font-bold text-blue-600 hover:underline">
              Voir tout →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase">Commande</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase">Client</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase text-right">Total</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase text-center">Paiement</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.slice(0, 10).map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4">
                      <span className="font-mono text-xs text-slate-500">#{order.id?.slice(-6).toUpperCase()}</span>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-slate-900 text-sm">{order.customerName || 'Client'}</p>
                    </td>
                    <td className="p-4 text-right">
                      <p className="font-black text-slate-900">${parseFloat(order.total).toFixed(2)}</p>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        order.paymentMethod === 'pi_network' 
                          ? 'bg-yellow-100 text-yellow-700' 
                          : order.paymentMethod === 'mobile_money'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {order.paymentMethod === 'pi_network' ? 'Π Pi' : order.paymentMethod === 'mobile_money' ? '📱 Mobile' : '💵 Cash'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <p className="text-xs text-slate-500">
                        {new Date(order.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                      </p>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-slate-400">
                      Aucune commande pour cette période
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 🎯 Section Export avancé */}
        <div className="mt-8 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-white flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-lg font-bold">Besoin d'analyses plus poussées ?</p>
            <p className="text-slate-400 text-sm">Exportez vos données pour Excel, Google Sheets ou votre comptable.</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => handleExport('full')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold text-sm transition flex items-center gap-2"
            >
              <Download size={16} /> Exporter CSV
            </button>
            <button className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-sm transition">
              📊 PDF (bientôt)
            </button>
          </div>
        </div>

      </main>

      {/* 🎨 Icône CreditCard personnalisée */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
        .animate-slideUp { animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
    </div>
  );


// 🎨 Icône personnalisée pour CreditCard (si non importée)
const CreditCardIcon = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M2 10h20" />
    <path d="M6 16h4" />
  </svg>
);

export default Reports;