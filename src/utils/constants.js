export const ROLES = {
  ADMIN: 'admin',
  CASHIER: 'cashier',
  SALESMAN: 'salesman'
};

export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: {
    canManageUsers: true,
    canManageProducts: true,
    canManageOrders: true,
    canViewReports: true,
    canManagePayments: true,
    canDeleteData: true
  },
  [ROLES.CASHIER]: {
    canManageUsers: false,
    canManageProducts: false,
    canManageOrders: true,
    canViewReports: false,
    canManagePayments: true,
    canDeleteData: false
  },
  [ROLES.SALESMAN]: {
    canManageUsers: false,
    canManageProducts: false,
    canManageOrders: true,
    canViewReports: false,
    canManagePayments: false,
    canDeleteData: false
  }
};

export const PAYMENT_METHODS = {
  PI_NETWORK: 'pi_network',
  CASH: 'cash',
  CARD: 'card',
  MOBILE_MONEY: 'mobile_money'
};

export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
};

export const CURRENCIES = {
  USD: { symbol: '$', rate: 1 },
  EUR: { symbol: '€', rate: 0.92 },
  CDF: { symbol: 'CDF', rate: 2800 }, // Franc Congolais - taux approximatif
  XOF: { symbol: 'CFA', rate: 610 },
  PI: { symbol: 'Π', rate: 0.01 } // À ajuster selon le cours
};