'use client';

import React from 'react';
import { HelpTone } from '@/types/help';
import { Info, Lightbulb, AlertTriangle, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HelpCalloutProps {
  tone: HelpTone;
  title?: string;
  text: string;
}

const toneConfig: Record<HelpTone, { icon: any; border: string; bg: string; text: string; iconColor: string; defaultTitle: string }> = {
  info: {
    icon: Info,
    border: 'border-sky-500/30',
    bg: 'bg-sky-500/10',
    text: 'text-sky-200',
    iconColor: 'text-sky-400',
    defaultTitle: 'Información Importante',
  },
  tip: {
    icon: Lightbulb,
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-200',
    iconColor: 'text-emerald-400',
    defaultTitle: 'Consejo Práctico',
  },
  warning: {
    icon: AlertTriangle,
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/10',
    text: 'text-amber-200',
    iconColor: 'text-amber-400',
    defaultTitle: 'Atención Requerida',
  },
  danger: {
    icon: ShieldAlert,
    border: 'border-rose-500/30',
    bg: 'bg-rose-500/10',
    text: 'text-rose-200',
    iconColor: 'text-rose-400',
    defaultTitle: 'Advertencia Crítica',
  },
};

export default function HelpCallout({ tone, title, text }: HelpCalloutProps) {
  const config = toneConfig[tone] || toneConfig.info;
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'rounded-2xl p-4 sm:p-5 border my-5 backdrop-blur-md transition-all shadow-lg',
        config.border,
        config.bg
      )}
    >
      <div className="flex items-start gap-3.5">
        <div className={cn('p-2 rounded-xl bg-black/30 shrink-0 shadow-inner', config.iconColor)}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="space-y-1 min-w-0 flex-1">
          <h4 className={cn('font-bold text-sm tracking-tight', config.iconColor)}>
            {title || config.defaultTitle}
          </h4>
          <p className={cn('text-xs sm:text-sm leading-relaxed font-normal opacity-90', config.text)}>
            {text}
          </p>
        </div>
      </div>
    </div>
  );
}
