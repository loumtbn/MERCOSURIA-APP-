import React from 'react';
import { useApp } from '@/lib/AppContext';
import type { Lang } from '@/lib/i18n';

const langs: { id: Lang; label: string }[] = [
  { id: 'fr', label: 'FR' },
  { id: 'en', label: 'EN' },
  { id: 'es', label: 'ES' },
];

export default function LanguageSwitcher() {
  const { lang, setLang } = useApp();

  return (
    <div className="flex items-center gap-1">
      {langs.map((l, idx) => (
        <React.Fragment key={l.id}>
          {idx > 0 && <span className="text-text-secondary text-xs">|</span>}
          <button
            onClick={() => setLang(l.id)}
            className={`text-xs font-medium px-1 py-0.5 transition-all relative ${
              lang === l.id
                ? 'text-teal'
                : 'text-text-secondary hover:text-foreground'
            }`}
          >
            {l.label}
            {lang === l.id && (
              <span className="absolute bottom-0 left-1 right-1 h-[2px] bg-teal rounded-full" />
            )}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
}
