import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiService from '../services/api';

const Settings = () => {
  const [rates, setRates] = useState({
    usdToCdf: 2850, // Exemple: 1$ = 2850 FC
    usdToPi: 0.0003, // Exemple: 1$ en Pi
    shopName: 'Double King Shop',
    contactPhone: '+243'
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Charger les infos depuis l'env ou une future table settings
    setRates(prev => ({
      ...prev,
      contactPhone: import.meta.env.VITE_CONTACT_PHONE || '+243'
    }));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Logique de sauvegarde API à venir
      await new Promise(resolve => setTimeout(resolve, 800));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      alert("Erreur de sauvegarde");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto rounded-[2.5rem] bg-white p-6 md:p-10 shadow-xl border border-slate-200">
        
        {/* EN-TÊTE REPRIS DE TON CODE */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Paramètres</h1>
            <p className="text-sm text-slate-500">Configuration technique et taux de change.</p>
          </div>
          <Link to="/admin/dashboard" className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-slate-50 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-white transition shadow-sm">
            ← Retour au dashboard
          </Link>
        </div>

        <form onSubmit={handleSave} className="space-y-8">
          
          {/* SECTION TAUX DE CONVERSION (BUNIA SPECIAL) */}
          <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-200">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-blue-600">
              <span className="w-2 h-6 bg-blue-600 rounded-full"></span>
              Taux de Conversion
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase ml-2">1 Dollar (USD) = ? Francs (CDF)</label>
                <div className="relative">
                   <input 
                    type="number" className="w-full p-4 bg-white border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                    value={rates.usdToCdf}
                    onChange={(e) => setRates({...rates, usdToCdf: e.target.value})}
                  />
                  <span className="absolute right-4 top-4 font-bold text-slate-300">FC</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase ml-2">1 Dollar (USD) = ? Pi</label>
                <div className="relative">
                  <input 
                    type="number" step="0.000001" className="w-full p-4 bg-white border rounded-2xl outline-none focus:ring-2 focus:ring-purple-500 font-bold"
                    value={rates.usdToPi}
                    onChange={(e) => setRates({...rates, usdToPi: e.target.value})}
                  />
                  <span className="absolute right-4 top-4 font-bold text-purple-300">π</span>
                </div>
              </div>
            </div>
            <p className="mt-4 text-[10px] text-slate-400 italic">Ces taux seront utilisés pour calculer automatiquement les prix lors du checkout.</p>
          </div>

          {/* CONFIGURATION BOUTIQUE */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase ml-2">Nom du Shop</label>
              <input 
                type="text" className="w-full p-4 bg-slate-50 border rounded-2xl outline-none"
                value={rates.shopName}
                onChange={(e) => setRates({...rates, shopName: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase ml-2">Contact WhatsApp</label>
              <input 
                type="text" className="w-full p-4 bg-slate-50 border rounded-2xl outline-none"
                value={rates.contactPhone}
                onChange={(e) => setRates({...rates, contactPhone: e.target.value})}
              />
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-100">
            <div className="text-sm font-bold">
               {success && <span className="text-green-600 flex items-center gap-2">✅ Mise à jour réussie à Bunia</span>}
            </div>
            <button 
              type="submit" disabled={loading}
              className="w-full md:w-auto bg-slate-900 text-white px-12 py-4 rounded-2xl font-bold shadow-xl hover:bg-black transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Enregistrement...' : 'Sauvegarder les réglages'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default Settings;
