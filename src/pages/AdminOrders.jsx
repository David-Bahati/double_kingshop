  import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiService from '../services/api';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const data = await apiService.getOrders();
      setOrders(data || []);
    } catch (err) {
      console.error("Erreur chargement commandes:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Gestion des Commandes</h1>
            <p className="text-sm text-slate-500">Suivi des ventes Double King Shop</p>
          </div>
          <Link to="/admin" className="bg-white border px-4 py-2 rounded-xl text-sm font-bold">Retour Admin</Link>
        </div>

        <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-10 text-center">Chargement des transactions...</div>
          ) : orders.length === 0 ? (
            <div className="p-10 text-center text-slate-500">Aucune commande enregistrée pour le moment.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="p-4 text-xs font-bold uppercase text-slate-400">Date & ID</th>
                    <th className="p-4 text-xs font-bold uppercase text-slate-400">Client / Articles</th>
                    <th className="p-4 text-xs font-bold uppercase text-slate-400">Total</th>
                    <th className="p-4 text-xs font-bold uppercase text-slate-400">Paiement</th>
                    <th className="p-4 text-xs font-bold uppercase text-slate-400">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b hover:bg-slate-50 transition">
                      <td className="p-4">
                        <span className="text-xs text-slate-400 block">{new Date(order.createdAt).toLocaleDateString()}</span>
                        <span className="text-xs font-mono font-bold text-blue-600">ID: {order.id.substring(0, 8)}...</span>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-800">{order.customerName || "Client DKS"}</div>
                        <div className="text-xs text-slate-500 italic">
                          {JSON.parse(order.items || "[]").map(item => `${item.quantity}x ${item.name}`).join(', ')}
                        </div>
                      </td>
                      <td className="p-4 font-bold text-slate-900">
                        {order.total} {order.paymentMethod === 'pi_network' ? 'Pi' : '$'}
                      </td>
                      <td className="p-4">
                        <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${order.paymentMethod === 'pi_network' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                          {order.paymentMethod.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusStyle(order.status)}`}>
                          {order.status === 'completed' ? 'Validé' : 'En attente'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminOrders;
