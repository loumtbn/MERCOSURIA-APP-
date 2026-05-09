import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, AlertTriangle, ChevronRight, Bell, Calculator, User } from 'lucide-react';
import { useApp } from '@/lib/AppContext';
import { SECTORS } from '@/lib/data';
import StatusBadge from '@/components/StatusBadge';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function DashboardScreen() {
  const { i, user, setActiveTab } = useApp();
  const sectorData = SECTORS.find(s => s.id === user.sector);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 bg-background/80 backdrop-blur-lg sticky top-0 z-40">
        <button onClick={() => setActiveTab('home')} className="flex items-center gap-1 text-xs text-text-secondary">
          <ArrowLeft size={16} /> Back
        </button>
        <LanguageSwitcher />
      </div>

      <div className="px-5 pt-2">
        <h2 className="text-lg font-bold text-foreground">{i('dash_title')}</h2>
        <p className="text-sm text-text-secondary mb-5">{i('dash_hello')} {user.name}</p>

        {/* Urgent card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-status-red-light rounded-card p-4 mb-4 flex items-start gap-3"
        >
          <AlertTriangle size={18} className="text-status-red flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs text-status-red font-medium leading-relaxed">{i('dash_urgent')}</p>
            <button
              onClick={() => setActiveTab('impact')}
              className="mt-2 px-4 py-2 bg-teal text-primary-foreground rounded-pill text-xs font-medium"
            >
              {i('analyze_now')} →
            </button>
          </div>
        </motion.div>

        {/* Profile */}
        <div className="bg-card rounded-card p-4 shadow-card mb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-teal-light flex items-center justify-center">
                <User size={18} className="text-teal" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{i('my_profile')}</p>
                {sectorData && (
                  <span className="text-[10px] text-primary-foreground bg-teal px-2 py-0.5 rounded-pill mt-1 inline-block">
                    {sectorData.emoji} {sectorData.label}
                  </span>
                )}
              </div>
            </div>
            <span className="text-xs text-text-secondary">Edit →</span>
          </div>
        </div>

        {/* Alerts */}
        <button
          onClick={() => setActiveTab('alerts')}
          className="w-full bg-card rounded-card p-4 shadow-card mb-3 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-status-red-light flex items-center justify-center">
              <Bell size={18} className="text-status-red" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{i('my_alerts')}</p>
              <p className="text-xs text-text-secondary">3 active alerts</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-text-secondary" />
        </button>

        {/* Recent analyses */}
        <div className="bg-card rounded-card p-4 shadow-card mb-3">
          <p className="text-sm font-semibold text-foreground mb-3">{i('recent_analyses')}</p>
          {[
            { sector: '🍷 Wine & Spirits', country: '🇫🇷', score: 8, date: 'May 9, 2026' },
            { sector: '🚗 Automobile', country: '🇩🇪', score: 7, date: 'May 7, 2026' },
          ].map((a, idx) => (
            <div key={idx} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div className="flex items-center gap-2">
                <span className="text-sm">{a.sector}</span>
                <span>{a.country}</span>
                <StatusBadge color="green" small>IN FORCE</StatusBadge>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-teal">{a.score}/10</span>
                <p className="text-[10px] text-text-secondary">{a.date}</p>
              </div>
            </div>
          ))}
          <button
            onClick={() => setActiveTab('impact')}
            className="w-full mt-3 py-2 bg-teal-light text-teal rounded-pill text-xs font-medium"
          >
            New analysis →
          </button>
        </div>

        {/* Savings */}
        <div className="bg-teal-light rounded-card p-4 mb-3">
          <p className="text-xs text-teal font-medium">{i('est_savings')}</p>
          <p className="text-xs text-teal/70 mt-0.5">Since May 1st, 2026:</p>
          <p className="text-2xl font-bold text-teal mt-1">€11,000/year NOW</p>
          <p className="text-xs text-teal/70 mt-0.5">→ €72,500/year fully phased in</p>
          <button
            onClick={() => setActiveTab('calculator')}
            className="mt-2 text-xs text-teal font-medium underline"
          >
            Recalculate →
          </button>
        </div>

        {/* Expert */}
        <button
          onClick={() => setActiveTab('advise')}
          className="w-full bg-card rounded-card p-4 shadow-card mb-3 flex items-center justify-between"
        >
          <div>
            <p className="text-sm font-semibold text-foreground">{i('my_expert')}</p>
            <p className="text-xs text-teal mt-0.5">Find your expert →</p>
          </div>
          <ChevronRight size={16} className="text-text-secondary" />
        </button>

        {/* Alert settings */}
        <div className="bg-card rounded-card p-4 shadow-card">
          <p className="text-sm font-semibold text-foreground mb-3">{i('alert_settings')}</p>
          {[
            'My sector alerts',
            'iTA implementation updates',
            'CJEU proceedings (EP challenge)',
            'Safeguard clause triggers',
            'New tariff schedule updates',
            'New expert articles',
          ].map((label, idx) => (
            <div key={idx} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <span className="text-xs text-foreground">{label}</span>
              <div className={`w-9 h-5 rounded-full flex items-center px-0.5 transition-colors ${idx < 4 ? 'bg-teal justify-end' : 'bg-border justify-start'}`}>
                <div className="w-4 h-4 rounded-full bg-primary-foreground shadow-sm" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
