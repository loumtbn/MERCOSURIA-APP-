import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '@/lib/AppContext';
import { SCENARIOS, COMPARISON_ROWS } from '@/lib/data';
import TopBar from '@/components/TopBar';
import Disclaimer from '@/components/Disclaimer';

const MOCK_DATA: Record<string, string[]> = {
  'Direct export EU → Brazil (iTA applies)': ['12.3%', '0%', '€123,000', 'Medium', 'EUDR + CBAM', 'Low', '2 weeks', 'High', '7/10'],
  'Export via Uruguay (best iTA rates)': ['10.1%', '0%', '€101,000', 'Low', 'EUDR', 'Low', '3 weeks', 'Medium', '9/10'],
  'Export via Argentina': ['11.8%', '0%', '€118,000', 'Medium', 'EUDR + CBAM', 'Medium', '3 weeks', 'Very High', '5/10'],
  'Create subsidiary in Brazil': ['0%', '0%', '€45,000', 'High', 'Full local', 'High', '6 months', 'High', '6/10'],
  'Create subsidiary in Argentina': ['0%', '0%', '€38,000', 'High', 'Full local', 'High', '6 months', 'Very High', '4/10'],
  'License to local distributor': ['12.3%', '0%', '€123,000', 'Low', 'Distributor', 'Very Low', '1 month', 'Low', '8/10'],
  'Joint venture Mercosur partner': ['5%', '0%', '€50,000', 'Medium', 'Shared', 'Medium', '3 months', 'Medium', '7/10'],
};

export default function ComparatorScreen() {
  const { i, setActiveTab } = useApp();
  const [selected, setSelected] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);

  const toggleScenario = (s: string) => {
    if (selected.includes(s)) {
      setSelected(selected.filter(x => x !== s));
    } else if (selected.length < 3) {
      setSelected([...selected, s]);
    }
  };

  const bestIdx = selected.length > 0
    ? selected.reduce((best, s, idx) => {
        const score = parseInt(MOCK_DATA[s]?.[8] || '0');
        const bestScore = parseInt(MOCK_DATA[selected[best]]?.[8] || '0');
        return score > bestScore ? idx : best;
      }, 0)
    : 0;

  return (
    <div className="min-h-screen bg-background pb-24">
      <TopBar />

      <div className="px-5 pt-4">
        <h2 className="text-lg font-bold text-foreground">{i('comp_title')}</h2>
        <p className="text-xs text-text-secondary mb-5">{i('comp_sub')}</p>

        {!showResults ? (
          <>
            <p className="text-xs text-text-secondary mb-3">Select up to 3 scenarios:</p>
            <div className="flex flex-col gap-2 mb-5">
              {SCENARIOS.map(s => (
                <button
                  key={s}
                  onClick={() => toggleScenario(s)}
                  className={`w-full text-left px-4 py-3 rounded-card text-sm transition-all ${
                    selected.includes(s)
                      ? 'bg-teal text-primary-foreground shadow-card'
                      : 'bg-card text-text-secondary border border-border'
                  }`}
                >
                  <span className="mr-2">{selected.includes(s) ? '●' : '○'}</span>
                  {s}
                </button>
              ))}
            </div>

            <button
              onClick={() => selected.length >= 2 && setShowResults(true)}
              disabled={selected.length < 2}
              className={`w-full py-4 rounded-card text-sm font-semibold transition-all ${
                selected.length >= 2
                  ? 'bg-teal text-primary-foreground shadow-elevated active:scale-[0.98]'
                  : 'bg-card text-text-secondary'
              }`}
            >
              {i('compare')} →
            </button>
          </>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* Comparison table */}
            <div className="overflow-x-auto hide-scrollbar -mx-5 px-5 mb-5">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr>
                    <th className="text-left text-[10px] text-text-secondary font-medium py-2 pr-3 w-[140px]" />
                    {selected.map((s, idx) => (
                      <th key={s} className="text-center text-[10px] text-foreground font-semibold py-2 px-2 max-w-[120px]">
                        {s.split('(')[0].trim()}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON_ROWS.map((row, rIdx) => (
                    <tr key={row} className={rIdx % 2 === 0 ? 'bg-card' : ''}>
                      <td className="text-[10px] text-text-secondary py-2.5 pr-3 font-medium">{row}</td>
                      {selected.map((s, cIdx) => {
                        const val = MOCK_DATA[s]?.[rIdx] || '-';
                        const isLast = rIdx === COMPARISON_ROWS.length - 1;
                        const isBest = isLast && cIdx === bestIdx;
                        return (
                          <td key={s} className={`text-center text-[11px] py-2.5 px-2 ${isBest ? 'text-teal font-bold' : 'text-foreground'}`}>
                            {val}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Best strategy */}
            <div className="bg-teal-light rounded-card p-4 mb-4">
              <p className="text-xs font-semibold text-teal">{i('best_strategy')}:</p>
              <p className="text-sm font-bold text-teal mt-1">{selected[bestIdx]}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowResults(false); setSelected([]); }}
                className="flex-1 py-3 bg-card text-text-secondary rounded-card text-sm font-medium border border-border"
              >
                ↩ Reset
              </button>
              <button
                onClick={() => setActiveTab('advise')}
                className="flex-1 py-3 bg-teal text-primary-foreground rounded-card text-sm font-semibold shadow-card"
              >
                {i('get_expert')} →
              </button>
            </div>
          </motion.div>
        )}

        <Disclaimer />
      </div>
    </div>
  );
}
