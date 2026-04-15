import React from 'react';
import { Link } from 'react-router-dom';

const SalesmanDashboard = () => (
  <div className="min-h-screen bg-slate-100 p-8">
    <div className="max-w-5xl mx-auto rounded-3xl bg-white p-10 shadow-xl border border-slate-200">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Espace Vendeur</h1>
          <p className="text-sm text-slate-500">Suivez vos ventes et votre catalogue de manière simplifiée.</p>
        </div>
        <Link to="/products" className="inline-flex items-center justify-center rounded-full bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition">
          Voir le catalogue
        </Link>
      </div>

      <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-slate-600">
        <p className="text-lg font-semibold mb-4">Page vendeur en développement</p>
        <p className="max-w-xl mx-auto">Votre espace vendeur recevra bientôt vos ventes, votre catalogue et un suivi de performance dédié.</p>
      </div>
    </div>
  </div>
);

export default SalesmanDashboard;
