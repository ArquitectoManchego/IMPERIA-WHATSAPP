'use client';

import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FaqItem {
  question: string;
  answer: string;
}

interface HelpFaqProps {
  items: FaqItem[];
}

export default function HelpFaq({ items }: HelpFaqProps) {
  const [openIndices, setOpenIndices] = useState<number[]>([]);

  if (!items || items.length === 0) return null;

  const toggle = (idx: number) => {
    setOpenIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  return (
    <div className="my-6 space-y-3">
      <h4 className="font-bold text-sm sm:text-base text-white tracking-tight flex items-center gap-2 mb-3">
        <HelpCircle className="w-5 h-5 text-emerald-400" />
        Preguntas Frecuentes
      </h4>
      <div className="space-y-2">
        {items.map((item, idx) => {
          const isOpen = openIndices.includes(idx);
          return (
            <div
              key={idx}
              className="border border-white/10 rounded-2xl bg-white/[0.03] overflow-hidden transition-colors"
            >
              <button
                type="button"
                onClick={() => toggle(idx)}
                className="w-full flex items-center justify-between p-4 sm:p-5 text-left font-semibold text-xs sm:text-sm text-white hover:text-emerald-300 transition-colors"
              >
                <span>{item.question}</span>
                <ChevronDown
                  className={cn(
                    'w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ml-3',
                    isOpen && 'rotate-180 text-emerald-400'
                  )}
                />
              </button>
              {isOpen && (
                <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-white/5 font-normal">
                  {item.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
