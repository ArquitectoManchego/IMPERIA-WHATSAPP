'use client';

import React from 'react';
import { 
  X, 
  User, 
  Phone, 
  ExternalLink, 
  Award, 
  Tag as TagIcon, 
  Star, 
  Gift, 
  Sparkles, 
  CheckCircle2, 
  Copy,
  MessageCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { CustomerLoyaltyProfile, TIER_CONFIG } from '@/lib/loyalty-store';

interface ContactPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: {
    id: string;
    name: string;
    phone: string;
    avatar?: string;
    tags?: string[];
    status?: string;
    stage?: string;
  } | null;
  loyaltyProfile?: CustomerLoyaltyProfile | null;
}

export default function ContactPhotoModal({
  isOpen,
  onClose,
  contact,
  loyaltyProfile
}: ContactPhotoModalProps) {
  const { toast } = useToast();

  if (!isOpen || !contact) return null;

  const displayName = contact.name || 'Sin Nombre';
  const displayPhone = contact.phone || '';
  const tags = contact.tags || [];
  const tier = loyaltyProfile?.tier || 'bronze';
  const tierConfig = TIER_CONFIG[tier];

  const handleCopyPhone = () => {
    if (!displayPhone) return;
    navigator.clipboard.writeText(displayPhone);
    toast({
      title: 'Teléfono copiado',
      description: displayPhone,
    });
  };

  const cleanDigits = displayPhone.replace(/\D/g, '');
  const waUrl = cleanDigits ? `https://wa.me/${cleanDigits}` : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between p-4 px-6 border-b border-white/5 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white tracking-wide">
              Foto de Contacto & Ficha Ampliada
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Large Photo Section */}
          <div className="flex flex-col items-center justify-center text-center">
            <div className={`w-44 h-44 sm:w-52 sm:h-52 rounded-3xl p-1.5 bg-gradient-to-br ${tierConfig.gradient} shadow-2xl relative group`}>
              <div className="w-full h-full rounded-[1.3rem] overflow-hidden bg-slate-950 flex items-center justify-center border border-white/10 relative">
                {contact.avatar ? (
                  <img
                    src={contact.avatar}
                    alt={displayName}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 text-slate-200 font-extrabold text-4xl">
                    {(displayName || 'C').slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Tier Pill Badge on Photo */}
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-lg backdrop-blur-md ${tierConfig.badgeColor}`}>
                  <Award className="w-3.5 h-3.5" />
                  <span>Nivel {tierConfig.name}</span>
                </span>
              </div>
            </div>

            {/* Name and Phone */}
            <div className="mt-5 space-y-1">
              <h2 className="text-xl font-black text-white tracking-tight">
                {displayName}
              </h2>
              <div className="flex items-center justify-center gap-2 text-slate-400 text-xs font-mono">
                <span>{displayPhone}</span>
                <button
                  onClick={handleCopyPhone}
                  title="Copiar teléfono"
                  className="p-1 hover:text-emerald-400 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Loyalty & Reputation Stats */}
          {loyaltyProfile && (
            <div className="grid grid-cols-3 gap-2.5 p-3 rounded-2xl bg-white/[0.03] border border-white/5 text-center">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Puntos</span>
                <span className="text-base font-black text-emerald-400">
                  {loyaltyProfile.currentPoints} <span className="text-[10px] font-normal text-emerald-500/80">PTS</span>
                </span>
              </div>
              <div className="border-x border-white/5">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Google Reviews</span>
                <span className="text-base font-black text-yellow-400 flex items-center justify-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-yellow-400" />
                  <span>5.0</span>
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Monedero</span>
                <span className="text-xs font-mono font-bold text-slate-200 mt-1 block">
                  {loyaltyProfile.cardNumber}
                </span>
              </div>
            </div>
          )}

          {/* Institutional Tags */}
          {tags.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <TagIcon className="w-3 h-3 text-emerald-400" />
                <span>Etiquetas Institucionales</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  >
                    <span>{t}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Active Rewards Available */}
          {loyaltyProfile && loyaltyProfile.availableRewards.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-300 flex items-center gap-1.5">
                  <Gift className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Beneficio Disponible para Canje Inmediato</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                  {loyaltyProfile.availableRewards[0].pointsRequired} pts
                </span>
              </div>
              <p className="text-xs font-medium text-white">
                {loyaltyProfile.availableRewards[0].name}
              </p>
              <p className="text-[10px] text-slate-400">
                {loyaltyProfile.availableRewards[0].description}
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 px-6 border-t border-white/5 bg-slate-950/80 flex items-center justify-between gap-3">
          {waUrl ? (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1"
            >
              <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl h-10 flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50">
                <MessageCircle className="w-4 h-4" />
                <span>Abrir en WhatsApp Web</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-70" />
              </Button>
            </a>
          ) : null}

          <Button
            variant="outline"
            onClick={onClose}
            className="border-white/10 hover:bg-white/5 text-slate-300 text-xs rounded-xl h-10 px-5"
          >
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}
