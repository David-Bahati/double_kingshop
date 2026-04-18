import React, { createContext, useState, useContext, useEffect } from 'react';
import apiService from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const normalizeRole = (role) => {
    const r = role?.toLowerCase();
    if (r === 'administrator' || r === 'admin') return 'admin';
    if (r === 'vendeur' || r === 'salesman') return 'salesman';
    if (r === 'caissier' || r === 'cashier') return 'cashier';
    return r;
  };

  const normalizeUser = (userData) => {
    if (!userData) return null;
    return {
      ...userData,
      role: normalizeRole(userData.role),
      originalRole: userData.role
    };
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('dks_user');
    if (storedUser) {
      setUser(normalizeUser(JSON.parse(storedUser)));
    }
    setLoading(false);
  }, []);

  const login = async (pin) => {
    try {
      setError(null);
      setLoading(true);
      
      const data = await apiService.login({ pin });

      if (data.success) {
        const normalizedUser = normalizeUser(data.user);
        setUser(normalizedUser);
        localStorage.setItem('dks_user', JSON.stringify(normalizedUser));
        return data;
      }
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
    localStorage.removeItem('token');
  };

  const value = {
    user,
    loading,
    error,
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
export default AuthContext;
