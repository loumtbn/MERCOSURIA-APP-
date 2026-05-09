import React from 'react';
import { motion } from 'framer-motion';
import { Search, Globe, Newspaper, ChevronRight, Rocket } from 'lucide-react';
import { useApp } from '@/lib/AppContext';
import TopBar from '@/components/TopBar';
import LiveBanner from '@/components/LiveBanner';

const cardDelay = (i: number) => ({ initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.1 + i * 0.1 } });

export default function HomeScreen() {
  const { i, setActiveTab } = useApp();

  return (
    <div className="min-h-screen bg-background pb-24">
      <TopBar />
      <LiveBanner />

      <div className="px-5 pt-8 pb-4">
        <h1 className="text-2xl font-bold text-foreground leading-tight mb-2">
          {i('hero_title')}
        </h1>
        <p className="text-sm text-text-secondary leading-relaxed">
          {i('hero_sub')}
        </p>
      </div>

      <div className="px-5 flex flex-col gap-3">
        {/* Card 1 */}
        <motion.button
          {...cardDelay(0)}
          onClick={() => setActiveTab('impact')}
          className="w-full bg-card rounded-card p-5 shadow-card text-left active:scale-[0.98] transition-transform"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <span className="text-2xl mb-2 block">🔍</span>
              <h3 className="text-base font-semibold text-foreground mb-1">
                {i('card1_title')}
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                {i('card1_sub')}
              </p>
              <span className="inline-block mt-3 text-[10px] font-medium text-teal bg-teal-light px-2.5 py-1 rounded-pill">
                {i('live_badge')}
              </span>
            </div>
            <ChevronRight size={18} className="text-text-secondary mt-1 flex-shrink-0" />
          </div>
        </motion.button>

        {/* Card 2 */}
        <motion.button
          {...cardDelay(1)}
          onClick={() => setActiveTab('countries')}
          className="w-full bg-card rounded-card p-5 shadow-card text-left active:scale-[0.98] transition-transform"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <span className="text-2xl mb-2 block">🌍</span>
              <h3 className="text-base font-semibold text-foreground mb-1">
                {i('card2_title')}
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                {i('card2_sub')}
              </p>
            </div>
            <ChevronRight size={18} className="text-text-secondary mt-1 flex-shrink-0" />
          </div>
        </motion.button>

        {/* Card 3 */}
        <motion.button
          {...cardDelay(2)}
          onClick={() => setActiveTab('news')}
          className="w-full bg-card rounded-card p-5 shadow-card text-left active:scale-[0.98] transition-transform"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <span className="text-2xl mb-2 block">📰</span>
              <h3 className="text-base font-semibold text-foreground mb-1">
                {i('card3_title')}
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                {i('card3_sub')}
              </p>
            </div>
            <ChevronRight size={18} className="text-text-secondary mt-1 flex-shrink-0" />
          </div>
        </motion.button>
      </div>

      {/* Founder banner */}
      <motion.div {...cardDelay(3)} className="mx-5 mt-5">
        <button
          onClick={() => setActiveTab('early-access')}
          className="w-full bg-teal rounded-card p-5 text-left active:scale-[0.98] transition-transform shadow-elevated"
        >
          <div className="flex items-center gap-3">
            <Rocket size={20} className="text-primary-foreground flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-primary-foreground">
                {i('founder_title')}
              </p>
              <p className="text-xs text-primary-foreground/80 mt-0.5">
                {i('founder_sub')}
              </p>
            </div>
          </div>
        </button>
      </motion.div>

      <p className="text-[11px] text-text-secondary text-center mt-6 px-8">
        {i('trust_line')}
      </p>
    </div>
  );
}
