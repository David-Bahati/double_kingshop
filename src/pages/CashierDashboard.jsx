// src/pages/CashierDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, History, Users, Clock, TrendingUp, 
  Plus, ChevronRight, Loader, AlertCircle, Receipt, Search 
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { ROLES } from '../utils/constants';
import apiService from '../services/api';

const CashierDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const { showError, showInfo } = useNotification();
  const navigate = useNavigate();

  // 🎯 États
  const [stats, setStats] = useState({
    todaySales: 0,
    totalOrders: 0,
    pendingOrders: 0,
    todayRevenue: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🎯 Protection route (Cashier ou Admin uniquement)
  useEffect(() => {
    if (!isAuthenticated || (user?.role !== ROLES.CASHIER && user?.role !== ROLES.ADMIN)) {
      navigate('/login', { replace: true, state: { from: { pathname: '/cashier/dashboard' } } });
    }
  }, [isAuthenticated, user, navigate]);

  // 🎯 Chargement des données
  useEffect(() => {
    if (isAuthenticated && (user?.role === ROLES.CASHIER || user?.role === ROLES.ADMIN)) {
      loadData();
    }
  }, [isAuthenticated, user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const orders = await apiService.getOrders();
      const today = new Date().toDateString();
      
      const todayOrders = (orders || []).filter(o => 
        new Date(o.createdAt).toDateString() === today      );
      
      const pending = (orders || []).filter(o => o.status === 'pending').length;
      const revenue = todayOrders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);

      setStats({
        todaySales: todayOrders.length,
        totalOrders: orders.length,
        pendingOrders: pending,
        todayRevenue: revenue
      });
      setRecentOrders(todayOrders.slice(0, 6)); // 6 dernières ventes du jour
    } catch (err) {
      console.error('Erreur dashboard caisse:', err);
      showError('Impossible de charger les données de la caisse');
      // Fallback vide pour éviter le crash
      setStats({ todaySales: 0, totalOrders: 0, pendingOrders: 0, todayRevenue: 0 });
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
          <Loader className="animate-spin mx-auto mb-4 text-blue-600" size={48} />
          <p className="text-slate-500 font-medium">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      
      {/* 🎯 HEADER */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-200">
                <ShoppingCart size={24} />
              </div>
              <div>                <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                  Dashboard Caisse
                </h1>
                <p className="text-sm text-slate-500">
                  Bienvenue, {user?.name} • {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Link to="/admin/dashboard" className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition">
                ← Retour Admin
              </Link>
              <Link to="/checkout" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition shadow-sm">
                <Plus size={16} /> Nouvelle Vente
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* 🎯 CONTENU PRINCIPAL */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        
        {/* 📊 Stats Rapides */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ventes Aujourd'hui</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{stats.todaySales}</p>
            <p className="text-[10px] text-emerald-600 mt-1 font-bold flex items-center gap-1">
              <TrendingUp size={10} /> Commandes traitées
            </p>
          </div>
          
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Chiffre d'Affaires</p>
            <p className="text-2xl font-black text-blue-600 mt-1">{formatCurrency(stats.todayRevenue)}</p>
            <p className="text-[10px] text-slate-400 mt-1">Jour en cours</p>
          </div>
          
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">En Attente</p>
            <p className="text-2xl font-black text-amber-600 mt-1">{stats.pendingOrders}</p>
            <p className="text-[10px] text-amber-600 mt-1 font-bold flex items-center gap-1">
              <Clock size={10} /> À valider
            </p>
          </div>
          
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Commandes</p>            <p className="text-2xl font-black text-indigo-600 mt-1">{stats.totalOrders}</p>
            <p className="text-[10px] text-slate-400 mt-1">Toutes périodes</p>
          </div>
        </div>

        {/* 🚀 Actions Rapides */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link to="/checkout" className="group bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:border-blue-300 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-50 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <ShoppingCart size={24} />
              </div>
              <ChevronRight size={20} className="text-slate-300 group-hover:text-blue-600 transition-colors" />
            </div>
            <h3 className="font-bold text-slate-900">Ouvrir la Caisse</h3>
            <p className="text-sm text-slate-500 mt-1">Lancer une nouvelle vente rapide (Cash/Pi/Mobile)</p>
          </Link>

          <Link to="/orders" className="group bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:border-emerald-300 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <Receipt size={24} />
              </div>
              <ChevronRight size={20} className="text-slate-300 group-hover:text-emerald-600 transition-colors" />
            </div>
            <h3 className="font-bold text-slate-900">Historique Ventes</h3>
            <p className="text-sm text-slate-500 mt-1">Consulter et imprimer les transactions passées</p>
          </Link>

          <Link to="/customers" className="group bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:border-purple-300 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-50 rounded-xl text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <Users size={24} />
              </div>
              <ChevronRight size={20} className="text-slate-300 group-hover:text-purple-600 transition-colors" />
            </div>
            <h3 className="font-bold text-slate-900">Recherche Clients</h3>
            <p className="text-sm text-slate-500 mt-1">Trouver un client ou enregistrer un nouveau contact</p>
          </Link>
        </div>

        {/* 📋 Ventes Récentes */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Clock size={18} className="text-blue-600" />
              Ventes Récentes (Aujourd'hui)
            </h3>
            <Link to="/orders" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
              Voir tout <ChevronRight size={14} />            </Link>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase">ID Commande</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase">Client</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase text-right">Montant</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase text-center">Paiement</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase text-center">Statut</th>
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
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex px-2 py-1 rounded-full text-[10px] font-bold border ${
                        order.status === 'completed' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-amber-100 text-amber-700 border-amber-200'
                      }`}>
                        {order.status === 'completed' ? '✓ Validé' : '⏳ En attente'}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" className="p-10 text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 mb-3">
                        <ShoppingCart size={24} className="text-slate-400" />
                      </div>
                      <p className="text-slate-500 font-medium mb-1">Aucune vente aujourd'hui</p>
                      <p className="text-sm text-slate-400 mb-4">Commencez par ouvrir la caisse pour enregistrer une vente</p>
                      <Link to="/checkout" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition">
                        <Plus size={16} /> Nouvelle Vente
                      </Link>
                    </td>
                  </tr>                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
};

export default CashierDashboard;