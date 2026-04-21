// src/pages/Login.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader, AlertCircle, Key, ArrowLeft, Sparkles } from 'lucide-react';

const Login = () => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, user } = useAuth();

  // 🎯 Redirection si déjà authentifié
  useEffect(() => {
    if (isAuthenticated && user) {
      // Rediriger vers le dashboard du rôle, ou fallback
      const redirectPath = location.state?.from?.pathname || '/admin/dashboard';
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, user, navigate, location]);

  // 🎯 Gestion du clavier physique
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (loading) return;
      
      // Chiffres 0-9
      if (/^[0-9]$/.test(e.key) && pin.length < 4) {
        e.preventDefault();
        handleNumberClick(e.key);
      }
      // Effacer avec Backspace
      if (e.key === 'Backspace' && pin.length > 0) {
        e.preventDefault();
        setPin(prev => prev.slice(0, -1));
      }
      // Valider avec Entrée
      if (e.key === 'Enter' && pin.length === 4) {
        e.preventDefault();
        handleSubmit();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, loading]);
  // 🎯 Animation de secousse en cas d'erreur
  useEffect(() => {
    if (error) {
      setShake(true);
      const timer = setTimeout(() => setShake(false), 500);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // 🎯 Gestion des clics sur le pavé numérique
  const handleNumberClick = (num) => {
    if (loading || pin.length >= 4) return;
    setPin(prev => prev + num);
    setError('');
  };

  const handleClear = () => {
    if (loading) return;
    setPin('');
    setError('');
  };

  // 🎯 Soumission du formulaire
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    if (pin.length !== 4) {
      setError('Code PIN incomplet');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    setError('');
    setLoading(true);

    try {
      // 🎯 Envoie l'objet { pin: "XXXX" } comme attendu par le backend
      const data = await login({ pin });

      if (data?.success) {
        // Succès : la redirection est gérée par useEffect + AuthContext
        return;
      } else {
        throw new Error(data?.error || 'Authentification échouée');
      }
    } catch (err) {
      console.error('Erreur login:', err);
      setError(err.message || 'Serveur DKS injoignable');      setPin('');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 flex items-center justify-center p-4 font-sans relative overflow-hidden">
      
      {/* 🎨 Décoration d'arrière-plan */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl" />
      </div>

      {/* 📦 Carte de connexion */}
      <div className={`relative bg-white/95 backdrop-blur-xl rounded-[2.5rem] shadow-2xl w-full max-w-md p-8 border border-white/20 transition-transform ${shake ? 'animate-shake' : ''}`}>
        
        {/* 🎨 Header DKS */}
        <div className="text-center mb-8">
          <div className="relative inline-block">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-500/30">
              <span className="text-white text-3xl font-black italic">DK</span>
            </div>
            <Sparkles className="absolute -top-1 -right-1 text-yellow-400" size={20} />
          </div>
          
          <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">
            Double King Shop
          </h1>
          <p className="text-slate-400 font-bold text-[10px] tracking-[0.2em] uppercase mt-1">
            Staff Access • Bunia, Ituri
          </p>
        </div>

        {/* ⚠️ Message d'erreur */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-fadeIn">
            <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
            <p className="text-red-700 text-sm font-medium">{error}</p>
          </div>
        )}

        {/* 🔐 Formulaire PIN */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Indicateurs de saisie */}          <div className="flex flex-col items-center">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              {loading ? (
                <>
                  <Loader className="animate-spin" size={12} /> Vérification...
                </>
              ) : (
                <>
                  <Key size={12} /> Entrez votre code PIN
                </>
              )}
            </label>
            
            <div className="flex gap-3">
              {[0, 1, 2, 3].map((i) => (
                <div 
                  key={i} 
                  className={`w-5 h-5 rounded-full border-2 transition-all duration-200 ${
                    pin.length > i 
                      ? 'bg-blue-600 border-blue-600 scale-110 shadow-md shadow-blue-200' 
                      : 'border-slate-200 bg-slate-50'
                  }`}
                />
              ))}
            </div>
            
            {/* Input invisible pour clavier mobile/physique */}
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={pin}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                setPin(value);
                if (error) setError('');
              }}
              className="absolute opacity-0 pointer-events-none"
              autoFocus
              autoComplete="one-time-code"
              disabled={loading}
            />
          </div>

          {/* 🎮 Pavé numérique */}
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}                type="button"
                onClick={() => handleNumberClick(num)}
                disabled={loading || pin.length >= 4}
                className="h-14 rounded-2xl font-black text-lg text-slate-700 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 border border-slate-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
              >
                {num}
              </button>
            ))}
            
            {/* Ligne du bas : Clear / 0 / Valider */}
            <button
              type="button"
              onClick={handleClear}
              disabled={loading || pin.length === 0}
              className="h-14 rounded-2xl font-black text-sm text-red-600 bg-red-50 hover:bg-red-100 active:bg-red-200 border border-red-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
            >
              C
            </button>
            
            <button
              type="button"
              onClick={() => handleNumberClick(0)}
              disabled={loading || pin.length >= 4}
              className="h-14 rounded-2xl font-black text-lg text-slate-700 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 border border-slate-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
            >
              0
            </button>
            
            <button
              type="submit"
              disabled={loading || pin.length !== 4}
              className="h-14 rounded-2xl font-black text-sm text-white bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 shadow-lg shadow-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex items-center justify-center"
            >
              {loading ? (
                <Loader className="animate-spin" size={20} />
              ) : (
                'OK'
              )}
            </button>
          </div>
        </form>

        {/* 🦶 Footer */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <div className="flex justify-between items-center">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-slate-400 hover:text-blue-600 text-xs font-bold uppercase tracking-wider transition-colors"
            >
              <ArrowLeft size={14} /> Retour boutique            </Link>
            
            <span className="text-[9px] text-slate-300 font-black uppercase tracking-widest">
              DKS Manager v2.1
            </span>
          </div>
        </div>
      </div>

      {/* 🎨 Animation CSS personnalisée */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Login;