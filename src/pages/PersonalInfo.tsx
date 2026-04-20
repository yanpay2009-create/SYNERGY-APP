import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, User, ShieldCheck, Landmark } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const PersonalInfo: React.FC = () => {
  const navigate = useNavigate();
  const { user, isSecurityUnlocked, t } = useApp();
  
  useEffect(() => {
    if (!user) {
        navigate('/account');
        return;
    }
    // Security Fallback: If someone deep links to this page without unlocking PIN at Account page
    if (!isSecurityUnlocked) {
        navigate('/account');
    }
  }, [user, isSecurityUnlocked, navigate]);

  const MenuLink = ({ to, icon: Icon, title, desc, isLast }: any) => (
    <button 
      onClick={() => navigate(to)}
      className={`w-full p-4 flex items-center justify-between active:scale-[0.99] transition-all ${!isLast ? 'border-b border-gray-50 dark:border-gray-700/50' : ''} group`}
    >
      <div className="flex items-center space-x-4">
        <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
          <Icon size={20} />
        </div>
        <div className="text-left">
          <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 leading-tight">{title}</h3>
          <p className="text-[10px] text-gray-400 font-medium leading-tight mt-0.5">{desc}</p>
        </div>
      </div>
      <ChevronRight size={16} className="text-gray-300 dark:text-gray-500 group-hover:translate-x-1 transition-transform" />
    </button>
  );

  if (!user || !isSecurityUnlocked) return null;

  return (
    <div className="pb-24 pt-0 px-4 max-w-md mx-auto min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="sticky top-0 z-[100] bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100/50 dark:border-gray-800/50 -mx-4 px-4 py-3 mb-6 transition-all">
        <div className="flex items-center">
          <button onClick={() => navigate('/account')} className="p-2 -ml-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold ml-2 text-gray-900 dark:text-white tracking-tight">{t('menu.personal_info')}</h1>
        </div>
      </div>

      <div className="animate-in slide-in-from-bottom-4 duration-500">
        <div className="bg-white dark:bg-gray-800 rounded-[24px] overflow-hidden shadow-soft border border-gray-100 dark:border-gray-700 relative">
          <MenuLink to="/edit-profile" icon={User} title="Edit Profile" desc="Name, Email, Phone Number" isLast={false} />
          <MenuLink to="/kyc" icon={ShieldCheck} title="Identity Verification" desc="ID Card, Verification Status" isLast={false} />
          <MenuLink to="/bank-accounts" icon={Landmark} title="Bank Accounts" desc="Manage Withdrawal Accounts" isLast={true} />
        </div>
      </div>
    </div>
  );
};