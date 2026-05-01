import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, addDoc, doc, serverTimestamp, setDoc, getDoc } from 'firebase/firestore';
import { ShoppingCart, CreditCard, ShieldCheck, Ticket, ArrowRight, CheckCircle2, Truck, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';

const shippingOptions = [
  { id: 'standard', name: 'Entrega Padrão', cost: 15.00, time: '5-10 dias úteis' },
  { id: 'express', name: 'Entrega Expressa', cost: 35.00, time: '2-4 dias úteis' },
  { id: 'overnight', name: 'Entrega Prioritária', cost: 65.00, time: 'Próximo dia útil' }
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
  
  const [cardData, setCardData] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: ''
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
        <h2 className="text-xl font-bold text-white uppercase italic">Seu carrinho está vazio</h2>
        <button onClick={() => navigate('/')} className="text-steam-blue hover:underline">Voltar para a loja</button>
      </div>
    );
  }

  const handlePayment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    
    try {
      // 1. Create Stripe Checkout Session via our Backend
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
          paymentMethod: paymentMethod // 'credit_card' or 'pix'
        }),
      });

      const session = await response.json();

      if (session.error) {
        throw new Error(session.error);
      }

      // 2. Redirect to Stripe's Secure Hosted Payment Page
      if (session.url) {
        // Before redirecting, we would normally save the order as 'pending' in Firestore
        // But for this demo/setup, we'll let the user pay first.
        // In a real production app, you'd use a Webhook to confirm payment and then create the order.
        window.location.href = session.url;
        return;
      }

      // Fallback for mock behavior if Stripe is not configured
      const physicalItems = items.filter(i => i.isPhysical);
      const shippingCostPerItem = hasPhysicalProducts ? (shippingMethod.cost / physicalItems.length) : 0;

      for (const item of items) {
        const itemSellerId = item.sellerId || 'admin';

        // 1. Create Order
        const orderRef = await addDoc(collection(db, 'orders'), {
          buyerId: user?.uid,
          sellerId: itemSellerId,
          productId: item.id,
          productName: item.name,
          amount: item.price * item.quantity,
          shippingCost: item.isPhysical ? shippingCostPerItem : 0,
          shippingMethod: item.isPhysical ? shippingMethod.name : 'Digital',
          shippingAddress: item.isPhysical ? shippingAddress : null,
          status: 'paid',
          deliveryKey: item.isPhysical ? 'SHIPPING-PENDING' : `KEY-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
          paymentMethod: paymentMethod,
          createdAt: serverTimestamp()
        });

        // 2. Automate Chat & Delivery Message
        const chatId = [user?.uid, itemSellerId].sort().join('_');
        const chatRef = doc(db, 'chats', chatId);
        
        await setDoc(chatRef, {
          participants: [user?.uid, itemSellerId],
          lastMessage: `Sua compra de ${item.name} foi confirmada!`,
          updatedAt: serverTimestamp()
        }, { merge: true });

        const deliveryMsg = `${item.autoMessage || 'Obrigado por sua compra!'}\n\nProduto: ${item.name}\nEntrega: ${item.deliveryContent || 'Pendente'}\n\nAgradecemos a preferência!`;

        await addDoc(collection(db, 'chats', chatId, 'messages'), {
          chatId,
          senderId: itemSellerId,
          content: deliveryMsg,
          createdAt: serverTimestamp()
        });
      }

      clearCart();
      setStep(3);
    } catch (error) {
      console.error(error);
      alert('Erro ao processar pagamento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const shippingCost = hasPhysicalProducts ? shippingMethod.cost : 0;
  const finalTotal = total - discount + shippingCost;

  // CRC16 CCITT calculation for Pix
  const crc16ccitt = (data: string) => {
    let crc = 0xFFFF;
    const polynomial = 0x1021;
    for (let i = 0; i < data.length; i++) {
      let b = data.charCodeAt(i);
      for (let j = 0; j < 8; j++) {
        let bit = ((b >> (7 - j) & 1) === 1);
        let c15 = ((crc >> 15 & 1) === 1);
        crc <<= 1;
        if (c15 !== bit) crc ^= polynomial;
      }
    }
    return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
  };

  const generatePixPayload = () => {
    const pixKey = siteSettings?.pixKey || 'suachave@pix.com';
    const pixName = (siteSettings?.pixName || 'Vendedor Oficial').normalize("NFD").replace(/[\u0300-\u036f]/g, "").substring(0, 25);
    const amount = finalTotal.toFixed(2);
    
    const parts = [
      '000201', // Payload Format Indicator
      '26', // Merchant Account Info
      `${(22 + pixKey.length).toString().padStart(2, '0')}0014br.gov.bcb.pix01${pixKey.length.toString().padStart(2, '0')}${pixKey}`,
      '52040000', // Category
      '5303986', // Currency BRL
      `54${amount.length.toString().padStart(2, '0')}${amount}`, // Amount
      '5802BR', // Country
      `59${pixName.length.toString().padStart(2, '0')}${pixName}`, // Name
      '6009SAO PAULO', // City
      '62070503***', // Additional Data
      '6304' // CRC indicator
    ];

    const payloadWithoutCRC = parts.join('');
    return payloadWithoutCRC + crc16ccitt(payloadWithoutCRC);
  };

  const pixPayload = generatePixPayload();

  const nextStep = () => {
    if (step === 1 && hasPhysicalProducts) {
      setStep(1.5);
    } else {
      setStep(2);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center gap-4 mb-12">
        <div className="flex-1 flex items-center gap-2">
          <div className={`h-1 flex-1 rounded ${step >= 1 ? 'bg-steam-blue' : 'bg-steam-card'} transition-all duration-500`} />
          <div className={`w-3 h-3 rounded-full ${step >= 1 ? 'bg-steam-blue' : 'bg-steam-card'} transition-all`} />
        </div>
        {hasPhysicalProducts && (
          <div className="flex-1 flex items-center gap-2">
            <div className={`h-1 flex-1 rounded ${step >= 1.5 ? 'bg-steam-blue' : 'bg-steam-card'} transition-all duration-500`} />
            <div className={`w-3 h-3 rounded-full ${step >= 1.5 ? 'bg-steam-blue' : 'bg-steam-card'} transition-all`} />
          </div>
        )}
        <div className="flex-1 flex items-center gap-2">
          <div className={`h-1 flex-1 rounded ${step >= 2 ? 'bg-steam-blue' : 'bg-steam-card'} transition-all duration-500`} />
          <div className={`w-3 h-3 rounded-full ${step >= 2 ? 'bg-steam-blue' : 'bg-steam-card'} transition-all`} />
        </div>
        <div className="flex-1 flex items-center gap-2">
          <div className={`h-1 flex-1 rounded ${step >= 2.5 ? 'bg-steam-blue' : 'bg-steam-card'} transition-all duration-500`} />
          <div className={`w-3 h-3 rounded-full ${step >= 2.5 ? 'bg-steam-blue' : 'bg-steam-card'} transition-all`} />
        </div>
        <div className="flex-1 flex items-center gap-2">
          <div className={`h-1 flex-1 rounded ${step >= 3 ? 'bg-steam-blue' : 'bg-steam-card'} transition-all duration-500`} />
          <div className={`w-3 h-3 rounded-full ${step >= 3 ? 'bg-steam-blue' : 'bg-steam-card'} transition-all`} />
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
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-2xl font-black text-white italic uppercase flex items-center gap-3">
                <ShoppingCart className="text-steam-blue" /> Revisão do Pedido
              </h2>
              <div className="space-y-4">
                {items.map(item => (
                  <div key={item.id} className="flex gap-4 bg-steam-card/20 p-4 rounded-xl border border-steam-card/40">
                    <img src={item.image} className="w-20 h-20 object-cover rounded-lg" alt="" />
                    <div className="flex-1">
                      <h4 className="text-white font-bold">{item.name}</h4>
                      <p className="text-steam-accent text-sm">Quantidade: {item.quantity}</p>
                      <p className="text-steam-green font-bold text-lg">R$ {item.price.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-steam-card/30 p-6 rounded-2xl border border-steam-card h-fit space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-steam-accent opacity-60">Cupom de Desconto</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                    className="flex-1 bg-steam-dark border border-steam-card rounded p-2 text-sm outline-none focus:border-steam-blue"
                    placeholder="DIGITE AQUI"
                  />
                  <button className="bg-steam-card px-4 rounded text-xs font-bold hover:bg-steam-blue hover:text-steam-dark transition-colors">APLICAR</button>
                </div>
              </div>

              <div className="border-t border-steam-card pt-4 space-y-2">
                <div className="flex justify-between text-steam-accent text-sm">
                  <span>Subtotal</span>
                  <span>R$ {total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-steam-accent text-sm">
                  <span>Desconto</span>
                  <span className="text-red-400">- R$ {discount.toFixed(2)}</span>
                </div>
                {hasPhysicalProducts && (
                  <div className="flex justify-between text-steam-accent text-sm">
                    <span>Frete ({shippingMethod.name})</span>
                    <span>R$ {shippingMethod.cost.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-white font-black text-xl pt-2 border-t border-steam-card">
                  <span>TOTAL</span>
                  <span className="text-steam-blue">R$ {finalTotal.toFixed(2)}</span>
                </div>
              </div>

              <button 
                onClick={nextStep}
                className="w-full bg-steam-blue text-steam-dark font-black py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-opacity-80 transition-all shadow-xl uppercase italic tracking-widest"
              >
                Prosseguir {hasPhysicalProducts ? 'para Frete' : 'para Pagamento'} <ArrowRight className="w-5 h-5" />
              </button>
              
              <div className="flex items-center justify-center gap-2 text-[10px] text-steam-accent opacity-50 font-bold uppercase">
                <ShieldCheck className="w-3 h-3" /> Pagamento 100% Seguro
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
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            <div className="space-y-6">
              <h2 className="text-2xl font-black text-white italic uppercase flex items-center gap-3">
                <MapPin className="text-steam-blue" /> Endereço de Entrega
              </h2>
              <div className="space-y-4 bg-steam-card/20 p-6 rounded-2xl border border-steam-card">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-steam-accent">Rua e Número</label>
                  <input 
                    type="text" 
                    value={shippingAddress.street}
                    onChange={(e) => setShippingAddress({...shippingAddress, street: e.target.value})}
                    className="w-full bg-steam-dark border border-steam-card rounded-xl p-3 text-sm focus:border-steam-blue outline-none"
                    placeholder="Av. Paulista, 1000"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-steam-accent">Cidade</label>
                    <input 
                      type="text" 
                      value={shippingAddress.city}
                      onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})}
                      className="w-full bg-steam-dark border border-steam-card rounded-xl p-3 text-sm focus:border-steam-blue outline-none"
                      placeholder="São Paulo"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-steam-accent">CEP</label>
                    <input 
                      type="text" 
                      value={shippingAddress.zipCode}
                      onChange={(e) => setShippingAddress({...shippingAddress, zipCode: e.target.value})}
                      className="w-full bg-steam-dark border border-steam-card rounded-xl p-3 text-sm focus:border-steam-blue outline-none"
                      placeholder="00000-000"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="text-2xl font-black text-white italic uppercase flex items-center gap-3">
                <Truck className="text-steam-blue" /> Opções de Envio
              </h2>
              <div className="space-y-3">
                {shippingOptions.map(option => (
                  <button 
                    key={option.id}
                    onClick={() => setShippingMethod(option)}
                    className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all ${
                      shippingMethod.id === option.id 
                        ? 'bg-steam-blue/10 border-steam-blue' 
                        : 'bg-steam-card/20 border-steam-card hover:border-steam-accent'
                    }`}
                  >
                    <div className="text-left">
                      <div className="font-bold text-white uppercase italic text-sm">{option.name}</div>
                      <div className="text-[10px] text-steam-accent uppercase font-black">{option.time}</div>
                    </div>
                    <div className="text-steam-green font-black">R$ {option.cost.toFixed(2)}</div>
                  </button>
                ))}
              </div>
              <button 
                onClick={() => setStep(2)}
                disabled={!shippingAddress.street || !shippingAddress.city || !shippingAddress.zipCode}
                className="w-full bg-steam-blue text-steam-dark font-black py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-opacity-80 transition-all shadow-xl uppercase italic tracking-widest disabled:opacity-50"
              >
                Revisar Pagamento <ArrowRight className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setStep(1)}
                className="w-full text-steam-accent text-[10px] font-bold uppercase hover:text-white transition-colors"
              >
                Voltar Revisão Items
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
            className="max-w-2xl mx-auto space-y-8"
          >
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 bg-steam-blue/10 px-4 py-1.5 rounded-full border border-steam-blue/20">
                <ShieldCheck className="w-4 h-4 text-steam-blue" />
                <span className="text-[10px] font-black text-steam-blue uppercase italic tracking-widest">{t('checkout.secure_environment')}</span>
              </div>
              <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">{t('checkout.payment_method')}</h3>
              <p className="text-steam-accent text-sm opacity-60">Escolha o método mais conveniente para completar sua transação</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button 
                onClick={() => setPaymentMethod('credit_card')}
                className={`p-10 rounded-3xl border-2 flex flex-col items-center justify-center gap-6 transition-all duration-500 group relative overflow-hidden ${
                  paymentMethod === 'credit_card' 
                    ? 'bg-white border-white shadow-[0_0_50px_-10px_rgba(255,255,255,0.3)] scale-[1.02]' 
                    : 'bg-white/[0.03] border-white/5 hover:border-white/20'
                }`}
              >
                {paymentMethod === 'credit_card' && (
                  <motion.div 
                    layoutId="payment-glow"
                    className="absolute inset-0 bg-gradient-to-tr from-black/5 to-transparent pointer-events-none"
                  />
                )}
                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-500 ${paymentMethod === 'credit_card' ? 'bg-black scale-110 shadow-2xl' : 'bg-white/5 group-hover:bg-white/10'}`}>
                  <CreditCard className={`w-10 h-10 transition-all duration-500 ${paymentMethod === 'credit_card' ? 'text-white' : 'text-white/20'}`} />
                </div>
                <div className={`text-center z-10 p-4 rounded-2xl transition-colors duration-500 ${paymentMethod === 'credit_card' ? 'bg-black/5' : ''}`}>
                  <div className={`font-black uppercase italic text-xl tracking-tighter ${paymentMethod === 'credit_card' ? 'text-black' : 'text-white'}`}>Cartão</div>
                  <div className={`text-[9px] uppercase font-black px-4 py-1.5 rounded-full mt-3 transition-colors duration-500 ${paymentMethod === 'credit_card' ? 'bg-black text-white' : 'bg-white/5 text-white/40'}`}>Até 12x Sem Juros</div>
                </div>
                {paymentMethod === 'credit_card' && <CheckCircle2 className="text-black w-6 h-6 absolute top-6 right-6" />}
              </button>

              <button 
                onClick={() => setPaymentMethod('pix')}
                className={`p-10 rounded-3xl border-2 flex flex-col items-center justify-center gap-6 transition-all duration-500 group relative overflow-hidden ${
                  paymentMethod === 'pix' 
                    ? 'bg-white border-white shadow-[0_0_50px_-10px_rgba(255,255,255,0.3)] scale-[1.02]' 
                    : 'bg-white/[0.03] border-white/5 hover:border-white/20'
                }`}
              >
                {paymentMethod === 'pix' && (
                  <motion.div 
                    layoutId="payment-glow"
                    className="absolute inset-0 bg-gradient-to-tr from-black/5 to-transparent pointer-events-none"
                  />
                )}
                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-500 ${paymentMethod === 'pix' ? 'bg-[#32bcad] scale-110 shadow-2xl' : 'bg-white/5 group-hover:bg-white/10'}`}>
                  <img src="https://logospng.org/download/pix/logo-pix-icone-512.png" className={`w-10 h-10 object-contain transition-all duration-500 ${paymentMethod === 'pix' ? 'brightness-100' : 'grayscale brightness-200 opacity-20'}`} alt="Pix" />
                </div>
                <div className={`text-center z-10 p-4 rounded-2xl transition-colors duration-500 ${paymentMethod === 'pix' ? 'bg-black/5' : ''}`}>
                  <div className={`font-black uppercase italic text-xl tracking-tighter ${paymentMethod === 'pix' ? 'text-black' : 'text-white'}`}>Pix</div>
                  <div className={`text-[9px] uppercase font-black px-4 py-1.5 rounded-full mt-3 transition-colors duration-500 ${paymentMethod === 'pix' ? 'bg-[#32bcad] text-white' : 'bg-white/5 text-white/40'}`}>Aprovação Imediata</div>
                </div>
                {paymentMethod === 'pix' && <CheckCircle2 className="text-[#32bcad] w-6 h-6 absolute top-6 right-6" />}
              </button>
            </div>

            <div className="bg-yellow-500/5 border border-yellow-500/20 p-4 rounded-2xl">
              <p className="text-[10px] text-yellow-500/80 font-medium uppercase tracking-tight text-center">
                Nota: Para receber pagamentos diretamente em sua conta (Stripe/PayPal), é necessária uma integração de API específica. Entre em contato com o suporte para configurar.
              </p>
            </div>

            <div className="pt-12 border-t border-white/5 flex flex-col gap-6">
              <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 flex items-center justify-between group">
                <div className="space-y-1">
                  <div className="text-[10px] text-white/40 uppercase font-black tracking-widest">Total do Investimento</div>
                  <div className="text-4xl font-black text-white italic tracking-tighter group-hover:text-steam-blue transition-colors">R$ {finalTotal.toFixed(2)}</div>
                </div>
                <div className="text-right hidden sm:block">
                  <div className="text-[10px] text-white uppercase font-black italic tracking-widest bg-white/10 px-3 py-1 rounded-full mb-3">Gateway Seguro</div>
                  <div className="flex gap-2 justify-end opacity-40">
                    <img src="https://img.icons8.com/color/48/000000/visa.png" className="w-6 h-6 object-contain grayscale brightness-200" alt="" />
                    <img src="https://img.icons8.com/color/48/000000/mastercard.png" className="w-6 h-6 object-contain grayscale brightness-200" alt="" />
                  </div>
                </div>
              </div>

              <button 
                onClick={() => handlePayment()}
                disabled={loading}
                className="w-full bg-white text-black font-black py-6 rounded-3xl flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-95 transition-all shadow-[0_20px_40px_-15px_rgba(255,255,255,0.2)] uppercase italic tracking-[0.2em] text-xl group disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 border-4 border-black/20 border-t-black rounded-full animate-spin" />
                    Preparando Checkout...
                  </div>
                ) : (
                  <>Finalizar agora <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" /></>
                )}
              </button>
              
              <div className="flex items-center justify-center gap-8">
                <button 
                  onClick={() => setStep(hasPhysicalProducts ? 1.5 : 1)}
                  className="text-white/40 text-[10px] font-black uppercase hover:text-white transition-colors tracking-widest"
                >
                  Regressar à Revisão
                </button>
                <div className="w-1 h-1 rounded-full bg-white/20" />
                <div className="flex items-center gap-2 text-[10px] font-black text-white/20 uppercase tracking-widest">
                  <ShieldCheck className="w-3 h-3" /> Transação Criptografada
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {step === 2.5 && paymentMethod === 'pix' && (
          <motion.div 
            key="step2.5-pix" 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.95 }}
            className="max-w-2xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-start"
          >
            <div className="bg-black/40 backdrop-blur-3xl p-10 rounded-[3rem] border border-white/10 shadow-2xl text-center space-y-8">
              <div className="space-y-2">
                <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-white/10 shadow-[0_0_30px_rgba(255,255,255,0.05)]">
                  <img src="https://logospng.org/download/pix/logo-pix-icone-512.png" className="w-10 h-10 object-contain brightness-200" alt="Pix" />
                </div>
                <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">Liquidamento Via Pix</h3>
                <p className="text-white/40 text-[10px] uppercase font-bold tracking-[0.2em]">Prioridade de Entrega Instantânea</p>
              </div>

              <div className="bg-white p-6 rounded-[2.5rem] inline-block mx-auto shadow-[0_0_60px_-10px_rgba(255,255,255,0.1)] border-8 border-white/5">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(pixPayload)}`} 
                  alt="QR Code Pix"
                  className="w-56 h-56"
                />
              </div>

              <button 
                onClick={() => {
                  navigator.clipboard.writeText(pixPayload);
                  alert('Código Pix Copiado!');
                }}
                className="w-full bg-white/5 text-white border border-white/10 font-black py-5 rounded-2xl flex items-center justify-center gap-3 hover:bg-white hover:text-black transition-all uppercase italic tracking-[0.2em] text-[10px]"
              >
                Copiar Chave Pix <Ticket className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="bg-white/5 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-white/10 space-y-6">
                <div className="flex items-center justify-between pb-6 border-b border-white/5">
                  <div className="flex flex-col">
                    <span className="text-white/40 text-[8px] font-black uppercase tracking-widest">Favorecido Oficial</span>
                    <span className="text-white font-black uppercase italic text-sm">{siteSettings?.pixName || 'Administrador Verificado'}</span>
                  </div>
                  <div className="bg-white/10 p-3 rounded-2xl">
                    <ShieldCheck className="w-5 h-5 text-white" />
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-white/40 text-xs font-black uppercase italic tracking-widest">Total Líquido</span>
                  <span className="text-4xl font-black text-white italic tracking-tighter">R$ {finalTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-4">
                <button 
                  onClick={handlePayment}
                  disabled={loading}
                  className="w-full bg-white text-black font-black py-6 rounded-3xl flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-95 transition-all shadow-[0_20px_40px_-15px_rgba(255,255,255,0.2)] uppercase italic tracking-[0.2em] text-lg group"
                >
                  {loading ? (
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 border-4 border-black/20 border-t-black rounded-full animate-spin" />
                      Verificando...
                    </div>
                  ) : (
                    <>CONFIRMAR PAGAMENTO <CheckCircle2 className="w-5 h-5" /></>
                  )}
                </button>
                
                <button 
                  onClick={() => setStep(2)}
                  className="w-full text-white/30 text-[10px] font-black uppercase hover:text-white transition-colors tracking-widest flex items-center justify-center gap-2"
                >
                  Voltar às Opções
                </button>
              </div>

              <div className="bg-white/[0.02] p-6 rounded-3xl border border-white/5 flex gap-4">
                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="text-white w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-white font-black text-[10px] uppercase italic tracking-widest">Verificação em Tempo Real</h4>
                  <p className="text-white/40 text-[9px] leading-relaxed font-bold tracking-tight uppercase">O sistema detecta o pagamento automaticamente em até 15 segundos após o envio do Pix.</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {step === 2.5 && paymentMethod === 'credit_card' && (
          <motion.div 
            key="step2.5-card" 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.95 }}
            className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-start"
          >
            <div className="bg-black/40 backdrop-blur-3xl p-10 rounded-[3rem] border border-white/10 shadow-2xl space-y-10">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-2 border border-white/10">
                  <CreditCard className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">Finalizar Pagamento</h3>
                <p className="text-white/40 text-[10px] uppercase font-bold tracking-[0.2em]">Criptografia de Nível Bancário Ativada</p>
              </div>

              <form onSubmit={handlePayment} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1">Número do Cartão</label>
                  <input 
                    type="text" 
                    value={cardData.number}
                    onChange={(e) => setCardData({...cardData, number: e.target.value})}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-5 text-base text-white focus:border-white focus:bg-white/[0.07] outline-none transition-all placeholder:text-white/10"
                    placeholder="0000 0000 0000 0000"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1">Nome Completo do Titular</label>
                  <input 
                    type="text" 
                    value={cardData.name}
                    onChange={(e) => setCardData({...cardData, name: e.target.value})}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-5 text-base text-white focus:border-white focus:bg-white/[0.07] outline-none transition-all placeholder:text-white/10"
                    placeholder="NOME COMO NO CARTÃO"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1">Data de Expiração</label>
                    <input 
                      type="text" 
                      value={cardData.expiry}
                      onChange={(e) => setCardData({...cardData, expiry: e.target.value})}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-5 text-base text-white focus:border-white focus:bg-white/[0.07] outline-none transition-all placeholder:text-white/10"
                      placeholder="MM/AA"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1">Código (CVV)</label>
                    <input 
                      type="password" 
                      value={cardData.cvv}
                      onChange={(e) => setCardData({...cardData, cvv: e.target.value})}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-5 text-base text-white focus:border-white focus:bg-white/[0.07] outline-none transition-all placeholder:text-white/10"
                      placeholder="***"
                      required
                      maxLength={3}
                    />
                  </div>
                </div>
              </form>
            </div>

            <div className="space-y-8">
              <div className="bg-white/5 backdrop-blur-2xl p-10 rounded-[3rem] border border-white/10 space-y-8">
                <h4 className="text-white font-black text-xs uppercase tracking-[0.3em] italic border-b border-white/5 pb-6">Detalhes do Pedido</h4>
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">Valor Bruto</span>
                    <span className="text-white font-bold text-sm">R$ {total.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-red-400 text-[10px] font-black uppercase tracking-widest">Bônus Aplicado</span>
                      <span className="text-red-400 font-bold text-sm">- R$ {discount.toFixed(2)}</span>
                    </div>
                  )}
                  {hasPhysicalProducts && (
                    <div className="flex items-center justify-between">
                      <span className="text-white/40 text-[10px] font-black uppercase tracking-widest text-left max-w-[150px]">Frete ({shippingMethod.name})</span>
                      <span className="text-white/60 font-bold text-sm">R$ {shippingMethod.cost.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="pt-8 border-t border-white/5 flex items-center justify-between">
                    <span className="text-white text-xs font-black uppercase italic tracking-widest">Total Liquidado</span>
                    <span className="text-4xl font-black text-white italic tracking-tighter">R$ {finalTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <button 
                  onClick={handlePayment}
                  disabled={loading}
                  className="w-full bg-white text-black font-black py-6 rounded-3xl flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-95 transition-all shadow-[0_20px_40px_-15px_rgba(255,255,255,0.2)] uppercase italic tracking-[0.2em] text-xl group"
                >
                  {loading ? (
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 border-4 border-black/20 border-t-black rounded-full animate-spin" />
                      Processando...
                    </div>
                  ) : (
                    <>AUTORIZAR PAGAMENTO <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" /></>
                  )}
                </button>
                <button 
                  onClick={() => setStep(2)}
                  className="w-full text-white/30 text-[10px] font-black uppercase hover:text-white transition-colors tracking-widest flex items-center justify-center gap-2"
                >
                  Alterar Método de Pagamento
                </button>
              </div>

              <div className="flex items-center gap-4 bg-white/[0.02] p-6 rounded-3xl border border-white/5">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="text-white w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-white font-black text-[10px] uppercase italic tracking-widest">Privacidade Garantida</h4>
                  <p className="text-white/40 text-[9px] leading-relaxed uppercase font-bold tracking-wider">Seus dados nunca são armazenados em nossos servidores. Processamento direto via Gateway PCI.</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div 
            key="step3" 
            initial={{ scale: 0.8, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            className="flex flex-col items-center justify-center py-20 text-center max-w-2xl mx-auto"
          >
            <div className="w-32 h-32 bg-white/5 border border-white/10 rounded-[2.5rem] flex items-center justify-center mb-8 text-white shadow-2xl">
              <CheckCircle2 className="w-16 h-16" />
            </div>
            <h2 className="text-5xl font-black text-white italic uppercase mb-4 tracking-tighter">Pedido Confirmado</h2>
            <p className="text-white/40 max-w-sm mx-auto mb-12 uppercase font-black text-[10px] tracking-[0.3em] leading-relaxed">
              Obrigado pela confiança. Seus produtos foram liberados e enviados para seu dashboard.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 w-full">
              <button 
                onClick={() => navigate('/profile')} 
                className="flex-1 bg-white text-black font-black px-10 py-5 rounded-2xl uppercase italic tracking-widest shadow-2xl hover:scale-105 transition-all text-sm"
              >
                Acessar Meus Produtos
              </button>
              <button 
                onClick={() => navigate('/')} 
                className="flex-1 bg-white/5 text-white border border-white/10 font-black px-10 py-5 rounded-2xl uppercase italic tracking-widest hover:bg-white/10 transition-all text-sm"
              >
                Voltar ao Início
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CheckoutPage;
