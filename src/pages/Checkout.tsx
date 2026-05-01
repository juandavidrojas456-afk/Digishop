import React, { useState, useEffect } from 'react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, ShieldCheck, Ticket, ArrowRight, CheckCircle2, Truck, MapPin } from 'lucide-react';
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

  const handleWhatsAppOrder = () => {
    const phoneNumber = "5511993890765";
    const itemList = items.map(item => `• ${item.name} (x${item.quantity}) - $${(item.price * item.quantity).toFixed(2)}`).join('%0A');
    const shippingInfo = hasPhysicalProducts ? `%0A%0A*Envío:*%0A${shippingAddress.street}, ${shippingAddress.city}, ${shippingAddress.zipCode}` : '';
    
    const message = `¡Hola! Me gustaría completar mi pedido en Steam Offline.%0A%0A*Productos:*%0A${itemList}${shippingInfo}%0A%0A*Total:* $${finalTotal.toLocaleString('es-CO')}`;
    
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
    
    // Optional: simulate success page or just stay here
    clearCart();
    setStep(3);
  };

  const shippingCost = hasPhysicalProducts ? shippingMethod.cost : 0;
  const finalTotal = total - discount + shippingCost;

  const nextStep = () => {
    if (step === 1) {
      if (hasPhysicalProducts) {
        setStep(1.5);
      } else {
        handleWhatsAppOrder();
      }
    } else if (step === 1.5) {
      handleWhatsAppOrder();
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-2 md:py-6 px-4">
      {/* Progress Bar */}
      <div className="flex items-center gap-2 md:gap-4 mb-4 md:mb-8 max-w-md mx-auto">
        <div className="flex-1 flex items-center gap-2">
          <div className={`h-1 flex-1 rounded ${step >= 1 ? 'bg-white' : 'bg-white/10'} transition-all duration-500`} />
          <div className={`w-1 h-1 rounded-full ${step >= 1 ? 'bg-white' : 'bg-white/10'} transition-all`} />
        </div>
        {hasPhysicalProducts && (
          <div className="flex-1 flex items-center gap-2">
            <div className={`h-1 flex-1 rounded ${step >= 1.5 ? 'bg-white' : 'bg-white/10'} transition-all duration-500`} />
            <div className={`w-1.5 h-1.5 rounded-full ${step >= 1.5 ? 'bg-white' : 'bg-white/10'} transition-all`} />
          </div>
        )}
        <div className="flex-1 flex items-center gap-2">
          <div className={`h-1 flex-1 rounded ${step >= 3 ? 'bg-white' : 'bg-white/10'} transition-all duration-500`} />
          <div className={`w-1.5 h-1.5 rounded-full ${step >= 3 ? 'bg-white' : 'bg-white/10'} transition-all`} />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-12 items-start">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1" 
              initial={{ opacity: 0, x: -20 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: 20 }}
              className="lg:col-span-2 space-y-6 flex-1 w-full"
            >
              <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3">
                <ShoppingCart className="text-steam-blue w-6 h-6" /> Revisión
              </h2>
              <div className="space-y-3">
                {items.map(item => (
                  <div key={item.id} className="bg-white/5 p-4 rounded-2xl border border-white/5 flex gap-4 group hover:bg-white/[0.08] transition-all">
                    <img src={item.image} className="w-16 h-16 object-cover rounded-xl shadow-xl transition-transform group-hover:scale-105" alt="" />
                    <div className="flex-1 py-0.5 min-w-0">
                      <h4 className="text-white font-black uppercase italic tracking-tighter text-sm truncate">{item.name}</h4>
                      <p className="text-white/40 text-[9px] uppercase font-black tracking-widest mt-0.5">Cantidad: {item.quantity}</p>
                      <p className="text-steam-green font-black text-lg mt-1 italic tracking-tighter">$ {item.price.toLocaleString('es-CO')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {step === 1.5 && (
            <motion.div 
              key="step1.5" 
              initial={{ opacity: 0, x: -20 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: 20 }}
              className="lg:col-span-2 space-y-6 flex-1 w-full"
            >
              <div className="grid grid-cols-1 gap-8">
                <div className="space-y-4">
                  <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3">
                    <MapPin className="text-steam-blue w-6 h-6" /> Dirección
                  </h2>
                  <div className="space-y-4 bg-white/5 p-6 rounded-3xl border border-white/10">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-white/40 tracking-widest ml-1">Calle y Número</label>
                      <input 
                        type="text" 
                        value={shippingAddress.street}
                        onChange={(e) => setShippingAddress({...shippingAddress, street: e.target.value})}
                        className="w-full bg-white/[0.03] border border-white/5 rounded-xl p-3.5 text-xs text-white focus:border-white/20 outline-none transition-all"
                        placeholder="Av. Principal, 1234"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-white/40 tracking-widest ml-1">Ciudad</label>
                        <input 
                          type="text" 
                          value={shippingAddress.city}
                          onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})}
                          className="w-full bg-white/[0.03] border border-white/5 rounded-xl p-3.5 text-xs text-white focus:border-white/20 outline-none transition-all"
                          placeholder="Bogotá"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-white/40 tracking-widest ml-1">Código Postal</label>
                        <input 
                          type="text" 
                          value={shippingAddress.zipCode}
                          onChange={(e) => setShippingAddress({...shippingAddress, zipCode: e.target.value})}
                          className="w-full bg-white/[0.03] border border-white/5 rounded-xl p-3.5 text-xs text-white focus:border-white/20 outline-none transition-all"
                          placeholder="110111"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3">
                    <Truck className="text-steam-blue w-6 h-6" /> Envío
                  </h2>
                  <div className="space-y-3">
                    {shippingOptions.map(option => (
                      <button 
                        key={option.id}
                        onClick={() => setShippingMethod(option)}
                        className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all group ${
                          shippingMethod.id === option.id 
                            ? 'bg-white border-white shadow-xl' 
                            : 'bg-white/5 border-white/5 hover:border-white/10'
                        }`}
                      >
                        <div className="text-left flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${shippingMethod.id === option.id ? 'bg-black/10' : 'bg-white/5'}`}>
                            <Truck className={`w-4 h-4 ${shippingMethod.id === option.id ? 'text-black' : 'text-white/40'}`} />
                          </div>
                          <div>
                            <div className={`font-black uppercase italic text-sm ${shippingMethod.id === option.id ? 'text-black' : 'text-white'}`}>{option.name}</div>
                            <div className={`text-[8px] font-black uppercase tracking-widest ${shippingMethod.id === option.id ? 'text-black/40' : 'text-white/20'}`}>{option.time}</div>
                          </div>
                        </div>
                        <div className={`font-black text-lg italic tracking-tighter ${shippingMethod.id === option.id ? 'text-black' : 'text-steam-green'}`}>$ {option.cost.toLocaleString('es-CO')}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3" 
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }} 
              className="col-span-full py-8 text-center w-full"
            >
              <div className="w-16 h-16 bg-steam-green rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(164,203,50,0.3)]">
                <CheckCircle2 className="w-8 h-8 text-black" />
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-white italic uppercase mb-2 tracking-tighter leading-none">Confirmado</h2>
              <p className="text-white/40 max-w-sm mx-auto mb-8 uppercase font-black text-[8px] tracking-[0.4em] leading-relaxed">
                Gracias por su preferencia. Su pedido ha sido procesado. Contáctenos para finalizar detalles.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs mx-auto">
                <button 
                  onClick={() => navigate('/profile')} 
                  className="flex-1 bg-white text-black font-black px-4 py-3 rounded-lg uppercase italic tracking-widest shadow-xl hover:scale-105 transition-all text-[9px]"
                >
                  Mis Artículos
                </button>
                <button 
                  onClick={() => navigate('/')} 
                  className="flex-1 bg-white/5 border border-white/10 text-white font-black px-4 py-3 rounded-lg uppercase italic tracking-widest hover:bg-white/10 transition-all text-[9px]"
                >
                  Inicio
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {step < 3 && (
          <div className="w-full lg:w-80 bg-white/[0.03] backdrop-blur-3xl p-6 rounded-[2rem] border border-white/5 h-fit space-y-6 shadow-2xl shrink-0">
            <div className="space-y-2">
              <label className="text-[8px] font-black uppercase text-white/40 tracking-[0.2em] ml-1">Cupón de Descuento</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  className="flex-1 min-w-0 bg-white/[0.05] border border-white/5 rounded-lg h-9 px-3 text-[10px] text-white outline-none focus:border-white/20 transition-all uppercase placeholder:opacity-20"
                  placeholder="STEAM20"
                />
                <button className="bg-white text-black px-4 rounded-lg h-9 text-[8px] font-black uppercase italic tracking-widest hover:scale-105 transition-all shrink-0">Aplicar</button>
              </div>
            </div>

            <div className="border-t border-white/5 pt-4 space-y-2">
              <div className="flex justify-between text-white/40 text-[8px] font-black uppercase tracking-widest">
                <span>Subtotal</span>
                <span className="text-white">$ {total.toLocaleString('es-CO')}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-red-500/80 text-[8px] font-black uppercase tracking-widest">
                  <span>Descuento</span>
                  <span>- $ {discount.toLocaleString('es-CO')}</span>
                </div>
              )}
              {hasPhysicalProducts && (
                <div className="flex justify-between text-white/40 text-[8px] font-black uppercase tracking-widest">
                  <span>Envío ({shippingMethod.name})</span>
                  <span className="text-white">$ {shippingMethod.cost.toLocaleString('es-CO')}</span>
                </div>
              )}
              <div className="flex justify-between text-white font-black text-lg pt-3 border-t border-white/5 italic tracking-tighter items-center">
                <span className="text-[10px] uppercase tracking-widest opacity-50 not-italic">Total COP</span>
                <span className="text-steam-green">$ {finalTotal.toLocaleString('es-CO')}</span>
              </div>
            </div>

            <div className="space-y-2">
              <button 
                onClick={nextStep}
                className="w-full bg-white text-black font-black py-3 rounded-lg flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-xl uppercase italic tracking-[0.1em] text-[10px] group"
              >
                Continuar Compra <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <div className="flex items-center justify-center gap-2 text-[7px] text-white/20 font-black uppercase tracking-[0.2em]">
                <ShieldCheck className="w-3 h-3" /> Transacción Segura
              </div>
              
              {step > 1 && (
                <button 
                  onClick={() => setStep(step === 1.5 ? 1 : 1.5)} 
                  className="w-full text-center text-white/30 text-[9px] uppercase font-black tracking-widest hover:text-white transition-colors"
                >
                  Volver atrás
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckoutPage;
