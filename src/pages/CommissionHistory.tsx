import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ArrowLeft, 
  ArrowUpRight, 
  Users, 
  Wallet, 
  Target,
  TrendingUp,
  ChevronRight,
  ChevronLeft,
  Zap,
  DollarSign,
  BarChart3,
  Award,
  CreditCard,
  Download,
  Share2,
  Check,
  Clock,
  ShoppingBag,
  ShieldCheck,
  Landmark,
  CheckCircle2,
  Lock,
  X,
  RotateCcw,
  AlertTriangle,
  Info
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserTier, CommissionTransaction } from '../types';
import { getThailandNow } from '../utils/dateUtils';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Area, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Cell 
} from 'recharts';

const RevenueChart: React.FC<{ data: any[], color: string }> = ({ data, color }) => {
  return (
    <div className="h-48 w-full -mx-4">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
              <stop offset="95%" stopColor={color} stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.5} />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 9, fontWeight: 700, fill: '#9CA3AF' }} 
            interval={0}
          />
          <YAxis hide />
          <Tooltip 
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-white dark:bg-gray-900 p-2 rounded-lg shadow-xl border border-gray-100 dark:border-gray-800">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{payload[0].payload.name}</p>
                    <p className="text-xs font-black text-gray-900 dark:text-white">฿{payload[0].value?.toLocaleString()}</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area type="monotone" dataKey="value" stroke={color} strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
          <Bar 
            dataKey="value" 
            barSize={12} 
            radius={[4, 4, 0, 0]} 
            fill={color} 
            opacity={0.3}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export const CommissionHistory: React.FC = () => {
  const { commissions, user, t, systemSettings, allOrders } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [activeFilter, setActiveFilter] = useState<'All' | 'Direct' | 'Team' | 'Withdrawal'>('All');
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [selectedTx, setSelectedTx] = useState<CommissionTransaction | null>(null);

  const handledTxId = useRef<string | null>(null);

  useEffect(() => {
    const txId = location.state?.txId;
    if (txId && commissions.length > 0 && handledTxId.current !== String(txId)) {
      const tx = commissions.find(c => String(c.id) === String(txId));
      if (tx) {
        setSelectedTx(tx);
        setViewMode('detail');
        handledTxId.current = String(txId);
        // Clear state to prevent re-triggering on back/forward
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state, commissions]);

  // PIN Gate States
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [pinFlow, setPinFlow] = useState<'verify' | 'setup' | 'confirm'>('verify');
  const [tempPin, setTempPin] = useState('');
  const [showPinSuccess, setShowPinSuccess] = useState(false);
  const [targetRoute, setTargetRoute] = useState<string>('');

  const { isSecurityUnlocked, setIsSecurityUnlocked, updateUserSecurity } = useApp();
  
  // Animation States
  const [animatedWallet, setAnimatedWallet] = useState(0);
  const [animatedEarned, setAnimatedEarned] = useState(0);
  const [animatedMonthly, setAnimatedMonthly] = useState(0);
  const [animatedWeekly, setAnimatedWeekly] = useState(0);

  const userCommissions = commissions;

  // Calculate Income for Dashboard (Synced logic with Home)
  const lifetimeEarned = useMemo(() => {
    const val = userCommissions
      .filter(c => (c.status === 'Paid' || c.status === 'Completed') && c.amount > 0)
      .reduce((acc, curr) => acc + curr.amount, 0);
    return Math.round((val + Number.EPSILON) * 100) / 100;
  }, [userCommissions]);

  // Calculate Monthly Revenue
  const monthlyEarned = useMemo(() => {
    const now = getThailandNow();
    const currentMonth = now.toLocaleString('en-GB', { month: 'short', timeZone: 'Asia/Bangkok' });
    const currentYear = now.getFullYear().toString();
    
    return userCommissions
      .filter(c => 
        c.date.includes(currentMonth) && 
        c.date.includes(currentYear) &&
        c.amount > 0 &&
        (c.type === 'Direct' || c.type === 'Team') &&
        (c.status === 'Paid' || c.status === 'Completed')
      )
      .reduce((acc, curr) => acc + curr.amount, 0);
  }, [userCommissions]);

  // Calculate Previous Monthly Revenue
  const previousMonthlyEarned = useMemo(() => {
    const now = getThailandNow();
    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonth = prevMonthDate.toLocaleString('en-GB', { month: 'short', timeZone: 'Asia/Bangkok' });
    const prevYear = prevMonthDate.getFullYear().toString();
    
    return userCommissions
      .filter(c => 
        c.date.includes(prevMonth) && 
        c.date.includes(prevYear) &&
        c.amount > 0 &&
        (c.type === 'Direct' || c.type === 'Team') &&
        (c.status === 'Paid' || c.status === 'Completed')
      )
      .reduce((acc, curr) => acc + curr.amount, 0);
  }, [userCommissions]);

  const monthlyChangePercent = useMemo(() => {
    if (previousMonthlyEarned === 0) {
      return monthlyEarned > 0 ? 100 : 0;
    }
    return ((monthlyEarned - previousMonthlyEarned) / previousMonthlyEarned) * 100;
  }, [monthlyEarned, previousMonthlyEarned]);

  // Calculate Weekly Revenue (Last 7 days)
  const weeklyEarned = useMemo(() => {
    const now = getThailandNow();
    const sevenDaysAgo = new Date(now.getTime());
    sevenDaysAgo.setDate(now.getDate() - 7);
    
    return userCommissions
      .filter(c => {
        const txDate = new Date(c.date);
        return txDate >= sevenDaysAgo && 
               txDate <= now &&
               c.amount > 0 &&
               (c.type === 'Direct' || c.type === 'Team') &&
               (c.status === 'Paid' || c.status === 'Completed');
      })
      .reduce((acc, curr) => acc + curr.amount, 0);
  }, [userCommissions]);

  // Calculate Previous Weekly Revenue (7-14 days ago)
  const previousWeeklyEarned = useMemo(() => {
    const now = getThailandNow();
    const sevenDaysAgo = new Date(now.getTime());
    sevenDaysAgo.setDate(now.getDate() - 7);
    const fourteenDaysAgo = new Date(now.getTime());
    fourteenDaysAgo.setDate(now.getDate() - 14);
    
    return userCommissions
      .filter(c => {
        const txDate = new Date(c.date);
        return txDate >= fourteenDaysAgo && 
               txDate < sevenDaysAgo &&
               c.amount > 0 &&
               (c.type === 'Direct' || c.type === 'Team') &&
               (c.status === 'Paid' || c.status === 'Completed');
      })
      .reduce((acc, curr) => acc + curr.amount, 0);
  }, [userCommissions]);

  const weeklyChangePercent = useMemo(() => {
    if (previousWeeklyEarned === 0) {
      return weeklyEarned > 0 ? 100 : 0;
    }
    return ((weeklyEarned - previousWeeklyEarned) / previousWeeklyEarned) * 100;
  }, [weeklyEarned, previousWeeklyEarned]);

  // Calculate Yearly Revenue
  const yearlyEarned = useMemo(() => {
    const now = getThailandNow();
    const currentYear = now.getFullYear().toString();
    
    return userCommissions
      .filter(c => 
        c.date.includes(currentYear) &&
        c.amount > 0 &&
        (c.type === 'Direct' || c.type === 'Team') &&
        (c.status === 'Paid' || c.status === 'Completed')
      )
      .reduce((acc, curr) => acc + curr.amount, 0);
  }, [userCommissions]);

  // Calculate Previous Yearly Revenue
  const previousYearlyEarned = useMemo(() => {
    const now = getThailandNow();
    const prevYear = (now.getFullYear() - 1).toString();
    
    return userCommissions
      .filter(c => 
        c.date.includes(prevYear) &&
        c.amount > 0 &&
        (c.type === 'Direct' || c.type === 'Team') &&
        (c.status === 'Paid' || c.status === 'Completed')
      )
      .reduce((acc, curr) => acc + curr.amount, 0);
  }, [userCommissions]);

  const yearlyChangePercent = useMemo(() => {
    if (previousYearlyEarned === 0) {
      return yearlyEarned > 0 ? 100 : 0;
    }
    return ((yearlyEarned - previousYearlyEarned) / previousYearlyEarned) * 100;
  }, [yearlyEarned, previousYearlyEarned]);

  // Show Total Sales (Accumulated Volume)
  const walletBalance = user?.walletBalance || 0;

  // Animation effect
  useEffect(() => {
    const duration = 1000;
    const frameRate = 60;
    const totalFrames = Math.round(duration / (1000 / frameRate));
    
    let frame = 0;
    const timer = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      setAnimatedEarned(lifetimeEarned * easeOut);
      setAnimatedMonthly(monthlyEarned * easeOut);
      setAnimatedWeekly(weeklyEarned * easeOut);
      setAnimatedWallet(walletBalance * easeOut);
      
      if (frame === totalFrames) {
        clearInterval(timer);
      }
    }, 1000 / frameRate);

    return () => clearInterval(timer);
  }, [walletBalance, lifetimeEarned, monthlyEarned, weeklyEarned]);

  const triggerPinGate = (route: string) => {
    setTargetRoute(route);
    if (isSecurityUnlocked) {
      navigate(route);
      return;
    }
    const hasPin = user?.pin && user.pin.trim() !== "";
    setPinFlow(hasPin ? 'verify' : 'setup');
    setIsVerifyingPin(true);
    setPin('');
    setTempPin('');
    setPinError(false);
  };

  const handlePinInput = (value: string) => {
    const cleanValue = value.replace(/[^0-9]/g, '').slice(0, 6);
    setPin(cleanValue);
    setPinError(false);

    if (cleanValue.length === 6) {
      if (pinFlow === 'verify') {
        if (cleanValue === user?.pin) {
          setIsSecurityUnlocked(true);
          setShowPinSuccess(true);
          setTimeout(() => {
            setShowPinSuccess(false);
            setIsVerifyingPin(false);
            navigate(targetRoute);
          }, 1000);
        } else {
          setPinError(true);
          setTimeout(() => {
            setPin('');
          }, 500);
        }
      } else if (pinFlow === 'setup') {
        setTempPin(cleanValue);
        setTimeout(() => {
          setPin('');
          setPinFlow('confirm');
        }, 300);
      } else if (pinFlow === 'confirm') {
        if (cleanValue === tempPin) {
          updateUserSecurity('pin', cleanValue);
          setIsSecurityUnlocked(true);
          setShowPinSuccess(true);
          setTimeout(() => {
            setShowPinSuccess(false);
            setIsVerifyingPin(false);
            navigate(targetRoute);
          }, 1000);
        } else {
          setPinError(true);
          setTimeout(() => {
            setPin('');
            setTempPin('');
            setPinFlow('setup');
          }, 500);
        }
      }
    }
  };

  const [selectedCard, setSelectedCard] = useState<'Weekly' | 'Monthly' | 'Total' | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const sortedCommissions = useMemo(() => {
    const base = activeFilter === 'All' 
      ? userCommissions 
      : userCommissions.filter(c => c.type === activeFilter);
    
    return [...base].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [userCommissions, activeFilter]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter]);

  const paginatedCommissions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedCommissions.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedCommissions, currentPage]);

  const totalPages = Math.ceil(sortedCommissions.length / itemsPerPage);

  const getRevenueChartData = useMemo(() => {
    if (!selectedCard) return [];
    
    const now = getThailandNow();
    const data: any[] = [];

    if (selectedCard === 'Weekly') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime());
        d.setDate(now.getDate() - i);
        const dateStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
        
        const dayTotal = userCommissions
          .filter(c => {
            const txDate = new Date(c.date);
            return txDate.getDate() === d.getDate() && 
                   txDate.getMonth() === d.getMonth() && 
                   txDate.getFullYear() === d.getFullYear() &&
                   c.amount > 0 &&
                   (c.status === 'Paid' || c.status === 'Completed');
          })
          .reduce((acc, curr) => acc + curr.amount, 0);

        data.push({ name: dateStr, value: dayTotal });
      }
    } else if (selectedCard === 'Monthly') {
      for (let i = 5; i >= 0; i--) {
        const dEnd = new Date(now.getTime());
        dEnd.setDate(now.getDate() - (i * 5));
        const dStart = new Date(now.getTime());
        dStart.setDate(now.getDate() - ((i + 1) * 5) + 1);
        
        const periodLabel = `${dStart.getDate()}-${dEnd.getDate()}`;
        
        const periodComms = userCommissions
          .filter(c => {
            const txDate = new Date(c.date);
            return txDate >= dStart && txDate <= dEnd &&
                   c.amount > 0 &&
                   (c.status === 'Paid' || c.status === 'Completed');
          });

        const total = periodComms.reduce((acc, curr) => acc + curr.amount, 0);
        
        data.push({ 
          name: periodLabel, 
          value: total
        });
      }
    } else {
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthLabel = d.toLocaleString('en-GB', { month: 'short' });
        const yearLabel = d.getFullYear() % 100;
        
        const monthTotal = userCommissions
          .filter(c => {
            const txDate = new Date(c.date);
            return txDate.getMonth() === d.getMonth() && 
                   txDate.getFullYear() === d.getFullYear() &&
                   c.amount > 0 &&
                   (c.status === 'Paid' || c.status === 'Completed');
          })
          .reduce((acc, curr) => acc + curr.amount, 0);

        data.push({ name: `${monthLabel}`, value: monthTotal });
      }
    }

    return data;
  }, [selectedCard, userCommissions]);

  const detailCardInfo = useMemo(() => {
    if (!selectedCard) return null;

    if (selectedCard === 'Weekly') {
      return {
        current: weeklyEarned,
        previous: previousWeeklyEarned,
        title: "Weekly Overview",
        icon: <Zap size={18} />,
        colorClass: "text-purple-500 bg-purple-50 dark:bg-purple-900/30",
        chartColor: "#A855F7"
      };
    } else if (selectedCard === 'Monthly') {
      return {
        current: monthlyEarned,
        previous: previousMonthlyEarned,
        title: "Monthly Overview",
        icon: <BarChart3 size={18} />,
        colorClass: "text-synergy-blue bg-blue-50 dark:bg-blue-900/30",
        chartColor: "#00B5FF"
      };
    } else {
      return {
        current: lifetimeEarned,
        previous: previousYearlyEarned,
        title: "Total Income Overview",
        icon: <TrendingUp size={18} />,
        colorClass: "text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30",
        chartColor: "#10B981"
      };
    }
  }, [selectedCard, weeklyEarned, previousWeeklyEarned, monthlyEarned, previousMonthlyEarned, lifetimeEarned, previousYearlyEarned]);

  const renderCardDetail = () => {
    return null;
  };

  if (viewMode === 'detail' && selectedTx) {
    const isWithdrawal = selectedTx.type === 'Withdrawal';
    const isRefund = selectedTx.type === 'Refund';
    
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-sans pb-10 flex flex-col">
            <div className="flex items-center px-4 pt-6 mb-2">
                <button onClick={() => setViewMode('list')} className="p-2 -ml-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition">
                  <ArrowLeft size={24} />
                </button>
            </div>

            <div className="flex-1 px-6 flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="relative mb-6">
                    <div className={`absolute inset-0 ${selectedTx.status === 'Paid' || selectedTx.status === 'Completed' ? 'bg-emerald-500/20' : 'bg-amber-500/20'} blur-xl rounded-full animate-pulse`}></div>
                    <div className={`relative w-16 h-16 ${selectedTx.status === 'Paid' || selectedTx.status === 'Completed' ? 'bg-emerald-500' : 'bg-amber-500'} rounded-full flex items-center justify-center text-white shadow-lg`}>
                        {selectedTx.status === 'Paid' || selectedTx.status === 'Completed' ? (
                            <Check size={32} strokeWidth={4} className="animate-in zoom-in-50 duration-300 delay-100" />
                        ) : (
                            <Clock size={32} strokeWidth={4} className="animate-in zoom-in-50 duration-300 delay-100" />
                        )}
                    </div>
                </div>
                
                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-1 tracking-tight text-center">
                    {selectedTx.type === 'Withdrawal' 
                        ? 'Withdrawal'
                        : (selectedTx.type === 'Refund' || selectedTx.status === 'Cancelled')
                        ? 'Return Products'
                        : (selectedTx.status === 'Pending' || selectedTx.status === 'Waiting' ? 'Transaction Pending' : 'Transaction Success')}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-8 text-center uppercase tracking-widest">
                    {selectedTx.type === 'Withdrawal' 
                        ? (selectedTx.status === 'Completed' || selectedTx.status === 'Paid' ? 'Transaction Completed' : 'Processing Request')
                        : selectedTx.type === 'Refund'
                        ? (selectedTx.status === 'Paid' ? 'Refund Completed' : 'Refund Under Review')
                        : 'Commission earned successfully'}
                </p>

                <div className="w-full bg-white dark:bg-gray-900 rounded-[28px] p-6 shadow-soft border border-gray-100 dark:border-gray-800 space-y-5">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</span>
                        <span className={`text-xl font-bold ${(selectedTx.type === 'Refund' || selectedTx.status === 'Cancelled' || selectedTx.type === 'Withdrawal') ? 'text-red-500' : 'text-emerald-500'}`}>
                            {(selectedTx.type === 'Refund' || selectedTx.status === 'Cancelled' || selectedTx.type === 'Withdrawal') ? '-' : '+'}฿{Math.floor(Math.abs(selectedTx.amount ?? 0)).toLocaleString()}
                        </span>
                    </div>
                    
                    <div className="h-px bg-gray-50 dark:bg-gray-800"></div>
                    
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-gray-400 uppercase">Type</span>
                            <span className="text-xs font-black text-gray-900 dark:text-white">{selectedTx.type}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-gray-400 uppercase">Status</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${selectedTx.status === 'Paid' || selectedTx.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : (selectedTx.status === 'Pending' || selectedTx.status === 'Waiting') ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                                {selectedTx.status}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-gray-400 uppercase">Date</span>
                            <span className="text-xs font-black text-gray-900 dark:text-white">{selectedTx.date}</span>
                        </div>
                        <div className="flex justify-between items-start">
                            <span className="text-[10px] font-bold text-gray-400 uppercase mt-1">Reference</span>
                            <span className="text-[10px] font-black text-gray-900 dark:text-white text-right max-w-[150px] break-words">
                                {selectedTx.source.split('|')[0]}
                            </span>
                        </div>
                        {selectedTx.orderId && (
                            <>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Order ID</span>
                                    <span className="text-xs font-black text-synergy-blue">#{selectedTx.orderId}</span>
                                </div>
                                {allOrders.find(o => o.id === selectedTx.orderId) && (
                                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-3 space-y-3">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Purchased Items</p>
                                        {allOrders.find(o => o.id === selectedTx.orderId)?.items.map(item => (
                                            <div key={item.id} className="flex items-center justify-between">
                                                <div className="flex items-center space-x-2">
                                                    <img 
                                                        src={item.image || undefined} 
                                                        alt={item.name} 
                                                        className="w-8 h-8 rounded-lg object-cover shadow-sm" 
                                                        referrerPolicy="no-referrer"
                                                    />
                                                    <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300 truncate max-w-[150px]">{item.name}</span>
                                                </div>
                                                <span className="text-[10px] font-black text-gray-900 dark:text-white">x{item.quantity}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <div className="bg-synergy-blue/5 dark:bg-synergy-blue/10 rounded-xl p-3 flex justify-between items-center border border-synergy-blue/10">
                        <span className="text-[10px] font-black text-synergy-blue uppercase tracking-widest">Transaction ID</span>
                        <span className="text-[10px] font-black text-synergy-blue">SF-{selectedTx.id.toString().slice(-8).toUpperCase()}</span>
                    </div>
                </div>
            </div>

            <div className="px-6 space-y-3">
                <button 
                    onClick={() => setViewMode('list')}
                    className="w-full h-14 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 rounded-full font-black uppercase tracking-[0.2em] text-[10px] border border-gray-100 dark:border-gray-800 active:scale-95 transition"
                >
                    Back to History
                </button>
            </div>
        </div>
    );
  }

  return (
    <div className="pb-10 pt-0 px-4 max-w-md mx-auto min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors relative">
      {isVerifyingPin && (
          <div className="fixed inset-0 z-[110] bg-white dark:bg-gray-900 flex flex-col items-center justify-start pt-20 px-6 transition-all duration-300">
              <button onClick={() => setIsVerifyingPin(false)} className="absolute top-6 right-6 p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-400"><X size={20} /></button>
              <div className={`w-20 h-20 rounded-full flex items-center justify-center shadow-xl mb-8 transition-all duration-500 ${showPinSuccess ? 'bg-emerald-50 text-white' : 'bg-gray-50 dark:bg-gray-800 text-synergy-blue border border-gray-100 dark:border-gray-700'}`}>
                {showPinSuccess ? <CheckCircle2 size={40} /> : <Lock size={32} />}
              </div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
                {showPinSuccess ? 'Success!' : (pinFlow === 'verify' ? 'Enter Security PIN' : pinFlow === 'confirm' ? 'Confirm Security PIN' : 'Set Security PIN')}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-10 text-center">
                {pinFlow === 'confirm' ? 'Please re-enter your PIN to confirm.' : (pinFlow === 'setup' ? 'Create a 6-digit PIN to protect your funds.' : 'Enter your 6-digit security PIN to continue.')}
              </p>
              <div className="flex space-x-4 mb-10">
                  {[...Array(6)].map((_, i) => (
                  <div key={i} className={`w-4 h-4 rounded-full transition-all duration-300 ${i < pin.length ? 'bg-synergy-blue scale-125' : 'bg-gray-200 dark:bg-gray-700'} ${pinError ? 'bg-red-500 animate-shake' : ''}`} />
                  ))}
              </div>
              <input 
                type="text" 
                pattern="\d*" 
                inputMode="numeric" 
                autoFocus 
                className="opacity-0 absolute inset-0 h-full w-full cursor-pointer z-10" 
                value={pin} 
                onChange={(e) => handlePinInput(e.target.value)} 
              />
          </div>
      )}

      <div className="sticky top-0 z-[100] bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100/50 dark:border-gray-800/50 -mx-4 px-4 py-3 mb-6 transition-all">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition">
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-xl font-bold ml-2 text-gray-900 dark:text-white tracking-tight">Commission History</h1>
          </div>
        </div>
      </div>

      {/* REVENUE DASHBOARD GRID */}
      <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Weekly */}
          <div 
            onClick={() => setSelectedCard(selectedCard === 'Weekly' ? null : 'Weekly')}
            className={`p-4 rounded-3xl shadow-sm border transition-all cursor-pointer active:scale-95 ${selectedCard === 'Weekly' ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800' : 'bg-white dark:bg-gray-800 border-transparent dark:border-gray-700 hover:border-purple-100 dark:hover:border-purple-900/30'}`}
          >
              <div className="flex items-center space-x-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-500 flex items-center justify-center">
                      <Zap size={16} />
                  </div>
                  <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Weekly</span>
              </div>
              <p className="text-xl font-black text-gray-900 dark:text-white">฿{Math.floor(animatedWeekly ?? 0).toLocaleString()}</p>
              <p className={`text-[9px] mt-1 font-bold uppercase tracking-tighter ${weeklyChangePercent >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {weeklyChangePercent >= 0 ? '+' : ''}{weeklyChangePercent.toFixed(1)}% from last week
              </p>
          </div>

          {/* Monthly */}
          <div 
            onClick={() => setSelectedCard(selectedCard === 'Monthly' ? null : 'Monthly')}
            className={`p-4 rounded-3xl shadow-sm border transition-all cursor-pointer active:scale-95 ${selectedCard === 'Monthly' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : 'bg-white dark:bg-gray-800 border-transparent dark:border-gray-700 hover:border-blue-100 dark:hover:border-blue-900/30'}`}
          >
              <div className="flex items-center space-x-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 text-synergy-blue flex items-center justify-center">
                      <BarChart3 size={16} />
                  </div>
                  <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Monthly</span>
              </div>
              <p className="text-xl font-black text-gray-900 dark:text-white">฿{Math.floor(animatedMonthly ?? 0).toLocaleString()}</p>
              <p className={`text-[9px] mt-1 font-bold uppercase tracking-tighter ${monthlyChangePercent >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {monthlyChangePercent >= 0 ? '+' : ''}{monthlyChangePercent.toFixed(1)}% from last month
              </p>
          </div>

          {/* Accumulated */}
          <div 
            onClick={() => setSelectedCard(selectedCard === 'Total' ? null : 'Total')}
            className={`p-4 rounded-3xl shadow-sm border transition-all cursor-pointer active:scale-95 ${selectedCard === 'Total' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' : 'bg-white dark:bg-gray-800 border-transparent dark:border-gray-700 hover:border-emerald-100 dark:hover:border-emerald-900/30'}`}
          >
              <div className="flex items-center space-x-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 flex items-center justify-center">
                      <TrendingUp size={16} />
                  </div>
                  <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Total Income</span>
              </div>
              <p className="text-xl font-black text-gray-900 dark:text-white">฿{Math.floor(animatedEarned ?? 0).toLocaleString()}</p>
              <p className={`text-[9px] mt-1 font-bold uppercase tracking-tighter ${yearlyChangePercent >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {yearlyChangePercent >= 0 ? '+' : ''}{yearlyChangePercent.toFixed(1)}% from last year
              </p>
          </div>

          {/* Withdrawable */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-3xl shadow-sm border border-transparent dark:border-gray-700 hover:border-blue-100 dark:hover:border-blue-900/30 transition-all">
              <div className="flex items-center space-x-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 text-synergy-blue flex items-center justify-center">
                      <Wallet size={16} />
                  </div>
                  <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Withdrawal</span>
              </div>
              <p className="text-xl font-black text-synergy-blue">฿{Math.floor(animatedWallet ?? 0).toLocaleString()}</p>
              <p className="text-[9px] text-gray-400 mt-1 font-bold uppercase tracking-tighter">Available Balance</p>
          </div>
      </div>

      {/* Detail View (Rendered above Withdraw button) */}
      {detailCardInfo && (
        <div className="mb-6 animate-in slide-in-from-top-4 duration-300">
          <div className="bg-white dark:bg-gray-800 rounded-[32px] p-6 shadow-soft border border-gray-100 dark:border-gray-700 relative overflow-hidden">
            <button 
              onClick={() => setSelectedCard(null)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
            >
              <X size={16} />
            </button>

            <div className="flex items-center space-x-3 mb-6">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${detailCardInfo.colorClass}`}>
                {detailCardInfo.icon}
              </div>
              <div>
                <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">{detailCardInfo.title}</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Revenue Performance</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Current Period</p>
                <p className="text-lg font-black text-gray-900 dark:text-white">฿{Math.floor(detailCardInfo.current).toLocaleString()}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Previous Period</p>
                <p className="text-lg font-black text-gray-400">฿{Math.floor(detailCardInfo.previous).toLocaleString()}</p>
              </div>
            </div>

            <RevenueChart data={getRevenueChartData} color={detailCardInfo.chartColor} />
            
            <div className="mt-4 flex items-center justify-center space-x-2">
              <div className={`w-2 h-2 rounded-full`} style={{ backgroundColor: detailCardInfo.chartColor }}></div>
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Revenue Candlestick View</span>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Button */}
      <div className="mb-8">
          <button 
            onClick={() => triggerPinGate('/withdraw')} 
            className="w-full bg-emerald-500 text-white py-4 rounded-full font-black uppercase tracking-widest shadow-glow active:scale-[0.98] transition-all flex items-center justify-center space-x-2"
          >
              <CreditCard size={18} />
              <span>Withdraw Funds</span>
          </button>
      </div>

      {/* Categories Filter */}
      <div className="flex space-x-2 overflow-x-auto no-scrollbar mb-5 px-1 py-1">
          {['All', 'Direct', 'Team', 'Withdrawal'].map((type) => (
              <button 
                key={type} 
                onClick={() => setActiveFilter(type as any)} 
                className={`px-4 py-2 rounded-full text-[9px] font-black uppercase whitespace-nowrap transition-all duration-300 ${activeFilter === type ? 'bg-synergy-blue text-white shadow-md scale-105' : 'bg-white dark:bg-gray-800 text-gray-400 border border-gray-100 dark:border-gray-700 hover:border-gray-200'}`}
              >
                  {type}
              </button>
          ))}
      </div>
      
      <div className="space-y-3">
        {paginatedCommissions.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-[24px] border border-dashed border-gray-200 dark:border-gray-700">
                <div className="w-14 h-14 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-300"><Wallet size={22} /></div>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-wide">No activity found</p>
            </div>
        ) : (
            <>
              {paginatedCommissions.map((tx, index) => (
                <div 
                    key={tx.id} 
                    onClick={() => {
                        if (tx.type === 'Withdrawal') {
                            navigate('/withdraw', { state: { transaction: tx } });
                        } else {
                            setSelectedTx(tx);
                            setViewMode('detail');
                        }
                    }}
                    className={`bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm flex items-center justify-between animate-in slide-in-from-bottom-2 border border-transparent dark:border-gray-700 transition-all cursor-pointer active:scale-[0.98] ${tx.type === 'Withdrawal' ? 'hover:border-red-100 dark:hover:border-red-900/30' : 'hover:border-synergy-blue/30'}`}
                    style={{ animationDelay: `${index * 50}ms` }}
                >
                    <div className="flex items-center space-x-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-sm border border-gray-50 dark:border-gray-700 ${tx.type === 'Direct' ? 'bg-blue-50 text-synergy-blue' : tx.type === 'Withdrawal' ? 'bg-red-50 text-red-500' : tx.type === 'Refund' ? 'bg-orange-50 text-orange-500' : 'bg-purple-50 text-purple-500'}`}>
                            {tx.type === 'Direct' ? <ShoppingBag size={20} /> : tx.type === 'Withdrawal' ? <ArrowUpRight size={20} /> : tx.type === 'Refund' ? <RotateCcw size={20} /> : <Users size={20} />}
                        </div>
                        <div className="min-w-0">
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[150px]">
                                {tx.type === 'Withdrawal' 
                                    ? tx.source.split('|')[0].replace('Withdrawal:', '').trim() 
                                    : (tx.type === 'Refund' || tx.status === 'Cancelled')
                                    ? 'Return Products'
                                    : (tx.type === 'Direct' ? t('commission.sales_income') : t('commission.team_income'))}
                            </h4>
                            <div className="flex items-center space-x-1.5 mt-1">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${tx.status === 'Paid' || tx.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : (tx.status === 'Pending' || tx.status === 'Waiting') ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                                    {tx.status}
                                </span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${tx.type === 'Direct' ? 'bg-blue-50 dark:bg-blue-900/30 text-synergy-blue' : tx.type === 'Withdrawal' ? 'bg-red-50 dark:bg-red-900/30 text-red-500' : tx.type === 'Refund' ? 'bg-orange-50 dark:bg-orange-900/30 text-orange-500' : 'bg-purple-50 dark:bg-purple-900/30 text-purple-500'}`}>
                                    {tx.type}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className={`text-sm font-bold ${(tx.type === 'Refund' || tx.status === 'Cancelled' || tx.type === 'Withdrawal') ? 'text-red-500' : (tx.status === 'Pending' ? 'text-gray-400' : 'text-emerald-500')}`}>
                            {(tx.type === 'Refund' || tx.status === 'Cancelled' || tx.type === 'Withdrawal') ? '-' : '+'}฿{Math.floor(Math.abs(tx.amount ?? 0)).toLocaleString()}
                        </p>
                        <p className="text-[10px] text-gray-400 font-medium">{tx.date}</p>
                    </div>
                </div>
              ))}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 pb-2">
                  <button 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className={`flex items-center space-x-1 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${currentPage === 1 ? 'text-gray-300 dark:text-gray-700' : 'text-synergy-blue bg-blue-50 dark:bg-blue-900/20 active:scale-95'}`}
                  >
                    <ChevronLeft size={14} />
                    <span>Prev</span>
                  </button>
                  
                  <div className="flex items-center space-x-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <span>{(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, sortedCommissions.length)}, {sortedCommissions.length}</span>
                  </div>

                  <button 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className={`flex items-center space-x-1 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${currentPage === totalPages ? 'text-gray-300 dark:text-gray-700' : 'text-synergy-blue bg-blue-50 dark:bg-blue-900/20 active:scale-95'}`}
                  >
                    <span>Next</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </>
        )}
      </div>
    </div>
  );
};