// src/services/api.js

/**
 * 🎯 CONFIGURATION DE L'URL API
 * Correction : On s'assure que l'URL de base ne finit pas par /api
 * car vos méthodes le rajoutent déjà.
 */
const API_BASE_URL = 
  import.meta.env?.VITE_API_URL?.replace(/\/api$/, '') || 
  'https://doublekingshop-production-5fdb.up.railway.app';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // ==================== GESTION DU TOKEN & USER ====================
  
  setToken(token) {
    if (token) localStorage.setItem('token', token);
  }

  getToken() {
    return localStorage.getItem('token');
  }

  getUser() {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (e) { return null; }
  }

  setUser(user) {
    if (user) localStorage.setItem('user', JSON.stringify(user));
  }

  clearAuth() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  // ==================== REQUÊTE GÉNÉRIQUE (CORRIGÉE) ====================
  
  async request(endpoint, options = {}) {
    // Nettoyage pour éviter les doubles slashes //
    const cleanBase = this.baseURL.replace(/\/$/, '');
    const cleanEndpoint = endpoint.replace(/^\//, '');
    const url = `${cleanBase}/${cleanEndpoint}`;

    const token = this.getToken();
    const isFormData = options.body instanceof FormData;

    const config = {
      ...options,
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
      }
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
        const error = new Error(data.message || data.error || `Erreur ${response.status}`);
        error.status = response.status;
        throw error;
      }
      
      if (response.status === 204) return null;
      return data;
    } catch (error) {
      console.error(`❌ API Error sur ${url}:`, error.message);
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
    return this.request('/api/auth/register', { method: 'POST', body: JSON.stringify(userData) });
  }

  async getCurrentUser() { return this.request('/api/auth/me'); }

  // ==================== PRODUITS ====================
  
  async getProducts() { return this.request('/api/products'); }
  async getProductById(id) { return this.request(`/api/products/${id}`); }

  async addProduct(productData) {
    return this.request('/api/products', {
      method: 'POST',
      body: productData instanceof FormData ? productData : JSON.stringify(productData)
    });
  }

  async updateProduct(id, productData) {
    return this.request(`/api/products/${id}`, {
      method: 'PUT',
      body: productData instanceof FormData ? productData : JSON.stringify(productData)
    });
  }

  async deleteProduct(id) { return this.request(`/api/products/${id}`, { method: 'DELETE' }); }
  
  async toggleProductPublish(id, published) {
    return this.request(`/api/products/${id}/publish`, {
      method: 'PATCH',
      body: JSON.stringify({ published })
    });
  }

  async searchProducts(query, filters = {}) {
    const params = new URLSearchParams({ q: query, ...filters });
    return this.request(`/api/products/search?${params}`);
  }

  // ==================== CATÉGORIES ====================
  
  async getCategories() { return this.request('/api/categories'); }
  async addCategory(categoryData) {
    return this.request('/api/categories', { method: 'POST', body: JSON.stringify(categoryData) });
  }
  async updateCategory(id, categoryData) {
    return this.request(`/api/categories/${id}`, { method: 'PUT', body: JSON.stringify(categoryData) });
  }
  async deleteCategory(id) { return this.request(`/api/categories/${id}`, { method: 'DELETE' }); }

  // ==================== COMMANDES ====================
  
  async getOrders(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/api/orders?${params}`);
  }
  async createOrder(orderData) {
    return this.request('/api/orders', { method: 'POST', body: JSON.stringify(orderData) });
  }
  async getMyOrders() { return this.request('/api/orders/my'); }

  // ==================== UTILISATEURS (ADMIN) ====================
  
  async getUsers(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/api/users?${params}`);
  }
  async updateUserRole(id, role) {
    return this.request(`/api/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) });
  }

  // ==================== DÉPENSES & TAXES ====================
  
  async getExpenses(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/api/expenses?${params}`);
  }
  async addExpense(expenseData) {
    return this.request('/api/expenses', { method: 'POST', body: JSON.stringify(expenseData) });
  }
  async getTaxes() { return this.request('/api/taxes'); }

  // ==================== RAPPORTS & STATS ====================
  
  async getDashboardStats() { return this.request('/api/stats/dashboard'); }
  async getInventoryReport() { return this.request('/api/reports/inventory'); }

  // ==================== PAIEMENTS PI & MOBILE MONEY ====================
  
  async approvePiPayment(paymentId) {
    return this.request('/api/pi/approve', { method: 'POST', body: JSON.stringify({ paymentId }) });
  }
  async completePiOrder(orderData) {
    return this.request('/api/orders/pi', { method: 'POST', body: JSON.stringify(orderData) });
  }
  async initiateMobileMoney(paymentData) {
    return this.request('/api/mobile-money/initiate', { method: 'POST', body: JSON.stringify(paymentData) });
  }

  // ==================== UTILITAIRES ====================
  
  async uploadImage(file, folder = 'products') {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('folder', folder);
    return this.request('/api/upload/image', { method: 'POST', body: formData });
  }
  async healthCheck() { return this.request('/api/health', { cache: 'no-store' }); }
}

export const apiService = new ApiService();
export default apiService;
