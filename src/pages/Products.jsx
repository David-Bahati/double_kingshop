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

  // NOUVELLE FONCTION : Publier / Masquer
  const handleTogglePublish = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 1 ? 0 : 1;
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/products/${id}/publish`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: newStatus })
      });
      if (response.ok) {
        loadData(); // Rafraîchir pour voir le changement de badge
      }
    } catch (err) {
      alert("Erreur lors de la modification du statut");
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('name', formData.name);
    data.append('price', formData.price);
    data.append('stock', formData.stock);
    data.append('category', formData.category);
    data.append('description', formData.description);
    if (selectedFile) data.append('image', selectedFile);

    try {
      await apiService.addProduct(data);
      setShowModal(false);
      setFormData({ name: '', price: '', stock: '', category: '', description: '' });
      setSelectedFile(null);
      loadData();
    } catch (err) {
      alert("Erreur lors de l'ajout du produit");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Voulez-vous vraiment supprimer ce produit ?")) {
      try {
        await apiService.deleteProduct(id);
        loadData();
      } catch (err) {
        alert("Erreur de suppression");
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Catalogue Double King</h1>
            <p className="text-sm text-slate-500">Bunia • Gestion de stock et publication Home.</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setShowModal(true)}
              className="inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition shadow-lg"
            >
              + Ajouter un produit
            </button>
            <Link to="/admin/dashboard" className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm">
              ← Retour
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="rounded-3xl bg-white p-8 text-center shadow-sm">Chargement...</div>
        ) : error ? (
          <div className="rounded-3xl bg-white p-8 text-center text-red-600 shadow-sm">{error}</div>
        ) : products.length === 0 ? (
          <div className="rounded-3xl bg-white p-8 text-center shadow-sm">Aucun produit disponible.</div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <div key={product.id} className="relative group bg-white p-4 rounded-[2.5rem] shadow-sm border border-slate-200">
                <ProductCard product={product} />
                
                {/* BARRE D'ACTIONS SOUS LE PRODUIT */}
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                  {/* BOUTON PUBLIER / MASQUER */}
                  <button 
                    onClick={() => handleTogglePublish(product.id, product.published)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-tighter transition-all ${
                      product.published === 1 
                      ? 'bg-green-100 text-green-700 border border-green-200' 
                      : 'bg-slate-100 text-slate-400 border border-slate-200 opacity-60'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${product.published === 1 ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></span>
                    {product.published === 1 ? 'Publié sur Home' : 'Masqué (Brouillon)'}
                  </button>

                  <button 
                    onClick={() => handleDelete(product.id)}
                    className="text-red-400 hover:text-red-600 text-xs font-bold px-2"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL AJOUT (Inchangé mais vérifie les champs) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl overflow-y-auto max-h-[90vh]">
            <h2 className="text-2xl font-bold mb-6 text-slate-800 tracking-tight">Nouveau Produit</h2>
            <form onSubmit={handleAddProduct} className="space-y-4">
              <input 
                type="text" placeholder="Nom du produit" required
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none"
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
              <div className="flex gap-3">
                <input 
                  type="number" placeholder="Prix ($)" required
                  className="w-1/2 p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none"
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                />
                <input 
                  type="number" placeholder="Stock" required
                  className="w-1/2 p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none"
                  onChange={(e) => setFormData({...formData, stock: e.target.value})}
                />
              </div>
              <select 
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none"
                required
                onChange={(e) => setFormData({...formData, category: e.target.value})}
              >
                <option value="">Catégorie...</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
              <div className="p-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
                <input 
                  type="file" accept="image/*" 
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  className="w-full text-xs text-slate-500"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-blue-600 text-white p-4 rounded-2xl font-bold shadow-lg">Enregistrer</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-slate-100 text-slate-600 p-4 rounded-2xl font-bold">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
