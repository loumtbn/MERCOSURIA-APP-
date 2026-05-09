import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/lib/AppContext';
import { SECTORS } from '@/lib/data';
import { ChevronRight, Check } from 'lucide-react';

const slides = [
  { icon: '⚖️', titleKey: 'onb1_title', subKey: 'onb1_sub' },
  { icon: '⚡', titleKey: 'onb2_title', subKey: 'onb2_sub' },
  { icon: '🌍', titleKey: 'onb3_title', subKey: 'onb3_sub' },
];

export default function Onboarding() {
  const { i, user, setUser } = useApp();
  const [step, setStep] = useState(0);
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const handleFinish = () => {
    if (!selectedSector) return;
    const sector = SECTORS.find(s => s.id === selectedSector);
    setConfirmed(true);
    setTimeout(() => {
      setUser(prev => ({ ...prev, sector: selectedSector, onboarded: true }));
    }, 2000);
  };

  if (confirmed) {
    const sector = SECTORS.find(s => s.id === selectedSector);
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-8 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="w-20 h-20 rounded-full bg-teal-light flex items-center justify-center mb-6"
        >
          <Check size={36} className="text-teal" strokeWidth={3} />
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-lg font-semibold text-foreground"
        >
          {i('perfect')}
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-lg font-semibold text-teal mt-1"
        >
          {sector?.emoji} {sector?.label}
        </motion.p>
      </div>
    );
  }

  const isLastInfoSlide = step < 3;
  const isSectorSlide = step === 3;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Skip */}
      {step < 3 && (
        <div className="flex justify-end px-5 pt-4">
          <button
            onClick={() => setStep(3)}
            className="text-xs text-text-secondary font-medium"
          >
            {i('skip')}
          </button>
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <AnimatePresence mode="wait">
          {isLastInfoSlide && (
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -60 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center"
            >
              <span className="text-5xl mb-6">{slides[step].icon}</span>
              <h1 className="text-2xl font-bold text-foreground mb-3 leading-tight">
                {i(slides[step].titleKey)}
              </h1>
              <p className="text-sm text-text-secondary leading-relaxed max-w-xs">
                {i(slides[step].subKey)}
              </p>
            </motion.div>
          )}

          {isSectorSlide && (
            <motion.div
              key="sector"
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col items-center w-full"
            >
              <span className="text-5xl mb-6">🎯</span>
              <h1 className="text-2xl font-bold text-foreground mb-1">
                {i('onb4_title')}
              </h1>
              <p className="text-sm text-text-secondary mb-6">{i('onb4_sub')}</p>

              <div className="flex flex-wrap justify-center gap-2 max-w-sm">
                {SECTORS.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSector(s.id)}
                    className={`px-4 py-2 rounded-pill text-sm font-medium transition-all active:scale-95 ${
                      selectedSector === s.id
                        ? 'bg-teal text-primary-foreground shadow-card'
                        : 'bg-card text-text-secondary border border-border'
                    }`}
                  >
                    {s.emoji} {s.label}
                  </button>
                ))}
              </div>

              <p className="text-[11px] text-text-secondary mt-4">{i('change_anytime')}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom area */}
      <div className="px-8 pb-10">
        {/* Dots */}
        <div className="flex justify-center gap-2 mb-6">
          {[0, 1, 2, 3].map(idx => (
            <span
              key={idx}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === step ? 'bg-teal w-6' : 'bg-border'
              }`}
            />
          ))}
        </div>

        {isLastInfoSlide ? (
          <button
            onClick={() => setStep(step + 1)}
            className="w-full py-4 bg-card rounded-card text-sm font-medium text-foreground flex items-center justify-center gap-1 shadow-card active:scale-[0.98] transition-transform"
          >
            {i('next')} <ChevronRight size={16} />
          </button>
        ) : (
          <button
            onClick={handleFinish}
            disabled={!selectedSector}
            className={`w-full py-4 rounded-card text-sm font-semibold flex items-center justify-center gap-1 transition-all active:scale-[0.98] ${
              selectedSector
                ? 'bg-teal text-primary-foreground shadow-elevated'
                : 'bg-card text-text-secondary'
            }`}
          >
            {i('get_started')} <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
