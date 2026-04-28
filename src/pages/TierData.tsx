import React, { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, Crown, TrendingUp, Users, ShieldCheck, Star, ChevronRight, Search, X, Zap, BarChart3, Shield, Loader2, Trophy, Medal, Filter } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { UserTier } from '../types';
import { useApp } from '../context/AppContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { getThailandTodayString, getThailandNow, getThailandComponents } from '../utils/dateUtils';


export const TierData: React.FC = () => {
  const navigate = useNavigate();
  const { tier } = useParams<{ tier: string }>();
  const { allTeamMembers, user } = useApp();
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedTier = (tier as UserTier) || UserTier.EXECUTIVE;

  const [tierMembers, setTierMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [today, setToday] = useState(getThailandTodayString());

  useEffect(() => {
    const fetchTierMembers = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'publicProfiles'), where('tier', '==', selectedTier));
        const snapshot = await getDocs(q);
        const members = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setTierMembers(members);
      } catch (err) {
        console.error("Failed to fetch tier members", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTierMembers();
  }, [selectedTier, today]);

  const stats = useMemo(() => {
    const activeCount = tierMembers.length;
    const totalIncome = tierMembers.reduce((sum, m) => sum + (m.accumulatedIncome || 0), 0);
    return {
      activeCount,
      totalIncome
    };
  }, [tierMembers]);

  const formatCompactNumber = (num: number): string => {
    const val = Math.floor(num);
    if (val >= 1000000) {
      return (val / 1000000).toFixed(1) + 'M';
    }
    if (val >= 10000) {
      return (val / 1000).toFixed(1) + 'K';
    }
    return val.toLocaleString();
  };

  const theme = useMemo(() => {
    switch (selectedTier) {
      case UserTier.EXECUTIVE:
        return { 
          title: 'Executive Affiliate', 
          subtitle: 'Platform Elite Leaders',
          gradient: 'from-amber-500 to-orange-600', 
          accent: 'amber', 
          icon: Crown,
          activeLabel: 'Active Leaders',
          rewardLabel: 'Total Income',
          activeVal: stats.activeCount.toLocaleString(),
          rewardVal: `฿${formatCompactNumber(stats.totalIncome)}`
        };
      case UserTier.BUILDER:
        return { 
          title: 'Builder Affiliate', 
          subtitle: 'Structural Growth Hub',
          gradient: 'from-purple-600 to-indigo-700', 
          accent: 'purple', 
          icon: Zap,
          activeLabel: 'Active Leaders',
          rewardLabel: 'Total Income',
          activeVal: stats.activeCount.toLocaleString(),
          rewardVal: `฿${formatCompactNumber(stats.totalIncome)}`
        };
      case UserTier.MARKETER:
        return { 
          title: 'Marketer Affiliate', 
          subtitle: 'Campaign Frontline',
          gradient: 'from-pink-500 to-rose-600', 
          accent: 'pink', 
          icon: BarChart3,
          activeLabel: 'Active Leaders',
          rewardLabel: 'Total Income',
          activeVal: stats.activeCount.toLocaleString(),
          rewardVal: `฿${formatCompactNumber(stats.totalIncome)}`
        };
      default:
        return { 
          title: 'Starter Affiliate', 
          subtitle: 'Emerging Affiliates',
          gradient: 'from-synergy-blue to-blue-600', 
          accent: 'blue', 
          icon: Shield,
          activeLabel: 'Active Leaders',
          rewardLabel: 'Total Income',
          activeVal: stats.activeCount.toLocaleString(),
          rewardVal: `฿${formatCompactNumber(stats.totalIncome)}`
        };
    }
  }, [selectedTier, stats]);

  const tierLeaders = useMemo(() => {
    return [...tierMembers]
      .sort((a, b) => (b.accumulatedIncome || 0) - (a.accumulatedIncome || 0))
      .map(m => ({
        id: m.id,
        name: m.name,
        avatar: m.avatar,
        income: `฿${formatCompactNumber(m.accumulatedIncome || 0)}`,
        team: (m.teamSize || 0).toLocaleString(),
        rawIncome: m.accumulatedIncome || 0
      }));
  }, [tierMembers]);

  const filteredLeaders = useMemo(() => {
    if (!searchQuery) return tierLeaders;
    return tierLeaders.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [tierLeaders, searchQuery]);

  const colors: any = {
      amber: { text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/30', border: 'border-amber-100 dark:border-amber-800' },
      purple: { text: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/30', border: 'border-purple-100 dark:border-purple-800' },
      pink: { text: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-50 dark:bg-pink-900/30', border: 'border-pink-100 dark:border-pink-800' },
      blue: { text: 'text-synergy-blue dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/30', border: 'border-blue-100 dark:border-blue-800' }
  };

  const currentColors = colors[theme.accent];

  const DataCard: React.FC<{ item: any, idx: number }> = ({ item, idx }) => {
    const isTopRank = !searchQuery && idx < 3;
    
    const getRankStyles = () => {
        if (!isTopRank) return { 
            text: 'text-gray-900 dark:text-white', 
            border: 'border-gray-50 dark:border-gray-700',
            badge: (theme.accent === 'amber' ? 'bg-amber-400' : theme.accent === 'purple' ? 'bg-purple-500' : theme.accent === 'pink' ? 'bg-pink-500' : 'bg-synergy-blue'),
            card: 'bg-white dark:bg-gray-800 border-transparent',
            icon: null,
            glow: ''
        };

        switch (idx) {
            case 0: // Gold
                return {
                    text: 'text-amber-600 dark:text-amber-400',
                    border: 'border-amber-400/30 shadow-[0_0_20px_rgba(251,191,36,0.15)]',
                    badge: 'bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 shadow-lg',
                    card: 'bg-gradient-to-br from-amber-50/50 via-white to-white dark:from-amber-900/10 dark:via-gray-800 dark:to-gray-800 border-amber-400/20 dark:border-amber-700/30',
                    icon: <Trophy size={16} className="text-amber-500 animate-pulse" />,
                    glow: 'shadow-[0_0_25px_rgba(251,191,36,0.1)]',
                    decoration: 'from-amber-400/20'
                };
            case 1: // Silver/Purple
                return {
                    text: 'text-purple-600 dark:text-purple-400',
                    border: 'border-purple-300/30 shadow-[0_0_15px_rgba(168,85,247,0.1)]',
                    badge: 'bg-gradient-to-br from-purple-400 via-purple-500 to-purple-700 shadow-lg',
                    card: 'bg-gradient-to-br from-purple-50/50 via-white to-white dark:from-purple-900/10 dark:via-gray-800 dark:to-gray-800 border-purple-300/20 dark:border-purple-700/30',
                    icon: <Medal size={16} className="text-purple-400" />,
                    glow: 'shadow-[0_0_20px_rgba(168,85,247,0.1)]',
                    decoration: 'from-purple-700/20'
                };
            case 2: // Bronze/Pink
                return {
                    text: 'text-pink-600 dark:text-pink-400',
                    border: 'border-pink-300/30 shadow-[0_0_15px_rgba(236,72,153,0.1)]',
                    badge: 'bg-gradient-to-br from-pink-400 via-pink-500 to-pink-700 shadow-lg',
                    card: 'bg-gradient-to-br from-pink-50/50 via-white to-white dark:from-pink-900/10 dark:via-gray-800 dark:to-gray-800 border-pink-300/20 dark:border-pink-700/30',
                    icon: <Medal size={16} className="text-pink-500" />,
                    glow: 'shadow-[0_0_20px_rgba(236,72,153,0.15)]',
                    decoration: 'from-pink-400/20'
                };
            default:
                return { text: '', border: '', badge: '', card: '', icon: null, glow: '', decoration: '' };
        }
    };

    const styles = getRankStyles();

    return (
        <motion.div 
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`p-4 rounded-[24px] flex items-center justify-between border transition-all duration-500 ${styles.card} ${styles.glow} relative overflow-hidden mb-3`}
        >
            <div className="flex items-center space-x-4 relative z-10">
                <div className="relative shrink-0">
                    <div className={`rounded-full p-0.5 transition-all duration-500 ${isTopRank ? 'bg-gradient-to-br ' + (idx === 0 ? 'from-amber-400 via-yellow-300 to-amber-600' : idx === 1 ? 'from-purple-400 via-indigo-300 to-purple-600' : 'from-pink-400 via-rose-300 to-pink-600') : ''}`}>
                        <img 
                            src={item.avatar || undefined} 
                            alt={item.name} 
                            className={`w-14 h-14 rounded-full object-cover border-[1px] border-white dark:border-gray-800 shadow-md bg-gray-100`} 
                        />
                    </div>
                    <div className={`absolute -top-1 -right-1 rounded-full border-[1px] border-white dark:border-gray-800 shadow-lg flex items-center justify-center transition-all duration-500 ${isTopRank ? 'w-6 h-6' : 'w-5 h-5'} ${styles.badge}`}>
                        <span className={`${isTopRank ? 'text-[10px]' : 'text-[8px]'} font-black text-white`}>{idx + 1}</span>
                    </div>
                </div>
                <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                        <h4 className={`text-sm font-bold truncate ${isTopRank ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-200'}`}>{item.name}</h4>
                        {styles.icon}
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                        <span className={`text-[8px] px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter border ${currentColors.bg} ${currentColors.text} ${currentColors.border}`}>{selectedTier}</span>
                        <span className="flex items-center text-[9px] text-gray-400 font-bold">
                            <Users size={10} className="mr-1" />
                            {item.team} Net
                        </span>
                    </div>
                </div>
            </div>
            <div className="text-right shrink-0 relative z-10">
                <div className="flex flex-col items-end">
                    <p className={`text-base font-black ${isTopRank ? styles.text : 'text-emerald-500'}`}>{item.income}</p>
                    <div className="flex items-center space-x-1 mt-0.5">
                        <TrendingUp size={10} className="text-emerald-500" />
                        <p className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-tighter">Profit</p>
                    </div>
                </div>
            </div>

            {isTopRank && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className={`absolute inset-0 opacity-10 bg-gradient-to-br ${styles.decoration} via-transparent to-transparent`}></div>
                    <svg className={`absolute -top-8 -right-8 w-32 h-32 opacity-[0.1] ${styles.text}`} viewBox="0 0 200 200">
                        <circle cx="100" cy="100" r="40" fill="none" stroke="currentColor" strokeWidth="0.5" />
                        <circle cx="100" cy="100" r="60" fill="none" stroke="currentColor" strokeWidth="0.5" />
                        <circle cx="100" cy="100" r="80" fill="none" stroke="currentColor" strokeWidth="0.5" />
                    </svg>
                </div>
            )}
        </motion.div>
    );
  };

  return (
    <div className="pb-24 pt-0 px-4 max-w-md mx-auto min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="sticky top-0 z-[100] bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100/50 dark:border-gray-800/50 -mx-4 px-4 py-3 mb-6 transition-all shadow-2xl dark:shadow-none">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button 
                onClick={() => navigate(-1)} 
                className="p-2 -ml-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-xl font-bold ml-2 text-gray-900 dark:text-white tracking-tight">
                {selectedTier} Status
            </h1>
          </div>
          <button 
            onClick={() => setIsSearchVisible(!isSearchVisible)}
            className={`p-2 rounded-full transition-all ${isSearchVisible ? 'bg-synergy-blue text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800'}`}
          >
            <Search size={20} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Loader2 className="animate-spin mb-4" size={32} />
          <p className="text-xs font-black uppercase tracking-widest">Loading Intel...</p>
        </div>
      ) : (
        <>
          <AnimatePresence>
            {isSearchVisible && (
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="relative mb-6"
                >
                    <div className="absolute left-4 top-3 text-gray-400">
                        <Search size={18} />
                    </div>
                    <input 
                        type="text"
                        autoFocus
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={`Search ${selectedTier} leaders...`}
                        className="w-full bg-white dark:bg-gray-800 border border-transparent dark:border-gray-700 rounded-2xl py-3.5 pl-12 pr-10 shadow-soft focus:ring-2 focus:ring-synergy-blue/20 outline-none dark:text-white text-sm font-medium"
                    />
                    {searchQuery && (
                        <button 
                            onClick={() => setSearchQuery('')}
                            className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600"
                        >
                            <X size={18} />
                        </button>
                    )}
                </motion.div>
            )}
          </AnimatePresence>

          {!searchQuery && (
            <>
              {/* Dynamic Board Header */}
              <div className={`bg-gradient-to-br ${theme.gradient} rounded-[32px] p-6 mb-4 text-white relative overflow-hidden shadow-lg animate-in zoom-in-95 duration-500`}>
                  <div className="relative z-10">
                      <div className="flex items-center space-x-3 mb-5">
                          <div className="w-11 h-11 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-inner">
                              <theme.icon size={26} className="text-white" />
                          </div>
                          <div>
                              <h2 className="text-lg font-bold tracking-tight uppercase leading-tight">{theme.title}</h2>
                              <p className="text-[10px] opacity-80 font-bold uppercase tracking-widest">{theme.subtitle}</p>
                          </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/5 shadow-inner">
                              <p className="text-[9px] text-white/80 uppercase font-bold tracking-widest mb-1">{theme.activeLabel}</p>
                              <p className="text-xl font-bold">{theme.activeVal}</p>
                          </div>
                          <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/5 shadow-inner">
                              <p className="text-[9px] text-white/80 uppercase font-bold tracking-widest mb-1">{theme.rewardLabel}</p>
                              <p className="text-xl font-bold text-white">{theme.rewardVal}</p>
                          </div>
                      </div>
                  </div>
                  {/* Enhanced Background Graphics */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
                      {/* Geometric Overlays */}
                      <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[120%] bg-white/5 rounded-full blur-3xl transform rotate-12"></div>
                      <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[100%] bg-black/5 rounded-full blur-3xl transform -rotate-12"></div>
                      
                      {/* Animated Sweep */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-sweep" style={{ animationDuration: '5s' }}></div>
                      
                      {/* Abstract Icons */}
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-10">
                          <theme.icon size={120} strokeWidth={0.5} className="text-white" />
                      </div>
                      
                      {/* Grain Texture */}
                      <div className="absolute inset-0 bg-grain opacity-[0.03] mix-blend-overlay"></div>
                  </div>
              </div>

              {/* Tier Selector Box */}
              <div className="relative flex items-center mb-6 group transition-colors">
                <div className="absolute left-0 pointer-events-none text-synergy-blue">
                  <Filter size={12} />
                </div>
                <select 
                  value={selectedTier} 
                  onChange={(e) => {
                      if (e.target.value === 'All') navigate('/leaderboard');
                      else navigate(`/tier-data/${e.target.value}`);
                  }}
                  className="appearance-none bg-transparent text-[10px] font-black uppercase tracking-widest text-synergy-blue py-2 pl-5 focus:outline-none cursor-pointer"
                >
                  <option value="All" className="dark:bg-gray-800">All Tiers</option>
                  {Object.values(UserTier).map(t => (
                    <option key={t} value={t} className="dark:bg-gray-800">{t}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div className="space-y-4">
              {filteredLeaders.map((item, idx) => (
                  <DataCard key={idx} item={item} idx={idx} />
              ))}
              {filteredLeaders.length === 0 && (
                <div className="py-12 text-center bg-white dark:bg-gray-800 rounded-[32px] border border-dashed border-gray-200 dark:border-gray-700">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No leaders in this tier yet</p>
                </div>
              )}
          </div>
        </>
      )}
    </div>
  );
};
