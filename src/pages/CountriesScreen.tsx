import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, AlertTriangle, Info } from 'lucide-react';
import { useApp } from '@/lib/AppContext';
import { COUNTRY_DATA, DISPUTES } from '@/lib/data';
import TopBar from '@/components/TopBar';
import StatusBadge from '@/components/StatusBadge';
import Disclaimer from '@/components/Disclaimer';

type Tab = 'countries' | 'disputes';
type Filter = 'all' | 'mercosur' | 'eu' | 'alerts';

export default function CountriesScreen() {
  const { i } = useApp();
  const [tab, setTab] = useState<Tab>('countries');
  const [filter, setFilter] = useState<Filter>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = COUNTRY_DATA.filter(c => {
    if (filter === 'all') return true;
    if (filter === 'mercosur') return c.bloc === 'Mercosur';
    if (filter === 'eu') return c.bloc === 'EU';
    if (filter === 'alerts') return !!c.alert;
    return true;
  });

  return (
    <div className="min-h-screen bg-background pb-24">
      <TopBar />

      <div className="px-5 pt-4">
        {/* Toggle */}
        <div className="flex bg-card rounded-pill p-1 mb-4">
          <button
            onClick={() => setTab('countries')}
            className={`flex-1 py-2.5 rounded-pill text-xs font-medium transition-all ${
              tab === 'countries' ? 'bg-teal text-primary-foreground shadow-card' : 'text-text-secondary'
            }`}
          >
            🌍 {i('agreement_status')}
          </button>
          <button
            onClick={() => setTab('disputes')}
            className={`flex-1 py-2.5 rounded-pill text-xs font-medium transition-all ${
              tab === 'disputes' ? 'bg-teal text-primary-foreground shadow-card' : 'text-text-secondary'
            }`}
          >
            ⚖️ {i('legal_disputes')}
          </button>
        </div>

        {tab === 'countries' && (
          <>
            <h2 className="text-lg font-bold text-foreground">{i('agreement_status')}</h2>
            <p className="text-xs text-text-secondary mb-3">{i('countries_sub')}</p>

            <div className="flex items-center gap-1.5 mb-4">
              <span className="w-2 h-2 rounded-full bg-teal pulse-dot" />
              <span className="text-xs font-medium text-teal">Live</span>
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-4 overflow-x-auto hide-scrollbar">
              {(['all', 'mercosur', 'eu', 'alerts'] as Filter[]).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-pill text-xs font-medium whitespace-nowrap transition-all ${
                    filter === f ? 'bg-teal text-primary-foreground' : 'bg-card text-text-secondary border border-border'
                  }`}
                >
                  {f === 'all' ? i('all') : f === 'alerts' ? `🔴 ${i('alerts_label')}` : f === 'eu' ? '🇪🇺 EU' : 'Mercosur'}
                </button>
              ))}
            </div>

            {/* Info box */}
            <div className="bg-teal-light rounded-card p-4 mb-4 flex items-start gap-2">
              <Info size={14} className="text-teal flex-shrink-0 mt-0.5" />
              <p className="text-xs text-teal leading-relaxed">
                The Interim Trade Agreement (iTA) entered into force May 1st, 2026.
                The full Partnership Agreement (EMPA) still requires ratification by 27 national parliaments.
              </p>
            </div>

            {/* Country cards */}
            <div className="flex flex-col gap-2">
              {filtered.map(c => {
                const isOpen = expanded === c.id;
                const barColor = c.color === 'green' ? 'bg-teal' : c.color === 'red' ? 'bg-status-red' : 'bg-status-amber';

                return (
                  <div key={c.id} className="bg-card rounded-card shadow-card overflow-hidden">
                    <button onClick={() => setExpanded(isOpen ? null : c.id)} className="w-full flex items-center p-4 text-left">
                      <div className={`w-1 self-stretch rounded-full ${barColor} mr-3 flex-shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{c.flag}</span>
                          <div>
                            <span className="text-sm font-semibold text-foreground">{c.name}</span>
                            <span className="text-[10px] text-text-secondary ml-1.5">{c.bloc}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <StatusBadge color={c.color} small>{c.statusLabel}</StatusBadge>
                        {c.alert && <span className="w-2 h-2 rounded-full bg-status-red pulse-dot" />}
                        <ChevronDown size={16} className={`text-text-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                      </div>
                    </button>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 pl-8">
                            <ul className="space-y-1.5 mb-3">
                              {c.bullets.map((b, i) => (
                                <li key={i} className="text-xs text-text-secondary flex items-start gap-1.5">
                                  <span className="w-1 h-1 rounded-full bg-text-secondary mt-1.5 flex-shrink-0" />
                                  {b}
                                </li>
                              ))}
                            </ul>
                            {c.alert && (
                              <div className="flex items-start gap-2 bg-status-red-light rounded-lg p-3 mb-3">
                                <AlertTriangle size={14} className="text-status-red flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-status-red font-medium">{c.alert}</p>
                              </div>
                            )}
                            <div className="bg-background rounded-lg p-3">
                              <p className="text-[10px] text-text-secondary font-medium uppercase tracking-wider mb-1">Business impact</p>
                              <p className="text-xs text-foreground leading-relaxed">{c.impact}</p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {tab === 'disputes' && (
          <>
            <h2 className="text-lg font-bold text-foreground">{i('legal_disputes')}</h2>
            <p className="text-xs text-text-secondary mb-4">{i('disputes_sub')}</p>

            {/* Context box */}
            <div className="bg-teal-light rounded-card p-4 mb-4 flex items-start gap-2">
              <Info size={14} className="text-teal flex-shrink-0 mt-0.5" />
              <p className="text-xs text-teal leading-relaxed">
                The iTA entered into force May 1st 2026 despite ongoing legal challenges.
                These proceedings concern the full Partnership Agreement (EMPA), not the interim trade provisions.
              </p>
            </div>

            {/* CJEU */}
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-status-red pulse-dot" />
              <span className="text-xs font-semibold text-foreground">Active proceedings — CJEU</span>
            </div>

            <div className="flex flex-col gap-2 mb-4">
              {DISPUTES.map((d, idx) => (
                <div key={idx} className="bg-card rounded-card p-4 shadow-card">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-foreground">{d.title}</span>
                    <StatusBadge color={d.color} small>{d.status}</StatusBadge>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed mb-2">{d.description}</p>
                  <p className="text-xs text-foreground font-medium mb-1">Impact: {d.impact}</p>
                  <p className="text-[10px] text-text-secondary">⚠️ Verify: {d.source}</p>
                </div>
              ))}
            </div>

            {/* Business impact box */}
            <div className="bg-status-red-light rounded-card p-4 mb-4">
              <p className="text-xs text-status-red font-medium leading-relaxed">
                iTA is in force — tariff changes apply. BUT: if EP challenge succeeds,
                provisional application could be suspended. Recommendation: act on iTA benefits NOW
                but monitor CJEU proceedings weekly.
              </p>
            </div>

            {/* Opposing states */}
            <p className="text-xs font-semibold text-foreground mb-3">Opposing & monitoring states</p>
            <div className="flex flex-col gap-2 mb-4">
              {[
                { flag: '🇫🇷', name: 'France', status: 'Contesting', color: 'red' as const, note: 'Opposed iTA provisional application. Legal challenges ongoing.' },
                { flag: '🇦🇹', name: 'Austria', status: 'Contested', color: 'red' as const, note: 'Opposed — EMPA ratification uncertain.' },
                { flag: '🇮🇪', name: 'Ireland', status: 'Monitoring', color: 'amber' as const, note: 'Watching safeguard clause triggers for beef and dairy.' },
                { flag: '🇵🇱', name: 'Poland', status: 'Monitoring', color: 'amber' as const, note: 'Poultry and sugar safeguards active.' },
                { flag: '🇳🇱', name: 'Netherlands', status: 'Active', color: 'green' as const, note: 'Rotterdam port adapting to new flows.' },
              ].map((s, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-card rounded-card p-3 shadow-card">
                  <span className="text-lg">{s.flag}</span>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-foreground">{s.name}</span>
                    <p className="text-[10px] text-text-secondary mt-0.5">{s.note}</p>
                  </div>
                  <StatusBadge color={s.color} small>{s.status}</StatusBadge>
                </div>
              ))}
            </div>

            {/* Key distinction */}
            <div className="bg-card rounded-card p-4 shadow-card">
              <p className="text-xs font-semibold text-foreground mb-2">Key legal distinction</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] font-semibold text-teal mb-1">iTA (in force)</p>
                  <p className="text-[10px] text-text-secondary leading-relaxed">
                    Applies despite opposition. Covers: tariffs + trade procedures. Adopted: EU qualified majority only.
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-status-amber mb-1">EMPA (pending)</p>
                  <p className="text-[10px] text-text-secondary leading-relaxed">
                    Requires unanimity + 27 parliaments. Covers: full partnership. Timeline: uncertain — years away.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        <Disclaimer />
      </div>
    </div>
  );
}
