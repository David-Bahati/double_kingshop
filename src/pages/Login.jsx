import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [pin, setPin] = useState(''); // On passe de l'email au PIN
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Appel à la route /api/auth/login qu'on a ajoutée au backend
      const data = await login(pin);

      if (data.success) {
        // Redirection unique vers le Dashboard (qui s'adaptera selon le rôle)
        navigate('/admin/dashboard');
      }
    } catch (err) {
      setError('Impossible de joindre le serveur DKS');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour ajouter un chiffre (pratique sur mobile)
  const handleNumberClick = (num) => {
    if (pin.length < 4) setPin(pin + num);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 overflow-hidden">
        
        {/* En-tête DKS */}
        <div className="text-center mb-10">
          <div className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
            <span className="text-white text-2xl font-black italic">DK</span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase italic">Double King</h1>
          <p className="text-gray-400 font-bold text-[10px] tracking-[0.2em] uppercase">Staff Access • Bunia</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs font-bold rounded-r-lg animate-shake">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="flex flex-col items-center">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Entrez votre code PIN</label>
            <div className="flex gap-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${pin.length > i ? 'bg-blue-600 border-blue-600 scale-125' : 'border-gray-200'}`}></div>
              ))}
            </div>
            {/* Input caché pour le focus clavier mais permet la saisie mobile */}
            <input
              type="password"
              maxLength="4"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="opacity-0 absolute h-0 w-0"
              autoFocus
              required
            />
          </div>

          {/* Pavé numérique visuel (parfait pour ton Pixel 8) */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, "C", 0, "OK"].map((btn) => (
              <button
                key={btn}
                type={btn === "OK" ? "submit" : "button"}
                onClick={() => {
                  if (btn === "C") setPin('');
                  else if (btn === "OK") return;
                  else handleNumberClick(btn);
                }}
                className={`h-14 rounded-2xl font-black text-lg transition-all active:scale-90 ${
                  btn === "OK" ? 'bg-blue-600 text-white col-span-1 shadow-lg shadow-blue-200' : 'bg-gray-50 text-gray-800 hover:bg-gray-100'
                }`}
              >
                {btn}
              </button>
            ))}
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <div className="flex justify-between text-[9px] font-black text-gray-400 uppercase tracking-widest">
            <span>Admin: 0000</span>
            <span>Vendeur: 1111</span>
            <span>Caissier: 2222</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
