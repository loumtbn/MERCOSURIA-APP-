import React from 'react';

interface StatusBadgeProps {
  color: 'green' | 'red' | 'amber' | 'blue';
  children: React.ReactNode;
  small?: boolean;
}

export default function StatusBadge({ color, children, small }: StatusBadgeProps) {
  const classes: Record<string, string> = {
    green: 'badge-ahead',
    red: 'badge-alert',
    amber: 'badge-progress',
    blue: 'badge-discussion',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-pill ${classes[color]} ${
        small ? 'text-[10px] px-2 py-0.5' : 'text-xs px-3 py-1'
      }`}
    >
      {children}
    </span>
  );
}
