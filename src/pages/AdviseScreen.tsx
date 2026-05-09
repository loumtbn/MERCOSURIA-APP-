import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Star, ChevronRight, Clock, Shield, Info } from 'lucide-react';
import { useApp } from '@/lib/AppContext';
import { EXPERTS, SECTORS } from '@/lib/data';
import TopBar from '@/components/TopBar';
import Disclaimer from '@/components/Disclaimer';

const FILTERS = ['All', '🌾 Agri', '🚗 Auto', '🌿 Environment', '💰 Tax', '⚖️ Trade', '🇧🇷 Brazil', '🇦🇷 Argentina', '🇫🇷 France', '🎓 Clinics'];

export default function AdviseScreen() {
  const { i, user } = useApp();
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const sectorLabel = SECTORS.find(s => s.id === user.sector)?.label;

  return (
    <div className="min-h-screen bg-background pb-24">
      <TopBar />

      <div className="px-5 pt-4">
        <h2 className="text-lg font-bold text-foreground">{i('advise_title')}</h2>
        <p className="text-xs text-text-secondary mb-4">{i('advise_sub')}</p>

        {/* Urgency box */}
        <div className="bg-teal-light rounded-card p-4 mb-4 flex items-start gap-2">
          <Info size={14} className="text-teal flex-shrink-0 mt-0.5" />
          <p className="text-xs text-teal leading-relaxed">
            The iTA entered into force May 1st. Businesses have weeks to adapt. Our verified experts are ready.
          </p>
        </div>

        {/* Smart matching */}
        {user.sector && (
          <div className="bg-card rounded-card p-4 shadow-card mb-4">
            <p className="text-xs text-text-secondary">Based on your last analysis:</p>
            <p className="text-sm font-semibold text-foreground mt-1">{sectorLabel}</p>
            <p className="text-xs text-teal font-medium mt-1">{EXPERTS.length} specialists available NOW</p>
          </div>
        )}

        {/* Search */}
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by sector, country, expertise..."
            className="w-full bg-card rounded-card py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-text-secondary/50 outline-none shadow-card"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-4 overflow-x-auto hide-scrollbar pb-1">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-pill text-xs font-medium whitespace-nowrap transition-all ${
                filter === f ? 'bg-teal text-primary-foreground' : 'bg-card text-text-secondary border border-border'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Expert cards */}
        <div className="flex flex-col gap-3">
          {EXPERTS.map((expert, idx) => (
            <motion.div
              key={expert.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              className={`rounded-card p-4 shadow-card ${expert.academic ? 'bg-status-blue-light border border-status-blue/20' : 'bg-card'}`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-11 h-11 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0 ${
                  expert.academic ? 'bg-status-blue text-primary-foreground' : 'bg-teal-light text-teal'
                }`}>
                  {expert.academic ? expert.initials : expert.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{expert.name}</p>
                  <p className="text-xs text-text-secondary">{expert.firm}</p>

                  <div className="flex flex-wrap gap-1 mt-2">
                    {expert.specializations.map(s => (
                      <span key={s} className="text-[10px] bg-background px-2 py-0.5 rounded-pill text-text-secondary">
                        {s}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-3 mt-2 text-[10px] text-text-secondary">
                    <span>{expert.location}</span>
                    <span>{expert.languages}</span>
                  </div>

                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-0.5">
                      <Star size={10} className="text-status-amber fill-status-amber" />
                      <span className="text-[10px] font-medium text-foreground">{expert.rating}</span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <Clock size={10} className="text-text-secondary" />
                      <span className="text-[10px] text-text-secondary">{expert.responseTime}</span>
                    </div>
                    {expert.verified && (
                      <div className="flex items-center gap-0.5">
                        <Shield size={10} className="text-teal" />
                        <span className="text-[10px] text-teal font-medium">MercosurAI Verified</span>
                      </div>
                    )}
                  </div>

                  {expert.price && (
                    <p className="text-xs font-medium text-foreground mt-2">{expert.price}</p>
                  )}

                  {expert.academic && (
                    <p className="text-[10px] text-status-blue mt-1">MercosurAI Academic Partner</p>
                  )}

                  <div className="flex gap-2 mt-3">
                    <button className="flex-1 py-2 bg-teal text-primary-foreground rounded-pill text-xs font-medium">
                      {expert.academic ? i('request_orientation') : i('book_consultation')} →
                    </button>
                    {!expert.academic && (
                      <button className="py-2 px-4 bg-card text-text-secondary rounded-pill text-xs font-medium border border-border">
                        {i('send_message')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <Disclaimer />
      </div>
    </div>
  );
}
