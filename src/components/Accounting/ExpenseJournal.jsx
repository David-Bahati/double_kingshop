import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';
import { useNotification } from '../../context/NotificationContext';

const ExpenseJournal = ({ onUpdate }) => {
  const [expenses, setExpenses] = useState([]);
  const [formData, setFormData] = useState({ title: '', amount: '', category: 'Boutique', date: new Date().toISOString().split('T')[0] });
  const { addNotification } = useNotification();

  useEffect(() => { fetchExpenses(); }, []);

  const fetchExpenses = async () => {
    try {
      const data = await apiService.request('/expenses');
      setExpenses(data || []);
    } catch (error) { console.error(error); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiService.request('/expenses', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      addNotification("Dépense enregistrée", "success");
      setFormData({ title: '', amount: '', category: 'Boutique', date: new Date().toISOString().split('T')[0] });
      fetchExpenses();
      if (onUpdate) onUpdate();
    } catch (error) { addNotification("Erreur enregistrement", "error"); }
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border p-6 animate-fadeIn">
      <h2 className="text-xl font-black uppercase mb-6 italic text-red-600">Journal des Dépenses DKS</h2>
      
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 bg-gray-50 p-4 rounded-2xl">
        <input required className="p-3 rounded-xl border-none outline-none font-bold" placeholder="Motif (ex: Loyer, Transport)" 
               value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
        <input required type="number" className="p-3 rounded-xl border-none outline-none font-bold" placeholder="Montant ($)" 
               value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
        <select className="p-3 rounded-xl border-none outline-none font-bold text-gray-500" 
                value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
          <option value="Boutique">Boutique</option>
          <option value="Personnel">Personnel</option>
          <option value="Stock">Achat Stock</option>
          <option value="Divers">Divers</option>
        </select>
        <button type="submit" className="bg-red-500 text-white font-black rounded-xl uppercase text-xs hover:bg-red-600 transition-all">Ajouter</button>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-gray-400 text-[10px] font-black uppercase border-b pb-4">
            <tr><th>Date</th><th>Motif</th><th>Catégorie</th><th className="text-right">Montant</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {expenses.map((exp) => (
              <tr key={exp.id} className="hover:bg-red-50/30">
                <td className="py-4 text-gray-500">{new Date(exp.date).toLocaleDateString()}</td>
                <td className="py-4 font-bold text-slate-700 uppercase">{exp.title}</td>
                <td className="py-4"><span className="text-[10px] bg-gray-100 px-2 py-1 rounded-lg font-bold">{exp.category}</span></td>
                <td className="py-4 text-right font-black text-red-600">-${parseFloat(exp.amount).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExpenseJournal;
