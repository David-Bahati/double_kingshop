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

    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
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

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Une erreur est survenue');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // --- AUTH ---
  async login(credentials) {
    const data = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    
    if (data.success) {
      this.setToken("session_dks_active"); 
    }
    return data;
  }

  // --- PRODUITS ---
  async getProducts() {
    return this.request('/api/products');
  }

  async createProduct(productData) {
    return this.request('/api/products', {
      method: 'POST',
      body: JSON.stringify(productData)
    });
  }

  // --- AUTRES ---
  async getOrders() { return this.request('/api/orders'); }
  async getUsers() { return this.request('/api/users'); }
}

export const apiService = new ApiService();
export default apiService;
