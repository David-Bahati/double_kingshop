// src/components/Product/AddProductModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { X, Image as ImageIcon, Eye, EyeOff, AlertCircle, Loader } from 'lucide-react';

const AddProductModal = ({ 
  isOpen, 
  onClose, 
  onAdd, 
  categories = [], 
  product = null, 
  mode = 'add' 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    stock: '',
    category: '',
    description: '',
    published: false
  });
  
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);

  // 🎯 Initialisation du formulaire à l'ouverture
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && product) {
        setFormData({
          name: product.name || '',
          price: product.price?.toString() || '',
          stock: product.stock?.toString() || '',
          category: product.category || '',
          description: product.description || '',
          published: product.published || false
        });
        // Prévisualisation si le produit a déjà une image
        if (product.image) {
          setImagePreview(product.image.startsWith('http') ? product.image : `${window.location.origin}${product.image}`);
        } else {
          setImagePreview(null);
        }
      } else {
        setFormData({ name: '', price: '', stock: '', category: '', description: '', published: false });
        setImagePreview(null);
      }
      setImageFile(null);      setErrors({});
    }
  }, [isOpen, mode, product]);

  //  Nettoyage des URLs blob à la fermeture
  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  // 🎯 Gestion du fichier image
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, image: 'Format invalide. Utilisez JPG, PNG ou WEBP.' }));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, image: 'Fichier trop volumineux. Max 5MB.' }));
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setErrors(prev => { const n = {...prev}; delete n.image; return n; });
    }
  };

  // 🎯 Validation
  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Le nom est requis';
    if (!formData.price || parseFloat(formData.price) <= 0) newErrors.price = 'Prix invalide';
    if (!formData.stock || parseInt(formData.stock) < 0) newErrors.stock = 'Stock invalide';
    if (!formData.category) newErrors.category = 'La catégorie est obligatoire';
    if (imageFile && !imageFile.type.startsWith('image/')) newErrors.image = 'Image invalide';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 🎯 Soumission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    setIsSubmitting(true);
    try {
      const payload = new FormData();      payload.append('name', formData.name.trim());
      payload.append('price', formData.price);
      payload.append('stock', formData.stock);
      payload.append('category', formData.category);
      payload.append('description', formData.description.trim());
      payload.append('published', formData.published);
      
      if (imageFile) {
        payload.append('image', imageFile);
      } else if (mode === 'edit' && product?.image) {
        // Indique au backend de conserver l'image existante
        payload.append('keepExistingImage', 'true');
      }

      await onAdd(payload, mode, product?.id);
    } catch (err) {
      console.error('Erreur soumission:', err);
      // L'erreur est gérée dans Products.jsx via le throw
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (imagePreview?.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-[2rem] w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl animate-slideUp flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-5 text-white flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-lg font-black uppercase tracking-tight">
              {mode === 'add' ? '➕ Nouveau Produit' : '✏️ Modifier le Produit'}
            </h2>
            <p className="text-blue-100 text-xs mt-0.5">
              {mode === 'add' ? 'Ajouter au catalogue DKS' : 'Mettre à jour les informations'}
            </p>          </div>
          <button 
            onClick={handleClose} 
            disabled={isSubmitting}
            className="p-2 hover:bg-white/20 rounded-full transition-colors disabled:opacity-50"
            aria-label="Fermer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Scrollable */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
          
          {/* Erreur globale */}
          {errors.submit && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm animate-pulse">
              <AlertCircle size={16} /> {errors.submit}
            </div>
          )}

          {/* Upload Image */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Image du produit</label>
            <div 
              className={`relative border-2 border-dashed rounded-2xl p-4 text-center transition-all cursor-pointer hover:border-blue-400 ${
                imagePreview ? 'border-blue-300 bg-blue-50/50' : 'border-slate-200 bg-slate-50'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleImageChange} 
                disabled={isSubmitting}
              />
              
              {imagePreview ? (
                <div className="space-y-3">
                  <img src={imagePreview} alt="Preview" className="mx-auto h-28 w-28 object-cover rounded-xl shadow-md" />
                  <p className="text-xs text-slate-600 font-medium truncate max-w-[200px] mx-auto">
                    {imageFile?.name || 'Image actuelle'}
                  </p>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setImageFile(null); setImagePreview(null); }}
                    className="text-xs text-red-600 font-bold hover:underline"
                    disabled={isSubmitting}                  >
                    Supprimer l'image
                  </button>
                </div>
              ) : (
                <div className="py-4">
                  <ImageIcon className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                  <p className="text-xs text-slate-500 font-medium">Cliquez pour uploader</p>
                  <p className="text-[10px] text-slate-400 mt-1">JPG, PNG ou WEBP (max 5MB)</p>
                </div>
              )}
            </div>
            {errors.image && <p className="text-[10px] text-red-500 mt-1 ml-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.image}</p>}
          </div>

          {/* Nom */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Nom <span className="text-red-500">*</span></label>
            <input
              required
              className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm font-medium outline-none transition-all focus:ring-2 ${errors.name ? 'border-red-300 focus:ring-red-200' : 'border-slate-200 focus:ring-blue-200 focus:border-blue-400'}`}
              placeholder="Ex: Clavier Mécanique RGB"
              value={formData.name}
              onChange={(e) => { setFormData({...formData, name: e.target.value}); if(errors.name) setErrors(p => ({...p, name: ''})); }}
              disabled={isSubmitting}
            />
            {errors.name && <p className="text-[10px] text-red-500 mt-1 ml-1">{errors.name}</p>}
          </div>

          {/* Prix & Stock */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Prix ($) <span className="text-red-500">*</span></label>
              <input
                required type="number" step="0.01" min="0"
                className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm font-medium outline-none transition-all focus:ring-2 ${errors.price ? 'border-red-300 focus:ring-red-200' : 'border-slate-200 focus:ring-blue-200'}`}
                placeholder="0.00"
                value={formData.price}
                onChange={(e) => { setFormData({...formData, price: e.target.value}); if(errors.price) setErrors(p => ({...p, price: ''})); }}
                disabled={isSubmitting}
              />
              {errors.price && <p className="text-[10px] text-red-500 mt-1 ml-1">{errors.price}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Stock <span className="text-red-500">*</span></label>
              <input
                required type="number" min="0"
                className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm font-medium outline-none transition-all focus:ring-2 ${errors.stock ? 'border-red-300 focus:ring-red-200' : 'border-slate-200 focus:ring-blue-200'}`}
                placeholder="0"
                value={formData.stock}                onChange={(e) => { setFormData({...formData, stock: e.target.value}); if(errors.stock) setErrors(p => ({...p, stock: ''})); }}
                disabled={isSubmitting}
              />
              {errors.stock && <p className="text-[10px] text-red-500 mt-1 ml-1">{errors.stock}</p>}
            </div>
          </div>

          {/* Catégorie (Dynamique & Obligatoire) */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5 flex items-center gap-1.5">
              Catégorie <span className="text-[10px] font-normal bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Obligatoire</span>
            </label>
            <select
              required
              value={formData.category}
              onChange={(e) => { setFormData({...formData, category: e.target.value}); if(errors.category) setErrors(p => ({...p, category: ''})); }}
              className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm font-medium outline-none transition-all focus:ring-2 appearance-none cursor-pointer ${errors.category ? 'border-red-300 focus:ring-red-200' : 'border-slate-200 focus:ring-blue-200'}`}
              disabled={isSubmitting || categories.length === 0}
            >
              <option value="">-- Sélectionner --</option>
              {categories.length > 0 ? (
                categories.map(cat => <option key={cat.id || cat.name} value={cat.name}>{cat.name}</option>)
              ) : (
                <option value="" disabled>Aucune catégorie chargée</option>
              )}
            </select>
            {errors.category && <p className="text-[10px] text-red-500 mt-1 ml-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.category}</p>}
            {categories.length === 0 && mode === 'add' && (
              <p className="text-[10px] text-amber-600 mt-1 ml-1">💡 Créez d'abord des catégories dans l'onglet Catégories</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Description</label>
            <textarea
              rows="3"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none transition-all focus:ring-2 focus:ring-blue-200 resize-none"
              placeholder="Brève description du produit..."
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              disabled={isSubmitting}
            />
          </div>

          {/* Toggle Publication */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg transition-colors ${formData.published ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                {formData.published ? <Eye size={18} /> : <EyeOff size={18} />}              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">{formData.published ? 'Publié (Visible)' : 'Brouillon (Masqué)'}</p>
                <p className="text-[10px] text-slate-500">{formData.published ? 'Affiché sur le catalogue public' : 'Invisible pour les clients'}</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={formData.published} 
                onChange={(e) => setFormData({...formData, published: e.target.checked})} 
                disabled={isSubmitting} 
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2 pb-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader className="animate-spin" size={16} /> Enregistrement...
                </>
              ) : (
                mode === 'add' ? (formData.published ? '🚀 Ajouter & Publier' : '💾 Enregistrer') : '💾 Mettre à jour'
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default AddProductModal;