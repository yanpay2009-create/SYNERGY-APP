import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ArrowLeft, 
  Users, 
  TrendingUp, 
  UserCheck, 
  Phone, 
  MessageCircle, 
  Mail,
  Hash,
  Copy, 
  Check, 
  Crown, 
  Zap, 
  Star, 
  Sparkles, 
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Filter
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UserTier, TeamMember } from '../types';
import { formatThailandDate } from '../utils/dateUtils';

export const MyTeam: React.FC = () => {
  const { team, user, t } = useApp();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'All Members' | 'Direct' | 'Indirect'>('All Members');
  const [tierFilter, setTierFilter] = useState<UserTier | 'All'>('All');
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Animation States
  const [animatedMembers, setAnimatedMembers] = useState(0);
  const [animatedSales, setAnimatedSales] = useState(0);

  // Filter & Sort Logic
  const filteredTeam = useMemo(() => {
    let result = activeTab === 'All Members' 
      ? team 
      : team.filter(member => member.relationship === activeTab);

    if (tierFilter !== 'All') {
      result = result.filter(member => member.tier === tierFilter);
    }

    // Sort by newest first
    return [...result].sort((a, b) => new Date(b.joinedDate).getTime() - new Date(a.joinedDate).getTime());
  }, [team, activeTab, tierFilter]);

  // Actual Stats
  const actualTotalMembers = filteredTeam.length;
  
  const getMemberIncome = (member: TeamMember) => {
    return member.accumulatedIncome || 0;
  };

  const actualTotalIncome = filteredTeam.reduce((acc, m) => acc + getMemberIncome(m), 0);

  // Pagination Logic
  const totalPages = Math.ceil(filteredTeam.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredTeam.length);
  const currentMembers = filteredTeam.slice(startIndex, startIndex + itemsPerPage);

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push('...');
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }
    return pages;
  };

  // Animation effect
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, tierFilter]);

  useEffect(() => {
    const duration = 1000;
    const frameRate = 60;
    const totalFrames = Math.round(duration / (1000 / frameRate));
    
    let frame = 0;
    const timer = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      setAnimatedMembers(actualTotalMembers * easeOut);
      setAnimatedSales(actualTotalIncome * easeOut);
      
      if (frame === totalFrames) {
        clearInterval(timer);
      }
    }, 1000 / frameRate);

    return () => clearInterval(timer);
  }, [actualTotalMembers, actualTotalIncome, activeTab]);

  const getTierColor = (tier: UserTier) => {
    switch (tier) {
      case UserTier.EXECUTIVE: return 'text-amber-600 bg-amber-50 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/30';
      case UserTier.BUILDER: return 'text-purple-600 bg-purple-50 border-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-900/30';
      case UserTier.MARKETER: return 'text-pink-600 bg-pink-50 border-pink-100 dark:bg-pink-900/20 dark:text-pink-400 dark:border-pink-900/30';
      default: return 'text-gray-600 bg-gray-50 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'; // Starter
    }
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  if (selectedMember) {
    return (
      <div className="pb-10 pt-8 px-4 max-w-md mx-auto min-h-screen bg-gray-50 animate-in slide-in-from-right duration-300">
        <div className="flex items-center mb-6">
          <button onClick={() => setSelectedMember(null)} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold ml-2">Member Details</h1>
        </div>

        <div className="bg-white rounded-[32px] p-8 shadow-2xl dark:shadow-none text-center relative overflow-hidden mb-6 animate-in zoom-in-95 duration-300">
           <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-blue-50 to-transparent z-0"></div>
           <div className="relative z-10">
              <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-synergy-blue to-purple-500 mx-auto mb-4 shadow-lg">
                  <img src={selectedMember.avatar || undefined} alt={selectedMember.name} className="w-full h-full rounded-full object-cover border-2 border-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">{selectedMember.name}</h2>
              <div className="inline-block px-3 py-1 bg-blue-50 text-synergy-blue rounded-full text-xs font-bold border border-blue-100 mb-6">
                  {selectedMember.tier} Affiliate
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => selectedMember.phone && window.open(`tel:${selectedMember.phone}`)} className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-2xl hover:bg-green-50 hover:text-green-600 transition group">
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-2xl dark:shadow-none text-gray-600 group-hover:text-green-600 mb-2"><Phone size={20} /></div>
                      <span className="text-xs font-bold">Call Member</span>
                  </button>
                  <button className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-2xl hover:bg-green-50 hover:text-green-600 transition group">
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-2xl dark:shadow-none text-gray-600 group-hover:text-green-600 mb-2"><MessageCircle size={20} /></div>
                      <span className="text-xs font-bold">Line Chat</span>
                  </button>
              </div>
           </div>
        </div>

        <h3 className="text-sm font-bold text-gray-500 uppercase ml-2 mb-3 tracking-wide">Account Details</h3>
        <div className="space-y-3">
            <div className="bg-white p-4 rounded-2xl shadow-2xl dark:shadow-none flex items-center justify-between">
                <div className="flex items-center space-x-3 overflow-hidden">
                    <div className="w-10 h-10 bg-blue-50 text-synergy-blue rounded-xl flex items-center justify-center shrink-0"><span className="text-xs font-bold">ID</span></div>
                    <div className="min-w-0">
                        <p className="text-[10px] text-gray-400 uppercase font-bold">Member ID</p>
                        <p className="text-sm font-bold text-gray-900 truncate">{selectedMember.referralCode || selectedMember.id}</p>
                    </div>
                </div>
                <button onClick={() => handleCopy(String(selectedMember.referralCode || selectedMember.id), 'id')} className="p-2 text-gray-400 hover:text-synergy-blue">{copied === 'id' ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}</button>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-2xl dark:shadow-none flex items-center justify-between">
                <div className="flex items-center space-x-3 overflow-hidden">
                    <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center shrink-0"><MessageCircle size={20} /></div>
                    <div className="min-w-0">
                        <p className="text-[10px] text-gray-400 uppercase font-bold">Line ID</p>
                        <p className="text-sm font-bold text-gray-900 truncate">{selectedMember.lineId || 'N/A'}</p>
                    </div>
                </div>
                <button onClick={() => selectedMember.lineId && handleCopy(selectedMember.lineId, 'line')} className="p-2 text-gray-400 hover:text-synergy-blue">{copied === 'line' ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}</button>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-2xl dark:shadow-none flex items-center justify-between">
                <div className="flex items-center space-x-3 overflow-hidden">
                    <div className="w-10 h-10 bg-gray-100 text-gray-600 rounded-xl flex items-center justify-center shrink-0"><Phone size={20} /></div>
                    <div className="min-w-0">
                        <p className="text-[10px] text-gray-400 uppercase font-bold">Phone Number</p>
                        <p className="text-sm font-bold text-gray-900 truncate">{selectedMember.phone || 'N/A'}</p>
                    </div>
                </div>
                <button onClick={() => selectedMember.phone && handleCopy(selectedMember.phone, 'phone')} className="p-2 text-gray-400 hover:text-synergy-blue">{copied === 'phone' ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}</button>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-2xl dark:shadow-none flex items-center justify-between">
                <div className="flex items-center space-x-3 overflow-hidden">
                    <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center shrink-0"><Hash size={20} /></div>
                    <div className="min-w-0">
                        <p className="text-[10px] text-gray-400 uppercase font-bold">Joined Date</p>
                        <p className="text-sm font-bold text-gray-900 truncate">{selectedMember.joinedDate}</p>
                    </div>
                </div>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-10 pt-0 px-4 max-w-md mx-auto min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="sticky top-0 z-[100] bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100/50 dark:border-gray-800/50 -mx-4 px-4 py-3 mb-6 transition-all shadow-2xl dark:shadow-none">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition">
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-xl font-bold ml-2 text-gray-900 dark:text-white tracking-tight">My Team</h1>
          </div>
          <button onClick={() => navigate('/referrer-info')} className="p-2.5 bg-white dark:bg-gray-800 text-synergy-blue rounded-full shadow-sm hover:bg-blue-50 dark:hover:bg-blue-900/30 transition border border-blue-100 dark:border-gray-700" title="Check Referrer">
            <UserCheck size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-2xl dark:shadow-none transition-all duration-300 border border-transparent dark:border-gray-700 hover:border-blue-100 dark:hover:border-blue-900/30">
            <div className="flex items-center space-x-2 mb-2 text-gray-500">
                <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 text-synergy-blue flex items-center justify-center"><Users size={16} /></div>
                <span className="text-xs font-bold uppercase">Members</span>
            </div>
            <p className="text-2xl font-black text-gray-900 dark:text-white">{Math.floor(animatedMembers)}</p>
            <p className="text-[10px] text-gray-400 mt-1">{activeTab === 'All Members' ? 'Total Network' : activeTab}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-2xl dark:shadow-none transition-all duration-300 border border-transparent dark:border-gray-700 hover:border-green-100 dark:hover:border-emerald-900/30">
            <div className="flex items-center space-x-2 mb-2 text-gray-500">
                <div className="w-8 h-8 rounded-full bg-green-50 dark:bg-emerald-900/30 text-green-500 flex items-center justify-center"><TrendingUp size={16} /></div>
                <span className="text-xs font-bold uppercase">Income</span>
            </div>
            <p className="text-2xl font-black text-gray-900 dark:text-white">฿{Math.floor(animatedSales ?? 0).toLocaleString()}</p>
            <p className="text-[10px] text-gray-400 mt-1">Total Income</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-1 rounded-full shadow-2xl dark:shadow-none mb-4 flex border border-transparent dark:border-gray-700">
        {['All Members', 'Direct', 'Indirect'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 py-2.5 rounded-full text-xs font-bold transition duration-200 ${activeTab === tab ? 'bg-synergy-blue text-white shadow-2xl dark:shadow-none' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
                {tab === 'All Members' ? 'All' : tab}
            </button>
        ))}
      </div>

      <div className="flex justify-start mb-2 px-1">
        <div className="relative flex items-center">
          <div className="absolute left-0 pointer-events-none text-synergy-blue">
            <Filter size={12} />
          </div>
          <select 
            value={tierFilter} 
            onChange={(e) => setTierFilter(e.target.value as any)}
            className="appearance-none bg-transparent text-[10px] font-black uppercase tracking-widest text-synergy-blue py-2 pl-5 focus:outline-none cursor-pointer"
          >
            <option value="All" className="dark:bg-gray-800">All Tiers</option>
            {Object.values(UserTier).map(tier => (
              <option key={tier} value={tier} className="dark:bg-gray-800">{tier}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {filteredTeam.length === 0 ? (
             <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
                 <div className="w-16 h-16 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-300"><Users size={30} /></div>
                 <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">No Team Members</p>
                 <p className="text-[10px] text-gray-300 mt-1 px-8">Share your referral link to start building your network!</p>
             </div>
        ) : (
            <>
                {currentMembers.map((member, index) => (
                    <div key={member.id} onClick={() => setSelectedMember(member)} className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-2xl dark:shadow-none flex items-center justify-between animate-in slide-in-from-bottom-2 border border-transparent dark:border-gray-700 hover:border-synergy-blue/30 active:scale-[0.98] cursor-pointer transition" style={{ animationDelay: `${index * 50}ms` }}>
                        <div className="flex items-center space-x-3">
                            <div className="relative">
                                <img src={member.avatar || undefined} alt={member.name} className="w-12 h-12 rounded-full object-cover border border-gray-100 dark:border-gray-700" />
                                <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-800 rounded-full p-0.5">
                                    <span className={`flex items-center justify-center w-4 h-4 rounded-full text-[8px] font-bold text-white ${member.tier === UserTier.EXECUTIVE ? 'bg-amber-500' : member.tier === UserTier.BUILDER ? 'bg-purple-500' : member.tier === UserTier.MARKETER ? 'bg-pink-500' : 'bg-gray-400'}`}>{member.tier[0]}</span>
                                </div>
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white">{member.name}</h4>
                                <div className="flex items-center space-x-1.5 mt-1">
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getTierColor(member.tier)} font-bold`}>{member.tier}</span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${member.relationship === 'Direct' ? 'bg-blue-50 dark:bg-blue-900/30 text-synergy-blue' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>{member.relationship}</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                                ฿{Math.floor(getMemberIncome(member)).toLocaleString()}
                            </p>
                            <p className="text-[10px] text-gray-400 font-medium">{member.joinedDate}</p>
                        </div>
                    </div>
                ))}

                {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-8 px-2">
                        <p className="text-[10px] font-bold text-gray-400">
                            (Showing {startIndex + 1}- {endIndex} of {filteredTeam.length} Member's)
                        </p>
                        <div className="flex items-center space-x-1">
                            <button 
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="p-1 text-gray-400 hover:text-synergy-blue disabled:opacity-30 transition-colors"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            
                            {getPageNumbers().map((page, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => typeof page === 'number' && setCurrentPage(page)}
                                    disabled={page === '...'}
                                    className={`w-6 h-6 rounded-md text-[10px] font-bold transition-all ${
                                        currentPage === page 
                                            ? 'bg-synergy-blue text-white shadow-sm' 
                                            : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                                >
                                    {page}
                                </button>
                            ))}

                            <button 
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="p-1 text-gray-400 hover:text-synergy-blue disabled:opacity-30 transition-colors"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </>
        )}
      </div>
    </div>
  );
};