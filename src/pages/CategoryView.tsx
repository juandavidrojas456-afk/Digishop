import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import ProductCard from '../components/ProductCard';
import { motion } from 'motion/react';
import { ArrowLeft, Sparkles, Filter } from 'lucide-react';

const CategoryView = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!categoryId) return;

    const q = query(
      collection(db, 'products'),
      where('category', '==', categoryId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `products/${categoryId}`);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [categoryId]);

  return (
    <div className="space-y-12 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-8">
        <div className="space-y-4">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-white/40 hover:text-white transition-colors uppercase font-black text-[10px] tracking-widest group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Volver al Inicio
          </button>
          <div className="space-y-2">
            <h1 className="text-4xl md:text-6xl font-black text-white italic uppercase tracking-tighter leading-none">
              {categoryId}
            </h1>
            <p className="text-steam-accent opacity-50 uppercase font-black text-xs tracking-[0.2em]">
              Explorando la categoría {categoryId}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-white/5 border border-white/10 px-6 py-4 rounded-2xl flex items-center gap-3">
             <Filter className="w-4 h-4 text-steam-blue" />
             <span className="text-white font-black text-xs uppercase italic">{products.length} Productos</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="aspect-video bg-steam-card/20 animate-pulse rounded-3xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
          {products.length > 0 ? (
            products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-32 flex flex-col items-center justify-center text-steam-accent/20 bg-white/[0.02] rounded-[3rem] border border-dashed border-white/5">
              <Sparkles className="w-16 h-16 mb-6 opacity-10" />
              <p className="font-black uppercase italic tracking-[0.4em] text-sm">No hay productos en esta categoría</p>
              <button 
                onClick={() => navigate('/')}
                className="mt-8 text-steam-blue hover:underline uppercase font-black text-[10px] tracking-widest"
              >
                Ver otros productos
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CategoryView;
