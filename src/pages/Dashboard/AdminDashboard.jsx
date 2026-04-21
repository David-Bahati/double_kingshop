import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Eye, EyeOff, Edit2, Trash2, Plus, Search, 
  TrendingUp, Package, Users, Receipt, DollarSign,
  BarChart3, PieChart, Filter, AlertCircle 
} from 'lucide-react';
import apiService from '../../services/api';
import Sidebar from '../../components/Layout/Sidebar';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart as RechartsPieChart, Pie } from 'recharts';
import CashRegister from '../../components/POS/CashRegister';
import { useNotification } from '../../context/NotificationContext';

// URL Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:3001/api';
const API_SERVER_URL = API_BASE_URL.replace(/\/api$/, '') || 'http://localhost:3001';

// --- COMPOSANT : MODAL MODERNE (AJOUT/MODIFICATION) ---
const ProductModal = ({ isOpen, onClose, onSave, product = null, mode = 'add' }) => {
  const [formData, setFormData] = useState({
    name: '', price: '', stock: '', category: '', description: '', image: '', published: false
  });
  const [imageFile, setImageFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    if (isOpen) {
      if (product && mode === 'edit') {
        setFormData({
          name: product.name || '',
          price: product.price?.toString() || '',
          stock: product.stock?.toString() || '',
          category: product.category || '',
          description: product.description || '',
          image: product.image || '',
          published: product.published || false
        });
      } else {
        setFormData({ name: '', price: '', stock: '', category: '', description: '', image: '', published: false });
      }
      setImageFile(null);
    }
  }, [product, mode, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.category?.trim()) {      showError('La catégorie est obligatoire');
      return;
    }
    setIsSubmitting(true);
    try {
      let payload;
      if (imageFile) {
        payload = new FormData();
        payload.append('name', formData.name);
        payload.append('price', formData.price);
        payload.append('stock', formData.stock);
        payload.append('category', formData.category);
        payload.append('description', formData.description || '');
        payload.append('published', formData.published);
        payload.append('image', imageFile);
      } else {
        payload = { ...formData, price: parseFloat(formData.price), stock: parseInt(formData.stock, 10) };
      }
      await onSave(payload, mode, product?.id);
      onClose();
    } catch (err) {
      showError('Erreur lors de l\'opération');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 transition-all">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all scale-100">
        
        {/* Header Modal */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {mode === 'add' ? 'Nouveau Produit' : 'Modifier le Produit'}
            </h2>
            <p className="text-sm text-slate-500 mt-1">Remplissez les informations du produit</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            ✕
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          
          {/* Upload Image */}
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 hover:border-blue-300 transition-all group">              {imageFile ? (
                <div className="flex flex-col items-center">
                  <span className="text-blue-600 font-medium">{imageFile.name}</span>
                  <span className="text-xs text-slate-500">Image sélectionnée</span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Package className="w-8 h-8 mb-2 text-slate-400 group-hover:text-blue-500 transition-colors" />
                  <p className="text-xs text-slate-500 font-medium">Cliquez pour uploader une image</p>
                  {formData.image && <p className="text-[10px] text-green-600 mt-1">Image actuelle conservée</p>}
                </div>
              )}
              <input type="file" className="hidden" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} disabled={isSubmitting} />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Nom du produit</label>
              <input 
                required 
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="Ex: MacBook Pro M2"
                value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} disabled={isSubmitting}
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Prix ($)</label>
              <input 
                required type="number" step="0.01" min="0"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="0.00" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} disabled={isSubmitting}
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Stock</label>
              <input 
                required type="number" min="0"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="0" value={formData.stock} onChange={(e) => setFormData({...formData, stock: e.target.value})} disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Catégorie Obligatoire */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5 flex items-center gap-2">
              Catégorie <span className="text-red-500 text-[10px] font-normal bg-red-50 px-2 py-0.5 rounded-full">Obligatoire</span>            </label>
            <select
              required
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
              disabled={isSubmitting}
            >
              <option value="">-- Sélectionner une catégorie --</option>
              <option value="Laptop">💻 Laptop</option>
              <option value="Accessoire">🔌 Accessoire</option>
              <option value="Périphérique">🖱️ Périphérique</option>
              <option value="Composant">⚙️ Composant</option>
              <option value="Réseau">📡 Réseau</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Description</label>
            <textarea 
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none h-20"
              placeholder="Brève description..." value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} disabled={isSubmitting}
            />
          </div>

          {/* Toggle Publication */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${formData.published ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                {formData.published ? <Eye size={18} /> : <EyeOff size={18} />}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">{formData.published ? 'Publié (Visible)' : 'Brouillon (Masqué)'}</p>
                <p className="text-[10px] text-slate-500">{formData.published ? 'Affiché sur le catalogue public' : 'Invisible pour les clients'}</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={formData.published} onChange={(e) => setFormData({...formData, published: e.target.checked})} disabled={isSubmitting} />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors" disabled={isSubmitting}>
              Annuler
            </button>
            <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70">
              {isSubmitting ? 'Enregistrement...' : (mode === 'add' ? 'Enregistrer' : 'Mettre à jour')}
            </button>
          </div>        </form>
      </div>
    </div>
  );
};

