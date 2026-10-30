'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HelpTreeItem } from '@/types/help';
import {
  ChevronRight,
  ChevronDown,
  Sparkles,
  MessageSquare,
  Kanban,
  Megaphone,
  Bot,
  Package,
  Users,
  Award,
  Receipt,
  BarChart3,
  HelpCircle,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const iconMap: Record<string, any> = {
  Sparkles,
  MessageSquare,
  Kanban,
  Megaphone,
  Bot,
  Package,
  Users,
  Award,
  Receipt,
  BarChart3,
  HelpCircle,
};

interface HelpTreeNavProps {
  tree: HelpTreeItem[];
  onItemClick?: () => void;
}

export default function HelpTreeNav({ tree, onItemClick }: HelpTreeNavProps) {
  const pathname = usePathname();
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const toggleCategory = (catId: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  return (
    <nav className="space-y-4 py-2">
      <div className="px-3 pb-2 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-white/5 flex items-center justify-between">
        <span>Módulos de la Plataforma</span>
        <span className="text-emerald-400 font-bold">{tree.length}</span>
      </div>

      <div className="space-y-2">
        {tree.map(({ category, subcategories, directArticles }) => {
          const Icon = iconMap[category.icon] || HelpCircle;
          const isCollapsed = !!collapsedCategories[category.id];
          const hasArticles = subcategories.some((s) => s.articles.length > 0) || directArticles.length > 0;
          const isCategoryActive = pathname.includes(`/ayuda/${category.id}`);

          return (
            <div key={category.id} className="rounded-xl overflow-hidden">
              {/* Category Header */}
              <div
                className={cn(
                  'w-full flex items-center justify-between p-2.5 rounded-xl transition-all cursor-pointer select-none text-left',
                  isCategoryActive
                    ? 'bg-emerald-500/10 text-emerald-300 font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                )}
                onClick={() => toggleCategory(category.id)}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={cn(
                      'p-1.5 rounded-lg shrink-0',
                      isCategoryActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-slate-400'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold truncate">{category.title}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] text-slate-500 font-semibold px-1.5 py-0.2 rounded bg-black/40">
                    {subcategories.reduce((acc, s) => acc + s.articles.length, 0) + directArticles.length}
                  </span>
                  {hasArticles && (
                    <div className="text-slate-500 hover:text-white">
                      {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </div>
                  )}
                </div>
              </div>

              {/* Subcategories & Articles */}
              {!isCollapsed && hasArticles && (
                <div className="ml-5 pl-2.5 border-l border-white/10 space-y-1.5 my-1">
                  {/* Direct Articles */}
                  {directArticles.map((article) => {
                    const articlePath = `/dashboard/ayuda/${article.slug}`;
                    const isActive = pathname === articlePath;

                    return (
                      <Link
                        key={article.id}
                        href={articlePath}
                        onClick={onItemClick}
                        className={cn(
                          'block px-2.5 py-1.5 rounded-lg text-xs transition-colors truncate',
                          isActive
                            ? 'bg-emerald-500 text-black font-bold shadow-md shadow-emerald-950/40'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                        )}
                      >
                        {article.title}
                      </Link>
                    );
                  })}

                  {/* Subcategories */}
                  {subcategories.map(({ subcategory, articles }) => (
                    <div key={subcategory.id} className="space-y-1 pt-1">
                      <div className="px-2 py-0.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        {subcategory.title}
                      </div>

                      <div className="space-y-0.5 pl-1">
                        {articles.map((article) => {
                          const articlePath = `/dashboard/ayuda/${article.slug}`;
                          const isActive = pathname === articlePath;

                          return (
                            <Link
                              key={article.id}
                              href={articlePath}
                              onClick={onItemClick}
                              className={cn(
                                'flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] sm:text-xs transition-colors',
                                isActive
                                  ? 'bg-emerald-500 text-black font-bold shadow-md shadow-emerald-950/40'
                                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                              )}
                            >
                              <FileText className={cn('w-3 h-3 shrink-0', isActive ? 'text-black' : 'text-slate-500')} />
                              <span className="truncate">{article.title}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
