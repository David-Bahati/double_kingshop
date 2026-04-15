import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { NotificationProvider, NotificationContainer } from './context/NotificationContext';
import { ThemeProvider } from './context/ThemeContext';
import { ROLES } from './utils/constants';

// Pages
import Login from './pages/Login';
import Home from './pages/Home';
import Checkout from './pages/Checkout';
import OrderHistory from './pages/OrderHistory';
import AdminDashboard from './pages/Dashboard/AdminDashboard';
import Products from './pages/Products';
import Users from './pages/Users';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import CashierDashboard from './pages/CashierDashboard';
import SalesmanDashboard from './pages/SalesmanDashboard';
import Customers from './pages/Customers';

// --- COMPOSANT DE PROTECTION DES ROUTES ---
// On l'adapte pour accepter Admin, Vendeur et Caissier sur le même Dashboard
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuth();

  // Si pas connecté, retour au Login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Vérification des rôles (Admin, Vendeur, Caissier)
  // On s'assure que le rôle de l'utilisateur fait partie des rôles autorisés
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <NotificationProvider>
            <CartProvider>
              <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
                <NotificationContainer />
                <Routes>
                  {/* Route Publique */}
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/orders" element={<OrderHistory />} />
                  <Route path="/products" element={<Products />} />

                  <Route
                    path="/users"
                    element={
                      <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                        <Users />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/reports"
                    element={
                      <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                        <Reports />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                        <Settings />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/cashier/dashboard"
                    element={
                      <ProtectedRoute allowedRoles={[ROLES.CASHIER]}>
                        <CashierDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/salesman/dashboard"
                    element={
                      <ProtectedRoute allowedRoles={[ROLES.SALESMAN]}>
                        <SalesmanDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/customers"
                    element={
                      <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                        <Customers />
                      </ProtectedRoute>
                    }
                  />

                  {/* DASHBOARD CENTRALISÉ (DKS STAFF) */}
                  <Route
                    path="/admin/dashboard"
                    element={
                      <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.SALESMAN, ROLES.CASHIER]}>
                        <AdminDashboard />
                      </ProtectedRoute>
                    }
                  />

                  {/* Gestion de l'erreur 404 */}
                  <Route path="*" element={
                    <div className="flex items-center justify-center min-h-screen font-bold text-gray-400 uppercase tracking-widest">
                      404 - Page Introuvable (DKS)
                    </div>
                  } />
                </Routes>

                {/* Infos de Contact (Env) - Optionnel en bas de page */}
                <footer className="fixed bottom-4 right-4 text-[10px] text-gray-400 text-right pointer-events-none">
                  <p>Double King Shop • Bunia</p>
                  <p>{import.meta.env.VITE_CONTACT_PHONE}</p>
                </footer>
              </div>
            </CartProvider>
          </NotificationProvider>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
