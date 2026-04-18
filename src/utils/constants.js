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
    canDeleteData: true
  },
  [ROLES.CASHIER]: {
    canManageUsers: false,
    canManageProducts: false,
    canManageOrders: true,
    canViewReports: false,
    canDeleteData: false
  },
  [ROLES.SALESMAN]: {
    canManageUsers: false,
    canManageProducts: false,
    canManageOrders: true,
    canViewReports: false,
    canDeleteData: false
  }
};

export const CURRENCIES = {
  USD: { symbol: '$', rate: 1 },
  CDF: { symbol: 'FC', rate: 2800 },
  PI: { symbol: 'Π', rate: 0.01 }
};
