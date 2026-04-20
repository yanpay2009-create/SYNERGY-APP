import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Trophy, 
  TrendingUp, 
  ChevronLeft, 
  Medal, 
  Crown, 
  Star,
  Flame,
  ArrowUpRight,
  ArrowLeft,
  Search,
  X,
  Loader2,
  Users,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot 
} from 'firebase/firestore';
import { db } from '../firebase';
import { UserTier } from '../types';
import { getThailandTodayString, getThailandNow, getThailandComponents } from '../utils/dateUtils';

interface LeaderboardEntry {
  id: string;
  name: string;
  avatar: string;
  dailyIncome: number;
  accumulatedIncome: number;
  tier: UserTier;
  referralCode: string;
  lastIncomeDate: string;
  teamSize: number;
}

const tierColors: Record<string, { bg: string, text: string, border: string }> = {
  [UserTier.STARTER]: { bg: 'bg-blue-50 dark:bg-blue-900/30', text: 'text-synergy-blue dark:text-blue-400', border: 'border-blue-100 dark:border-blue-800' },
  [UserTier.MARKETER]: { bg: 'bg-pink-50 dark:bg-pink-900/30', text: 'text-pink-600 dark:text-pink-400', border: 'border-pink-100 dark:border-pink-800' },
  [UserTier.BUILDER]: { bg: 'bg-purple-50 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400', border: 'border-purple-100 dark:border-purple-800' },
  [UserTier.EXECUTIVE]: { bg: 'bg-amber-50 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-100 dark:border-amber-800' }
};

const CountdownTimer: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const updateTimer = () => {
      const now = getThailandNow();
      const components = getThailandComponents(now);
      
      // Target is midnight of the next day in Thailand
      // We create a date object for Thailand midnight by using the components
      // and then converting it back to a real Date object.
      // The simplest way is to target the next day at 00:00:00 in Thailand.
      
      // Thailand is UTC+7. Thailand Midnight is 17:00 UTC.
      const nowUtc = now.getTime();
      const thailandMidnightUtc = new Date(nowUtc);
      thailandMidnightUtc.setUTCHours(17, 0, 0, 0);
      
      let targetUtc = thailandMidnightUtc.getTime();
      if (targetUtc <= nowUtc) {
        targetUtc += 24 * 60 * 60 * 1000;
      }
      
      const diff = targetUtc - nowUtc;
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center space-x-1.5 bg-white dark:bg-gray-800 px-3 py-1 rounded-full shadow-sm border border-amber-200 dark:border-amber-700">
      <Flame size={12} className="text-amber-500" />
      <span className="text-xs font-mono font-black text-amber-600 dark:text-amber-400 tabular-nums w-[60px] text-center">
        {timeLeft}
      </span>
    </div>
  );
};

