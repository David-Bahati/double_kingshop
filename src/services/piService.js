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
          // Note : Passe 'sandbox: false' quand tu seras prêt pour le Mainnet
          this.pi.init({ version: "2.0", sandbox: true }); 
          this.initialized = true;
          clearInterval(checkPi);
          resolve();
        }
      }, 500);
    });
  }

  /**
   * Lance le flux de paiement Pi et met à jour le stock en temps réel
   * @param {number} amount - Le montant total en Pi
   * @param {string} memo - Description de l'achat
   * @param {Array} cartItems - La liste des produits achetés (id, name, quantity)
   */
  async createPayment(amount, memo, cartItems = []) {
    try {
      await this.initialize();

      const paymentData = {
        amount: parseFloat(amount),
        memo: memo,
        metadata: { 
          shopName: "Double King Shop",
          location: "Bunia"
          // On peut aussi mettre les IDs ici si nécessaire
        }
      };

      const callbacks = {
        // 1. Étape d'approbation : Ton serveur dit "OK" à Pi Network
        onReadyForServerApproval: async (paymentId) => {
          console.log("Approbation DKS en cours...", paymentId);
          await apiService.request('/pi/approve', {
            method: 'POST',
            body: JSON.stringify({ paymentId })
          });
        },

        // 2. Étape de complétion : L'utilisateur a payé sur la blockchain
        onReadyForServerCompletion: async (paymentId, txid) => {
          console.log("Validation de la vente DKS...", paymentId);
          
          // CRUCIAL : On envoie cartItems pour que le serveur déduise le stock
          await apiService.request('/pi/complete', {
            method: 'POST',
            body: JSON.stringify({ 
              paymentId, 
              txid, 
              cartItems // Envoi du panier pour mise à jour du stock en temps réel
            })
          });

          console.log("✅ Vente réussie et stock mis à jour !");
          
          // On attend un peu pour laisser le serveur finir puis on rafraîchit
          setTimeout(() => {
            window.location.href = "/dashboard"; // Redirection vers le dashboard pour voir la vente
          }, 2000);
        },

        // 3. Gestion des imprévus
        onCancel: (paymentId) => {
          console.log("Paiement annulé par l'utilisateur", paymentId);
        },
        onError: (error, payment) => {
          console.error("Erreur technique Pi:", error);
          alert("Erreur lors de la transaction Pi. Veuillez réessayer.");
        }
      };

      // Lancement de la fenêtre de paiement Pi sur le Pixel 8
      await this.pi.createPayment(paymentData, callbacks);

    } catch (error) {
      console.error('Erreur lors du paiement DKS:', error);
      throw error;
    }
  }
}

export const piService = new PiService();
