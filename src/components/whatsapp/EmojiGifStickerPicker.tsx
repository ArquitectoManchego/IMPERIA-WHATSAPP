'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Smile, 
  Film, 
  Sticker, 
  Search, 
  X, 
  Plus, 
  Sparkles, 
  TrendingUp, 
  Check, 
  Loader2,
  Heart,
  Briefcase,
  PartyPopper,
  ThumbsUp,
  Flame,
  Send
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmojiGifStickerPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEmoji: (emoji: string) => void;
  onSendGif: (gifUrl: string, caption?: string) => void;
  onSendSticker: (stickerData: string, isBase64?: boolean) => void;
}

// 1. Emoji categories
const EMOJI_CATEGORIES = [
  {
    id: 'recents',
    name: 'Top & Frecuentes',
    icon: Sparkles,
    emojis: ['😀', '😂', '🤣', '😍', '🥰', '😎', '🥳', '👍', '🙏', '❤️', '🔥', '✨', '🚀', '💼', '✅', '💯', '👏', '🎉', '💰', '👌']
  },
  {
    id: 'faces',
    name: 'Caras y Emociones',
    icon: Smile,
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇',
      '🥰', '😍', '🤩', '😘', '😗', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭',
      '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌',
      '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🥵', '🥶', '🥴', '😵',
      '🤯', '🤠', '🥳', '😎', '🤓', '🧐', '😕', '😟', '🙁', '😮', '😯', '😲', '😳',
      '🥺', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓'
    ]
  },
  {
    id: 'gestures',
    name: 'Gestos y Manos',
    icon: ThumbsUp,
    emojis: [
      '👍', '👎', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆',
      '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖', '👏', '🙌', '👐', '🤲', '🤝', '🙏',
      '✍️', '💅', '🤳', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '👃', '🧠', '🫀', '🫁'
    ]
  },
  {
    id: 'business',
    name: 'Ventas y Negocios CRM',
    icon: Briefcase,
    emojis: [
      '💼', '📈', '📉', '📊', '💳', '💰', '💵', '💶', '💷', '🪙', '💸', '🧾', '🏷️',
      '📦', '🚚', '🛒', '🛍️', '🏢', '🏦', '📞', '📱', '📲', '💻', '🖥️', '✉️', '📨',
      '⏰', '⏳', '📅', '📆', '📌', '📍', '🎯', '🚀', '💡', '🔑', '🔒', '✅', '❌',
      '⚠️', 'ℹ️', '🔔', '📢', '🤝', '🥇', '⭐', '🌟', '✨', '⚡', '🔥', '💯', '🏆'
    ]
  },
  {
    id: 'love',
    name: 'Corazones y Símbolos',
    icon: Heart,
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞',
      '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '🕉️', '☸️', '✡️', '🔮', '🧿',
      '💯', '💢', '💥', '💫', '💬', '💭', '🗯️', '💤', '🛑', '⛔', '⭕', '🔴', '🟢'
    ]
  },
  {
    id: 'celebrate',
    name: 'Celebración y Fiesta',
    icon: PartyPopper,
    emojis: [
      '🎉', '🎊', '🎈', '🎂', '🎁', '🏆', '🥇', '🥈', '🥉', '🎖️', '🏅', '🎫', '🎟️',
      '🎪', '🎨', '🎬', '🎤', '🎧', '🎼', '🎵', '🎶', '🥂', '🍻', '🍾', '🍹', '🍸'
    ]
  }
];

