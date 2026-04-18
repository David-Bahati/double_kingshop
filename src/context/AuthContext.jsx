import React, { createContext, useState, useContext, useEffect } from 'react';
import apiService from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Normalise les rôles venant du backend (ex: 'vendeur' -> 'salesman')
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

  const login = async (pin) => {
    try {
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
