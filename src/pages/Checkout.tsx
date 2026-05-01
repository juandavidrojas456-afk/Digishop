import React, { useState, useEffect } from 'react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, CreditCard, ShieldCheck, Ticket, ArrowRight, CheckCircle2, Truck, MapPin } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc, setDoc } from 'firebase/firestore';

const shippingOptions = [
  { id: 'standard', name: 'Estándar', cost: 15, time: '5-7 días' },
  { id: 'express', name: 'Express', cost: 45, time: '1-2 días' }
];

const CheckoutPage = () => {
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'pix'>('credit_card');
  const [siteSettings, setSiteSettings] = useState<any>(null);
  
  const hasPhysicalProducts = items.some(item => item.isPhysical);
  const [shippingMethod, setShippingMethod] = useState(shippingOptions[0]);
  const [shippingAddress, setShippingAddress] = useState({
    street: '',
    city: '',
    zipCode: ''
  });
  
  useEffect(() => {
    const fetchSettings = async () => {
      const s = await getDoc(doc(db, 'settings', 'site'));
      if (s.exists()) setSiteSettings(s.data());
    };
    fetchSettings();
  }, []);

  if (items.length === 0 && step !== 3) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <ShoppingCart className="w-16 h-16 text-steam-accent opacity-20" />
        <h2 className="text-xl font-bold text-white uppercase italic">Tu carrito está vacío</h2>
        <button onClick={() => navigate('/')} className="text-steam-blue hover:underline">Volver a la tienda</button>
      </div>
    );
  }

  const handlePayment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: items.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.image
          })),
          successUrl: `${window.location.origin}/profile?payment=success`,
          cancelUrl: `${window.location.origin}/checkout`,
          customerEmail: user?.email,
          paymentMethod: paymentMethod
        }),
      });

      const session = await response.json();

      if (session.error) {
        throw new Error(session.error);
      }

      if (session.url) {
        window.location.href = session.url;
        return;
      }

      clearCart();
      setStep(3);
    } catch (error) {
      console.error(error);
      alert('Error al procesar el pago. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const shippingCost = hasPhysicalProducts ? shippingMethod.cost : 0;
  const finalTotal = total - discount + shippingCost;

  const nextStep = () => {
    if (step === 1 && hasPhysicalProducts) {
      setStep(1.5);
    } else {
      setStep(2);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Progress Bar */}
      <div className="flex items-center gap-4 mb-12">
        <div className="flex-1 flex items-center gap-2">
          <div className={`h-1 flex-1 rounded ${step >= 1 ? 'bg-white' : 'bg-white/10'} transition-all duration-500`} />
          <div className={`w-2 h-2 rounded-full ${step >= 1 ? 'bg-white' : 'bg-white/10'} transition-all`} />
        </div>
        {hasPhysicalProducts && (
          <div className="flex-1 flex items-center gap-2">
            <div className={`h-1 flex-1 rounded ${step >= 1.5 ? 'bg-white' : 'bg-white/10'} transition-all duration-500`} />
            <div className={`w-2 h-2 rounded-full ${step >= 1.5 ? 'bg-white' : 'bg-white/10'} transition-all`} />
          </div>
        )}
        <div className="flex-1 flex items-center gap-2">
          <div className={`h-1 flex-1 rounded ${step >= 2 ? 'bg-white' : 'bg-white/10'} transition-all duration-500`} />
          <div className={`w-2 h-2 rounded-full ${step >= 2 ? 'bg-white' : 'bg-white/10'} transition-all`} />
        </div>
        <div className="flex-1 flex items-center gap-2">
          <div className={`h-1 flex-1 rounded ${step >= 3 ? 'bg-white' : 'bg-white/10'} transition-all duration-500`} />
          <div className={`w-2 h-2 rounded-full ${step >= 3 ? 'bg-white' : 'bg-white/10'} transition-all`} />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div 
            key="step1" 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            <div className="lg:col-span-2 space-y-8">
              <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter flex items-center gap-4">
                <ShoppingCart className="text-steam-blue w-10 h-10" /> Revisión
              </h2>
              <div className="space-y-4">
                {items.map(item => (
                  <div key={item.id} className="flex gap-6 bg-white/[0.03] p-6 rounded-[2rem] border border-white/5 transition-all hover:border-white/10 group">
                    <img src={item.image} className="w-24 h-24 object-cover rounded-2xl shadow-2xl transition-transform group-hover:scale-105" alt="" />
                    <div className="flex-1 py-1">
                      <h4 className="text-white font-black uppercase italic tracking-tighter text-lg">{item.name}</h4>
                      <p className="text-white/40 text-[10px] uppercase font-black tracking-widest mt-1">Cantidad: {item.quantity}</p>
                      <p className="text-steam-green font-black text-2xl mt-2 italic tracking-tighter">$ {item.price.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-3xl p-10 rounded-[3rem] border border-white/10 h-fit space-y-10 shadow-3xl">
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em] ml-1">Cupón de Descuento</label>
                <div className="flex gap-3">
                  <input 
                    type="text" 
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                    className="flex-1 bg-white/[0.05] border border-white/5 rounded-2xl p-4 text-sm text-white outline-none focus:border-white/20 transition-all uppercase placeholder:opacity-20"
                    placeholder="STEAM20"
                  />
                  <button className="bg-white text-black px-6 rounded-2xl text-[10px] font-black uppercase italic tracking-widest hover:scale-105 transition-all">Aplicar</button>
                </div>
              </div>

              <div className="border-t border-white/5 pt-8 space-y-4">
                <div className="flex justify-between text-white/40 text-[10px] font-black uppercase tracking-widest">
                  <span>Subtotal</span>
                  <span className="text-white">$ {total.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-red-500/80 text-[10px] font-black uppercase tracking-widest">
                    <span>Descuento</span>
                    <span>- $ {discount.toFixed(2)}</span>
                  </div>
                )}
                {hasPhysicalProducts && (
                  <div className="flex justify-between text-white/40 text-[10px] font-black uppercase tracking-widest">
                    <span>Envío ({shippingMethod.name})</span>
                    <span className="text-white">$ {shippingMethod.cost.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-white font-black text-3xl pt-6 border-t border-white/5 italic tracking-tighter">
                  <span>TOTAL</span>
                  <span className="text-steam-green scale-110">$ {finalTotal.toFixed(2)}</span>
                </div>
              </div>

              <button 
                onClick={nextStep}
                className="w-full bg-white text-black font-black py-6 rounded-3xl flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-95 transition-all shadow-[0_30px_60px_-15px_rgba(255,255,255,0.3)] uppercase italic tracking-[0.2em] text-xl"
              >
                Continuar <ArrowRight className="w-6 h-6" />
              </button>
              
              <div className="flex items-center justify-center gap-3 text-[9px] text-white/20 font-black uppercase tracking-[0.2em]">
                <ShieldCheck className="w-4 h-4" /> Checkout 100% Seguro
              </div>
            </div>
          </motion.div>
        )}

        {step === 1.5 && (
          <motion.div 
            key="step1.5" 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12"
          >
            <div className="space-y-8">
              <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter flex items-center gap-4">
                <MapPin className="text-steam-blue w-8 h-8" /> Dirección
              </h2>
              <div className="space-y-6 bg-white/5 p-10 rounded-[3rem] border border-white/10 shadow-2xl">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1">Calle y Número</label>
                  <input 
                    type="text" 
                    value={shippingAddress.street}
                    onChange={(e) => setShippingAddress({...shippingAddress, street: e.target.value})}
                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-5 text-white focus:border-white/20 outline-none transition-all placeholder:opacity-10"
                    placeholder="Av. Principal, 1234"
                  />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1">Ciudad</label>
                    <input 
                      type="text" 
                      value={shippingAddress.city}
                      onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})}
                      className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-5 text-white focus:border-white/20 outline-none transition-all"
                      placeholder="Madrid"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1">Código Postal</label>
                    <input 
                      type="text" 
                      value={shippingAddress.zipCode}
                      onChange={(e) => setShippingAddress({...shippingAddress, zipCode: e.target.value})}
                      className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-5 text-white focus:border-white/20 outline-none transition-all"
                      placeholder="00000"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter flex items-center gap-4">
                <Truck className="text-steam-blue w-8 h-8" /> Envío
              </h2>
              <div className="space-y-4">
                {shippingOptions.map(option => (
                  <button 
                    key={option.id}
                    onClick={() => setShippingMethod(option)}
                    className={`w-full p-8 rounded-[2rem] border-2 flex items-center justify-between transition-all duration-500 ${
                      shippingMethod.id === option.id 
                        ? 'bg-white border-white scale-[1.05] shadow-[0_0_60px_-15px_rgba(255,255,255,0.2)]' 
                        : 'bg-white/[0.03] border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="text-left">
                      <div className={`font-black uppercase italic text-lg ${shippingMethod.id === option.id ? 'text-black' : 'text-white'}`}>{option.name}</div>
                      <div className={`text-[10px] font-black uppercase tracking-widest ${shippingMethod.id === option.id ? 'text-black/40' : 'text-white/20'}`}>{option.time}</div>
                    </div>
                    <div className={`font-black text-xl italic tracking-tighter ${shippingMethod.id === option.id ? 'text-black' : 'text-steam-green'}`}>$ {option.cost.toFixed(2)}</div>
                  </button>
                ))}
              </div>
              <button 
                onClick={() => setStep(2)}
                disabled={!shippingAddress.street || !shippingAddress.city || !shippingAddress.zipCode}
                className="w-full bg-white text-black font-black py-6 rounded-3xl flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-95 transition-all shadow-3xl uppercase italic tracking-[0.2em] text-xl"
              >
                Continuar <ArrowRight className="w-6 h-6" />
              </button>
              <button 
                onClick={() => setStep(1)}
                className="w-full text-white/20 text-[10px] font-black uppercase hover:text-white transition-colors tracking-widest"
              >
                Volver a Revisión
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div 
            key="step2" 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -20 }}
            className="space-y-12 py-8"
          >
            <div className="text-center space-y-4">
              <h1 className="text-6xl font-black text-white italic uppercase tracking-tighter leading-none">Checkout</h1>
              <p className="text-white/40 uppercase font-black text-[10px] tracking-[0.4em]">Seleccione un método para finalizar</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-4xl mx-auto">
              <button 
                onClick={() => setPaymentMethod('credit_card')}
                className={`p-12 rounded-[3.5rem] border-2 flex flex-col items-center justify-center gap-8 transition-all duration-700 group relative overflow-hidden ${
                  paymentMethod === 'credit_card' 
                    ? 'bg-white border-white shadow-[0_0_100px_-20px_rgba(255,255,255,0.4)] scale-[1.05]' 
                    : 'bg-white/[0.03] border-white/5 hover:border-white/20'
                }`}
              >
                <div className={`w-28 h-28 rounded-3xl flex items-center justify-center transition-all duration-700 ${paymentMethod === 'credit_card' ? 'bg-black shadow-2xl' : 'bg-white/5 group-hover:bg-white/10'}`}>
                  <CreditCard className={`w-12 h-12 transition-all duration-700 ${paymentMethod === 'credit_card' ? 'text-white' : 'text-white/20'}`} />
                </div>
                <div className="text-center z-10">
                  <div className={`font-black uppercase italic text-3xl tracking-tighter ${paymentMethod === 'credit_card' ? 'text-black' : 'text-white'}`}>Tarjeta</div>
                  <div className={`text-[10px] uppercase font-black px-6 py-2.5 rounded-full mt-4 transition-colors duration-700 ${paymentMethod === 'credit_card' ? 'bg-black text-white' : 'bg-white/10 text-white/40'}`}>Visa / Master / Amex</div>
                </div>
                {paymentMethod === 'credit_card' && <CheckCircle2 className="text-black w-8 h-8 absolute top-8 right-8" />}
              </button>

              <button 
                onClick={() => setPaymentMethod('pix')}
                className={`p-12 rounded-[3.5rem] border-2 flex flex-col items-center justify-center gap-8 transition-all duration-700 group relative overflow-hidden ${
                  paymentMethod === 'pix' 
                    ? 'bg-white border-white shadow-[0_0_100px_-20px_rgba(50,188,173,0.3)] scale-[1.05]' 
                    : 'bg-white/[0.03] border-white/5 hover:border-white/20'
                }`}
              >
                <div className={`w-28 h-28 rounded-3xl flex items-center justify-center transition-all duration-700 ${paymentMethod === 'pix' ? 'bg-[#32bcad] shadow-2xl' : 'bg-white/5 group-hover:bg-white/10'}`}>
                  <img src="https://logospng.org/download/pix/logo-pix-icone-512.png" className={`w-14 h-14 object-contain transition-all duration-700 ${paymentMethod === 'pix' ? 'brightness-100' : 'grayscale brightness-200 opacity-20'}`} alt="Pix" />
                </div>
                <div className="text-center z-10">
                  <div className={`font-black uppercase italic text-3xl tracking-tighter ${paymentMethod === 'pix' ? 'text-black' : 'text-white'}`}>Pix</div>
                  <div className={`text-[10px] uppercase font-black px-6 py-2.5 rounded-full mt-4 transition-colors duration-700 ${paymentMethod === 'pix' ? 'bg-[#32bcad] text-white' : 'bg-white/10 text-white/40'}`}>Aprobación Inmediata</div>
                </div>
                {paymentMethod === 'pix' && <CheckCircle2 className="text-[#32bcad] w-8 h-8 absolute top-8 right-8" />}
              </button>
            </div>

            <div className="max-w-xl mx-auto flex flex-col gap-6">
              <button 
                onClick={() => handlePayment()}
                disabled={loading}
                className="w-full bg-white text-black font-black py-8 rounded-[2.5rem] flex items-center justify-center gap-4 hover:scale-[1.03] active:scale-95 transition-all shadow-[0_40px_80px_-20px_rgba(255,255,255,0.4)] uppercase italic tracking-[0.3em] text-2xl group disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center gap-4">
                    <div className="w-6 h-6 border-4 border-black/20 border-t-black rounded-full animate-spin" />
                    Pagando...
                  </div>
                ) : (
                  <>Pagar $ {finalTotal.toFixed(2)} <ArrowRight className="w-6 h-6 group-hover:translate-x-3 transition-transform" /></>
                )}
              </button>
              <button 
                onClick={() => setStep(hasPhysicalProducts ? 1.5 : 1)}
                className="text-white/20 text-[10px] font-black uppercase hover:text-white transition-colors tracking-widest text-center"
              >
                Regresar
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div 
            key="step3" 
            initial={{ scale: 0.8, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            className="flex flex-col items-center justify-center py-24 text-center max-w-2xl mx-auto"
          >
            <div className="w-40 h-40 bg-white/5 border border-white/10 rounded-[3rem] flex items-center justify-center mb-12 text-white shadow-3xl">
              <CheckCircle2 className="w-20 h-20" />
            </div>
            <h2 className="text-6xl font-black text-white italic uppercase mb-6 tracking-tighter leading-none">Confirmado</h2>
            <p className="text-white/40 max-w-sm mx-auto mb-16 uppercase font-black text-[11px] tracking-[0.4em] leading-relaxed">
              Gracias por su preferencia. Su pago ha sido procesado y sus artículos ya están disponibles.
            </p>
            <div className="flex flex-col sm:flex-row gap-8 w-full">
              <button 
                onClick={() => navigate('/profile')} 
                className="flex-1 bg-white text-black font-black px-12 py-6 rounded-3xl uppercase italic tracking-widest shadow-3xl hover:scale-105 transition-all text-sm"
              >
                Mis Artículos
              </button>
              <button 
                onClick={() => navigate('/')} 
                className="flex-1 bg-white/5 text-white border border-white/10 font-black px-12 py-6 rounded-3xl uppercase italic tracking-widest hover:bg-white/10 transition-all text-sm"
              >
                Inicio
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CheckoutPage;