// --- DASHBOARD PRINCIPAL ---
const AdminDashboard = () => {
  // États
  const [stats, setStats] = useState({ totalProducts: 0, publishedProducts: 0, draftProducts: 0, totalOrders: 0, totalRevenue: 0, totalExpenses: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [taxes, setTaxes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // UI States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [editingProduct, setEditingProduct] = useState(null);
  const [productFilter, setProductFilter] = useState('all'); // 'all', 'published', 'draft'
  
  // Modules
  const [showPOS, setShowPOS] = useState(false);
  const [showExpenses, setShowExpenses] = useState(false);
  const [showUsers, setShowUsers] = useState(false);
  const [showTaxes, setShowTaxes] = useState(false);
  
  const [currentUser, setCurrentUser] = useState(JSON.parse(localStorage.getItem('dks_user')) || { role: 'vendeur' });
  const navigate = useNavigate();
  const { addNotification, showSuccess, showError } = useNotification();

  const isAdmin = currentUser?.role === 'administrator' || currentUser?.role === 'admin';

  useEffect(() => { fetchDashboardData(); }, []);

  // Vérification commandes (Polling)
  useEffect(() => {
    const checkNewOrders = async () => {
      try {
        const newOrders = await apiService.request('/orders');
        const newOrderCount = newOrders.length;
        const previousCount = localStorage.getItem('dks-order-count') || 0;
        if (newOrderCount > previousCount && previousCount > 0) {
          addNotification(`🆕 ${newOrderCount - previousCount} nouvelle(s) commande(s) !`, 'success');
        }
        localStorage.setItem('dks-order-count', newOrderCount);
      } catch (error) { console.error('Polling error', error); }
    };
    const interval = setInterval(checkNewOrders, 30000);    return () => clearInterval(interval);
  }, [addNotification]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [prods, orders, expensesData, usersData, taxesData] = await Promise.all([
        apiService.request('/products') || [], 
        apiService.request('/orders') || [], 
        apiService.request('/expenses') || [],
        apiService.request('/users') || [],
        apiService.request('/taxes') || []
      ]);
      
      const rev = orders.reduce((sum, order) => sum + (order.total || 0), 0);
      const exp = expensesData.reduce((sum, e) => sum + (e.amount || 0), 0);
      const published = prods.filter(p => p.published).length;

      setProducts(prods);
      setUsers(usersData);
      setTaxes(taxesData);
      setStats({
        totalProducts: prods.length,
        publishedProducts: published,
        draftProducts: prods.length - published,
        totalOrders: orders.length,
        totalRevenue: rev,
        totalExpenses: exp
      });
      setRecentOrders(orders);
    } catch (error) {
      showError('Erreur chargement données');
    } finally { setLoading(false); }
  };

  // --- Logique Produits ---
  const filteredProducts = useMemo(() => {
    if (productFilter === 'published') return products.filter(p => p.published);
    if (productFilter === 'draft') return products.filter(p => !p.published);
    return products;
  }, [products, productFilter]);

  const handleSaveProduct = async (payload, mode, productId) => {
    try {
      let res;
      if (mode === 'add') res = await apiService.addProduct(payload);
      else res = await apiService.updateProduct(productId, payload);
      
      setProducts(prev => mode === 'add' ? [res, ...prev] : prev.map(p => p.id === productId ? res : p));
      await fetchDashboardData();      showSuccess('Produit enregistré avec succès');
    } catch (err) {
      showError('Échec de l\'opération');
      throw err;
    }
  };

  const handleTogglePublish = async (product) => {
    try {
      const updated = await apiService.updateProduct(product.id, { ...product, published: !product.published });
      setProducts(prev => prev.map(p => p.id === product.id ? updated : p));
      fetchDashboardData();
    } catch (err) { showError('Erreur publication'); }
  };

  const handleDeleteProduct = async (product) => {
    if (window.confirm(`Supprimer "${product.name}" ?`)) {
      try {
        await apiService.deleteProduct(product.id);
        setProducts(prev => prev.filter(p => p.id !== product.id));
        fetchDashboardData();
        showSuccess('Produit supprimé');
      } catch (err) { showError('Erreur suppression'); }
    }
  };

  // --- Handlers Utilisateurs/Taxes (Simplifiés pour le code) ---
  const handleAddUser = async (u) => { await apiService.request('/users', { method: 'POST', body: JSON.stringify(u) }); fetchDashboardData(); };
  const handleDeleteUser = async (id) => { await apiService.request(`/users/${id}`, { method: 'DELETE' }); fetchDashboardData(); };
  const handleAddTax = async (t) => { await apiService.request('/taxes', { method: 'POST', body: JSON.stringify(t) }); fetchDashboardData(); };
  const handleDeleteTax = async (id) => { await apiService.request(`/taxes/${id}`, { method: 'DELETE' }); fetchDashboardData(); };

  const handleLogout = () => {
    localStorage.removeItem('dks_user');
    navigate('/login');
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
      <Sidebar />
      <main className="ml-64 flex-1 p-8">
        
        {/* HEADER DASHBOARD */}
        <header className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Tableau de Bord</h1>
            <p className="text-slate-500 font-medium text-sm mt-1">Bienvenue, <span className="text-blue-600">{currentUser.name}</span></p>
          </div>          <div className="flex items-center gap-3">
             {/* Quick Actions */}
             <button onClick={() => {setShowPOS(!showPOS); setShowExpenses(false); setShowUsers(false);}} className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 transition shadow-sm flex items-center gap-2">
              <Receipt size={14} /> {showPOS ? "Fermer Caisse" : "POS"}
            </button>
            {isAdmin && (
              <button onClick={() => {setShowExpenses(!showExpenses); setShowPOS(false); setShowUsers(false);}} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-50 transition shadow-sm">
                💸 Dépenses
              </button>
            )}
            <button onClick={handleLogout} className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-xl font-bold text-xs hover:bg-red-50 transition shadow-sm">
              Déconnexion
            </button>
          </div>
        </header>

        {/* MODULES OVERLAY (POS, Dépenses, etc.) */}
        {showPOS && <div className="mb-8"><CashRegister products={products} onSaleSuccess={fetchDashboardData} /></div>}
        {showExpenses && <div className="mb-8 p-6 bg-white rounded-2xl border shadow-sm"><h3 className="font-bold text-lg mb-4">Journal des Dépenses</h3><p className="text-slate-500">Contenu à intégrer ici...</p></div>}

        {/* STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Revenus Total</p>
                <h3 className="text-2xl font-black text-slate-900 mt-2">${stats.totalRevenue.toFixed(2)}</h3>
              </div>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><TrendingUp size={20} /></div>
            </div>
            <p className="text-xs text-emerald-600 font-medium mt-4">+{stats.totalOrders} commandes</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dépenses</p>
                <h3 className="text-2xl font-black text-red-600 mt-2">${stats.totalExpenses.toFixed(2)}</h3>
              </div>
              <div className="p-2 bg-red-50 text-red-600 rounded-lg"><DollarSign size={20} /></div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Produits</p>
                <h3 className="text-2xl font-black text-blue-600 mt-2">{stats.totalProducts}</h3>
              </div>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Package size={20} /></div>
            </div>
            <div className="flex gap-3 mt-4 text-[10px] font-bold">
              <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">{stats.publishedProducts} Publiés</span>
              <span className="text-amber-600 bg-amber-50 px-2 py-1 rounded-full">{stats.draftProducts} Brouillons</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg text-white">
             <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bénéfice Net</p>
             <h3 className={`text-2xl font-black mt-2 ${stats.totalRevenue - stats.totalExpenses >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              ${(stats.totalRevenue - stats.totalExpenses).toFixed(2)}
             </h3>
             <p className="text-[10px] text-slate-500 mt-4 uppercase tracking-wider font-bold">Calculé en temps réel</p>
          </div>
        </div>

        {/* PRODUCT MANAGEMENT SECTION */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
          <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2"><Package size={20} className="text-blue-600" /> Gestion du Stock</h2>
              <p className="text-xs text-slate-500 mt-1">Gérez l'inventaire et la visibilité des produits</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Filter Tabs */}
              <div className="flex bg-slate-100 p-1 rounded-lg">
                {['all', 'published', 'draft'].map(f => (
                  <button 
                    key={f} 
                    onClick={() => setProductFilter(f)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${productFilter === f ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    {f === 'all' ? 'Tous' : f === 'published' ? 'Publiés' : 'Brouillons'}
                  </button>
                ))}
              </div>
              {/* Add Button */}
              <button onClick={() => { setEditingProduct(null); setModalMode('add'); setIsModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition shadow-sm hover:shadow-md">
                <Plus size={14} /> Ajouter Produit
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="p-4 font-bold">Produit</th>
                  <th className="p-4 font-bold">Catégorie</th>
                  <th className="p-4 font-bold">Prix</th>
                  <th className="p-4 font-bold text-center">Stock</th>
                  <th className="p-4 font-bold text-center">Statut</th>
                  <th className="p-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img src={p.image?.startsWith('http') ? p.image : `${API_SERVER_URL}${p.image}`} alt="" className="w-10 h-10 rounded-lg object-cover bg-slate-100" />
                        <div>
                          <p className="font-bold text-slate-900">{p.name}</p>
                          <p className="text-xs text-slate-500 truncate max-w-[200px]">{p.description || 'Pas de description'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                        {p.category || 'Non classé'}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-slate-900">${p.price}</td>
                    <td className="p-4 text-center">
                      <span className={`font-bold ${p.stock < 5 ? 'text-red-600' : 'text-slate-600'}`}>{p.stock}</span>
                    </td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => handleTogglePublish(p)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all border ${
                          p.published 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                            : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                        }`}
                      >
                        {p.published ? <><Eye size={12} /> Publié</> : <><EyeOff size={12} /> Brouillon</>}
                      </button>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditingProduct(p); setModalMode('edit'); setIsModalOpen(true); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Modifier"><Edit2 size={16} /></button>
                        <button onClick={() => handleDeleteProduct(p)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition" title="Supprimer"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredProducts.length === 0 && (
                  <tr><td colSpan="6" className="p-12 text-center text-slate-400">Aucun produit trouvé pour ce filtre.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ANALYTICS & RECENT ORDERS GRID */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Charts */}
          <div className="xl:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-6">Flux de Revenus</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={recentOrders.slice(0,7).map(o => ({ day: new Date(o.createdAt).toLocaleDateString('fr-FR', {weekday:'short'}), total: o.total }))}>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#94a3b8'}} />
                  <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '10px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Bar dataKey="total" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Orders List */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-4">Dernières Commandes</h3>
            <div className="space-y-3">
              {recentOrders.slice(0, 5).map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                    <p className="text-xs font-bold text-slate-900">{order.customerName || 'Client Anonyme'}</p>
                    <p className="text-[10px] text-slate-500">{new Date(order.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-slate-900">${order.total.toFixed(2)}</p>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${order.txid === 'CASH_PAYMENT' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                      {order.txid === 'CASH_PAYMENT' ? 'CASH' : 'PI'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </main>

      {/* MODAL GLOBAL */}
      <ProductModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveProduct}
        product={editingProduct}
        mode={modalMode}
      />
    </div>
  );
};

export default AdminDashboard;
    