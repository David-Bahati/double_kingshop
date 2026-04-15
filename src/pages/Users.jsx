import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiService from '../services/api';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const data = await apiService.request('/users');
        setUsers(data || []);
      } catch (err) {
        console.error('Erreur utilisateurs:', err);
        setError('Impossible de charger les utilisateurs.');
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Gestion des utilisateurs</h1>
            <p className="text-sm text-slate-500">Liste des membres du staff enregistrés dans le système.</p>
          </div>
          <Link to="/admin/dashboard" className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition">
            ← Retour au dashboard
          </Link>
        </div>

        {loading ? (
          <div className="rounded-3xl bg-white p-8 text-center">Chargement des utilisateurs...</div>
        ) : error ? (
          <div className="rounded-3xl bg-white p-8 text-center text-red-600">{error}</div>
        ) : users.length === 0 ? (
          <div className="rounded-3xl bg-white p-8 text-center">Aucun utilisateur trouvé.</div>
        ) : (
          <div className="overflow-x-auto rounded-3xl bg-white shadow-sm border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Nom</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Rôle</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Localisation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 text-sm text-slate-700">{user.name}</td>
                    <td className="px-6 py-4 text-sm uppercase text-slate-500">{user.role}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{user.location || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Users;
