// src/utils/constants.js

// ========================================
// 👥 RÔLES UTILISATEURS
// ========================================
export const ROLES = {
  ADMIN: 'admin',        // Administrateur : accès complet
  CASHIER: 'cashier',    // Caissier : ventes + caisse
  SALESMAN: 'salesman'   // Commercial : catalogue + clients
};

// 🎯 Labels affichés pour chaque rôle (UI)
export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'Administrateur',
  [ROLES.CASHIER]: 'Caissier',
  [ROLES.SALESMAN]: 'Commercial'
};

// 🎯 Couleurs associées aux rôles (pour badges UI)
export const ROLE_COLORS = {
  [ROLES.ADMIN]: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
  [ROLES.CASHIER]: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
  [ROLES.SALESMAN]: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' }
};

// ========================================
// 🔐 PERMISSIONS PAR RÔLE
// ========================================
export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: {
    // Gestion utilisateurs
    canManageUsers: true,
    canCreateUser: true,
    canEditUser: true,
    canDeleteUser: true,
    
    // Gestion produits
    canManageProducts: true,
    canCreateProduct: true,
    canEditProduct: true,
    canDeleteProduct: true,
    canPublishProduct: true,
    
    // Gestion commandes
    canManageOrders: true,
    canViewAllOrders: true,
    canEditOrder: true,
    canDeleteOrder: true,
    canRefundOrder: true,
        // Rapports & Stats
    canViewReports: true,
    canExportData: true,
    canViewAnalytics: true,
    
    // Paramètres système
    canManageSettings: true,
    canManageCategories: true,
    canManageTaxes: true,
    canManageExpenses: true,
    
    // Actions critiques
    canDeleteData: true,
    canBackupDatabase: true,
    canAccessPOS: true
  },
  
  [ROLES.CASHIER]: {
    // Gestion utilisateurs : NON
    canManageUsers: false,
    canCreateUser: false,
    canEditUser: false,
    canDeleteUser: false,
    
    // Gestion produits : lecture seule
    canManageProducts: false,
    canCreateProduct: false,
    canEditProduct: false,
    canDeleteProduct: false,
    canPublishProduct: false,
    
    // Gestion commandes : OUI (ventes)
    canManageOrders: true,
    canViewAllOrders: true,
    canEditOrder: false,
    canDeleteOrder: false,
    canRefundOrder: false,
    
    // Rapports : limité
    canViewReports: false,
    canExportData: false,
    canViewAnalytics: false,
    
    // Paramètres : NON
    canManageSettings: false,
    canManageCategories: false,
    canManageTaxes: false,
    canManageExpenses: true, // Peut ajouter des dépenses
    
    // Actions critiques : NON    canDeleteData: false,
    canBackupDatabase: false,
    canAccessPOS: true // Accès caisse
  },
  
  [ROLES.SALESMAN]: {
    // Gestion utilisateurs : NON
    canManageUsers: false,
    canCreateUser: false,
    canEditUser: false,
    canDeleteUser: false,
    
    // Gestion produits : lecture seule
    canManageProducts: false,
    canCreateProduct: false,
    canEditProduct: false,
    canDeleteProduct: false,
    canPublishProduct: false,
    
    // Gestion commandes : création uniquement
    canManageOrders: true,
    canViewAllOrders: false, // Seulement ses propres commandes
    canEditOrder: false,
    canDeleteOrder: false,
    canRefundOrder: false,
    
    // Rapports : NON
    canViewReports: false,
    canExportData: false,
    canViewAnalytics: false,
    
    // Paramètres : NON
    canManageSettings: false,
    canManageCategories: false,
    canManageTaxes: false,
    canManageExpenses: false,
    
    // Actions critiques : NON
    canDeleteData: false,
    canBackupDatabase: false,
    canAccessPOS: false
  }
};

