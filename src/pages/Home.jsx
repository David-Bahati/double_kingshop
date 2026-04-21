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
import apiService from '../services/api';

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
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const [prodData, catData] = await Promise.all([
          apiService.getProducts(),
          apiService.getCategories()
        ]);
        
        // 🔒 Filtrage : seuls les produits publiés sont visibles (sauf admin)
        const visibleProducts = isAdmin           ? (prodData || []) 
          : (prodData || []).filter(p => p.published === true);
        
        setProducts(visibleProducts);
        setCategories(catData || []);
        setError(null);
      } catch (err) {
        console.error('Erreur DKS:', err);
        setError('Impossible de charger le catalogue.');
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, [isAdmin]);

  // 🎯 Filtrage combiné : Recherche + Catégorie
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "Tous" || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  // 🎯 Handlers
  const handleQuickView = (product) => setQuickViewProduct(product);
  const handleAddToCart = async (product) => {
    // La logique d'ajout est gérée par useCart() dans ProductCard
    // Ici on peut ajouter un feedback si besoin
  };

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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="animate-spin mx-auto mb-4 text-blue-600" size={48} />          <p className="text-slate-500 font-medium">Chargement de Double King Shop...</p>
        </div>
      </div>
    );
  }

  // 🎯 Rendu Erreur
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md text-center shadow-sm border border-amber-100">
          <AlertCircle className="mx-auto mb-4 text-amber-500" size={48} />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Oups !</h2>
          <p className="text-slate-500 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition"
          >
            Réessayer
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
            {/* Panier */}
            <button 
              onClick={() => setIsCartOpen(!isCartOpen)}
              className="relative p-2 bg-slate-50 rounded-full text-slate-600 hover:bg-blue-50 transition-all"
              aria-label="Ouvrir le panier"
            >
              <ShoppingCart size={22} />
              {getCartCount() > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full border-2 border-white animate-pulse">
                  {getCartCount()}
                </span>
              )}
            </button>
                        {/* Admin Link */}
            <Link 
              to="/login" 
              className="hidden sm:flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-blue-700 transition-all"
            >
              <UserCircle size={18} /> Administration
            </Link>
            
            {/* Mobile Menu Toggle */}
            <button className="md:hidden p-2" onClick={() => setIsMenuOpen(true)} aria-label="Menu">
              <Menu size={24} />
            </button>
          </div>
        </div>
      </nav>

      {/* --- MENU MOBILE --- */}
      {isMenuOpen && (
        <>
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60]" onClick={() => setIsMenuOpen(false)} />
          <div className="fixed left-0 top-0 h-full w-72 bg-white z-[70] shadow-2xl p-6 animate-slideInLeft">
            <div className="flex justify-between items-center mb-10">
              <span className="font-black text-blue-600 italic uppercase">DKS Menu</span>
              <button onClick={() => setIsMenuOpen(false)} className="p-2 bg-slate-50 rounded-full hover:bg-slate-100 transition">
                <X size={20}/>
              </button>
            </div>
            <nav className="flex flex-col gap-4">
              <Link 
                to="/login" 
                onClick={() => setIsMenuOpen(false)} 
                className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl font-bold text-slate-700 hover:bg-slate-100 transition"
              >
                <UserCircle size={20} /> Administration
              </Link>
              <Link 
                to="/products" 
                onClick={() => setIsMenuOpen(false)} 
                className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl font-bold text-slate-700 hover:bg-slate-100 transition"
              >
                <ShoppingCart size={20} /> Catalogue Complet
              </Link>
            </nav>
          </div>
        </>
      )}

      {/* --- SECTION HÉROS --- */}
      <section className="relative h-[70vh] flex items-center justify-center overflow-hidden bg-slate-900 pt-16">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 to-transparent z-10" />        <img 
          src="https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80" 
          className="absolute inset-0 w-full h-full object-cover opacity-40"
          alt="IT Equipment Bunia"
        />
        <div className="relative z-20 max-w-4xl px-6 text-center lg:text-left lg:ml-[-20%]">
          <span className="inline-block bg-blue-500/20 text-blue-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-6 border border-blue-500/30 backdrop-blur-sm">
            Double King Shop • Bunia
          </span>
          <h2 className="text-5xl md:text-6xl font-black text-white leading-[1.1] mb-8 tracking-tighter uppercase italic">
            Qualité informatique <br/> 
            <span className="text-blue-500">au cœur de l'Ituri.</span>
          </h2>
          <a href="#products" className="px-8 py-4 bg-white text-slate-900 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-50 transition-all shadow-xl inline-block hover:shadow-2xl">
            Découvrir le stock
          </a>
        </div>
      </section>

      {/* --- PANIER LATÉRAL --- */}
      {isCartOpen && (
        <>
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60]" onClick={() => setIsCartOpen(false)} />
          <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-[70] shadow-2xl p-8 flex flex-col animate-slideInRight">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Mon Panier</h2>
              <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar">
              {cartItems.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                  <ShoppingCart size={48} className="mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Le panier est vide</p>
                  <button onClick={() => setIsCartOpen(false)} className="mt-4 text-blue-600 font-bold text-sm hover:underline">
                    Continuer mes achats →
                  </button>
                </div>
              ) : (
                cartItems.map(item => (
                  <div key={item.id} className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex justify-between items-center hover:border-blue-200 transition">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 truncate">{item.name}</p>
                      <p className="text-blue-600 text-sm font-black">{item.price?.toFixed(2)} $</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1.5 bg-white rounded-lg hover:bg-slate-100 transition">
                        <Minus size={14}/>                      </button>
                      <span className="font-black w-6 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1.5 bg-white rounded-lg hover:bg-slate-100 transition">
                        <Plus size={14}/>
                      </button>
                      <button onClick={() => removeFromCart(item.id)} className="ml-2 p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {cartItems.length > 0 && (
              <div className="mt-8 pt-8 border-t border-slate-100">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-slate-500 font-bold uppercase text-[10px] tracking-wider">Total à payer</span>
                  <span className="text-3xl font-black text-slate-900">{getCartTotal().toFixed(2)} $</span>
                </div>
                <Link 
                  to="/checkout" 
                  onClick={() => setIsCartOpen(false)} 
                  className="block py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-center shadow-lg hover:bg-blue-700 transition"
                >
                  Valider la commande
                </Link>
              </div>
            )}
          </div>
        </>
      )}

      {/* --- SECTION PRODUITS --- */}
      <main id="products" className="max-w-7xl mx-auto px-4 py-20">
        
        {/* Recherche */}
        <div className="relative max-w-md mx-auto mb-10">
          <input 
            type="text" 
            placeholder="Chercher un accessoire..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-3xl border-2 border-slate-100 focus:border-blue-600 outline-none transition-all shadow-sm font-medium bg-white"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        </div>

        {/* Filtres Catégories (Scroll Horizontal) */}
        <div className="flex gap-3 overflow-x-auto pb-8 mb-8 no-scrollbar scroll-smooth px-2">          <button
            onClick={() => setSelectedCategory("Tous")}
            className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
              selectedCategory === "Tous" 
              ? 'bg-slate-900 text-white shadow-xl border-transparent' 
              : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            Tous
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.name)}
              className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
                selectedCategory === cat.name 
                ? 'bg-blue-600 text-white shadow-xl shadow-blue-100 border-transparent' 
                : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Grille Produits */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
            <AlertCircle className="mx-auto mb-4 text-slate-300" size={48} />
            <p className="text-slate-400 font-bold uppercase tracking-widest">
              {searchTerm ? `Aucun résultat pour "${searchTerm}"` : 'Aucun produit dans cette catégorie'}
            </p>
            {(searchTerm || selectedCategory !== "Tous") && (
              <button 
                onClick={() => { setSearchTerm(""); setSelectedCategory("Tous"); }}
                className="mt-4 text-blue-600 font-bold text-sm hover:underline"
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onQuickView={handleQuickView}
                showAdminActions={false}
              />            ))}
          </div>
        )}
        
        {/* Badge "Produits publiés" pour admin */}
        {isAdmin && products.length > 0 && (
          <p className="text-center text-[10px] text-slate-400 mt-8">
            {products.filter(p => p.published).length}/{products.length} produits publiés • 
            {products.filter(p => !p.published).length} en brouillon
          </p>
        )}
      </main>

      {/* --- FOOTER SIMPLE --- */}
      <footer className="bg-slate-900 text-slate-400 py-8 text-center text-[10px] uppercase tracking-wider">
        <p>© {new Date().getFullYear()} Double King Shop • Bunia, Ituri</p>
        <p className="mt-1 text-slate-500">Expert en matériel informatique professionnel</p>
      </footer>

      {/* --- BOUTON IA ASSISTANT --- */}
      {!isCartOpen && (
        <div className="fixed bottom-6 right-6 z-[100]">
          <button 
            onClick={openAiAssistant}
            className="group flex items-center gap-3 bg-slate-900 text-white p-2 pr-6 rounded-full shadow-2xl hover:scale-105 transition-all border border-white/10 hover:shadow-blue-500/20"
            aria-label="Ouvrir l'assistant IA"
          >
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-3 rounded-full shadow-lg">
              <Sparkles size={18} className="text-yellow-300" />
            </div>
            <div className="text-left leading-none hidden sm:block">
              <p className="text-[9px] font-black text-blue-400 uppercase tracking-tighter">Support 24/7</p>
              <p className="text-xs font-bold uppercase">Assistant IA</p>
            </div>
          </button>
        </div>
      )}

      {/* --- MODAL QUICK VIEW --- */}
      <QuickViewModal 
        product={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onAddToCart={handleAddToCart}
        isAdmin={isAdmin}
      />

    </div>
  );
};
export default Home;