import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, query, where, onSnapshot, updateDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { 
  ShoppingCart, ShieldCheck, Zap, Globe, Star, Send, 
  ChevronRight, MessageSquare, Info, Truck, StarHalf, Verified,
  Award, ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const ProductDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<any[]>([]);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      const docRef = doc(db, 'products', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setProduct({ id: docSnap.id, ...docSnap.data() });
      }
      setLoading(false);
    };
    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const q = query(collection(db, 'reviews'), where('productId', '==', id));
    const unsub = onSnapshot(q, (snapshot) => {
      setReviews(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    if (user) {
      const purchaseQ = query(collection(db, 'orders'), where('buyerId', '==', user.uid), where('productId', '==', id));
      onSnapshot(purchaseQ, (snapshot) => {
        setHasPurchased(!snapshot.empty);
      });
    }

    return () => unsub();
  }, [id, user]);

  const handleAddToCart = () => {
    if (!product) return;
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.images?.[0] || `https://picsum.photos/seed/${product.id}/400/300`,
      isPhysical: product.isPhysical,
      sellerId: product.sellerId,
      autoMessage: product.autoMessage,
      deliveryContent: product.deliveryContent
    });
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id) return;
    setSubmittingReview(true);
    try {
      await addDoc(collection(db, 'reviews'), {
        productId: id,
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0],
        rating,
        comment: reviewText,
        createdAt: new Date().toISOString()
      });
      setReviewText('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return (
    <div className="h-96 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-steam-blue"></div>
    </div>
  );
  if (!product) return <div className="h-96 flex items-center justify-center text-red-500 font-bold uppercase">Producto no encontrado.</div>;

  const discount = product.originalPrice && product.originalPrice > product.price 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;
  return (
    <div className="max-w-6xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-700 px-2 sm:px-0">
      <div className="flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-steam-accent opacity-50 mb-2 md:mb-4">
        <span className="hover:text-steam-blue cursor-pointer" onClick={() => navigate('/')}>Inicio</span>
        <ChevronRight className="w-3 h-3" />
        <span className="text-steam-blue">{product.category}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        <div className="lg:col-span-8 space-y-6 md:space-y-8">
          <div className="relative aspect-video rounded-2xl md:rounded-3xl overflow-hidden border border-steam-card group shadow-2xl">
            <img 
              src={product.images?.[0] || `https://picsum.photos/seed/${product.id}/1200/600`} 
              alt={product.name} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
              referrerPolicy="no-referrer" 
            />
            {discount > 0 && (
              <div className="absolute top-4 left-4 md:top-6 md:left-6 bg-steam-blue text-steam-dark px-3 py-1.5 md:px-4 md:py-2 rounded-full font-black text-xs md:text-sm shadow-xl italic">
                -{discount}% OFF
              </div>
            )}
            <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6 flex gap-2">
              <span className="bg-steam-dark/80 backdrop-blur px-2 py-1 md:px-3 md:py-1.5 rounded-lg border border-steam-card text-[8px] md:text-[10px] font-black text-steam-blue uppercase tracking-widest">
                {product.badgeType || 'PRODUCTO'}
              </span>
            </div>
          </div>
          
          <div className="bg-steam-card/20 p-6 md:p-10 rounded-2xl md:rounded-3xl border border-steam-card shadow-lg backdrop-blur-sm space-y-4 md:space-y-6">
            <div className="space-y-1 md:space-y-2">
              <h1 className="text-2xl md:text-4xl font-black text-white uppercase italic tracking-tighter leading-none">{product.name}</h1>
              <div className="flex items-center gap-4 text-xs md:text-sm font-bold">
                <div className="flex text-yellow-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-3 h-3 md:w-4 md:h-4 ${i < Math.round(reviews.reduce((a, b) => a + b.rating, 0) / (reviews.length || 1)) ? 'fill-current' : 'opacity-20'}`} />
                  ))}
                </div>
                <span className="text-steam-accent">({reviews.length} valoraciones)</span>
              </div>
            </div>
            
            <div className="prose prose-invert max-w-none">
              <p className="text-steam-accent leading-relaxed text-sm md:text-lg whitespace-pre-wrap">{product.description || 'No hay descripción detallada para este artículo.'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
            <FeatureCard icon={<ShieldCheck className="text-steam-green" />} title="Venta Protegida" desc="Garantía total de la plataforma" />
            <FeatureCard 
              icon={product.isPhysical ? <Truck className="text-yellow-400" /> : <Zap className="text-yellow-400" />} 
              title={product.isPhysical ? "Entrega Logística" : "Entrega Automática"} 
              desc={product.isPhysical ? "Rastreado por transportadora" : "Recibe instantáneamente"} 
            />
            <FeatureCard icon={<Globe className="text-steam-blue" />} title="Soporte 24/7" desc="Atención prioritaria" />
          </div>

          <div className="bg-steam-card/20 p-6 md:p-10 rounded-2xl md:rounded-3xl border border-steam-card shadow-lg space-y-6 md:space-y-8">
             <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h3 className="text-xl md:text-2xl font-black text-white uppercase italic flex items-center gap-3">
                  <Star className="w-5 h-5 md:w-6 md:h-6 text-yellow-500 fill-current" /> Valoraciones Reales
                </h3>
                {hasPurchased && (
                  <span className="text-[8px] md:text-[10px] font-black text-steam-blue bg-steam-blue/10 px-3 py-1.5 md:px-4 md:py-2 rounded-full uppercase tracking-widest">
                    Deja tu opinión abajo
                  </span>
                )}
             </div>

             {hasPurchased && (
               <form onSubmit={submitReview} className="bg-steam-dark/50 p-4 md:p-6 rounded-xl md:rounded-2xl border border-steam-card shadow-inner space-y-4">
                 <div className="flex items-center justify-between">
                   <h4 className="text-[10px] md:text-xs font-black text-white uppercase opacity-70">Valorar Producto</h4>
                   <div className="flex gap-1">
                     {[1,2,3,4,5].map(s => (
                       <button key={s} type="button" onClick={() => setRating(s)} className={`transition-all hover:scale-110 ${rating >= s ? 'text-yellow-500' : 'text-steam-accent opacity-20'}`}>
                         <Star className="w-6 h-6 md:w-8 md:h-8 fill-current" />
                       </button>
                     ))}
                   </div>
                 </div>
                 <textarea
                   value={reviewText}
                   onChange={e => setReviewText(e.target.value)}
                   className="w-full bg-steam-dark border border-steam-card rounded-xl p-3 md:p-4 text-xs md:text-sm text-white focus:border-steam-blue outline-none h-24 md:h-32 transition-all"
                   placeholder="Cuéntanos tu experiencia con el producto..."
                   required
                 />
                 <div className="flex justify-end">
                   <button disabled={submittingReview} className="bg-steam-blue text-steam-dark font-black px-6 py-2 md:px-10 md:py-3 rounded-xl flex items-center gap-2 md:gap-3 hover:scale-105 transition-all shadow-xl uppercase italic tracking-widest text-[10px] md:text-sm">
                     {submittingReview ? 'Publicando...' : <><Send className="w-4 h-4" /> Publicar Valoración</>}
                   </button>
                 </div>
               </form>
             )}

             <div className="grid grid-cols-1 gap-4 md:gap-6">
                {reviews.length > 0 ? reviews.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(r => (
                  <ReviewItem key={r.id} user={r.userName} rating={r.rating} comment={r.comment} date={new Date(r.createdAt).toLocaleDateString()} />
                )) : (
                  <div className="flex flex-col items-center justify-center py-10 md:py-20 text-steam-accent/40 bg-steam-dark/20 rounded-2xl md:rounded-3xl border border-dashed border-steam-card">
                    <Star className="w-10 h-10 md:w-12 md:h-12 mb-4 opacity-20" />
                    <p className="font-black uppercase italic tracking-widest text-xs md:text-sm">Aún no hay valoraciones</p>
                  </div>
                )}
             </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-steam-card p-6 md:p-8 rounded-2xl md:rounded-3xl border border-steam-blue/30 shadow-2xl space-y-6 md:space-y-8 lg:sticky lg:top-24">
            <div className="space-y-3 md:space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-1 flex-1 bg-steam-blue/20 rounded-full overflow-hidden">
                  <div className="h-full bg-steam-blue w-2/3" />
                </div>
                <span className="text-[8px] md:text-[10px] font-black text-steam-blue uppercase italic">Oferta Activa</span>
              </div>
              
              <div className="flex flex-col">
                {product.originalPrice > product.price && (
                  <span className="text-steam-accent line-through text-base md:text-lg font-bold">$ {product.originalPrice.toFixed(2)}</span>
                )}
                <div className="flex items-baseline gap-1 md:gap-2">
                  <span className="text-[10px] md:text-xs font-black text-steam-blue uppercase">$</span>
                  <span className="text-4xl md:text-6xl font-black text-white italic tracking-tighter">{product.price.toFixed(2).split('.')[0]}</span>
                  <span className="text-xl md:text-2xl font-black text-white italic tracking-tighter opacity-80">{product.price.toFixed(2).split('.')[1]}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 md:space-y-4">
              <button
                onClick={() => { handleAddToCart(); navigate('/checkout'); }}
                className="w-full bg-steam-blue text-steam-dark font-black py-4 md:py-5 rounded-xl md:rounded-2xl flex items-center justify-center gap-3 transition-all hover:scale-105 shadow-xl uppercase italic tracking-widest text-sm md:text-base"
              >
                <Zap className="w-5 h-5 md:w-6 md:h-6 fill-current" /> Comprar Ahora
              </button>
              <button 
                onClick={handleAddToCart}
                className="w-full bg-steam-bg/50 text-white font-black py-3 md:py-4 rounded-xl md:rounded-2xl flex items-center justify-center gap-2 md:gap-3 border border-steam-card hover:bg-steam-card/40 transition-all uppercase italic tracking-widest text-xs md:text-sm"
              >
                <ShoppingCart className="w-4 h-4 md:w-5 md:h-5" /> Añadir al Carrito
              </button>
            </div>

            {/* Vendor Trust Section */}
            <div className="bg-steam-card/20 rounded-2xl border border-steam-card p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-white uppercase italic flex items-center gap-2">
                  <Award className="w-4 h-4 text-steam-blue" /> Info del Vendedor
                </h3>
                <span className="text-[10px] bg-steam-green/20 text-steam-green px-2 py-0.5 rounded font-black uppercase">Verificado</span>
              </div>

              <div className="flex items-center gap-4">
                <img 
                  src={product.sellerAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${product.sellerId}`} 
                  className="w-16 h-16 rounded-xl border border-steam-card" 
                  alt="" 
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black text-white uppercase italic tracking-wider">{product.sellerName || 'Steam offline Store'}</span>
                    <Verified className="w-4 h-4 text-steam-blue" />
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-3 h-3 ${i < (product.sellerRating || 5) ? 'text-yellow-400 fill-current' : 'text-steam-accent'}`} />
                    ))}
                    <span className="text-[10px] text-steam-accent font-bold ml-1">({product.sellerSales || 150}+ Ventas)</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-steam-dark/50 p-3 rounded-xl border border-steam-card text-center">
                  <div className="text-[10px] text-steam-accent uppercase font-black mb-1">Reputación</div>
                  <div className="text-steam-green font-black text-xs uppercase italic">Excelente</div>
                </div>
                <div className="bg-steam-dark/50 p-3 rounded-xl border border-steam-card text-center">
                  <div className="text-[10px] text-steam-accent uppercase font-black mb-1">Respuesta</div>
                  <div className="text-steam-blue font-black text-xs uppercase italic">&lt; 15 min</div>
                </div>
              </div>

              <button 
                onClick={() => navigate(`/seller/${product.sellerId || 'admin'}`)}
                className="w-full bg-steam-card border border-steam-accent/20 text-steam-accent py-3 rounded-xl text-[10px] font-black uppercase italic hover:bg-steam-blue hover:text-steam-dark transition-all"
              >
                Ver Perfil Completo
              </button>
            </div>

            <div className="space-y-4 bg-steam-dark/50 p-6 rounded-2xl border border-steam-card">
              <InfoItem label="Vendedor" value="Steam offline" />
              <InfoItem 
                label="Entrega" 
                value={product.isPhysical ? "Vía Transportadora" : "Automática"} 
                color={product.isPhysical ? "text-steam-blue" : "text-yellow-400"} 
              />
              <InfoItem label="Tipo" value={product.isPhysical ? "Producto Físico" : "Digital"} />
              <InfoItem label="Stock" value={`${product.stock} un.`} color="text-steam-green" />
            </div>

            <div className="flex items-center justify-center gap-4 py-2 opacity-50">
              <img src="https://logopng.com.br/logos/pix-106.png" className="h-4 grayscale hover:grayscale-0 transition-all cursor-pointer" alt="Pix" />
              <img src="https://cdn-icons-png.flaticon.com/512/196/196057.png" className="h-4 grayscale hover:grayscale-0 transition-all cursor-pointer" alt="Visa" />
              <img src="https://cdn-icons-png.flaticon.com/512/196/196052.png" className="h-4 grayscale hover:grayscale-0 transition-all cursor-pointer" alt="Master" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc }: { icon: any, title: string, desc: string }) => (
  <div className="bg-steam-card/10 backdrop-blur border border-steam-card/40 p-6 rounded-2xl flex flex-col gap-3 hover:border-steam-blue/40 transition-all group overflow-hidden relative">
    <div className="absolute top-0 right-0 p-8 opacity-5 transform translate-x-4 -translate-y-4 group-hover:scale-150 transition-transform duration-700">
      {icon}
    </div>
    <div className="w-12 h-12 bg-steam-dark rounded-xl flex items-center justify-center border border-steam-card group-hover:border-steam-blue/40 transition-all">{icon}</div>
    <div>
      <h3 className="text-sm font-black text-white uppercase italic tracking-widest mb-1">{title}</h3>
      <p className="text-[11px] text-steam-accent leading-snug">{desc}</p>
    </div>
  </div>
);

