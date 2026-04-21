import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiService from '../../services/api';
import Sidebar from '../../components/Layout/Sidebar';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import CashRegister from '../../components/POS/CashRegister';
// --- NOUVEAU : IMPORT DU JOURNAL DES DÉPENSES ---
import { useNotification } from '../../context/NotificationContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:3001/api';
const API_SERVER_URL = API_BASE_URL.replace(/\/api$/, '') || 'http://localhost:3001';

// --- COMPOSANT MODAL : AJOUT AVEC PHOTO ---
const AddProductModal = ({ isOpen, onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    name: '', price: '', stock: '', category: 'Accessoires', description: ''
  });
  const [imageFile, setImageFile] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('name', formData.name);
    data.append('price', formData.price);
    data.append('stock', formData.stock);
    data.append('category', formData.category);
    data.append('description', formData.description);
    if (imageFile) data.append('image', imageFile);

    onAdd(data);
    setFormData({ name: '', price: '', stock: '', category: 'Accessoires', description: '' });
    setImageFile(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn">
        <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
          <h2 className="text-xl font-bold uppercase tracking-tight">Nouveau Matériel DKS</h2>
          <button onClick={onClose} className="text-2xl hover:scale-110 transition-transform">✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <input required className="w-full p-3 bg-gray-50 border rounded-xl outline-none focus:border-blue-500" 
                 placeholder="Nom du produit" value={formData.name}
                 onChange={(e) => setFormData({...formData, name: e.target.value})} />
          
          <div className="grid grid-cols-2 gap-4">
            <input required type="number" step="0.01" className="w-full p-3 bg-gray-50 border rounded-xl outline-none" 
                   placeholder="Prix ($)" value={formData.price}
                   onChange={(e) => setFormData({...formData, price: e.target.value})} />
            <input required type="number" className="w-full p-3 bg-gray-50 border rounded-xl outline-none" 
                   placeholder="Stock" value={formData.stock}
                   onChange={(e) => setFormData({...formData, stock: e.target.value})} />
          </div>

          <div className="border-2 border-dashed border-gray-200 p-4 rounded-xl text-center hover:border-blue-400 transition-colors">
            <p className="text-xs font-bold text-gray-400 uppercase mb-2">Photo de l'article</p>
            <input 
              type="file" 
              accept="image/*" 
              className="text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              onChange={(e) => setImageFile(e.target.files[0])} 
            />
          </div>

          <textarea className="w-full p-3 bg-gray-50 border rounded-xl outline-none h-20" 
                    placeholder="Description..." value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})} />
          
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-95 uppercase text-sm">
            Enregistrer dans le Stock DKS
          </button>
        </form>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color, isNegative }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-500 text-[10px] font-black uppercase mb-1 tracking-widest">{title}</p>
        <p className={`text-2xl font-black ${isNegative ? 'text-red-600' : 'text-gray-900'}`}>{value}</p>
      </div>
      <div className={`text-4xl p-3 rounded-lg bg-gray-50 ${color}`}>{icon}</div>
    </div>
  </div>
);

