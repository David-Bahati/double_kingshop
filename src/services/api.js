// src/services/api.js

// 🔧 URL de l'API : utilise une variable d'environnement avec fallback
const API_BASE_URL = import.meta.env?.VITE_API_URL 
  || process.env?.REACT_APP_API_URL 
  || 'https://doublekingshop-production-5fdb.up.railway.app/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // ==================== GESTION DU TOKEN ====================
  
  setToken(token) {
    if (token) localStorage.setItem('token', token);
  }

  getToken() {
    return localStorage.getItem('token');
  }

  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  setUser(user) {
    if (user) localStorage.setItem('user', JSON.stringify(user));
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

    const config = {
      ...options,
      headers: {
        // ⚠️ IMPORTANT : Ne pas définir Content-Type pour FormData
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers      }
    };

    try {
      const response = await fetch(url, config);
      const contentType = response.headers.get('content-type');
      
      let data;
      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = text ? { message: text } : {};
      }

      if (!response.ok) {
        const error = new Error(data.message || data.error || `Erreur HTTP ${response.status}`);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      // Gestion 204 No Content
      if (response.status === 204) return null;
      
      return data;
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.error('❌ Erreur de connexion : le serveur est-il démarré ?');
        throw new Error('Impossible de se connecter au serveur.');
      }
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
      if (data.user) this.setUser(data.user);
    }
    return data;
  }
  async logout() {
    await this.request('/api/auth/logout', { method: 'POST' }).catch(() => {});
    this.clearAuth();
  }

  async register(userData) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  // ==================== PRODUITS ====================
  
  async getProducts() {
    return this.request('/api/products');
  }

  async getProductById(id) {
    return this.request(`/api/products/${id}`);
  }

  // 🔹 CRITIQUE : Supporte FormData (image) ET JSON (texte seul)
  async addProduct(productData) {
    const isFormData = productData instanceof FormData;
    return this.request('/api/products', {
      method: 'POST',
      body: isFormData ? productData : JSON.stringify(productData)
    });
  }

  async updateProduct(id, productData) {
    const isFormData = productData instanceof FormData;
    return this.request(`/api/products/${id}`, {
      method: 'PUT',
      body: isFormData ? productData : JSON.stringify(productData)
    });
  }

  async deleteProduct(id) {
    return this.request(`/api/products/${id}`, { method: 'DELETE' });
  }

  // 🔹 Shortcut pour publier/dépublier
  async toggleProductPublish(id, published) {
    return this.request(`/api/products/${id}/publish`, {
      method: 'PATCH',
      body: JSON.stringify({ published })
    });
  }
  // 🔹 Recherche produits
  async searchProducts(query, filters = {}) {
    const params = new URLSearchParams({ q: query, ...filters });
    return this.request(`/api/products/search?${params}`);
  }

  // ==================== CATÉGORIES ====================
  
  async getCategories() {
    return this.request('/api/categories');
  }

  async addCategory(categoryData) {
    return this.request('/api/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData)
    });
  }

  async updateCategory(id, categoryData) {
    return this.request(`/api/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData)
    });
  }

  async deleteCategory(id) {
    return this.request(`/api/categories/${id}`, { method: 'DELETE' });
  }

  // ==================== COMMANDES ====================
  
  async getOrders(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/api/orders?${params}`);
  }

  async getOrderById(id) {
    return this.request(`/api/orders/${id}`);
  }

  async createOrder(orderData) {
    return this.request('/api/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
  }

  async updateOrderStatus(id, status) {    return this.request(`/api/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }

  async cancelOrder(id, reason) {
    return this.request(`/api/orders/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  }

  async getMyOrders() {
    return this.request('/api/orders/my');
  }

  // ==================== UTILISATEURS (Admin) ====================
  
  async getUsers(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/api/users?${params}`);
  }

  async createUser(userData) {
    return this.request('/api/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  async updateUser(id, userData) {
    return this.request(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  }

  async deleteUser(id) {
    return this.request(`/api/users/${id}`, { method: 'DELETE' });
  }

  async updateUserRole(id, role) {
    return this.request(`/api/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role })
    });
  }

  // ==================== DÉPENSES & TAXES ====================  
  async getExpenses(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/api/expenses?${params}`);
  }

  async addExpense(expenseData) {
    return this.request('/api/expenses', {
      method: 'POST',
      body: JSON.stringify(expenseData)
    });
  }

  async updateExpense(id, expenseData) {
    return this.request(`/api/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(expenseData)
    });
  }

  async deleteExpense(id) {
    return this.request(`/api/expenses/${id}`, { method: 'DELETE' });
  }

  async getTaxes() {
    return this.request('/api/taxes');
  }

  async addTax(taxData) {
    return this.request('/api/taxes', {
      method: 'POST',
      body: JSON.stringify(taxData)
    });
  }

  async updateTax(id, taxData) {
    return this.request(`/api/taxes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(taxData)
    });
  }

  async deleteTax(id) {
    return this.request(`/api/taxes/${id}`, { method: 'DELETE' });
  }

  // ==================== RAPPORTS & STATS ====================
  
  async getDashboardStats() {
    return this.request('/api/stats/dashboard');  }

  async getSalesReport(startDate, endDate) {
    return this.request('/api/reports/sales', {
      method: 'POST',
      body: JSON.stringify({ startDate, endDate })
    });
  }

  // ==================== PAIEMENTS PI & MOBILE MONEY ====================
  
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

  async verifyMobileMoney(transactionId) {
    return this.request(`/api/mobile-money/verify/${transactionId}`);
  }

  // ==================== UTILITAIRES ====================
  
  async uploadImage(file, folder = 'products') {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('folder', folder);
    return this.request('/api/upload/image', {
      method: 'POST',
      body: formData
    });
  }

  async backupDatabase() {
    return this.request('/api/backup', { method: 'POST' });  }

  async healthCheck() {
    return this.request('/api/health', { cache: 'no-store' });
  }
}

// 🎯 Export singleton
export const apiService = new ApiService();
export default apiService;