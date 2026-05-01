import React, { useEffect, useState } from 'react';
import { collection, query, limit, onSnapshot, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import ProductCard from '../components/ProductCard';
import { motion } from 'motion/react';
import { Sparkles, ArrowRight, ShieldCheck, Zap, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Home = () => {
  const [products, setProducts] = useState<any[]>([]);
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [siteSettings, setSiteSettings] = useState({
    storeName: 'Steam offline',
    tagline: 'cuentas de steam',
    activeBanner: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=1200'
  });

  useEffect(() => {
    const q = query(collection(db, 'products'), limit(20));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'products');
    });

    const unsubSettings = onSnapshot(doc(db, 'settings', 'site'), (s) => {
      if (s.exists()) {
        const data = s.data() as any;
        setSiteSettings({
          storeName: data.storeName || 'Steam offline',
          tagline: data.tagline || 'cuentas de steam',
          activeBanner: data.activeBanner || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=1200'
        });
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings/site');
    });

    return () => { unsubscribe(); unsubSettings(); };
  }, []);

  return (
    <div className="space-y-12 pb-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <section className="relative h-[350px] md:h-[450px] rounded-2xl md:rounded-[2rem] overflow-hidden group shadow-2xl border border-steam-card/40">
        <img 
          src={siteSettings.activeBanner} 
          alt="Featured" 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-steam-dark via-steam-dark/40 to-transparent" />
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
        
        <div className="absolute bottom-6 left-6 right-6 md:bottom-12 md:left-12 md:right-12 space-y-4 md:space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-steam-blue text-steam-dark px-3 py-1.5 md:px-4 md:py-2 rounded-full font-black text-[8px] md:text-[10px] uppercase tracking-widest shadow-xl italic"
          >
            <Sparkles className="w-3 h-3 md:w-4 md:h-4" /> Oferta Especial Activa
          </motion.div>
          
          <div className="space-y-1 md:space-y-2">
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase italic leading-none drop-shadow-2xl"
            >
              Steam offline
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-steam-accent max-w-2xl text-sm md:text-xl font-medium tracking-tight opacity-80 line-clamp-2 md:line-clamp-none"
            >
              cuentas de steam
            </motion.p>
          </div>

          <motion.button 
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             transition={{ delay: 0.6 }}
             onClick={() => navigate('/category/Steam Offline')}
             className="bg-steam-blue hover:bg-opacity-80 text-steam-dark px-6 py-3 md:px-10 md:py-4 rounded-xl md:rounded-2xl font-black transition-all flex items-center gap-2 md:gap-3 shadow-2xl uppercase italic tracking-widest text-xs md:text-sm hover:scale-105 active:scale-95"
          >
            Ver Colección <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
          </motion.button>
        </div>
      </section>

      {/* Trust Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        <HomeBadge icon={<ShieldCheck className="text-steam-green" />} title="Compra Segura" desc="Intermediación garantizada 100%" />
        <HomeBadge icon={<Zap className="text-yellow-400" />} title="Entrega Ágil" desc="Envío automático 24h" />
        <HomeBadge icon={<MessageSquare className="text-steam-blue" />} title="Soporte Real" desc="Chat directo con vendedores" />
      </div>

      {/* Categories Gallery */}
      <section className="space-y-8">
        <div className="flex items-center justify-between border-b border-white/5 pb-6">
          <h2 className="text-3xl font-black uppercase tracking-tighter italic text-white flex items-center gap-4">
            <div className="w-1.5 h-8 bg-gradient-to-b from-steam-orange to-orange-600 rounded-full shadow-[0_0_15px_rgba(244,153,30,0.5)]" />
            Categorías populares
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          <CategoryCard 
            image="https://cdn-icons-png.flaticon.com/512/3003/3003661.png" 
            title="Cuentas" 
            badge="Top"
            onClick={() => navigate('/category/Cuentas')}
          />
          <CategoryCard 
            image="https://cdn-icons-png.flaticon.com/512/888/888879.png" 
            title="Steam Offline" 
            onClick={() => navigate('/category/Steam Offline')}
          />
          <CategoryCard 
            image="https://cdn-icons-png.flaticon.com/512/2306/2306121.png" 
            title="Steam Keys" 
            onClick={() => navigate('/category/Steam Keys')}
          />
          <CategoryCard 
            image="https://cdn-icons-png.flaticon.com/512/3408/3408506.png" 
            title="Gaming" 
            onClick={() => navigate('/category/Epic Games')}
          />
          <CategoryCard 
            image="https://cdn-icons-png.flaticon.com/512/1055/1055683.png" 
            title="Software" 
            onClick={() => navigate('/category/Software')}
          />
          <CategoryCard 
            image="https://cdn-icons-png.flaticon.com/512/1150/1150592.png" 
            title="Recursos Dev" 
            onClick={() => navigate('/category/Cursos')}
          />
          <CategoryCard 
            image="https://cdn-icons-png.flaticon.com/512/3114/3114883.png" 
            title="Social Growth" 
            onClick={() => navigate('/category/Redes Sociales')}
          />
          <CategoryCard 
            image="https://cdn-icons-png.flaticon.com/512/2436/2436702.png" 
            title="Conocimiento" 
            onClick={() => navigate('/category/Cursos')}
          />
        </div>
      </section>

      {/* Products Grid */}
      <div className="space-y-8">
        <div className="flex items-center justify-between border-b border-white/5 pb-6">
          <h2 className="text-3xl font-black uppercase tracking-tighter italic text-white flex items-center gap-4">
            <div className="w-1.5 h-8 bg-gradient-to-b from-steam-blue to-blue-600 rounded-full shadow-[0_0_15px_rgba(102,192,244,0.5)]" />
            {t('home.all_products')}
          </h2>
          <div className="flex items-center gap-2 text-steam-accent text-[10px] uppercase font-black tracking-widest opacity-30">
            {t('home.updated_now', 'Actualizado ahora')} <div className="w-2 h-2 bg-steam-green rounded-full animate-pulse shadow-[0_0_10px_rgb(164,203,50)]" />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="aspect-video bg-steam-card/20 animate-pulse rounded-3xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
            {products.length > 0 ? products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (index % 4) * 0.1 }}
              >
                <ProductCard product={product} />
              </motion.div>
            )) : (
              <div className="col-span-full py-20 flex flex-col items-center justify-center text-steam-accent/40 bg-steam-card/5 rounded-[2rem] border border-dashed border-steam-card">
                <Sparkles className="w-12 h-12 mb-4 opacity-10" />
                <p className="font-black uppercase italic tracking-widest">No hay ofertas disponibles en este momento</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const HomeBadge = ({ icon, title, desc }: any) => (
  <div className="bg-steam-card/10 backdrop-blur-sm border border-white/5 p-6 rounded-3xl flex items-center gap-5 hover:border-white/10 transition-all group overflow-hidden">
    <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5 group-hover:bg-white/10 transition-all shadow-inner">{icon}</div>
    <div>
      <h3 className="text-sm font-black text-white uppercase italic tracking-widest mb-0.5">{title}</h3>
      <p className="text-[10px] text-steam-accent opacity-50 uppercase font-bold tracking-tight">{desc}</p>
    </div>
  </div>
);

const CategoryCard = ({ image, title, badge, onClick }: any) => (
  <motion.div 
    whileHover={{ x: 4, scale: 1.02 }}
    onClick={onClick}
    className="relative flex items-center gap-3 bg-white/[0.03] border border-white/5 p-2 pr-4 rounded-xl group cursor-pointer hover:bg-white/[0.08] hover:border-white/10 transition-all duration-300"
  >
    <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-white/5 p-1.5 border border-white/5 group-hover:border-white/20 transition-all">
      <img src={image} alt={title} className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110" />
    </div>
    <div className="flex-1 min-w-0">
      <h3 className="text-[11px] font-black text-white/70 group-hover:text-white uppercase italic tracking-tighter truncate transition-colors leading-tight">{title}</h3>
      {badge && (
        <span className="text-[6px] font-black uppercase text-steam-orange border border-steam-orange/20 px-1 py-0.5 rounded-sm">
          {badge}
        </span>
      )}
    </div>
  </motion.div>
);

export default Home;

