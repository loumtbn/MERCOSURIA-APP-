import React from 'react';
import { useApp } from '@/lib/AppContext';

export default function LiveBanner() {
  const { i, setActiveTab } = useApp();

  return (
    <button
      onClick={() => setActiveTab('impact')}
      className="w-full px-4 py-3 bg-status-red flex items-center gap-2 text-left transition-all active:opacity-90"
    >
      <span className="w-2 h-2 rounded-full bg-primary-foreground pulse-dot flex-shrink-0" />
      <span className="text-xs font-medium text-primary-foreground leading-snug">
        {i('live_banner')}
      </span>
    </button>
  );
}
