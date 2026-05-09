import React, { useEffect, useState } from 'react';
import { useApp } from '@/lib/AppContext';

interface Props {
  score: number;
}

export default function OpportunityGauge({ score }: Props) {
  const { i } = useApp();
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 200);
    return () => clearTimeout(timer);
  }, [score]);

  const percentage = (animatedScore / 10) * 100;
  const circumference = Math.PI * 90;
  const offset = circumference - (percentage / 100) * circumference;

  const label = score >= 7 ? i('strong_opp') : score >= 4 ? i('monitor') : i('high_risk');
  const labelColor = score >= 7 ? 'text-teal' : score >= 4 ? 'text-status-amber' : 'text-status-red';

  return (
    <div className="flex flex-col items-center py-6">
      <svg width="200" height="110" viewBox="0 0 200 110">
        {/* Background arc */}
        <path
          d="M 10 100 A 90 90 0 0 1 190 100"
          fill="none"
          stroke="hsl(0 0% 92%)"
          strokeWidth="12"
          strokeLinecap="round"
        />
        {/* Red zone */}
        <path
          d="M 10 100 A 90 90 0 0 1 190 100"
          fill="none"
          stroke="url(#gaugeGradient)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
        />
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(0, 72%, 59%)" />
            <stop offset="40%" stopColor="hsl(37, 78%, 41%)" />
            <stop offset="100%" stopColor="hsl(157, 68%, 37%)" />
          </linearGradient>
        </defs>
        {/* Score number */}
        <text x="100" y="85" textAnchor="middle" className="text-4xl font-bold" fill="hsl(157, 68%, 37%)" fontSize="40">
          {animatedScore}
        </text>
        <text x="100" y="105" textAnchor="middle" fill="hsl(0, 0%, 40%)" fontSize="11">
          /10
        </text>
      </svg>
      <p className={`text-base font-semibold mt-1 ${labelColor}`}>{label}</p>
    </div>
  );
}
