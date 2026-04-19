import React, { createContext, useState, useContext, useEffect } from 'react';
import apiService from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // 1. État de l'utilisateur (initialisé immédiatement via le stockage local)
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('dks_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // 2. État de chargement (un seul exemplaire pour éviter l'erreur Railway)
  const [loading, setLoading] = useState(false);

  // Normalise les rôles venant du backend
  const normalizeRole = (role) => {
    const r = role?.toLowerCase();
    if (r === 'administrator' || r === 'admin') return 'admin';
    if (r === 'vendeur' || r === 'salesman') return 'salesman';
    if (r === 'caissier' || r === 'cashier') return 'cashier';
    return r;
  };

  // Synchronisation au montage du composant
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

  // Gestion des paiements incomplets pour le SDK Pi
  const onIncompletePaymentFound = (payment) => {
    console.log("Paiement incomplet trouvé :", payment);
  };

  const login = async (pin) => {
    try {
      setLoading(true);
      // Authentification Pi avec le scope 'payments' pour autoriser les ventes
      if (window.Pi) {
        await window.Pi.authenticate(['username', 'payments'], onIncompletePaymentFound);
        console.log("✅ Accès Pi Network et paiements autorisé");
      }

      // Appel à ton serveur Railway
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