// 2. Curated Trending GIFs (Optimized MP4/GIF Web previews)
const CURATED_GIFS = [
  {
    id: 'gif_hola',
    title: 'Hola / Saludo',
    category: 'saludos',
    url: 'https://media.giphy.com/media/dzaUX7CAG0Ihi/giphy.gif',
    preview: 'https://media.giphy.com/media/dzaUX7CAG0Ihi/200w.gif'
  },
  {
    id: 'gif_gracias',
    title: 'Muchas Gracias',
    category: 'gracias',
    url: 'https://media.giphy.com/media/3oz8xIsloV7zOmt81G/giphy.gif',
    preview: 'https://media.giphy.com/media/3oz8xIsloV7zOmt81G/200w.gif'
  },
  {
    id: 'gif_aplausos',
    title: 'Aplausos / Excelente',
    category: 'celebracion',
    url: 'https://media.giphy.com/media/111ebonMs90YLu/giphy.gif',
    preview: 'https://media.giphy.com/media/111ebonMs90YLu/200w.gif'
  },
  {
    id: 'gif_ok',
    title: 'De Acuerdo / Pulgar',
    category: 'confirmacion',
    url: 'https://media.giphy.com/media/10UeedrT5MIfPG/giphy.gif',
    preview: 'https://media.giphy.com/media/10UeedrT5MIfPG/200w.gif'
  },
  {
    id: 'gif_celebrar',
    title: 'Celebrar / Éxito',
    category: 'celebracion',
    url: 'https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif',
    preview: 'https://media.giphy.com/media/artj92V8o75VPL7AeQ/200w.gif'
  },
  {
    id: 'gif_trato',
    title: 'Trato Hecho / Manos',
    category: 'ventas',
    url: 'https://media.giphy.com/media/26gJzFL99JyoxfZra/giphy.gif',
    preview: 'https://media.giphy.com/media/26gJzFL99JyoxfZra/200w.gif'
  },
  {
    id: 'gif_bailar',
    title: 'Bailar / Fiesta',
    category: 'celebracion',
    url: 'https://media.giphy.com/media/blSTtZehjAZ8I/giphy.gif',
    preview: 'https://media.giphy.com/media/blSTtZehjAZ8I/200w.gif'
  },
  {
    id: 'gif_dinero',
    title: 'Venta / Dinero',
    category: 'ventas',
    url: 'https://media.giphy.com/media/LdOyjZ7io5Msw/giphy.gif',
    preview: 'https://media.giphy.com/media/LdOyjZ7io5Msw/200w.gif'
  },
  {
    id: 'gif_risa',
    title: 'Risa / Divertido',
    category: 'risa',
    url: 'https://media.giphy.com/media/10JhviFuU2gWD6/giphy.gif',
    preview: 'https://media.giphy.com/media/10JhviFuU2gWD6/200w.gif'
  },
  {
    id: 'gif_pensando',
    title: 'Revisando / Pensando',
    category: 'atencion',
    url: 'https://media.giphy.com/media/a5viI92PAF89q/giphy.gif',
    preview: 'https://media.giphy.com/media/a5viI92PAF89q/200w.gif'
  },
  {
    id: 'gif_esperando',
    title: 'En Proceso / Espera',
    category: 'atencion',
    url: 'https://media.giphy.com/media/tXL4FHPSnVJ0A/giphy.gif',
    preview: 'https://media.giphy.com/media/tXL4FHPSnVJ0A/200w.gif'
  },
  {
    id: 'gif_fuegos',
    title: 'Fuegos Artificiales',
    category: 'celebracion',
    url: 'https://media.giphy.com/media/26tOZ42Mg6pbTUPHW/giphy.gif',
    preview: 'https://media.giphy.com/media/26tOZ42Mg6pbTUPHW/200w.gif'
  }
];

