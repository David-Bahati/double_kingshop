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
          // Note : sandbox: false si tu passes en production réelle sur le Mainnet
          this.pi.init({ version: "2.0", sandbox: true }); 
          this.initialized = true;
          clearInterval(checkPi);
          resolve();
        }
      }, 500);
    });
  }

  /**
   * Lance le flux de paiement Pi et prévient l'interface via UI_CALLBACKS
   */
  async createPayment(amount, memo, cartItems = [], UI_CALLBACKS = {}) {
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
        onReadyForServerApproval: async (paymentId) => {
          console.log("Approbation DKS en cours...", paymentId);
          return await apiService.request('/api/pi/approve', {
            method: 'POST',
            body: JSON.stringify({ paymentId })
          });
        },

        onReadyForServerCompletion: async (paymentId, txid) => {
          console.log("Validation de la vente DKS...", paymentId);
          
          const result = await apiService.request('/api/orders/pi', {
            method: 'POST',
            body: JSON.stringify({ 
              paymentId, 
              txid, 
              amount, 
              items: cartItems 
            })
          });

          console.log("✅ Vente réussie chez Double King Shop !");
          
          // CRITIQUE : On prévient l'interface (PiPayment.js) que c'est fini
          if (UI_CALLBACKS.onSuccess) UI_CALLBACKS.onSuccess(result);
        },

        onCancel: (paymentId) => {
          console.log("Paiement annulé", paymentId);
          if (UI_CALLBACKS.onCancel) UI_CALLBACKS.onCancel();
        },
        onError: (error, payment) => {
          console.error("Erreur technique Pi:", error);
          if (UI_CALLBACKS.onError) UI_CALLBACKS.onError(error.message || "Erreur Pi");
        }
      };

      await this.pi.createPayment(paymentData, callbacks);

    } catch (error) {
      console.error('Erreur lors du paiement DKS:', error);
      if (UI_CALLBACKS.onError) UI_CALLBACKS.onError(error.message);
      throw error;
    }
  }
}

export const piService = new PiService();
