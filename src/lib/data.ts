export const SECTORS = [
  { id: 'agrifood', emoji: '🌾', label: 'Agri-food', hs: 'HS 1-24' },
  { id: 'automobile', emoji: '🚗', label: 'Automobile', hs: 'HS 87' },
  { id: 'textile', emoji: '👗', label: 'Textile', hs: 'HS 50-63' },
  { id: 'pharma', emoji: '💊', label: 'Pharma', hs: 'HS 30' },
  { id: 'chemistry', emoji: '⚗️', label: 'Chemistry', hs: 'HS 28-29' },
  { id: 'machinery', emoji: '⚙️', label: 'Machinery', hs: 'HS 84-85' },
  { id: 'wine', emoji: '🍷', label: 'Wine & Spirits', hs: 'HS 2204-2208' },
  { id: 'finance', emoji: '🏦', label: 'Finance', hs: '' },
  { id: 'tech', emoji: '💻', label: 'Tech & Digital', hs: '' },
  { id: 'energy', emoji: '⚡', label: 'Energy', hs: '' },
  { id: 'logistics', emoji: '🚢', label: 'Logistics', hs: '' },
];

export const EU_COUNTRIES = [
  { id: 'france', flag: '🇫🇷', label: 'France' },
  { id: 'germany', flag: '🇩🇪', label: 'Germany' },
  { id: 'spain', flag: '🇪🇸', label: 'Spain' },
  { id: 'italy', flag: '🇮🇹', label: 'Italy' },
  { id: 'netherlands', flag: '🇳🇱', label: 'Netherlands' },
  { id: 'belgium', flag: '🇧🇪', label: 'Belgium' },
  { id: 'portugal', flag: '🇵🇹', label: 'Portugal' },
];

export const MERCOSUR_COUNTRIES = [
  { id: 'brazil', flag: '🇧🇷', label: 'Brazil' },
  { id: 'argentina', flag: '🇦🇷', label: 'Argentina' },
  { id: 'uruguay', flag: '🇺🇾', label: 'Uruguay' },
  { id: 'paraguay', flag: '🇵🇾', label: 'Paraguay' },
];

export type StatusType = 'ahead' | 'active' | 'contested' | 'monitoring' | 'unpredictable' | 'implementing';

export interface CountryData {
  id: string;
  flag: string;
  name: string;
  bloc: string;
  status: StatusType;
  statusLabel: string;
  color: 'green' | 'red' | 'amber';
  bullets: string[];
  alert?: string;
  impact: string;
}

