import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShoppingCart, 
  Menu, 
  Sparkles, 
  LayoutGrid, 
  UserCircle, 
  X, 
  Plus, 
  Minus, 
  Trash2,
  Search // Import de l'icône de recherche
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/Product/ProductCard';
import apiService from '../services/api';

const Home = () => {
  // --- ÉTATS ---
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(""); // État pour la recherche

  const {
    cartItems,
    getCartCount,
    getCartTotal,
    removeFromCart,
    updateQuantity,
    clearCart,
    isCartOpen,
    setIsCartOpen
  } = useCart();

  // --- FONCTION POP-UP POUR L'IA (Règle le blocage Pi Network) ---
  const openAiAssistant = () => {
    const width = 450;
    const height = 650;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    
    window.open(
      'https://bienvenuechezdou2845.pinet.com',
      'AssistantDoubleKing',
      `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,resizable=yes`
    );
  };

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await apiService.getProducts();
        setProducts(data || []);
      } catch (err) {
        console.error('Erreur chargement produits:', err);
        setError('Impossible de charger les produits pour le moment.');
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  // --- FILTRAGE DES PRODUITS ---
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      
      {/* --- NAVBAR --- */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-100 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-xl font-black tracking-tighter text-blue-600 uppercase italic">
              Double King<span className="text-slate-900"> Shop</span>
            </Link>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <button 
              onClick={() => setIsCartOpen(!isCartOpen)}
              className="relative p-2 bg-slate-50 rounded-full text-slate-600 hover:bg-blue-50 transition-all"
            >
              <ShoppingCart size={22} />
              {getCartCount() > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full border-2 border-white">
                  {getCartCount()}
                </span>
              )}
            </button>
            
            <Link to="/login" className="hidden sm:flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-blue-700 transition-all">
              <UserCircle size={18} /> Administration
            </Link>

            <button className="md:hidden p-2" onClick={() => setIsMenuOpen(true)}>
              <Menu size={24} />
            </button>
          </div>
        </div>
      </nav>

      {/* --- MENU MOBILE (PANNEAU LATÉRAL) --- */}
      {isMenuOpen && (
        <>
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60]" onClick={() => setIsMenuOpen(false)} />
          <div className="fixed left-0 top-0 h-full w-72 bg-white z-[70] shadow-2xl p-6 flex flex-col animate-in slide-in-from-left duration-300">
            <div className="flex justify-between items-center mb-10">
              <span className="font-black text-blue-600 italic uppercase">DKS Menu</span>
              <button onClick={() => setIsMenuOpen(false)} className="p-2 bg-slate-50 rounded-full"><X size={20}/></button>
            </div>
            <nav className="flex flex-col gap-4">
              <a href="#products" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl font-bold text-slate-700 hover:text-blue-600 transition-all">
                <LayoutGrid size={20} /> Catalogue
              </a>
              <Link to="/login" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl font-bold text-slate-700 hover:text-blue-600 transition-all">
                <UserCircle size={20} /> Administration
              </Link>
              <hr className="my-2 border-slate-100" />
              <div className="px-4 py-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact Bunia</span>
                <p className="font-bold text-sm text-slate-600 mt-1">+243 823 038 945</p>
              </div>
            </nav>
          </div>
        </>
      )}

      {/* --- SECTION HÉROS --- */}
      <section className="relative h-[85vh] flex items-center justify-center overflow-hidden bg-slate-900 pt-16">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 to-transparent z-10" />
        <img 
          src="https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80" 
          className="absolute inset-0 w-full h-full object-cover opacity-40"
          alt="IT Accessories Bunia"
        />
        <div className="relative z-20 max-w-4xl px-6 text-center lg:text-left lg:ml-[-20%]">
          <span className="inline-block bg-blue-500/20 text-blue-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-6 backdrop-blur-sm border border-blue-500/30">
            Expert IT à Bunia • Double King Shop
          </span>
          <h2 className="text-5xl md:text-7xl font-black text-white leading-[1.1] mb-8 tracking-tighter">
            Une vitrine digitale<br/> 
            <span className="text-blue-500 italic">façonnée pour vous.</span>
          </h2>
          <p className="text-lg text-slate-300 max-w-xl mb-10 font-medium leading-relaxed">
            Accessoires informatiques et conseils techniques avec paiement Pi Network.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <a href="#products" className="px-8 py-4 bg-white text-slate-900 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-50 transition-all shadow-xl text-center">
              Voir les produits
            </a>
          </div>
        </div>
      </section>

      {/* --- PANIER LATÉRAL --- */}
      {isCartOpen && (
        <>
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60]" onClick={() => setIsCartOpen(false)} />
          <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-[70] shadow-2xl p-8 flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Mon Panier</h2>
              <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-slate-100 rounded-full"><X /></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4">
              {cartItems.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                  <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Le panier est vide</p>
                </div>
              ) : (
                cartItems.map(item => (
                  <div key={item.id} className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <div className="flex justify-between font-bold text-slate-900 mb-3">
                      <span>{item.name}</span>
                      <span className="text-blue-600">{item.price} $</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 bg-white rounded-xl p-1 border border-slate-200">
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1 hover:text-blue-600"><Minus size={16}/></button>
                        <span className="font-black text-sm w-4 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1 hover:text-blue-600"><Plus size={16}/></button>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} className="text-red-500 p-2 hover:bg-red-50 rounded-xl transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            {cartItems.length > 0 && (
              <div className="mt-8 pt-8 border-t border-slate-100">
                <div className="flex justify-between items-center mb-6 px-2">
                  <span className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em]">Total</span>
                  <span className="text-3xl font-black text-slate-900">{getCartTotal().toFixed(2)} $</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={clearCart} className="py-4 rounded-2xl border-2 border-slate-100 font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-all">Vider</button>
                  <Link to="/checkout" onClick={() => setIsCartOpen(false)} className="py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest text-center shadow-lg hover:bg-blue-700 transition-all">Valider</Link>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* --- LISTE DES PRODUITS & RECHERCHE --- */}
      <main id="products" className="max-w-7xl mx-auto px-4 py-24">
        
        {/* BARRE DE RECHERCHE */}
        <div className="relative max-w-md mx-auto mb-16 px-4">
          <input 
            type="text" 
            placeholder="Rechercher un accessoire..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-100 focus:border-blue-600 outline-none transition-all shadow-sm font-medium"
          />
          <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 px-4">
          <div>
            <span className="text-blue-600 font-black uppercase text-[10px] tracking-[0.4em] mb-4 block">Catalogue DKS</span>
            <h3 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Nos Produits Disponibles</h3>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-pulse">
            {[1, 2, 3].map(i => <div key={i} className="h-80 bg-slate-200 rounded-3xl" />)}
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-8 rounded-3xl text-center font-bold border border-red-100">{error}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
            {filteredProducts.length === 0 && (
              <div className="col-span-full text-center py-20 text-slate-400 font-bold uppercase tracking-widest">
                Aucun résultat pour "{searchTerm}"
              </div>
            )}
          </div>
        )}
      </main>

      {/* --- BOUTON IA (Seulement si le panier est fermé) --- */}
      {!isCartOpen && (
        <div className="fixed bottom-8 right-8 z-[100]">
          <button 
            onClick={openAiAssistant}
            className="group relative flex items-center gap-3 bg-slate-900 text-white p-2 pr-6 rounded-full shadow-2xl hover:scale-105 transition-all active:scale-95 border border-white/10"
          >
            <div className="bg-blue-600 p-3 rounded-full shadow-lg group-hover:rotate-12 transition-transform">
              <Sparkles size={20} className="text-yellow-300" />
            </div>
            <div className="flex flex-col items-start text-left">
              <span className="text-[10px] font-black text-blue-400 uppercase tracking-tighter">En ligne</span>
              <span className="text-xs font-bold uppercase tracking-widest">Assistant IA</span>
            </div>
          </button>
        </div>
      )}

    </div>
  );
};

export default Home;
