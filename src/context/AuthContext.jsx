// src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import apiService from '../services/api';
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
          // Optionnel : Vérifier la validité du token côté serveur
          // const userData = await apiService.getCurrentUser();
          setUser({
            ...parsedUser,
            role: normalizeRole(parsedUser.role)
          });
        }
      } catch (err) {
        console.error('Erreur initialisation auth:', err);
        // Nettoyer si erreur
        localStorage.removeItem('dks_user');        localStorage.removeItem('token');
      }
    };
    
    initAuth();
  }, []);

  // 🎯 Callback pour paiements Pi incomplets
  const onIncompletePaymentFound = (payment) => {
    console.log("⚠️ Paiement incomplet détecté DKS:", payment);
    // Tu pourrais ici appeler ton backend pour finaliser la commande
    // await apiService.completePiOrder({ paymentId: payment.identifier, ... });
  };

  // 🎯 Fonction de login - Attend { pin: "XXXX" }
  const login = async (credentials) => {
    // credentials = { pin: "0000" }
    if (!credentials?.pin) {
      throw new Error('PIN requis');
    }

    try {
      setLoading(true);

      // 🔐 Authentification Pi Network (optionnelle, pour les paiements)
      if (window.Pi && typeof window.Pi.authenticate === 'function') {
        try {
          await window.Pi.authenticate(['username', 'payments'], onIncompletePaymentFound);
          console.log("✅ Pi Network authentifié avec scope 'payments'");
        } catch (piErr) {
          console.warn("⚠️ Pi Browser non détecté, continuation en mode PIN seul");
          // On continue quand même pour permettre le login via PIN
        }
      }

      // 🎯 Appel API avec les credentials
      const data = await apiService.login(credentials);
      
      if (data?.success && data?.user) {
        const normalizedUser = {
          ...data.user,
          role: normalizeRole(data.user.role)
        };
        
        setUser(normalizedUser);
        localStorage.setItem('dks_user', JSON.stringify(normalizedUser));
        
        console.log(`✅ Login réussi: ${normalizedUser.name} (${normalizedUser.role})`);
        return data;
      } else {        throw new Error(data?.error || data?.message || 'Authentification échouée');
      }
    } catch (err) {
      console.error("❌ Erreur d'authentification DKS:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 🎯 Fonction de logout
  const logout = async () => {
    try {
      await apiService.logout();
    } catch (err) {
      console.error('Erreur logout API:', err);
    } finally {
      setUser(null);
      localStorage.removeItem('dks_user');
      localStorage.removeItem('token');
      
      // Redirection vers login
      window.location.href = '/login';
    }
  };

  // 🎯 Helpers pour vérifier les permissions
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
    throw new Error('useAuth doit être utilisé dans un AuthProvider');  }
  return context;
};