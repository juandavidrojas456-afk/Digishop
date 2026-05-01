import React, { useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, CreditCard, ChevronRight, CheckCircle2, Plus, Minus } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion } from 'motion/react';

const CartPage = () => {
  const { items, removeFromCart, updateQuantity, total, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleCheckout = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (items.length === 0) return;
    navigate('/checkout');
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <CheckCircle2 className="w-20 h-20 text-steam-green" />
        <h1 className="text-3xl font-bold text-white uppercase italic">¡Pedido Confirmado!</h1>
        <p className="text-steam-accent max-w-md">Gracias por su compra. Sus llaves digitales han sido enviadas a su perfil.</p>
        <button
          onClick={() => navigate('/profile')}
          className="bg-steam-blue text-steam-dark font-bold px-8 py-3 rounded hover:bg-opacity-80 transition-all"
        >
          Ver Mis Llaves
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <ShoppingBag className="w-16 h-16 text-steam-card" />
        <h1 className="text-2xl font-bold text-white uppercase italic">Tu Carrito está Vacío</h1>
        <p className="text-steam-accent">Parece que aún no has añadido ningún juego.</p>
        <button
          onClick={() => navigate('/')}
          className="bg-steam-blue text-steam-dark font-bold px-8 py-3 rounded hover:bg-opacity-80 transition-all"
        >
          Explorar Tienda
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 pb-20 px-2 sm:px-0">
      <div className="lg:col-span-2 space-y-4 md:space-y-6">
        <h1 className="text-xl md:text-2xl font-bold text-white uppercase italic flex items-center gap-3">
          <ShoppingBag className="w-5 h-5 md:w-6 md:h-6 text-steam-blue" />
          Carrito de Compras ({items.length})
        </h1>

        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="bg-steam-bg/50 border border-steam-card p-3 md:p-4 rounded-xl flex gap-3 md:gap-4 items-center relative group">
              <img src={item.image} alt={item.name} className="w-16 h-16 md:w-20 md:h-20 object-cover rounded shadow-lg" referrerPolicy="no-referrer" />
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-white text-sm md:text-base truncate">{item.name}</h3>
                <p className="text-steam-green font-bold text-xs md:text-sm">$ {item.price.toLocaleString('es-CO')}</p>
              </div>
              
              <div className="flex items-center gap-2 md:gap-3 bg-steam-bg border border-steam-card px-2 py-0.5 md:px-3 md:py-1 rounded-lg scale-90 md:scale-100">
                <button 
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className="p-1 hover:text-steam-blue transition-colors"
                >
                  <Minus className="w-3 h-3 md:w-4 md:h-4" />
                </button>
                <span className="text-xs md:text-sm font-black text-white w-4 md:w-6 text-center">{item.quantity}</span>
                <button 
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="p-1 hover:text-steam-blue transition-colors"
                >
                  <Plus className="w-3 h-3 md:w-4 md:h-4" />
                </button>
              </div>

              <div className="text-right min-w-[60px] md:min-w-[80px] hidden sm:block">
                <p className="text-white font-black text-sm italic">$ {(item.price * item.quantity).toLocaleString('es-CO')}</p>
              </div>

              <button
                onClick={() => removeFromCart(item.id)}
                className="p-2 text-red-500/40 hover:text-red-500 hover:bg-red-500/10 rounded transition-all sm:static absolute top-2 right-2"
              >
                <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-steam-card p-6 rounded-xl border border-steam-blue/20 space-y-6 lg:sticky lg:top-24">
          <h2 className="text-lg font-bold text-white uppercase italic">Resumen</h2>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-steam-accent">
              <span>Subtotal</span>
              <span>$ {total.toLocaleString('es-CO')}</span>
            </div>
            <div className="flex justify-between text-steam-accent">
              <span>Tasas</span>
              <span className="text-steam-green">GRATIS</span>
            </div>
            <div className="pt-2 border-t border-steam-bg flex justify-between text-lg font-bold text-white">
              <span>Total</span>
              <span className="text-steam-green">$ {total.toLocaleString('es-CO')}</span>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={isProcessing}
            className="w-full bg-steam-blue hover:bg-opacity-80 text-steam-dark font-bold py-4 rounded flex items-center justify-center gap-2 transition-all transform active:scale-95"
          >
            {isProcessing ? (
              'Procesando...'
            ) : (
              <>
                Finalizar Compra <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const PaymentChoice = ({ id, label, active, onClick }: any) => (
  <button
    onClick={onClick}
    className={`p-3 rounded-lg border text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 ${
      active 
        ? 'border-steam-blue bg-steam-blue/10 text-steam-blue' 
        : 'border-steam-card bg-steam-dark text-steam-accent hover:border-steam-accent'
    }`}
  >
    {label}
  </button>
);

export default CartPage;
