const API_BASE_URL = ""; 

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('token');
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  getToken() {
    return this.token || localStorage.getItem('token');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getToken();
    const isFormData = options.body instanceof FormData;

    const config = {
      ...options,
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers
      }
    };

    try {
      const response = await fetch(url, config);
      const contentType = response.headers.get("content-type");
      let data;
      if (contentType && contentType.includes("application/json")) {
          data = await response.json();
      } else {
          data = { message: await response.text() };
      }
      if (!response.ok) throw new Error(data.error || data.message || 'Erreur DKS');
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // --- AUTHENTIFICATION ---
  async login(credentials) {
    const data = await this.request('/api/auth/login', { method: 'POST', body: JSON.stringify(credentials) });
    if (data.success) this.setToken("session_dks_active");
    return data;
  }

  // --- CATÉGORIES (NOUVEAU) ---
  async getCategories() { return this.request('/api/categories'); }
  async addCategory(cat) { return this.request('/api/categories', { method: 'POST', body: JSON.stringify(cat) }); }
  async deleteCategory(id) { return this.request(`/api/categories/${id}`, { method: 'DELETE' }); }

  // --- PRODUITS (MIS À JOUR) ---
  async getProducts() { return this.request('/api/products'); }
  async addProduct(formData) { return this.request('/api/products', { method: 'POST', body: formData }); }
  async deleteProduct(id) { return this.request(`/api/products/${id}`, { method: 'DELETE' }); }

  // --- PI & FEDAPAY (CONSERVÉS) ---
  async approvePiPayment(paymentId) { return this.request('/api/pi/approve', { method: 'POST', body: JSON.stringify({ paymentId }) }); }
  async completePiOrder(orderData) { return this.request('/api/orders/pi', { method: 'POST', body: JSON.stringify(orderData) }); }
  async initiateMobileMoney(paymentData) { return this.request('/api/mobile-money/initiate', { method: 'POST', body: JSON.stringify(paymentData) }); }
  async getOrders() { return this.request('/api/orders'); }
}

export const apiService = new ApiService();
export default apiService;
