import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Package, User, ShoppingCart, LogOut, LayoutDashboard, X, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { useCart } from '../contexts/CartContext';
import { auth, db } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { collection, onSnapshot, query, limit } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';

import { useTranslation } from 'react-i18next';

const Navbar = () => {
  const { user, profile } = useAuth();
  const { settings } = useSettings();
  const { items } = useCart();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch products once for immediate searching
    const q = query(collection(db, 'products'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(data);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      const filtered = products.filter(p => 
        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 6);
      setFilteredProducts(filtered);
      setShowSearchDropdown(true);
    } else {
      setFilteredProducts([]);
      setShowSearchDropdown(false);
    }
  }, [searchQuery, products]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const handleProductClick = (productId: string) => {
    navigate(`/product/${productId}`);
    setSearchQuery('');
    setShowSearchDropdown(false);
  };

  const storeName = settings.siteName || 'MoshiShop';

  return (
    <nav className="bg-steam-dark border-b border-white/5 sticky top-0 z-50 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 group flex-none">
          <div className="w-8 h-8 bg-white flex items-center justify-center rounded-lg shadow-xl group-hover:scale-110 transition-transform">
            <Package className="w-4 h-4 text-black" />
          </div>
          <span className="text-xl font-black text-white italic tracking-tighter uppercase whitespace-nowrap">
            {storeName}
          </span>
        </Link>

        <div className="flex-1 max-w-xl relative hidden md:block" ref={searchRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-steam-accent/50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.trim().length > 1 && setShowSearchDropdown(true)}
              placeholder={t('navbar.search_placeholder', 'Search for games or services...')}
              className="w-full bg-steam-bg border border-steam-card rounded-md py-1.5 pl-10 pr-10 focus:outline-none focus:border-steam-blue text-sm transition-colors text-white"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-steam-accent hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <AnimatePresence>
            {showSearchDropdown && filteredProducts.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-steam-dark border border-steam-card rounded-xl shadow-2xl overflow-hidden z-50 overflow-y-auto max-h-[400px]"
              >
                <div className="p-2 border-b border-steam-card bg-steam-card/10">
                  <span className="text-[10px] font-black uppercase tracking-widest text-steam-accent opacity-50 px-2">Recomendaciones</span>
                </div>
                <div className="divide-y divide-steam-card/30">
                  {filteredProducts.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => handleProductClick(product.id)}
                      className="w-full flex items-center gap-4 p-3 hover:bg-steam-blue/10 transition-colors group text-left"
                    >
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-steam-card flex-none border border-steam-card/40">
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-bold text-sm truncate uppercase italic tracking-tighter">{product.name}</h4>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-steam-blue font-black uppercase">{product.category}</span>
                          <span className="text-xs text-steam-green font-bold italic">$ {product.price?.toFixed(2)}</span>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-steam-accent opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-3 md:gap-6">
          <button className="md:hidden text-steam-accent hover:text-white transition-colors">
            <Search className="w-6 h-6" />
          </button>
          
          <Link to="/cart" className="relative text-steam-accent hover:text-white transition-colors">
            <ShoppingCart className="w-6 h-6" />
            {items.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-steam-blue text-steam-dark text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {items.length}
              </span>
            )}
          </Link>

          {user ? (
            <div className="flex items-center gap-3 md:gap-4">
              {profile?.role === 'admin' && (
                <Link to="/admin" className="text-steam-accent hover:text-steam-blue transition-colors">
                  <LayoutDashboard className="w-6 h-6" />
                </Link>
              )}
              <Link to="/profile" className="flex items-center gap-2 group">
                {profile?.photoURL ? (
                  <img 
                    src={profile.photoURL} 
                    alt="Profile" 
                    className="w-7 h-7 md:w-8 md:h-8 rounded-full border border-steam-blue object-cover shadow-lg group-hover:scale-105 transition-transform"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-7 h-7 md:w-8 md:h-8 rounded bg-steam-card flex items-center justify-center group-hover:bg-steam-blue transition-colors">
                    <User className="w-4 h-4 md:w-5 md:h-5 text-white" />
                  </div>
                )}
                <span className="text-sm font-medium hidden lg:inline">{profile?.displayName || profile?.email?.split('@')[0]}</span>
              </Link>
              <button 
                onClick={handleLogout}
                className="text-steam-accent hover:text-red-400 transition-colors hidden sm:block"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <Link 
              to="/login"
              className="bg-steam-blue hover:bg-opacity-80 text-steam-dark px-3 py-1 md:px-4 md:py-1.5 rounded font-bold text-xs md:text-sm transition-all uppercase italic"
            >
              {t('navbar.login')}
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
