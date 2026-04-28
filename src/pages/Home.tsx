import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useApp, TIER_THRESHOLDS } from '../context/AppContext';
import { Plus, Search, Bell, TrendingUp, BarChart3, Star as StarIcon, Sparkles, Filter, Zap, X, Crown, Gift, UserPlus, Wallet, Clock, Trophy, ChevronRight, Tag, Star, ArrowRight, Share2, ShoppingBag, Download, Store, Coins, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UserTier, Product } from '../types';
import { ProductCard, getTierColors, getTierBadgeStyles, formatSold, calculateRating } from '../components/ProductCard';
import { CountdownTimer } from '../components/CountdownTimer';
import { getThailandNow } from '../utils/dateUtils';

const LiveSalesFeed: React.FC<{ sales: any[] }> = ({ sales }) => {
  if (!sales || sales.length === 0) return null;

  return (
    <div className="mb-6 animate-in fade-in duration-1000">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Clock className="text-emerald-500" size={18} strokeWidth={2} fill="currentColor" fillOpacity={0.2} />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
          </div>
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Live Sales Feed</h3>
        </div>
        <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-800">Real-time</span>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-2xl dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden relative">
        <div className="space-y-3">
          {sales.slice(0, 3).map((sale, idx) => (
            <div key={sale.id || idx} className={`flex items-center justify-between animate-in slide-in-from-right-4 duration-500 delay-${idx * 100} fill-mode-both`}>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-[10px] font-black shadow-2xl dark:shadow-none">
                  {sale.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="text-[11px] font-black text-slate-800 dark:text-slate-100 leading-none">{sale.name || 'Anonymous'}</p>
                  <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-1 font-medium">Just purchased</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 leading-none">฿{sale.amount?.toLocaleString()}</p>
                <p className="text-[8px] text-slate-500 dark:text-slate-500 mt-1 font-bold uppercase tracking-tighter">
                  {new Date(sale.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-50/50 dark:from-emerald-900/10 to-transparent rounded-bl-full pointer-events-none"></div>
      </div>
    </div>
  );
};

export const Home: React.FC = () => {
  const { user, products, addToCart, calculateCommission, t, notifications, ads, setIsSearchActive, setBottomNavHidden, referrer, addReferrer, commissions, team, liveSales, getNextTierTarget } = useApp();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortByCommission, setSortByCommission] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [scrolled, setScrolled] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [scrollingUp, setScrollingUp] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Threshold for "scrolled" state (e.g. when banner is mostly gone)
      if (currentScrollY > 100) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const handleExpire = useCallback(() => {
    setCurrentTime(Date.now());
  }, []);

  // Update current time every minute to refresh promotion filtering
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      // Only update if the minute has actually changed to avoid excessive re-renders
      setCurrentTime(prev => {
        if (Math.floor(now / 60000) !== Math.floor(prev / 60000)) {
          return now;
        }
        return prev;
      });
    }, 30000);
    return () => clearInterval(timer);
  }, []);
  
  // Ensure navigation is visible when home mounts
  useEffect(() => {
    setBottomNavHidden(false);
  }, [setBottomNavHidden]);

  // Income Calculations for Dashboard
  const lifetimeEarned = useMemo(() => {
    return user?.accumulatedIncome || 0;
  }, [user?.accumulatedIncome]);

  // Calculate Monthly Revenue
  const monthlyEarned = useMemo(() => {
    // We still calculate monthly from commissions as it's not pre-aggregated in user doc
    const now = getThailandNow();
    const currentMonth = now.toLocaleString('en-GB', { month: 'short', timeZone: 'Asia/Bangkok' });
    const currentYear = now.getFullYear().toString();
    
    return commissions
      .filter(c => 
        c.date && 
        c.date.includes(currentMonth) && 
        c.date.includes(currentYear) &&
        c.amount > 0 &&
        (c.type === 'Direct' || c.type === 'Team')
      )
      .reduce((acc, curr) => acc + curr.amount, 0);
  }, [commissions]);

  const activeAds = useMemo(() => {
    return ads.filter(ad => {
      if (!ad.active) return false;
      if (ad.expiryDate) {
        return new Date(ad.expiryDate).getTime() > currentTime;
      }
      return true;
    });
  }, [ads, currentTime]);

  const homeAds = useMemo(() => {
    return activeAds.filter(a => a.placement === 'home');
  }, [activeAds]);

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (homeAds.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % homeAds.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [homeAds.length]);


  const promoProducts = useMemo(() => {
    return products.filter(p => {
      if (!p.isPromo) return false;
      if (p.expiryDate) {
        return new Date(p.expiryDate).getTime() > currentTime;
      }
      return true;
    });
  }, [products, currentTime]);
  

  const promoAd = useMemo(() => {
    return activeAds.find(a => a.placement === 'account');
  }, [activeAds]);

  const homeBannerAds = useMemo(() => {
    return activeAds.filter(a => a.placement === 'home_banner');
  }, [activeAds]);

  let filteredProducts = products.filter(p => {
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.category.toLowerCase().includes(searchQuery.toLowerCase());
    const isNotPromo = !p.isPromo; 
    return matchesCategory && matchesSearch && isNotPromo;
  });

  if (sortByCommission) {
    filteredProducts = [...filteredProducts].sort((a, b) => b.price - a.price);
  }

  const featuredProducts = useMemo(() => {
    let list = [...products];
    return list.sort((a, b) => b.sold - a.sold).slice(0, 5);
  }, [products]);
  
  const categories = ['All', 'Health', 'Gadgets', 'Beauty', 'Fashion', 'Home'];
  const unreadCount = notifications.filter(n => !n.read).length;

  const nextTarget = getNextTierTarget();

  const currentTierRef = useRef<HTMLDivElement>(null);
  const tiersOrder = useMemo(() => [UserTier.STARTER, UserTier.MARKETER, UserTier.BUILDER, UserTier.EXECUTIVE], []);

  useEffect(() => {
    // Small delay to ensure render is complete and currentTierRef is attached
    const timer = setTimeout(() => {
      if (currentTierRef.current) {
        currentTierRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const getDiscountedPrice = useCallback((product: Product) => {
      let tierDiscount = 0;
      if (user) {
          if (user.tier === UserTier.MARKETER) tierDiscount = 0.10;
          else if (user.tier === UserTier.BUILDER) tierDiscount = 0.20;
          else if (user.tier === UserTier.EXECUTIVE) tierDiscount = 0.30;
      }
      
      // Only apply tier discount. The promoDiscount is for tier progression/commission, not price reduction.
      return product.price * (1 - tierDiscount);
  }, [user]);

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-900 transition-colors duration-300 overflow-x-hidden">
      <div className="pb-20 pt-0 relative font-sans w-full">
        {/* Unified Sticky Header */}
      <div className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ease-in-out ${
        scrolled || homeAds.length === 0
          ? 'bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl py-3 px-4 shadow-none'
          : 'pt-8 pb-4 px-4 bg-transparent'
      }`}>
        <div className="flex items-center space-x-3">
          <div className={`flex-1 flex items-center px-4 py-2 rounded-xl border transition-all duration-300 ease-in-out ${
            scrolled || homeAds.length === 0
              ? 'bg-slate-100/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700' 
              : 'bg-white/40 border-white/50 backdrop-blur-md'
          }`}>
            <Search size={16} strokeWidth={2} fill="currentColor" fillOpacity={0.1} className={`transition-colors duration-300 ${scrolled || homeAds.length === 0 ? 'text-slate-500' : 'text-white/90'} mr-2`} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchActive(true)}
              onBlur={() => setIsSearchActive(false)}
              placeholder={t('home.cat.all') + '...'} 
              className={`bg-transparent border-none outline-none text-xs w-full font-medium transition-colors duration-300 ${
                scrolled || homeAds.length === 0 ? 'text-slate-800 dark:text-white placeholder-slate-500' : 'text-white placeholder-white/90'
              }`}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className={`transition-colors duration-300 ${scrolled || homeAds.length === 0 ? 'text-slate-400' : 'text-white/70'} hover:text-white`}>
                <X size={14} />
              </button>
            )}
          </div>
          <button 
            onClick={() => navigate('/notifications')} 
            className={`relative p-2 rounded-full border transition-all duration-300 ${
              scrolled || homeAds.length === 0
                ? 'bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800' 
                : 'bg-white/40 text-white border-white/50 backdrop-blur-md hover:bg-white/50'
            }`}
          >
            <Bell size={18} strokeWidth={2} fill="currentColor" fillOpacity={0.15} />
            {unreadCount > 0 && (
              <span className={`absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border transition-colors duration-300 ${
                scrolled || homeAds.length === 0 ? 'border-white dark:border-slate-950' : 'border-white'
              }`}></span>
            )}
          </button>
        </div>
      </div>

      {homeAds.length > 0 && (
        <div className="sticky top-0 w-full h-56 bg-slate-200 dark:bg-slate-900 overflow-hidden z-0">
           {/* Header was here, now moved to fixed position above */}
           
           {homeAds.map((ad, index) => (
             <div key={ad.id} className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}>
               <img src={ad.image || undefined} alt={ad.title} className="w-full h-full object-cover" />
               {/* Professional Overlay */}
               <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
               <div className="absolute inset-0 pointer-events-none overflow-hidden select-none opacity-30">
               </div>
               <div className="absolute bottom-5 left-6 text-white max-w-[80%] z-10">
                  <h2 className="text-2xl font-bold mb-1 drop-shadow-lg leading-tight">{ad.title}</h2>
                  <p className="text-xs font-medium opacity-90 drop-shadow-md">{ad.subtitle}</p>
               </div>
             </div>
           ))}
           
           {homeAds.length > 1 && (
               <div className="absolute bottom-5 right-6 flex space-x-1.5 z-10">
                  {homeAds.map((_, idx) => (
                      <div key={idx} className={`h-1.5 rounded-full transition-all duration-500 ease-out backdrop-blur-sm ${currentSlide === idx ? 'bg-white w-6 shadow-2xl dark:shadow-none' : 'bg-white/30 w-1.5'}`} />
                  ))}
               </div>
           )}
        </div>
      )}

      {homeAds.length === 0 && (
        <div className="px-4 pt-20 mb-6">
           {/* Header is fixed at the top, so we just need padding here */}
        </div>
      )}

      <div className={`relative z-10 bg-slate-50 dark:bg-slate-900 pt-6 px-4 min-h-screen ${homeAds.length > 0 ? '-mt-4 shadow-[0_-20px_40px_rgba(0,0,0,0.05)]' : ''}`}>
        <div className="flex space-x-3 overflow-x-auto no-scrollbar mb-3 pb-2" role="tablist">
          {categories.map((cat, i) => (
            <button 
              key={i} role="tab" aria-selected={activeCategory === cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap px-5 py-2 rounded-full text-xs font-bold transition ${activeCategory === cat ? 'bg-synergy-blue text-white shadow-2xl dark:shadow-none' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
            >
              {t(`home.cat.${cat.toLowerCase()}`)}
            </button>
          ))}
        </div>


        {!searchQuery && activeCategory === 'All' && (
          <>
            {/* HOME BANNER ADS SECTION */}
            <div className="mb-3">
              {homeBannerAds.length > 0 && homeBannerAds[0].image ? (
                <div 
                  onClick={() => navigate('/affiliate-links')}
                  className="animate-in fade-in slide-in-from-left-4 duration-700 fill-mode-both cursor-pointer active:scale-[0.98] transition-all"
                >
                  <div className="w-full h-32 rounded-xl overflow-hidden shadow-2xl dark:shadow-none border border-slate-100 dark:border-slate-800 relative">
                    <img 
                      src={homeBannerAds[0].image} 
                      alt={homeBannerAds[0].title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" 
                      referrerPolicy="no-referrer"
                    />
                    {/* Professional Overlay */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none opacity-20">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-sweep" style={{ animationDuration: '4s' }}></div>
                    </div>
                  </div>
                </div>
              ) : (
                <div 
                  onClick={() => navigate('/affiliate-links')}
                  className="animate-in fade-in slide-in-from-left-4 duration-700 fill-mode-both cursor-pointer active:scale-[0.98] transition-all"
                >
                  <div 
                    className={`w-full min-h-[110px] rounded-2xl bg-white dark:bg-slate-900 p-5 flex flex-col justify-between shadow-2xl dark:shadow-none border border-slate-100 dark:border-slate-800 relative overflow-hidden group transition-all duration-700 hover:shadow-synergy-blue/20`}
                  >
                    {/* Content Overlay */}
                    <div className="relative z-10 flex flex-col h-full w-full">
                      <div className="flex flex-col">
                        <h3 className="text-2xl font-black tracking-tighter leading-tight mb-1">
                          <span className="text-slate-900 dark:text-white">SYNERGY</span>
                          <span className="text-synergy-blue">FLOW</span>
                        </h3>
                        
                        <div className="flex items-center space-x-2 text-synergy-blue">
                           <div className="p-1 bg-blue-50 dark:bg-blue-900/10 rounded-md">
                             <Share2 size={12} strokeWidth={2.5} />
                           </div>
                           <span className="text-[8px] font-black uppercase tracking-[0.2em] opacity-70">Affiliate Program</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 mt-4">
                        <button className="bg-synergy-blue text-white px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center space-x-1.5 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-synergy-blue/40 border border-white/20">
                          <span>Join Now</span>
                          <ArrowRight size={10} strokeWidth={3} />
                        </button>
                      </div>
                      
                      {/* Users section positioned absolutely for precise corner placement */}
                      <div className="absolute bottom-0 right-0 flex flex-col items-end group-hover:translate-y-[-2px] transition-transform duration-500">
                         <div className="flex -space-x-2 items-center">
                            {[1, 2, 3].map(i => (
                              <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 shadow-2xl dark:shadow-none overflow-hidden transform hover:-translate-y-1 transition-transform">
                                <img 
                                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 45}`} 
                                  alt="User"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ))}
                            <div className="w-8 h-8 rounded-full bg-synergy-blue border-2 border-white dark:border-slate-800 flex items-center justify-center shadow-2xl dark:shadow-none transform hover:scale-110 transition-transform cursor-pointer">
                               <Plus size={10} className="text-white" strokeWidth={3} />
                            </div>
                         </div>
                      </div>
                    </div>

                    {/* Designer Background Graphics */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
                      {/* Background Large 30% Graphic */}
                      <div className="absolute right-[-2%] top-[-5%] font-black text-[9rem] text-slate-900 dark:text-white opacity-[0.04] tracking-tighter italic leading-none pointer-events-none transform -rotate-12 select-none flex items-start">
                        <span>30</span>
                        <span className="text-[4rem] mt-4 ml-1 opacity-60">%</span>
                      </div>

                      {/* Sub-surface Glow */}
                      <div className="absolute -top-1/2 -left-1/4 w-full h-full bg-synergy-blue/10 rounded-full blur-[120px]"></div>
                      <div className="absolute top-1/4 -right-1/4 w-full h-full bg-synergy-blue/15 rounded-full blur-[100px]"></div>
                      
                      {/* Vector Patterns */}
                      <svg className="absolute right-[-5%] top-[-5%] w-[40%] text-slate-50 dark:text-slate-800/20 fill-current opacity-50" viewBox="0 0 100 100">
                         <circle cx="100" cy="0" r="100" fill="currentColor" fillOpacity="0.1" />
                         <circle cx="100" cy="0" r="80" fill="currentColor" fillOpacity="0.05" />
                         <circle cx="100" cy="0" r="60" fill="none" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.2" />
                      </svg>

                      {/* Moving Highlight */}
                      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-transparent via-white/5 dark:via-blue-400/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
                      
                      {/* Geometric Decals */}
                      <div className="absolute bottom-10 left-32 w-12 h-12 border border-slate-100 dark:border-slate-800 rounded-lg rotate-12 opacity-50"></div>
                      <div className="absolute top-20 right-40 w-8 h-8 border border-synergy-blue/10 rounded-full opacity-30"></div>

                      {/* Fine Grain Texture */}
                      <div className="absolute inset-0 bg-grain opacity-[0.02] mix-blend-overlay"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Live Sales Feed */}
            <LiveSalesFeed sales={liveSales} />

            <div className="mb-2">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center space-x-2">
                      <TrendingUp className="text-synergy-blue" size={20} strokeWidth={2} fill="currentColor" fillOpacity={0.15} />
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">Top Sellers</h3>
                  </div>
                  <button 
                    onClick={() => navigate('/featured-products')}
                    className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    View All
                  </button>
                </div>
                <div className="flex space-x-3 overflow-x-auto no-scrollbar pb-3 -mx-4 px-4">
                  {featuredProducts.map(product => (
                    <ProductCard 
                      key={product.id} 
                      product={product} 
                      isFeatured={true} 
                    />
                  ))}
                </div>
            </div>
            
            {/* PROMOTION SECTION (Banner Style) */}
            {promoProducts.length > 0 && promoAd && (
                <div className="mb-4 animate-in slide-in-from-right-4 duration-700">
                    <div 
                      onClick={() => navigate('/promotions')}
                      className="w-full h-32 rounded-xl overflow-hidden shadow-2xl dark:shadow-none relative group cursor-pointer active:scale-[0.98] transition-all duration-500 border border-white/60 dark:border-slate-800"
                    >
                        <img src={promoAd.image || undefined} alt="Promo Background" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" referrerPolicy="no-referrer" />
                        
                        {promoAd?.expiryDate && (
                          <div className="absolute top-3 right-3 z-20">
                            <CountdownTimer expiryDate={promoAd.expiryDate} onExpire={handleExpire} />
                          </div>
                        )}

                        <div className="absolute bottom-4 left-6 right-6">
                            <h3 className="text-lg font-black leading-tight text-white drop-shadow-md">{promoAd ? promoAd.title : "Flash Promotions"}</h3>
                            <div className="flex justify-between items-center mt-1">
                              <p className="text-[9px] text-white/90 font-bold opacity-90 truncate max-w-[80%] drop-shadow-sm">{promoAd ? promoAd.subtitle : "Unlock member-only discounts and premium rewards."}</p>
                              <div className="bg-black/30 backdrop-blur-md rounded-full p-1.5 border border-white/20 group-hover:bg-synergy-blue group-hover:border-synergy-blue transition-all text-white">
                                  <ArrowRight size={12} />
                              </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                        <TrendingUp className="text-synergy-blue" size={20} strokeWidth={2} fill="currentColor" fillOpacity={0.15} />
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('home.affiliate_progress')}</h3>
                    </div>
                    <button onClick={() => navigate('/tier-benefits')} className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                        Details
                    </button>
                </div>
                
                <div className="flex space-x-0 overflow-x-auto no-scrollbar -mx-4 snap-x snap-mandatory pb-6">
                    {tiersOrder.map((tier) => {
                        const colors = getTierColors(tier);
                        const threshold = TIER_THRESHOLDS[tier];
                        const isReached = user ? user.accumulatedSales >= threshold : false;
                        const isCurrent = user?.tier === tier;
                        
                        // Calculate progress for this tier card
                        let progress = 0;
                        if (isReached) {
                            progress = 100;
                        } else {
                            // Find the previous threshold to calculate % correctly for this level
                            const tierIdx = tiersOrder.indexOf(tier);
                            const prevThreshold = tierIdx > 0 ? TIER_THRESHOLDS[tiersOrder[tierIdx - 1]] : 0;
                            const range = threshold - prevThreshold;
                            const currentPos = (user?.accumulatedSales ?? 0) - prevThreshold;
                            progress = Math.max(0, Math.min(100, (currentPos / range) * 100));
                        }

                        return (
                            <div 
                                key={tier}
                                ref={isCurrent ? currentTierRef : null}
                                className="w-full shrink-0 snap-center px-4"
                            >
                                <button 
                                    onClick={() => navigate('/tier-benefits')}
                                    className={`w-full text-left ${colors.bgLight} backdrop-blur-xl rounded-3xl p-6 shadow-2xl dark:shadow-none border border-white/60 dark:border-slate-800 transition-all active:scale-[0.98] group relative overflow-hidden h-full`}
                                >
                                    <div className="relative z-10">
                                        <div className="flex justify-between items-center mb-4">
                                            <div>
                                                <div className="flex items-center space-x-1 mb-1">
                                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-widest">
                                                        {isReached ? (isCurrent ? 'Current Tier' : 'Completed') : 'Level Up Path'}
                                                    </p>
                                                    {isReached && <TrendingUp size={10} strokeWidth={2.5} fill="currentColor" fillOpacity={0.2} className="text-synergy-blue" />}
                                                </div>
                                                <h2 className={`text-2xl font-black ${colors.text}`}>{tier} Affiliate</h2>
                                            </div>
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl dark:shadow-none border transition-transform group-hover:scale-110 ${colors.bgLight} ${colors.text} border-white/50 dark:border-slate-700`}>
                                                {colors.icon && <colors.icon size={24} strokeWidth={1.8} fill="currentColor" fillOpacity={0.15} />}
                                            </div>
                                        </div>
                                        
                                        <div className="mb-2">
                                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter mb-1.5">
                                                <span className="text-slate-500 dark:text-slate-400">
                                                    {isReached ? 'Threshold Reached' : 'Next Target'}
                                                </span>
                                                <span className={colors.text}>{progress.toFixed(0)}% Complete</span>
                                            </div>
                                            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                                <div 
                                                    className={`h-full transition-all duration-1000 ${colors.progress}`} 
                                                    style={{ width: `${progress}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between mt-3">
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                                                {isReached 
                                                    ? `Goal: ฿${threshold.toLocaleString()}` 
                                                    : `฿${(threshold - (user?.accumulatedSales ?? 0)).toLocaleString()} remaining`}
                                            </p>
                                            <span className={`text-[9px] font-bold ${colors.text} uppercase tracking-widest ${colors.bgLight} px-2 py-0.5 rounded-full`}>View Details</span>
                                        </div>
                                    </div>

                                    {/* Background Graphic */}
                                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                                        <div className={`absolute inset-0 opacity-20 bg-gradient-to-br ${colors.decoration} via-transparent to-transparent`}></div>
                                        <div className={`absolute -right-6 -bottom-6 opacity-[0.08] ${colors.text} transform -rotate-12`}>
                                            {colors.icon && <colors.icon size={180} strokeWidth={1} fill="currentColor" />}
                                        </div>
                                        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-white/20 to-transparent rotate-12 opacity-30"></div>
                                        <div className="absolute top-0 left-1/2 w-px h-full bg-gradient-to-b from-transparent via-white/10 to-transparent rotate-12 opacity-20"></div>
                                    </div>
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
          </>
        )}

        <div className="flex justify-between items-center mb-4">
           <div className="flex items-center space-x-2">
              {!searchQuery && activeCategory === 'All' && <Sparkles className="text-synergy-blue" size={20} strokeWidth={2} fill="currentColor" fillOpacity={0.15} />}
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                 {searchQuery 
                   ? `Results for "${searchQuery}"` 
                   : (activeCategory === 'All' ? t('home.just_for_you') : t(`home.cat.${activeCategory.toLowerCase()}`))
                 }
              </h3>
           </div>
           <button onClick={() => setSortByCommission(!sortByCommission)} className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-[10px] font-black uppercase transition-all border ${sortByCommission ? 'bg-synergy-blue text-white border-synergy-blue shadow-glow' : 'bg-white dark:bg-slate-800 text-slate-400 border border-slate-100 dark:border-slate-800 hover:border-slate-200'}`}><Zap size={12} fill={sortByCommission ? "currentColor" : "none"} /><span>Sort</span></button>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-12 text-slate-600"><p className="text-sm font-medium">No results found.</p></div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
              {filteredProducts.map(product => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                />
              ))}
          </div>
        )}
      </div>
    </div>
  </div>
);
};