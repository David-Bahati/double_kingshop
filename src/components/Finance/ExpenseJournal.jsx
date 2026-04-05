import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';

const ExpenseJournal = () => {
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState({ description: '', amount: '', category: 'Transport' });

  const fetchExpenses = async () => {
    const data = await apiService.request('/expenses');
    setExpenses(data || []);
  };

  useEffect(() => { fetchExpenses(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await apiService.request('/expenses', {
      method: 'POST',
      body: JSON.stringify(form)
    });
    setForm({ description: '', amount: '', category: 'Transport' });
    fetchExpenses();
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border p-6">
      <h2 className="text-xl font-black uppercase mb-6 tracking-tight">Journal des Dépenses</h2>
      
      {/* Formulaire d'ajout rapide */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 bg-gray-50 p-4 rounded-2xl">
        <input placeholder="Description (ex: Loyer)" className="p-3 rounded-xl border-none bg-white text-sm" 
               value={form.description} onChange={e => setForm({...form, description: e.target.value})} required />
        <input type="number" placeholder="Montant ($)" className="p-3 rounded-xl border-none bg-white text-sm" 
               value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required />
        <select className="p-3 rounded-xl border-none bg-white text-sm font-bold" 
                value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
          <option>Transport</option>
          <option>Loyer/Charges</option>
          <option>Stock (Frais)</option>
          <option>Divers</option>
        </select>
        <button type="submit" className="bg-red-500 text-white font-black rounded-xl uppercase text-xs hover:bg-red-600 transition-all">
          Noter Dépense
        </button>
      </form>

      {/* Liste des dépenses récentes */}
      <div className="space-y-3">
        {expenses.slice(0, 5).map(exp => (
          <div key={exp.id} className="flex justify-between items-center p-3 border-b border-gray-50">
            <div>
              <p className="text-xs font-bold text-gray-800">{exp.description}</p>
              <p className="text-[10px] text-gray-400 uppercase">{new Date(exp.date).toLocaleDateString()}</p>
            </div>
            <div className="text-right">
              <p className="text-red-500 font-black">-{exp.amount} $</p>
              <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">{exp.category}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExpenseJournal;
