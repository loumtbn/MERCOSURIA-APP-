import React from 'react';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { useApp } from '@/lib/AppContext';
import { SECTORS } from '@/lib/data';
import StatusBadge from '@/components/StatusBadge';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function AlertsScreen() {
  const { i, user, setActiveTab } = useApp();
  const sectorData = SECTORS.find(s => s.id === user.sector);

  const activeAlerts = [
    {
      category: 'Tariffs', date: 'May 9, 2026',
      title: 'New preferential rates now applying to your sector',
      impact: 'Verify your HS codes on TARIC immediately — savings apply from today.',
    },
    {
      category: 'Legal', date: 'May 8, 2026',
      title: 'EP v Commission — first hearing scheduled June 2026',
      impact: 'If successful, iTA provisional application could be suspended. Monitor weekly.',
    },
    {
      category: 'Environment', date: 'May 7, 2026',
      title: 'EUDR compliance deadline approaching for Mercosur supply chains',
      impact: 'Ensure geolocation traceability documentation is ready for inspection.',
    },
  ];

  const pastAlerts = [
    {
      category: 'Agreement', date: 'May 1, 2026',
      title: 'EU-Mercosur iTA officially entered into force',
      impact: 'All sectors affected — new tariff framework now applicable.',
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="flex items-center justify-between px-5 py-3 bg-background/80 backdrop-blur-lg sticky top-0 z-40">
        <button onClick={() => setActiveTab('dashboard')} className="flex items-center gap-1 text-xs text-text-secondary">
          <ArrowLeft size={16} /> Back
        </button>
        <LanguageSwitcher />
      </div>

      <div className="px-5 pt-2">
        <h2 className="text-lg font-bold text-foreground">{i('my_alerts')}</h2>
        <p className="text-xs text-text-secondary mb-5">
          Personalized for {sectorData?.emoji} {sectorData?.label || 'your sector'}
        </p>

        {/* Pinned */}
        <div className="bg-status-red rounded-card p-4 mb-4 flex items-start gap-2">
          <span className="w-2 h-2 rounded-full bg-primary-foreground pulse-dot flex-shrink-0 mt-1" />
          <div>
            <p className="text-xs font-medium text-primary-foreground">
              iTA in force since May 1st — multiple changes affect your sector
            </p>
            <button
              onClick={() => setActiveTab('impact')}
              className="mt-2 text-xs text-primary-foreground underline"
            >
              See full analysis →
            </button>
          </div>
        </div>

        {/* Active */}
        <p className="text-xs font-semibold text-foreground mb-2">Active</p>
        <div className="flex flex-col gap-2 mb-5">
          {activeAlerts.map((a, idx) => (
            <div key={idx} className="bg-card rounded-card p-4 shadow-card border-l-4 border-status-red">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-status-red font-medium">{a.category}</span>
                <span className="text-[10px] text-text-secondary">{a.date}</span>
              </div>
              <p className="text-sm font-semibold text-foreground mb-1">{a.title}</p>
              <p className="text-xs text-text-secondary">{a.impact}</p>
            </div>
          ))}
        </div>

        {/* Past */}
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-foreground">Past</p>
          <button className="text-[10px] text-text-secondary">Mark all read</button>
        </div>
        <div className="flex flex-col gap-2">
          {pastAlerts.map((a, idx) => (
            <div key={idx} className="bg-card rounded-card p-4 shadow-card opacity-60">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-text-secondary font-medium">{a.category}</span>
                <span className="text-[10px] text-text-secondary">{a.date}</span>
              </div>
              <p className="text-sm font-medium text-foreground mb-1">{a.title}</p>
              <p className="text-xs text-text-secondary">{a.impact}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
