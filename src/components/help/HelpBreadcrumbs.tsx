'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home, HelpCircle } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface HelpBreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function HelpBreadcrumbs({ items }: HelpBreadcrumbsProps) {
  return (
    <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-6 flex-wrap">
      <Link
        href="/dashboard"
        className="hover:text-emerald-400 transition-colors flex items-center gap-1"
        title="Inicio"
      >
        <Home className="w-3.5 h-3.5" />
      </Link>
      <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
      <Link
        href="/dashboard/ayuda"
        className="hover:text-emerald-400 transition-colors flex items-center gap-1 font-semibold"
      >
        <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
        Ayuda
      </Link>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={index}>
            <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="hover:text-emerald-400 transition-colors font-medium truncate max-w-[150px] sm:max-w-none"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-white font-bold truncate max-w-[200px] sm:max-w-none">
                {item.label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
