
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface InputFieldProps {
  label: string;
  field: string;
  placeholder: string;
  value: string;
  show: boolean;
  onChange: (val: string) => void;
  onToggle: () => void;
  inputRef?: React.RefObject<HTMLInputElement>;
  nextRef?: React.RefObject<HTMLInputElement>;
  isLast?: boolean;
}

const InputField = ({ label, field, placeholder, value, show, onChange, onToggle, inputRef, nextRef, isLast }: InputFieldProps) => (
  <div className="mb-4">
    <label className="text-xs font-bold text-gray-500 uppercase ml-1 block mb-2">{label}</label>
    <div className="relative">
      <input
        ref={inputRef}
        type={show ? "text" : "password"}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            if (nextRef?.current) {
              e.preventDefault();
              nextRef.current.focus();
            }
          }
        }}
        enterKeyHint={isLast ? "done" : "next"}
        autoComplete={field === 'current' ? 'current-password' : 'new-password'}
        placeholder={placeholder}
        className="w-full bg-white border border-gray-100 rounded-xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-synergy-blue/20"
      />
      <button
        type="button"
        onClick={onToggle}
        onMouseDown={(e) => e.preventDefault()}
        onTouchStart={(e) => e.preventDefault()}
        className="absolute right-4 top-3 text-gray-400 hover:text-gray-600 p-1"
      >
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  </div>
);

export const ChangePassword: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUserSecurity, showToast, t } = useApp();
  const [form, setForm] = useState({ current: '', new: '', confirm: '' });
  const [showPwd, setShowPwd] = useState({ current: false, new: false, confirm: false });
  const [initialHeight, setInitialHeight] = useState<number | null>(null);

  const currentRef = useRef<HTMLInputElement>(null);
  const newRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInitialHeight(window.innerHeight);
  }, []);

  const isSettingPassword = !user?.password;

  const validatePassword = (pass: string) => {
    const hasLowercase = /[a-z]/.test(pass);
    const hasNumber = /[0-9]/.test(pass);
    const hasMinLength = pass.length >= 6;
    return hasLowercase && hasNumber && hasMinLength;
  };

  const toggleShow = (field: keyof typeof showPwd) => {
    setShowPwd(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSettingPassword && user?.password && form.current !== user.password) {
        showToast({ message: "Current password incorrect!", type: 'error' });
        return;
    }
    if (form.new !== form.confirm) {
      showToast({ message: "New passwords do not match!", type: 'error' });
      return;
    }
    if (!validatePassword(form.new)) {
      showToast({ message: "Password must be at least 6 characters long and contain at least one English lowercase letter (a-z) and one number (0-9).", type: 'error' });
      return;
    }
    
    updateUserSecurity('password', form.new);
    showToast({ message: isSettingPassword ? "Password set successfully!" : "Password changed successfully!", type: 'success' });
    navigate(-1);
  };

  return (
    <div 
      className="pb-24 pt-4 px-4 max-w-md mx-auto bg-gray-50 overflow-y-auto"
      style={{ minHeight: initialHeight ? `${initialHeight}px` : '100vh' }}
    >
      <div className="flex items-center mb-6">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold ml-2">{isSettingPassword ? t('pref.set_password') : t('pref.password')}</h1>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-soft">
        <div className="w-16 h-16 bg-blue-50 text-synergy-blue rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock size={32} />
        </div>
        
        <form onSubmit={handleSubmit}>
          {!isSettingPassword && (
            <InputField 
              label="Current Password" 
              field="current" 
              placeholder="••••••••" 
              value={form.current}
              show={showPwd.current}
              onChange={(val) => setForm({ ...form, current: val })}
              onToggle={() => toggleShow('current')}
              inputRef={currentRef}
              nextRef={newRef}
            />
          )}
          <InputField 
            label="New Password" 
            field="new" 
            placeholder="••••••••" 
            value={form.new}
            show={showPwd.new}
            onChange={(val) => setForm({ ...form, new: val })}
            onToggle={() => toggleShow('new')}
            inputRef={newRef}
            nextRef={confirmRef}
          />
          <div className="flex items-start space-x-1.5 -mt-2 mb-4 px-1 text-gray-400 animate-in fade-in slide-in-from-top-1">
            <Lock size={10} className="mt-0.5 shrink-0" />
            <p className="text-[9px] font-bold uppercase tracking-tight leading-tight">
              Min 6 characters (At least 1 lowercase letter & 1 number)
            </p>
          </div>
          <InputField 
            label="Confirm New Password" 
            field="confirm" 
            placeholder="••••••••" 
            value={form.confirm}
            show={showPwd.confirm}
            onChange={(val) => setForm({ ...form, confirm: val })}
            onToggle={() => toggleShow('confirm')}
            inputRef={confirmRef}
            isLast={true}
          />

          <button
            type="submit"
            disabled={(!isSettingPassword && !form.current) || !form.new || !form.confirm}
            className="w-full bg-synergy-blue text-white font-bold py-4 rounded-xl shadow-glow mt-4 flex items-center justify-center space-x-2 active:scale-[0.98] transition disabled:opacity-50 disabled:shadow-none"
          >
            <CheckCircle size={18} />
            <span>{isSettingPassword ? t('pref.set_password') : t('btn.save')}</span>
          </button>
        </form>
      </div>

      <div className="mt-6 p-4 rounded-2xl bg-gray-100 text-xs text-gray-500 leading-relaxed">
        <strong>Security Tip:</strong> Use a strong password with a mix of letters, numbers, and symbols. Do not share your password with anyone.
      </div>
    </div>
  );
};
