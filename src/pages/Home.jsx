// src/pages/Home.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShoppingCart, Menu, Sparkles, UserCircle, X, 
  Plus, Minus, Trash2, Search, Eye, Loader, AlertCircle 
} from 'lucide-react';

// Contextes & Composants
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/Product/ProductCard';
import QuickViewModal from '../components/Product/QuickViewModal';
import { apiService } from '../services/api'; // ✅ Correction : Import nommé

const Home = () => {
  // --- ÉTATS PRINCIPAUX ---
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("Tous");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // UI States
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  
  // Contextes
  const { user } = useAuth();
  const {
    cartItems, getCartCount, getCartTotal,
    removeFromCart, updateQuantity,
    isCartOpen, setIsCartOpen
  } = useCart();

  const isAdmin = user?.role === 'admin';

  // 🎯 Chargement initial des données
  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      try {
        setLoading(true);
        // Appel simultané des produits et catégories
        const [prodData, catData] = await Promise.all([
          apiService.getProducts(),
          apiService.getCategories()
        ]);
        
        if (!isMounted) return;

        // 🔒 Filtrage : seuls les produits publiés sont visibles (sauf admin)
        const allProducts = Array.isArray(prodData) ? prodData : (prodData?.products || []);
        const visibleProducts = isAdmin 
          ? allProducts 
          : allProducts.filter(p => p.published === true);
        
        setProducts(visibleProducts);
        setCategories(Array.isArray(catData) ? catData : []);
        setError(null);
      } catch (err) {
        console.error('Erreur DKS:', err);
        if (isMounted) {
          setError(`Connexion impossible : ${err.message}`);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadInitialData();
    return () => { isMounted = false; };
  }, [isAdmin]);

  // 🎯 Filtrage combiné : Recherche + Catégorie
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const name = product.name?.toLowerCase() || "";
      const desc = product.description?.toLowerCase() || "";
      const search = searchTerm.toLowerCase();
      
      const matchesSearch = name.includes(search) || desc.includes(search);
      const matchesCategory = selectedCategory === "Tous" || product.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  const openAiAssistant = () => {
    const width = 450, height = 650;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    window.open(
      'https://bienvenuechezdou2845.pinet.com',
      'AssistantDoubleKing',
      `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,resizable=yes`
    );
  };

  // 🎯 Rendu Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <Loader className="animate-spin mb-4 text-blue-600" size={48} />
        <p className="text-slate-500 font-black uppercase text-[10px] tracking-[0.2em]">
          Double King Shop • Bunia
        </p>
        <p className="text-slate-400 text-xs mt-2 italic">Chargement du catalogue...</p>
      </div>
    );
  }

  // 🎯 Rendu Erreur
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-[2.5rem] p-8 max-w-md text-center shadow-xl border border-amber-100">
          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="text-amber-500" size={32} />
          </div>
          <h2 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tighter">Oups !</h2>
          <p className="text-slate-500 text-sm mb-6 leading-relaxed">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-blue-700 transition shadow-lg shadow-blue-200"
          >
            Réessayer la connexion
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      
      {/* --- NAVBAR --- */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-100 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="text-xl font-black tracking-tighter text-blue-600 uppercase italic">
            Double King<span className="text-slate-900"> Shop</span>
          </Link>

          <div className="flex items-center gap-2 md:gap-4">
            <button 
              onClick={() => setIsCartOpen(!isCartOpen)}
              className="relative p-2 bg-slate-50 rounded-full text-slate-600 hover:bg-blue-50 transition-all"
            >
              <ShoppingCart size={22} />
              {getCartCount() > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full border-2 border-white animate-pulse">
                  {getCartCount()}
                </span>
              )}
            </button>
            <Link 
              to="/login" 
              className="hidden sm:flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-blue-700"
            >
              <UserCircle size={18} /> Administration
            </Link>
            <button className="md:hidden p-2" onClick={() => setIsMenuOpen(true)}>
              <Menu size={24} />
            </button>
          </div>
        </div>
      </nav>

      {/* --- SECTION HÉROS --- */}
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden bg-slate-900 pt-16">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 to-transparent z-10" />
        <img 
          src="https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80" 
          className="absolute inset-0 w-full h-full object-cover opacity-40"
          alt="IT Equipment"
        />
        <div className="relative z-20 max-w-4xl px-6 text-center">
          <span className="inline-block bg-blue-500/20 text-blue-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-6 border border-blue-500/30">
            Bunia • Ituri • RDC
          </span>
          <h2 className="text-4xl md:text-6xl font-black text-white leading-[1.1] mb-8 tracking-tighter uppercase italic">
            Qualité informatique <br/> 
            <span className="text-blue-500">au meilleur prix.</span>
          </h2>
          <a href="#products" className="px-8 py-4 bg-white text-slate-900 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-50 shadow-xl inline-block transition-transform active:scale-95">
            Voir le stock
          </a>
        </div>
      </section>

      {/* --- GRILLE PRODUITS --- */}
      <main id="products" className="max-w-7xl mx-auto px-4 py-12">
        <div className="relative max-w-md mx-auto mb-10">
          <input 
            type="text" 
            placeholder="Chercher un accessoire..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-[2rem] border-2 border-white focus:border-blue-600 outline-none shadow-sm font-medium"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-slate-200">
            <AlertCircle className="mx-auto mb-4 text-slate-300" size={48} />
            <p className="text-slate-400 font-bold uppercase tracking-widest">Aucun produit trouvé</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onQuickView={setQuickViewProduct}
              />
            ))}
          </div>
        )}
      </main>

      {/* --- FOOTER --- */}
      <footer className="bg-slate-900 text-slate-500 py-10 text-center text-[10px] uppercase tracking-widest">
        <p>© {new Date().getFullYear()} Double King Shop • Bunia</p>
      </footer>

      {/* --- BOUTON IA --- */}
      {!isCartOpen && (
        <div className="fixed bottom-6 right-6 z-[100]">
          <button 
            onClick={openAiAssistant}
            className="bg-slate-900 text-white p-4 rounded-full shadow-2xl border border-white/10 hover:scale-110 transition-transform"
          >
            <Sparkles size={24} className="text-yellow-400" />
          </button>
        </div>
      )}

      {/* --- MODAL --- */}
      {quickViewProduct && (
        <QuickViewModal 
          product={quickViewProduct}
          isOpen={!!quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
};

export default Home;
