import React, { useState } from 'react';

const AddProductModal = ({ isOpen, onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    stock: '',
    category: 'Accessoires',
    description: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // On convertit les chaînes en nombres pour les calculs
    onAdd({
      ...formData,
      id: Date.now(),
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock)
    });
    onClose();
    setFormData({ name: '', price: '', stock: '', category: 'Accessoires', description: '' });
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
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nom du produit</label>
            <input
              required
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="ex: Souris Gamer RGB"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Prix ($ USD)</label>
              <input
                required
                type="number"
                step="0.01"
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="0.00"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Stock Initial</label>
              <input
                required
                type="number"
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Quantité"
                value={formData.stock}
                onChange={(e) => setFormData({...formData, stock: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Description</label>
            <textarea
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none"
              placeholder="Détails du produit..."
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            ></textarea>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-95"
          >
            Enregistrer dans le Stock
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddProductModal;
