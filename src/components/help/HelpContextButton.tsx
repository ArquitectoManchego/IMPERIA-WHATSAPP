'use client';

import React from 'react';
import Link from 'next/link';
import { HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HelpContextButtonProps {
  slug?: string; // target article slug, e.g. 'mensajes/redaccion/agendar-mensajes'
  tooltip?: string;
  className?: string;
}

export default function HelpContextButton({
  slug = 'primeros-pasos/inicio/que-es-imperia',
  tooltip = '¿Cómo funciona este módulo? Ver ayuda',
  className,
}: HelpContextButtonProps) {
  return (
    <Link
      href={`/dashboard/ayuda/${slug}`}
      title={tooltip}
      className={cn(
        'group relative inline-flex items-center justify-center p-2 rounded-xl bg-white/5 hover:bg-emerald-500/15 border border-white/10 hover:border-emerald-500/30 text-slate-400 hover:text-emerald-400 transition-all shadow-sm',
        className
      )}
    >
      <HelpCircle className="w-4 h-4 transition-transform group-hover:scale-110" />
      <span className="sr-only">{tooltip}</span>

      {/* Floating tooltip */}
      <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-slate-900 text-white text-[10px] font-semibold rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl border border-white/10">
        {tooltip}
      </div>
    </Link>
  );
}
