'use client';

import React, { useState } from 'react';
import { SHOT_METADATA_REGISTRY } from '@/lib/help-shots-registry';
import { ZoomIn, Maximize2, X, Eye, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HelpScreenshotProps {
  shotId: string;
  focusId?: string;
  mode?: 'full' | 'zoom' | 'split' | 'annotated';
  caption?: string;
  zoomPadding?: number; // padding around element in viewBox pixels
}

export default function HelpScreenshot({
  shotId,
  focusId,
  mode = 'zoom',
  caption,
  zoomPadding = 40,
}: HelpScreenshotProps) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxMode, setLightboxMode] = useState<'full' | 'zoom'>(mode === 'zoom' ? 'zoom' : 'full');

  const meta = SHOT_METADATA_REGISTRY[shotId] || {
    id: shotId,
    title: shotId,
    imagePath: shotId.startsWith('/') ? shotId : `/help/shots/${shotId}.png`,
    width: 1920,
    height: 1080,
    elements: {},
  };

  const focusElement = focusId ? meta.elements[focusId] : undefined;

  // ViewBox calculations for zoom crop
  const origW = meta.width || 1920;
  const origH = meta.height || 1080;

  let zoomX = 0;
  let zoomY = 0;
  let zoomW = origW;
  let zoomH = origH;

  if (focusElement) {
    const rawX = (focusElement.x / 100) * origW;
    const rawY = (focusElement.y / 100) * origH;
    const rawW = (focusElement.width / 100) * origW;
    const rawH = (focusElement.height / 100) * origH;

    zoomX = Math.max(0, rawX - zoomPadding);
    zoomY = Math.max(0, rawY - zoomPadding);
    zoomW = Math.min(origW - zoomX, rawW + zoomPadding * 2);
    zoomH = Math.min(origH - zoomY, rawH + zoomPadding * 2);
  }

  return (
    <div className="my-6 space-y-2">
      {/* Container based on mode */}
      {mode === 'split' && focusElement ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Zoom view */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-emerald-400 mb-1 px-1">
              <span className="flex items-center gap-1.5">
                <ZoomIn className="w-3.5 h-3.5" />
                Zoom a detalle: {focusElement.label || focusId}
              </span>
            </div>
            <div
              className="relative rounded-2xl overflow-hidden border border-emerald-500/40 bg-slate-950 shadow-xl group cursor-pointer"
              onClick={() => {
                setLightboxMode('zoom');
                setIsLightboxOpen(true);
              }}
            >
              <svg
                viewBox={`${zoomX} ${zoomY} ${zoomW} ${zoomH}`}
                className="w-full h-auto object-cover max-h-[360px]"
              >
                <image href={meta.imagePath} width={origW} height={origH} />
                <rect
                  x={(focusElement.x / 100) * origW}
                  y={(focusElement.y / 100) * origH}
                  width={(focusElement.width / 100) * origW}
                  height={(focusElement.height / 100) * origH}
                  fill="rgba(16, 185, 129, 0.15)"
                  stroke="#10b981"
                  strokeWidth="4"
                  rx="10"
                />
              </svg>
              <div className="absolute inset-0 bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                <span className="px-3 py-1.5 rounded-xl bg-black/80 text-white text-xs font-bold flex items-center gap-1.5 shadow-xl">
                  <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                  Ampliar
                </span>
              </div>
            </div>
          </div>

          {/* Full context */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-1 px-1">
              <span className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" />
                Ubicación en pantalla completa
              </span>
            </div>
            <div
              className="relative rounded-2xl overflow-hidden border border-white/10 bg-slate-950 shadow-xl group cursor-pointer"
              onClick={() => {
                setLightboxMode('full');
                setIsLightboxOpen(true);
              }}
            >
              <img src={meta.imagePath} alt={meta.title} className="w-full h-auto object-cover max-h-[360px]" />
              <div
                className="absolute border-2 border-emerald-400 bg-emerald-500/20 rounded-md pointer-events-none animate-pulse"
                style={{
                  left: `${focusElement.x}%`,
                  top: `${focusElement.y}%`,
                  width: `${focusElement.width}%`,
                  height: `${focusElement.height}%`,
                }}
              />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                <span className="px-3 py-1.5 rounded-xl bg-black/80 text-white text-xs font-bold flex items-center gap-1.5 shadow-xl">
                  <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                  Ver pantalla completa
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : mode === 'zoom' && focusElement ? (
        // Zoom crop only
        <div className="space-y-1.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Detalle en foco: {focusElement.label || focusId}
            </span>
            <button
              type="button"
              onClick={() => {
                setLightboxMode('full');
                setIsLightboxOpen(true);
              }}
              className="text-[10px] font-bold text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition-colors"
            >
              <Eye className="w-3 h-3" />
              Ver pantalla completa
            </button>
          </div>

          <div
            className="relative rounded-2xl overflow-hidden border border-emerald-500/40 bg-slate-950 shadow-2xl group cursor-pointer"
            onClick={() => {
              setLightboxMode('zoom');
              setIsLightboxOpen(true);
            }}
          >
            <svg
              viewBox={`${zoomX} ${zoomY} ${zoomW} ${zoomH}`}
              className="w-full h-auto object-contain max-h-[460px]"
            >
              <image href={meta.imagePath} width={origW} height={origH} />
              <rect
                x={(focusElement.x / 100) * origW}
                y={(focusElement.y / 100) * origH}
                width={(focusElement.width / 100) * origW}
                height={(focusElement.height / 100) * origH}
                fill="rgba(16, 185, 129, 0.12)"
                stroke="#10b981"
                strokeWidth="4"
                rx="8"
              />
            </svg>

            {/* Hover overlay hint */}
            <div className="absolute inset-0 bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
              <span className="px-3.5 py-1.5 rounded-xl bg-black/85 text-white text-xs font-bold flex items-center gap-1.5 shadow-xl border border-emerald-500/30">
                <Maximize2 className="w-4 h-4 text-emerald-400" />
                Clic para pantalla completa
              </span>
            </div>
          </div>
        </div>
      ) : (
        // Full screenshot with highlight
        <div
          className="relative rounded-2xl overflow-hidden border border-white/10 bg-slate-950 shadow-2xl group cursor-pointer"
          onClick={() => {
            setLightboxMode('full');
            setIsLightboxOpen(true);
          }}
        >
          <img src={meta.imagePath} alt={meta.title} className="w-full h-auto object-contain max-h-[520px]" />

          {focusElement && (
            <div
              className="absolute border-2 border-emerald-400 bg-emerald-500/20 rounded-lg pointer-events-none animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.5)]"
              style={{
                left: `${focusElement.x}%`,
                top: `${focusElement.y}%`,
                width: `${focusElement.width}%`,
                height: `${focusElement.height}%`,
              }}
            >
              {focusElement.label && (
                <div className="absolute -top-7 left-0 bg-emerald-500 text-black text-[9px] font-black px-2 py-0.5 rounded shadow-lg whitespace-nowrap">
                  {focusElement.label}
                </div>
              )}
            </div>
          )}

          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
            <span className="px-3.5 py-1.5 rounded-xl bg-black/80 text-white text-xs font-bold flex items-center gap-1.5 shadow-xl border border-white/10">
              <Maximize2 className="w-4 h-4 text-emerald-400" />
              Ver en alta resolución
            </span>
          </div>
        </div>
      )}

      {/* Caption & Focus Description */}
      {(caption || focusElement?.description) && (
        <div className="text-center pt-1 px-2">
          {caption && (
            <p className="text-xs sm:text-sm text-slate-300 font-medium">{caption}</p>
          )}
          {focusElement?.description && (
            <p className="text-[11px] text-emerald-400/90 font-medium mt-0.5">
              📌 {focusElement.description}
            </p>
          )}
        </div>
      )}

      {/* Fullscreen Lightbox */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-4 sm:p-8"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Top Bar */}
          <div
            className="w-full max-w-6xl flex items-center justify-between pb-3 text-white border-b border-white/10 mb-4 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <h3 className="font-bold text-sm sm:text-base text-white">
                {meta.title} {focusElement ? `— ${focusElement.label || focusId}` : ''}
              </h3>
              {focusElement && (
                <div className="flex items-center gap-1 bg-white/10 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setLightboxMode('zoom')}
                    className={cn(
                      'px-2.5 py-1 rounded text-xs font-bold transition-all',
                      lightboxMode === 'zoom' ? 'bg-emerald-500 text-black' : 'text-slate-300 hover:text-white'
                    )}
                  >
                    Zoom Recorte
                  </button>
                  <button
                    type="button"
                    onClick={() => setLightboxMode('full')}
                    className={cn(
                      'px-2.5 py-1 rounded text-xs font-bold transition-all',
                      lightboxMode === 'full' ? 'bg-emerald-500 text-black' : 'text-slate-300 hover:text-white'
                    )}
                  >
                    Pantalla Completa
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="p-2 rounded-xl bg-white/10 hover:bg-rose-500/20 hover:text-rose-400 text-slate-300 transition-colors"
              title="Cerrar (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Lightbox Content */}
          <div
            className="relative max-w-6xl max-h-[82vh] w-full flex items-center justify-center overflow-auto custom-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            {lightboxMode === 'zoom' && focusElement ? (
              <svg
                viewBox={`${zoomX} ${zoomY} ${zoomW} ${zoomH}`}
                className="max-w-full max-h-[80vh] rounded-2xl shadow-2xl border border-emerald-500/30"
              >
                <image href={meta.imagePath} width={origW} height={origH} />
                <rect
                  x={(focusElement.x / 100) * origW}
                  y={(focusElement.y / 100) * origH}
                  width={(focusElement.width / 100) * origW}
                  height={(focusElement.height / 100) * origH}
                  fill="rgba(16, 185, 129, 0.15)"
                  stroke="#10b981"
                  strokeWidth="4"
                  rx="10"
                />
              </svg>
            ) : (
              <div className="relative">
                <img
                  src={meta.imagePath}
                  alt={meta.title}
                  className="max-w-full max-h-[80vh] rounded-2xl shadow-2xl border border-white/10"
                />
                {focusElement && (
                  <div
                    className="absolute border-2 border-emerald-400 bg-emerald-500/20 rounded-md pointer-events-none animate-pulse"
                    style={{
                      left: `${focusElement.x}%`,
                      top: `${focusElement.y}%`,
                      width: `${focusElement.width}%`,
                      height: `${focusElement.height}%`,
                    }}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
