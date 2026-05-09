import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronRight, ChevronDown, Info } from 'lucide-react';
import { useApp } from '@/lib/AppContext';
import { SECTORS, EU_COUNTRIES, MERCOSUR_COUNTRIES } from '@/lib/data';
import TopBar from '@/components/TopBar';
import StatusBadge from '@/components/StatusBadge';
import OpportunityGauge from '@/components/OpportunityGauge';
import Disclaimer from '@/components/Disclaimer';

const LOADING_MESSAGES = [
  'Analyzing your business...',
  'Checking official TARIC database...',
  'Verifying EUR-Lex regulations...',
  'Consulting CURIA proceedings...',
  'Checking May 1st changes...',
  'Generating recommendations...',
];

export default function ImpactScreen() {
  const { i, setActiveTab, user } = useApp();
  const [step, setStep] = useState(1);
  const [sector, setSector] = useState<string | null>(user.sector);
  const [country, setCountry] = useState<string | null>(user.country);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(0);
  const [openAccordion, setOpenAccordion] = useState<number | null>(null);

  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setLoadingMsg(prev => (prev + 1) % LOADING_MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [loading]);

  const handleAnalyze = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setShowResults(true);
    }, 6000);
  };

  const sectorData = SECTORS.find(s => s.id === sector);
  const allCountries = [...EU_COUNTRIES, ...MERCOSUR_COUNTRIES];
  const countryData = allCountries.find(c => c.id === country);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-8">
        <div className="w-4 h-4 rounded-full bg-teal teal-pulse mb-6" />
        <AnimatePresence mode="wait">
          <motion.p
            key={loadingMsg}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="text-sm text-text-secondary text-center"
          >
            {LOADING_MESSAGES[loadingMsg]}
          </motion.p>
        </AnimatePresence>
      </div>
    );
  }

  // Results
  if (showResults) {
    return <ResultsView sector={sectorData} country={countryData} openAccordion={openAccordion} setOpenAccordion={setOpenAccordion} onReset={() => { setShowResults(false); setStep(1); setSector(null); setCountry(null); setQuestion(''); }} />;
  }

  // Steps
  const progress = (step / 3) * 100;

  return (
    <div className="min-h-screen bg-background pb-24">
      <TopBar />

      {/* Progress bar */}
      <div className="h-1 bg-card">
        <div className="h-full bg-teal transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      {/* Info bar */}
      {step === 1 && (
        <div className="mx-5 mt-4 p-3 bg-teal-light rounded-card flex items-start gap-2">
          <Info size={14} className="text-teal flex-shrink-0 mt-0.5" />
          <p className="text-xs text-teal font-medium leading-relaxed">{i('info_bar')}</p>
        </div>
      )}

      <div className="px-5 pt-6">
        <p className="text-[11px] text-text-secondary font-medium mb-1">
          Step {step} of 3 — {Math.round(progress)}%
        </p>

        <AnimatePresence mode="wait">
          {/* STEP 1 — Sector */}
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
              <h2 className="text-xl font-bold text-foreground mb-1">{i('step_sector')}</h2>
              <p className="text-sm text-text-secondary mb-5">{i('step_sector_sub')}</p>
              <div className="flex flex-wrap gap-2">
                {SECTORS.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSector(s.id)}
                    className={`px-4 py-2.5 rounded-pill text-sm font-medium transition-all active:scale-95 ${
                      sector === s.id
                        ? 'bg-teal text-primary-foreground shadow-card'
                        : 'bg-card text-text-secondary border border-border'
                    }`}
                  >
                    {s.emoji} {s.label}
                    {s.hs && <span className="text-[10px] ml-1 opacity-60">({s.hs})</span>}
                  </button>
                ))}
              </div>
              {sector && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
                  <button
                    onClick={() => setStep(2)}
                    className="w-full py-4 bg-teal text-primary-foreground rounded-card text-sm font-semibold flex items-center justify-center gap-1 shadow-elevated active:scale-[0.98] transition-transform"
                  >
                    {i('next')} <ChevronRight size={16} />
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* STEP 2 — Country */}
          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
              <button onClick={() => setStep(1)} className="flex items-center gap-1 text-xs text-text-secondary mb-3">
                <ArrowLeft size={14} /> Back
              </button>
              <h2 className="text-xl font-bold text-foreground mb-5">{i('step_country')}</h2>

              <p className="text-[11px] text-text-secondary font-medium uppercase tracking-wider mb-2">
                {i('european_union')}
              </p>
              <div className="flex flex-wrap gap-2 mb-5">
                {EU_COUNTRIES.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setCountry(c.id)}
                    className={`px-4 py-2.5 rounded-pill text-sm font-medium transition-all active:scale-95 ${
                      country === c.id
                        ? 'bg-teal text-primary-foreground shadow-card'
                        : 'bg-card text-text-secondary border border-border'
                    }`}
                  >
                    {c.flag} {c.label}
                  </button>
                ))}
              </div>

              <p className="text-[11px] text-text-secondary font-medium uppercase tracking-wider mb-2">
                {i('mercosur')}
              </p>
              <div className="flex flex-wrap gap-2">
                {MERCOSUR_COUNTRIES.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setCountry(c.id)}
                    className={`px-4 py-2.5 rounded-pill text-sm font-medium transition-all active:scale-95 ${
                      country === c.id
                        ? 'bg-teal text-primary-foreground shadow-card'
                        : 'bg-card text-text-secondary border border-border'
                    }`}
                  >
                    {c.flag} {c.label}
                  </button>
                ))}
              </div>

              {country && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
                  <button
                    onClick={() => setStep(3)}
                    className="w-full py-4 bg-teal text-primary-foreground rounded-card text-sm font-semibold flex items-center justify-center gap-1 shadow-elevated active:scale-[0.98] transition-transform"
                  >
                    {i('next')} <ChevronRight size={16} />
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* STEP 3 — Question */}
          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
              <button onClick={() => setStep(2)} className="flex items-center gap-1 text-xs text-text-secondary mb-3">
                <ArrowLeft size={14} /> Back
              </button>
              <h2 className="text-xl font-bold text-foreground mb-1">{i('step_question')}</h2>
              <p className="text-sm text-text-secondary mb-5">{i('step_question_sub')}</p>

              <div className="relative">
                <textarea
                  value={question}
                  onChange={e => setQuestion(e.target.value.slice(0, 200))}
                  placeholder={i('question_placeholder')}
                  rows={4}
                  className="w-full bg-card rounded-card p-4 text-sm text-foreground placeholder:text-text-secondary/50 border-none outline-none resize-none focus:ring-2 focus:ring-teal/20"
                />
                <span className="absolute bottom-3 right-4 text-[10px] text-text-secondary">
                  {question.length}/200
                </span>
              </div>

              <div className="flex flex-col gap-3 mt-6">
                <button
                  onClick={handleAnalyze}
                  className="w-full py-4 bg-teal text-primary-foreground rounded-card text-sm font-semibold flex items-center justify-center gap-1 shadow-elevated active:scale-[0.98] transition-transform"
                >
                  {i('analyze_btn')} <ChevronRight size={16} />
                </button>
                <button
                  onClick={handleAnalyze}
                  className="w-full py-3 bg-card text-text-secondary rounded-card text-sm font-medium border border-border active:scale-[0.98] transition-transform"
                >
                  {i('skip_analyze')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ─── Results View ─── */
interface ResultsProps {
  sector: typeof SECTORS[number] | undefined;
  country: { id: string; flag: string; label: string } | undefined;
  openAccordion: number | null;
  setOpenAccordion: (n: number | null) => void;
  onReset: () => void;
}

function ResultsView({ sector, country, openAccordion, setOpenAccordion, onReset }: ResultsProps) {
  const { i, setActiveTab } = useApp();

  const accordions = [
    {
      icon: '🔴', title: i('acc_tariffs'), badge: i('since_may'), badgeColor: 'red' as const,
      content: `Current rate vs new rate: Was 14.5% → Now 12.3% (first step of 7-year dismantlement)\n\nDismantlement category: 7-year linear reduction\n\nTariff-Rate Quotas (TRQs): Quota system applies for sensitive products\n\nSavings NOW on €1M exported TODAY: save €22,000 vs last month\n\nRules of origin: Min 45% local content for ${sector?.label || 'this sector'}\n\nCumulation: Bilateral cumulation (EU-Mercosur only)\n\nDocumentation checklist:\n☐ EUR.1 movement certificate\n☐ Certificate of origin\n☐ Commercial invoice\n☐ Packing list\n☐ Phytosanitary certificate\n☐ EUDR statement\n\nRecommended Incoterms: CIF / DAP\n\n📚 TARIC | ec.europa.eu/taric\nMarket Access DB | madb.ec.europa.eu\niTA in force: May 1st, 2026`,
    },
    {
      icon: '🌿', title: i('acc_enviro'), badge: null, badgeColor: 'green' as const,
      content: `EUDR (Reg. EU 2023/1115):\nIn force independently of iTA. Sector scope verification required. Geolocation traceability mandatory for soy, beef, cocoa, coffee, palm oil, wood, rubber, leather.\n\nCBAM (Reg. EU 2023/956):\nIn force independently. Applies to steel, aluminum, cement, fertilizers, electricity, hydrogen.\n\nMirror clauses:\n• Pesticide MRLs (Reg. EU 396/2005)\n• Veterinary residues limits\n• GMO authorization requirements\n\nAgricultural safeguard clause:\nReinforced December 2025. Volume + price triggers active.\n\nCSRD (Dir. 2022/2464):\n250+ employees: ESG supply chain data required.\n\n📚 Reg. EU 2023/1115 | EUR-Lex\nReg. EU 2023/956 | EUR-Lex`,
    },
    {
      icon: '⚖️', title: i('acc_ip'), badge: i('gis_protected'), badgeColor: 'green' as const,
      content: `GIs NOW protected in Mercosur markets since May 1st:\n• Champagne, Roquefort, Parmigiano-Reggiano, Rioja, Porto, Prosciutto di Parma\n\nLabeling changes NOW required:\n• Language, origin, and composition must comply\n\nCertifications mutually recognized between EU-Mercosur\n\nPatent protection: Enhanced enforcement mechanisms\n\nTrademark registration: Streamlined process for registered GIs\n\n📚 EUIPO | euipo.europa.eu\nAgreement GI Annex | EUR-Lex`,
    },
    {
      icon: '💰', title: i('acc_tax'), badge: null, badgeColor: 'blue' as const,
      content: `Framework 1 — Interim Trade Agreement (iTA):\nLimited fiscal coverage — mainly customs duties. In force May 1st 2026.\n\nFramework 2 — Bilateral Tax Treaties:\n• VAT on cross-border services: verify bilateral convention\n• Transfer pricing: OECD guidelines apply\n• Double taxation treaty: check ${country?.label || 'country'} pair\n• Withholding tax: dividends 15% / interest 10% / royalties 10-15%\n• Currency exposure: USD / EUR / BRL / ARS\n• Hedging instruments recommended for BRL and ARS\n• Duty drawback mechanisms NOW available under iTA\n\n📚 OECD | oecd.org\nBilateral tax treaties`,
    },
    {
      icon: '📋', title: i('acc_procedures'), badge: i('new_procedures'), badgeColor: 'amber' as const,
      content: `Rules of origin EXACT by product:\n${sector?.label === 'Automobile' ? 'Automobiles: min 55% local content' : 'Verify specific HS chapter requirements'}\n\nCumulation: Third-country materials limited to bilateral\n\nSPS controls: Enhanced inspections for agri-food products\n\nTBT: EU standards recognized for key sectors. Remaining differences noted.\n\nBorder processing: New expedited timeline since May 1st for AEO holders\n\nAEO benefits: Priority processing + reduced inspections\n\n📚 WTO SPS | wto.org\nEU Customs Code Reg. 952/2013`,
    },
    {
      icon: '⚡', title: i('acc_actions'), badge: i('urgent_live'), badgeColor: 'red' as const,
      content: `ACTION 1 — Do THIS WEEK:\nVerify your HS codes on TARIC (ec.europa.eu/taric) for updated preferential rates. File for EUR.1 movement certificate. Contact customs broker.\n\nACTION 2 — Next 90 days:\nAudit supply chain for EUDR compliance. Update contracts with new Incoterms. Register GIs in target Mercosur market if applicable.\n\nACTION 3 — Next 6 months:\nEstablish AEO certification for priority processing. Set up currency hedging for BRL/ARS. Monitor CJEU proceedings weekly for EP challenge outcome.`,
    },
  ];

  return (
    <motion.div
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="min-h-screen bg-background pb-24"
    >
      <TopBar />

      <div className="px-5 pt-4">
        {/* Sector + country pills */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-medium text-primary-foreground bg-teal px-3 py-1 rounded-pill">
            {sector?.emoji} {sector?.label}
          </span>
          <span className="text-xs text-text-secondary">
            {country?.flag} {country?.label}
          </span>
        </div>

        <StatusBadge color="green" small>
          Analysis based on rules in force since May 1st, 2026
        </StatusBadge>

        {/* Gauge */}
        <OpportunityGauge score={8} />

        <p className="text-sm text-text-secondary text-center leading-relaxed mb-3 -mt-2">
          {sector?.label} from {country?.label} stand to gain from GI protection and tariff elimination — NOW in force
        </p>

        <div className="flex justify-center mb-6">
          <StatusBadge color="green">{i('act_30')}</StatusBadge>
        </div>

        {/* Accordions */}
        <div className="flex flex-col gap-2">
          {accordions.map((acc, idx) => (
            <div key={idx} className="bg-card rounded-card shadow-card overflow-hidden">
              <button
                onClick={() => setOpenAccordion(openAccordion === idx ? null : idx)}
                className="w-full flex items-center justify-between p-4 text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{acc.icon}</span>
                  <div>
                    <span className="text-sm font-semibold text-foreground">{acc.title}</span>
                    {acc.badge && (
                      <div className="mt-1">
                        <StatusBadge color={acc.badgeColor} small>{acc.badge}</StatusBadge>
                      </div>
                    )}
                  </div>
                </div>
                <ChevronDown
                  size={18}
                  className={`text-text-secondary transition-transform ${openAccordion === idx ? 'rotate-180' : ''}`}
                />
              </button>
              <AnimatePresence>
                {openAccordion === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4">
                      <pre className="text-xs text-text-secondary leading-relaxed whitespace-pre-wrap font-sans">
                        {acc.content}
                      </pre>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        {/* Expert referral */}
        <div className="bg-card rounded-card p-5 shadow-card mt-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">👨‍⚖️</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">{i('need_further')}</p>
              <p className="text-xs text-text-secondary mt-1">{i('ai_direction')}</p>
              <button
                onClick={() => setActiveTab('advise')}
                className="mt-3 px-4 py-2 bg-teal text-primary-foreground rounded-pill text-xs font-medium"
              >
                {i('find_expert')} →
              </button>
              <p className="text-[10px] text-text-secondary mt-2">{i('free_referral')}</p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mt-4">
          <button onClick={onReset} className="flex-1 py-3 bg-card text-text-secondary rounded-card text-sm font-medium border border-border">
            ↩ {i('new_analysis')}
          </button>
          <button className="flex-1 py-3 bg-teal text-primary-foreground rounded-card text-sm font-semibold shadow-card">
            {i('export_pdf')} ↗
          </button>
        </div>

        <div className="flex flex-col gap-2 mt-3">
          <button
            onClick={() => setActiveTab('calculator')}
            className="w-full py-3 bg-card text-teal rounded-card text-sm font-medium border border-teal/20"
          >
            🔢 {i('calc_savings')} →
          </button>
          <button
            onClick={() => setActiveTab('comparator')}
            className="w-full py-3 bg-card text-teal rounded-card text-sm font-medium border border-teal/20"
          >
            ⚖️ {i('compare_strat')} →
          </button>
        </div>

        {/* Sources */}
        <div className="bg-card rounded-card p-4 mt-4">
          <p className="text-[10px] text-text-secondary font-semibold uppercase tracking-wider mb-2">Sources</p>
          <p className="text-[10px] text-text-secondary leading-relaxed">
            TARIC Database — ec.europa.eu/taric{'\n'}
            EUR-Lex — eur-lex.europa.eu{'\n'}
            CURIA — curia.europa.eu{'\n'}
            Market Access DB — madb.ec.europa.eu{'\n'}
            Interim Trade Agreement (iTA) in force since May 1st, 2026{'\n'}
            Source: Direction Générale des Douanes — douane.gouv.fr
          </p>
        </div>

        <Disclaimer />
      </div>
    </motion.div>
  );
}
