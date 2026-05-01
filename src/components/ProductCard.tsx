import React from 'react';
import { Link } from 'react-router-dom';
import { Star, ShoppingCart } from 'lucide-react';
import { useCart } from '../contexts/CartContext';

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  category: string;
  badgeType?: string;
  isPhysical?: boolean;
  autoMessage?: string;
  deliveryContent?: string;
  sellerId: string;
  sellerName?: string;
  sellerAvatar?: string;
  sellerRating?: number;
  sellerSales?: number;
  images: string[];
  stock: number;
}

const ProductCard = ({ product }: { product: Product }) => {
  const { addToCart } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
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

  const discount = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <Link 
      to={`/product/${product.id}`}
      className="group bg-white/[0.03] border border-white/5 rounded-[2.5rem] overflow-hidden hover:border-white/10 transition-all flex flex-col relative shadow-2xl backdrop-blur-sm"
    >
      <div className="aspect-video relative overflow-hidden bg-white/5">
        <img 
          src={product.images?.[0] || `https://picsum.photos/seed/${product.id}/600/338`} 
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
        
        {/* Dynamic Discount Badge */}
        {discount > 0 && (
          <div className="absolute top-4 left-4 bg-white text-black text-[9px] font-black px-3 py-1 rounded-full shadow-2xl uppercase italic tracking-widest">
            -{discount}%
          </div>
        )}

        {/* Product Type Badge */}
        {product.badgeType && (
          <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-xl text-white text-[8px] font-black px-3 py-1 rounded-full shadow-lg uppercase tracking-[0.2em] italic border border-white/10">
            {product.badgeType}
          </div>
        )}
      </div>
      
      <div className="p-6 flex-1 flex flex-col gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
            <div className="w-1.5 h-1.5 bg-steam-green rounded-full shadow-[0_0_8px_rgba(164,203,50,0.8)]" />
            <span className="text-[9px] text-white font-black uppercase tracking-[0.2em]">
              {product.sellerName || 'Verificado'}
            </span>
          </div>
          <h3 className="text-lg font-black text-white group-hover:text-steam-blue transition-colors line-clamp-2 leading-tight uppercase italic tracking-tighter">
            {product.name}
          </h3>
        </div>

        <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
          <div className="flex flex-col">
            {product.originalPrice && (
              <span className="text-[10px] text-white/20 line-through leading-none mb-1 font-bold">
                $ {product.originalPrice.toFixed(2)}
              </span>
            )}
            <span className="text-2xl font-black text-white italic leading-none tracking-tighter">
              $ {product.price.toFixed(2)}
            </span>
          </div>
          
          <button 
            onClick={handleAddToCart}
            className="bg-white text-black w-12 h-12 rounded-2xl flex items-center justify-center transition-all transform active:scale-90 shadow-2xl hover:scale-110"
          >
            <ShoppingCart className="w-5 h-5" />
          </button>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
