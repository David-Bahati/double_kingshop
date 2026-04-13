import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiService from '../services/api';

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await apiService.request('/orders');
        // Trier par date décroissante
        const sortedOrders = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setOrders(sortedOrders);
      } catch (err) {
        setError('Erreur lors du chargement des commandes');
        console.error('Erreur:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const handlePrintReceipt = (order) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>DKS Receipt - ${order.id}</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; padding: 20px; color: #333; text-align: center; }
            .receipt-box { max-width: 300px; margin: auto; border: 1px solid #eee; padding: 15px; }
            .logo { background: #1d4ed8; color: white; padding: 10px; font-weight: 900; font-style: italic; display: inline-block; margin-bottom: 10px; font-size: 24px; }
            .shop-name { font-size: 18px; font-weight: bold; margin-bottom: 2px; text-transform: uppercase; }
            .address { font-size: 10px; text-transform: uppercase; margin-bottom: 20px; color: #666; }
            .line { border-top: 1px dashed #ccc; margin: 10px 0; }
            .details { font-size: 12px; text-align: left; line-height: 1.5; }
            .total { font-size: 18px; font-weight: bold; margin-top: 15px; text-align: right; border-top: 2px solid #000; padding-top: 5px; }
            .footer { font-size: 9px; text-align: center; margin-top: 25px; color: #999; }
          </style>
        </head>
        <body>
          <div class="receipt-box">
            <div class="logo">DKS</div>
            <div class="shop-name">Double King Shop</div>
            <div class="address">Avenue du Commerce, Bunia, Ituri</div>
            <div class="line"></div>
            <div class="details">
              <p><strong>REÇU N°:</strong> ${order.id}</p>
              <p><strong>DATE :</strong> ${new Date(order.createdAt).toLocaleString()}</p>
              <p><strong>CLIENT :</strong> ${order.customerName || 'Client DKS'}</p>
              <div class="line"></div>
              ${order.items ? order.items.map(i => `<p>• ${i}</p>`).join('') : '<p>Articles informatiques</p>'}
              <p style="font-size: 9px; margin-top: 10px; color: #666;">TYPE: ${order.txid === 'CASH_PAYMENT' ? 'CASH' : order.txid.startsWith('MM-') ? 'MOBILE MONEY' : 'BLOCKCHAIN PI'}</p>
            </div>
            <div class="total">TOTAL : ${order.total.toFixed(2)} $</div>
            <div class="footer">
              Merci de votre confiance chez Double King Shop!<br/>
              Expert en accessoires informatiques à Bunia.
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); setTimeout(() => window.close(), 500); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement de l'historique...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-900">Double King Shop</h1>
                <span className="ml-2 text-yellow-600 text-2xl font-serif">♔</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                ← Retour à l'accueil
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-blue-600 p-6 text-white">
            <h1 className="text-3xl font-bold">Historique des Commandes</h1>
            <p className="mt-2 opacity-90">Suivez vos achats passés</p>
          </div>

          <div className="p-6">
            {orders.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">Aucune commande trouvée.</p>
                <Link
                  to="/"
                  className="mt-4 inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Commencer vos achats
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {orders.map((order) => (
                  <div key={order.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-4">
                          <h3 className="text-xl font-bold text-gray-900">Commande #{order.id}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            order.status === 'completed' ? 'bg-green-100 text-green-800' :
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {order.status === 'completed' ? 'Terminée' :
                             order.status === 'pending' ? 'En cours' : 'Annulée'}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div>
                            <p className="font-medium">Date</p>
                            <p>{new Date(order.createdAt).toLocaleDateString('fr-FR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}</p>
                          </div>
                          <div>
                            <p className="font-medium">Client</p>
                            <p>{order.customerName || 'Client DKS'}</p>
                          </div>
                          <div>
                            <p className="font-medium">Paiement</p>
                            <p className="capitalize">
                              {order.txid === 'CASH_PAYMENT' ? 'Espèces' :
                               order.txid.startsWith('MM-') ? 'Mobile Money' : 'Pi Network'}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4">
                          <p className="font-medium text-gray-700 mb-2">Articles commandés:</p>
                          <div className="flex flex-wrap gap-2">
                            {order.items && order.items.map((item, index) => (
                              <span key={index} className="bg-gray-100 px-3 py-1 rounded-full text-sm">
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 lg:mt-0 lg:ml-6 text-right">
                        <p className="text-2xl font-bold text-blue-600 mb-4">
                          {order.total.toFixed(2)} $
                        </p>
                        <button
                          onClick={() => handlePrintReceipt(order)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold transition-colors"
                        >
                          📄 Imprimer le reçu
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default OrderHistory;