// 3. Curated Business & Sales WhatsApp Stickers
const CURATED_STICKERS = [
  {
    id: 'stk_pedido_confirmado',
    title: 'Pedido Confirmado',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
      <defs>
        <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#10b981" />
          <stop offset="100%" stop-color="#047857" />
        </linearGradient>
      </defs>
      <rect x="10" y="10" width="180" height="180" rx="35" fill="url(#g1)" stroke="#ffffff" stroke-width="4"/>
      <circle cx="100" cy="75" r="35" fill="#ffffff" opacity="0.2"/>
      <path d="M75 75 L92 92 L125 58" fill="none" stroke="#ffffff" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="100" y="135" font-family="Arial, sans-serif" font-weight="900" font-size="16" fill="#ffffff" text-anchor="middle">¡PEDIDO</text>
      <text x="100" y="160" font-family="Arial, sans-serif" font-weight="900" font-size="16" fill="#ffffff" text-anchor="middle">CONFIRMADO!</text>
    </svg>`
  },
  {
    id: 'stk_en_camino',
    title: 'En Camino',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
      <defs>
        <linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#3b82f6" />
          <stop offset="100%" stop-color="#1d4ed8" />
        </linearGradient>
      </defs>
      <rect x="10" y="10" width="180" height="180" rx="35" fill="url(#g2)" stroke="#ffffff" stroke-width="4"/>
      <text x="100" y="85" font-size="50" text-anchor="middle">🚚</text>
      <text x="100" y="135" font-family="Arial, sans-serif" font-weight="900" font-size="18" fill="#ffffff" text-anchor="middle">¡TU ORDEN VA</text>
      <text x="100" y="160" font-family="Arial, sans-serif" font-weight="900" font-size="18" fill="#ffffff" text-anchor="middle">EN CAMINO!</text>
    </svg>`
  },
  {
    id: 'stk_gracias_compra',
    title: 'Gracias por tu compra',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
      <defs>
        <linearGradient id="g3" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ec4899" />
          <stop offset="100%" stop-color="#be185d" />
        </linearGradient>
      </defs>
      <rect x="10" y="10" width="180" height="180" rx="35" fill="url(#g3)" stroke="#ffffff" stroke-width="4"/>
      <text x="100" y="80" font-size="50" text-anchor="middle">💖</text>
      <text x="100" y="130" font-family="Arial, sans-serif" font-weight="900" font-size="15" fill="#ffffff" text-anchor="middle">¡MUCHAS GRACIAS</text>
      <text x="100" y="155" font-family="Arial, sans-serif" font-weight="900" font-size="15" fill="#ffffff" text-anchor="middle">POR TU COMPRA!</text>
    </svg>`
  },
  {
    id: 'stk_cotizacion_lista',
    title: 'Cotización Lista',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
      <defs>
        <linearGradient id="g4" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f59e0b" />
          <stop offset="100%" stop-color="#b45309" />
        </linearGradient>
      </defs>
      <rect x="10" y="10" width="180" height="180" rx="35" fill="url(#g4)" stroke="#ffffff" stroke-width="4"/>
      <text x="100" y="85" font-size="50" text-anchor="middle">📄</text>
      <text x="100" y="135" font-family="Arial, sans-serif" font-weight="900" font-size="17" fill="#ffffff" text-anchor="middle">COTIZACIÓN</text>
      <text x="100" y="160" font-family="Arial, sans-serif" font-weight="900" font-size="17" fill="#ffffff" text-anchor="middle">LISTA</text>
    </svg>`
  },
  {
    id: 'stk_excelente_dia',
    title: 'Excelente Día',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
      <defs>
        <linearGradient id="g5" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#06b6d4" />
          <stop offset="100%" stop-color="#0e7490" />
        </linearGradient>
      </defs>
      <rect x="10" y="10" width="180" height="180" rx="35" fill="url(#g5)" stroke="#ffffff" stroke-width="4"/>
      <text x="100" y="85" font-size="50" text-anchor="middle">☀️</text>
      <text x="100" y="135" font-family="Arial, sans-serif" font-weight="900" font-size="18" fill="#ffffff" text-anchor="middle">¡EXCELENTE</text>
      <text x="100" y="160" font-family="Arial, sans-serif" font-weight="900" font-size="18" fill="#ffffff" text-anchor="middle">DÍA!</text>
    </svg>`
  },
  {
    id: 'stk_trato_hecho',
    title: 'Trato Hecho',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
      <defs>
        <linearGradient id="g6" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#8b5cf6" />
          <stop offset="100%" stop-color="#6d28d9" />
        </linearGradient>
      </defs>
      <rect x="10" y="10" width="180" height="180" rx="35" fill="url(#g6)" stroke="#ffffff" stroke-width="4"/>
      <text x="100" y="85" font-size="50" text-anchor="middle">🤝</text>
      <text x="100" y="135" font-family="Arial, sans-serif" font-weight="900" font-size="18" fill="#ffffff" text-anchor="middle">¡TRATO</text>
      <text x="100" y="160" font-family="Arial, sans-serif" font-weight="900" font-size="18" fill="#ffffff" text-anchor="middle">HECHO!</text>
    </svg>`
  },
  {
    id: 'stk_recibido',
    title: 'Recibido con éxito',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
      <defs>
        <linearGradient id="g7" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#14b8a6" />
          <stop offset="100%" stop-color="#0f766e" />
        </linearGradient>
      </defs>
      <rect x="10" y="10" width="180" height="180" rx="35" fill="url(#g7)" stroke="#ffffff" stroke-width="4"/>
      <text x="100" y="85" font-size="50" text-anchor="middle">📦</text>
      <text x="100" y="135" font-family="Arial, sans-serif" font-weight="900" font-size="18" fill="#ffffff" text-anchor="middle">¡RECIBIDO</text>
      <text x="100" y="160" font-family="Arial, sans-serif" font-weight="900" font-size="18" fill="#ffffff" text-anchor="middle">CON ÉXITO!</text>
    </svg>`
  },
  {
    id: 'stk_100_garantizado',
    title: '100% Garantizado',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
      <defs>
        <linearGradient id="g8" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ef4444" />
          <stop offset="100%" stop-color="#b91c1c" />
        </linearGradient>
      </defs>
      <rect x="10" y="10" width="180" height="180" rx="35" fill="url(#g8)" stroke="#ffffff" stroke-width="4"/>
      <text x="100" y="85" font-size="50" text-anchor="middle">💯</text>
      <text x="100" y="135" font-family="Arial, sans-serif" font-weight="900" font-size="17" fill="#ffffff" text-anchor="middle">CALIDAD</text>
      <text x="100" y="160" font-family="Arial, sans-serif" font-weight="900" font-size="17" fill="#ffffff" text-anchor="middle">GARANTIZADA</text>
    </svg>`
  }
];

