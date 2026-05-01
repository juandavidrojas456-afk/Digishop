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

  if (!user) return <div className="text-center p-12 text-steam-accent italic underline underline-offset-8">Please login to view your profile.</div>;

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
              <p className="text-sm text-steam-accent uppercase tracking-widest">{profile?.role || 'Customer'}</p>
            </div>

            {profile?.role === 'admin' && (
              <Link 
                to="/admin" 
                className="flex items-center justify-center gap-2 w-full bg-steam-blue text-steam-dark font-black py-3 rounded-xl text-xs uppercase italic tracking-widest hover:bg-opacity-80 transition-all shadow-lg"
              >
                <LayoutDashboard className="w-4 h-4" />
                ADMIN PANEL
              </Link>
            )}

            <div className="pt-4 border-t border-steam-card">
              <span className="text-xs text-steam-accent block mb-1">Balance</span>
              <span className="text-2xl font-bold text-steam-green">${profile?.balance?.toFixed(2) || '0.00'}</span>
            </div>
          </div>

          <div className="bg-steam-bg border border-steam-card rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Share2 className="w-4 h-4 text-steam-blue" /> Affiliate Program
            </h3>
            <p className="text-xs text-steam-accent leading-relaxed">Share your link and earn 5% of every purchase made by your friends.</p>
            <button 
              onClick={copyAffiliate}
              className="w-full flex items-center justify-between bg-steam-card hover:bg-steam-blue/20 p-2 rounded text-xs transition-all"
            >
              <span className="truncate mr-2 font-mono">{user.uid.slice(0, 8)}...</span>
              {copied ? <span className="text-steam-green font-bold">COPIED</span> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white uppercase tracking-tight italic">My Library</h2>
            <div className="flex gap-4">
              <Stat icon={<Package />} value={orders.length} label="Total Orders" />
              <Stat icon={<Gift />} value={0} label="Gifts" />
            </div>
          </div>

          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="bg-steam-card/30 border border-dashed border-steam-card rounded-xl p-12 text-center text-steam-accent italic text-sm">
                You haven't made any purchases yet. Explore our store!
              </div>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="bg-steam-card/40 border border-steam-card rounded-xl p-5 flex flex-col md:flex-row justify-between items-center gap-4 hover:shadow-[0_0_15px_rgba(102,192,244,0.1)] transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-steam-dark rounded overflow-hidden flex-shrink-0">
                      <img src={`https://picsum.photos/seed/${order.productId}/100`} alt="Game" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white uppercase truncate max-w-[200px]">Order #{order.id.slice(0, 8)}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded font-bold uppercase">{order.status}</span>
                        <span className="text-[10px] text-steam-accent">{new Date(order.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 flex justify-center px-4">
                    <div className="bg-steam-dark px-4 py-2 rounded-lg border border-steam-card flex items-center gap-3 w-full max-w-sm">
                      <Key className="w-4 h-4 text-steam-blue flex-shrink-0" />
                      <span className="font-mono text-sm tracking-wider text-steam-blue truncate">
                        {order.deliveryKey || 'PENDING DELIVERY'}
                      </span>
                      {order.deliveryKey && (
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(order.deliveryKey);
                            alert('Key copied to clipboard!');
                          }}
                          className="text-[10px] bg-steam-blue/20 hover:bg-steam-blue/30 px-2 py-1 rounded text-white transition-colors"
                        >
                          COPY
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="block text-xl font-bold text-white">${order.amount.toFixed(2)}</span>
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