// ========================================
// 💱 DEVISES & TAUX
// ========================================
export const CURRENCIES = {
  USD: {
    code: 'USD',    symbol: '$',
    name: 'Dollar US',
    rate: 1, // Base
    decimals: 2,
    locale: 'en-US'
  },
  CDF: {
    code: 'CDF',
    symbol: 'FC',
    name: 'Franc Congolais',
    rate: 2850, // 1 USD = 2850 CDF (à mettre à jour selon le marché)
    decimals: 0, // Pas de décimales pour CDF en pratique
    locale: 'fr-FR'
  },
  PI: {
    code: 'PI',
    symbol: 'Π',
    name: 'Pi Network (GCV)',
    rate: 314159, // Global Consensus Value: 1 Pi = 314,159 USD
    decimals: 8, // Précision Pi Network
    locale: 'en-US',
    isCrypto: true,
    gcv: true
  }
};

// 🎯 Devise par défaut pour l'affichage
export const DEFAULT_CURRENCY = 'USD';

// 🎯 Devise locale pour la RDC
export const LOCAL_CURRENCY = 'CDF';

// ========================================
// 🛠️ UTILITAIRES DEVISES
// ========================================

/**
 * Formater un montant dans une devise
 * @param {number} amount - Montant en USD (base)
 * @param {string} currencyCode - Code de la devise (USD, CDF, PI)
 * @returns {string} Montant formaté
 */
export const formatCurrency = (amount, currencyCode = DEFAULT_CURRENCY) => {
  const currency = CURRENCIES[currencyCode];
  if (!currency) return `${amount} ${currencyCode}`;
  
  // Convertir depuis USD si nécessaire
  const convertedAmount = currencyCode === 'USD' 
    ? amount 
    : amount * currency.rate;  
  // Formater selon la locale et décimales
  return new Intl.NumberFormat(currency.locale, {
    minimumFractionDigits: currency.decimals,
    maximumFractionDigits: currency.decimals
  }).format(convertedAmount) + ' ' + currency.symbol;
};

/**
 * Convertir un montant entre deux devises
 * @param {number} amount - Montant source
 * @param {string} fromCurrency - Devise source
 * @param {string} toCurrency - Devise cible
 * @returns {number} Montant converti
 */
export const convertCurrency = (amount, fromCurrency, toCurrency) => {
  if (fromCurrency === toCurrency) return amount;
  
  const from = CURRENCIES[fromCurrency];
  const to = CURRENCIES[toCurrency];
  
  if (!from || !to) return amount;
  
  // Convertir vers USD d'abord, puis vers la devise cible
  const inUSD = fromCurrency === 'USD' ? amount : amount / from.rate;
  return toCurrency === 'USD' ? inUSD : inUSD * to.rate;
};

/**
 * Obtenir le taux de change entre deux devises
 */
export const getExchangeRate = (fromCurrency, toCurrency) => {
  if (fromCurrency === toCurrency) return 1;
  return convertCurrency(1, fromCurrency, toCurrency);
};

// ========================================
// 🛠️ UTILITAIRES RÔLES
// ========================================

/**
 * Vérifier si un rôle a une permission spécifique
 * @param {string} role - Le rôle de l'utilisateur
 * @param {string} permission - La permission à vérifier (ex: 'canDeleteProduct')
 * @returns {boolean}
 */
export const hasPermission = (role, permission) => {
  return ROLE_PERMISSIONS[role]?.[permission] === true;
};
/**
 * Vérifier si un utilisateur a au moins une des permissions
 * @param {string} role - Le rôle de l'utilisateur
 * @param {string[]} permissions - Liste de permissions (OR logic)
 * @returns {boolean}
 */
export const hasAnyPermission = (role, permissions) => {
  return permissions.some(perm => hasPermission(role, perm));
};

/**
 * Vérifier si un utilisateur a toutes les permissions
 * @param {string} role - Le rôle de l'utilisateur
 * @param {string[]} permissions - Liste de permissions (AND logic)
 * @returns {boolean}
 */
export const hasAllPermissions = (role, permissions) => {
  return permissions.every(perm => hasPermission(role, perm));
};

