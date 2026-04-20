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

  const handleTogglePublish = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 1 ? 0 : 1;
      // Utilise fetch sur le endpoint relatif pour éviter les erreurs d'URL Railway
      const response = await fetch(`/api/products/${id}/publish`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: newStatus })
      });
      if (response.ok) {
        loadData();
      }
    } catch (err) {
      alert("Erreur de modification du statut");
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    
    // Vérification de la catégorie avant d'envoyer
    if (!formData.category) {
        alert("Veuillez choisir une catégorie");
        return;
    }

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
      // Reset complet
      setFormData({ name: '', price: '', stock: '', category: '', description: '' });
      setSelectedFile(null);
      loadData();
    } catch (err) {
      // Affiche l'erreur réelle pour débugger à Bunia
      alert("Détail Erreur : " + err.message);
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
            <p className="text-sm text-slate-500">Bunia • Gestion de stock</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setShowModal(true)}
              className="bg-blue-600 px-6 py-3 rounded-full font-bold text-white shadow-lg hover:bg-blue-700 transition-all"
            >
              + Ajouter un produit
            </button>
            <Link to="/admin/dashboard" className="bg-white border border-slate-300 px-4 py-3 rounded-full font-bold text-slate-700 shadow-sm">
              ← Retour
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-slate-500 font-bold">Chargement du stock...</div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <div key={product.id} className="bg-white p-4 rounded-[2.5rem] shadow-md border border-slate-200">
                <ProductCard product={product} />
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <button 
                    onClick={() => handleTogglePublish(product.id, product.published)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase transition-all ${
                      product.published === 1 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {product.published === 1 ? '● Publié' : '○ Masqué'}
                  </button>
                  <button onClick={() => handleDelete(product.id)} className="text-red-500 font-bold text-xs">Supprimer</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL AVEC TEXTE BIEN VISIBLE */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-black text-slate-900 mb-6 uppercase tracking-tighter">Nouveau Produit</h2>
            <form onSubmit={handleAddProduct} className="space-y-4">
              <input 
                type="text" placeholder="Nom du produit" required
                className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl outline-none text-slate-900 font-bold placeholder:text-slate-400 focus:border-blue-500"
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
              <div className="flex gap-3">
                <input 
                  type="number" placeholder="Prix ($)" required
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
                <option value="">-- Choisir Catégorie --</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.name} className="text-slate-900">{cat.name}</option>
                ))}
              </select>
              <div className="p-4 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Photo du produit</p>
                <input 
                  type="file" accept="image/*" 
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  className="w-full text-xs text-slate-600 font-bold"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-blue-600 text-white p-4 rounded-2xl font-bold shadow-xl active:scale-95 transition-all">ENREGISTRER</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-slate-100 text-slate-600 p-4 rounded-2xl font-bold">ANNULER</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
