import React from 'react';
import { User } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';
import { useApp } from '@/lib/AppContext';

export default function TopBar() {
  const { setActiveTab } = useApp();

  return (
    <div className="flex items-center justify-between px-5 py-3 bg-background/80 backdrop-blur-lg sticky top-0 z-40">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-teal flex items-center justify-center">
          <span className="text-primary-foreground text-xs font-bold">M</span>
        </div>
        <span className="text-sm font-semibold text-foreground tracking-tight">MercosurAI</span>
      </div>
      <div className="flex items-center gap-3">
        <LanguageSwitcher />
        <button
          onClick={() => setActiveTab('dashboard')}
          className="w-8 h-8 rounded-full bg-card flex items-center justify-center shadow-card"
        >
          <User size={16} className="text-text-secondary" />
        </button>
      </div>
    </div>
  );
}
