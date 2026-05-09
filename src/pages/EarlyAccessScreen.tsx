import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Share2 } from 'lucide-react';
import { useApp } from '@/lib/AppContext';
import { SECTORS } from '@/lib/data';
import TopBar from '@/components/TopBar';
import StatusBadge from '@/components/StatusBadge';

export default function EarlyAccessScreen() {
  const { i } = useApp();
  const [email, setEmail] = useState('');
  const [sector, setSector] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
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
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h2 className="text-xl font-bold text-foreground mb-2">{i('youre_in')}</h2>
          <p className="text-sm text-text-secondary mb-6">{i('send_access')}</p>
          <button className="flex items-center gap-2 mx-auto px-5 py-3 bg-card rounded-card text-sm text-text-secondary shadow-card">
            <Share2 size={16} /> {i('share_colleague')}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <TopBar />

      <div className="px-5 pt-6">
        <div className="flex justify-center mb-4">
          <StatusBadge color="green">Agreement just entered force</StatusBadge>
        </div>

        <h1 className="text-2xl font-bold text-foreground text-center leading-tight mb-2">
          {i('ea_title')}
        </h1>
        <p className="text-sm text-text-secondary text-center leading-relaxed mb-8 max-w-xs mx-auto">
          {i('ea_sub')}
        </p>

        {/* Benefits */}
        <div className="flex flex-col gap-3 mb-8">
          {[
            '30 days unlimited AI analysis',
            'Full country tracker + disputes',
            'One free sector report (€149 value)',
            'Founder price: €19/month forever (regular: €29/month)',
            'Direct access to founding team',
            'Shape the product roadmap',
          ].map((b, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <Check size={16} className="text-teal flex-shrink-0 mt-0.5" />
              <span className="text-sm text-foreground">{b}</span>
            </div>
          ))}
        </div>

        {/* Social proof */}
        <p className="text-xs text-text-secondary text-center mb-6">
          Already 47 professionals navigating the May 1st changes with MercosurAI
        </p>

        {/* Form */}
        <div className="flex flex-col gap-4">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Your professional email"
            className="w-full bg-card rounded-card py-3.5 px-4 text-sm text-foreground placeholder:text-text-secondary/50 outline-none shadow-card"
          />

          <div>
            <p className="text-xs text-text-secondary mb-2">My sector:</p>
            <div className="flex flex-wrap gap-2">
              {SECTORS.slice(0, 6).map(s => (
                <button
                  key={s.id}
                  onClick={() => setSector(s.id)}
                  className={`px-3 py-1.5 rounded-pill text-xs font-medium transition-all active:scale-95 ${
                    sector === s.id
                      ? 'bg-teal text-primary-foreground'
                      : 'bg-card text-text-secondary border border-border'
                  }`}
                >
                  {s.emoji} {s.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => email && setSubmitted(true)}
            disabled={!email}
            className={`w-full py-4 rounded-card text-sm font-semibold transition-all active:scale-[0.98] ${
              email
                ? 'bg-teal text-primary-foreground shadow-elevated'
                : 'bg-card text-text-secondary'
            }`}
          >
            {i('join_now')} →
          </button>

          <p className="text-xs text-text-secondary text-center">{i('no_cc')}</p>
        </div>
      </div>
    </div>
  );
}
