import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/Product/ProductCard';
import apiService from '../services/api';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '', price: '', stock: '', category: '', description: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);

  // Vérification du rôle Admin pour la sécurité Double King Shop
  const user = JSON.parse(localStorage.getItem('user')); 
  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [prodData, catData] = await Promise.all([
        apiService.getProducts(),
        apiService.getCategories()
      ]);
      setProducts(prodData || []);
      setCategories(catData || []);
    } catch (err) {
      console.error('Erreur DKS:', err);
      setError('Impossible de charger les données.');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublish = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 1 ? 0 : 1;
      
      const response = await fetch(`${window.location.origin}/api/products/${id}/publish`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: newStatus })
      });

      if (response.ok) {
        // Mise à jour instantanée de la liste après publication
        await loadData();
      } else {
        alert("Erreur lors de la modification du statut");
      }
    } catch (err) {
      console.error("Erreur publication:", err);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('name', formData.name);
    data.append('price', formData.price);
    data.append('stock', formData.stock);
    data.append('category', formData.category);
    data.append('description', formData.description || 'Produit Double King Shop');
    if (selectedFile) data.append('image', selectedFile);

    try {
      await apiService.addProduct(data);
      setShowModal(false);
      setFormData({ name: '', price: '', stock: '', category: '', description: '' });
      setSelectedFile(null);
      await loadData(); // Recharge la liste pour voir le nouveau produit
    } catch (err) {
      alert("Erreur lors de l'ajout du produit");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Supprimer définitivement cet article du stock ?")) {
      try {
        await apiService.deleteProduct(id);
        loadData();
      } catch (err) {
        alert("Erreur de suppression");
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 text-slate-900">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-tighter uppercase italic">Catalogue DKS</h1>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Bunia • Gestion de stock</p>
          </div>
          <div className="flex gap-3">
            {isAdmin && (
              <button 
                onClick={() => setShowModal(true)}
                className="bg-blue-600 px-6 py-3 rounded-full font-black text-white shadow-xl hover:bg-blue-700 active:scale-95 transition-all text-xs uppercase"
              >
                + Ajouter un produit
              </button>
            )}
            <Link to="/admin/dashboard" className="bg-white border-2 border-slate-200 px-4 py-3 rounded-full font-bold text-slate-700 text-xs uppercase">
              Retour
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="p-20 text-center font-black text-slate-300 animate-pulse uppercase tracking-[0.3em]">Chargement...</div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <div key={product.id} className="flex flex-col">
                {/* Visualisation du produit (Image, GCV Pi, Prix USD) */}
                <ProductCard product={product} />
                
                {/* Barre d'administration sécurisée sous chaque produit */}
                <div className="mt-4 bg-white p-4 rounded-[2rem] border border-slate-200 shadow-sm flex items-center justify-between">
                  {isAdmin ? (
                    <button 
                      onClick={() => handleTogglePublish(product.id, product.published)}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${
                        product.published === 1 
                        ? 'bg-green-100 text-green-700 border border-green-200' 
                        : 'bg-slate-100 text-slate-400 border border-slate-200'
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full ${product.published === 1 ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></div>
                      {product.published === 1 ? '● Publié' : '○ Masqué'}
                    </button>
                  ) : (
                    <span className="text-[10px] font-black uppercase text-slate-400 px-2">
                      Statut: {product.published === 1 ? 'En ligne' : 'Brouillon'}
                    </span>
                  )}

                  {isAdmin && (
                    <button 
                      onClick={() => handleDelete(product.id)}
                      className="text-red-500 hover:text-red-700 font-black text-[10px] uppercase px-2"
                    >
                      Supprimer
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal d'ajout de produit (Reste identique mais avec texte noir forcé) */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-black text-slate-900 mb-6 uppercase italic">Nouveau Produit</h2>
            <form onSubmit={handleAddProduct} className="space-y-4">
              <input 
                type="text" placeholder="Nom de l'article" required
                className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl outline-none text-slate-900 font-bold focus:border-blue-500"
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
              <div className="flex gap-3">
                <input 
                  type="number" placeholder="Prix USD" required
                  className="w-1/2 p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl outline-none text-slate-900 font-bold focus:border-blue-500"
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                />
                <input 
                  type="number" placeholder="Stock" required
                  className="w-1/2 p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl outline-none text-slate-900 font-bold focus:border-blue-500"
                  onChange={(e) => setFormData({...formData, stock: e.target.value})}
                />
              </div>
              <select 
                className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl outline-none text-slate-900 font-bold focus:border-blue-500"
                required
                onChange={(e) => setFormData({...formData, category: e.target.value})}
              >
                <option value="">Sélectionner catégorie</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name.toUpperCase()}</option>
                ))}
              </select>
              <div className="p-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
                <input 
                  type="file" accept="image/*" 
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  className="w-full text-xs text-slate-500 font-bold"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-blue-600 text-white p-4 rounded-2xl font-black shadow-lg">Enregistrer</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-slate-100 text-slate-500 p-4 rounded-2xl font-bold">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
