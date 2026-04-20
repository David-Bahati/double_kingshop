import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiService from '../services/api';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ description: '', amount: '', category: 'Autre' });

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    try {
      // On utilise le endpoint /api/expenses que nous avons ajouté au serveur
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/expenses`);
      const data = await response.json();
      setExpenses(data || []);
    } catch (err) {
      console.error("Erreur dépenses:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, date: new Date().toISOString() })
      });
      setFormData({ description: '', amount: '', category: 'Autre' });
      loadExpenses();
    } catch (err) {
      alert("Erreur lors de l'enregistrement");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Supprimer cette dépense ?")) {
      await fetch(`${import.meta.env.VITE_API_URL}/api/expenses/${id}`, { method: 'DELETE' });
      loadExpenses();
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Gestion des Dépenses</h1>
            <p className="text-sm text-slate-500 font-medium">Sorties de caisse Double King Shop</p>
          </div>
          <Link to="/admin/dashboard" className="bg-white border px-4 py-2 rounded-xl text-sm font-bold">Retour</Link>
        </div>

        {/* FORMULAIRE D'AJOUT RAPIDE */}
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-[2rem] shadow-sm mb-8 space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <input 
              type="text" placeholder="Description (ex: Loyer Avril)" required
              className="p-4 bg-slate-50 border rounded-2xl outline-none focus:ring-2 focus:ring-red-400"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
            <input 
              type="number" placeholder="Montant ($)" required
              className="p-4 bg-slate-50 border rounded-2xl outline-none focus:ring-2 focus:ring-red-400"
              value={formData.amount}
              onChange={(e) => setFormData({...formData, amount: e.target.value})}
            />
            <select 
              className="p-4 bg-slate-50 border rounded-2xl outline-none"
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
            >
              <option value="Loyer">Loyer</option>
              <option value="Électricité">Électricité</option>
              <option value="Transport">Transport</option>
              <option value="Marketing">Marketing</option>
              <option value="Autre">Autre</option>
            </select>
          </div>
          <button type="submit" className="w-full bg-red-500 text-white p-4 rounded-2xl font-bold shadow-lg hover:bg-red-600 transition">
            Enregistrer la dépense
          </button>
        </form>

        {/* LISTE DES DÉPENSES */}
        <div className="bg-white rounded-[2rem] shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase">Date</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase">Détails</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase">Montant</th>
                <th className="p-4 text-right"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan="4" className="p-10 text-center">Chargement...</td></tr> : 
                expenses.map(exp => (
                <tr key={exp.id} className="border-b hover:bg-slate-50 transition">
                  <td className="p-4 text-sm text-slate-500">{new Date(exp.date).toLocaleDateString()}</td>
                  <td className="p-4">
                    <div className="font-bold text-slate-800">{exp.description}</div>
                    <div className="text-[10px] text-red-500 font-bold uppercase">{exp.category}</div>
                  </td>
                  <td className="p-4 font-black text-red-600">-{exp.amount} $</td>
                  <td className="p-4 text-right">
                    <button onClick={() => handleDelete(exp.id)} className="text-slate-300 hover:text-red-500 px-2 text-xl">✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Expenses;
