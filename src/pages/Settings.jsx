// src/pages/Settings.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Save, Loader, AlertCircle, CheckCircle, ArrowLeft, 
  DollarSign, Coins, Store, Phone, RefreshCw, Shield 
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { ROLES } from '../utils/constants';
import apiService from '../services/api';

const Settings = () => {
  const { user, isAuthenticated } = useAuth();
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();
  
  // 🎯 Protection : Rediriger si non-admin
  useEffect(() => {
    if (!isAuthenticated || user?.role !== ROLES.ADMIN) {
      navigate('/login', { replace: true, state: { from: { pathname: '/settings' } } });
    }
  }, [isAuthenticated, user, navigate]);

  // 🎯 États du formulaire
  const [settings, setSettings] = useState({
    usdToCdf: 2850,
    usdToPi: 0.0003,
    shopName: 'Double King Shop',
    contactPhone: '+243',
    shopAddress: 'Avenue du Commerce, Bunia, Ituri',
    currency: 'USD',
    taxRate: 0
  });
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  // 🎯 Chargement des settings depuis localStorage ou API
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        
        // Option 1 : Charger depuis API (si endpoint existe)
        // const data = await apiService.request('/api/settings');
        // if (data) setSettings({ ...settings, ...data });
                // Option 2 : Charger depuis localStorage (fallback)
        const saved = localStorage.getItem('dks_settings');
        if (saved) {
          const parsed = JSON.parse(saved);
          setSettings(prev => ({ ...prev, ...parsed }));
        }
        
        // Option 3 : Charger depuis variables d'environnement
        setSettings(prev => ({
          ...prev,
          contactPhone: import.meta.env?.VITE_CONTACT_PHONE || prev.contactPhone,
          shopName: import.meta.env?.VITE_SHOP_NAME || prev.shopName
        }));
        
      } catch (err) {
        console.error('Erreur chargement settings:', err);
        // Fallback aux valeurs par défaut
      } finally {
        setLoading(false);
      }
    };
    
    if (isAuthenticated && user?.role === ROLES.ADMIN) {
      loadSettings();
    }
  }, [isAuthenticated, user]);

  // 🎯 Gestion des changements de formulaire
  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  // 🎯 Validation des données
  const validateSettings = () => {
    const errors = {};
    
    if (!settings.shopName?.trim()) errors.shopName = 'Le nom de la boutique est requis';
    if (!settings.contactPhone?.trim()) errors.contactPhone = 'Le numéro de contact est requis';
    if (settings.usdToCdf <= 0) errors.usdToCdf = 'Taux invalide';
    if (settings.usdToPi <= 0) errors.usdToPi = 'Taux invalide';
    if (settings.taxRate < 0 || settings.taxRate > 100) errors.taxRate = 'Taux de taxe invalide (0-100%)';
    
    return errors;
  };

  // 🎯 Sauvegarde des paramètres
  const handleSave = async (e) => {
    e.preventDefault();
    
    const errors = validateSettings();    if (Object.keys(errors).length > 0) {
      showError(Object.values(errors)[0]);
      return;
    }
    
    setSaving(true);
    
    try {
      // Option 1 : Sauvegarder via API (si endpoint existe)
      // await apiService.request('/api/settings', {
      //   method: 'PUT',
      //   body: JSON.stringify(settings)
      // });
      
      // Option 2 : Sauvegarder en localStorage (fallback)
      localStorage.setItem('dks_settings', JSON.stringify(settings));
      
      // Mettre à jour les constantes globales si nécessaire
      if (window.DKS_CONFIG) {
        window.DKS_CONFIG = { ...window.DKS_CONFIG, ...settings };
      }
      
      setLastSaved(new Date());
      showSuccess('Paramètres sauvegardés avec succès !');
      
    } catch (err) {
      console.error('Erreur sauvegarde:', err);
      showError('Échec de la sauvegarde. Vérifiez la connexion.');
    } finally {
      setSaving(false);
    }
  };

  // 🎯 Réinitialiser aux valeurs par défaut
  const handleReset = () => {
    if (window.confirm('Réinitialiser tous les paramètres aux valeurs par défaut ?')) {
      const defaults = {
        usdToCdf: 2850,
        usdToPi: 0.0003,
        shopName: 'Double King Shop',
        contactPhone: '+243',
        shopAddress: 'Avenue du Commerce, Bunia, Ituri',
        currency: 'USD',
        taxRate: 0
      };
      setSettings(defaults);
      localStorage.removeItem('dks_settings');
      showSuccess('Paramètres réinitialisés');
    }
  };
  // 🎯 Rendu Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="animate-spin mx-auto mb-4 text-blue-600" size={48} />
          <p className="text-slate-500 font-medium">Chargement des paramètres...</p>
        </div>
      </div>
    );
  }

  // 🎯 Rendu Non autorisé
  if (!isAuthenticated || user?.role !== ROLES.ADMIN) {
    return null; // Redirection gérée par useEffect
  }

  return (
    <div className="min-h-screen bg-slate-50">
      
      {/* 🎯 HEADER */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                to="/admin/dashboard" 
                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition"
                aria-label="Retour au dashboard"
              >
                <ArrowLeft size={20} />
              </Link>
              <div>
                <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                  <Shield size={20} className="text-blue-600" />
                  Paramètres
                </h1>
                <p className="text-sm text-slate-500">Configuration de Double King Shop</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={handleReset}
                disabled={saving}
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition disabled:opacity-50"
              >
                <RefreshCw size={16} /> Réinitialiser
              </button>              <button 
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition shadow-sm disabled:opacity-70"
              >
                {saving ? <Loader className="animate-spin" size={16} /> : <Save size={16} />}
                {saving ? 'Enregistrement...' : 'Sauvegarder'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 🎯 CONTENU PRINCIPAL */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        
        {/* 📊 Carte d'info rapide */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 mb-8 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Dernière sauvegarde</p>
              <p className="text-2xl font-black mt-1">
                {lastSaved 
                  ? lastSaved.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                  : 'Jamais'
                }
              </p>
            </div>
            <div className="text-right">
              <p className="text-blue-100 text-sm font-medium">Utilisateur</p>
              <p className="text-lg font-bold mt-1">{user?.name}</p>
              <p className="text-[10px] text-blue-200 uppercase tracking-wider">{user?.role}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          
          {/* 💱 SECTION TAUX DE CONVERSION */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Coins size={20} className="text-blue-600" />
                Taux de Conversion
              </h2>
              <p className="text-sm text-slate-500 mt-1">Configurez les taux pour les calculs automatiques</p>
            </div>
            
            <div className="p-6 grid gap-6 md:grid-cols-2">
              {/* USD → CDF */}              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-600 uppercase">
                  1 USD = ? CDF (Francs Congolais)
                </label>
                <div className="relative">
                  <DollarSign size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    value={settings.usdToCdf}
                    onChange={(e) => handleChange('usdToCdf', parseFloat(e.target.value) || 0)}
                    className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition"
                    placeholder="2850"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">FC</span>
                </div>
              </div>
              
              {/* USD → Pi */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-600 uppercase">
                  1 USD = ? Pi Network
                </label>
                <div className="relative">
                  <DollarSign size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="number" 
                    step="0.000001"
                    min="0"
                    value={settings.usdToPi}
                    onChange={(e) => handleChange('usdToPi', parseFloat(e.target.value) || 0)}
                    className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-400 transition"
                    placeholder="0.0003"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-purple-400 text-sm font-bold">π</span>
                </div>
              </div>
            </div>
            
            <div className="px-6 pb-6">
              <p className="text-[10px] text-slate-400 italic flex items-center gap-1">
                <AlertCircle size={10} />
                Ces taux sont utilisés pour convertir les prix lors du checkout Pi Network et affichage CDF.
              </p>
            </div>
          </div>

          {/* 🏪 SECTION INFORMATIONS BOUTIQUE */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Store size={20} className="text-blue-600" />
                Informations de la Boutique
              </h2>
              <p className="text-sm text-slate-500 mt-1">Détails affichés aux clients</p>
            </div>
            
            <div className="p-6 grid gap-6 md:grid-cols-2">
              {/* Nom de la boutique */}
              <div className="md:col-span-2 space-y-2">
                <label className="block text-xs font-bold text-slate-600 uppercase">
                  Nom de la boutique
                </label>
                <input 
                  type="text" 
                  value={settings.shopName}
                  onChange={(e) => handleChange('shopName', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 transition"
                  placeholder="Double King Shop"
                  maxLength={100}
                />
              </div>
              
              {/* Adresse */}
              <div className="md:col-span-2 space-y-2">
                <label className="block text-xs font-bold text-slate-600 uppercase">
                  Adresse complète
                </label>
                <textarea 
                  rows="2"
                  value={settings.shopAddress}
                  onChange={(e) => handleChange('shopAddress', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 resize-none transition"
                  placeholder="Avenue du Commerce, Bunia, Ituri"
                  maxLength={200}
                />
              </div>
              
              {/* Contact WhatsApp */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-600 uppercase flex items-center gap-1">
                  <Phone size={12} />
                  Contact WhatsApp
                </label>
                <input 
                  type="tel" 
                  value={settings.contactPhone}
                  onChange={(e) => handleChange('contactPhone', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-green-500 transition"                  placeholder="+243 999 123 456"
                  pattern="^\+?[0-9\s\-()]{8,20}$"
                />
              </div>
              
              {/* Devise principale */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-600 uppercase">
                  Devise d'affichage
                </label>
                <select 
                  value={settings.currency}
                  onChange={(e) => handleChange('currency', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 appearance-none transition"
                >
                  <option value="USD">🇺🇸 Dollar USD ($)</option>
                  <option value="CDF">🇨🇩 Franc Congolais (FC)</option>
                  <option value="PI">🥧 Pi Network (π)</option>
                </select>
              </div>
            </div>
          </div>

          {/* ⚙️ SECTION TAXES & OPTIONS */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Shield size={20} className="text-blue-600" />
                Taxes & Options
              </h2>
              <p className="text-sm text-slate-500 mt-1">Paramètres fiscaux et préférences</p>
            </div>
            
            <div className="p-6 grid gap-6 md:grid-cols-2">
              {/* Taux de taxe */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-600 uppercase">
                  Taux de taxe (%)
                </label>
                <div className="relative">
                  <input 
                    type="number" 
                    step="0.1"
                    min="0"
                    max="100"
                    value={settings.taxRate}
                    onChange={(e) => handleChange('taxRate', parseFloat(e.target.value) || 0)}
                    className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 transition"
                    placeholder="0"
                  />                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">%</span>
                </div>
                <p className="text-[10px] text-slate-400">Appliqué automatiquement au total des commandes</p>
              </div>
              
              {/* Options futures (placeholders) */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-600 uppercase">
                  Options avancées
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition">
                    <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500" disabled />
                    <span className="text-sm text-slate-600">Activer les notifications email</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition">
                    <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500" disabled />
                    <span className="text-sm text-slate-600">Mode maintenance (boutique hors ligne)</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* 🎯 ACTIONS FINALES */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
            <div className="flex items-center gap-2 text-sm">
              {lastSaved && (
                <span className="flex items-center gap-1 text-emerald-600">
                  <CheckCircle size={14} />
                  Sauvegardé à {lastSaved.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
            
            <div className="flex gap-3 w-full sm:w-auto">
              <button 
                type="button"
                onClick={handleReset}
                disabled={saving}
                className="flex-1 sm:flex-none px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition disabled:opacity-50"
              >
                Réinitialiser
              </button>
              <button 
                type="submit"
                disabled={saving}
                className="flex-1 sm:flex-none px-8 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-200 transition disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {saving ? (                  <>
                    <Loader className="animate-spin" size={16} /> Enregistrement...
                  </>
                ) : (
                  <>
                    <Save size={16} /> Sauvegarder
                  </>
                )}
              </button>
            </div>
          </div>

        </form>
      </main>
    </div>
  );
};

export default Settings;