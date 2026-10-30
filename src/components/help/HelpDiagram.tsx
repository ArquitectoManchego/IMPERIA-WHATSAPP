'use client';

import React, { useEffect, useRef, useState } from 'react';
import { GitFork, Loader2 } from 'lucide-react';

interface HelpDiagramProps {
  title?: string;
  mermaid: string;
  caption?: string;
}

export default function HelpDiagram({ title, mermaid, caption }: HelpDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function renderMermaid() {
      try {
        setLoading(true);
        setError(null);
        const mermaidModule = await import('mermaid');
        const mermaidApi = mermaidModule.default;

        mermaidApi.initialize({
          startOnLoad: false,
          theme: 'dark',
          themeVariables: {
            primaryColor: '#059669',
            primaryTextColor: '#ffffff',
            primaryBorderColor: '#10b981',
            lineColor: '#34d399',
            secondaryColor: '#1e293b',
            tertiaryColor: '#0f172a',
            background: '#030712',
            fontFamily: 'inherit',
          },
          securityLevel: 'loose',
        });

        const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
        const { svg } = await mermaidApi.render(id, mermaid);

        if (isMounted) {
          setSvgContent(svg);
          setLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          console.warn('[HelpDiagram] Error rendering diagram:', err);
          setError(err?.message || 'Error al compilar diagrama');
          setLoading(false);
        }
      }
    }

    renderMermaid();

    return () => {
      isMounted = false;
    };
  }, [mermaid]);

  return (
    <div className="my-6 space-y-2">
      {title && (
        <h4 className="font-bold text-sm sm:text-base text-white tracking-tight flex items-center gap-2">
          <GitFork className="w-4 h-4 text-emerald-400" />
          {title}
        </h4>
      )}

      <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-4 sm:p-6 shadow-xl flex flex-col items-center justify-center min-h-[160px] overflow-x-auto custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center gap-2 py-8 text-slate-500 text-xs">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
            <span>Generando esquema visual...</span>
          </div>
        ) : error ? (
          <div className="text-center py-6 text-xs text-rose-400/90 font-mono bg-rose-500/10 p-4 rounded-xl border border-rose-500/20 max-w-full overflow-x-auto">
            <p className="font-bold mb-1">No se pudo dibujar el diagrama</p>
            <pre className="text-[10px] text-left">{mermaid}</pre>
          </div>
        ) : (
          <div
            ref={containerRef}
            className="w-full flex justify-center [&_svg]:max-w-full [&_svg]:h-auto text-center"
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        )}
      </div>

      {caption && (
        <p className="text-[11px] sm:text-xs text-slate-400 text-center italic font-medium pt-1">
          {caption}
        </p>
      )}
    </div>
  );
}
