import React, { useEffect, useState } from 'react';
import { collection, query, limit, onSnapshot, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import ProductCard from '../components/ProductCard';
import { motion } from 'motion/react';
import { Sparkles, ArrowRight, ShieldCheck, Zap, MessageSquare } from 'lucide-react';

import { useTranslation } from 'react-i18next';

const Home = () => {
  const [products, setProducts] = useState<any[]>([]);
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [siteSettings, setSiteSettings] = useState({
    storeName: 'GameMarket',
    tagline: 'O seu marketplace definitivo de itens digitais',
    activeBanner: 'https://picsum.photos/seed/market/1200/400'
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
      if (s.exists()) setSiteSettings(s.data() as any);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings/site');
    });

    return () => { unsubscribe(); unsubSettings(); };
  }, []);

  return (
    <div className="space-y-12 pb-20">
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
            <Sparkles className="w-3 h-3 md:w-4 md:h-4" /> Oferta Especial Ativa
          </motion.div>
          
          <div className="space-y-1 md:space-y-2">
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase italic leading-none drop-shadow-2xl"
            >
              {siteSettings.storeName}
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-steam-accent max-w-2xl text-sm md:text-xl font-medium tracking-tight opacity-80 line-clamp-2 md:line-clamp-none"
            >
              {siteSettings.tagline}
            </motion.p>
          </div>

          <motion.button 
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             transition={{ delay: 0.6 }}
             className="bg-steam-blue hover:bg-opacity-80 text-steam-dark px-6 py-3 md:px-10 md:py-4 rounded-xl md:rounded-2xl font-black transition-all flex items-center gap-2 md:gap-3 shadow-2xl uppercase italic tracking-widest text-xs md:text-sm hover:scale-105 active:scale-95"
          >
            Ver Coleção <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
          </motion.button>
        </div>
      </section>

      {/* Trust Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        <HomeBadge icon={<ShieldCheck className="text-steam-green" />} title="Compra Segura" desc="Intermediação garantida 100%" />
        <HomeBadge icon={<Zap className="text-yellow-400" />} title="Entrega Ágil" desc="Sistema de envio automático 24h" />
        <HomeBadge icon={<MessageSquare className="text-steam-blue" />} title="Suporte Real" desc="Chat diretivo com vendedores" />
      </div>

      {/* Categories Gallery */}
      <section className="space-y-8">
        <div className="flex items-center justify-between border-b border-white/5 pb-6">
          <h2 className="text-3xl font-black uppercase tracking-tighter italic text-white flex items-center gap-4">
            <div className="w-1.5 h-8 bg-gradient-to-b from-steam-orange to-orange-600 rounded-full shadow-[0_0_15px_rgba(244,153,30,0.5)]" />
            {t('home.popular_services')}
          </h2>
          <div className="flex items-center gap-2 text-steam-accent text-[10px] uppercase font-black tracking-widest opacity-30 hover:opacity-100 transition-opacity cursor-pointer">
            {t('home.drag_more')} <ArrowRight className="w-4 h-4" />
          </div>
        </div>

        <div className="flex gap-6 overflow-x-auto pb-8 snap-x no-scrollbar scroll-smooth">
          <CategoryCard 
            image="https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&q=80&w=400" 
            title="Assinaturas Premium" 
            badge="Destaque"
          />
          <CategoryCard 
            image="https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&q=80&w=400" 
            title="Serviços Digitais" 
          />
          <CategoryCard 
            image="https://images.unsplash.com/photo-1585670210693-e7fdd16b142e?auto=format&fit=crop&q=80&w=400" 
            title="Steam" 
          />
          <CategoryCard 
            image="https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?auto=format&fit=crop&q=80&w=400" 
            title="Epic Games" 
          />
          <CategoryCard 
            image="https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=400" 
            title="Contas Email" 
          />
          <CategoryCard 
            image="https://images.unsplash.com/photo-1614680376593-902f74cf0d41?auto=format&fit=crop&q=80&w=400" 
            title="Discord" 
          />
          <CategoryCard 
            image="https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?auto=format&fit=crop&q=80&w=400" 
            title="Redes Sociais" 
          />
          <CategoryCard 
            image="https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&q=80&w=400" 
            title="Cursos" 
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
            {t('home.updated_now', 'Updated Now')} <div className="w-2 h-2 bg-steam-green rounded-full animate-pulse shadow-[0_0_10px_rgb(164,203,50)]" />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="aspect-[4/5] bg-steam-card/20 animate-pulse rounded-3xl" />
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
                <p className="font-black uppercase italic tracking-widest">Nenhuma oferta disponível no momento</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const HomeBadge = ({ icon, title, desc }: any) => (
  <div className="bg-steam-card/10 backdrop-blur-sm border border-steam-card/40 p-6 rounded-3xl flex items-center gap-5 hover:border-steam-blue/30 transition-all group overflow-hidden">
    <div className="w-14 h-14 bg-steam-dark/50 rounded-2xl flex items-center justify-center border border-steam-card group-hover:bg-steam-blue/10 transition-all shadow-inner">{icon}</div>
    <div>
      <h3 className="text-sm font-black text-white uppercase italic tracking-widest mb-0.5">{title}</h3>
      <p className="text-[10px] text-steam-accent opacity-50 uppercase font-bold tracking-tight">{desc}</p>
    </div>
  </div>
);

const CategoryCard = ({ image, title, badge }: any) => (
  <motion.div 
    whileHover={{ y: -10 }}
    className="relative flex-none w-[220px] aspect-[2/3] rounded-[2rem] overflow-hidden group cursor-pointer snap-start border border-steam-card/40 shadow-2xl"
  >
    <img src={image} alt={title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
    {badge && (
      <div className="absolute top-6 right-6 bg-steam-green text-steam-dark px-3 py-1 rounded-full font-black text-[8px] uppercase tracking-widest italic shadow-xl">
        {badge}
      </div>
    )}
    <div className="absolute bottom-8 left-6 right-6">
      <h3 className="text-xl font-black text-white uppercase italic tracking-tighter leading-tight drop-shadow-lg">{title}</h3>
    </div>
  </motion.div>
);

export default Home;

