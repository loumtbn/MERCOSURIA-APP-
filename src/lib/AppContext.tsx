import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { type Lang, t } from './i18n';

interface UserProfile {
  sector: string | null;
  country: string | null;
  name: string;
  onboarded: boolean;
}

interface AppState {
  lang: Lang;
  setLang: (l: Lang) => void;
  i: (key: string) => string;
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('en');
  const [user, setUser] = useState<UserProfile>({
    sector: null,
    country: null,
    name: 'User',
    onboarded: false,
  });
  const [activeTab, setActiveTab] = useState('home');

  const i = useCallback(
    (key: string) => t[lang][key] || t.en[key] || key,
    [lang]
  );

  return (
    <AppContext.Provider value={{ lang, setLang, i, user, setUser, activeTab, setActiveTab }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}
