// src/services/piService.js
import { apiService } from './api'; // Pour les appels backend

class PiService {
  constructor() {
    this.pi = null;
    this.currentUser = null;
    this.initialized = false;
  }

  // 🎯 Initialisation du SDK Pi Network
  async initialize() {
    if (this.initialized) return;

    // Attendre que le SDK Pi soit injecté par le Pi Browser
    if (typeof window !== 'undefined' && window.Pi) {
      this.pi = window.Pi;
      
      // Initialiser le SDK avec votre clé d'application (à configurer dans .env)
      const appId = import.meta.env?.VITE_PI_APP_ID || process.env?.REACT_APP_PI_APP_ID;
      
      if (appId) {
        await this.pi.init(appId, {
          onReadyForServerApproval: (paymentId) => {
            console.log('✅ Prêt pour approbation serveur:', paymentId);
          },
          onReadyForServerCompletion: (paymentId, txid) => {
            console.log('✅ Prêt pour complétion serveur:', paymentId, txid);
          },
          onCancel: (payment) => {
            console.log('❌ Paiement annulé:', payment);
          },
          onError: (error, payment) => {
            console.error('❌ Erreur Pi:', error, payment);
          }
        });
      }
      
      this.initialized = true;
      console.log('✅ Pi SDK initialisé');
    } else {
      console.warn('⚠️ Pi SDK non disponible - utilisez le Pi Browser');
      throw new Error('Pi SDK non disponible. Ouvrez cette page dans le Pi Browser.');
    }
  }

  // 🎯 Créer un paiement Pi Network
  async createPayment(amount, memo, cartItems, callbacks = {}) {
    if (!this.pi || !this.initialized) {
      throw new Error('Pi SDK non initialisé. Appelez initialize() d\'abord.');    }

    const {
      onReadyForServerApproval,
      onReadyForServerCompletion,
      onSuccess,
      onCancel,
      onError
    } = callbacks;

    try {
      // Lancer le flux de paiement Pi
      const paymentData = {
        amount: parseFloat(amount),
        memo,
        metadata: {
          cartItems,
          timestamp: Date.now(),
          customerId: apiService.getUser()?.id
        }
      };

      // Créer le paiement via le SDK Pi
      const payment = await this.pi.createPayment(paymentData, {
        // Callback: prêt pour approbation serveur
        onReadyForServerApproval: async (paymentId) => {
          console.log('🔄 Approbation serveur pour:', paymentId);
          if (onReadyForServerApproval) {
            await onReadyForServerApproval(paymentId);
          }
          // Appel backend pour approuver
          await apiService.approvePiPayment(paymentId);
        },

        // Callback: prêt pour complétion serveur
        onReadyForServerCompletion: async (paymentId, txid) => {
          console.log('🔄 Complétion serveur pour:', paymentId, txid);
          if (onReadyForServerCompletion) {
            await onReadyForServerCompletion(paymentId, txid);
          }
          // Appel backend pour compléter la commande
          await apiService.completePiOrder({ paymentId, txid, cartItems });
        },

        // Callback: succès
        onSuccess: (payment) => {
          console.log('✅ Paiement réussi:', payment);
          if (onSuccess) onSuccess(payment);
        },
        // Callback: annulation
        onCancel: (payment) => {
          console.log('❌ Paiement annulé:', payment);
          if (onCancel) onCancel(payment);
        },

        // Callback: erreur
        onError: (error, payment) => {
          console.error('❌ Erreur de paiement:', error, payment);
          if (onError) onError(error, payment);
        }
      });

      return payment;

    } catch (error) {
      console.error('❌ Erreur createPayment:', error);
      if (callbacks.onError) {
        callbacks.onError(error, null);
      }
      throw error;
    }
  }

  // 🎯 Récupérer l'utilisateur Pi authentifié
  async getUser() {
    if (!this.pi) return null;
    
    try {
      const user = await this.pi.getUser();
      this.currentUser = user;
      return user;
    } catch (error) {
      console.error('Erreur getUser:', error);
      return null;
    }
  }

  // 🎯 Vérifier si l'utilisateur est authentifié
  isAuthenticated() {
    return this.currentUser !== null;
  }

  // 🎯 Déconnexion
  async signOut() {
    if (this.pi && typeof this.pi.signOut === 'function') {
      await this.pi.signOut();
    }
    this.currentUser = null;
  }}

// 🎯 Exporter une instance singleton (NOMMÉ + DEFAULT)
export const piService = new PiService();
export default piService;