// --- DASHBOARD PRINCIPAL ---
const AdminDashboard = () => {
  const [stats, setStats] = useState({ totalProducts: 0, totalOrders: 0, totalRevenue: 0, totalExpenses: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [taxes, setTaxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPOS, setShowPOS] = useState(false);
  // --- NOUVEAU : ÉTAT POUR LES DÉPENSES ---
  const [showExpenses, setShowExpenses] = useState(false);
  const [showUsers, setShowUsers] = useState(false);
  const [showTaxes, setShowTaxes] = useState(false);
  
  const [currentUser, setCurrentUser] = useState(JSON.parse(localStorage.getItem('dks_user')) || { role: 'vendeur' });
  const navigate = useNavigate();
  const { addNotification } = useNotification();

  useEffect(() => { fetchDashboardData(); }, []);

  // Vérification périodique des nouvelles commandes
  useEffect(() => {
    const checkNewOrders = async () => {
      try {
        const newOrders = await apiService.request('/orders');
        const newOrderCount = newOrders.length;
        const previousCount = localStorage.getItem('dks-order-count') || 0;
        
        if (newOrderCount > previousCount && previousCount > 0) {
          const newOrdersCount = newOrderCount - previousCount;
          addNotification(
            `🆕 ${newOrdersCount} nouvelle${newOrdersCount > 1 ? 's' : ''} commande${newOrdersCount > 1 ? 's' : ''} reçue${newOrdersCount > 1 ? 's' : ''}!`,
            'success'
          );
        }
        
        localStorage.setItem('dks-order-count', newOrderCount);
      } catch (error) {
        console.error('Error checking new orders:', error);
      }
    };

    // Vérifier toutes les 30 secondes
    const interval = setInterval(checkNewOrders, 30000);
    checkNewOrders(); // Vérifier immédiatement

    return () => clearInterval(interval);
  }, [addNotification]);

  const fetchDashboardData = async () => {
    try {
      const [prods, orders, expensesData, usersData, taxesData] = await Promise.all([
        apiService.request('/products') || [], 
        apiService.request('/orders') || [], 
        apiService.request('/expenses') || [],
        apiService.request('/users') || [],
        apiService.request('/taxes') || []
      ]);
      
      const rev = orders.reduce((sum, order) => sum + (order.total || 0), 0);
      const exp = expensesData.reduce((sum, e) => sum + (e.amount || 0), 0);

      setProducts(prods);
      setUsers(usersData);
      setTaxes(taxesData);
      setStats({
        totalProducts: prods.length,
        totalOrders: orders.length,
        totalRevenue: rev,
        totalExpenses: exp
      });
      setRecentOrders(orders);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally { setLoading(false); }
  };

  const analyticsData = useMemo(() => {
    const counts = {};
    recentOrders.forEach(order => {
      if (order.items) {
        order.items.forEach(item => {
          const name = item.split(' (')[0];
          counts[name] = (counts[name] || 0) + 1;
        });
      }
    });
    const topProducts = Object.keys(counts).map(name => ({
      name,
      ventes: counts[name]
    })).sort((a, b) => b.ventes - a.ventes).slice(0, 4);

    const dailyRev = recentOrders.reduce((acc, order) => {
      const date = new Date(order.createdAt).toLocaleDateString('fr-FR', { weekday: 'short' });
      acc[date] = (acc[date] || 0) + order.total;
      return acc;
    }, {});
    const revenueChart = Object.keys(dailyRev).map(day => ({
      day,
      total: dailyRev[day]
    }));

    return { topProducts, revenueChart };
  }, [recentOrders]);

  const handlePrintReceipt = (order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Impossible d’ouvrir la fenêtre de reçu.');
      return;
    }

    const itemsHtml = order.items?.map(i => `<p>• ${i}</p>`).join('') || '<p>Articles informatiques</p>';

    printWindow.document.open();
    printWindow.document.write(`
      <html>
        <head>
          <title>DKS Receipt - ${order.id}</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; padding: 20px; color: #333; text-align: center; }
            .receipt-box { max-width: 300px; margin: auto; border: 1px solid #eee; padding: 15px; }
            .logo { background: #1d4ed8; color: white; padding: 10px; font-weight: 900; font-style: italic; display: inline-block; margin-bottom: 10px; font-size: 24px; }
            .shop-name { font-size: 18px; font-weight: bold; margin-bottom: 2px; text-transform: uppercase; }
            .address { font-size: 10px; text-transform: uppercase; margin-bottom: 20px; color: #666; }
            .line { border-top: 1px dashed #ccc; margin: 10px 0; }
            .details { font-size: 12px; text-align: left; line-height: 1.5; }
            .total { font-size: 18px; font-weight: bold; margin-top: 15px; text-align: right; border-top: 2px solid #000; padding-top: 5px; }
            .footer { font-size: 9px; text-align: center; margin-top: 25px; color: #999; }
          </style>
        </head>
        <body>
          <div class="receipt-box">
            <div class="logo">DKS</div>
            <div class="shop-name">Double King Shop</div>
            <div class="address">Avenue du Commerce, Bunia, Ituri</div>
            <div class="line"></div>
            <div class="details">
              <p><strong>REÇU N°:</strong> ${order.id}</p>
              <p><strong>DATE :</strong> ${new Date(order.createdAt).toLocaleString()}</p>
              <p><strong>CLIENT :</strong> ${order.customerName || 'Client DKS'}</p>
              <div class="line"></div>
              ${itemsHtml}
              <p style="font-size: 9px; margin-top: 10px; color: #666;">TYPE: ${order.txid === 'CASH_PAYMENT' ? 'CASH' : 'BLOCKCHAIN PI'}</p>
            </div>
            <div class="total">TOTAL : ${order.total.toFixed(2)} $</div>
            <div class="footer">
              Merci de votre confiance chez Double King Shop!<br/>
              Expert en accessoires informatiques à Bunia.
            </div>
          </div>
          <script>
            window.onload = function() { window.focus(); window.print(); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleAddProduct = async (formData) => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await fetch(`${API_BASE_URL}/products`, {
        method: 'POST',
        body: formData,
        headers
      });

      if (response.ok) {
        const savedProduct = await response.json();
        setProducts([savedProduct, ...products]);
        setStats(prev => ({ ...prev, totalProducts: prev.totalProducts + 1 }));
        addNotification('Produit ajouté avec succès.', 'success');
        await fetchDashboardData();
      } else {
        const error = await response.json();
        alert(`Erreur: ${error.message || 'Impossible d’ajouter le produit.'}`);
      }
    } catch (error) {
      console.error('Add product error:', error);
      alert("Erreur lors de l'upload du produit. Vérifiez votre connexion et réessayez.");
    }
  };

  const handleAddUser = async (userData) => {
    try {
      await apiService.request('/users', { method: 'POST', body: JSON.stringify(userData) });
      fetchDashboardData();
    } catch (error) {
      alert("Erreur ajout utilisateur");
    }
  };

  const handleUpdateUser = async (id, userData) => {
    try {
      await apiService.request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(userData) });
      fetchDashboardData();
    } catch (error) {
      alert("Erreur modification utilisateur");
    }
  };

  const handleDeleteUser = async (id) => {
    if (confirm("Supprimer cet utilisateur ?")) {
      try {
        await apiService.request(`/users/${id}`, { method: 'DELETE' });
        fetchDashboardData();
      } catch (error) {
        alert("Erreur suppression utilisateur");
      }
    }
  };

  const handleAddTax = async (taxData) => {
    try {
      await apiService.request('/taxes', { method: 'POST', body: JSON.stringify(taxData) });
      fetchDashboardData();
    } catch (error) {
      alert("Erreur ajout taxe");
    }
  };

  const handleUpdateTax = async (id, taxData) => {
    try {
      await apiService.request(`/taxes/${id}`, { method: 'PUT', body: JSON.stringify(taxData) });
      fetchDashboardData();
    } catch (error) {
      alert("Erreur modification taxe");
    }
  };

  const handleDeleteTax = async (id) => {
    if (confirm("Supprimer cette taxe ?")) {
      try {
        await apiService.request(`/taxes/${id}`, { method: 'DELETE' });
        fetchDashboardData();
      } catch (error) {
        alert("Erreur suppression taxe");
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('dks_user');
    navigate('/login');
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center font-bold text-blue-600 uppercase tracking-widest animate-pulse">Chargement de DKS Bunia...</div>;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="ml-64 flex-1 p-8 text-sans">
        
        <div className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase italic">Double King Shop</h1>
            <p className="text-gray-400 font-bold text-xs tracking-widest">
                SESSION : <span className="text-blue-600">{currentUser.name}</span> | ROLE : <span className="text-gray-900">{currentUser.role.toUpperCase()}</span>
            </p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => {setShowPOS(!showPOS); setShowExpenses(false)}} 
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-2xl font-black shadow-xl transition-all active:scale-95 uppercase text-[10px]"
            >
              {showPOS ? "Fermer Caisse" : "🛒 Vente Cash"}
            </button>

            {currentUser.role === 'administrator' && (
              <button 
                onClick={() => {setShowExpenses(!showExpenses); setShowPOS(false); setShowUsers(false); setShowTaxes(false)}} 
                className="bg-red-500 hover:bg-red-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl transition-all active:scale-95 uppercase text-[10px]"
              >
                {showExpenses ? "Fermer" : "💸 Dépenses"}
              </button>
            )}

            {currentUser.role === 'administrator' && (
              <button 
                onClick={() => {setShowUsers(!showUsers); setShowPOS(false); setShowExpenses(false); setShowTaxes(false)}} 
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-2xl font-black shadow-xl transition-all active:scale-95 uppercase text-[10px]"
              >
                {showUsers ? "Fermer Utilisateurs" : "👥 Utilisateurs"}
              </button>
            )}

            {currentUser.role === 'administrator' && (
              <button 
                onClick={() => {setShowTaxes(!showTaxes); setShowPOS(false); setShowExpenses(false); setShowUsers(false)}} 
                className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-4 rounded-2xl font-black shadow-xl transition-all active:scale-95 uppercase text-[10px]"
              >
                {showTaxes ? "Fermer Taxes" : "💸 Taxes"}
              </button>
            )}

            {currentUser.role === 'administrator' && (
              <button 
                onClick={() => {
                  // Export des données en CSV
                  const csvContent = [
                    ['ID', 'Nom', 'Prix', 'Stock', 'Catégorie', 'Description', 'Date création'],
                    ...products.map(p => [p.id, p.name, p.price, p.stock, p.category, p.description, p.createdAt])
                  ].map(row => row.join(',')).join('\n');
                  
                  const blob = new Blob([csvContent], { type: 'text/csv' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `dks-products-${new Date().toISOString().split('T')[0]}.csv`;
                  a.click();
                  window.URL.revokeObjectURL(url);
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-2xl font-black shadow-xl transition-all active:scale-95 uppercase text-[10px]"
              >
                📊 Export Produits
              </button>
            )}

            {currentUser.role === 'administrator' && (
              <button 
                onClick={() => {
                  // Export des commandes en CSV
                  const csvContent = [
                    ['ID', 'Client', 'Total', 'Articles', 'Statut', 'Transaction', 'Date'],
                    ...recentOrders.map(o => [
                      o.id, 
                      o.customerName, 
                      o.total, 
                      o.items ? o.items.join('; ') : '', 
                      o.status, 
                      o.txid, 
                      o.createdAt
                    ])
                  ].map(row => row.join(',')).join('\n');
                  
                  const blob = new Blob([csvContent], { type: 'text/csv' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `dks-orders-${new Date().toISOString().split('T')[0]}.csv`;
                  a.click();
                  window.URL.revokeObjectURL(url);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-black shadow-xl transition-all active:scale-95 uppercase text-[10px]"
              >
                📈 Export Commandes
              </button>
            )}

            {currentUser.role === 'administrator' && (
              <button 
                onClick={async () => {
                  try {
                    const response = await apiService.request('/backup');
                    if (response.success) {
                      addNotification(`💾 Sauvegarde créée: ${response.backupFile}`, 'success');
                    }
                  } catch (error) {
                    addNotification('❌ Erreur lors de la sauvegarde', 'error');
                  }
                }}
                className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-4 rounded-2xl font-black shadow-xl transition-all active:scale-95 uppercase text-[10px]"
              >
       💾 Backup DB
              </button>
            )}

            <button onClick={handleLogout} className="bg-white text-red-500 border border-red-100 px-6 py-4 rounded-2xl font-black hover:bg-red-50 transition-all uppercase text-[10px] shadow-sm">
                Sortir
            </button>
          </div>
        </div>

        {/* MODULES CONDITIONNELS */}
        {showPOS && (
          <div className="mb-10 animate-fadeIn">
            <CashRegister products={products} onSaleSuccess={fetchDashboardData} />
          </div>
        )}

        {showExpenses && (
          <div className="mb-10 animate-fadeIn">
            <ExpenseJournal onUpdate={fetchDashboardData} />
          </div>
        )}

        {showUsers && (
          <div className="mb-10 animate-fadeIn bg-white rounded-3xl shadow-sm border p-6">
            <h2 className="text-xl font-bold mb-6 uppercase tracking-tight">Gestion des Utilisateurs</h2>
            <div className="mb-4">
              <button onClick={() => {
                const name = prompt("Nom de l'utilisateur:");
                const role = prompt("Rôle (administrator/vendeur/caissier):");
                const pin = prompt("Code PIN:");
                const location = prompt("Localisation:");
                if (name && role && pin && location) {
                  handleAddUser({ name, role, pin, location });
                }
              }} className="bg-purple-600 text-white px-4 py-2 rounded">Ajouter Utilisateur</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-gray-300 text-[10px] font-black uppercase border-b pb-4">
                  <tr><th>Nom</th><th>Rôle</th><th>PIN</th><th>Localisation</th><th>Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="py-4 font-bold">{user.name}</td>
                      <td className="py-4">{user.role}</td>
                      <td className="py-4">{user.pin}</td>
                      <td className="py-4">{user.location}</td>
                      <td className="py-4">
                        <button onClick={() => {
                          const name = prompt("Nouveau nom:", user.name);
                          const role = prompt("Nouveau rôle:", user.role);
                          const pin = prompt("Nouveau PIN:", user.pin);
                          const location = prompt("Nouvelle localisation:", user.location);
                          if (name && role && pin && location) {
                            handleUpdateUser(user.id, { name, role, pin, location });
                          }
                        }} className="bg-blue-500 text-white px-2 py-1 rounded mr-2">Modifier</button>
                        <button onClick={() => handleDeleteUser(user.id)} className="bg-red-500 text-white px-2 py-1 rounded">Supprimer</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {showTaxes && (
          <div className="mb-10 animate-fadeIn bg-white rounded-3xl shadow-sm border p-6">
            <h2 className="text-xl font-bold mb-6 uppercase tracking-tight">Gestion des Taxes</h2>
            <div className="mb-4">
              <button onClick={() => {
                const name = prompt("Nom de la taxe:");
                const rate = prompt("Taux (ex: 0.18 pour 18%):");
                const type = prompt("Type (percentage/fixed):");
                if (name && rate && type) {
                  handleAddTax({ name, rate: parseFloat(rate), type });
                }
              }} className="bg-orange-600 text-white px-4 py-2 rounded">Ajouter Taxe</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-gray-300 text-[10px] font-black uppercase border-b pb-4">
                  <tr><th>Nom</th><th>Taux</th><th>Type</th><th>Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {taxes.map((tax) => (
                    <tr key={tax.id} className="hover:bg-gray-50">
                      <td className="py-4 font-bold">{tax.name}</td>
                      <td className="py-4">{tax.rate} {tax.type === 'percentage' ? '%' : '$'}</td>
                      <td className="py-4">{tax.type}</td>
                      <td className="py-4">
                        <button onClick={() => {
                          const name = prompt("Nouveau nom:", tax.name);
                          const rate = prompt("Nouveau taux:", tax.rate);
                          const type = prompt("Nouveau type:", tax.type);
                          if (name && rate && type) {
                            handleUpdateTax(tax.id, { name, rate: parseFloat(rate), type });
                          }
                        }} className="bg-blue-500 text-white px-2 py-1 rounded mr-2">Modifier</button>
                        <button onClick={() => handleDeleteTax(tax.id)} className="bg-red-500 text-white px-2 py-1 rounded">Supprimer</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* STATS CARDS AVEC CALCUL DU BÉNÉFICE */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatCard title="Articles" value={stats.totalProducts} icon="📦" color="text-blue-500" />
          <StatCard title="Revenus" value={`$${stats.totalRevenue.toFixed(2)}`} icon="💰" color="text-emerald-500" />
          <StatCard title="Dépenses" value={`$${stats.totalExpenses.toFixed(2)}`} icon="📉" color="text-red-500" isNegative />
          
          <div className="bg-gray-900 p-6 rounded-xl shadow-xl text-white">
            <p className="text-gray-400 text-[10px] font-black uppercase mb-1 tracking-widest">Bénéfice Net</p>
            <p className={`text-2xl font-black ${stats.totalRevenue - stats.totalExpenses >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
              ${(stats.totalRevenue - stats.totalExpenses).toFixed(2)}
            </p>
            <p className="text-[8px] text-gray-500 mt-2 uppercase font-bold italic">Calculé en temps réel</p>
          </div>
        </div>

        {/* SECTION ANALYTICS */}
        {currentUser.role === 'administrator' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
            <div className="bg-white p-6 rounded-3xl shadow-sm border">
              <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Flux des Revenus ($)</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData.revenueChart}>
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                    <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                    <Bar dataKey="total" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-sm border">
              <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Top Performance Articles</h2>
              <div className="h-64 flex flex-col items-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analyticsData.topProducts.length > 0 ? analyticsData.topProducts : [{name: 'Aucun', ventes: 1}]}
                      innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="ventes"
                    >
                      {analyticsData.topProducts.map((_, i) => (
                        <Cell key={i} fill={['#3b82f6', '#10b981', '#f59e0b', '#6366f1'][i % 4]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* SECTION VENTES ET STOCK */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className={`xl:col-span-2 bg-white rounded-3xl shadow-sm border p-6 ${currentUser.role === 'vendeur' ? 'hidden' : ''}`}>
            <h2 className="text-xl font-bold mb-6 uppercase tracking-tight">Dernières Activités (Pi & Cash)</h2>
            <div className="overflow-x-auto text-sm">
              <table className="w-full text-left">
                <thead className="text-gray-300 text-[10px] font-black uppercase border-b pb-4">
                  <tr><th>Client</th><th>Montant</th><th>Type</th><th className="text-right">Action</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentOrders.slice(0, 8).map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 font-bold">{order.customerName}</td>
                      <td className="py-4 font-black text-gray-900">${order.total.toFixed(2)}</td>
                      <td className="py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${order.txid === 'CASH_PAYMENT' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                          {order.txid === 'CASH_PAYMENT' ? 'CASH' : 'PI'}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <button onClick={() => handlePrintReceipt(order)} className="bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all">📄 Reçu</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className={`${currentUser.role === 'vendeur' ? 'xl:col-span-3' : ''} bg-white rounded-3xl shadow-sm border p-6`}>
            <h2 className="text-xl font-bold mb-6 uppercase tracking-tight">État du Stock</h2>
            <div className="grid grid-cols-1 gap-4">
              {products.map(product => (
                <div key={product.id} className="flex gap-4 items-center p-3 bg-gray-50 rounded-2xl border border-transparent hover:border-blue-200 transition-all">
                  <img src={`${API_SERVER_URL}${product.image}`} alt={product.name} className="w-12 h-12 rounded-xl object-cover" />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-gray-800">{product.name}</p>
                    <p className="text-[10px] text-blue-600 font-black">{product.price} $</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-black ${product.stock < 5 ? 'text-red-500 animate-pulse' : 'text-gray-500'}`}>{product.stock} pcs</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <AddProductModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAdd={handleAddProduct} />
      </main>
    </div>
  );
};

export default AdminDashboard;