const Leaderboard: React.FC = () => {
  const navigate = useNavigate();
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [globalStats, setGlobalStats] = useState({ totalIncome: 0, activeUsers: 0 });
  
  // Use Thailand Date (UTC+7) as state to allow dynamic updates
  const [today, setToday] = useState(getThailandTodayString());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for date change every minute
    const interval = setInterval(() => {
      const currentThailandDate = getThailandTodayString();
      if (currentThailandDate !== today) {
        setToday(currentThailandDate);
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [today]);

  useEffect(() => {
    // Query for Today's Leaders
    // Note: We use only one filter to avoid composite index requirements.
    // Sorting and additional filtering are handled in memory.
    const qToday = query(
      collection(db, 'publicProfiles'),
      where('lastIncomeDate', '==', today)
    );

    const unsubscribeToday = onSnapshot(qToday, (snapshot) => {
      const entries: LeaderboardEntry[] = [];
      let totalIncome = 0;
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        const dailyIncome = data.dailyIncome || 0;
        
        if (dailyIncome > 0) {
          totalIncome += dailyIncome;
          entries.push({
            id: doc.id,
            name: data.name || 'Anonymous',
            avatar: data.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${doc.id}`,
            dailyIncome: dailyIncome,
            accumulatedIncome: data.accumulatedIncome || 0,
            tier: data.tier || UserTier.STARTER,
            referralCode: data.referralCode || '',
            lastIncomeDate: data.lastIncomeDate || '',
            teamSize: data.teamSize || 0
          });
        }
      });
      
      // Update global stats from the same snapshot to save quota/avoid extra queries
      setGlobalStats({
        totalIncome: totalIncome,
        activeUsers: entries.length
      });
      
      // Sort for the leaderboard display (showing all users who earned today)
      const sortedEntries = [...entries].sort((a, b) => b.dailyIncome - a.dailyIncome);
      
      setLeaders(sortedEntries);
      setLoading(false);
      setError(null);
    }, (err) => {
      console.error("Leaderboard Today error:", err);
      setError("Unable to load leaderboard data. Please try again later.");
      setLoading(false);
    });

    return () => {
      unsubscribeToday();
    };
  }, [today]);

  const displayedList = leaders.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));

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

  const theme = {
    title: "Today's Earnings",
    subtitle: 'Real-time Daily Performance',
    gradient: 'from-amber-500 to-orange-600',
    accent: 'amber',
    icon: Trophy,
    activeLabel: 'Active Today',
    rewardLabel: 'Daily Income',
    activeVal: globalStats.activeUsers.toLocaleString(),
    rewardVal: `฿${Math.floor(globalStats.totalIncome).toLocaleString()}`
  };

  const currentColors = { 
    text: 'text-amber-600 dark:text-amber-400', 
    bg: 'bg-amber-50/50 dark:bg-amber-900/10', 
    border: 'border-amber-200/50 dark:border-amber-800/50' 
  };

  const DataCard: React.FC<{ item: LeaderboardEntry, idx: number }> = ({ item, idx }) => {
    const isTopRank = !searchQuery && idx < 3;
    
    const getRankStyles = () => {
        if (!isTopRank) return { 
            text: 'text-gray-900 dark:text-white', 
            border: 'border-gray-50 dark:border-gray-700',
            badge: 'bg-synergy-blue',
            card: 'bg-white dark:bg-gray-800 border-transparent',
            icon: null,
            glow: ''
        };

        switch (idx) {
            case 0: // Gold
                return {
                    text: 'text-amber-600 dark:text-amber-400',
                    border: 'border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.3)]',
                    badge: 'bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 shadow-lg',
                    card: 'bg-gradient-to-br from-amber-50/80 via-white to-white dark:from-amber-900/20 dark:via-gray-800 dark:to-gray-800 border-amber-200/60 dark:border-amber-700/50',
                    icon: <Trophy size={16} className="text-amber-500 animate-pulse" />,
                    glow: 'shadow-[0_0_25px_rgba(251,191,36,0.2)]'
                };
            case 1: // Silver/Purple
                return {
                    text: 'text-purple-600 dark:text-purple-400',
                    border: 'border-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.2)]',
                    badge: 'bg-gradient-to-br from-purple-400 via-purple-500 to-purple-700 shadow-lg',
                    card: 'bg-gradient-to-br from-purple-50/80 via-white to-white dark:from-purple-900/20 dark:via-gray-800 dark:to-gray-800 border-purple-200/60 dark:border-purple-700/50',
                    icon: <Medal size={16} className="text-purple-400" />,
                    glow: 'shadow-[0_0_20px_rgba(168,85,247,0.15)]'
                };
            case 2: // Bronze
                return {
                    text: 'text-orange-600 dark:text-orange-400',
                    border: 'border-orange-300 shadow-[0_0_15px_rgba(249,115,22,0.2)]',
                    badge: 'bg-gradient-to-br from-orange-400 via-orange-500 to-orange-700 shadow-lg',
                    card: 'bg-gradient-to-br from-orange-50/80 via-white to-white dark:from-orange-900/20 dark:via-gray-800 dark:to-gray-800 border-orange-200/60 dark:border-orange-700/50',
                    icon: <Medal size={16} className="text-orange-500" />,
                    glow: 'shadow-[0_0_20px_rgba(249,115,22,0.15)]'
                };
            default:
                return { text: '', border: '', badge: '', card: '', icon: null, glow: '' };
        }
    };

    const styles = getRankStyles();
    const tierStyle = tierColors[item.tier] || tierColors[UserTier.STARTER];

    return (
        <motion.div 
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`p-4 rounded-[24px] flex items-center justify-between border transition-all duration-500 ${styles.card} ${styles.glow} mb-3`}
        >
            <div className="flex items-center space-x-4">
                <div className="relative shrink-0">
                    <div className={`rounded-full p-1 transition-all duration-500 ${isTopRank ? 'bg-gradient-to-br ' + (idx === 0 ? 'from-amber-400 via-yellow-300 to-amber-600' : idx === 1 ? 'from-purple-400 via-indigo-300 to-purple-600' : 'from-orange-400 via-red-300 to-orange-600') : ''}`}>
                        <img 
                            src={item.avatar} 
                            alt={item.name} 
                            className={`w-14 h-14 rounded-full object-cover border-2 border-white dark:border-gray-800 shadow-md bg-gray-100`} 
                        />
                    </div>
                    <div className={`absolute -top-1 -right-1 rounded-full border-2 border-white dark:border-gray-800 shadow-lg flex items-center justify-center transition-all duration-500 ${isTopRank ? 'w-8 h-8' : 'w-6 h-6'} ${styles.badge}`}>
                        <span className={`${isTopRank ? 'text-xs' : 'text-[10px]'} font-black text-white`}>{idx + 1}</span>
                    </div>
                </div>
                <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                        <h4 className={`text-sm font-black truncate ${isTopRank ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-200'}`}>{item.name}</h4>
                        {styles.icon}
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                        <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter border ${tierStyle.bg} ${tierStyle.text} ${tierStyle.border}`}>{item.tier}</span>
                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Ref: {item.referralCode}</span>
                    </div>
                </div>
            </div>
            <div className="text-right shrink-0">
                <div className="flex flex-col items-end">
                    <p className={`text-base font-black ${isTopRank ? styles.text : 'text-emerald-500'}`}>฿{Math.floor(item.dailyIncome).toLocaleString()}</p>
                    <div className="flex items-center space-x-1 mt-0.5">
                        <TrendingUp size={10} className="text-emerald-500" />
                        <p className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-tighter">Profit</p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
  };

  return (
    <div className="pb-24 pt-0 px-4 max-w-md mx-auto min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Sticky Header */}
      <div className="sticky top-0 z-[100] bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100/50 dark:border-gray-800/50 -mx-4 px-4 py-3 mb-6 transition-all">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button 
                onClick={() => navigate(-1)} 
                className="p-2 -ml-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-xl font-bold ml-2 text-gray-900 dark:text-white tracking-tight">
                Leaderboard
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
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-6">
          <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center text-red-500 mb-4">
            <X size={32} />
          </div>
          <p className="text-sm font-bold text-gray-900 dark:text-white mb-2">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="text-xs font-black uppercase tracking-widest text-synergy-blue hover:underline"
          >
            Tap to Retry
          </button>
        </div>
      ) : (
        <>
          {/* Dynamic Board Header */}
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-[32px] p-6 mb-8 text-white relative overflow-hidden shadow-lg animate-in zoom-in-95 duration-500">
              <div className="relative z-10">
                  <div className="flex items-center space-x-3 mb-5">
                      <div className="w-11 h-11 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-inner">
                          <theme.icon size={26} className="text-white" />
                      </div>
                      <div>
                          <h2 className="text-lg font-black tracking-tight uppercase leading-tight">{theme.title}</h2>
                          <p className="text-[10px] opacity-80 font-black uppercase tracking-widest">{theme.subtitle}</p>
                      </div>
                  </div>
                  {leaders.length > 0 && (
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/5 shadow-inner">
                            <p className="text-[9px] text-white/80 uppercase font-black tracking-widest mb-1">{theme.activeLabel}</p>
                            <p className="text-xl font-black">{theme.activeVal}</p>
                        </div>
                        <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/5 shadow-inner">
                            <p className="text-[9px] text-white/80 uppercase font-black tracking-widest mb-1">{theme.rewardLabel}</p>
                            <p className="text-xl font-black text-white">{theme.rewardVal}</p>
                        </div>
                    </div>
                  )}
              </div>
              <div className="absolute right-[-20px] top-[-20px] w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute left-[-10px] bottom-[-10px] w-32 h-32 bg-black/10 rounded-full blur-2xl pointer-events-none"></div>
          </div>

          {isSearchVisible && (
            <div className="relative mb-6 animate-in slide-in-from-top-2 duration-300">
                <div className="absolute left-4 top-3 text-gray-400">
                    <Search size={18} />
                </div>
                <input 
                    type="text"
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`Search leaders...`}
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
            </div>
          )}

          <div className="space-y-4">
              {!searchQuery && (
                <div className="px-4 py-3 mb-2 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-800/50 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                    <p className="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest">Next Daily Reset In</p>
                  </div>
                  <CountdownTimer />
                </div>
              )}
              
              {displayedList.length > 0 ? (
                  displayedList.map((item, idx) => (
                      <DataCard key={idx} item={item} idx={idx} />
                  ))
              ) : searchQuery ? (
                  <div className="text-center py-20 text-gray-400 bg-white dark:bg-gray-800 rounded-[32px] border border-dashed border-gray-200 dark:border-gray-700">
                      <Users size={40} className="mx-auto mb-3 opacity-20" />
                      <p className="text-[10px] font-black uppercase tracking-widest">No matching results</p>
                  </div>
              ) : null}
          </div>

          {/* Info Card - Only show if there is data or searching */}
          {(displayedList.length > 0 || searchQuery) && (
            <div className={`mt-8 rounded-[32px] p-6 border transition-all animate-in fade-in slide-in-from-bottom-4 shadow-sm ${currentColors.bg} ${currentColors.border}`}>
                <h4 className={`text-xs font-black uppercase tracking-widest mb-4 flex items-center ${currentColors.text}`}>
                    <ShieldCheck size={18} className="mr-2" />
                    Daily Insights
                </h4>
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center text-synergy-blue shadow-sm shrink-0">
                    <ArrowUpRight size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                      Earnings are calculated daily and reset at midnight. Keep sharing to climb the ranks and unlock exclusive rewards!
                    </p>
                  </div>
                </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Leaderboard;
