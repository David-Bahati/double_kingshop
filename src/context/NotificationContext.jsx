// src/context/NotificationContext.jsx
import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { CheckCircle, AlertCircle, Info, X, Loader } from 'lucide-react';

const NotificationContext = createContext(null);

// 🎯 Types de notifications
const NOTIFICATION_TYPES = {
  success: {
    icon: CheckCircle,
    colors: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    progress: 'bg-emerald-500'
  },
  error: {
    icon: AlertCircle,
    colors: 'bg-red-50 border-red-200 text-red-800',
    progress: 'bg-red-500'
  },
  warning: {
    icon: AlertCircle,
    colors: 'bg-amber-50 border-amber-200 text-amber-800',
    progress: 'bg-amber-500'
  },
  info: {
    icon: Info,
    colors: 'bg-blue-50 border-blue-200 text-blue-800',
    progress: 'bg-blue-500'
  },
  loading: {
    icon: Loader,
    colors: 'bg-slate-50 border-slate-200 text-slate-800',
    progress: 'bg-slate-500'
  }
};

// 🎯 Configuration par défaut
const DEFAULT_CONFIG = {
  duration: 5000,
  position: 'top-right',
  maxNotifications: 5,
  pauseOnHover: true,
  showProgress: true,
  closeButton: true
};

export const NotificationProvider = ({ children, config = {} }) => {
  const [notifications, setNotifications] = useState([]);
  
  // 🎯 Utiliser useMemo pour stabiliser mergedConfig
  const mergedConfig = useMemo(() =>     ({ ...DEFAULT_CONFIG, ...config }), 
    [config]
  );

  // 🎯 Supprimer une notification
  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // 🎯 Ajouter une notification (SANS useCallback pour éviter le problème de dépendances)
  const addNotification = (message, type = 'info', options = {}) => {
    const id = Date.now() + Math.random();
    const notification = {
      id,
      message,
      type,
      duration: options.duration ?? mergedConfig.duration,
      position: options.position ?? mergedConfig.position,
      action: options.action,
      dismissible: options.dismissible ?? true,
      createdAt: Date.now()
    };

    setNotifications(prev => {
      const filtered = prev.length >= mergedConfig.maxNotifications 
        ? prev.slice(prev.length - mergedConfig.maxNotifications + 1) 
        : prev;
      return [...filtered, notification];
    });

    // Auto-dismiss
    if (notification.duration > 0 && type !== 'loading') {
      setTimeout(() => {
        removeNotification(id);
      }, notification.duration);
    }

    return id;
  };

  // 🎯 Helpers prédéfinis
  const showSuccess = (message, options) => addNotification(message, 'success', options);
  const showError = (message, options) => addNotification(message, 'error', options);
  const showWarning = (message, options) => addNotification(message, 'warning', options);
  const showInfo = (message, options) => addNotification(message, 'info', options);
  const showLoading = (message, options) => addNotification(message, 'loading', { ...options, duration: 0 });

  // 🎯 Tout effacer
  const clearAll = () => setNotifications([]);
  // 🎯 Mettre à jour une notification
  const updateNotification = (id, updates) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, ...updates } : n
    ));
  };

  const value = {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    updateNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoading
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// 🎯 Hook personnalisé
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification doit être utilisé dans un NotificationProvider');
  }
  return context;
};

// 🎯 Composant d'affichage
export const NotificationContainer = ({ position = 'top-right' }) => {
  const { notifications, removeNotification } = useNotification();

  const getPositionClasses = (pos) => {
    const positions = {
      'top-right': 'top-4 right-4',
      'top-left': 'top-4 left-4',
      'bottom-right': 'bottom-4 right-4',
      'bottom-left': 'bottom-4 left-4',
      'top-center': 'top-4 left-1/2 -translate-x-1/2',
      'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2'
    };
    return positions[pos] || positions['top-right'];  };

  return (
    <div 
      className={`fixed z-[100] flex flex-col gap-2 max-w-sm w-full sm:w-auto ${getPositionClasses(position)}`}
      role="region"
      aria-label="Notifications"
      aria-live="polite"
    >
      {notifications.map((notification, index) => (
        <NotificationItem 
          key={notification.id} 
          notification={notification} 
          onClose={() => removeNotification(notification.id)}
          style={{ animationDelay: `${index * 50}ms` }}
        />
      ))}
    </div>
  );
};

// 🎯 Composant individuel
const NotificationItem = ({ notification, onClose, style }) => {
  const typeConfig = NOTIFICATION_TYPES[notification.type] || NOTIFICATION_TYPES.info;
  const Icon = typeConfig.icon;

  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl border shadow-lg 
        ${typeConfig.colors}
        animate-slideInRight
      `}
      style={style}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start gap-3 p-4 pr-10">
        <div className="shrink-0 mt-0.5">
          <Icon size={18} className={notification.type === 'loading' ? 'animate-spin' : ''} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-relaxed break-words">
            {notification.message}
          </p>
          {notification.action && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                notification.action.onClick?.();                onClose();
              }}
              className="mt-2 text-xs font-bold underline hover:no-underline"
            >
              {notification.action.label}
            </button>
          )}
        </div>
        {notification.dismissible !== false && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1 rounded-lg hover:bg-black/10 transition-colors"
            aria-label="Fermer"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

export default NotificationContext;