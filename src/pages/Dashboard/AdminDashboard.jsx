import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiService from '../../services/api';
import Sidebar from '../../components/Layout/Sidebar';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import CashRegister from '../../components/POS/CashRegister';
import ExpenseJournal from '../../components/Accounting/ExpenseJournal'; 
import { useNotification } from '../../context/NotificationContext';

// --- CORRECTION DYNAMIQUE DU SERVEUR POUR RAILWAY ---
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL 
  ? import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '') 
  : `${window.location.origin}/api`;

const API_SERVER_URL = API_BASE_URL.replace(/\/api$/, '') || window.location.origin;

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
          <input required className="w-full p-3 bg-gray-50 border rounded-xl outline-none focus:border-blue-500 font-bold text-slate-900" 
                 placeholder="Nom du produit" value={formData.name}
                 onChange={(e) => setFormData({...formData, name: e.target.value})} />
          
          <div className="grid grid-cols-2 gap-4">
            <input required type="number" step="0.01" className="w-full p-3 bg-gray-50 border rounded-xl outline-none font-bold text-slate-900" 
                   placeholder="Prix ($)" value={formData.price}
                   onChange={(e) => setFormData({...formData, price: e.target.value})} />
            <input required type="number" className="w-full p-3 bg-gray-50 border rounded-xl outline-none font-bold text-slate-900" 
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

          <textarea className="w-full p-3 bg-gray-50 border rounded-xl outline-none h-20 text-slate-900" 
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

