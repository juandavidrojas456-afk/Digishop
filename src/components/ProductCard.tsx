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
      className="group bg-steam-card/20 border border-steam-card/30 rounded-2xl overflow-hidden hover:border-steam-green transition-all flex flex-col relative shadow-xl"
    >
      <div className="aspect-video relative overflow-hidden">
        <img 
          src={product.images?.[0] || `https://picsum.photos/seed/${product.id}/400/225`} 
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          referrerPolicy="no-referrer"
        />
        
        {/* Dynamic Discount Badge */}
        {discount > 0 && (
          <div className="absolute top-3 left-3 bg-steam-green text-steam-dark text-[10px] font-black px-2 py-0.5 rounded shadow-xl uppercase italic">
            -{discount}%
          </div>
        )}

        {/* Product Type Badge (Bottom Right of Image) */}
        {product.badgeType && (
          <div className="absolute bottom-3 right-3 bg-steam-blue text-white text-[8px] font-black px-2 py-0.5 rounded shadow-lg uppercase tracking-widest italic">
            {product.badgeType}
          </div>
        )}
      </div>
      
      <div className="p-4 md:p-5 flex-1 flex flex-col gap-2 md:gap-3">
        <h3 className="text-xs md:text-sm font-black text-white group-hover:text-steam-green transition-colors line-clamp-2 leading-tight uppercase italic tracking-tighter">
          {product.name}
        </h3>

        <div className="flex items-center gap-1.5 grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all">
          <Star className="w-2.5 h-2.5 md:w-3 md:h-3 text-yellow-500 fill-current" />
          <span className="text-[8px] md:text-[10px] text-steam-accent font-bold uppercase tracking-tight">
            {product.sellerName || 'Verified Store'}
          </span>
        </div>

        <div className="mt-auto pt-3 md:pt-4 border-t border-steam-card/40">
          <div className="flex items-end justify-between">
            <div className="flex flex-col">
              {product.originalPrice && (
                <span className="text-[8px] md:text-[10px] text-steam-accent/40 line-through leading-none mb-1">
                  R$ {product.originalPrice.toFixed(2)}
                </span>
              )}
              <span className="text-lg md:text-xl font-black text-steam-green italic leading-none tracking-tighter">
                R$ {product.price.toFixed(2)}
              </span>
            </div>
            
            <button 
              onClick={handleAddToCart}
              className="bg-steam-green text-steam-dark p-2 md:p-3 rounded-lg md:rounded-xl transition-all transform active:scale-90 shadow-lg hover:shadow-steam-green/20"
            >
              <ShoppingCart className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
