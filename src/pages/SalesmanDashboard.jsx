// src/pages/SalesmanDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, TrendingUp, Package, DollarSign, Tag, 
  ChevronRight, Loader, AlertCircle, BarChart3 
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { ROLES } from '../utils/constants';
import apiService from '../services/api';

const SalesmanDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const { showError, showInfo } = useNotification();
  const navigate = useNavigate();

  // 🎯 États
  const [stats, setStats] = useState({
    totalSales: 0,
    totalRevenue: 0,
    productsCount: 0,
    topCategory: '...'
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🎯 Protection route (Salesman ou Admin uniquement)
  useEffect(() => {
    if (!isAuthenticated || (user?.role !== ROLES.SALESMAN && user?.role !== ROLES.ADMIN)) {
      navigate('/login', { replace: true, state: { from: { pathname: '/salesman/dashboard' } } });
    }
  }, [isAuthenticated, user, navigate]);

  // 🎯 Chargement des données
  useEffect(() => {
    if (isAuthenticated && (user?.role === ROLES.SALESMAN || user?.role === ROLES.ADMIN)) {
      loadData();
    }
  }, [isAuthenticated, user]);

  const loadData = async () => {
    try {
      setLoading(true);
      // Récupérer commandes et produits
      const [orders, products] = await Promise.all([
        apiService.getOrders(),
        apiService.getProducts()
      ]);
      const ordersData = orders || [];
      const productsData = products || [];

      // Calculer les stats générales (Performance de la boutique)
      const revenue = ordersData.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
      
      // Identifier la catégorie la plus vendue (utile pour orienter les clients)
      const categoryCounts = {};
      ordersData.forEach(o => {
        const items = typeof o.items === 'string' ? JSON.parse(o.items) : o.items;
        items?.forEach(item => {
          const cat = item.category || 'Général';
          categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        });
      });
      const topCat = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Aucune';

      setStats({
        totalSales: ordersData.length,
        totalRevenue: revenue,
        productsCount: productsData.length,
        topCategory: topCat
      });

      // Prendre les 5 dernières commandes pour l'activité récente
      setRecentOrders(ordersData.slice(0, 5));

    } catch (err) {
      console.error('Erreur dashboard vendeur:', err);
      showError('Impossible de charger les données de performance');
    } finally {
      setLoading(false);
    }
  };

  // 🎯 Formatage devise
  const formatCurrency = (amount) => 
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'USD' }).format(amount || 0);

  // 🎯 Rendu Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="animate-spin mx-auto mb-4 text-indigo-600" size={48} />
          <p className="text-slate-500 font-medium">Chargement de l'espace vendeur...</p>
        </div>
      </div>
    );  }

  return (
    <div className="min-h-screen bg-slate-50">
      
      {/* 🎯 HEADER */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-200">
                <ShoppingBag size={24} />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                  Espace Vendeur
                </h1>
                <p className="text-sm text-slate-500">
                  Performance & Outils • {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
            
            <Link to="/products" className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition">
              Catalogue
            </Link>
          </div>
        </div>
      </header>

      {/* 🎯 CONTENU PRINCIPAL */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        
        {/* 📊 Stats de Performance */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          
          {/* Ventes Totales */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ventes Totales</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{stats.totalSales}</p>
              <p className="text-[10px] text-emerald-600 mt-1 font-bold flex items-center gap-1">
                <TrendingUp size={10} /> Commandes
              </p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
              <TrendingUp size={20} />
            </div>
          </div>
                    {/* Chiffre d'Affaires */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Chiffre d'Affaires</p>
              <p className="text-2xl font-black text-indigo-600 mt-1">{formatCurrency(stats.totalRevenue)}</p>
              <p className="text-[10px] text-slate-400 mt-1">Global</p>
            </div>
            <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
              <DollarSign size={20} />
            </div>
          </div>
          
          {/* Produits Disponibles */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Produits en Stock</p>
              <p className="text-2xl font-black text-blue-600 mt-1">{stats.productsCount}</p>
              <p className="text-[10px] text-slate-400 mt-1">Catalogue</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
              <Package size={20} />
            </div>
          </div>
          
          {/* Catégorie Top */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Meilleure Vente</p>
              <p className="text-lg font-black text-amber-600 mt-1 truncate max-w-[120px]" title={stats.topCategory}>
                {stats.topCategory}
              </p>
              <p className="text-[10px] text-slate-400 mt-1">Tendance</p>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
              <Tag size={20} />
            </div>
          </div>
        </div>

        {/* 🚀 Actions Rapides (Focus Vente) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          
          <Link to="/products" className="group flex items-center p-6 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl text-white shadow-lg hover:shadow-xl transition-all active:scale-[0.99]">
            <div className="flex-1">
              <h3 className="text-lg font-black uppercase flex items-center gap-2">
                <Package size={20} /> Voir le Catalogue
              </h3>
              <p className="text-blue-100 text-sm mt-1">Consulter les stocks et prix actuels</p>
            </div>
            <ChevronRight size={32} className="opacity-50 group-hover:translate-x-2 transition-transform" />          </Link>
          
          <Link to="/checkout" className="group flex items-center p-6 bg-white border border-slate-200 rounded-2xl text-slate-800 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all active:scale-[0.99]">
            <div className="flex-1">
              <h3 className="text-lg font-black uppercase flex items-center gap-2">
                <ShoppingBag size={20} /> Nouvelle Vente
              </h3>
              <p className="text-slate-500 text-sm mt-1">Enregistrer une commande client rapidement</p>
            </div>
            <ChevronRight size={32} className="text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-2 transition-all" />
          </Link>
        </div>

        {/* 📋 Activité Récente */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 size={18} className="text-indigo-600" />
              Activité Récente (Boutique)
            </h3>
            <Link to="/orders" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
              Voir tout <ChevronRight size={14} />
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
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.length > 0 ? recentOrders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-mono text-xs text-slate-500">#{order.id?.slice(-6).toUpperCase()}</td>
                    <td className="p-4 font-bold text-slate-900 text-sm">{order.customerName || 'Client DKS'}</td>
                    <td className="p-4 text-right font-black text-slate-900">{formatCurrency(order.total)}</td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex px-2 py-1 rounded-full text-[10px] font-bold border ${
                        order.paymentMethod === 'pi_network' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                        order.paymentMethod === 'mobile_money' ? 'bg-green-100 text-green-700 border-green-200' :
                        'bg-blue-100 text-blue-700 border-blue-200'
                      }`}>
                        {order.paymentMethod === 'pi_network' ? 'Π Pi' : order.paymentMethod === 'mobile_money' ? '📱 Mobile' : '💵 Cash'}
                      </span>
                    </td>                  </tr>
                )) : (
                  <tr>
                    <td colSpan="4" className="p-10 text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 mb-3">
                        <BarChart3 size={24} className="text-slate-400" />
                      </div>
                      <p className="text-slate-500 font-medium mb-1">Aucune activité récente</p>
                      <p className="text-sm text-slate-400">Les ventes apparaîtront ici dès qu'une commande sera passée</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SalesmanDashboard;