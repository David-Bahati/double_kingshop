// src/services/api.js

// 🎯 Configuration de l'URL API (avec fallbacks pour différents environnements)
const API_BASE_URL = 
  import.meta.env?.VITE_API_URL || 
  process.env?.REACT_APP_API_URL || 
  'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // ==================== GESTION DU TOKEN ====================
  
  setToken(token) {
    if (token) {
      localStorage.setItem('token', token);
    }
  }

  getToken() {
    return localStorage.getItem('token');
  }

  getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  setUser(user) {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    }
  }

  clearAuth() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  // ==================== REQUÊTE GÉNÉRIQUE ====================
  
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getToken();
    const isFormData = options.body instanceof FormData;

    // Configuration des headers
    const headers = {      // Ne pas définir Content-Type pour FormData (le navigateur le fait automatiquement)
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      // Ajouter le token d'authentification si présent
      ...(token && { 'Authorization': `Bearer ${token}` }),
      // Headers personnalisés supplémentaires
      ...options.headers
    };

    const config = {
      ...options,
      headers
    };

    try {
      const response = await fetch(url, config);
      
      // Gestion des différents types de réponse
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = text ? { message: text } : {};
      }

      // Gestion des erreurs HTTP
      if (!response.ok) {
        const error = new Error(data.message || data.error || `Erreur HTTP ${response.status}`);
        error.status = response.status;
        error.data = data;
        throw error;
      }
      
      // Gestion des réponses 204 No Content
      if (response.status === 204) {
        return null;
      }
      
      return data;
      
    } catch (error) {
      // Gestion des erreurs réseau
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.error('❌ Erreur de connexion au serveur. Vérifiez que l\'API est démarrée.');
        throw new Error('Impossible de se connecter au serveur. Vérifiez votre connexion.');
      }
      console.error('❌ API Error:', error);
      throw error;    }
  }

  // ==================== AUTHENTIFICATION ====================
  
  async login(credentials) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    
    if (data.success && data.token) {
      this.setToken(data.token);
      if (data.user) {
        this.setUser(data.user);
      }
    }
    return data;
  }

  async logout() {
    await this.request('/auth/logout', { method: 'POST' }).catch(() => {});
    this.clearAuth();
  }

  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  // ==================== PRODUITS ====================
  
  // 🔹 Lire tous les produits (le backend filtre par published selon le rôle)
  async getProducts() {
    return this.request('/products');
  }

  // 🔹 Lire un produit par ID
  async getProductById(id) {
    return this.request(`/products/${id}`);
  }

  // 🔹 Créer un produit (supporte FormData pour upload d'image)
  async addProduct(productData) {    // Si c'est un FormData, on l'envoie tel quel (pour multer)
    // Sinon, on stringify le JSON
    const isFormData = productData instanceof FormData;
    
    return this.request('/products', {
      method: 'POST',
      body: isFormData ? productData : JSON.stringify(productData)
    });
  }

  // 🔹 Mettre à jour un produit
  async updateProduct(id, productData) {
    const isFormData = productData instanceof FormData;
    
    return this.request(`/products/${id}`, {
      method: 'PUT',
      body: isFormData ? productData : JSON.stringify(productData)
    });
  }

  // 🔹 Supprimer un produit
  async deleteProduct(id) {
    return this.request(`/products/${id}`, {
      method: 'DELETE'
    });
  }

  // 🔹 Publier/Dépublier un produit (shortcut)
  async toggleProductPublish(id, published) {
    return this.request(`/products/${id}/publish`, {
      method: 'PATCH',
      body: JSON.stringify({ published })
    });
  }

  // 🔹 Recherche de produits
  async searchProducts(query, filters = {}) {
    const params = new URLSearchParams({ q: query, ...filters });
    return this.request(`/products/search?${params}`);
  }

  // ==================== CATÉGORIES ====================
  
  async getCategories() {
    return this.request('/categories');
  }

  async getCategoryById(id) {
    return this.request(`/categories/${id}`);
  }
  async addCategory(categoryData) {
    return this.request('/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData)
    });
  }

  async updateCategory(id, categoryData) {
    return this.request(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData)
    });
  }

  async deleteCategory(id) {
    return this.request(`/categories/${id}`, {
      method: 'DELETE'
    });
  }

  // ==================== COMMANDES ====================
  
  async getOrders(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/orders?${params}`);
  }

  async getOrderById(id) {
    return this.request(`/orders/${id}`);
  }

  async createOrder(orderData) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
  }

  async updateOrderStatus(id, status) {
    return this.request(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }

  async cancelOrder(id, reason) {
    return this.request(`/orders/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason })    });
  }

  async getMyOrders() {
    return this.request('/orders/my');
  }

  // ==================== UTILISATEURS (Admin) ====================
  
  async getUsers(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/users?${params}`);
  }

  async getUserById(id) {
    return this.request(`/users/${id}`);
  }

  async createUser(userData) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  async updateUser(id, userData) {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  }

  async deleteUser(id) {
    return this.request(`/users/${id}`, {
      method: 'DELETE'
    });
  }

  async updateUserRole(id, role) {
    return this.request(`/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role })
    });
  }

  // ==================== DÉPENSES ====================
  
  async getExpenses(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/expenses?${params}`);  }

  async addExpense(expenseData) {
    return this.request('/expenses', {
      method: 'POST',
      body: JSON.stringify(expenseData)
    });
  }

  async updateExpense(id, expenseData) {
    return this.request(`/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(expenseData)
    });
  }

  async deleteExpense(id) {
    return this.request(`/expenses/${id}`, {
      method: 'DELETE'
    });
  }

  // ==================== TAXES ====================
  
  async getTaxes() {
    return this.request('/taxes');
  }

  async addTax(taxData) {
    return this.request('/taxes', {
      method: 'POST',
      body: JSON.stringify(taxData)
    });
  }

  async updateTax(id, taxData) {
    return this.request(`/taxes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(taxData)
    });
  }

  async deleteTax(id) {
    return this.request(`/taxes/${id}`, {
      method: 'DELETE'
    });
  }

  // ==================== RAPPORTS & STATS ====================
    async getDashboardStats() {
    return this.request('/stats/dashboard');
  }

  async getSalesReport(startDate, endDate) {
    return this.request('/reports/sales', {
      method: 'POST',
      body: JSON.stringify({ startDate, endDate })
    });
  }

  async getInventoryReport() {
    return this.request('/reports/inventory');
  }

  // ==================== PI NETWORK PAYMENTS ====================
  
  async approvePiPayment(paymentId) {
    return this.request('/pi/approve', {
      method: 'POST',
      body: JSON.stringify({ paymentId })
    });
  }

  async completePiOrder(orderData) {
    return this.request('/orders/pi', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
  }

  async getPiPayments(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/pi/payments?${params}`);
  }

  // ==================== MOBILE MONEY (FedaPay, etc.) ====================
  
  async initiateMobileMoney(paymentData) {
    return this.request('/mobile-money/initiate', {
      method: 'POST',
      body: JSON.stringify(paymentData)
    });
  }

  async verifyMobileMoney(transactionId) {
    return this.request(`/mobile-money/verify/${transactionId}`);
  }

  // ==================== UTILITAIRES ====================  
  async uploadImage(file, folder = 'products') {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('folder', folder);
    
    return this.request('/upload/image', {
      method: 'POST',
      body: formData
    });
  }

  async backupDatabase() {
    return this.request('/backup', {
      method: 'POST'
    });
  }

  async healthCheck() {
    return this.request('/health', { cache: 'no-store' });
  }
}

// 🎯 Exporter une instance singleton
export const apiService = new ApiService();
export default apiService;