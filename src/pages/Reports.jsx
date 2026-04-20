import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiService from '../services/api';

const Reports = () => {
  const [stats, setStats] = useState({
    totalSales: 0,
    totalExpenses: 0,
    netProfit: 0,
    ordersCount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      // On récupère les commandes et les dépenses en parallèle
      const [orders, expenses] = await Promise.all([
        apiService.getOrders(),
        // On tente de récupérer les dépenses, sinon tableau vide
        fetch(`${import.meta.env.VITE_API_URL}/api/expenses`).then(res => res.json()).catch(() => [])
      ]);

      const salesSum = orders.reduce((acc, order) => acc + (parseFloat(order.total) || 0), 0);
      const expensesSum = expenses.reduce((acc, exp) => acc + (parseFloat(exp.amount) || 0), 0);

      setStats({
        totalSales: salesSum.toFixed(2),
        totalExpenses: expensesSum.toFixed(2),
        netProfit: (salesSum - expensesSum).toFixed(2),
        ordersCount: orders.length
      });
    } catch (err) {
      console.error("Erreur rapports DKS:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto rounded-[2.5rem] bg-white p-6 md:p-10 shadow-xl border border-slate-200">
        
        {/* EN-TÊTE REPRIS DE TON CODE */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Rapports et analyses</h1>
            <p className="text-sm text-slate-500">Visualisation en temps réel de Double King Shop.</p>
          </div>
          <Link to="/admin/dashboard" className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-slate-100 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-white transition shadow-sm">
            ← Retour au dashboard
          </Link>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-slate-400 animate-pulse">
            Analyse des données en cours...
          </div>
        ) : (
          <div className="space-y-8">
            {/* GRILLE DES CHIFFRES CLÉS */}
            <div className="grid gap-6 md:grid-cols-3">
              
              {/* Carte Ventes */}
              <div className="p-6 rounded-3xl bg-blue-50 border border-blue-100">
                <p className="text-xs font-bold text-blue-500 uppercase mb-1">Ventes Totales</p>
                <h2 className="text-3xl font-black text-blue-700">{stats.totalSales} <span className="text-sm">$</span></h2>
                <p className="text-[10px] text-blue-400 mt-2 font-bold">{stats.ordersCount} commandes validées</p>
              </div>

              {/* Carte Dépenses */}
              <div className="p-6 rounded-3xl bg-red-50 border border-red-100">
                <p className="text-xs font-bold text-red-500 uppercase mb-1">Dépenses</p>
                <h2 className="text-3xl font-black text-red-700">{stats.totalExpenses} <span className="text-sm">$</span></h2>
                <p className="text-[10px] text-red-400 mt-2 font-bold">Frais opérationnels</p>
              </div>

              {/* Carte Bénéfice */}
              <div className={`p-6 rounded-3xl border ${parseFloat(stats.netProfit) >= 0 ? 'bg-green-50 border-green-100' : 'bg-orange-50 border-orange-100'}`}>
                <p className="text-xs font-bold uppercase mb-1 text-slate-500">Bénéfice Net</p>
                <h2 className={`text-3xl font-black ${parseFloat(stats.netProfit) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {stats.netProfit} <span className="text-sm">$</span>
                </h2>
                <p className="text-[10px] text-slate-400 mt-2 font-bold">Revenu réel de DKS</p>
              </div>

            </div>

            {/* SECTION ACTION FINALE */}
            <div className="rounded-3xl bg-slate-900 p-8 text-white flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg shadow-slate-200">
              <div>
                <p className="text-lg font-bold">Besoin du détail ?</p>
                <p className="text-slate-400 text-sm">Générez un fichier Excel de toutes vos transactions.</p>
              </div>
              <button className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 px-8 py-3 rounded-2xl font-bold transition">
                Exporter CSV
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
