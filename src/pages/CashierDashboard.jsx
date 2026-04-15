import React from 'react';
import { Link } from 'react-router-dom';

const CashierDashboard = () => (
  <div className="min-h-screen bg-slate-100 p-8">
    <div className="max-w-5xl mx-auto rounded-3xl bg-white p-10 shadow-xl border border-slate-200">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard Caisse</h1>
          <p className="text-sm text-slate-500">Accès rapide à la caisse et aux ventes en cours.</p>
        </div>
        <Link to="/checkout" className="inline-flex items-center justify-center rounded-full bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition">
          Ouvrir la caisse
        </Link>
      </div>

      <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-slate-600">
        <p className="text-lg font-semibold mb-4">Caisse en attente</p>
        <p className="max-w-xl mx-auto">Cette page permettra bientôt de gérer les ventes rapides, les paiements et les reçus depuis un seul endroit.</p>
      </div>
    </div>
  </div>
);

export default CashierDashboard;
