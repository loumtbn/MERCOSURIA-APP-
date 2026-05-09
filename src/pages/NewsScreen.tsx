import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, X } from 'lucide-react';
import { useApp } from '@/lib/AppContext';
import { NEWS_DATA } from '@/lib/data';
import TopBar from '@/components/TopBar';

const FILTERS = ['All', 'Tariffs', 'Environment', 'Legal', 'Countries', 'Disputes', 'Experts'];

export default function NewsScreen() {
  const { i } = useApp();
  const [filter, setFilter] = useState('All');
  const [selectedArticle, setSelectedArticle] = useState<number | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);

  const dotColor: Record<string, string> = {
    red: 'bg-status-red',
    green: 'bg-teal',
    amber: 'bg-status-amber',
    blue: 'bg-status-blue',
  };

  const filtered = filter === 'All' ? NEWS_DATA : NEWS_DATA.filter(n => n.category === filter);
  const breaking = NEWS_DATA.find(n => n.breaking);

  return (
    <div className="min-h-screen bg-background pb-24">
      <TopBar />

      <div className="px-5 pt-4">
        <h2 className="text-lg font-bold text-foreground">{i('news_title')}</h2>
        <p className="text-xs text-text-secondary mb-4">{i('news_sub')}</p>

        {/* Breaking */}
        {breaking && (
          <button className="w-full bg-status-red rounded-card p-4 mb-4 text-left flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary-foreground pulse-dot flex-shrink-0" />
            <span className="text-xs font-medium text-primary-foreground">BREAKING — {breaking.title}</span>
          </button>
        )}

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

        {/* Articles */}
        <div className="flex flex-col gap-2">
          {filtered.map((article, idx) => (
            <motion.button
              key={article.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => article.free ? setSelectedArticle(article.id) : setShowPaywall(true)}
              className="w-full bg-card rounded-card p-4 shadow-card text-left active:scale-[0.98] transition-transform"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`w-2 h-2 rounded-full ${dotColor[article.categoryColor]}`} />
                <span className="text-[10px] text-text-secondary font-medium">{article.category}</span>
                {!article.free && <Lock size={10} className="text-text-secondary ml-auto" />}
              </div>
              <h3 className="text-sm font-semibold text-foreground leading-snug mb-1">{article.title}</h3>
              <p className="text-xs text-text-secondary mb-2">{article.teaser}</p>
              <div className="flex items-center gap-2 text-[10px] text-text-secondary">
                <span>{article.date}</span>
                <span>·</span>
                <span>{article.readTime}</span>
                <span>·</span>
                <span>{article.author}</span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Paywall modal */}
      {showPaywall && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 backdrop-blur-sm">
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            className="w-full bg-background rounded-t-[24px] p-6 max-h-[80vh] overflow-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <Lock size={18} className="text-text-secondary" />
              <button onClick={() => setShowPaywall(false)}>
                <X size={18} className="text-text-secondary" />
              </button>
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1">{i('subscribe_read')}</h3>
            <p className="text-xs text-text-secondary mb-5">
              Join professionals navigating the EU-Mercosur agreement since May 1st, 2026
            </p>

            <div className="flex flex-col gap-2 mb-4">
              {[
                { plan: 'Student', price: '€9/mo', features: '5 analyses/mo + articles' },
                { plan: 'Professional', price: '€29/mo', features: 'Unlimited + PDF export' },
                { plan: 'Business', price: '€99/mo', features: 'Unlimited + team + API', recommended: true },
              ].map(p => (
                <div key={p.plan} className={`rounded-card p-4 border ${p.recommended ? 'border-teal bg-teal-light' : 'border-border bg-card'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-semibold text-foreground">{p.plan}</span>
                      <p className="text-[10px] text-text-secondary mt-0.5">{p.features}</p>
                    </div>
                    <span className="text-base font-bold text-foreground">{p.price}</span>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-text-secondary text-center mb-3">Or buy this article: €4.99</p>
            <button className="w-full py-4 bg-teal text-primary-foreground rounded-card text-sm font-semibold shadow-elevated">
              Subscribe now →
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