export const COUNTRY_DATA: CountryData[] = [
  {
    id: 'brazil', flag: '🇧🇷', name: 'Brazil', bloc: 'Mercosur',
    status: 'active', statusLabel: 'Active', color: 'green',
    bullets: [
      'iTA in force since May 1st 2026',
      'First tariff reductions NOW applying',
      'SISCOMEX updated for new procedures',
      'EMPA ratification ongoing — expected 2027',
      'Agricultural mirror clauses monitoring active',
    ],
    impact: 'Brazilian imports to EU: new tariff rates apply NOW — check your HS codes immediately',
  },
  {
    id: 'argentina', flag: '🇦🇷', name: 'Argentina', bloc: 'Mercosur',
    status: 'active', statusLabel: 'Active', color: 'green',
    bullets: [
      'iTA in force since May 1st 2026',
      'Milei government favorable — smooth implementation expected',
      'Peso/EUR exchange rate mechanism requires hedging strategy',
      'EMPA ratification in preparation',
    ],
    impact: 'Currency hedging essential for all EU-Argentina contracts under new tariff framework',
  },
  {
    id: 'uruguay', flag: '🇺🇾', name: 'Uruguay', bloc: 'Mercosur',
    status: 'ahead', statusLabel: 'Ahead', color: 'green',
    bullets: [
      'iTA in force — smoothest implementation',
      'Colonia free zone adapting to new flows',
      'Most favorable entry point confirmed',
    ],
    impact: 'Best hub strategy for EU companies entering Mercosur market',
  },
  {
    id: 'paraguay', flag: '🇵🇾', name: 'Paraguay', bloc: 'Mercosur',
    status: 'active', statusLabel: 'Active', color: 'amber',
    bullets: [
      'iTA in force — monitoring safeguards',
      'Soy sector safeguard clause active',
      'Transitional measures monitoring',
    ],
    impact: 'Agri-food: verify safeguard trigger thresholds for your volumes',
  },
  {
    id: 'france', flag: '🇫🇷', name: 'France', bloc: 'EU',
    status: 'contested', statusLabel: 'Contested', color: 'red',
    bullets: [
      'iTA in force despite French opposition',
      'FNSEA ongoing legal challenges',
      'Government monitoring safeguard clauses',
      'EMPA ratification uncertain',
    ],
    alert: 'France + others have saisied CJEU — full EMPA ratification at risk',
    impact: 'French agri-food: iTA applies but full agreement remains contested — monitor CJEU proceedings closely',
  },
  {
    id: 'germany', flag: '🇩🇪', name: 'Germany', bloc: 'EU',
    status: 'active', statusLabel: 'Active', color: 'green',
    bullets: [
      'iTA in force — auto sector benefiting',
      'BMW, VW, Mercedes: new tariff rates applying from May 1st',
      'CBAM procedures for Argentine steel fully operational',
    ],
    impact: 'German auto exporters: verify new preferential tariff rates — savings apply immediately',
  },
  {
    id: 'spain', flag: '🇪🇸', name: 'Spain', bloc: 'EU',
    status: 'active', statusLabel: 'Active', color: 'green',
    bullets: [
      'iTA in force — wine sector celebrating',
      'GIs now protected in Mercosur',
      'Olive oil new tariff rates applying',
    ],
    impact: 'Spanish wine and olive oil: GI protection active — register your brand in Mercosur NOW',
  },
  {
    id: 'eu', flag: '🇪🇺', name: 'EU Commission', bloc: 'EU',
    status: 'implementing', statusLabel: 'Implementing', color: 'green',
    bullets: [
      'iTA implementation underway',
      'TARIC updated for new rates May 1st',
      'Safeguard monitoring mechanism active',
      'EMPA ratification process ongoing',
    ],
    alert: 'European Parliament saisied CJEU — monitoring outcome',
    impact: 'All sectors: TARIC updated — verify your HS code new rate NOW at ec.europa.eu/taric',
  },
];

export interface DisputeData {
  title: string;
  status: string;
  color: 'red' | 'amber';
  description: string;
  impact: string;
  source: string;
}

export const DISPUTES: DisputeData[] = [
  {
    title: 'EP v Commission — iTA legality',
    status: 'ACTIVE',
    color: 'red',
    description: "European Parliament challenged the Commission's decision to apply iTA provisionally without EP vote. Key question: can Commission apply trade agreement provisionally?",
    impact: 'If annulled — iTA suspended',
    source: 'curia.europa.eu',
  },
  {
    title: 'NGO Environmental Challenge',
    status: 'ACTIVE',
    color: 'red',
    description: 'ClientEarth + Notre Affaire à Tous contesting deforestation clause adequacy. Invoke Green Deal + Paris Agreement. Risk: partial annulment agri clauses. Filed: March 2025',
    impact: 'Partial annulment of agricultural clauses possible',
    source: 'EU General Court register',
  },
  {
    title: 'EMPA Ratification — Mixed?',
    status: 'PENDING',
    color: 'amber',
    description: 'Question: does EMPA require unanimity + 27 national parliaments? If yes: full agreement delayed years. iTA not affected — applies provisionally.',
    impact: 'Full EMPA could be delayed — iTA continues',
    source: 'curia.europa.eu',
  },
];

export interface NewsItem {
  id: number;
  category: string;
  categoryColor: 'red' | 'green' | 'amber' | 'blue';
  title: string;
  teaser: string;
  date: string;
  readTime: string;
  author: string;
  free: boolean;
  breaking?: boolean;
}

