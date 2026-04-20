
import React from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { Language } from '../types';

export const LanguageSelection: React.FC = () => {
  const { language, setLanguage, t } = useApp();
  const navigate = useNavigate();

  const languages: { code: Language; name: string; localName: string; flag: string }[] = [
    { code: 'en', name: 'English', localName: 'English', flag: '🇺🇸' },
    { code: 'th', name: 'Thai', localName: 'ไทย', flag: '🇹🇭' },
    { code: 'mm', name: 'Myanmar', localName: 'မြန်မာ', flag: '🇲🇲' },
  ];

  const handleSelect = (code: Language) => {
    setLanguage(code);
    // Optional: go back immediately
    // navigate(-1);
  };

  return (
    <div className="pb-24 pt-0 px-4 max-w-md mx-auto min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="sticky top-0 z-[100] bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100/50 dark:border-gray-800/50 -mx-4 px-4 py-3 mb-6 transition-all">
        <div className="flex items-center">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold ml-2 text-gray-900 dark:text-white tracking-tight">{t('pref.language')}</h1>
        </div>
      </div>

      <div className="animate-in slide-in-from-bottom-4 duration-500">
        <div className="bg-white dark:bg-gray-800 rounded-[24px] overflow-hidden shadow-soft border border-gray-100 dark:border-gray-700 relative">
          {languages.map((lang, index) => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              className={`w-full p-4 flex items-center justify-between active:scale-[0.99] transition-all ${index !== languages.length - 1 ? 'border-b border-gray-50 dark:border-gray-700/50' : ''} ${language === lang.code ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}
            >
              <div className="flex items-center space-x-4">
                <span className="text-2xl">{lang.flag}</span>
                <div className="text-left">
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-200 block">{lang.localName}</span>
                  <span className="text-[10px] text-gray-400 font-medium">{lang.name}</span>
                </div>
              </div>
              {language === lang.code && (
                <div className="w-6 h-6 bg-synergy-blue rounded-full flex items-center justify-center text-white shadow-sm">
                  <Check size={14} strokeWidth={3} />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
