import React, { useState } from 'react';

// Ajout de "categories" dans les props pour recevoir ta liste de Bunia
const AddProductModal = ({ isOpen, onClose, onAdd, categories = [] }) => {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    stock: '',
    category: 'Accessoires',
    description: '',
    image: null
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Utilisation de FormData car ton serveur utilise multer
    const data = new FormData();
    data.append('name', formData.name);
    data.append('price', formData.price);
    data.append('stock', formData.stock);
    data.append('category', formData.category);
    data.append('description', formData.description || 'Matériel Double King Shop');
    
    if (formData.image) {
      data.append('image', formData.image);
    }

    try {
      await onAdd(data); // Envoie le FormData vers l'API
      onClose();
      // Reset du formulaire
      setFormData({ name: '', price: '', stock: '', category: 'Accessoires', description: '', image: null });
    } catch (error) {
      alert("Erreur DKS : " + error.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slideUp">
        <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
          <h2 className="text-xl font-bold">Nouveau Matériel DKS</h2>
          <button onClick={onClose} className="text-2xl hover:rotate-90 transition-transform">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nom du produit</label>
            <input
              required
              className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 font-medium"
              placeholder="ex: Souris Gamer RGB"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Prix ($ USD)</label>
              <input
                required
                type="number"
                step="0.01"
                className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 font-medium"
                placeholder="0.00"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Stock Initial</label>
              <input
                required
                type="number"
                className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 font-medium"
                placeholder="Quantité"
                value={formData.stock}
                onChange={(e) => setFormData({...formData, stock: e.target.value})}
              />
            </div>
          </div>

          {/* NOUVEAU : Sélection de la catégorie dynamique */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Catégorie</label>
            <select
              className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 font-medium"
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* AJOUT : Champ pour l'image */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Image du produit</label>
            <input
              type="file"
              accept="image/*"
              className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              onChange={(e) => setFormData({...formData, image: e.target.files[0]})}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-95 mt-2"
          >
            Enregistrer dans le Stock
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddProductModal;