export default function EmojiGifStickerPicker({
  isOpen,
  onClose,
  onSelectEmoji,
  onSendGif,
  onSendSticker
}: EmojiGifStickerPickerProps) {
  const [activeTab, setActiveTab] = useState<'emojis' | 'gifs' | 'stickers'>('emojis');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGif, setSelectedGif] = useState<{ url: string; preview: string; title: string } | null>(null);
  const [gifCaption, setGifCaption] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('recents');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter emojis based on search
  const filteredEmojis = useMemo(() => {
    if (!searchTerm.trim()) return null;
    const term = searchTerm.toLowerCase();
    // Return all matching emojis across categories
    const all = EMOJI_CATEGORIES.flatMap(c => c.emojis);
    return Array.from(new Set(all)).slice(0, 72);
  }, [searchTerm]);

  // Filter GIFs
  const filteredGifs = useMemo(() => {
    if (!searchTerm.trim()) return CURATED_GIFS;
    const term = searchTerm.toLowerCase();
    return CURATED_GIFS.filter(g => 
      g.title.toLowerCase().includes(term) || g.category.toLowerCase().includes(term)
    );
  }, [searchTerm]);

  // Convert SVG string to Base64 image
  const handleStickerClick = (svgString: string) => {
    const encoded = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));
    // Convert to canvas -> PNG Base64 for WhatsApp
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, 512, 512);
        ctx.drawImage(img, 0, 0, 512, 512);
        const pngBase64 = canvas.toDataURL('image/png');
        onSendSticker(pngBase64, true);
        onClose();
      }
    };
    img.src = encoded;
  };

  // Convert custom uploaded image to sticker
  const handleCustomStickerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          onSendSticker(result, true);
          onClose();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current && 
        !containerRef.current.contains(e.target as Node) &&
        !(e.target as HTMLElement).closest('[data-picker-toggle]')
      ) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 50);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      ref={containerRef}
      className="absolute bottom-full mb-3 left-2 right-2 sm:left-4 sm:right-auto sm:w-96 max-h-[480px] h-[460px] bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] z-50 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200"
    >
      {/* Hidden file input for creating custom sticker */}
      <input 
        type="file" 
        ref={fileInputRef} 
        accept="image/*" 
        className="hidden" 
        onChange={handleCustomStickerUpload}
      />

      {/* Header with Search and Close */}
      <div className="p-3 border-b border-white/5 flex items-center gap-2 shrink-0">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              activeTab === 'emojis' ? 'Buscar emoji...' :
              activeTab === 'gifs' ? 'Buscar GIFs (hola, gracias, risa...)' :
              'Buscar stickers...'
            }
            className="w-full h-9 bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
        {/* ================= TAB 1: EMOJIS ================= */}
        {activeTab === 'emojis' && (
          <div className="space-y-4">
            {filteredEmojis ? (
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 px-1">Resultados de búsqueda</p>
                <div className="grid grid-cols-8 gap-1.5">
                  {filteredEmojis.map((emoji, i) => (
                    <button
                      key={i}
                      onClick={() => onSelectEmoji(emoji)}
                      className="w-9 h-9 rounded-xl hover:bg-white/10 flex items-center justify-center text-xl transition-transform active:scale-125"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              EMOJI_CATEGORIES.map((cat) => (
                <div key={cat.id} className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                    <cat.icon className="w-3 h-3 text-emerald-400" />
                    <span>{cat.name}</span>
                  </div>
                  <div className="grid grid-cols-8 gap-1.5">
                    {cat.emojis.map((emoji, i) => (
                      <button
                        key={i}
                        onClick={() => onSelectEmoji(emoji)}
                        className="w-9 h-9 rounded-xl hover:bg-white/10 flex items-center justify-center text-xl transition-transform active:scale-125"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ================= TAB 2: GIFS ================= */}
        {activeTab === 'gifs' && (
          <div className="space-y-3">
            {/* Quick search tags */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 custom-scrollbar text-[11px]">
              {['Todos', 'Hola', 'Gracias', 'Celebrar', 'Ok', 'Ventas', 'Risa'].map(tag => (
                <button
                  key={tag}
                  onClick={() => setSearchTerm(tag === 'Todos' ? '' : tag.toLowerCase())}
                  className={cn(
                    "px-2.5 py-1 rounded-lg shrink-0 font-medium transition-all",
                    (tag === 'Todos' && !searchTerm) || searchTerm === tag.toLowerCase()
                      ? "bg-emerald-500 text-white font-bold"
                      : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Selected GIF Preview Modal */}
            {selectedGif ? (
              <div className="p-3 bg-white/5 border border-white/10 rounded-2xl space-y-3 animate-in fade-in duration-150">
                <div className="relative rounded-xl overflow-hidden aspect-video bg-black/40 flex items-center justify-center">
                  <img src={selectedGif.url} alt={selectedGif.title} className="max-h-48 object-contain" />
                  <button
                    onClick={() => setSelectedGif(null)}
                    className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={gifCaption}
                    onChange={(e) => setGifCaption(e.target.value)}
                    placeholder="Añadir un comentario (opcional)..."
                    className="flex-1 h-10 bg-white/5 border border-white/10 rounded-xl px-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
                  />
                  <button
                    onClick={() => {
                      onSendGif(selectedGif.url, gifCaption);
                      setSelectedGif(null);
                      setGifCaption('');
                      onClose();
                    }}
                    className="px-4 h-10 bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Enviar</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {filteredGifs.map((gif) => (
                  <div
                    key={gif.id}
                    onClick={() => setSelectedGif(gif)}
                    className="group relative rounded-xl overflow-hidden aspect-video bg-white/5 cursor-pointer border border-white/5 hover:border-emerald-500/50 transition-all hover:scale-[1.02]"
                  >
                    <img 
                      src={gif.preview} 
                      alt={gif.title} 
                      className="w-full h-full object-cover" 
                      loading="lazy" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                      <span className="text-[10px] font-bold text-white truncate">{gif.title}</span>
                    </div>
                    <span className="absolute bottom-1 right-1 bg-black/70 text-emerald-400 text-[9px] font-black px-1.5 py-0.5 rounded">
                      GIF
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 3: STICKERS ================= */}
        {activeTab === 'stickers' && (
          <div className="space-y-4">
            {/* Create Custom Sticker Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-3 rounded-2xl border border-dashed border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 flex items-center justify-center gap-2 transition-all font-bold text-xs group"
            >
              <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
              <span>Crear Sticker desde tu Galería / Imagen</span>
            </button>

            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">
                Stickers CRM & Ventas WhatsApp
              </p>
              <div className="grid grid-cols-3 gap-2.5">
                {CURATED_STICKERS.map((stk) => (
                  <button
                    key={stk.id}
                    onClick={() => handleStickerClick(stk.svg)}
                    title={stk.title}
                    className="p-2 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-emerald-500/40 flex items-center justify-center aspect-square transition-all hover:scale-105 active:scale-95 group"
                    dangerouslySetInnerHTML={{ __html: stk.svg }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom WhatsApp-style Navigation Bar */}
      <div className="p-2 bg-slate-950/80 border-t border-white/5 flex items-center justify-around shrink-0">
        <button
          onClick={() => setActiveTab('emojis')}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all",
            activeTab === 'emojis'
              ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          )}
        >
          <Smile className="w-4 h-4" />
          <span>Emojis</span>
        </button>

        <button
          onClick={() => setActiveTab('gifs')}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all",
            activeTab === 'gifs'
              ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          )}
        >
          <Film className="w-4 h-4" />
          <span>GIFs</span>
        </button>

        <button
          onClick={() => setActiveTab('stickers')}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all",
            activeTab === 'stickers'
              ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          )}
        >
          <Sticker className="w-4 h-4" />
          <span>Stickers</span>
        </button>
      </div>
    </div>
  );
}

export { EmojiGifStickerPicker };
