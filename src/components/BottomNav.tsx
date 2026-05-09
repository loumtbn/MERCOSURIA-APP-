import React from 'react';
import { Home, Zap, Globe, Newspaper, Scale } from 'lucide-react';
import { useApp } from '@/lib/AppContext';

const tabs = [
  { id: 'home', icon: Home, labelKey: 'home' },
  { id: 'impact', icon: Zap, labelKey: 'impact' },
  { id: 'countries', icon: Globe, labelKey: 'countries' },
  { id: 'news', icon: Newspaper, labelKey: 'news' },
  { id: 'advise', icon: Scale, labelKey: 'advise' },
];

export default function BottomNav() {
  const { activeTab, setActiveTab, i } = useApp();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-lg border-t border-border z-50 safe-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex flex-col items-center gap-0.5 px-3 py-1 transition-all"
            >
              <tab.icon
                size={22}
                className={`transition-colors ${active ? 'text-teal' : 'text-text-secondary'}`}
                strokeWidth={active ? 2.2 : 1.8}
              />
              {active && (
                <span className="text-[10px] font-medium text-teal">{i(tab.labelKey)}</span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
