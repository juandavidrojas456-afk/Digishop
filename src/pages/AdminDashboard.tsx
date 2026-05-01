import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, doc, updateDoc, deleteDoc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, ShoppingBag, Users, TrendingUp, Plus, Edit2, Trash2, CheckCircle, Clock, Settings, Save, Ticket, MessageSquare, CreditCard, CheckCircle2, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const AdminDashboard = () => {
  const { profile, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  
  const [siteSettings, setSiteSettings] = useState({
    storeName: 'GameMarket',
    tagline: 'The ultimate digital marketplace',
    activeBanner: 'https://picsum.photos/seed/promo/1200/400',
    pixKey: 'Juandavidrojas456@gmail.com',
    pixName: 'Juandavid Rojas'
  });

  // Form State for product
  const initialProductState = {
    name: '',
    price: 0,
    originalPrice: 0,
    category: 'Assinaturas Premium',
    badgeType: 'CONTA',
    stock: 10,
    description: '',
    deliveryContent: '',
    autoMessage: '¡Gracias por su compra! Aquí tiene su acceso:',
    isAutoDelivery: true,
    isPhysical: false,
    sellerName: 'Steam offline Official',
    sellerAvatar: '',
    sellerRating: 5,
    sellerSales: 120,
    imageInput: ''
  };
  const [newProduct, setNewProduct] = useState(initialProductState);

  const [newCoupon, setNewCoupon] = useState({
    code: '',
    discountType: 'percentage',
    value: 10,
    isActive: true
  });

  useEffect(() => {
    if (profile?.role !== 'admin') return;

    const unsubProducts = onSnapshot(collection(db, 'products'), (s) => setProducts(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubOrders = onSnapshot(collection(db, 'orders'), (s) => setOrders(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubUsers = onSnapshot(collection(db, 'users'), (s) => setUsers(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubCoupons = onSnapshot(collection(db, 'coupons'), (s) => setCoupons(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    
    const unsubSettings = onSnapshot(doc(db, 'settings', 'site'), (s) => {
      if (s.exists()) setSiteSettings(s.data() as any);
    });

    return () => { unsubProducts(); unsubOrders(); unsubUsers(); unsubSettings(); unsubCoupons(); };
  }, [profile]);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const productData = {
        name: newProduct.name,
        price: newProduct.price,
        originalPrice: newProduct.originalPrice || newProduct.price,
        category: newProduct.category,
        badgeType: newProduct.badgeType,
        stock: newProduct.stock,
        isPhysical: newProduct.isPhysical,
        description: newProduct.description,
        deliveryContent: newProduct.deliveryContent,
        autoMessage: newProduct.autoMessage,
        isAutoDelivery: true,
        sellerId: profile?.uid,
        sellerName: newProduct.sellerName || profile?.displayName || 'Vendedor Oficial',
        sellerAvatar: newProduct.sellerAvatar || profile?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.uid}`,
        sellerRating: newProduct.sellerRating || 5,
        sellerSales: newProduct.sellerSales || 100,
        images: [newProduct.imageInput || `https://picsum.photos/seed/${Date.now()}/800/450`],
        createdAt: new Date().toISOString()
      };

      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), productData);
        setEditingProduct(null);
      } else {
        await addDoc(collection(db, 'products'), productData);
      }
      setNewProduct(initialProductState);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    await addDoc(collection(db, 'coupons'), newCoupon);
    setNewCoupon({ code: '', discountType: 'percentage', value: 10, isActive: true });
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, 'settings', 'site'), siteSettings);
      alert('¡Configuraciones guardadas con éxito!');
    } catch (err) {
      console.error(err);
      alert('Error al guardar configuraciones.');
    }
  };

  const calculateStats = () => {
    const totalEarnings = orders.reduce((acc, curr) => acc + (curr.status === 'paid' ? curr.amount : 0), 0);
    return { totalEarnings, productCount: products.length, userCount: users.length };
  };

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 border-4 border-steam-blue border-t-transparent rounded-full animate-spin" />
      <p className="text-steam-accent text-xs font-black uppercase italic animate-pulse">Autenticando...</p>
    </div>
  );

  if (profile?.role !== 'admin') return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-2xl max-w-md text-center space-y-4">
        <ShieldAlert className="w-16 h-16 text-red-500 mx-auto opacity-50" />
        <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Acceso Denegado</h2>
        <p className="text-steam-accent text-sm leading-relaxed">
          Su cuenta actual no posee permisos administrativos. Si es el dueño de la tienda, asegúrese de estar logueado con el correo correcto.
        </p>
        <button 
          onClick={() => window.location.href = '/'}
          className="bg-steam-blue text-steam-dark font-black px-6 py-2 rounded-lg text-[10px] uppercase italic tracking-widest"
        >
          Volver al Inicio
        </button>
      </div>
    </div>
  );

  const stats = calculateStats();

  return (
    <div className="flex flex-col lg:flex-row gap-6 md:gap-8 px-2 sm:px-0">
      <div className="w-full lg:w-64 flex flex-row lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 lg:overflow-visible sticky top-16 md:top-20 z-40 bg-steam-bg/80 backdrop-blur py-2">
        <NavButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={<LayoutDashboard className="w-4 h-4" />} label="Resumen" />
        <NavButton active={activeTab === 'products'} onClick={() => setActiveTab('products')} icon={<ShoppingBag className="w-4 h-4" />} label="Inventario" />
        <NavButton active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} icon={<Clock className="w-4 h-4" />} label="Pedidos" />
        <NavButton active={activeTab === 'coupons'} onClick={() => setActiveTab('coupons')} icon={<Ticket className="w-4 h-4" />} label="Cupones" />
        <NavButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Settings className="w-4 h-4" />} label="Ajustes" />
      </div>

      <div className="flex-1 min-w-0">
        <AnimatePresence mode="wait">
          {activeTab === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              <form onSubmit={handleUpdateSettings} className="bg-steam-card/20 border border-steam-card rounded-2xl p-8 space-y-8">
                <div className="flex items-center gap-3 text-xl font-bold text-white uppercase italic">
                  <Settings className="text-steam-blue" />
                  Configuraciones Generales de la Tienda
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input 
                    label="Nombre de la Tienda" 
                    value={siteSettings.storeName} 
                    onChange={(v: string) => setSiteSettings({...siteSettings, storeName: v})} 
                  />
                  <Input 
                    label="Frase de Impacto" 
                    value={siteSettings.tagline} 
                    onChange={(v: string) => setSiteSettings({...siteSettings, tagline: v})} 
                  />
                  <div className="md:col-span-2">
                    <Input 
                      label="Banner Principal (URL)" 
                      value={siteSettings.activeBanner} 
                      onChange={(v: string) => setSiteSettings({...siteSettings, activeBanner: v})} 
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xl font-bold text-white uppercase italic pt-4">
                  <CreditCard className="text-steam-blue" />
                  Datos de Recepción (Pix Centralizado)
                </div>
                <div className="p-4 bg-steam-blue/10 border border-steam-blue/20 rounded-xl text-[10px] text-steam-blue leading-relaxed italic">
                  Atención: Todos los pagos de la plataforma serán dirigidos a esta clave Pix.
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input 
                    label="Clave Pix Central" 
                    value={siteSettings.pixKey || ''} 
                    onChange={(v: string) => setSiteSettings({...siteSettings, pixKey: v})} 
                  />
                  <Input 
                    label="Nombre del Beneficiario" 
                    value={siteSettings.pixName || ''} 
                    onChange={(v: string) => setSiteSettings({...siteSettings, pixName: v})} 
                  />
                </div>

                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-xs text-yellow-500 leading-relaxed italic">
                  Consejo: Use URLs de imágenes de Imgur o sitios similares para cargar sus propias artes.
                </div>

                <button 
                  type="submit"
                  className="bg-steam-blue text-steam-dark font-black py-4 px-8 rounded-xl flex items-center justify-center gap-2 hover:bg-opacity-80 transition-all shadow-xl uppercase italic tracking-widest"
                >
                   Guardar Cambios <CheckCircle2 className="w-5 h-5" />
                </button>
              </form>
            </motion.div>
          )}

          {activeTab === 'products' && (
            <motion.div key="products" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              <form onSubmit={handleAddProduct} className="bg-steam-card/20 border border-steam-card rounded-2xl p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 flex items-baseline justify-between">
                  <h3 className="text-xl font-black text-white uppercase italic flex items-center gap-3">
                    {editingProduct ? <Edit2 className="text-steam-blue" /> : <Plus className="text-steam-blue" />}
                    {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                  </h3>
                  {editingProduct && (
                    <button onClick={() => {setEditingProduct(null); setNewProduct(initialProductState);}} className="text-[10px] uppercase font-bold text-red-400">Cancelar Edición</button>
                  )}
                </div>

                <Input label="Nombre del Producto" value={newProduct.name} onChange={(v: string) => setNewProduct({...newProduct, name: v})} placeholder="Ex: Cuenta Netflix Premium" />
                <Input label="Imagen (URL)" value={newProduct.imageInput} onChange={(v: string) => setNewProduct({...newProduct, imageInput: v})} placeholder="https://..." />
                
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Precio Promocional ($)" type="number" value={newProduct.price} onChange={(v: string) => setNewProduct({...newProduct, price: parseFloat(v)})} />
                  <Input label="Precio Original ($)" type="number" value={newProduct.originalPrice} onChange={(v: string) => setNewProduct({...newProduct, originalPrice: parseFloat(v)})} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black uppercase text-steam-accent opacity-60">Categoría</label>
                    <select 
                      value={newProduct.category} 
                      onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                      className="bg-steam-dark border border-steam-card rounded-xl p-3 text-sm text-white focus:border-steam-blue outline-none"
                    >
                      <option value="Cuentas">Cuentas</option>
                      <option value="Steam Offline">Steam Offline</option>
                      <option value="Steam Keys">Steam Keys</option>
                      <option value="Epic Games">Epic Games</option>
                      <option value="Discord">Discord</option>
                      <option value="Software">Software</option>
                      <option value="Redes Sociales">Redes Sociales</option>
                      <option value="Cursos">Cursos</option>
                    </select>
                  </div>
                   <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black uppercase text-steam-accent opacity-60">Sello (Badge)</label>
                    <select 
                      value={newProduct.badgeType} 
                      onChange={e => setNewProduct({...newProduct, badgeType: e.target.value})}
                      className="bg-steam-dark border border-steam-card rounded-xl p-3 text-sm text-white focus:border-steam-blue outline-none"
                    >
                      <option value="CONTA">CUENTA</option>
                      <option value="ITEM">ITEM</option>
                      <option value="KEYS">KEYS</option>
                      <option value="SERVICE">SERVICIO</option>
                      <option value="CARD">TARJETA</option>
                    </select>
                  </div>
                  <Input label="Stock" type="number" value={newProduct.stock} onChange={(v: string) => setNewProduct({...newProduct, stock: parseInt(v)})} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input label="Nombre del Vendedor" value={newProduct.sellerName} onChange={(v: string) => setNewProduct({...newProduct, sellerName: v})} placeholder="Ex: Steam offline Official" />
                  <Input label="Ventas Totales" type="number" value={newProduct.sellerSales} onChange={(v: string) => setNewProduct({...newProduct, sellerSales: parseInt(v)})} />
                </div>

                <div className="flex items-center gap-3 bg-steam-dark/50 p-4 rounded-xl border border-steam-card">
                  <input 
                    type="checkbox" 
                    id="isPhysical"
                    checked={newProduct.isPhysical}
                    onChange={e => setNewProduct({...newProduct, isPhysical: e.target.checked})}
                    className="w-5 h-5 accent-steam-blue"
                  />
                  <label htmlFor="isPhysical" className="text-sm font-bold text-white uppercase italic cursor-pointer">Producto Físico (Requiere Envío)</label>
                </div>

                <div className="md:col-span-2 space-y-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black uppercase text-steam-accent opacity-60">Descripción del Producto</label>
                    <textarea 
                      value={newProduct.description} 
                      onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                      className="bg-steam-dark border border-steam-card rounded-xl p-4 text-sm text-white h-32 focus:border-steam-blue outline-none"
                      placeholder="Describa los detalles, beneficios y requisitos del producto..."
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black uppercase text-steam-accent opacity-60">Mensaje Automático (Enviado al Chat)</label>
                    <textarea 
                      value={newProduct.autoMessage} 
                      onChange={e => setNewProduct({...newProduct, autoMessage: e.target.value})}
                      className="bg-steam-dark border border-steam-card rounded-xl p-4 text-sm text-white h-24 focus:border-steam-blue outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black uppercase text-steam-accent opacity-60">Contenido de la Entrega (Keys/Login)</label>
                    <textarea 
                      value={newProduct.deliveryContent} 
                      onChange={e => setNewProduct({...newProduct, deliveryContent: e.target.value})}
                      className="bg-steam-dark border border-steam-card rounded-xl p-4 text-sm text-white h-24 focus:border-steam-blue outline-none border-dashed"
                      placeholder="Coloque aquí las llaves o datos de acceso..."
                    />
                  </div>
                </div>

                <button type="submit" className="md:col-span-2 bg-steam-blue text-steam-dark font-black py-4 rounded-xl uppercase italic tracking-widest hover:scale-[1.02] transition-all shadow-xl">
                  {editingProduct ? 'ACTUALIZAR PRODUCTO' : 'PUBLICAR OFERTA AHORA'}
                </button>
              </form>

              <div className="bg-steam-card/10 border border-steam-card rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-steam-dark text-[10px] text-steam-accent uppercase font-black tracking-widest border-b border-steam-card">
                    <tr>
                      <th className="px-6 py-4">Producto</th>
                      <th className="px-6 py-4">Sello</th>
                      <th className="px-6 py-4">Precio</th>
                      <th className="px-6 py-4">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-steam-card/20">
                    {products.map(p => (
                      <tr key={p.id} className="hover:bg-steam-card/20 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img src={p.images?.[0]} className="w-10 h-10 object-cover rounded shadow" alt="" />
                            <span className="text-sm font-bold text-white">{p.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[10px] bg-steam-blue/20 text-steam-blue px-2 py-0.5 rounded font-black">{p.badgeType || 'N/A'}</span>
                          {p.isPhysical && <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded font-black ml-2 uppercase italic">Físico</span>}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-steam-green">$ {p.price.toFixed(2)}</td>
                        <td className="px-6 py-4">
                          <div className="flex gap-4">
                            <button onClick={() => {setEditingProduct(p); setNewProduct({...p, imageInput: p.images?.[0]});}} className="text-steam-accent hover:text-steam-blue"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => deleteDoc(doc(db, 'products', p.id))} className="text-steam-accent hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'coupons' && (
            <motion.div key="coupons" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              <form onSubmit={handleAddCoupon} className="bg-steam-card/20 border border-steam-card rounded-2xl p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <h3 className="md:col-span-2 text-xl font-black text-white uppercase italic flex items-center gap-3">
                  <Ticket className="text-steam-blue" /> Gestionar Cupones
                </h3>
                <Input label="Código del Cupón" value={newCoupon.code} onChange={(v: string) => setNewCoupon({...newCoupon, code: v.toUpperCase()})} placeholder="EX: NATAL20" />
                <Input label="Valor del Descuento" type="number" value={newCoupon.value} onChange={(v: string) => setNewCoupon({...newCoupon, value: parseFloat(v)})} />
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black uppercase text-steam-accent opacity-60">Tipo de Descuento</label>
                  <select 
                    value={newCoupon.discountType} 
                    onChange={e => setNewCoupon({...newCoupon, discountType: e.target.value})}
                    className="bg-steam-dark border border-steam-card rounded-xl p-3 text-sm text-white focus:border-steam-blue outline-none"
                  >
                    <option value="percentage">Porcentaje (%)</option>
                    <option value="fixed">Fijo ($)</option>
                  </select>
                </div>
                <button type="submit" className="bg-steam-blue text-steam-dark font-black py-3 rounded-xl uppercase italic tracking-widest hover:bg-opacity-80 transition-all self-end">Crear Cupón</button>
              </form>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {coupons.map(c => (
                  <div key={c.id} className="bg-steam-dark border border-steam-card p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="text-lg font-black text-white">{c.code}</div>
                      <div className="text-[10px] font-bold text-steam-blue uppercase">
                        {c.value}{c.discountType === 'percentage' ? '%' : ' $'} OFF
                      </div>
                    </div>
                    <button onClick={() => deleteDoc(doc(db, 'coupons', c.id))} className="text-red-500/50 hover:text-red-500"><Trash2 className="w-5 h-5" /></button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label="Ingresos Totales" value={`$ ${stats.totalEarnings.toFixed(2)}`} icon={<TrendingUp className="text-green-500" />} />
                <StatCard label="Productos Activos" value={stats.productCount} icon={<ShoppingBag className="text-yellow-500" />} />
                <StatCard label="Nuevos Pedidos" value={orders.length} icon={<Clock className="text-steam-blue" />} />
                <StatCard label="Total Clientes" value={stats.userCount} icon={<Users className="text-indigo-500" />} />
              </div>
              
              <div className="bg-steam-card/10 border border-steam-card rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-4">
                <LayoutDashboard className="w-16 h-16 text-steam-blue opacity-20" />
                <h3 className="text-xl font-black text-white uppercase italic tracking-widest">Panel de Control Central</h3>
                <p className="text-steam-accent text-sm max-w-md opacity-60">Utilice las pestañas de arriba para gestionar sus productos, cupones y configuraciones globales de la plataforma.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const NavButton = ({ active, onClick, icon, label }: any) => (
  <button
    onClick={onClick}
    className={`flex-none lg:w-full flex items-center gap-2 md:gap-3 px-3 py-2 md:px-4 md:py-3 rounded-lg text-[10px] md:text-sm font-bold uppercase tracking-tight transition-all border lg:border-none ${
      active 
        ? 'bg-steam-blue text-steam-dark italic border-steam-blue shadow-lg shadow-steam-blue/20' 
        : 'text-steam-accent hover:bg-steam-card border-steam-card'
    }`}
  >
    {icon} <span className="whitespace-nowrap">{label}</span>
  </button>
);

const StatCard = ({ label, value, icon }: any) => (
  <div className="bg-steam-bg border border-steam-card p-6 rounded-xl space-y-2 group hover:border-steam-blue/40 transition-all">
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-bold text-steam-accent uppercase tracking-widest">{label}</span>
      <div className="group-hover:scale-110 transition-transform">{icon}</div>
    </div>
    <div className="text-3xl font-bold text-white">{value}</div>
  </div>
);

const Input = ({ label, type = 'text', value, onChange, placeholder }: any) => (
  <div className="flex flex-col gap-1">
    <label className="text-[10px] font-bold uppercase text-steam-accent">{label}</label>
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      className="bg-steam-dark border border-steam-card rounded p-2 text-sm text-steam-accent focus:border-steam-blue outline-none transition-colors"
      placeholder={placeholder}
    />
  </div>
);

export default AdminDashboard;
