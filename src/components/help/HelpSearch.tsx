'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Loader2, FileText, ArrowRight } from 'lucide-react';
import { HelpArticle } from '@/types/help';

export default function HelpSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<HelpArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Ctrl+K shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const input = containerRef.current?.querySelector('input');
        input?.focus();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside to close results dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/help/search?q=${encodeURIComponent(query.trim())}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.results)) {
          setResults(data.results);
          setIsOpen(true);
        }
      } catch (err) {
        console.error('Error searching help:', err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (slug: string) => {
    setIsOpen(false);
    setQuery('');
    router.push(`/dashboard/ayuda/${slug}`);
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-xl">
      <div className="relative flex items-center">
        <Search className="w-4 h-4 text-emerald-400 absolute left-3.5 pointer-events-none" />
        <input
          type="text"
          placeholder="Buscar en el Centro de Ayuda... (ej: agendar, ptt, antiban, uv)"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="w-full h-11 pl-10 pr-20 bg-white/5 border border-white/10 hover:border-white/20 focus:border-emerald-500/60 rounded-xl text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
        />

        <div className="absolute right-2.5 flex items-center gap-1.5">
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setResults([]);
                setIsOpen(false);
              }}
              className="p-1 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white/10 rounded border border-white/10 pointer-events-none">
              Ctrl+K
            </kbd>
          )}
        </div>
      </div>

      {/* Dropdown Results */}
      {isOpen && (query.trim().length > 0 || loading) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-950/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden divide-y divide-white/5 max-h-[380px] overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="p-4 flex items-center justify-center gap-2 text-xs text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
              <span>Buscando en la documentación...</span>
            </div>
          ) : results.length === 0 ? (
            <div className="p-5 text-center text-xs text-slate-400 space-y-1">
              <p className="font-semibold text-white">No se encontraron artículos para &quot;{query}&quot;</p>
              <p className="text-[11px] text-slate-500">Intenta con términos más generales como &quot;chat&quot;, &quot;kanban&quot; o &quot;fidelidad&quot;.</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                <span>Resultados Encontrados</span>
                <span className="text-emerald-400">{results.length}</span>
              </div>
              {results.map((article) => (
                <div
                  key={article.id}
                  onClick={() => handleSelect(article.slug)}
                  className="p-3 rounded-xl hover:bg-white/5 cursor-pointer transition-colors group flex items-start justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-white group-hover:text-emerald-300 transition-colors">
                      <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate">{article.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1 font-normal">
                      {article.summary}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
