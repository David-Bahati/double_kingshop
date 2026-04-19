import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  // Si l'utilisateur est déjà connecté, on le redirige directement
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (pin.length < 4) return; // Ne fait rien si le PIN est incomplet

    setError('');
    setLoading(true);

    try {
      const data = await login(pin);

      if (data && data.success) {
        // Redirection vers le dashboard centralisé
        navigate('/admin/dashboard');
      } else {
        setError('Code PIN invalide');
        setPin(''); // Reset le PIN en cas d'échec
      }
    } catch (err) {
      setError('Serveur DKS injoignable ou erreur de connexion');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  const handleNumberClick = (num) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      // Optionnel : déclencher automatiquement la validation à 4 chiffres
      // if (newPin.length === 4) handleSubmit(); 
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 overflow-hidden border border-gray-100">
        
        {/* En-tête DKS */}
        <div className="text-center mb-10">
          <div className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
            <span className="text-white text-2xl font-black italic">DK</span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase italic">Double King</h1>
          <p className="text-gray-400 font-bold text-[10px] tracking-[0.2em] uppercase">Staff Access • Bunia</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs font-bold rounded-r-lg animate-pulse">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="flex flex-col items-center">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
              {loading ? 'Vérification en cours...' : 'Entrez votre code PIN'}
            </label>
            <div className="flex gap-4">
              {[0, 1, 2, 3].map((i) => (
                <div 
                  key={i} 
                  className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                    pin.length > i ? 'bg-blue-600 border-blue-600 scale-125' : 'border-gray-200'
                  }`}
                ></div>
              ))}
            </div>
            {/* Input invisible pour capter le clavier physique/mobile */}
            <input
              type="password"
              pattern="\d*"
              inputMode="numeric"
              maxLength="4"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="opacity-0 absolute h-0 w-0"
              autoFocus
              required
            />
          </div>

          {/* Pavé numérique visuel */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, "C", 0, "OK"].map((btn) => (
              <button
                key={btn}
                type={btn === "OK" ? "submit" : "button"}
                disabled={loading}
                onClick={() => {
                  if (btn === "C") setPin('');
                  else if (btn === "OK") return; // Géré par le submit du form
                  else handleNumberClick(btn);
                }}
                className={`h-14 rounded-2xl font-black text-lg transition-all active:scale-95 disabled:opacity-50 ${
                  btn === "OK" 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 hover:bg-blue-700' 
                    : 'bg-gray-50 text-gray-800 hover:bg-gray-100 border border-gray-100'
                }`}
              >
                {btn}
              </button>
            ))}
          </div>
        </form>

        {/* Pied de page Login */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 transition"
            >
              ← Accueil
            </Link>
            <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Double King Shop Management</span>
          </div>
          
          
        </div>
      </div>
    </div>
  );
};

export default Login;
