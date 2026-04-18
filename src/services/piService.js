import apiService from './api';

class PiService {
  constructor() {
    this.pi = window.Pi || null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    
    return new Promise((resolve) => {
      const checkPi = setInterval(() => {
        if (window.Pi) {
          this.pi = window.Pi;
          // Note : sandbox: true pour tes tests sur Railway
          this.pi.init({ version: "2.0", sandbox: true }); 
          this.initialized = true;
          clearInterval(checkPi);
          resolve();
        }
      }, 500);
    });
  }

  /**
   * Lance le flux de paiement Pi et met à jour le stock chez Double King Shop
   */
  async createPayment(amount, memo, cartItems = []) {
    try {
      await this.initialize();

      const paymentData = {
        amount: parseFloat(amount),
        memo: memo,
        metadata: { 
          shopName: "Double King Shop",
          location: "Bunia",
          itemsCount: cartItems.length
        }
      };

      const callbacks = {
        // 1. Approbation par ton serveur Railway
        onReadyForServerApproval: async (paymentId) => {
          console.log("Approbation DKS en cours...", paymentId);
          return await apiService.request('/api/pi/approve', {
            method: 'POST',
            body: JSON.stringify({ paymentId })
          });
        },

        // 2. Complétion et enregistrement de la commande
        onReadyForServerCompletion: async (paymentId, txid) => {
          console.log("Validation de la vente DKS...", paymentId);
          
          // CORRECTION : On utilise la route /api/orders/pi pour créer la commande et déduire le stock
          await apiService.request('/api/orders/pi', {
            method: 'POST',
            body: JSON.stringify({ 
              paymentId, 
              txid, 
              amount, 
              items: cartItems 
            })
          });

          console.log("✅ Vente réussie chez Double King Shop !");
        },

        onCancel: (paymentId) => {
          console.log("Paiement annulé", paymentId);
        },
        onError: (error, payment) => {
          console.error("Erreur technique Pi:", error);
        }
      };

      // Ouvre la fenêtre de paiement sur ton Pixel 8
      await this.pi.createPayment(paymentData, callbacks);

    } catch (error) {
      console.error('Erreur lors du paiement DKS:', error);
      throw error;
    }
  }
}

export const piService = new PiService();
