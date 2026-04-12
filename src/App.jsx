import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// Pages
import Login from './pages/Login';
import Home from './pages/Home';
import AdminDashboard from './pages/Dashboard/AdminDashboard';

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
        <CartProvider>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              {/* Route Publique */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />

              {/* DASHBOARD CENTRALISÉ (DKS STAFF) */}
              {/* On autorise les 3 rôles à accéder au Dashboard */}
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['administrator', 'vendeur', 'caissier']}>
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
      </AuthProvider>
    </Router>
  );
}

export default App;