const AdminDashboard = () => {
  const [stats, setStats] = useState({ totalProducts: 0, totalOrders: 0, totalRevenue: 0, totalExpenses: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [taxes, setTaxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPOS, setShowPOS] = useState(false);
  const [showExpenses, setShowExpenses] = useState(false);
  const [showUsers, setShowUsers] = useState(false);
  const [showTaxes, setShowTaxes] = useState(false);
  
  const [currentUser] = useState(JSON.parse(localStorage.getItem('dks_user')) || JSON.parse(localStorage.getItem('user')) || { role: 'vendeur', name: 'Utilisateur' });
  const navigate = useNavigate();
  const { addNotification } = useNotification();

  useEffect(() => { fetchDashboardData(); }, []);

  useEffect(() => {
    const checkNewOrders = async () => {
      try {
        const newOrders = await apiService.request('/orders');
        const newOrderCount = newOrders.length;
        const previousCount = localStorage.getItem('dks-order-count') || 0;
        if (newOrderCount > previousCount && previousCount > 0) {
          addNotification(`🆕 Nouvelle commande reçue au shop !`, 'success');
          fetchDashboardData();
        }
        localStorage.setItem('dks-order-count', newOrderCount);
      } catch (error) { console.error('Error checking new orders:', error); }
    };
    const interval = setInterval(checkNewOrders, 30000);
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
      const rev = orders.reduce((sum, order) => sum + (parseFloat(order.total) || 0), 0);
      const exp = expensesData.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
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
    } catch (error) { console.error('Fetch error:', error); } finally { setLoading(false); }
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
    const topProducts = Object.keys(counts).map(name => ({ name, ventes: counts[name] })).sort((a, b) => b.ventes - a.ventes).slice(0, 4);
    const dailyRev = recentOrders.reduce((acc, order) => {
      const date = new Date(order.createdAt).toLocaleDateString('fr-FR', { weekday: 'short' });
      acc[date] = (acc[date] || 0) + order.total;
      return acc;
    }, {});
    return { topProducts, revenueChart: Object.keys(dailyRev).map(day => ({ day, total: dailyRev[day] })) };
  }, [recentOrders]);

  const handlePrintReceipt = (order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const itemsHtml = order.items?.map(i => `<p>• ${i}</p>`).join('') || '<p>Articles informatiques</p>';
    printWindow.document.write(`
      <html><head><title>DKS Receipt - ${order.id}</title><style>
        body { font-family: 'Courier New', monospace; padding: 20px; color: #333; text-align: center; }
        .receipt-box { max-width: 300px; margin: auto; border: 1px solid #eee; padding: 15px; }
        .logo { background: #1d4ed8; color: white; padding: 10px; font-weight: 900; font-style: italic; display: inline-block; margin-bottom: 10px; font-size: 24px; }
        .details { font-size: 12px; text-align: left; line-height: 1.5; }
        .total { font-size: 18px; font-weight: bold; border-top: 2px solid #000; padding-top: 5px; text-align: right; }
      </style></head><body><div class="receipt-box"><div class="logo">DKS</div><div class="details">
      <p><strong>REÇU N°:</strong> ${order.id}</p><p><strong>DATE:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
      <hr/>${itemsHtml}<p>TYPE: ${order.txid === 'CASH_PAYMENT' ? 'CASH' : 'BLOCKCHAIN PI'}</p></div>
      <div class="total">TOTAL : ${order.total.toFixed(2)} $</div></div><script>window.onload = function() { window.print(); };</script></body></html>
    `);
    printWindow.document.close();
  };

  const handleAddProduct = async (formData) => {
    try {
      const response = await apiService.request('/products', { method: 'POST', body: formData, isFormData: true });
      if (response) {
        addNotification('Produit ajouté avec succès.', 'success');
        fetchDashboardData();
      }
    } catch (error) { console.error('Add product error:', error); }
  };

  const handleAddUser = async (userData) => { try { await apiService.request('/users', { method: 'POST', body: JSON.stringify(userData) }); fetchDashboardData(); } catch (e) {} };
  const handleUpdateUser = async (id, userData) => { try { await apiService.request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(userData) }); fetchDashboardData(); } catch (e) {} };
  const handleDeleteUser = async (id) => { if (confirm("Supprimer ?")) { await apiService.request(`/users/${id}`, { method: 'DELETE' }); fetchDashboardData(); } };
  const handleAddTax = async (taxData) => { try { await apiService.request('/taxes', { method: 'POST', body: JSON.stringify(taxData) }); fetchDashboardData(); } catch (e) {} };
  const handleUpdateTax = async (id, taxData) => { try { await apiService.request(`/taxes/${id}`, { method: 'PUT', body: JSON.stringify(taxData) }); fetchDashboardData(); } catch (e) {} };
  const handleDeleteTax = async (id) => { if (confirm("Supprimer ?")) { await apiService.request(`/taxes/${id}`, { method: 'DELETE' }); fetchDashboardData(); } };
  const handleLogout = () => { localStorage.clear(); navigate('/login'); };

  if (loading) return <div className="flex min-h-screen items-center justify-center font-bold text-blue-600 uppercase tracking-widest animate-pulse">Chargement de DKS Bunia...</div>;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="ml-64 flex-1 p-8">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase italic">Double King Shop</h1>
            <p className="text-gray-400 font-bold text-xs tracking-widest uppercase">SESSION : {currentUser.name} | ROLE : {currentUser.role}</p>
          </div>
          <div className="flex gap-4">
            <button onClick={() => setShowPOS(!showPOS)} className="bg-emerald-600 text-white px-6 py-4 rounded-2xl font-black uppercase text-[10px] shadow-lg">🛒 Caisse POS</button>
            {currentUser.role === 'administrator' && (
              <>
                <button onClick={() => setShowExpenses(!showExpenses)} className="bg-red-500 text-white px-6 py-4 rounded-2xl font-black uppercase text-[10px] shadow-lg">💸 Dépenses</button>
                <button onClick={() => setShowUsers(!showUsers)} className="bg-purple-600 text-white px-6 py-4 rounded-2xl font-black uppercase text-[10px] shadow-lg">👥 Staff</button>
                <button onClick={() => setShowTaxes(!showTaxes)} className="bg-orange-600 text-white px-6 py-4 rounded-2xl font-black uppercase text-[10px] shadow-lg">📊 Taxes</button>
              </>
            )}
            <button onClick={handleLogout} className="bg-white text-red-500 border border-red-100 px-6 py-4 rounded-2xl font-black uppercase text-[10px] shadow-sm">Sortir</button>
          </div>
        </div>

        {showPOS && <div className="mb-10 animate-fadeIn"><CashRegister products={products} onSaleSuccess={fetchDashboardData} /></div>}
        {showExpenses && <div className="mb-10 animate-fadeIn"><ExpenseJournal onUpdate={fetchDashboardData} /></div>}

        {showUsers && (
          <div className="mb-10 bg-white rounded-3xl shadow-sm border p-6">
            <h2 className="text-xl font-bold mb-6 uppercase tracking-tight">Gestion du Personnel</h2>
            <button onClick={() => {
              const n = prompt("Nom:"); const r = prompt("Rôle:"); const p = prompt("PIN:"); const l = prompt("Ville:");
              if (n && r && p && l) handleAddUser({ name: n, role: r, pin: p, location: l });
            }} className="bg-purple-600 text-white px-4 py-2 rounded mb-4 text-xs font-bold uppercase">Nouveau Membre</button>
            <div className="overflow-x-auto"><table className="w-full text-left"><thead className="text-gray-300 text-[10px] font-black uppercase border-b"><tr><th>Nom</th><th>Rôle</th><th>Actions</th></tr></thead><tbody className="divide-y divide-gray-50">{users.map(u => (
              <tr key={u.id}>
                <td className="py-4 font-bold">{u.name}</td><td className="py-4">{u.role}</td>
                <td className="py-4">
                  <button onClick={() => handleDeleteUser(u.id)} className="bg-red-500 text-white px-2 py-1 rounded text-[10px] font-black">SUPPRIMER</button>
                </td>
              </tr>
            ))}</tbody></table></div>
          </div>
        )}

        {showTaxes && (
          <div className="mb-10 bg-white rounded-3xl shadow-sm border p-6">
            <h2 className="text-xl font-bold mb-6 uppercase tracking-tight">Gestion des Taxes</h2>
            <button onClick={() => {
              const n = prompt("Nom:"); const r = prompt("Taux (ex: 0.16):");
              if (n && r) handleAddTax({ name: n, rate: parseFloat(r), type: 'percentage' });
            }} className="bg-orange-600 text-white px-4 py-2 rounded mb-4 text-xs font-bold uppercase">Ajouter Taxe</button>
            <div className="overflow-x-auto"><table className="w-full text-left"><thead className="text-gray-300 text-[10px] font-black uppercase border-b"><tr><th>Taxe</th><th>Taux</th><th>Action</th></tr></thead><tbody className="divide-y divide-gray-50">{taxes.map(t => (
              <tr key={t.id}><td className="py-4 font-bold">{t.name}</td><td className="py-4 font-black">{t.rate*100}%</td><td className="py-4">
                <button onClick={() => handleDeleteTax(t.id)} className="bg-red-500 text-white px-2 py-1 rounded text-[10px] font-black">SUPPRIMER</button>
              </td></tr>
            ))}</tbody></table></div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatCard title="Articles" value={stats.totalProducts} icon="📦" color="text-blue-500" />
          <StatCard title="Revenus" value={`$${stats.totalRevenue.toFixed(2)}`} icon="💰" color="text-emerald-500" />
          <StatCard title="Dépenses" value={`$${stats.totalExpenses.toFixed(2)}`} icon="📉" color="text-red-500" isNegative />
          <div className="bg-gray-900 p-6 rounded-xl shadow-xl text-white">
            <p className="text-gray-400 text-[10px] font-black uppercase mb-1 tracking-widest">Bénéfice Net</p>
            <p className="text-2xl font-black text-blue-400">${(stats.totalRevenue - stats.totalExpenses).toFixed(2)}</p>
          </div>
        </div>

        {currentUser.role === 'administrator' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
            <div className="bg-white p-6 rounded-3xl shadow-sm border"><h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Flux Revenus ($)</h2>
              <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={analyticsData.revenueChart}><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 10}} /><Tooltip /><Bar dataKey="total" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={30} /></BarChart></ResponsiveContainer></div>
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-sm border"><h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Top Ventes</h2>
              <div className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={analyticsData.topProducts} innerRadius={60} outerRadius={80} dataKey="ventes">{analyticsData.topProducts.map((_, i) => (<Cell key={i} fill={['#3b82f6', '#10b981', '#f59e0b', '#6366f1'][i % 4]} />))}</Pie><Tooltip /></PieChart></ResponsiveContainer></div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 bg-white rounded-3xl shadow-sm border p-6">
            <h2 className="text-xl font-bold mb-6 uppercase tracking-tight italic text-slate-800">Activités Récentes</h2>
            <div className="overflow-x-auto text-sm"><table className="w-full text-left"><thead className="text-gray-300 text-[10px] font-black uppercase border-b pb-4"><tr><th>Client</th><th>Montant</th><th>Type</th><th className="text-right">Action</th></tr></thead><tbody className="divide-y divide-gray-50">{recentOrders.slice(0, 8).map((order) => (
              <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                <td className="py-4 font-bold text-slate-700 uppercase text-[10px]">{order.customerName || 'Passant'}</td>
                <td className="py-4 font-black text-slate-900">${order.total.toFixed(2)}</td>
                <td className="py-4"><span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${order.txid === 'CASH_PAYMENT' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>{order.txid === 'CASH_PAYMENT' ? 'CASH' : 'PI'}</span></td>
                <td className="py-4 text-right"><button onClick={() => handlePrintReceipt(order)} className="bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all">📄 Reçu</button></td>
              </tr>
            ))}</tbody></table></div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold uppercase tracking-tight italic">Stock DKS</h2>
              <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white p-2 rounded-xl text-xs font-black">➕</button>
            </div>
            <div className="grid grid-cols-1 gap-4 max-h-[400px] overflow-y-auto">
              {products.map(product => (
                <div key={product.id} className="flex gap-4 items-center p-3 bg-gray-50 rounded-2xl border border-transparent hover:border-blue-200 transition-all">
                  <img 
                    src={product.image?.startsWith('http') ? product.image : `${API_SERVER_URL}${product.image}`} 
                    alt="" className="w-12 h-12 rounded-xl object-cover bg-gray-200"
                    onError={(e) => { e.target.src = 'https://placehold.co/100x100?text=DKS'; }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black text-gray-800 uppercase truncate leading-tight">{product.name}</p>
                    <p className="text-[10px] text-blue-600 font-black mt-1">{product.price} $</p>
                  </div>
                  <div className="text-right"><span className={`text-[10px] font-black ${product.stock < 5 ? 'text-red-500 animate-pulse' : 'text-gray-500'}`}>{product.stock} pcs</span></div>
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