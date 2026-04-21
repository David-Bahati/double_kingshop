// src/services/api.js

// 🔧 URL de l'API : utilise une variable d'environnement avec fallback
const API_BASE_URL = import.meta.env?.VITE_API_URL 
  || process.env?.REACT_APP_API_URL 
  || 'http://localhost:5000'; // ← Change selon ton environnement

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // --- GESTION DU TOKEN ---
  setToken(token) {
    if (token) {
      localStorage.setItem('token', token);
    }
  }

  getToken() {
    return localStorage.getItem('token');
  }

  clearToken() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  // --- REQUÊTE GÉNÉRIQUE ---
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getToken();
    const isFormData = options.body instanceof FormData;

    const config = {
      ...options,
      headers: {
        // Ne pas mettre Content-Type pour FormData (le navigateur le fait)
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers
      }
    };

    try {
      const response = await fetch(url, config);
      
      // Gestion des réponses non-JSON (ex: 204 No Content)
      const contentType = response.headers.get("content-type");
      let data;      
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = text ? { message: text } : {};
      }

      if (!response.ok) {
        throw new Error(data.error || data.message || `Erreur HTTP ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error('❌ API Error:', error);
      throw error;
    }
  }

  // ==================== AUTHENTIFICATION ====================
  async login(credentials) {
    const data = await this.request('/api/auth/login', { 
      method: 'POST', 
      body: JSON.stringify(credentials) 
    });
    if (data.success && data.token) {
      this.setToken(data.token);
      if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  }

  async logout() {
    this.clearToken();
  }

  // ==================== CATÉGORIES ====================
  async getCategories() { 
    return this.request('/api/categories'); 
  }
  
  async addCategory(cat) { 
    return this.request('/api/categories', { 
      method: 'POST', 
      body: JSON.stringify(cat) 
    }); 
  }
  
  async deleteCategory(id) { 
    return this.request(`/api/categories/${id}`, {       method: 'DELETE' 
    }); 
  }

  // ==================== PRODUITS ====================
  
  // 🔹 Lire tous les produits (filtrage publié/brouillon côté backend)
  async getProducts() { 
    return this.request('/api/products'); 
  }

  // 🔹 Créer un produit (JSON, pas FormData)
  async addProduct(productData) { 
    return this.request('/api/products', { 
      method: 'POST', 
      body: JSON.stringify(productData) // ✅ Envoie { name, price, category, published, ... }
    }); 
  }

  // 🔹 MODIFIER un produit (NOUVEAU - requis pour édition + publication)
  async updateProduct(id, productData) {
    return this.request(`/api/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData)
    });
  }

  // 🔹 Supprimer un produit
  async deleteProduct(id) { 
    return this.request(`/api/products/${id}`, { 
      method: 'DELETE' 
    }); 
  }

  // 🔹 Obtenir un produit par ID (optionnel mais utile)
  async getProductById(id) {
    return this.request(`/api/products/${id}`);
  }

  // ==================== COMMANDES ====================
  async getOrders() { 
    return this.request('/api/orders'); 
  }
  
  async createOrder(orderData) {
    return this.request('/api/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
  }
  // ==================== PAIEMENTS PI & FEDAPAY ====================
  async approvePiPayment(paymentId) { 
    return this.request('/api/pi/approve', { 
      method: 'POST', 
      body: JSON.stringify({ paymentId }) 
    }); 
  }
  
  async completePiOrder(orderData) { 
    return this.request('/api/orders/pi', { 
      method: 'POST', 
      body: JSON.stringify(orderData) 
    }); 
  }
  
  async initiateMobileMoney(paymentData) { 
    return this.request('/api/mobile-money/initiate', { 
      method: 'POST', 
      body: JSON.stringify(paymentData) 
    }); 
  }
}

export const apiService = new ApiService();
export default apiService;