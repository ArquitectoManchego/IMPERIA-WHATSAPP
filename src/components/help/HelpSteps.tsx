'use client';

import React from 'react';
import { Lightbulb, CheckCircle2 } from 'lucide-react';

interface StepItem {
  step: number;
  title: string;
  description: string;
  tip?: string;
  focusElement?: string;
}

interface HelpStepsProps {
  title?: string;
  items: StepItem[];
}

export default function HelpSteps({ title, items }: HelpStepsProps) {
  if (!items || items.length === 0) return null;

  return (
    <div className="my-6 space-y-4">
      {title && (
        <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          {title}
        </h3>
      )}

      <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-emerald-500 before:via-emerald-500/40 before:to-transparent">
        {items.map((item, index) => (
          <div key={index} className="relative group">
            {/* Step Number Badge */}
            <div className="absolute -left-6 sm:-left-8 top-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-slate-900 border-2 border-emerald-500 text-emerald-400 text-xs sm:text-sm font-black flex items-center justify-center shadow-lg shadow-emerald-950/50 group-hover:scale-110 transition-transform">
              {item.step || index + 1}
            </div>

            <div className="bg-white/5 hover:bg-white/[0.07] border border-white/10 rounded-2xl p-4 sm:p-5 transition-all shadow-md space-y-2">
              <h4 className="font-bold text-sm sm:text-base text-white tracking-tight">
                {item.title}
              </h4>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                {item.description}
              </p>

              {item.tip && (
                <div className="mt-3 pt-3 border-t border-white/5 flex items-start gap-2 text-xs text-amber-300/90 font-medium bg-amber-500/10 px-3 py-2 rounded-xl">
                  <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>{item.tip}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
