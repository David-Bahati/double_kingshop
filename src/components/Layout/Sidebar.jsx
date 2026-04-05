import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/constants';

const menuItems = {
  [ROLES.ADMIN]: [
    { name: 'Tableau de bord', icon: '📊', path: '/admin/dashboard' },
    { name: 'Produits', icon: '📦', path: '/products' },
    { name: 'Commandes', icon: '🛒', path: '/orders' },
    { name: 'Utilisateurs', icon: '👥', path: '/users' },
    { name: 'Rapports', icon: '📈', path: '/reports' },
    { name: 'Paramètres', icon: '⚙️', path: '/settings' }
  ],
  [ROLES.CASHIER]: [
    { name: 'Caisse', icon: '💰', path: '/cashier/dashboard' },
    { name: 'Nouvelle vente', icon: '💵', path: '/checkout' },
    { name: 'Historique', icon: '📜', path: '/orders' }
  ],
  [ROLES.SALESMAN]: [
    { name: 'Catalogue', icon: '📱', path: '/products' },
    { name: 'Mes ventes', icon: '📊', path: '/salesman/dashboard' },
    { name: 'Clients', icon: '👤', path: '/customers' }
  ]
};

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const userMenuItems = menuItems[user?.role] || [];

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen fixed left-0 top-0 overflow-y-auto">
      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-2xl font-bold text-blue-400">Double King</h1>
        <p className="text-sm text-gray-400">Shop Management</p>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
            <span className="text-lg font-semibold">
              {user?.name?.charAt(0) || 'U'}
            </span>
          </div>
          <div>
            <p className="font-medium">{user?.name || 'Utilisateur'}</p>
            <p className="text-xs text-gray-400 capitalize">{user?.role || 'role'}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4">
        <ul className="space-y-2">
          {userMenuItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  location.pathname === item.path
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800">
        <button
          onClick={logout}
          className="w-full flex items-center space-x-3 px-4 py-3 text-red-400 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <span>🚪</span>
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;