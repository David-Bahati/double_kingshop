// On laisse vide pour utiliser le même domaine que le frontend (plus fiable sur Railway)
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
    // On s'assure que l'URL commence par le bon domaine/préfixe
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
      
      // On vérifie si la réponse est du JSON avant de parser
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
    // Le serveur attend un objet { pin: "0000" }
    // On s'assure d'appeler /api/auth/login
    const data = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    if (data.success && data.user) {
      // Ton serveur ne renvoie pas de "token" mais un objet "user"
      this.setToken("dummy-session-token"); 
    }
    return data;
  }

  // --- PRODUITS (AJOUT DU PRÉFIXE /api) ---
  async getProducts() {
    return this.request('/api/products');
  }

  async getProduct(id) {
    return this.request(`/api/products/${id}`);
  }

  async createProduct(productData) {
    return this.request('/api/products', {
      method: 'POST',
      body: JSON.stringify(productData)
    });
  }

  // --- COMMANDES (AJOUT DU PRÉFIXE /api) ---
  async getOrders() {
    return this.request('/api/orders');
  }

  // --- UTILISATEURS (AJOUT DU PRÉFIXE /api) ---
  async getUsers() {
    return this.request('/api/users');
  }
}

export const apiService = new ApiService();
export default apiService;
