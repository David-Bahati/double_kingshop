import React, { useState, useEffect } from 'react';
import { X, Image as ImageIcon, Eye, EyeOff, AlertCircle } from 'lucide-react';

const AddProductModal = ({ 
  isOpen, 
  onClose, 
  onAdd, 
  categories = [], 
  product = null,  // Pour le mode édition
  mode = 'add'     // 'add' ou 'edit'
}) => {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    stock: '',
    category: '',
    description: '',
    image: null,
    published: false  // 🎯 Nouveau champ
  });
  
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // 🎯 Initialisation du formulaire (Ajout ou Édition)
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && product) {
        // Mode Édition : pré-remplir avec les données existantes
        setFormData({
          name: product.name || '',
          price: product.price?.toString() || '',
          stock: product.stock?.toString() || '',
          category: product.category || '',
          description: product.description || '',
          image: null, // On ne pré-remplit pas l'image (on garde l'existante si pas de nouveau upload)
          published: product.published || false
        });
        // Preview si le produit a déjà une image URL
        if (product.image) {
          setImagePreview(product.image.startsWith('http') ? product.image : `http://localhost:3001${product.image}`);
        }
      } else {
        // Mode Ajout : formulaire vide
        setFormData({
          name: '', price: '', stock: '', category: '', description: '', image: null, published: false
        });
        setImagePreview(null);
      }      setErrors({});
    }
  }, [isOpen, mode, product]);

  // 🎯 Gestion de la preview d'image
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file }));
      // Créer une URL locale pour la preview
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  // 🎯 Validation du formulaire
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = 'Le nom est requis';
    if (!formData.price || parseFloat(formData.price) <= 0) newErrors.price = 'Prix invalide';
    if (!formData.stock || parseInt(formData.stock) < 0) newErrors.stock = 'Stock invalide';
    
    // ⚠️ Catégorie OBLIGATOIRE
    if (!formData.category) {
      newErrors.category = 'Veuillez sélectionner une catégorie';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 🎯 Soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);

    try {
      // 🎯 Utilisation de FormData pour supporter l'upload d'image (multer)
      const data = new FormData();
      data.append('name', formData.name.trim());
      data.append('price', formData.price);
      data.append('stock', formData.stock);
      data.append('category', formData.category);
      data.append('description', formData.description.trim() || 'Matériel Double King Shop');
      data.append('published', formData.published); // 🎯 Inclure le statut de publication
            if (formData.image) {
        data.append('image', formData.image);
      }
      // Si mode édition et pas de nouvelle image, on peut envoyer l'URL existante en JSON supplémentaire
      if (mode === 'edit' && !formData.image && product?.image) {
        data.append('existingImage', product.image);
      }

      await onAdd(data, mode, product?.id); // 🎯 Passer mode et id pour différencier ajout/modif
      
      onClose();
      
    } catch (error) {
      console.error('Erreur produit:', error);
      setErrors({ submit: error.message || 'Erreur lors de l\'enregistrement' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🎯 Fermeture avec nettoyage de la preview
  const handleClose = () => {
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
      
      {/* Overlay cliquable pour fermer */}
      <div className="absolute inset-0" onClick={handleClose} />

      {/* Modal Content */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-slideUp max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-5 text-white flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-lg font-black uppercase tracking-tight">
              {mode === 'add' ? '➕ Nouveau Produit' : '✏️ Modifier le Produit'}
            </h2>
            <p className="text-blue-100 text-xs mt-0.5">
              {mode === 'add' ? 'Ajouter un article au catalogue DKS' : 'Mettre à jour les informations'}
            </p>
          </div>
          <button             onClick={handleClose} 
            disabled={isSubmitting}
            className="p-2 hover:bg-white/20 rounded-full transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Form Area */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          
          {/* Message d'erreur global */}
          {errors.submit && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              <AlertCircle size={16} />
              {errors.submit}
            </div>
          )}

          {/* Nom du produit */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
              Nom du produit <span className="text-red-500">*</span>
            </label>
            <input
              required
              className={`w-full p-3 bg-slate-50 border rounded-xl text-sm font-medium outline-none transition-all focus:ring-2 ${
                errors.name ? 'border-red-300 focus:ring-red-200' : 'border-slate-200 focus:ring-blue-200 focus:border-blue-400'
              }`}
              placeholder="Ex: Clavier Mécanique RGB"
              value={formData.name}
              onChange={(e) => {
                setFormData({...formData, name: e.target.value});
                if (errors.name) setErrors(prev => ({...prev, name: ''}));
              }}
              disabled={isSubmitting}
            />
            {errors.name && <p className="text-[10px] text-red-500 mt-1 ml-1">{errors.name}</p>}
          </div>

          {/* Prix & Stock en grille */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
                Prix ($) <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="number"
                step="0.01"                min="0"
                className={`w-full p-3 bg-slate-50 border rounded-xl text-sm font-medium outline-none transition-all focus:ring-2 ${
                  errors.price ? 'border-red-300 focus:ring-red-200' : 'border-slate-200 focus:ring-blue-200 focus:border-blue-400'
                }`}
                placeholder="0.00"
                value={formData.price}
                onChange={(e) => {
                  setFormData({...formData, price: e.target.value});
                  if (errors.price) setErrors(prev => ({...prev, price: ''}));
                }}
                disabled={isSubmitting}
              />
              {errors.price && <p className="text-[10px] text-red-500 mt-1 ml-1">{errors.price}</p>}
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
                Stock <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="number"
                min="0"
                className={`w-full p-3 bg-slate-50 border rounded-xl text-sm font-medium outline-none transition-all focus:ring-2 ${
                  errors.stock ? 'border-red-300 focus:ring-red-200' : 'border-slate-200 focus:ring-blue-200 focus:border-blue-400'
                }`}
                placeholder="0"
                value={formData.stock}
                onChange={(e) => {
                  setFormData({...formData, stock: e.target.value});
                  if (errors.stock) setErrors(prev => ({...prev, stock: ''}));
                }}
                disabled={isSubmitting}
              />
              {errors.stock && <p className="text-[10px] text-red-500 mt-1 ml-1">{errors.stock}</p>}
            </div>
          </div>

          {/* 🎯 Catégorie Dynamique + Obligatoire */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5 flex items-center gap-1.5">
              Catégorie 
              <span className="text-[10px] font-normal bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Obligatoire</span>
            </label>
            <select
              required
              className={`w-full p-3 bg-slate-50 border rounded-xl text-sm font-medium outline-none transition-all focus:ring-2 appearance-none cursor-pointer ${
                errors.category ? 'border-red-300 focus:ring-red-200' : 'border-slate-200 focus:ring-blue-200 focus:border-blue-400'
              }`}
              value={formData.category}              onChange={(e) => {
                setFormData({...formData, category: e.target.value});
                if (errors.category) setErrors(prev => ({...prev, category: ''}));
              }}
              disabled={isSubmitting || categories.length === 0}
            >
              <option value="">-- Sélectionner une catégorie --</option>
              {categories.length > 0 ? (
                categories.map(cat => (
                  <option key={cat.id || cat.name} value={cat.name}>
                    {cat.name}
                  </option>
                ))
              ) : (
                <option value="Accessoires" disabled>Aucune catégorie disponible</option>
              )}
            </select>
            {errors.category && (
              <p className="text-[10px] text-red-500 mt-1 ml-1 flex items-center gap-1">
                <AlertCircle size={10} /> {errors.category}
              </p>
            )}
            {categories.length === 0 && mode === 'add' && (
              <p className="text-[10px] text-amber-600 mt-1 ml-1">
                💡 Astuce : Créez d'abord des catégories dans l'onglet "Catégories"
              </p>
            )}
          </div>

          {/* 🎯 Upload d'image avec Preview */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
              Image du produit
            </label>
            <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-all ${
              imagePreview ? 'border-blue-300 bg-blue-50' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
            }`}>
              {imagePreview ? (
                <div className="space-y-3">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="mx-auto h-24 w-24 object-cover rounded-lg shadow-sm"
                  />
                  <p className="text-xs text-slate-600 font-medium">
                    {formData.image?.name || 'Image actuelle'}
                  </p>
                  <button
                    type="button"
                    onClick={() => {                      setFormData(prev => ({ ...prev, image: null }));
                      setImagePreview(null);
                    }}
                    className="text-xs text-red-600 font-bold hover:underline"
                    disabled={isSubmitting}
                  >
                    Supprimer l'image
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer block">
                  <ImageIcon className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                  <p className="text-xs text-slate-500 font-medium">
                    Cliquez pour uploader une image
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    PNG, JPG jusqu'à 5MB
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                    disabled={isSubmitting}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
              Description
            </label>
            <textarea
              rows="3"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none transition-all focus:ring-2 focus:ring-blue-200 focus:border-blue-400 resize-none"
              placeholder="Brève description du produit..."
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              disabled={isSubmitting}
            />
          </div>

          {/* 🎯 Toggle Publication (Switch Moderne) */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg transition-colors ${
                formData.published ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'              }`}>
                {formData.published ? <Eye size={18} /> : <EyeOff size={18} />}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">
                  {formData.published ? 'Produit publié' : 'Produit en brouillon'}
                </p>
                <p className="text-[10px] text-slate-500">
                  {formData.published 
                    ? 'Visible sur le catalogue public' 
                    : 'Visible uniquement par l\'administrateur'}
                </p>
              </div>
            </div>
            
            {/* Switch Toggle Style Moderne */}
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={formData.published}
                onChange={(e) => setFormData({...formData, published: e.target.checked})}
                disabled={isSubmitting}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
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
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                  Enregistrement...
                </>
              ) : (
                mode === 'add'                   ? (formData.published ? '🚀 Ajouter & Publier' : '💾 Enregistrer')
                  : '💾 Mettre à jour'
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default AddProductModal;