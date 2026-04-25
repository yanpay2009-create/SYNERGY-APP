import React from 'react';
import { Star, Plus, Crown, Zap, Sparkles, User } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Product, UserTier } from '../types';
import { useNavigate } from 'react-router-dom';

interface ProductCardProps {
  product: Product;
  isFeatured?: boolean;
}

export const getTierColors = (tier: UserTier | undefined) => {
  switch (tier) {
    case UserTier.EXECUTIVE:
      return { 
        text: 'text-amber-600 dark:text-amber-400', 
        bgLight: 'bg-amber-50 dark:bg-amber-900/30',
        icon: Crown,
        progress: 'bg-gradient-to-r from-amber-400 to-orange-600 shadow-[0_0_15px_rgba(245,158,11,0.4)]',
        decoration: 'from-amber-100/50 dark:from-amber-900/20'
      };
    case UserTier.BUILDER:
      return { 
        text: 'text-purple-700 dark:text-purple-400', 
        bgLight: 'bg-purple-50 dark:bg-purple-900/30',
        icon: Zap,
        progress: 'bg-gradient-to-r from-purple-700 to-indigo-900 shadow-[0_0_15px_rgba(126,34,206,0.4)]',
        decoration: 'from-purple-100/50 dark:from-purple-900/20'
      };
    case UserTier.MARKETER: 
      return { 
        text: 'text-pink-600 dark:text-pink-400', 
        bgLight: 'bg-pink-50 dark:bg-pink-900/30',
        icon: Sparkles,
        progress: 'bg-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.4)]',
        decoration: 'from-pink-100/50 dark:from-pink-900/20'
      };
    default:
      return { 
        text: 'text-synergy-blue dark:text-blue-400', 
        bgLight: 'bg-blue-50 dark:bg-blue-900/30',
        icon: User,
        progress: 'bg-gradient-to-r from-synergy-blue to-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)]',
        decoration: 'from-blue-100/50 dark:from-blue-900/20'
      };
  }
};

export const getTierBadgeStyles = (tier: UserTier | undefined) => {
  const colors = getTierColors(tier);
  return `${colors.bgLight} ${colors.text} border border-white/50 dark:border-slate-800 shadow-sm`;
};

export const formatSold = (num: number) => {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

export const calculateRating = (reviews?: any[]) => {
  if (!reviews || reviews.length === 0) return "0.0";
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return (sum / reviews.length).toFixed(1);
};

export const ProductCard: React.FC<ProductCardProps> = ({ product, isFeatured = false }) => {
  const { user, calculateCommission, addToCart, t } = useApp();
  const navigate = useNavigate();

  const getDiscountedPrice = (product: Product) => {
    let tierDiscount = 0;
    if (user) {
        if (user.tier === UserTier.MARKETER) tierDiscount = 0.10;
        else if (user.tier === UserTier.BUILDER) tierDiscount = 0.20;
        else if (user.tier === UserTier.EXECUTIVE) tierDiscount = 0.30;
    }
    return product.price * (1 - tierDiscount);
  };

  const finalPrice = getDiscountedPrice(product);
  const hasDiscount = finalPrice < product.price && user?.tier !== UserTier.STARTER;

  return (
      <div 
          onClick={() => product.stock > 0 && navigate(`/product/${product.id}`)}
          className={`${isFeatured ? 'w-40 shrink-0' : 'w-full'} bg-white dark:bg-slate-800 rounded-xl shadow-soft hover:shadow-lg transition-all duration-300 cursor-pointer active:scale-[0.98] border border-slate-100 dark:border-slate-800/50 overflow-hidden flex flex-col relative group`}
      >
          <div className="relative aspect-square bg-slate-100 dark:bg-slate-800">
              <img src={product.image || undefined} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />

              {/* Commission Badge at Top Right */}
              <div className={`absolute top-1 right-1 px-1.5 py-0.5 rounded-full backdrop-blur-md flex items-center font-black text-[10px] shadow-sm z-10 ${getTierBadgeStyles(user?.tier)}`}>
                  +฿{calculateCommission(product.price).toFixed(0)}
              </div>

              {product.stock <= 0 && (
                  <div className="absolute inset-0 flex items-center justify-center z-20 bg-slate-900/40 backdrop-blur-[2px]">
                      <span className="text-white text-xl font-black tracking-tighter drop-shadow-lg">
                          {t('home.out_of_stock')}
                      </span>
                  </div>
              )}
          </div>
          <div className="p-3">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 line-clamp-1 mb-1">{product.name}</h3>
              <div className="flex justify-between items-end">
                  <div className="min-w-0">
                       <div className="flex items-center space-x-1">
                          <p className="text-sm font-black text-synergy-blue">฿{(finalPrice ?? 0).toLocaleString()}</p>
                          {hasDiscount && (
                              <p className="text-[9px] text-slate-500 line-through leading-none">฿{(product.price ?? 0).toLocaleString()}</p>
                          )}
                      </div>
                      <div className="flex items-center space-x-1 mt-1">
                          <div className="flex items-center space-x-0.5">
                              <Star size={9} strokeWidth={2} className="text-amber-400 fill-amber-400 fill-opacity-30" />
                              <span className="text-[9px] text-slate-500 font-bold">{calculateRating(product.reviews)}</span>
                          </div>
                          <span className="text-[8px] text-slate-500 dark:text-slate-400">|</span>
                          <p className="text-[9px] text-slate-500 font-bold whitespace-nowrap">
                              {formatSold(product.sold)} {t('home.sold')}
                          </p>
                      </div>
                  </div>
                  <button 
                      disabled={product.stock <= 0}
                      onClick={(e) => { e.stopPropagation(); addToCart(product); }} 
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm shrink-0 ml-1 active:scale-90 ${
                        product.stock <= 0 
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-300 cursor-not-allowed' 
                        : 'bg-sky-50 dark:bg-slate-700 text-synergy-blue hover:bg-synergy-blue hover:text-white group/btn'
                      }`}
                  >
                      <Plus size={18} strokeWidth={2.5} fill="currentColor" fillOpacity={0.2} className="group-hover/btn:fill-opacity-40 transition-all" />
                  </button>
              </div>
          </div>
      </div>
  );
};
