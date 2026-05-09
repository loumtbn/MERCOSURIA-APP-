import React from 'react';
import { useApp } from '@/lib/AppContext';

export default function Disclaimer() {
  const { i } = useApp();

  return (
    <p className="text-[10px] text-text-secondary leading-relaxed px-5 py-4 text-center">
      {i('disclaimer')}
    </p>
  );
}
