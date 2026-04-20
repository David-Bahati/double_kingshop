import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // On garde Link car il est déjà importé
import ProductCard from '../components/Product/ProductCard';
import apiService from '../services/api';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', price: '', stock: '', category: '', description: '' });
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [p, c] = await Promise.all([apiService.getProducts(), apiService.getCategories()]);
      setProducts(p || []);
      setCategories(c || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    if (selectedFile) data.append('image', selectedFile);

    try {
      await apiService.addProduct(data);
      setShowModal(false);
      setFormData({ name: '', price: '', stock: '', category: '', description: '' });
      setSelectedFile(null);
      loadData();
    } catch (err) { alert(err.message); }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Supprimer ce produit ?")) {
      await apiService.deleteProduct(id);
      loadData();
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Catalogue DKS</h1>
            <p className="text-sm text-slate-500">Gestion de stock à Bunia.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-6 py-3 rounded-full font-bold shadow-lg">+ Produit</button>
            
            {/* CORRECTION : Lien vers /admin/categories */}
            <Link to="/admin/categories" className="bg-white border px-6 py-3 rounded-full font-bold shadow-sm flex items-center justify-center">
               Catégories
            </Link>
            
            {/* CORRECTION : Retour vers le dashboard admin au lieu de l'accueil "/" */}
            <Link to="/admin/dashboard" className="bg-white border px-6 py-3 rounded-full font-bold shadow-sm flex items-center justify-center">
               ← Retour
            </Link>
          </div>
        </div>

        {loading ? <p className="text-center">Chargement...</p> : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {products.map(p => (
              <div key={p.id} className="relative group">
                <ProductCard product={p} />
                <button onClick={() => handleDelete(p.id)} className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">✕</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">Nouveau Produit</h2>
            <form onSubmit={handleAddProduct} className="space-y-4">
              <input type="text" placeholder="Nom" required className="w-full p-4 bg-slate-50 border rounded-2xl" onChange={e => setFormData({...formData, name: e.target.value})} />
              <div className="flex gap-2">
                <input type="number" placeholder="Prix ($)" required className="w-1/2 p-4 bg-slate-50 border rounded-2xl" onChange={e => setFormData({...formData, price: e.target.value})} />
                <input type="number" placeholder="Stock" required className="w-1/2 p-4 bg-slate-50 border rounded-2xl" onChange={e => setFormData({...formData, stock: e.target.value})} />
              </div>
              <select required className="w-full p-4 bg-slate-50 border rounded-2xl" onChange={e => setFormData({...formData, category: e.target.value})}>
                <option value="">Choisir Catégorie</option>
                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
              <input type="file" accept="image/*" onChange={e => setSelectedFile(e.target.files[0])} className="w-full text-sm" />
              <div className="flex gap-2 pt-4">
                <button type="submit" className="flex-1 bg-blue-600 text-white p-4 rounded-2xl font-bold">Enregistrer</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-slate-100 p-4 rounded-2xl font-bold">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
