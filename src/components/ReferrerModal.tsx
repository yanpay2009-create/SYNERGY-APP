import React, { useState, useEffect } from 'react';
import { UserPlus, Search, Scan, X, Facebook, Youtube, Music2, Globe, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Referrer, UserTier } from '../types';
import { QRScanner } from './QRScanner';

interface ReferrerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  description?: string;
}

export const ReferrerModal: React.FC<ReferrerModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess,
  title = "Referrer Required",
  description = "To proceed with this action, you must link your account to a referrer."
}) => {
  const { addReferrer, searchReferrer, setInfluencerReferrerCode } = useApp();
  const [referrerCode, setReferrerCode] = useState('');
  const [referrerError, setReferrerError] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [foundReferrer, setFoundReferrer] = useState<Referrer | null>(null);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const delayDebounceFn = setTimeout(async () => {
      if (referrerCode.length >= 3) {
        setIsSearching(true);
        const result = await searchReferrer(referrerCode);
        if (isMounted) {
          setFoundReferrer(result);
          setIsSearching(false);
        }
      } else {
        if (isMounted) setFoundReferrer(null);
      }
    }, 500);

    return () => {
      isMounted = false;
      clearTimeout(delayDebounceFn);
    };
  }, [referrerCode]); // Only depend on code

  const handleAddReferrer = async () => {
    if (!referrerCode) return;
    if (!selectedSource) {
      setReferrerError("Please select how you know this referrer");
      return;
    }
    
    const result = await addReferrer(referrerCode);
    if (result.success) {
      setInfluencerReferrerCode(null);
      onSuccess();
      onClose();
      setReferrerError('');
    } else {
      setReferrerError(result.error || "Invalid Referrer Code.");
    }
  };

  const handleScan = (decodedText: string) => {
    let code = decodedText;
    if (decodedText.includes('/ref/')) {
        code = decodedText.split('/ref/').pop() || decodedText;
    }
    setReferrerCode(code.toUpperCase());
    setShowScanner(false);
  };

  if (!isOpen) return null;

  const sources = [
    { id: 'facebook', icon: Facebook, label: 'Facebook', color: 'text-blue-600' },
    { id: 'tiktok', icon: Music2, label: 'TikTok', color: 'text-pink-500' },
    { id: 'youtube', icon: Youtube, label: 'YouTube', color: 'text-red-600' },
    { id: 'others', icon: Globe, label: 'Others', color: 'text-gray-500' },
  ];

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center px-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-500" onClick={onClose}></div>
      <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-[40px] p-8 shadow-2xl relative z-10 animate-in zoom-in-95 border border-white/10 overflow-hidden">
        
        {/* Decorative Background */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-blue-50/50 dark:from-blue-900/10 to-transparent pointer-events-none"></div>

        <div className="text-center relative z-10">
          {/* Dynamic Profile Header */}
          <div className="mb-6">
            {foundReferrer ? (
              <div className="animate-in zoom-in-50 duration-300">
                <div className="relative inline-block">
                  <img 
                    src={foundReferrer.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(foundReferrer.name)}&background=random`} 
                    className="w-24 h-24 rounded-full border-4 border-white dark:border-gray-700 shadow-xl object-cover mx-auto"
                    alt={foundReferrer.name}
                  />
                  <div className="absolute -bottom-1 -right-1 bg-green-500 text-white p-1.5 rounded-full border-2 border-white dark:border-gray-800 shadow-sm">
                    <CheckCircle2 size={16} />
                  </div>
                </div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white mt-4">{foundReferrer.name}</h3>
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-synergy-blue/10 text-synergy-blue text-[10px] font-black uppercase tracking-widest mt-1 border border-synergy-blue/20">
                  {foundReferrer.tier}
                </div>
              </div>
            ) : (
              <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 text-synergy-blue rounded-full flex items-center justify-center mx-auto shadow-sm border border-blue-100 dark:border-blue-800 transition-all duration-300">
                {isSearching ? (
                  <div className="w-10 h-10 border-4 border-synergy-blue border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <UserPlus size={40} />
                )}
              </div>
            )}
          </div>

          {!foundReferrer && (
            <>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">{title}</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-8 leading-relaxed font-medium">
                {description}
              </p>
            </>
          )}

          {/* Rounded Input Field */}
          <div className="mb-6 relative">
            <input 
              value={referrerCode} 
              onChange={(e) => { setReferrerCode(e.target.value.toUpperCase()); setReferrerError(''); }} 
              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-full py-4 px-6 text-center font-black text-xl uppercase tracking-[0.2em] text-synergy-blue focus:outline-none focus:ring-2 focus:ring-synergy-blue/30 shadow-inner transition-all" 
              placeholder="ENTER CODE"
            />
            {referrerError && <p className="text-red-500 text-[10px] mt-2 font-bold uppercase tracking-wide animate-shake">{referrerError}</p>}
          </div>

          {/* Source Selection */}
          <div className="mb-8">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">How do you know them?</p>
            <div className="flex items-center justify-center space-x-6">
              {sources.map((source) => (
                <button
                  key={source.id}
                  onClick={() => { setSelectedSource(source.id); setReferrerError(''); }}
                  className={`flex flex-col items-center group transition-all duration-300 ${
                    selectedSource === source.id 
                      ? 'scale-110' 
                      : 'opacity-40 grayscale hover:opacity-100 hover:grayscale-0'
                  }`}
                >
                  <div className={`p-3 rounded-full mb-1.5 transition-all ${selectedSource === source.id ? 'bg-white dark:bg-gray-700 shadow-md ring-2 ring-synergy-blue/20' : ''}`}>
                    {(() => {
                      const Icon = source.icon;
                      return <Icon size={22} className={source.color} />;
                    })()}
                  </div>
                  <span className={`text-[8px] font-black uppercase tracking-tighter ${selectedSource === source.id ? 'text-synergy-blue' : 'text-gray-400'}`}>{source.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col space-y-3">
            <button 
              onClick={handleAddReferrer} 
              disabled={!referrerCode || isSearching} 
              className={`w-full font-black py-4 rounded-full shadow-glow active:scale-95 transition flex items-center justify-center space-x-2 h-14 ${
                referrerCode && !isSearching 
                  ? 'bg-synergy-blue text-white' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Search size={20} />
              <span className="uppercase tracking-widest text-xs">Link & Proceed</span>
            </button>
          </div>
        </div>
      </div>

      {showScanner && (
        <QRScanner onScan={handleScan} onClose={() => setShowScanner(false)} />
      )}
    </div>
  );
};
