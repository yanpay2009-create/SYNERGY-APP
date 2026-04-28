import React from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Globe, MapPin, Share2, Shield, LogOut, ChevronRight, Lock, Type, Bell } from 'lucide-react';

export const Preferences: React.FC = () => {
  const { logout, language, fontSize, setFontSize, t, notificationsEnabled, setNotificationsEnabled, user } = useApp();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/account');
  };

  const getLanguageLabel = () => {
      switch(language) {
          case 'th': return 'ไทย';
          case 'mm': return 'မြန်မာ';
          default: return 'English';
      }
  };

  const cycleFontSize = () => {
      if (fontSize === 'small') setFontSize('medium');
      else if (fontSize === 'medium') setFontSize('large');
      else setFontSize('small');
  };

  const PreferenceItem = ({ icon: Icon, label, subtitle, value, to, onClick, color = "text-synergy-blue", toggle, active, isLast }: any) => (
    <button 
      onClick={() => {
        if (toggle && onClick) {
            onClick();
        } else {
            if (to) navigate(to);
            if (onClick) onClick();
        }
      }}
      className={`w-full p-4 flex items-center justify-between active:scale-[0.99] transition-all ${!isLast ? 'border-b border-gray-50 dark:border-gray-700/50' : ''}`}
    >
      <div className="flex items-center space-x-4">
        <div className={`w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center ${color} shadow-sm shrink-0`}>
          <Icon size={20} fill="currentColor" fillOpacity={0.15} />
        </div>
        <div className="text-left">
           <span className="text-sm font-bold text-gray-800 dark:text-gray-100 leading-tight block">{label}</span>
           {subtitle && <span className="text-[10px] text-gray-400 font-semibold leading-tight mt-1 block">{subtitle}</span>}
        </div>
      </div>
      <div className="flex items-center space-x-2">
        {value && <span className={`text-[11px] font-semibold ${fontSize === 'large' && label.includes('Appearance') ? 'text-synergy-blue' : 'text-gray-400'}`}>{value}</span>}
        {toggle ? (
            <div 
                className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-300 ${active ? 'bg-synergy-blue' : 'bg-gray-300 dark:bg-gray-700'}`}
            >
                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${active ? 'translate-x-5' : 'translate-x-0'}`}></div>
            </div>
        ) : (
            <ChevronRight size={16} className="text-gray-300 dark:text-gray-500" />
        )}
      </div>
    </button>
  );

  return (
    <div className="pb-24 pt-0 px-4 max-w-md mx-auto min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="sticky top-0 z-[100] bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100/50 dark:border-gray-800/50 -mx-4 px-4 py-3 mb-6 transition-all shadow-2xl dark:shadow-none">
        <div className="flex items-center">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold ml-2 text-gray-900 dark:text-white tracking-tight">{t('pref.settings')}</h1>
        </div>
      </div>

      <div className="animate-in slide-in-from-bottom-4 duration-500">
        <div className="mb-8">
          <h3 className="text-xs font-bold text-gray-400 uppercase ml-2 mb-4 tracking-[0.2em]">{t('pref.general')}</h3>
          <div className="bg-white dark:bg-gray-800 rounded-[24px] overflow-hidden shadow-soft border border-gray-100 dark:border-gray-700 relative">
              <PreferenceItem icon={Globe} label={t('pref.language')} subtitle={t('pref.language_sub')} value={getLanguageLabel()} to="/language-selection" isLast={false} />
              <PreferenceItem 
                  icon={Type} 
                  label={t('pref.font_size')} 
                  subtitle={t('pref.font_size_sub')}
                  value={t(`font.${fontSize}`)} 
                  onClick={cycleFontSize} 
                  isLast={false}
              />
              <PreferenceItem 
                  icon={Bell} 
                  label={t('pref.notifications')} 
                  subtitle={t('pref.notifications_sub')}
                  toggle={true} 
                  active={notificationsEnabled} 
                  onClick={() => setNotificationsEnabled(!notificationsEnabled)} 
                  isLast={false}
              />
              <PreferenceItem icon={MapPin} label={t('pref.addresses')} subtitle={t('pref.addresses_sub')} to="/address-book" isLast={true} />
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-xs font-bold text-gray-400 uppercase ml-2 mb-4 tracking-[0.2em]">{t('pref.connections')}</h3>
          <div className="bg-white dark:bg-gray-800 rounded-[24px] overflow-hidden shadow-soft border border-gray-100 dark:border-gray-700 relative">
              <PreferenceItem icon={Share2} label={t('pref.social')} subtitle={t('pref.social_sub')} to="/social-accounts" value="Linked" isLast={true} />
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-xs font-bold text-gray-400 uppercase ml-2 mb-4 tracking-[0.2em]">{t('pref.security')}</h3>
          <div className="bg-white dark:bg-gray-800 rounded-[24px] overflow-hidden shadow-soft border border-gray-100 dark:border-gray-700 relative">
              <PreferenceItem icon={Lock} label={user?.password ? t('pref.password') : t('pref.set_password')} subtitle={t('pref.password_sub')} to="/change-password" isLast={false} />
              <PreferenceItem icon={Shield} label={t('pref.pin')} subtitle={t('pref.pin_sub')} to="/change-pin" isLast={true} />
          </div>
        </div>

        <button 
          onClick={handleLogout}
          className="w-full py-4 text-red-500 font-bold bg-white dark:bg-gray-800 dark:text-red-400 rounded-[24px] shadow-soft flex items-center justify-center space-x-2 border border-gray-100 dark:border-gray-700 active:scale-[0.98] transition-all"
        >
          <LogOut size={20} />
          <span>{t('pref.logout')}</span>
        </button>
      </div>
    </div>
  );
};