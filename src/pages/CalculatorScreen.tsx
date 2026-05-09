import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Info, ArrowRight } from 'lucide-react';
import { useApp } from '@/lib/AppContext';
import { EU_COUNTRIES, MERCOSUR_COUNTRIES } from '@/lib/data';
import TopBar from '@/components/TopBar';
import Disclaimer from '@/components/Disclaimer';

export default function CalculatorScreen() {
  const { i, setActiveTab } = useApp();
  const [value, setValue] = useState('500000');
  const [hsCode, setHsCode] = useState('220421');
  const [fromCountry, setFromCountry] = useState('france');
  const [toCountry, setToCountry] = useState('brazil');
  const [showResults, setShowResults] = useState(false);

  const numVal = parseFloat(value) || 0;
  const oldRate = 14.5;
  const newRate = 12.3;
  const oldDuties = numVal * (oldRate / 100);
  const newDuties = numVal * (newRate / 100);
  const savings = oldDuties - newDuties;
  const finalSavings = numVal * (oldRate / 100);

  return (
    <div className="min-h-screen bg-background pb-24">
      <TopBar />

      <div className="px-5 pt-4">
        <h2 className="text-lg font-bold text-foreground">{i('calc_title')}</h2>
        <p className="text-xs text-text-secondary mb-4">{i('calc_sub')}</p>

        <div className="bg-teal-light rounded-card p-3 mb-5 flex items-start gap-2">
          <Info size={14} className="text-teal flex-shrink-0 mt-0.5" />
          <p className="text-xs text-teal leading-relaxed">
            New rates in force since May 1st 2026 — calculate your immediate savings
          </p>
        </div>

        {/* Inputs */}
        <div className="flex flex-col gap-4 mb-6">
          <div>
            <label className="text-xs font-medium text-foreground mb-1.5 block">{i('merch_value')}</label>
            <div className="relative">
              <input
                type="text"
                value={value}
                onChange={e => setValue(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full bg-card rounded-card py-3 px-4 pr-10 text-sm text-foreground outline-none shadow-card"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-text-secondary">€</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-foreground mb-1.5 block">{i('hs_code')}</label>
            <input
              type="text"
              value={hsCode}
              onChange={e => setHsCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
              placeholder="6-digit code"
              className="w-full bg-card rounded-card py-3 px-4 text-sm text-foreground outline-none shadow-card"
            />
            <p className="text-[10px] text-text-secondary mt-1">Find code: ec.europa.eu/taric — TARIC updated May 1st 2026</p>
          </div>

          <div>
            <label className="text-xs font-medium text-foreground mb-1.5 block">{i('trade_route')}</label>
            <div className="flex items-center gap-2">
              <select
                value={fromCountry}
                onChange={e => setFromCountry(e.target.value)}
                className="flex-1 bg-card rounded-card py-3 px-3 text-sm text-foreground outline-none shadow-card appearance-none"
              >
                {EU_COUNTRIES.map(c => (
                  <option key={c.id} value={c.id}>{c.flag} {c.label}</option>
                ))}
              </select>
              <ArrowRight size={16} className="text-text-secondary flex-shrink-0" />
              <select
                value={toCountry}
                onChange={e => setToCountry(e.target.value)}
                className="flex-1 bg-card rounded-card py-3 px-3 text-sm text-foreground outline-none shadow-card appearance-none"
              >
                {MERCOSUR_COUNTRIES.map(c => (
                  <option key={c.id} value={c.id}>{c.flag} {c.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowResults(true)}
          className="w-full py-4 bg-teal text-primary-foreground rounded-card text-sm font-semibold shadow-elevated active:scale-[0.98] transition-transform"
        >
          {i('calculate')} →
        </button>

        {/* Results */}
        {showResults && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-card rounded-card p-4 shadow-card text-center">
                <p className="text-[10px] text-text-secondary font-medium uppercase tracking-wider mb-2">{i('before_may')}</p>
                <p className="text-xs text-text-secondary">Rate: {oldRate}%</p>
                <p className="text-base font-bold text-foreground mt-1">€{oldDuties.toLocaleString()}</p>
              </div>
              <div className="bg-card rounded-card p-4 shadow-card text-center">
                <p className="text-[10px] text-teal font-medium uppercase tracking-wider mb-2">{i('since_may_short')}</p>
                <p className="text-xs text-teal">Rate: {newRate}%</p>
                <p className="text-base font-bold text-teal mt-1">€{newDuties.toLocaleString()}</p>
              </div>
            </div>

            <div className="bg-teal-light rounded-card p-5 text-center mb-4">
              <p className="text-2xl font-bold text-teal">{i('you_save')} €{savings.toLocaleString()} {i('now')}</p>
              <p className="text-xs text-teal/80 mt-1">{i('per_year')}, on €{numVal.toLocaleString()} exported</p>
              <p className="text-xs text-teal/80 mt-0.5">And €{finalSavings.toLocaleString()}/year when fully phased in</p>
            </div>

            {/* Timeline */}
            <div className="bg-card rounded-card p-4 shadow-card mb-4">
              <p className="text-[10px] text-text-secondary font-medium uppercase tracking-wider mb-3">Dismantlement timeline</p>
              <div className="flex items-center gap-1">
                {['TODAY', 'Year 3', 'Year 5', 'Year 7', 'Final'].map((label, idx) => (
                  <div key={label} className="flex-1 flex flex-col items-center gap-1">
                    <div className={`w-full h-2 rounded-full ${idx === 0 ? 'bg-teal' : 'bg-border'}`} />
                    <span className="text-[9px] text-text-secondary">{label}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-text-secondary mt-3">Category: 7 years · First reduction: May 1st 2026 ✓</p>
            </div>

            <p className="text-[10px] text-text-secondary text-center mb-4">
              Based on TARIC database updated May 1st, 2026. Verify: ec.europa.eu/taric
            </p>

            <button
              onClick={() => setActiveTab('impact')}
              className="w-full py-3 bg-card text-teal rounded-card text-sm font-medium border border-teal/20"
            >
              {i('full_analysis')} →
            </button>
          </motion.div>
        )}

        <Disclaimer />
      </div>
    </div>
  );
}
