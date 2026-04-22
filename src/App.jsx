import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { NotificationProvider, NotificationContainer } from './context/NotificationContext';
import { ThemeProvider } from './context/ThemeContext';
import { ROLES } from './utils/constants';

// Pages Existantes
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

// --- NOUVELLES PAGES ---
import Categories from './pages/Categories';
import AdminOrders from './pages/AdminOrders';
import Expenses from './pages/Expenses';

// --- COMPOSANT DE PROTECTION DES ROUTES (CORRIGÉ) ---
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, loading } = useAuth();

  // Si le contexte d'authentification est en train de charger, on affiche rien ou un loader
  // Cela évite de rediriger vers /login par erreur pendant que le token est vérifié
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="animate-pulse font-black uppercase tracking-widest text-xs">Vérification DKS...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />; // Retour à l'accueil si pas les droits
  }

  return children;
};

function App() {
  const contactPhone = import.meta.env.VITE_CONTACT_PHONE || "+243 000 000 000";

  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <NotificationProvider>
            <CartProvider>
              <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
                <NotificationContainer />
                <Routes>
                  {/* Routes Publiques */}
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/orders" element={<OrderHistory />} />
                  <Route path="/products" element={<Products />} />

                  {/* --- ROUTES ADMIN / GESTION --- */}
                  <Route path="/admin/categories" element={
                    <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.CASHIER, ROLES.SALESMAN]}>
                      <Categories />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/admin/expenses" element={
                    <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                      <Expenses />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/admin/orders" element={
                    <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.CASHIER]}>
                      <AdminOrders />
                    </ProtectedRoute>
                  } />

                  <Route path="/users" element={
                    <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                      <Users />
                    </ProtectedRoute>
                  } />

                  <Route path="/reports" element={
                    <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                      <Reports />
                    </ProtectedRoute>
                  } />

                  <Route path="/settings" element={
                    <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                      <Settings />
                    </ProtectedRoute>
                  } />

                  <Route path="/cashier/dashboard" element={
                    <ProtectedRoute allowedRoles={[ROLES.CASHIER]}>
                      <CashierDashboard />
                    </ProtectedRoute>
                  } />

                  <Route path="/salesman/dashboard" element={
                    <ProtectedRoute allowedRoles={[ROLES.SALESMAN]}>
                      <SalesmanDashboard />
                    </ProtectedRoute>
                  } />

                  <Route path="/customers" element={
                    <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                      <Customers />
                    </ProtectedRoute>
                  } />

                  <Route path="/admin/dashboard" element={
                    <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.SALESMAN, ROLES.CASHIER]}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  } />

                  <Route path="*" element={
                    <div className="flex items-center justify-center min-h-screen font-bold text-gray-400 uppercase tracking-widest">
                      404 - Page Introuvable (DKS)
                    </div>
                  } />
                </Routes>

                <footer className="fixed bottom-4 right-4 text-[10px] text-gray-400 text-right pointer-events-none z-0">
                  <p className="font-bold">Double King Shop • Bunia</p>
                  <p>{contactPhone}</p>
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
