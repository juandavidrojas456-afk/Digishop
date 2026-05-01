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
  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'pix'>('pix');
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

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Simulate payment delay
      await new Promise(resolve => setTimeout(resolve, 2000));

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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                onClick={() => setPaymentMethod('pix')}
                className={`p-8 rounded-3xl border-2 flex flex-col items-center justify-center gap-4 transition-all duration-300 group ${
                  paymentMethod === 'pix' 
                    ? 'bg-[#32bcad]/10 border-[#32bcad] shadow-[0_0_30px_-10px_rgba(50,188,173,0.4)]' 
                    : 'bg-steam-card/20 border-steam-card hover:border-[#32bcad]/40'
                }`}
              >
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${paymentMethod === 'pix' ? 'bg-[#32bcad] scale-110 shadow-lg' : 'bg-steam-dark group-hover:bg-steam-card'}`}>
                  <img src="https://logospng.org/download/pix/logo-pix-icone-512.png" className={`w-10 h-10 object-contain transition-all ${paymentMethod === 'pix' ? 'brightness-100' : 'grayscale brightness-200'}`} alt="Pix" />
                </div>
                <div className="text-center">
                  <div className="font-black text-white uppercase italic text-lg tracking-wider">Pix</div>
                  <div className="text-[10px] text-[#32bcad] uppercase font-black bg-[#32bcad]/10 px-3 py-1 rounded-full mt-2">Pague Agora</div>
                </div>
                {paymentMethod === 'pix' && <CheckCircle2 className="text-[#32bcad] w-6 h-6 absolute top-4 right-4" />}
              </button>

              <button 
                onClick={() => setPaymentMethod('credit_card')}
                className={`p-8 rounded-3xl border-2 flex flex-col items-center justify-center gap-4 transition-all duration-300 group ${
                  paymentMethod === 'credit_card' 
                    ? 'bg-orange-500/10 border-orange-500 shadow-[0_0_30px_-10px_rgba(249,115,22,0.4)]' 
                    : 'bg-steam-card/20 border-steam-card hover:border-orange-500/40'
                }`}
              >
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${paymentMethod === 'credit_card' ? 'bg-orange-500 scale-110 shadow-lg' : 'bg-steam-dark group-hover:bg-steam-card'}`}>
                  <CreditCard className={`w-10 h-10 transition-all ${paymentMethod === 'credit_card' ? 'text-white' : 'text-steam-accent'}`} />
                </div>
                <div className="text-center">
                  <div className="font-black text-white uppercase italic text-lg tracking-wider">Cartão</div>
                  <div className="text-[10px] text-orange-500 uppercase font-black bg-orange-500/10 px-3 py-1 rounded-full mt-2">Até 12x</div>
                </div>
                {paymentMethod === 'credit_card' && <CheckCircle2 className="text-orange-500 w-6 h-6 absolute top-4 right-4" />}
              </button>
            </div>

            <div className="bg-yellow-500/5 border border-yellow-500/20 p-4 rounded-2xl">
              <p className="text-[10px] text-yellow-500/80 font-medium uppercase tracking-tight text-center">
                Nota: Para receber pagamentos diretamente em sua conta (Stripe/PayPal), é necessária uma integração de API específica. Entre em contato com o suporte para configurar.
              </p>
            </div>

            <div className="pt-8 border-t border-steam-card/40 flex flex-col gap-4">
              <div className="bg-steam-dark/50 p-6 rounded-2xl border border-steam-card flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-steam-accent uppercase font-black opacity-50">Total a Pagar</div>
                  <div className="text-3xl font-black text-white italic tracking-tighter">R$ {finalTotal.toFixed(2)}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-steam-green uppercase font-black">Pagamento Protegido</div>
                  <div className="flex gap-1 justify-end mt-1">
                    <ShieldCheck className="w-4 h-4 text-steam-green" />
                    <img src="https://img.icons8.com/color/48/000000/visa.png" className="w-5 h-5 object-contain grayscale" alt="" />
                    <img src="https://img.icons8.com/color/48/000000/mastercard.png" className="w-5 h-5 object-contain grayscale" alt="" />
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setStep(2.5)}
                className="w-full bg-steam-blue text-steam-dark font-black py-5 rounded-2xl flex items-center justify-center gap-3 hover:bg-opacity-90 transition-all shadow-2xl uppercase italic tracking-widest text-lg"
              >
                Confirmar Escolha <ArrowRight className="w-6 h-6" />
              </button>
              
              <button 
                onClick={() => setStep(hasPhysicalProducts ? 1.5 : 1)}
                className="text-steam-accent text-[10px] font-black uppercase hover:text-white transition-colors"
              >
                Voltar para Revisão
              </button>
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
            <div className="bg-steam-card/20 p-8 rounded-3xl border border-steam-card shadow-2xl text-center space-y-6">
              <div className="space-y-1">
                <div className="w-16 h-16 bg-[#32bcad]/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#32bcad]/20 shadow-[0_0_20px_rgba(50,188,173,0.1)]">
                  <img src="https://logospng.org/download/pix/logo-pix-icone-512.png" className="w-10 h-10 object-contain" alt="Pix" />
                </div>
                <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Pagar via Pix</h3>
                <p className="text-steam-accent text-[10px] uppercase font-bold opacity-60">Instantâneo e 100% Protegido</p>
              </div>

              <div className="bg-white p-5 rounded-[2.5rem] inline-block mx-auto shadow-[0_0_50px_-5px_rgba(255,255,255,0.05)] border-4 border-steam-card">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(pixPayload)}`} 
                  alt="QR Code Pix"
                  className="w-56 h-56"
                />
              </div>

              <button 
                onClick={() => {
                  navigator.clipboard.writeText(pixPayload);
                  alert('Código Pix Copiado com Sucesso!');
                }}
                className="w-full bg-steam-dark text-[#32bcad] border border-[#32bcad]/30 font-black py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-[#32bcad] hover:text-steam-dark transition-all uppercase italic tracking-widest text-xs"
              >
                Copia e Cola <Ticket className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="bg-steam-card/20 p-6 rounded-3xl border border-steam-card space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-white/5">
                  <div className="flex flex-col">
                    <span className="text-steam-accent text-[8px] font-black uppercase opacity-40">Loja Oficial</span>
                    <span className="text-white font-black uppercase italic text-sm">{siteSettings?.pixName || 'Administrador Verificado'}</span>
                  </div>
                  <div className="bg-[#32bcad]/20 p-2 rounded-lg shadow-[0_0_15px_rgba(50,188,173,0.2)]">
                    <ShieldCheck className="w-5 h-5 text-[#32bcad]" />
                  </div>
                </div>
                <div className="flex items-center justify-between pb-4 border-b border-white/5">
                  <span className="text-steam-accent text-xs font-bold uppercase">ID da Transação</span>
                  <span className="text-steam-accent font-mono text-[10px] opacity-60">#{Math.random().toString(36).substring(7).toUpperCase()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#32bcad] text-xs font-black uppercase italic">Total Final</span>
                  <span className="text-3xl font-black text-white italic tracking-tighter">R$ {finalTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="bg-steam-green/5 p-6 rounded-3xl border border-steam-green/20 space-y-4">
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-steam-green/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="text-steam-green w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-steam-green font-black text-[10px] uppercase italic">Pagamento 100% Seguro</h4>
                    <p className="text-steam-accent text-[10px] leading-relaxed opacity-70">Sua transação está protegida por encriptação militar ponta-a-ponta.</p>
                  </div>
                </div>

                <button 
                  onClick={handlePayment}
                  disabled={loading}
                  className="w-full bg-steam-green text-steam-dark font-black py-5 rounded-2xl flex items-center justify-center gap-3 hover:bg-opacity-90 transition-all shadow-2xl uppercase italic tracking-widest"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-steam-dark border-t-transparent rounded-full animate-spin" />
                      Processando...
                    </div>
                  ) : (
                    <>JÁ PAGUEI O PIX <CheckCircle2 className="w-5 h-5" /></>
                  )}
                </button>
              </div>

              <button 
                onClick={() => setStep(2)}
                className="w-full text-steam-accent text-[10px] font-black uppercase hover:text-white transition-colors"
              >
                Alterar Método de Pagamento
              </button>
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
            <div className="bg-steam-card/20 p-10 rounded-3xl border border-steam-card shadow-2xl space-y-8">
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="w-16 h-16 bg-steam-blue/20 rounded-2xl flex items-center justify-center mb-2">
                  <CreditCard className="w-8 h-8 text-steam-blue" />
                </div>
                <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Cartão de Crédito</h3>
                <p className="text-steam-accent text-[10px] uppercase font-bold opacity-60">Pagamento Processado com Segurança</p>
              </div>

              <form onSubmit={handlePayment} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-steam-accent opacity-50">Número do Cartão</label>
                  <input 
                    type="text" 
                    value={cardData.number}
                    onChange={(e) => setCardData({...cardData, number: e.target.value})}
                    className="w-full bg-steam-dark border border-steam-card rounded-xl p-4 text-sm focus:border-steam-blue outline-none transition-all"
                    placeholder="0000 0000 0000 0000"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-steam-accent opacity-50">Nome do Titular</label>
                  <input 
                    type="text" 
                    value={cardData.name}
                    onChange={(e) => setCardData({...cardData, name: e.target.value})}
                    className="w-full bg-steam-dark border border-steam-card rounded-xl p-4 text-sm focus:border-steam-blue outline-none transition-all"
                    placeholder="COMO IMPRESSO"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-steam-accent opacity-50">Validade</label>
                    <input 
                      type="text" 
                      value={cardData.expiry}
                      onChange={(e) => setCardData({...cardData, expiry: e.target.value})}
                      className="w-full bg-steam-dark border border-steam-card rounded-xl p-4 text-sm focus:border-steam-blue outline-none transition-all"
                      placeholder="MM/AA"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-steam-accent opacity-50">CVV</label>
                    <input 
                      type="password" 
                      value={cardData.cvv}
                      onChange={(e) => setCardData({...cardData, cvv: e.target.value})}
                      className="w-full bg-steam-dark border border-steam-card rounded-xl p-4 text-sm focus:border-steam-blue outline-none transition-all"
                      placeholder="***"
                      required
                      maxLength={3}
                    />
                  </div>
                </div>
              </form>
            </div>

            <div className="space-y-6">
              <div className="bg-steam-card/20 p-8 rounded-3xl border border-steam-card space-y-6">
                <h4 className="text-white font-black text-sm uppercase italic border-b border-steam-card pb-4">Resumo do Pagamento</h4>
                <div className="flex items-center justify-between">
                  <span className="text-steam-accent text-xs font-bold uppercase">Subtotal</span>
                  <span className="text-white font-bold">R$ {total.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-red-400 text-xs font-bold uppercase">Desconto</span>
                    <span className="text-red-400 font-bold">- R$ {discount.toFixed(2)}</span>
                  </div>
                )}
                {hasPhysicalProducts && (
                  <div className="flex items-center justify-between">
                    <span className="text-steam-accent text-xs font-bold uppercase text-left w-1/2">Frete ({shippingMethod.name})</span>
                    <span className="text-steam-accent font-bold">R$ {shippingMethod.cost.toFixed(2)}</span>
                  </div>
                )}
                <div className="pt-4 border-t border-steam-card flex items-center justify-between">
                  <span className="text-steam-blue text-xs font-black uppercase italic">Total Final</span>
                  <span className="text-3xl font-black text-white italic tracking-tighter">R$ {finalTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="bg-steam-blue/5 p-8 rounded-3xl border border-steam-blue/20 space-y-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-steam-blue/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="text-steam-blue w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-steam-blue font-black text-xs uppercase italic">Transação Segura</h4>
                    <p className="text-steam-accent text-[10px] leading-relaxed opacity-70">Seus dados de cartão são processados em gateway certificado PCI-DSS.</p>
                  </div>
                </div>

                <button 
                  onClick={handlePayment}
                  disabled={loading}
                  className="w-full bg-steam-blue text-steam-dark font-black py-5 rounded-2xl flex items-center justify-center gap-3 hover:bg-opacity-90 transition-all shadow-2xl uppercase italic tracking-widest text-lg"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-steam-dark border-t-transparent rounded-full animate-spin" />
                      Processando...
                    </div>
                  ) : (
                    <>FINALIZAR COMPRA <ArrowRight className="w-6 h-6" /></>
                  )}
                </button>
              </div>

              <button 
                onClick={() => setStep(2)}
                className="w-full text-steam-accent text-[10px] font-black uppercase hover:text-white transition-colors"
              >
                Mudar Forma de Pagamento
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div 
            key="step3" 
            initial={{ scale: 0.8, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            className="flex flex-col items-center justify-center py-12 text-center"
          >
            <div className="w-24 h-24 bg-steam-green/20 rounded-full flex items-center justify-center mb-6 text-steam-green">
              <CheckCircle2 className="w-16 h-16" />
            </div>
            <h2 className="text-4xl font-black text-white italic uppercase mb-2">Pagamento Realizado!</h2>
            <p className="text-steam-accent max-w-sm mx-auto mb-8">
              Sua compra foi confirmada com sucesso. Você já pode acessar seu produto na aba "Pedidos" ou através do Chat de Suporte.
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => navigate('/profile')} 
                className="bg-steam-blue text-steam-dark font-black px-8 py-3 rounded-xl uppercase italic tracking-widest shadow-xl hover:scale-105 transition-all"
              >
                Ver Meus Pedidos
              </button>
              <button 
                onClick={() => navigate('/')} 
                className="bg-steam-card text-white font-black px-8 py-3 rounded-xl uppercase italic tracking-widest shadow-xl hover:bg-steam-blue/20 transition-all"
              >
                Voltar à Loja
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CheckoutPage;