/**
 * Normaliser un rôle (gérer les variations de casse/format)
 * @param {string} role - Rôle brut
 * @returns {string} Rôle normalisé
 */
export const normalizeRole = (role) => {
  if (!role) return null;
  
  const r = role.toLowerCase().trim();
  
  // Mappings des variations courantes
  const mappings = {
    'administrator': ROLES.ADMIN,
    'admin': ROLES.ADMIN,
    'cashier': ROLES.CASHIER,
    'caissier': ROLES.CASHIER,
    'salesman': ROLES.SALESMAN,
    'vendeur': ROLES.SALESMAN,
    'commercial': ROLES.SALESMAN
  };
  
  return mappings[r] || r;
};

/**
 * Obtenir le label affiché pour un rôle
 */
export const getRoleLabel = (role) => {
  return ROLE_LABELS[normalizeRole(role)] || role;
};
/**
 * Obtenir les classes CSS pour un badge de rôle
 */
export const getRoleBadgeClasses = (role) => {
  const colors = ROLE_COLORS[normalizeRole(role)];
  if (!colors) return 'bg-slate-100 text-slate-700 border-slate-200';
  return `${colors.bg} ${colors.text} ${colors.border}`;
};

// ========================================
// ⚙️ CONFIGURATION GÉNÉRALE
// ========================================

export const APP_CONFIG = {
  name: 'Double King Shop',
  location: 'Bunia, Ituri, RDC',
  contact: {
    phone: '+243 999 123 456',
    email: 'contact@doublekingshop.cd',
    whatsapp: '+243999123456'
  },
  business: {
    currency: DEFAULT_CURRENCY,
    localCurrency: LOCAL_CURRENCY,
    taxRate: 0, // À configurer selon la législation
    gcvRate: CURRENCIES.PI.rate
  }
};

// ========================================
// 📱 CONFIGURATION MOBILE / PWA
// ========================================

export const PWA_CONFIG = {
  name: 'Double King Shop',
  shortName: 'DKS',
  description: 'Votre boutique informatique à Bunia',
  themeColor: '#2563eb',
  backgroundColor: '#f8fafc',
  icons: {
    '192': '/icons/icon-192x192.png',
    '512': '/icons/icon-512x512.png'
  }
};

// ========================================
// 🔒 CONFIGURATION SÉCURITÉ
// ========================================
export const SECURITY_CONFIG = {
  pinLength: 4,
  sessionTimeout: 30 * 60 * 1000, // 30 minutes
  maxLoginAttempts: 5,
  lockoutDuration: 15 * 60 * 1000 // 15 minutes
};

// ========================================
// 📊 CONFIGURATION ANALYTICS
// ========================================

export const ANALYTICS_CONFIG = {
  refreshInterval: 30000, // 30 secondes pour le polling
  maxDataPoints: 100, // Limite pour les graphiques
  defaultDateRange: '30days' // 7days | 30days | 90days | all
};

// ========================================
// 🎨 CONFIGURATION UI
// ========================================

export const UI_CONFIG = {
  animations: {
    enabled: true,
    reducedMotion: false
  },
  pagination: {
    defaultPageSize: 20,
    pageSizes: [10, 20, 50, 100]
  },
  notifications: {
    duration: 5000,
    maxVisible: 5,
    position: 'top-right'
  }
};

// Export par défaut pour compatibilité
export default {
  ROLES,
  ROLE_LABELS,
  ROLE_COLORS,
  ROLE_PERMISSIONS,
  CURRENCIES,
  DEFAULT_CURRENCY,
  LOCAL_CURRENCY,
  formatCurrency,
  convertCurrency,
  getExchangeRate,
  hasPermission,  hasAnyPermission,
  hasAllPermissions,
  normalizeRole,
  getRoleLabel,
  getRoleBadgeClasses,
  APP_CONFIG,
  PWA_CONFIG,
  SECURITY_CONFIG,
  ANALYTICS_CONFIG,
  UI_CONFIG
};