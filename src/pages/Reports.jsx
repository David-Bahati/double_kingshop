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

const CHART_COLORS = {
  primary: '#2563eb',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#6366f1',
  gray: '#64748b'
};

// Composant icône interne (déplacé ici pour plus de clarté)
const CreditCardIcon = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M2 10h20" />
    <path d="M6 16h4" />
  </svg>
);

const Reports = () => {
  const { user, isAuthenticated } = useAuth();
  const { showSuccess, showError, showInfo } = useNotification();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!isAuthenticated || user?.role !== ROLES.ADMIN) {
      navigate('/login', { replace: true, state: { from: { pathname: '/reports' } } });
    }
  }, [isAuthenticated, user, navigate]);

  const [stats, setStats] = useState({
    totalSales: 0, totalExpenses: 0, netProfit: 0, ordersCount: 0, avgOrderValue: 0, topCategory: ''
  });
  const [orders, setOrders] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState('30days');
  const [customDate, setCustomDate] = useState({ start: '', end: '' });
  const [salesData, setSalesData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [paymentData, setPaymentData] = useState([]);

  const getDateRange = useMemo(() => {
    const now = new Date();
    const ranges = {
      '7days': { start: new Date(new Date().setDate(now.getDate() - 7)), end: new Date() },
      '30days': { start: new Date(new Date().setDate(now.getDate() - 30)), end: new Date() },
      '90days': { start: new Date(new Date().setDate(now.getDate() - 90)), end: new Date() },
      'all': { start: new Date(2024, 0, 1), end: new Date() }
    };
    if (customDate.start && customDate.end) {
      return { start: new Date(customDate.start), end: new Date(customDate.end) };
    }
    return ranges[dateRange] || ranges['30days'];
  }, [dateRange, customDate]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const [ordersData, expensesData] = await Promise.all([
        apiService.getOrders(),
        apiService.getExpenses?.() || []
      ]);
      const { start, end } = getDateRange;
      const filteredOrders = (ordersData || []).filter(o => {
        const orderDate = new Date(o.createdAt);
        return orderDate >= start && orderDate <= end;
      });
      const filteredExpenses = (expensesData || []).filter(e => {
        const expenseDate = new Date(e.date || e.createdAt);
        return expenseDate >= start && expenseDate <= end;
      });
      setOrders(filteredOrders);
      setExpenses(filteredExpenses);
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
      prepareChartData(filteredOrders, filteredExpenses);
    } catch (err) {
      console.error('Erreur rapports:', err);
      showError('Impossible de charger les rapports');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

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

  const prepareChartData = (orders, expenses) => {
    const dailySales = {};
    orders.forEach(order => {
      const date = new Date(order.createdAt).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });
      dailySales[date] = (dailySales[date] || 0) + (parseFloat(order.total) || 0);
    });
    setSalesData(Object.entries(dailySales).map(([day, total]) => ({ day, total })));
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

  const getRandomColor = () => {
    const colors = Object.values(CHART_COLORS);
    return colors[Math.floor(Math.random() * colors.length)];
  };

  useEffect(() => {
    if (isAuthenticated && user?.role === ROLES.ADMIN) {
      loadReports();
    }
  }, [isAuthenticated, user, getDateRange]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadReports();
    showInfo('Données actualisées');
  };

  const handleExport = (type) => {
    try {
      let data, filename;
      if (type === 'orders') {
        data = orders;
        filename = `commandes-dks-${new Date().toISOString().split('T')[0]}.csv`;
      } else if (type === 'expenses') {
        data = expenses;
        filename = `depenses-dks-${new Date().toISOString().split('T')[0]}.csv`;
      } else {
        data = [['=== DKS RAPPORT ===']]; // Simplifié pour l'exemple
        filename = `rapport-complet-dks-${new Date().toISOString().split('T')[0]}.csv`;
      }
      const csvContent = data.map(row => Array.isArray(row) ? row.join(',') : JSON.stringify(row)).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      showSuccess('Export téléchargé');
    } catch (err) {
      showError('Échec de l\'export');
    }
  };

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

  if (!isAuthenticated || user?.role !== ROLES.ADMIN) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/admin/dashboard" className="p-2 text-slate-400 hover:text-blue-600 rounded-xl transition">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-xl font-black text-slate-900 uppercase flex items-center gap-2">
                <TrendingUp size={20} className="text-blue-600" /> Rapports
              </h1>
            </div>
          </div>
          <button onClick={handleRefresh} className="p-2 bg-slate-100 rounded-xl"><RefreshCw size={18} /></button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Ventes</p>
            <p className="text-2xl font-black text-slate-900">${stats.totalSales}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Dépenses</p>
            <p className="text-2xl font-black text-red-600">${stats.totalExpenses}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Bénéfice</p>
            <p className="text-2xl font-black text-emerald-600">${stats.netProfit}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Commandes</p>
            <p className="text-2xl font-black text-indigo-600">{stats.ordersCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border p-6 mb-8 h-80">
          <h3 className="text-sm font-bold mb-4">Évolution des ventes</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="total" stroke={CHART_COLORS.primary} strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </main>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
      `}</style>
    </div>
  );
};

export default Reports;
