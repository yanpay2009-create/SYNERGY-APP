import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Minus, Plus, Trash2, ArrowLeft, MapPin, CreditCard, Ticket, ChevronRight, X, UserPlus, Search, QrCode, Loader2, CheckCircle2, Scan, CreditCard as CardIcon, ShieldCheck, Lock, Check, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import { ShoppingBagIcon } from '../components/ShoppingBagIcon';
import { Link, useNavigate } from 'react-router-dom';
import { UserTier } from '../types';

import { QRScanner } from '../components/QRScanner';
import { ReferrerModal } from '../components/ReferrerModal';

export const Cart: React.FC = () => {
  const { cart, updateCartQuantity, removeFromCart, checkout, addresses, selectedAddressId, paymentMethod, applyCoupon, appliedCoupon, removeCoupon, getCartTotals, referrer, addReferrer, user, savedCards, selectedCardId, t, isLoggedIn, showToast, influencerReferrerCode, setInfluencerReferrerCode } = useApp();
  const navigate = useNavigate();
  const [couponInput, setCouponInput] = useState('');
  
  // Referrer Modal State
  const [showReferrerModal, setShowReferrerModal] = useState(false);
  const [showReferrerAutoConfirm, setShowReferrerAutoConfirm] = useState<'link' | 'change' | null>(null);

  // Payment UI States
  const [showQrModal, setShowQrModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);
  const [confirmStep, setConfirmStep] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const { subtotal, discount, memberDiscount, couponDiscount, vat, total } = getCartTotals(); 

  const selectedAddress = addresses.find(a => a.id === selectedAddressId);
  const selectedPaymentCard = savedCards.find(c => c.id === selectedCardId);

  // Validation Logic
  const isWalletPayment = paymentMethod === 'Wallet';
  const hasInsufficientBalance = isWalletPayment && (user?.walletBalance || 0) < total;
  const isCheckoutDisabled = !selectedAddress || hasInsufficientBalance;
  const isFinalConfirmDisabled = isCheckoutDisabled || !agreedToTerms;

  const handleApplyCoupon = () => {
    if (!couponInput) return;
    const success = applyCoupon(couponInput);
    if (success) {
        setCouponInput('');
        showToast({ message: 'Coupon Applied!', type: 'success' });
    } else {
        showToast({ message: 'Invalid Coupon Code', type: 'error' });
    }
  };

  const handleCheckout = () => {
      if (!isLoggedIn || !user) {
          navigate('/account');
          return;
      }

      // Check for Referral logic
      const isFirstPurchase = user.accumulatedSales === 0;
      
      // If no referrer exists
      if (!referrer) {
          if (influencerReferrerCode) {
              setShowReferrerAutoConfirm('link');
          } else {
              setShowReferrerModal(true);
          }
          return;
      }

      // If already has referrer but first purchase, maybe change to influencer's code
      if (isFirstPurchase && influencerReferrerCode && influencerReferrerCode !== user.referrerCode) {
          setShowReferrerAutoConfirm('change');
          return;
      }
      
      setConfirmStep(true);
  };

  const handleFinalPayment = () => {
      if (isFinalConfirmDisabled) return;

      if (paymentMethod === 'PromptPay') {
          setShowQrModal(true);
          startPaymentVerification();
          return;
      }

      if (paymentMethod === 'CreditCard') {
          if (!selectedPaymentCard) {
              showToast({ message: "Please add and select a credit card first.", type: 'error' });
              navigate('/payment-selection');
              return;
          }
          setShowCardModal(true);
          return;
      }
      
      checkout();
      navigate('/my-orders');
  };

  const startPaymentVerification = () => {
      setIsVerifying(true);
      setTimeout(() => {
          setIsVerifying(false);
          setPaymentDone(true);
          setTimeout(() => {
              checkout();
              setShowQrModal(false);
              navigate('/my-orders');
          }, 2000);
      }, 3500);
  };

  const executeCardPayment = () => {
    setConfirmStep(false);
    setIsVerifying(true);
    // Simulate Card Authorization
    setTimeout(() => {
        setIsVerifying(false);
        setPaymentDone(true);
        setTimeout(() => {
            checkout();
            setShowCardModal(false);
            navigate('/my-orders');
        }, 2000);
    }, 2500);
  };

  const handleToggleTerms = (e: React.MouseEvent) => {
      e.preventDefault();
      if (!agreedToTerms) {
          setShowTermsModal(true);
      } else {
          setAgreedToTerms(false);
      }
  };

  const acceptTerms = () => {
      setAgreedToTerms(true);
      setShowTermsModal(false);
  };

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=PROMPTPAY-SF-ORDER-${total}`;

  return (
    <div className="pb-24 pt-0 px-4 max-w-md mx-auto min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col relative transition-colors duration-300">
      <div className="sticky top-0 z-[100] bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100/50 dark:border-gray-800/50 -mx-4 px-4 py-3 mb-6 transition-all shadow-2xl dark:shadow-none">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button onClick={() => confirmStep ? setConfirmStep(false) : navigate(-1)} className="p-2 -ml-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition">
              <ArrowLeft size={24} strokeWidth={2} />
            </button>
            <h1 className="text-xl font-bold ml-2 text-gray-900 dark:text-white tracking-tight">
                {confirmStep ? 'Confirm Order' : 'Checkout'}
            </h1>
          </div>
        </div>
      </div>

      {cart.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in duration-700">
          <div className="mb-4 text-gray-200 dark:text-gray-700">
            <ShoppingBagIcon size={160} />
          </div>
          <h2 className="text-xl font-medium text-gray-400 dark:text-gray-500 mb-2">{t('cart.empty_title')}</h2>
          <Link to="/home" className="mt-4 text-synergy-blue font-semibold text-sm hover:underline">
            {t('cart.continue_shopping')}
          </Link>
        </div>
      ) : confirmStep ? (
        /* CONFIRMATION STEP VIEW */
        <div className="flex-1 space-y-6 animate-in slide-in-from-right duration-300">
            {/* Order Summary Card (Enhanced UI) */}
            <div className="relative overflow-hidden bg-white dark:bg-slate-900 p-8 rounded-[40px] shadow-2xl dark:shadow-none border border-slate-100 dark:border-slate-800">
                {/* Background Graphics */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
                    <div className="absolute -top-24 -right-20 w-64 h-64 rounded-full bg-gradient-to-br from-synergy-blue/10 to-transparent blur-3xl opacity-50"></div>
                    <div className="absolute -bottom-32 -left-20 w-80 h-80 rounded-full bg-gradient-to-tl from-synergy-blue/5 to-transparent blur-3xl opacity-40"></div>
                    <svg className="absolute inset-0 w-full h-full opacity-[0.03] dark:opacity-[0.07]" preserveAspectRatio="none" viewBox="0 0 400 200">
                        <path d="M0,150 C100,100 200,200 400,100" fill="none" stroke="currentColor" strokeWidth="0.5" />
                        <path d="M0,170 C150,120 250,220 400,140" fill="none" stroke="currentColor" strokeWidth="0.3" />
                    </svg>
                </div>

                <div className="relative z-10">
                    <h3 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-6 flex items-center">
                        <div className="w-8 h-8 rounded-xl bg-synergy-blue/10 flex items-center justify-center mr-3">
                            <ShoppingBagIcon size={16} strokeWidth={2.5} className="text-synergy-blue" />
                        </div>
                        {t('checkout.order_summary') || 'Order Summary'}
                    </h3>

                    <div className="space-y-4 mb-6 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                        {cart.map(item => (
                            <div key={item.id} className="flex justify-between items-center group">
                                <div className="flex items-center space-x-3">
                                    <div className="relative">
                                        <img 
                                            src={item.image || undefined} 
                                            alt={item.name} 
                                            className="w-12 h-12 rounded-md object-cover bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 group-hover:scale-105 transition-transform" 
                                            referrerPolicy="no-referrer"
                                            onClick={() => navigate(`/product/${item.id}`)}
                                        />
                                        <div className="absolute -top-1.5 -right-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-2xl dark:shadow-none">
                                            {item.quantity}
                                        </div>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-gray-800 dark:text-gray-200 line-clamp-1 max-w-[140px]">{item.name}</span>
                                        <span className="text-[9px] text-gray-500 dark:text-gray-400 font-medium">฿{item.price.toLocaleString()} / unit</span>
                                    </div>
                                </div>
                                <span className="text-xs font-black text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900/50 px-3 py-1.5 rounded-xl border border-transparent group-hover:border-gray-100 dark:group-hover:border-gray-700 transition-colors">
                                    ฿{(item.price * item.quantity).toLocaleString()}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="h-px bg-gray-100 dark:bg-gray-700/50 my-6"></div>

                    <div className="space-y-3">
                        <div className="flex justify-between text-xs text-gray-500 font-medium">
                            <span>Subtotal</span>
                            <span className="font-bold text-gray-900 dark:text-gray-100">฿{subtotal.toLocaleString()}</span>
                        </div>
                        {memberDiscount > 0 && (
                            <div className="flex justify-between text-xs text-synergy-blue bg-synergy-blue/5 px-3 py-1.5 rounded-xl border border-synergy-blue/10">
                                <div className="flex items-center">
                                    <Sparkles size={12} className="mr-1.5" />
                                    <span className="font-bold">Member Discount</span>
                                </div>
                                <span className="font-black">-฿{memberDiscount.toLocaleString()}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center pt-4 mt-2 border-t border-gray-100 dark:border-gray-700/50">
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-0.5">Grand Total</span>
                                <span className="text-xs font-bold text-gray-900 dark:text-white">Amount to Settle</span>
                            </div>
                            <span className="text-3xl font-black text-synergy-blue drop-shadow-sm">฿{total.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delivery & Payment Info */}
            <div className="space-y-3">
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xl dark:shadow-none">
                    <div className="flex items-center space-x-2 mb-2 text-slate-400">
                        <MapPin size={14} strokeWidth={2} fill="currentColor" fillOpacity={0.15} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Delivery Address</span>
                    </div>
                    <p className="text-xs font-bold text-slate-800 dark:text-white">{selectedAddress?.name}</p>
                    <p className="text-[11px] text-slate-700 dark:text-slate-300 mt-0.5">{selectedAddress?.address}, {selectedAddress?.city}</p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xl dark:shadow-none">
                    <div className="flex items-center space-x-2 mb-2 text-slate-400">
                        <CreditCard size={14} strokeWidth={2} fill="currentColor" fillOpacity={0.15} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Payment Method</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-800 dark:text-white">
                            {paymentMethod === 'CreditCard' 
                                ? `Card ending ${selectedPaymentCard?.cardNumber.slice(-4)}` 
                                : paymentMethod}
                        </p>
                        {isWalletPayment && (
                            <span className="text-[10px] font-bold text-emerald-500">฿{(user?.walletBalance ?? 0).toLocaleString()}</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Terms and Final Button */}
            <div className="pt-4">
                <div className="mb-6 px-2">
                    <div 
                        onClick={handleToggleTerms}
                        className="flex items-start space-x-3 cursor-pointer group"
                    >
                        <div className="relative flex items-center mt-0.5">
                            <div 
                                className={`h-5 w-5 rounded-md border flex items-center justify-center transition-all ${agreedToTerms ? 'bg-synergy-blue border-synergy-blue text-white' : 'bg-white dark:bg-gray-800 border-gray-400 dark:border-gray-500'}`}
                            >
                                {agreedToTerms && <Check size={14} strokeWidth={4} />}
                            </div>
                        </div>
                        <span className="text-[11px] font-medium text-gray-600 dark:text-gray-300 leading-tight">
                            {t('cart.terms_agree')}
                        </span>
                    </div>
                </div>

                <button 
                    onClick={handleFinalPayment}
                    disabled={isFinalConfirmDisabled}
                    className={`group relative w-full h-16 rounded-full overflow-hidden transition-all duration-300 active:scale-95 flex items-center justify-center ${isFinalConfirmDisabled ? 'bg-gray-200 dark:bg-gray-800 cursor-not-allowed opacity-60 shadow-none' : 'shadow-2xl dark:shadow-none'}`}
                >
                    <div className={`absolute inset-0 transition-opacity duration-500 ${isFinalConfirmDisabled ? 'bg-transparent' : 'bg-gradient-to-r from-emerald-500 via-green-500 to-teal-600'}`}></div>
                    <div className="relative w-full flex items-center justify-center space-x-3 text-white">
                         <span className="uppercase tracking-[0.25em] text-[12px] font-black italic">Confirm Payment</span>
                         <div className="bg-white/20 p-1.5 rounded-full group-hover:translate-x-1.5 transition-transform duration-300 shadow-2xl dark:shadow-none">
                            <Check size={18} strokeWidth={3} />
                         </div>
                    </div>
                </button>
                <button 
                    onClick={() => setConfirmStep(false)}
                    className="w-full mt-4 text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] py-2 hover:text-gray-800 transition"
                >
                    Back to Cart
                </button>
            </div>
        </div>
      ) : (
        <>
          <div className="flex-1 space-y-4">
             <div onClick={() => navigate('/address-book')} className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-2xl dark:shadow-none active:scale-[0.99] transition cursor-pointer border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center space-x-2 text-slate-500">
                        <MapPin size={16} strokeWidth={2} fill="currentColor" fillOpacity={0.15} />
                        <span className="text-xs font-bold uppercase tracking-wide">Shipping To</span>
                    </div>
                    <span className="text-synergy-blue text-xs font-semibold">Change</span>
                </div>
                {selectedAddress ? (
                    <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-white">{selectedAddress.name} <span className="text-slate-500 font-normal">| {selectedAddress.phone}</span></p>
                        <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 truncate">{selectedAddress.address}, {selectedAddress.city}</p>
                    </div>
                ) : (
                    <p className="text-sm text-red-500 font-medium">Please select an address</p>
                )}
             </div>

            {cart.map(item => (
              <div key={item.id} className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-2xl dark:shadow-none flex items-center space-x-4 border border-slate-100 dark:border-slate-800">
                <img 
                    src={item.image || undefined} 
                    alt={item.name} 
                    className="w-20 h-20 rounded-xl object-cover bg-slate-50 dark:bg-slate-800 cursor-pointer active:scale-95 transition-transform" 
                    onClick={() => navigate(`/product/${item.id}`)}
                />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">{item.name}</h3>
                  <p className="text-xs text-slate-500 mb-2">{item.category}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-synergy-blue font-bold">฿{item.price.toLocaleString()}</span>
                    <div className="flex flex-col items-end">
                      <div className="flex items-center space-x-3 bg-slate-50 dark:bg-slate-900 rounded-lg p-1 border border-slate-100 dark:border-slate-800">
                        <button 
                          onClick={() => item.quantity > 1 ? updateCartQuantity(item.id, -1) : removeFromCart(item.id)}
                          className="w-6 h-6 rounded-md bg-white dark:bg-slate-800 shadow-2xl dark:shadow-none flex items-center justify-center text-slate-600 dark:text-slate-400"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="text-xs font-semibold w-4 text-center dark:text-slate-100">{item.quantity}</span>
                        <button 
                           onClick={() => updateCartQuantity(item.id, 1)}
                           className="w-6 h-6 rounded-md bg-white dark:bg-slate-800 shadow-2xl dark:shadow-none flex items-center justify-center text-slate-600 dark:text-slate-400"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      {item.quantity >= item.stock && (
                        <p className="text-[8px] text-red-500 font-bold uppercase mt-1">Max Stock</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="space-y-3">
                 <div onClick={() => navigate('/payment-selection')} className={`bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-2xl dark:shadow-none flex items-center justify-between cursor-pointer active:scale-[0.99] transition border ${hasInsufficientBalance ? 'border-red-200 dark:border-red-900/50' : 'border-slate-100 dark:border-slate-800'}`}>
                     <div className="flex items-center space-x-3">
                         <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${hasInsufficientBalance ? 'bg-red-50 text-red-500' : 'bg-blue-50 dark:bg-blue-900/20 text-synergy-blue'}`}>
                             <CardIcon size={16} strokeWidth={2} fill="currentColor" fillOpacity={0.15} />
                         </div>
                         <div>
                             <p className="text-xs text-slate-500 font-black uppercase tracking-widest text-[8px] mb-0.5 opacity-60">Payment Method</p>
                             <div className="flex items-center space-x-2">
                                <p className={`text-sm font-bold ${hasInsufficientBalance ? 'text-red-600' : 'text-slate-800 dark:text-slate-100'}`}>
                                    {paymentMethod === 'CreditCard' 
                                        ? (selectedPaymentCard ? `Card ending ${selectedPaymentCard.cardNumber.slice(-4)}` : 'Select Credit Card') 
                                        : paymentMethod}
                                </p>
                                {isWalletPayment && (
                                    <span className={`text-[10px] font-bold ${hasInsufficientBalance ? 'text-red-500' : 'text-emerald-500'}`}>
                                        (฿{(user?.walletBalance ?? 0).toLocaleString()})
                                    </span>
                                )}
                             </div>
                         </div>
                     </div>
                     <ChevronRight size={16} className="text-slate-300 dark:text-slate-600" />
                 </div>
                 
                 {hasInsufficientBalance && (
                     <div className="flex items-center space-x-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 rounded-xl animate-in fade-in slide-in-from-top-1">
                         <AlertCircle size={14} className="text-red-500" />
                         <p className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest">Insufficient Wallet Balance</p>
                     </div>
                 )}

                 <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-2xl dark:shadow-none border border-slate-100 dark:border-slate-800">
                     <div className="flex items-center space-x-2 mb-3">
                         <Ticket size={16} strokeWidth={2} fill="currentColor" fillOpacity={0.15} className="text-synergy-blue" />
                         <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Promo Code</span>
                     </div>
                     {appliedCoupon ? (
                         <div className="flex justify-between items-center bg-green-50 dark:bg-emerald-900/20 border border-green-100 dark:border-emerald-800 p-2.5 rounded-xl">
                             <div>
                                 <span className="text-sm font-bold text-green-700 dark:text-emerald-400">{appliedCoupon.code}</span>
                                 <p className="text-[10px] text-green-600 dark:text-emerald-500">{appliedCoupon.description}</p>
                             </div>
                             <button onClick={removeCoupon} className="text-gray-400 hover:text-red-500">
                                 <X size={16} />
                             </button>
                         </div>
                     ) : (
                         <div className="flex space-x-2">
                             <input 
                                 value={couponInput}
                                 onChange={(e) => setCouponInput(e.target.value)}
                                 placeholder="Enter Code (e.g. SYNERGY2024)"
                                 className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-synergy-blue/20 dark:text-white"
                             />
                             <button 
                                 onClick={handleApplyCoupon}
                                 className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-bold px-4 rounded-xl active:scale-95 transition"
                             >
                                 Apply
                             </button>
                         </div>
                     )}
                 </div>
            </div>

            <div className="mt-6 bg-white dark:bg-slate-900 p-8 rounded-[40px] shadow-2xl dark:shadow-none border border-slate-100 dark:border-slate-800 relative overflow-hidden group">
                <div className="space-y-2.5 mb-6 relative z-10">
                    <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 font-bold">
                        <span>Subtotal</span>
                        <span>฿{subtotal.toLocaleString()}</span>
                    </div>
                    {memberDiscount > 0 && (
                        <div className="flex justify-between text-xs text-synergy-blue font-black bg-synergy-blue/5 px-3 py-1.5 rounded-xl">
                            <span>Member Discount ({user?.tier})</span>
                            <span>-฿{memberDiscount.toLocaleString()}</span>
                        </div>
                    )}
                    {couponDiscount > 0 && (
                        <div className="flex justify-between text-xs text-emerald-600 dark:text-emerald-400 font-black bg-emerald-50 dark:bg-emerald-900/10 px-3 py-1.5 rounded-xl">
                            <span>Coupon Discount</span>
                            <span>-฿{couponDiscount.toLocaleString()}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                        <span>VAT (7%)</span>
                        <span>฿{vat.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                        <span>Shipping</span>
                        <span className="text-emerald-600 font-bold uppercase tracking-widest text-[9px]">Free</span>
                    </div>
                    <div className="h-px bg-slate-100 dark:bg-slate-800 my-4 opacity-50"></div>
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Grand Total</span>
                        <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">฿{total.toLocaleString()}</span>
                    </div>
                </div>

                {/* PREMIUM CHECKOUT BUTTON */}
                <button 
                    onClick={handleCheckout}
                    disabled={isCheckoutDisabled}
                    className={`group relative w-full h-16 rounded-full overflow-hidden transition-all duration-300 active:scale-95 flex items-center justify-center ${isCheckoutDisabled ? 'bg-gray-200 dark:bg-gray-800 cursor-not-allowed opacity-60 shadow-none' : 'shadow-[0_15px_35px_-5px_rgba(0,181,255,0.4)]'}`}
                >
                    {/* Background Layer */}
                    <div className={`absolute inset-0 transition-opacity duration-500 ${isCheckoutDisabled ? 'bg-transparent' : 'bg-gradient-to-r from-synergy-blue via-blue-500 to-indigo-600'}`}></div>
                    
                    {/* Shine Effect Animation */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
                    
                    <div className="relative w-full flex items-center justify-center space-x-3 text-white">
                         <span className="uppercase tracking-[0.25em] text-[12px] font-black italic">Checkout</span>
                         <div className="bg-white/20 p-1.5 rounded-full group-hover:translate-x-1.5 transition-transform duration-300 shadow-2xl dark:shadow-none">
                            <ArrowRight size={18} strokeWidth={3} />
                         </div>
                    </div>
                </button>
            </div>
          </div>
        </>
      )}

      {/* CREDIT CARD CONFIRMATION & PAYMENT MODAL */}
      {showCardModal && selectedPaymentCard && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center px-6">
              <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => !isVerifying && !paymentDone && setShowCardModal(false)}></div>
              <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-[32px] p-8 shadow-2xl dark:shadow-none relative z-10 animate-in zoom-in-95 overflow-hidden flex flex-col border border-white/10">
                  
                  {paymentDone && (
                      <div className="absolute inset-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm z-30 flex flex-col items-center justify-center animate-in fade-in duration-500">
                          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-500 rounded-full flex items-center justify-center mb-4 shadow-2xl dark:shadow-none animate-bounce">
                              <CheckCircle2 size={32} strokeWidth={3} />
                          </div>
                          <h2 className="text-base font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest leading-none">Payment Success</h2>
                          <p className="text-gray-600 dark:text-gray-400 text-[10px] mt-2 font-bold uppercase tracking-tight">Redirecting to My Orders...</p>
                      </div>
                  )}

                  <div className="flex justify-between items-center mb-6">
                      <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-gray-900 dark:bg-white rounded-lg flex items-center justify-center text-white dark:text-gray-900">
                              <ShieldCheck size={20} strokeWidth={2} fill="currentColor" fillOpacity={0.2} />
                          </div>
                          <span className="text-[11px] font-black text-gray-900 dark:text-white uppercase tracking-widest italic">Confirm Payment</span>
                      </div>
                      {!paymentDone && !isVerifying && (
                          <button onClick={() => setShowCardModal(false)} className="text-gray-300 hover:text-gray-500 transition"><X size={20} /></button>
                      )}
                  </div>

                  <div className="relative w-full aspect-[1.6/1] bg-gradient-to-br from-indigo-900 to-indigo-700 rounded-[24px] p-6 text-white shadow-2xl dark:shadow-none mb-8 overflow-hidden">
                      <div className="absolute top-0 right-0 p-6 opacity-30">
                         <CardIcon size={40} />
                      </div>
                      
                      <div className="relative z-10 h-full flex flex-col justify-between">
                          <div className="flex items-center space-x-3">
                              <div className="w-10 h-7 bg-amber-400/90 rounded-md shadow-inner flex items-center justify-center">
                                  <div className="w-8 h-px bg-black/10"></div>
                              </div>
                              <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Synergy Platinum</span>
                          </div>

                          <div className="space-y-1">
                              <p className="text-lg font-mono font-black tracking-[0.2em]">**** **** **** {selectedPaymentCard.cardNumber.slice(-4)}</p>
                              <div className="flex justify-between items-center">
                                  <p className="text-[9px] font-bold uppercase tracking-widest opacity-60">Expires {selectedPaymentCard.expiryDate}</p>
                                  <p className="text-[10px] font-mono font-bold">{selectedPaymentCard.brand.toUpperCase()}</p>
                              </div>
                          </div>
                      </div>
                  </div>

                  <div className="space-y-6 text-center">
                      {confirmStep && (
                          <div className="animate-in fade-in slide-in-from-bottom-2">
                              <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl mb-6 border border-gray-100 dark:border-gray-700 text-left">
                                  <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mb-1">Total Amount</p>
                                  <p className="text-2xl font-black text-gray-900 dark:text-white">฿{total.toLocaleString()}</p>
                              </div>
                              <button 
                                onClick={executeCardPayment}
                                className="w-full h-16 bg-synergy-blue text-white rounded-full font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl dark:shadow-none active:scale-[0.98] transition-all flex items-center justify-center space-x-3"
                              >
                                  <Lock size={18} />
                                  <span>Pay Securely</span>
                              </button>
                          </div>
                      )}

                      {isVerifying && (
                           <div className="flex flex-col items-center py-4 animate-in zoom-in duration-300">
                               <div className="relative mb-4">
                                   <Loader2 size={40} className="text-synergy-blue animate-spin" />
                                   <div className="absolute inset-0 flex items-center justify-center">
                                       <div className="w-2 h-2 rounded-full bg-synergy-blue animate-ping"></div>
                                   </div>
                               </div>
                               <p className="text-[11px] font-black text-synergy-blue uppercase tracking-[0.2em] animate-pulse">Authorizing Card...</p>
                               <p className="text-[8px] text-gray-600 dark:text-gray-400 mt-2 uppercase font-bold tracking-tighter">Do not close this window</p>
                           </div>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* PROMPTPAY QR MODAL */}
      {showQrModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center px-6">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => !isVerifying && !paymentDone && setShowQrModal(false)}></div>
              <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-[32px] p-8 shadow-2xl dark:shadow-none relative z-10 animate-in zoom-in-95 text-center overflow-hidden border border-white/10">
                  
                  {paymentDone && (
                      <div className="absolute inset-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm z-20 flex flex-col items-center justify-center animate-in fade-in duration-500">
                          <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-500 rounded-full flex items-center justify-center mb-3 shadow-2xl dark:shadow-none animate-bounce">
                              <CheckCircle2 size={24} strokeWidth={3} />
                          </div>
                          <h2 className="text-sm font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest leading-none">Payment Success</h2>
                          <p className="text-gray-400 dark:text-gray-500 text-[9px] mt-1.5 font-bold uppercase tracking-tight">Redirecting to My Orders...</p>
                      </div>
                  )}

                  <div className="flex justify-between items-center mb-5">
                      <div className="flex items-center space-x-2">
                          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                              <QrCode size={16} />
                          </div>
                          <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest italic">PromptPay</span>
                      </div>
                      {!paymentDone && !isVerifying && (
                          <button onClick={() => setShowQrModal(false)} className="text-gray-300 hover:text-gray-500"><X size={18} /></button>
                      )}
                  </div>

                  <div className="mb-5 p-3 bg-white rounded-[28px] border border-gray-100 inline-block relative shadow-inner">
                      <img src={qrUrl || undefined} alt="PromptPay QR" className="w-40 h-40 mix-blend-multiply" />
                      {isVerifying && (
                          <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[1px]">
                              <div className="bg-white p-2.5 rounded-xl shadow-2xl dark:shadow-none border border-blue-50">
                                  <Loader2 size={28} className="text-synergy-blue animate-spin" />
                              </div>
                          </div>
                      )}
                  </div>

                  <div className="space-y-1 mb-6">
                      <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">Total Amount to Pay</p>
                      <h2 className="text-2xl font-black text-gray-900 dark:text-white">฿{total.toLocaleString()}</h2>
                  </div>

                  <div className="flex flex-col items-center space-y-3">
                      <div className="flex items-center space-x-1.5 text-[9px] font-black uppercase text-gray-600 animate-pulse">
                          {isVerifying ? (
                              <>
                                <span className="w-1 h-1 rounded-full bg-blue-500"></span>
                                <span>Verifying Transaction...</span>
                              </>
                          ) : (
                              <span>Waiting for payment...</span>
                          )}
                      </div>
                      <p className="text-[8px] text-gray-600 leading-relaxed max-w-[180px] uppercase font-bold tracking-tight">
                          Please scan the QR code within 5 minutes. The system will verify automatically.
                      </p>
                  </div>
              </div>
          </div>
      )}

      {/* REFERRER REQUIRED MODAL */}
      <ReferrerModal 
        isOpen={showReferrerModal} 
        onClose={() => setShowReferrerModal(false)}
        onSuccess={() => {
          setConfirmStep(true);
        }}
        title="Referral Code Required"
        description="To process commissions accurately, you must link a referrer before checking out."
      />

      {/* AUTO REFERRER CONFIRM MODAL */}
      {showReferrerAutoConfirm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl dark:shadow-none animate-in zoom-in-95 border border-white/20 p-8 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-synergy-blue mb-6">
              <UserPlus size={32} />
            </div>
            
            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">
              {showReferrerAutoConfirm === 'link' ? 'Link Creator?' : 'Change to Creator?'}
            </h3>
            
            <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium leading-relaxed mb-8">
              {showReferrerAutoConfirm === 'link' 
                ? "Would you like to link your account to the creator who shared this post? Their code is "
                : "This is your first purchase. Would you like to change your referrer to the creator who shared this post? Their code is "}
              <span className="text-synergy-blue font-black">{influencerReferrerCode}</span>
            </p>
            
            <div className="w-full space-y-3">
              <button
                onClick={async () => {
                  if (influencerReferrerCode) {
                    const result = await addReferrer(influencerReferrerCode);
                    if (result.success) {
                      setShowReferrerAutoConfirm(null);
                      setConfirmStep(true);
                      showToast({ message: "Referrer linked successfully!", type: 'success' });
                    } else {
                      showToast({ message: result.error || "Failed to link referrer", type: 'error' });
                      setShowReferrerAutoConfirm(null);
                      setShowReferrerModal(true);
                    }
                  }
                }}
                className="w-full h-12 bg-synergy-blue text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl dark:shadow-none active:scale-95 transition-all"
              >
                Yes, Link Creator
              </button>
              
              <button
                onClick={() => {
                  if (showReferrerAutoConfirm === 'link') {
                    setShowReferrerAutoConfirm(null);
                    setShowReferrerModal(true);
                  } else {
                    setShowReferrerAutoConfirm(null);
                    setConfirmStep(true);
                  }
                }}
                className="w-full h-12 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all"
              >
                {showReferrerAutoConfirm === 'link' ? "No, Enter Manually" : "Keep Existing"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Terms and Conditions Modal */}
      {showTermsModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-6 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
              <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl dark:shadow-none animate-in zoom-in-95 flex flex-col max-h-[80vh] border border-white/20">
                  <div className="p-6 border-b border-gray-50 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                      <div className="flex items-center space-x-2 text-synergy-blue">
                          <ShieldCheck size={20} />
                          <h3 className="font-black text-xs uppercase tracking-[0.2em]">{t('cart.terms_title')}</h3>
                      </div>
                      <button onClick={() => setShowTermsModal(false)} className="text-gray-300 hover:text-gray-500 transition"><X size={22} /></button>
                  </div>
                  <div className="p-6 overflow-y-auto no-scrollbar flex-1 bg-white dark:bg-gray-900">
                      <div className="space-y-6">
                          <div>
                              <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest mb-2 flex items-center"><Lock size={14} className="mr-2 text-emerald-500" /> {t('cart.terms_secure_title')}</h4>
                              <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                                  {t('cart.terms_secure_desc')}
                              </p>
                          </div>
                          <div>
                              <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest mb-2 flex items-center"><CheckCircle2 size={14} className="mr-2 text-synergy-blue" /> {t('cart.terms_confirm_title')}</h4>
                              <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                                  {t('cart.terms_confirm_desc')}
                              </p>
                          </div>
                          <div>
                              <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest mb-2 flex items-center"><AlertCircle size={14} className="mr-2 text-purple-500" /> {t('cart.terms_refund_title')}</h4>
                              <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                                  {t('cart.terms_refund_desc')}
                              </p>
                          </div>
                          <div>
                              <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest mb-2 flex items-center"><MapPin size={14} className="mr-2 text-blue-500" /> {t('cart.terms_shipping_title')}</h4>
                              <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                                  {t('cart.terms_shipping_desc')}
                              </p>
                          </div>
                          <div>
                              <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest mb-2 flex items-center"><Sparkles size={14} className="mr-2 text-amber-500" /> {t('cart.terms_affiliate_title')}</h4>
                              <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                                  {t('cart.terms_affiliate_desc')}
                              </p>
                          </div>
                          <div>
                              <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest mb-2 flex items-center"><ShieldCheck size={14} className="mr-2 text-indigo-500" /> {t('cart.terms_privacy_title')}</h4>
                              <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                                  {t('cart.terms_privacy_desc')}
                              </p>
                          </div>
                      </div>
                  </div>
                  <div className="p-6 bg-gray-50 dark:bg-gray-800/30 border-t border-gray-50 dark:border-gray-800">
                      <button 
                        onClick={acceptTerms}
                        className="w-full h-14 bg-synergy-blue text-white font-black rounded-2xl shadow-2xl dark:shadow-none active:scale-[0.98] transition uppercase tracking-[0.2em] text-xs"
                      >
                          {t('cart.terms_accept')}
                      </button>
                  </div>
              </div>
          </div>
      )}


    </div>
  );
};