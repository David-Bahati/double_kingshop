// src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { apiService } from '../services/api'; // ✅ CORRECTION : Ajout des accolades { }
import { ROLES } from '../utils/constants';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('dks_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (err) {
      console.error('Erreur lecture user localStorage:', err);
      return null;
    }
  });

  const [loading, setLoading] = useState(false);

  // 🎯 Normalisation des rôles pour cohérence
  const normalizeRole = (role) => {
    if (!role) return 'vendeur';
    const r = role.toLowerCase().trim();
    if (r === 'administrator' || r === 'admin') return ROLES.ADMIN;
    if (r === 'vendeur' || r === 'salesman') return ROLES.SALESMAN;
    if (r === 'caissier' || r === 'cashier') return ROLES.CASHIER;
    return r;
  };

  // 🎯 Vérification session au chargement
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = apiService.getToken();
        const storedUser = localStorage.getItem('dks_user');
        
        if (token && storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser({
            ...parsedUser,
            role: normalizeRole(parsedUser.role)
          });
        }
      } catch (err) {
        console.error('Erreur initialisation auth:', err);
        localStorage.removeItem('dks_user');
        localStorage.removeItem('token');
      }
    };
    
    initAuth();
  }, []);

  const login = async (credentials) => {
    if (!credentials?.pin) {
      throw new Error('PIN requis');
    }

    try {
      setLoading(true);

      // Authentification Pi Network
      if (window.Pi && typeof window.Pi.authenticate === 'function') {
        try {
          await window.Pi.authenticate(['username', 'payments'], (payment) => {
            console.log("⚠️ Paiement incomplet détecté:", payment);
          });
        } catch (piErr) {
          console.warn("⚠️ Mode PIN seul");
        }
      }

      // Appel API
      const data = await apiService.login(credentials);
      
      if (data?.success && data?.user) {
        const normalizedUser = {
          ...data.user,
          role: normalizeRole(data.user.role)
        };
        
        setUser(normalizedUser);
        localStorage.setItem('dks_user', JSON.stringify(normalizedUser));
        return data;
      } else {
        throw new Error(data?.error || data?.message || 'Authentification échouée');
      }
    } catch (err) {
      console.error("❌ Erreur login:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (err) {
      console.error('Erreur logout:', err);
    } finally {
      setUser(null);
      localStorage.removeItem('dks_user');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin: () => user?.role === ROLES.ADMIN,
    isCashier: () => user?.role === ROLES.CASHIER,
    isSalesman: () => user?.role === ROLES.SALESMAN,
    hasRole: (allowedRoles) => user?.role && allowedRoles.includes(user.role)
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
};
