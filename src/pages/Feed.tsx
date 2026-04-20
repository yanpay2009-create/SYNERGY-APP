import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { ShoppingBag, Share2, Copy, Heart, MessageCircle, Send, X, Check, Clock, ChevronUp, Sparkles, Play, ShieldCheck, UserPlus, Search, Scan, Plus, User, ArrowRight, Volume2, VolumeX, Maximize2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FeedItem } from '../types';
import { CountdownTimer } from '../components/CountdownTimer';
import { QRScanner } from '../components/QRScanner';
import { ReferrerModal } from '../components/ReferrerModal';
import { formatThailandDate, getThailandNow } from '../utils/dateUtils';

export const Feed: React.FC = () => {
  const { feed, ads, toggleFeedLike, addFeedComment, user, referrer, addReferrer, setBottomNavHidden, products, addToCart, isLoggedIn, showToast } = useApp();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'Trending' | 'For You'>('For You');
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle scroll to show/hide tabs
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleExpire = useCallback(() => {
    setCurrentTime(Date.now());
  }, []);

  // Update current time every minute to refresh promotion filtering
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setCurrentTime(prev => {
        if (Math.floor(now / 60000) !== Math.floor(prev / 60000)) {
          return now;
        }
        return prev;
      });
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const [showComments, setShowComments] = useState<number | null>(null);
  const [commentInput, setCommentInput] = useState('');
  const [isExpandedComments, setIsExpandedComments] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  
  // State to track which post IDs have expanded captions
  const [expandedPostIds, setExpandedPostIds] = useState<Set<number>>(new Set());

  // Ensure navigation is visible when feed mounts
  useEffect(() => {
    setBottomNavHidden(false);
  }, [setBottomNavHidden]);

  // Referrer Modal for Feed
  const [showReferrerModal, setShowReferrerModal] = useState(false);

  // Users see all 'Approved' posts + their own 'Pending' posts
  const visibleFeed = feed.filter(f => f.status === 'Approved' || f.userId === user?.email);
  const filteredFeed = activeTab === 'For You' ? visibleFeed : visibleFeed.filter(f => f.category === 'Trending');
  
  const checkReferrerAction = (action: () => void) => {
    if (!referrer) {
      setShowReferrerModal(true);
      return;
    }
    action();
  };

  const handleShare = async (post: FeedItem) => {
    if (!isLoggedIn || !user) {
        navigate('/account');
        return;
    }

    checkReferrerAction(async () => {
        const affiliateLink = `${window.location.origin}/#/post/${post.id}?ref=${user?.referralCode || 'USER'}`;
        const shareText = `${post.caption}\n\nShop Now: ${affiliateLink} #SynergyFlow`;

        if (navigator.share) {
            try {
                await navigator.share({ title: `Promote: ${post.user}'s Post`, text: shareText, url: affiliateLink });
            } catch (error) { console.log('Share canceled'); }
        } else {
            try {
                await navigator.clipboard.writeText(shareText);
                showToast({ message: "Promote link and caption copied to clipboard!", type: 'success' });
            } catch (err) { showToast({ message: "Could not copy text.", type: 'error' }); }
        }
    });
  };

  const handleCopyCaption = (id: number, text: string) => {
    checkReferrerAction(() => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleCommentClick = (id: number) => {
    if (!isLoggedIn || !user) {
        navigate('/account');
        return;
    }
    openComments(id);
  };

  const handleLike = (id: number) => {
    if (!isLoggedIn || !user) {
        navigate('/account');
        return;
    }
    toggleFeedLike(id);
  };

  const handleProductAction = (post: FeedItem) => {
    if (post.productId) {
      const product = products.find(p => p.id === post.productId);
      if (product) {
        addToCart(product, 1);
        showToast({
          type: 'success',
          title: 'Added to Cart',
          message: `${product.name} has been added to your basket.`
        });
      } else {
        navigate('/shop');
      }
    } else {
      navigate('/shop');
    }
  };

  const submitComment = (e: React.FormEvent) => {
      e.preventDefault();
      if (!isLoggedIn || !user) {
          navigate('/account');
          return;
      }
      if (!commentInput.trim() || showComments === null) return;
      addFeedComment(showComments, commentInput);
      setCommentInput('');
  };

  const openComments = (id: number) => {
      setShowComments(id);
      setIsExpandedComments(true);
  };

  const toggleCaption = (id: number) => {
    setExpandedPostIds(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
    });
  };

  const activePostForComments = feed.find(f => f.id === showComments);

  return (
    <>
    <div className="h-screen w-full max-w-md mx-auto relative bg-black transition-colors duration-300">
      
      {/* Top Header Bar (Floating Tabs) */}
      <div className={`fixed top-0 left-0 right-0 z-[100] px-4 pt-10 pb-4 pointer-events-none transition-all duration-500`}>
        <div className="max-w-md mx-auto flex items-center justify-center">
          <div className="flex space-x-1 p-1 rounded-full bg-black/20 backdrop-blur-md border border-white/10 shadow-lg pointer-events-auto">
            <button 
                onClick={() => setActiveTab('Trending')} 
                className={`text-[8px] px-3 py-1.5 rounded-full font-black uppercase tracking-wider transition-all duration-300 ${
                    activeTab === 'Trending' 
                        ? 'bg-white text-black shadow-xl' 
                        : 'text-white/60 hover:text-white'
                }`}
            >
                Trending
            </button>
            <button 
                onClick={() => setActiveTab('For You')} 
                className={`text-[8px] px-3 py-1.5 rounded-full font-black uppercase tracking-wider transition-all duration-300 ${
                    activeTab === 'For You' 
                        ? 'bg-white text-black shadow-xl' 
                        : 'text-white/60 hover:text-white'
                }`}
            >
                For You
            </button>
          </div>
        </div>
      </div>

      {/* Main Full-Screen Snap Container */}
      <div className="h-full w-full overflow-y-scroll snap-y snap-mandatory no-scrollbar bg-black">
        {filteredFeed.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 px-10 text-center">
                <Sparkles size={60} className="mb-4 opacity-20" />
                <p className="text-sm font-bold">No posts in your feed yet.</p>
                <p className="text-xs mt-2 opacity-60">Be the first to share something amazing with the community!</p>
            </div>
        ) : (
            filteredFeed.map(post => {
              const isLong = post.caption.length > 25;
              const isExpanded = expandedPostIds.has(post.id);
              const displayCaption = isLong && !isExpanded 
                ? `${post.caption.substring(0, 25)}...` 
                : post.caption;

              return (
                <div key={post.id} className="h-full w-full relative snap-start flex items-center justify-center overflow-hidden bg-black">
                  
                  {/* Background Blurred Placeholder for Horizontal Content */}
                  <div className="absolute inset-0 z-0 opacity-30 blur-3xl scale-110 pointer-events-none">
                    {post.content && (
                      <img src={post.content} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    )}
                  </div>

                  {/* Actual Media Content (Centered, Actual size via contain) */}
                  <div className="relative z-10 w-full h-full flex items-center justify-center px-0">
                    {post.type === 'video' ? (
                        <video 
                          src={post.content} 
                          className="w-full max-h-full object-contain" 
                          loop 
                          muted 
                          autoPlay 
                          playsInline 
                        />
                    ) : (
                        <img 
                          src={post.content || undefined} 
                          alt="Post" 
                          className="w-full max-h-full object-contain" 
                        />
                    )}

                    {/* Pending Status Badge */}
                    {post.status === 'Pending' && (
                        <div className="absolute top-24 left-4 z-20 bg-yellow-400 backdrop-blur-md rounded-full px-3 py-1 text-black text-[9px] font-black uppercase flex items-center space-x-1 shadow-lg border border-black/10">
                            <Clock size={10} />
                            <span>Reviewing</span>
                        </div>
                    )}
                  </div>
                  
                  {/* Right Side Vertical Actions (Floating) */}
                  <div className="absolute right-4 bottom-28 flex flex-col items-center space-y-4 z-30">
                     <button 
                        onClick={() => handleLike(post.id)} 
                        className="flex flex-col items-center group transition active:scale-90"
                     >
                        <Heart size={28} className={(post.likedBy || []).includes(user?.uid || '') ? "fill-red-500 text-red-500 scale-110" : "text-white drop-shadow-lg"} />
                        <span className="text-[10px] mt-1 font-bold text-white drop-shadow-md">{post.likes}</span>
                     </button>

                     <button 
                        onClick={() => handleCommentClick(post.id)} 
                        className="flex flex-col items-center group transition active:scale-90"
                     >
                        <MessageCircle size={28} className="text-white drop-shadow-lg" />
                        <span className="text-[10px] mt-1 font-bold text-white drop-shadow-md">{post.comments.length}</span>
                     </button>

                     <button 
                        onClick={() => handleShare(post)} 
                        disabled={post.status === 'Pending'}
                        className={`flex flex-col items-center group transition active:scale-90 ${post.status === 'Pending' ? 'opacity-50 cursor-not-allowed' : ''}`}
                     >
                        <Share2 size={28} className="text-white drop-shadow-lg" />
                        <span className="text-[10px] mt-1 font-bold text-white drop-shadow-md">Share</span>
                     </button>

                     <button 
                        onClick={() => handleProductAction(post)} 
                        className="flex flex-col items-center group transition active:scale-90"
                     >
                        <ShoppingBag size={28} className="text-white drop-shadow-lg" />
                        <span className="text-[10px] mt-1 font-bold text-white drop-shadow-md">Shop</span>
                     </button>
                  </div>
                  
                  {/* Bottom Information Overlay (Text directly on content) */}
                  <div className="absolute bottom-0 left-0 right-0 p-8 pb-20 z-20 pointer-events-none">
                    <div className="pointer-events-auto transform transition-transform duration-500">
                      <div className="flex items-center space-x-3 mb-3 drop-shadow-lg">
                         <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-white/50 bg-gray-900 flex-shrink-0 shadow-xl">
                            <img 
                                src={post.avatar || "https://picsum.photos/seed/user/100/100"} 
                                alt={post.user} 
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                            />
                         </div>
                         <div className="drop-shadow-md">
                            <div className="text-sm font-bold text-white tracking-wide">@{post.user}</div>
                            <div className="text-[9px] text-white/70 font-semibold uppercase tracking-tighter mt-0.5">Synergy Flow Affiliate</div>
                         </div>
                      </div>

                      <div className="overflow-hidden drop-shadow-md">
                          <div className="text-xs text-white leading-relaxed font-medium">
                              {displayCaption}
                              {isLong && (
                                  <button 
                                      onClick={() => toggleCaption(post.id)}
                                      className="ml-2 text-white font-black underline decoration-white/50 focus:outline-none"
                                  >
                                      {isExpanded ? 'Hide' : 'More'}
                                  </button>
                              )}
                          </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
        )}
      </div>
    </div>

      {/* REFERRER REQUIRED MODAL */}
      <ReferrerModal 
        isOpen={showReferrerModal} 
        onClose={() => setShowReferrerModal(false)}
        onSuccess={() => {
          // Success logic if needed
        }}
        title="Referrer Required"
        description="To start promoting and earning commissions from the feed, you must link your account to a referrer."
      />

      {/* COMMENTS MODAL */}
      {showComments !== null && activePostForComments && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowComments(null)}></div>
              <div className={`bg-white dark:bg-gray-900 w-full max-w-md rounded-t-[40px] relative animate-in slide-in-from-bottom-full duration-300 flex flex-col transition-all ease-in-out h-[92vh] border-t border-white/10`}>
                  <div className="w-full pt-4 pb-2 flex flex-col items-center justify-center cursor-default touch-none">
                      <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full mb-1"></div>
                  </div>
                  <div className="px-6 flex justify-between items-center mb-2 border-b border-gray-100 dark:border-gray-800 pb-3">
                      <h3 className="text-lg font-black text-gray-900 dark:text-white">Comments ({activePostForComments.comments.length})</h3>
                      <button onClick={() => setShowComments(null)} className="p-1 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><X size={20} className="text-gray-500" /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 mb-4 px-6 pt-4">
                      {activePostForComments.comments.length === 0 ? (
                        <div className="text-center text-gray-400 mt-10 font-bold text-sm">No comments yet. Be the first!</div>
                      ) : (
                        activePostForComments.comments.map(c => (
                            <div key={c.id} className="flex space-x-3 animate-in fade-in slide-in-from-bottom-2">
                                <img src={c.avatar || undefined} className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0 border border-gray-100 dark:border-gray-800" alt="Avatar" />
                                <div className="bg-gray-50 dark:bg-gray-800 p-3.5 rounded-[20px] rounded-tl-none text-sm border border-gray-100 dark:border-gray-700">
                                    <div className="flex items-center space-x-2 mb-1">
                                        <span className="font-black text-gray-900 dark:text-white text-xs">{c.user}</span>
                                        <span className="text-[10px] text-gray-400 font-bold uppercase">{c.date}</span>
                                    </div>
                                    <p className="text-gray-600 dark:text-gray-400 text-xs font-medium leading-relaxed">{c.text}</p>
                                </div>
                            </div>
                        ))
                      )}
                  </div>
                  <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 pb-safe rounded-b-[40px]">
                      <form onSubmit={submitComment} className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-800 p-1.5 rounded-full border border-gray-100 dark:border-gray-700">
                          <input value={commentInput} onChange={(e) => setCommentInput(e.target.value)} placeholder="Add a comment..." className="flex-1 bg-transparent px-4 py-2 text-xs font-bold focus:outline-none dark:text-white" />
                          <button type="submit" disabled={!commentInput.trim()} className="p-2.5 bg-synergy-blue text-white rounded-full disabled:opacity-50 disabled:bg-gray-300 transition shadow-glow"><Send size={16} /></button>
                      </form>
                  </div>
              </div>
          </div>
      )}
    </>
  );
};