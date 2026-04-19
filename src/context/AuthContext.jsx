import React, { createContext, useState, useContext, useEffect } from 'react';
import apiService from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('dks_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [loading, setLoading] = useState(false);

  const normalizeRole = (role) => {
    const r = role?.toLowerCase();
    if (r === 'administrator' || r === 'admin') return 'admin';
    if (r === 'vendeur' || r === 'salesman') return 'salesman';
    if (r === 'caissier' || r === 'cashier') return 'cashier';
    return r;
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('dks_user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser({
        ...parsedUser,
        role: normalizeRole(parsedUser.role)
      });
    }
  }, []);

  const onIncompletePaymentFound = (payment) => {
    console.log("Paiement incomplet trouvé chez DKS :", payment);
    // Optionnel : tu pourrais envoyer ceci à ton serveur pour finaliser une vente interrompue
  };

  const login = async (pin) => {
    try {
      setLoading(true);

      // --- CORRECTION CRITIQUE ICI ---
      // On demande explicitement 'payments' pour éviter l'erreur "without payments scope"
      if (window.Pi) {
        try {
          await window.Pi.authenticate(['username', 'payments'], onIncompletePaymentFound);
          console.log("✅ Accès Pi Network et scope 'payments' autorisés pour Double King Shop");
        } catch (piErr) {
          console.warn("L'authentification Pi a échoué, vérifiez que vous êtes dans le Pi Browser", piErr);
          // On continue quand même pour permettre le login via PIN si besoin
        }
      }

      const data = await apiService.login({ pin });
      
      if (data && data.success) {
        const normalizedUser = {
          ...data.user,
          role: normalizeRole(data.user.role)
        };
        setUser(normalizedUser);
        localStorage.setItem('dks_user', JSON.stringify(normalizedUser));
        return data;
      }
    } catch (err) {
      console.error("Erreur d'authentification Double King Shop:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('dks_user');
    localStorage.removeItem('token');
    // On force un rechargement pour réinitialiser le SDK Pi si nécessaire
    window.location.href = '/login';
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAdmin: () => user?.role === 'admin',
    isCashier: () => user?.role === 'cashier',
    isSalesman: () => user?.role === 'salesman',
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
  