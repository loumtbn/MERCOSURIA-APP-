import React from 'react';
import { useApp } from '@/lib/AppContext';
import Onboarding from './Onboarding';
import HomeScreen from './HomeScreen';
import ImpactScreen from './ImpactScreen';
import CountriesScreen from './CountriesScreen';
import NewsScreen from './NewsScreen';
import AdviseScreen from './AdviseScreen';
import CalculatorScreen from './CalculatorScreen';
import ComparatorScreen from './ComparatorScreen';
import DashboardScreen from './DashboardScreen';
import AlertsScreen from './AlertsScreen';
import EarlyAccessScreen from './EarlyAccessScreen';
import BottomNav from '@/components/BottomNav';

const screens: Record<string, React.FC> = {
  home: HomeScreen,
  impact: ImpactScreen,
  countries: CountriesScreen,
  news: NewsScreen,
  advise: AdviseScreen,
  calculator: CalculatorScreen,
  comparator: ComparatorScreen,
  dashboard: DashboardScreen,
  alerts: AlertsScreen,
  'early-access': EarlyAccessScreen,
};

export default function Index() {
  const { user, activeTab } = useApp();

  if (!user.onboarded) {
    return <Onboarding />;
  }

  const Screen = screens[activeTab] || HomeScreen;

  return (
    <div className="max-w-md mx-auto bg-background min-h-screen relative">
      <Screen />
      <BottomNav />
    </div>
  );
}