const ReviewItem = ({ user, rating, comment, date }: any) => (
  <div className="bg-steam-card/10 p-6 rounded-2xl border border-steam-card space-y-4 relative overflow-hidden">
    <div className="flex items-center justify-between relative z-10">
      <div className="flex flex-col">
        <span className="text-sm font-black text-white uppercase italic">{user}</span>
        <span className="text-[10px] text-steam-accent opacity-50 uppercase font-bold">{date}</span>
      </div>
      <div className="flex gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className={`w-3 h-3 ${i < rating ? 'text-yellow-500 fill-current' : 'text-steam-card'}`} />
        ))}
      </div>
    </div>
    <div className="relative z-10">
      <div className="text-steam-accent text-sm leading-relaxed italic border-l-2 border-steam-blue/20 pl-4">
        {comment}
      </div>
    </div>
    <div className="absolute -bottom-4 -right-4 opacity-5 rotate-12">
      <MessageSquare className="w-20 h-20 text-white" />
    </div>
  </div>
);

const InfoItem = ({ label, value, color = "text-white" }: any) => (
  <div className="flex items-center justify-between text-xs">
    <span className="text-steam-accent font-bold uppercase tracking-widest">{label}</span>
    <span className={`font-black uppercase italic ${color}`}>{value}</span>
  </div>
);

export default ProductDetail;
