import React, { useState } from 'react';
import { ShoppingCart, Menu, Sparkles, LayoutGrid, UserCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';

const HomePage = () => {
  const { cartItems } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      
      {/* NAVBAR PROFESSIONNELLE */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-100 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          
          {/* Logo & Catégories */}
          <div className="flex items-center gap-8">
            <h1 className="text-xl font-black tracking-tighter text-blue-600 uppercase italic">
              Double King<span className="text-slate-900"> Shop</span>
            </h1>
            
            <button className="hidden md:flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors bg-slate-50 px-3 py-2 rounded-xl">
              <LayoutGrid size={18} />
              Catégories
            </button>
          </div>

          {/* Actions Droite */}
          <div className="flex items-center gap-2 md:gap-4">
            <button className="relative p-2 bg-slate-50 rounded-full text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-all">
              <ShoppingCart size={22} />
              {cartItems.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full border-2 border-white">
                  {cartItems.length}
                </span>
              )}
            </button>
            
            <a href="/admin/dashboard" className="hidden sm:flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all active:scale-95">
              <UserCircle size={18} />
              Administration
            </a>

            {/* Menu Mobile */}
            <button className="md:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              <Menu size={24} />
            </button>
          </div>
        </div>
      </nav>

      {/* SECTION HÉROS (CORRIGÉE) */}
      <section className="relative h-[85vh] flex items-center justify-center overflow-hidden bg-slate-900">
        {/* Overlay pour la lisibilité */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 to-transparent z-10" />
        
        {/* Image de fond (remplacez par votre URL Railway si besoin) */}
        <img 
          src="https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80" 
          className="absolute inset-0 w-full h-full object-cover opacity-50"
          alt="Tech Background"
        />

        <div className="relative z-20 max-w-4xl px-6 text-center lg:text-left lg:ml-[-20%]">
          <span className="inline-block bg-blue-500/20 text-blue-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-6 backdrop-blur-sm border border-blue-500/30">
            Marché Professionnel • Bunia
          </span>
          <h2 className="text-5xl md:text-7xl font-black text-white leading-[1.1] mb-8 tracking-tighter">
            Une vitrine digitale<br/> 
            <span className="text-blue-500 italic">façonnée pour vous.</span>
          </h2>
          <p className="text-lg text-slate-300 max-w-xl mb-10 font-medium leading-relaxed">
            Double King Shop offre un parcours d'achat propre, fluide et fiable, avec gestion de stock et paiement Pi Network simplifiés.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <button className="px-8 py-4 bg-white text-slate-900 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-50 transition-all shadow-xl">
              Voir les produits
            </button>
            <button className="px-8 py-4 bg-transparent border-2 border-white/20 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-white/10 backdrop-blur-sm transition-all">
              À propos de DKS
            </button>
          </div>
        </div>
      </section>

      {/* ASSISTANT IA FLOTTANT */}
      <div className="fixed bottom-8 right-8 z-[100]">
        <button 
          onClick={() => window.open('https://bienvenuechezdou2845.pinet.com', '_blank')}
          className="group relative flex items-center gap-3 bg-slate-900 text-white p-2 pr-6 rounded-full shadow-2xl hover:scale-105 transition-all active:scale-95 border border-white/10"
        >
          <div className="bg-blue-600 p-3 rounded-full shadow-lg group-hover:rotate-12 transition-transform">
            <Sparkles size={20} className="text-yellow-300" />
          </div>
          <div className="flex flex-col items-start">
            <span className="text-[10px] font-black text-blue-400 uppercase tracking-tighter">En ligne</span>
            <span className="text-xs font-bold uppercase tracking-widest">Assistant IA</span>
          </div>
        </button>
      </div>

    </div>
  );
};

export default HomePage;
