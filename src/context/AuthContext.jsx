import React, { createContext, useState, useContext, useEffect } from 'react';
import apiService from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
    setLoading(false);
  }, []);

  // Fonction vide pour gérer les paiements incomplets demandée par Pi
  const onIncompletePaymentFound = (payment) => {
    console.log("Paiement incomplet trouvé :", payment);
  };

  const login = async (pin) => {
    try {
      // 1. AUTHENTIFICATION PI NETWORK (AJOUT DU SCOPE PAYMENTS)
      // C'est cette ligne qui corrige l'erreur de scope dans Double King Shop
      if (window.Pi) {
        await window.Pi.authenticate(['username', 'payments'], onIncompletePaymentFound);
        console.log("✅ Pi Scope 'payments' accordé");
      }

      // 2. APPEL AU BACKEND RAILWAY
      const data = await apiService.login({ pin });
      
      if (data.success) {
        const normalizedUser = {
          ...data.user,
          role: normalizeRole(data.user.role)
        };
        setUser(normalizedUser);
        localStorage.setItem('dks_user', JSON.stringify(normalizedUser));
        return data;
      }
    } catch (err) {
      console.error("Erreur Login/Pi:", err);
      throw err;
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
