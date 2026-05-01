import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  Star, Verified, ShieldCheck, Calendar, Package, 
  MessageSquare, ChevronLeft, Flag, CircleDollarSign, 
  Award, Zap, Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const SellerProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'reviews' | 'products'>('reviews');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchProfile = async () => {
      const docRef = doc(db, 'users', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setProfile({ id: docSnap.id, ...docSnap.data() });
      }
      setLoading(false);
    };

    fetchProfile();

    // Fetch products
    const pQ = query(collection(db, 'products'), where('sellerId', '==', id), limit(20));
    const unsubProducts = onSnapshot(pQ, (snapshot) => {
      setProducts(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // In a real app, we might have a 'seller_reviews' collection or aggregate. 
    // For now, let's just use some mock data to match the visual vibe if real query is too complex,
    // but better yet, let's find reviews for their products.
    const rQ = query(collection(db, 'reviews'), limit(10)); // Simplified for demo
    const unsubReviews = onSnapshot(rQ, (snapshot) => {
      setReviews(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubProducts();
      unsubReviews();
    };
  }, [id]);

  if (loading) return (
    <div className="h-96 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-steam-blue"></div>
    </div>
  );

  if (!profile) return <div className="p-20 text-center text-red-500 font-bold uppercase italic">Perfil no encontrado.</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-0 -mt-8 -mx-4 sm:-mx-8">
      {/* Banner Section */}
      <div className="relative h-64 md:h-80 bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute bottom-4 left-8">
          <button 
            onClick={() => navigate(-1)}
            className="bg-black/30 hover:bg-black/50 backdrop-blur px-4 py-2 rounded-lg text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all"
          >
            <ChevronLeft className="w-4 h-4" /> Volver
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 relative z-10 -mt-20 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-[#1A1F2E]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl space-y-8">
              <div className="relative -mt-24 mb-12">
                <div className="w-32 h-32 rounded-full border-8 border-[#1A1F2E] mx-auto overflow-hidden shadow-2xl relative">
                  <img 
                    src={profile.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.uid}`} 
                    className="w-full h-full object-cover" 
                    alt="Avatar"
                    referrerPolicy="no-referrer"
                  />
                  {profile.isOnline !== false && (
                    <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 border-4 border-[#1A1F2E] rounded-full shadow-lg" />
                  )}
                </div>
              </div>

              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <h1 className="text-2xl font-black text-white italic uppercase tracking-tighter">{profile.displayName || profile.email?.split('@')[0]}</h1>
                  <div className="bg-[#7C3AED] p-1 rounded-full"><Verified className="w-4 h-4 text-white" /></div>
                </div>
                <div className="flex items-center justify-center gap-4">
                  <div className="flex text-yellow-500">
                    <Star className="w-4 h-4 fill-current" />
                    <Star className="w-4 h-4 fill-current" />
                    <Star className="w-4 h-4 fill-current" />
                    <Star className="w-4 h-4 fill-current" />
                    <Star className="w-4 h-4 fill-current opacity-50" />
                  </div>
                  <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">4.9 (255 valoraciones)</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="text-pink-500 text-xs text-center font-bold">👋 ¡Hola! ¡Bienvenido a {profile.displayName || 'nuestra tienda'}! 👋</div>
                <p className="text-steam-accent text-sm text-center leading-relaxed">
                   El enigma ha sido resuelto: ¿cómo tener las mejores suscripciones gastando poco? La respuesta está aquí. ⚡️
                </p>
                <div className="grid grid-cols-1 gap-2 text-[11px] text-steam-accent font-medium leading-relaxed bg-white/5 p-4 rounded-xl">
                  <div>🎮 Keys de Juegos & Ítems Raros</div>
                  <div>💎 Suscripciones (Youtube y Spotify)</div>
                  <div>⚡️ Entrega Automática</div>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-white/5">
                <InfoItem icon={<Calendar className="w-4 h-4 text-[#7C3AED]" />} label="Miembro desde" value={new Date(profile.createdAt?.seconds * 1000 || profile.createdAt).toLocaleDateString()} />
                <div className="flex items-center gap-2 py-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-[10px] text-green-500 font-black uppercase tracking-widest">En Línea Ahora</span>
                </div>
              </div>

              <button className="w-full bg-white/5 border border-white/10 text-white/40 font-black py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-red-500/10 hover:text-red-500 transition-all uppercase tracking-widest text-[10px]">
                <Flag className="w-4 h-4" /> Denunciar usuario
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <StatCard icon={<CircleDollarSign className="w-6 h-6 text-green-400" />} label="Ventas Concluidas" value="853" />
               <StatCard icon={<Star className="w-6 h-6 text-yellow-400" />} label="Valoraciones" value="255" />
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex bg-[#1A1F2E]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-1 gap-1 w-fit">
              <button 
                onClick={() => setActiveTab('reviews')}
                className={`px-8 py-3 rounded-xl text-xs font-black uppercase italic tracking-widest transition-all ${activeTab === 'reviews' ? 'bg-[#7C3AED] text-white shadow-lg' : 'text-white/40 hover:text-white/70'}`}
              >
                Valoraciones
              </button>
              <button 
                onClick={() => setActiveTab('products')}
                className={`px-8 py-3 rounded-xl text-xs font-black uppercase italic tracking-widest transition-all ${activeTab === 'products' ? 'bg-[#7C3AED] text-white shadow-lg' : 'text-white/40 hover:text-white/70'}`}
              >
                Productos
              </button>
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'reviews' ? (
                <motion.div 
                  key="reviews"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="bg-[#1A1F2E]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-10 space-y-10">
                    <div className="flex flex-col md:flex-row items-center gap-10">
                      <div className="text-center md:text-left space-y-2">
                        <div className="text-6xl font-black text-white italic tracking-tighter">4.9</div>
                        <div className="flex text-yellow-500 justify-center md:justify-start">
                          {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-current" />)}
                        </div>
                        <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Basado en 255 valoraciones</p>
                      </div>

                      <div className="flex-1 space-y-2 w-full">
                        {[5, 4, 3, 2, 1].map((s) => (
                           <div key={s} className="flex items-center gap-4 group">
                             <div className="flex items-center gap-1 w-6">
                               <span className="text-[10px] font-black text-white/50">{s}</span>
                               <Star className="w-3 h-3 text-yellow-500 fill-current" />
                             </div>
                             <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                               <div 
                                 className="h-full bg-[#7C3AED] transition-all duration-1000 group-hover:brightness-125" 
                                 style={{ width: `${s === 5 ? 96 : s === 4 ? 2 : 0}%` }}
                               />
                             </div>
                             <span className="text-[10px] font-black text-white/30 w-8">{s === 5 ? '96%' : s === 4 ? '2%' : '0%'}</span>
                           </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                       <h3 className="text-sm font-black text-white uppercase italic flex items-center gap-3">
                         <Award className="w-5 h-5 text-yellow-500" /> Valoraciones del Vendedor <span className="bg-white/10 px-2 py-0.5 rounded text-[10px] opacity-50 not-italic">255</span>
                       </h3>
                       
                       <div className="grid grid-cols-1 gap-4">
                          {reviews.map((r, i) => (
                            <ReviewCard key={i} review={r} />
                          ))}
                       </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="products"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-6"
                >
                  {products.length > 0 ? products.map(product => (
                    <div 
                      key={product.id}
                      onClick={() => navigate(`/product/${product.id}`)}
                      className="bg-[#1A1F2E]/80 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden group hover:border-[#7C3AED]/40 transition-all cursor-pointer"
                    >
                      <div className="aspect-[16/10] overflow-hidden relative">
                        <img 
                          src={product.image || `https://picsum.photos/seed/${product.id}/400/250`} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                          alt="" 
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-4 right-4 bg-black/40 backdrop-blur px-3 py-1.5 rounded-xl border border-white/10 text-[10px] font-black text-white uppercase tracking-widest">
                          $ {product.price?.toFixed(2)}
                        </div>
                      </div>
                      <div className="p-6 space-y-3">
                        <div className="text-[10px] font-black text-[#7C3AED] uppercase tracking-widest">{product.category}</div>
                        <h4 className="text-white font-black uppercase italic italic text-sm tracking-tight truncate">{product.name}</h4>
                        <div className="flex items-center gap-2 pt-2 border-t border-white/5 opacity-50">
                           <Zap className="w-3 h-3 text-yellow-400 fill-current" />
                           <span className="text-[10px] font-bold uppercase tracking-tighter">Entrega Automática</span>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="col-span-2 py-20 bg-[#1A1F2E]/80 rounded-3xl border border-dashed border-white/10 text-center">
                      <p className="text-white/30 font-black uppercase italic text-sm">Este vendedor no posee productos.</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

const InfoItem = ({ icon, label, value }: { icon: any, label: string, value: string }) => (
  <div className="flex items-center justify-between text-[11px]">
    <div className="flex items-center gap-2">
      {icon}
      <span className="text-white/40 font-bold uppercase tracking-tight">{label}</span>
    </div>
    <span className="text-white font-black uppercase italic">{value}</span>
  </div>
);

const StatCard = ({ icon, label, value }: { icon: any, label: string, value: string }) => (
  <div className="bg-[#1A1F2E]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center space-y-2 hover:border-[#7C3AED]/40 transition-all group">
    <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mx-auto group-hover:bg-[#7C3AED]/10 transition-all font-black">
      {icon}
    </div>
    <div>
      <div className="text-2xl font-black text-white italic tracking-tighter">{value}</div>
      <div className="text-[8px] text-white/30 font-black uppercase tracking-widest">{label}</div>
    </div>
  </div>
);

const ReviewCard = ({ review }: any) => (
  <div className="bg-white/5 border border-white/5 rounded-2xl p-6 space-y-4 hover:bg-white/[0.07] transition-all group">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-[#7C3AED]/20 border border-white/10 flex items-center justify-center font-black text-[#7C3AED] text-xs uppercase">
          {review.userName?.charAt(0) || 'U'}
        </div>
        <div>
          <div className="text-xs font-black text-white uppercase italic tracking-tight">{review.userName || 'Comprador Anónimo'}</div>
          <div className="flex text-yellow-500 mt-1">
             {[...Array(5)].map((_, i) => (
               <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-current' : 'opacity-20'}`} />
             ))}
          </div>
        </div>
      </div>
      <span className="text-[10px] text-white/30 font-bold">{new Date(review.createdAt).toLocaleDateString()}</span>
    </div>
    <p className="text-xs text-white/60 leading-relaxed pl-14 italic border-l border-white/5">
      {review.comment}
    </p>
    <div className="flex flex-wrap gap-2 pl-14 pt-2">
       {['Excelente vendedor', 'Producto perfecto', 'Lo recomiendo mucho'].map(tag => (
         <span key={tag} className="text-[8px] font-black uppercase tracking-widest text-[#7C3AED] bg-[#7C3AED]/10 px-2 py-0.5 rounded-full border border-[#7C3AED]/20">
           {tag}
         </span>
       ))}
    </div>
  </div>
);

export default SellerProfile;
