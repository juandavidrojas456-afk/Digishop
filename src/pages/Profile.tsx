import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Package, Gift, CreditCard, Share2, Copy, Key, LayoutDashboard } from 'lucide-react';

const Profile = () => {
  const { user, profile } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'orders'), where('buyerId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  const copyAffiliate = () => {
    const url = `${window.location.origin}/?ref=${user?.uid}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!user) return <div className="text-center p-12 text-steam-accent italic underline underline-offset-8">Por favor inicia sesión para ver tu perfil.</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-1/3 xl:w-1/4 space-y-6">
          <div className="bg-steam-bg border border-steam-card rounded-xl p-6 text-center space-y-4">
            <div className="w-24 h-24 bg-steam-card rounded-full mx-auto flex items-center justify-center border-4 border-steam-blue/20 overflow-hidden">
              {profile?.photoURL ? (
                <img 
                  src={profile.photoURL} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="text-4xl font-bold text-steam-blue">{user.email?.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{profile?.displayName || user.email?.split('@')[0]}</h2>
              <p className="text-sm text-steam-accent uppercase tracking-widest">{profile?.role || 'Cliente'}</p>
            </div>

            {profile?.role === 'admin' && (
              <Link 
                to="/admin" 
                className="flex items-center justify-center gap-2 w-full bg-steam-blue text-steam-dark font-black py-3 rounded-xl text-xs uppercase italic tracking-widest hover:bg-opacity-80 transition-all shadow-lg"
              >
                <LayoutDashboard className="w-4 h-4" />
                PANEL ADMIN
              </Link>
            )}

            <div className="pt-4 border-t border-steam-card">
              <span className="text-xs text-steam-accent block mb-1">Saldo</span>
              <span className="text-2xl font-bold text-steam-green">COP {profile?.balance?.toLocaleString('es-CO') || '0'}</span>
            </div>
          </div>

          <div className="bg-steam-bg border border-steam-card rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Share2 className="w-4 h-4 text-steam-blue" /> Programa de Afiliados
            </h3>
            <p className="text-xs text-steam-accent leading-relaxed">Comparte tu enlace y gana el 5% de cada compra realizada por tus amigos.</p>
            <button 
              onClick={copyAffiliate}
              className="w-full flex items-center justify-between bg-steam-card hover:bg-steam-blue/20 p-2 rounded text-xs transition-all"
            >
              <span className="truncate mr-2 font-mono">{user.uid.slice(0, 8)}...</span>
              {copied ? <span className="text-steam-green font-bold">COPIADO</span> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white uppercase tracking-tight italic">Mi Biblioteca</h2>
            <div className="flex gap-4">
              <Stat icon={<Package />} value={orders.length} label="Pedidos Totales" />
              <Stat icon={<Gift />} value={0} label="Regalos" />
            </div>
          </div>

          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="bg-steam-card/30 border border-dashed border-steam-card rounded-xl p-12 text-center text-steam-accent italic text-sm">
                Aún no has realizado ninguna compra. ¡Explora nuestra tienda!
              </div>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="bg-steam-card/40 border border-steam-card rounded-xl p-5 flex flex-col md:flex-row justify-between items-center gap-4 hover:shadow-[0_0_15px_rgba(102,192,244,0.1)] transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-steam-dark rounded overflow-hidden flex-shrink-0">
                      <img src={`https://picsum.photos/seed/${order.productId}/100`} alt="Game" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white uppercase truncate max-w-[200px]">Pedido #{order.id.slice(0, 8)}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded font-bold uppercase">{order.status === 'paid' ? 'Pagado' : order.status}</span>
                        <span className="text-[10px] text-steam-accent">{new Date(order.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 flex justify-center px-4">
                    <div className="bg-steam-dark px-4 py-2 rounded-lg border border-steam-card flex items-center gap-3 w-full max-w-sm">
                      <Key className="w-4 h-4 text-steam-blue flex-shrink-0" />
                      <span className="font-mono text-sm tracking-wider text-steam-blue truncate">
                        {order.deliveryKey || 'ENTREGA PENDIENTE'}
                      </span>
                      {order.deliveryKey && (
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(order.deliveryKey);
                            alert('¡Clave copiada al portapapeles!');
                          }}
                          className="text-[10px] bg-steam-blue/20 hover:bg-steam-blue/30 px-2 py-1 rounded text-white transition-colors"
                        >
                          COPIAR
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="block text-xl font-bold text-white">$ {order.amount.toLocaleString('es-CO')}</span>
                    <span className="text-[10px] text-steam-accent uppercase tracking-widest">{order.paymentMethod}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Stat = ({ icon, value, label }: { icon: any, value: any, label: string }) => (
  <div className="flex items-center gap-3 bg-steam-bg border border-steam-card px-4 py-2 rounded-lg">
    <div className="text-steam-blue">{icon}</div>
    <div className="flex flex-col">
      <span className="text-lg font-bold text-white leading-none">{value}</span>
      <span className="text-[10px] text-steam-accent uppercase tracking-tighter">{label}</span>
    </div>
  </div>
);

export default Profile;