export const NEWS_DATA: NewsItem[] = [
  {
    id: 1, category: 'Tariffs', categoryColor: 'red',
    title: 'First tariff reductions now applying across all sectors',
    teaser: 'TARIC database updated with new preferential rates effective May 1st',
    date: 'May 9, 2026', readTime: '4 min', author: 'Prof. M. Laurent',
    free: true, breaking: true,
  },
  {
    id: 2, category: 'Legal', categoryColor: 'blue',
    title: 'EP v Commission: first hearing scheduled for June 2026',
    teaser: 'The European Parliament\'s challenge to the iTA provisional application moves forward',
    date: 'May 8, 2026', readTime: '6 min', author: 'Dr. S. Fernández',
    free: true,
  },
  {
    id: 3, category: 'Environment', categoryColor: 'green',
    title: 'EUDR compliance: what Mercosur exporters need to know',
    teaser: 'Deforestation regulation applies independently — key requirements for your supply chain',
    date: 'May 7, 2026', readTime: '8 min', author: 'A. Pereira',
    free: false,
  },
  {
    id: 4, category: 'Countries', categoryColor: 'amber',
    title: 'Uruguay emerges as preferred Mercosur entry point',
    teaser: 'Colonia free zone sees surge in EU company registrations',
    date: 'May 6, 2026', readTime: '5 min', author: 'L. García',
    free: false,
  },
  {
    id: 5, category: 'Experts', categoryColor: 'blue',
    title: 'GI protection: wine and cheese producers celebrate',
    teaser: 'Geographic indications now legally protected across Mercosur markets',
    date: 'May 5, 2026', readTime: '3 min', author: 'Prof. C. Dupont',
    free: true,
  },
];

export interface ExpertData {
  id: number;
  name: string;
  initials: string;
  firm: string;
  specializations: string[];
  location: string;
  languages: string;
  rating: number;
  responseTime: string;
  verified: boolean;
  academic?: boolean;
  price?: string;
}

export const EXPERTS: ExpertData[] = [
  {
    id: 0, name: 'Paris 1 Sorbonne × USAL', initials: '🎓', firm: 'EU-Mercosur Legal Observatory',
    specializations: ['All sectors'], location: 'Paris / Buenos Aires', languages: 'FR 🇫🇷 ES 🇪🇸 EN 🇬🇧',
    rating: 5, responseTime: '48h', verified: true, academic: true, price: 'Free — orientation session',
  },
  {
    id: 1, name: 'Dr. Sophie Laurent', initials: 'SL', firm: 'Gide Loyrette Nouel',
    specializations: ['Tariff classification', 'Customs', 'Wine & Spirits'],
    location: 'Paris', languages: 'FR, EN, ES', rating: 4.9, responseTime: '24h', verified: true, price: '€150 / 30 min',
  },
  {
    id: 2, name: 'Carlos Fernández', initials: 'CF', firm: 'Marval O\'Farrell',
    specializations: ['EUDR Compliance', 'Agri-food', 'Brazil'],
    location: 'Buenos Aires', languages: 'ES, EN, PT', rating: 4.8, responseTime: '12h', verified: true, price: '€120 / 30 min',
  },
  {
    id: 3, name: 'Prof. Hans Müller', initials: 'HM', firm: 'Freshfields',
    specializations: ['Automobile', 'CBAM', 'Transfer pricing'],
    location: 'Frankfurt', languages: 'DE, EN, FR', rating: 4.9, responseTime: '24h', verified: true, price: '€200 / 30 min',
  },
];

export const SCENARIOS = [
  'Direct export EU → Brazil (iTA applies)',
  'Export via Uruguay (best iTA rates)',
  'Export via Argentina',
  'Create subsidiary in Brazil',
  'Create subsidiary in Argentina',
  'License to local distributor',
  'Joint venture Mercosur partner',
];

export const COMPARISON_ROWS = [
  'Tariff rate NOW (May 2026)',
  'Tariff rate final (full phase-in)',
  'Est. duties per €1M TODAY',
  'Rules of origin complexity',
  'Environmental obligations',
  'Administrative complexity',
  'Timeline to implement',
  'Currency risk level',
  'Overall score /10',
];
