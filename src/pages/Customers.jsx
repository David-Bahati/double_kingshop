import React from 'react';
import { Link } from 'react-router-dom';

const Customers = () => (
  <div className="min-h-screen bg-slate-100 p-8">
    <div className="max-w-5xl mx-auto rounded-3xl bg-white p-10 shadow-xl border border-slate-200">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Clients</h1>
          <p className="text-sm text-slate-500">Liste des clients et informations de contact.</p>
        </div>
        <Link to="/admin/dashboard" className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition">
          ← Retour au dashboard
        </Link>
      </div>

      <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-slate-600">
        <p className="text-lg font-semibold mb-4">Gestion des clients bientôt disponible</p>
        <p className="max-w-xl mx-auto">Cette page sera connectée aux informations clients et aux ventes d’ici peu.</p>
      </div>
    </div>
  </div>
);

export default Customers;
