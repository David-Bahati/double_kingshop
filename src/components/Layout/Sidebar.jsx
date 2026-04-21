import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Package, Tags, ShoppingCart, Users, 
  BarChart3, Settings, LogOut, Home, CreditCard, 
  FileText, UserCheck, BadgeCheck, Sparkles 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/constants';

// 🎯 Configuration des menus avec icônes Lucide + regroupement
const menuConfig = {
  [ROLES.ADMIN]: {
    label: 'Administrateur',
    groups: [
      {
        title: 'Navigation',
        items: [
          { name: 'Tableau de bord', icon: LayoutDashboard, path: '/admin/dashboard' },
          { name: 'Accueil Boutique', icon: Home, path: '/' }
        ]
      },
      {
        title: 'Gestion Catalogue',
        items: [
          { name: 'Produits', icon: Package, path: '/products', badge: 'Nouveau' },
          { name: 'Catégories', icon: Tags, path: '/admin/categories' }
        ]
      },
      {
        title: 'Ventes & Clients',
        items: [
          { name: 'Commandes', icon: ShoppingCart, path: '/admin/orders' },
          { name: 'Clients', icon: Users, path: '/customers' }
        ]
      },
      {
        title: 'Système',
        items: [
          { name: 'Utilisateurs', icon: UserCheck, path: '/users' },
          { name: 'Rapports', icon: BarChart3, path: '/reports' },
          { name: 'Paramètres', icon: Settings, path: '/settings' }
        ]
      }
    ]
  },
  [ROLES.CASHIER]: {
    label: 'Caissier',
    groups: [
      {        title: 'Caisse',
        items: [
          { name: 'Tableau de bord', icon: LayoutDashboard, path: '/cashier/dashboard' },
          { name: 'Nouvelle Vente', icon: CreditCard, path: '/checkout', highlight: true },
          { name: 'Historique', icon: FileText, path: '/orders' }
        ]
      },
      {
        title: 'Catalogue',
        items: [
          { name: 'Produits', icon: Package, path: '/products' }
        ]
      }
    ]
  },
  [ROLES.SALESMAN]: {
    label: 'Commercial',
    groups: [
      {
        title: 'Ventes',
        items: [
          { name: 'Tableau de bord', icon: LayoutDashboard, path: '/salesman/dashboard' },
          { name: 'Mes Clients', icon: Users, path: '/customers' },
          { name: 'Historique', icon: FileText, path: '/orders' }
        ]
      },
      {
        title: 'Catalogue',
        items: [
          { name: 'Produits', icon: Package, path: '/products' }
        ]
      }
    ]
  }
};

// 🎯 Composant Item de Menu
const MenuItem = ({ item, isActive }) => {
  const Icon = item.icon;
  
  return (
    <Link
      to={item.path}
      className={`
        group flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200
        ${isActive 
          ? 'bg-blue-600/20 text-blue-400 border-l-2 border-blue-500 pl-2.5' 
          : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
        }
      `}      aria-current={isActive ? 'page' : undefined}
    >
      <div className="flex items-center gap-3">
        <Icon size={18} className={`${isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
        <span className="text-sm font-medium">{item.name}</span>
      </div>
      
      {/* Badge "Nouveau" ou highlight */}
      {item.badge && (
        <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] font-bold rounded-full">
          <Sparkles size={10} /> {item.badge}
        </span>
      )}
      {item.highlight && !isActive && (
        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
      )}
    </Link>
  );
};

// 🎯 Composant Groupe de Menu
const MenuGroup = ({ title, items, location }) => (
  <div className="mb-6">
    <h3 className="px-3 mb-2 text-[10px] font-black text-slate-500 uppercase tracking-wider">
      {title}
    </h3>
    <ul className="space-y-1">
      {items.map((item) => (
        <li key={item.path}>
          <MenuItem item={item} isActive={location.pathname === item.path} />
        </li>
      ))}
    </ul>
  </div>
);

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  
  // Récupère la config du menu selon le rôle
  const currentMenu = menuConfig[user?.role] || menuConfig[ROLES.SALESMAN];
  const userRole = user?.role || 'invité';

  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen fixed left-0 top-0 flex flex-col border-r border-slate-800 shadow-xl z-40">
      
      {/* 🎨 Logo Header */}
      <div className="p-5 border-b border-slate-800">
        <Link to="/" className="flex items-center gap-3 group">          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg group-hover:shadow-blue-500/25 transition-shadow">
            <Package size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black text-white tracking-tight">Double King</h1>
            <p className="text-[10px] text-slate-400 font-medium">Shop Manager</p>
          </div>
        </Link>
      </div>

      {/* 👤 User Profile Card */}
      <div className="p-4 mx-3 my-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
              <span className="text-sm font-black text-white">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-800 rounded-full" title="En ligne" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">{user?.name || 'Utilisateur'}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <BadgeCheck size={12} className="text-blue-400" />
              <p className="text-[10px] text-slate-400 capitalize font-medium">{currentMenu.label}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 🧭 Navigation Scrollable */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto custom-scrollbar">
        {currentMenu.groups.map((group, groupIndex) => (
          <MenuGroup 
            key={groupIndex} 
            title={group.title} 
            items={group.items} 
            location={location} 
          />
        ))}
      </nav>

      {/* 🚪 Footer: Logout + Info */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/50">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-200 group"
          aria-label="Se déconnecter"
        >          <LogOut size={18} className="group-hover:translate-x-0.5 transition-transform" />
          <span className="text-sm font-medium">Déconnexion</span>
        </button>
        
        {/* Version Badge */}
        <div className="mt-4 pt-4 border-t border-slate-800/50">
          <p className="text-[10px] text-slate-600 text-center">
            DKS Manager <span className="text-slate-500">v2.1</span>
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;