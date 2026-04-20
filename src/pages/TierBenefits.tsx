import React from 'react';
import { useApp, TIER_THRESHOLDS } from '../context/AppContext';
import { ArrowLeft, CheckCircle, Crown, Shield, Star, TrendingUp, Clock, Info, Zap, Check, UserCog, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UserTier } from '../types';
import { getThailandNow } from '../utils/dateUtils';

export const TierBenefits: React.FC = () => {
  const { user, getNextTierTarget, language } = useApp();
  const navigate = useNavigate();

  if (!user) return null;

  const getTierColors = (tier: UserTier) => {
    switch (tier) {
      case UserTier.EXECUTIVE:
        return { 
          text: 'text-amber-600 dark:text-amber-400', 
          bgLight: 'bg-amber-50 dark:bg-amber-900/30', 
          progress: 'bg-gradient-to-r from-amber-400 to-orange-600 shadow-[0_0_15px_rgba(245,158,11,0.4)]', 
          decoration: 'from-amber-400/20', 
          icon: Crown 
        };
      case UserTier.BUILDER:
        return { 
          text: 'text-purple-700 dark:text-purple-400', 
          bgLight: 'bg-purple-50 dark:bg-purple-900/30', 
          progress: 'bg-gradient-to-r from-purple-700 to-indigo-900 shadow-[0_0_15px_rgba(126,34,206,0.4)]', 
          decoration: 'from-purple-700/20', 
          icon: Zap 
        };
      case UserTier.MARKETER: 
        return { 
          text: 'text-pink-600 dark:text-pink-400', 
          bgLight: 'bg-pink-50 dark:bg-pink-900/30', 
          progress: 'bg-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.4)]', 
          decoration: 'from-pink-400/20', 
          icon: BarChart3 
        };
      default:
        return { 
          text: 'text-synergy-blue dark:text-blue-400', 
          bgLight: 'bg-blue-50 dark:bg-blue-900/30', 
          progress: 'bg-synergy-blue shadow-[0_0_15px_rgba(0,181,255,0.4)]', 
          decoration: 'from-synergy-blue/20', 
          icon: UserCog 
        };
    }
  };

  const nextTarget = getNextTierTarget();
  const progress = Math.min(100, (user.accumulatedSales / nextTarget) * 100);
  const colors = getTierColors(user.tier);

  const getDaysRemaining = () => {
    if (!user.teamIncomeExpiry) return 0;
    const expiry = new Date(user.teamIncomeExpiry);
    const now = getThailandNow();
    const diff = expiry.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const daysRemaining = getDaysRemaining();
  const isEligible = daysRemaining > 0;

  const tiers = [
    {
      name: UserTier.STARTER,
      displayName: 'Starter',
      req: 'Free Signup',
      color: 'bg-gray-100 text-gray-600 border-gray-200',
      icon: Shield,
      benefits: [
        '5% Direct Commission (All Referrals)',
        '0% Personal Discount',
        'Standard Platform Access'
      ]
    },
    {
      name: UserTier.MARKETER,
      displayName: 'Marketer',
      req: 'Accumulate ฿3,000',
      color: 'bg-pink-50 text-pink-600 border-pink-100',
      icon: Star,
      benefits: [
        '10% Direct (Starter)',
        '10% Personal Discount',
        'Indirect: +5% Starter, +2% Marketer (1 Level)'
      ]
    },
    {
      name: UserTier.BUILDER,
      displayName: 'Builder',
      req: 'Accumulate ฿6,000',
      color: 'bg-purple-50 text-purple-700 border-purple-100',
      icon: Zap,
      benefits: [
        '20% Direct (Starter)',
        '20% Personal Discount',
        'Indirect: +15% Starter, +10% Marketer, +2% Builder (1 Level)'
      ]
    },
    {
      name: UserTier.EXECUTIVE,
      displayName: 'Executive',
      req: 'Accumulate ฿9,000',
      color: 'bg-amber-50 text-amber-600 border-amber-200',
      icon: Crown,
      benefits: [
        '30% Direct (Starter)',
        '30% Personal Discount',
        'Indirect: +25% Starter, +20% Marketer, +10% Builder, +1% Executive (1 Level)'
      ]
    }
  ];

  const getTierColorClass = (tier: UserTier) => {
    switch (tier) {
        case UserTier.EXECUTIVE: return 'text-amber-500';
        case UserTier.BUILDER: return 'text-purple-700';
        case UserTier.MARKETER: return 'text-pink-600';
        default: return 'text-synergy-blue';
    }
  };

  return (
    <div className="pb-24 pt-0 px-4 max-w-md mx-auto min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="sticky top-0 z-[100] bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100/50 dark:border-gray-800/50 -mx-4 px-4 py-3 mb-6 transition-all">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition">
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-xl font-bold ml-2 text-gray-900 dark:text-white tracking-tight">Affiliate Tiers</h1>
          </div>
          <button 
            onClick={() => navigate(`/tier-data/Executive`)}
            className="p-2.5 bg-white dark:bg-gray-800 text-amber-500 rounded-full shadow-sm hover:bg-amber-50 dark:hover:bg-amber-900/30 transition border border-amber-100 dark:border-gray-700 active:scale-95"
            title="Executive Board"
          >
            <Crown size={20} />
          </button>
        </div>
      </div>

      <button 
        onClick={() => navigate(`/tier-data/${user.tier}`)}
        className={`w-full text-left ${colors.bgLight} backdrop-blur-xl rounded-3xl p-6 shadow-soft dark:shadow-none border border-white/60 dark:border-gray-700 mb-4 active:scale-[0.98] transition-all group relative overflow-hidden`}
      >
        <div className="relative z-10">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <div className="flex items-center space-x-1 mb-1">
                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Current Tier</p>
                        <TrendingUp size={10} className="text-synergy-blue" />
                    </div>
                    <h2 className={`text-2xl font-black ${colors.text}`}>{user.tier} Affiliate</h2>
                </div>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm border transition-transform group-hover:scale-110 ${colors.bgLight} ${colors.text} border-white/50 dark:border-gray-600`}>
                    <colors.icon size={24} fill="currentColor" />
                </div>
            </div>
            
            <div className="mb-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter mb-1.5">
                    <span className="text-gray-400">Next Target</span>
                    <span className="text-synergy-blue">{progress.toFixed(0)}% Complete</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                    <div 
                        className={`h-full transition-all duration-1000 ${colors.progress}`} 
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            </div>
            <div className="flex items-center justify-between mt-3">
                <p className="text-[10px] text-gray-400 font-bold">
                    {user.tier === UserTier.EXECUTIVE 
                        ? "Max Tier Achieved" 
                        : `฿${((nextTarget ?? 0) - (user.accumulatedSales ?? 0)).toLocaleString()} remaining`}
                </p>
                <span className="text-[9px] font-bold text-synergy-blue uppercase tracking-widest bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">View Stats</span>
            </div>
        </div>

        {/* New Sophisticated Background Graphic: Glassy Waves & Floating Rings */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {/* Mesh Gradient Base */}
            <div className={`absolute inset-0 opacity-20 bg-gradient-to-br ${colors.decoration} via-transparent to-transparent`}></div>
            
            {/* Floating Concentric Rings */}
            <svg className={`absolute -top-12 -right-12 w-64 h-64 opacity-[0.15] ${colors.text}`} viewBox="0 0 200 200">
                <circle cx="100" cy="100" r="40" fill="none" stroke="currentColor" strokeWidth="0.5" />
                <circle cx="100" cy="100" r="60" fill="none" stroke="currentColor" strokeWidth="0.5" />
                <circle cx="100" cy="100" r="80" fill="none" stroke="currentColor" strokeWidth="0.5" />
                <circle cx="100" cy="100" r="100" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </svg>

            {/* Subtle Light Beam */}
            <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-white/20 to-transparent rotate-12 opacity-30"></div>
            <div className="absolute top-0 left-1/2 w-px h-full bg-gradient-to-b from-transparent via-white/10 to-transparent rotate-12 opacity-20"></div>
        </div>
      </button>

      {user.tier !== UserTier.STARTER && (
          <div className={`p-4 rounded-2xl mb-6 shadow-sm border flex items-start space-x-3 transition-colors duration-300 ${isEligible ? 'bg-green-50 dark:bg-emerald-900/20 border-green-100 dark:border-emerald-800 text-green-700 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800 text-red-700 dark:text-red-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${isEligible ? 'bg-green-100 border-green-200 dark:bg-emerald-900/40 text-green-600 dark:text-emerald-300 dark:border-emerald-700' : 'bg-red-100 border-red-200 dark:bg-red-900/40 text-red-600 dark:text-red-300 dark:border-red-700'}`}>
                  {isEligible ? <Clock size={20} /> : <Clock size={20} className="animate-pulse" />}
              </div>
              <div>
                  <h4 className="text-sm font-bold mb-1">
                      Team Income Eligibility
                  </h4>
                  <p className="text-xs font-medium opacity-90">
                      {`Eligibility remains ${daysRemaining} days`}
                  </p>
                  <p className="text-[10px] mt-1 opacity-70 font-bold uppercase tracking-tight">
                      {'Make 1 Buy to add +30 days to your current balance'}
                  </p>
              </div>
          </div>
      )}

      <h3 className="text-xs font-bold text-gray-400 uppercase ml-2 mb-4 tracking-[0.2em]">Tier Status</h3>

      <div className="space-y-4">
        {tiers.map((tier) => {
            const isActive = user.tier === tier.name;
            const isPassed = 
                (user.tier === UserTier.EXECUTIVE && tier.name !== UserTier.EXECUTIVE) ||
                (user.tier === UserTier.BUILDER && (tier.name === UserTier.STARTER || tier.name === UserTier.MARKETER)) ||
                (user.tier === UserTier.MARKETER && tier.name === UserTier.STARTER);

            return (
                (() => {
                    const currentTierColors = getTierColors(tier.name);
                    return (
                        <div key={tier.name} className={`rounded-2xl p-5 border transition relative overflow-hidden ${isActive ? `shadow-md ring-1 ring-current/20` : 'shadow-sm opacity-90'} ${currentTierColors.bgLight} ${isActive ? `border-current ${currentTierColors.text}` : 'border-white/60 dark:border-gray-700'}`}>
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center space-x-4">
                                        <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-md border ${tier.color} transition-transform`}>
                                            <tier.icon size={32} fill="currentColor" className="opacity-90" />
                                        </div>
                                        <div>
                                            <h4 className="text-base font-bold text-gray-900 dark:text-white leading-tight">{tier.displayName} Affiliate</h4>
                                            <p className="text-[11px] text-gray-500 font-bold uppercase tracking-tight mt-0.5">{tier.req}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2 pt-1">
                                      {isActive && <span className={`text-white text-[9px] font-bold uppercase tracking-widest px-2.5 py-1.5 rounded-full shadow-sm ${tier.name === UserTier.EXECUTIVE ? 'bg-amber-500' : tier.name === UserTier.BUILDER ? 'bg-purple-700' : tier.name === UserTier.MARKETER ? 'bg-pink-500' : 'bg-synergy-blue'}`}>Active</span>}
                                      {isPassed && <CheckCircle size={18} className="text-green-500" />}
                                    </div>
                                </div>
                                
                                <ul className="space-y-2.5 mt-4">
                                    {tier.benefits.map((benefit, i) => (
                                        <li key={i} className="flex items-start space-x-3 text-[13px] text-gray-600 dark:text-gray-400">
                                            <CheckCircle size={16} className="text-green-500 shrink-0 mt-0.5" />
                                            <span className="font-medium leading-snug">{benefit}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            {/* Mesh Gradient Base for all tier cards */}
                            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                                <div className={`absolute inset-0 opacity-10 bg-gradient-to-br ${currentTierColors.decoration} via-transparent to-transparent`}></div>
                            </div>
                        </div>
                    );
                })()
            );
        })}
      </div>
    </div>
  );
};