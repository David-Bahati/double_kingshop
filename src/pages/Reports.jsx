import React from 'react';
import { Link } from 'react-router-dom';

const Reports = () => (
  <div className="min-h-screen bg-slate-100 p-8">
    <div className="max-w-5xl mx-auto rounded-3xl bg-white p-10 shadow-xl border border-slate-200">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Rapports et analyses</h1>
          <p className="text-sm text-slate-500">Visualisation rapide de vos ventes, stocks et performances.</p>
        </div>
        <Link to="/admin/dashboard" className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition">
          ← Retour au dashboard
        </Link>
      </div>

      <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-slate-600">
        <p className="text-lg font-semibold mb-4">Page de rapports en construction</p>
        <p className="max-w-xl mx-auto">Les données de ventes, tableaux et filtres seront connectés ici prochainement pour offrir un aperçu complet des performances de Double King Shop.</p>
      </div>
    </div>
  </div>
);

export default Reports;
