import React, { createContext, useState, useContext, useEffect } from 'react';
import apiService from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  // Vérifie si un membre du staff est déjà connecté au démarrage
  const checkAuth = () => {
    try {
      const storedUser = localStorage.getItem('dks_user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (err) {
      console.error('Erreur de lecture session:', err);
      localStorage.removeItem('dks_user');
    } finally {
      setLoading(false);
    }
  };

  // NOUVELLE FONCTION LOGIN (Par Code PIN)
  const login = async (pin) => {
    try {
      setError(null);
      setLoading(true);
      
      const data = await apiService.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ pin })
      });

      setUser(data.user);
      // On utilise 'dks_user' pour être cohérent avec ton Dashboard
      localStorage.setItem('dks_user', JSON.stringify(data.user));
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('dks_user');
    // Pas besoin d'appel API pour le logout ici car on travaille en mémoire locale
  };

  // Helpers pour les rôles (Vérifie les chaînes exactes du backend)
  const isAdmin = () => user?.role === 'administrator';
  const isCashier = () => user?.role === 'caissier';
  const isSalesman = () => user?.role === 'vendeur';

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    isAdmin,
    isCashier,
    isSalesman,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export default AuthContext;
