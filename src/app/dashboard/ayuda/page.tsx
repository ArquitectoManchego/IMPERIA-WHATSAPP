import React from 'react';
import Link from 'next/link';
import { getHelpCategories, getHelpArticles } from '@/lib/help-store';
import {
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
  ArrowRight,
  Clock,
  Mic,
  Shield,
  Layers,
  Zap,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

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

export default async function HelpCenterPage() {
  const [categories, articles] = await Promise.all([
    getHelpCategories(),
    getHelpArticles(),
  ]);

  const featuredArticles = [
    {
      title: 'Agendar Mensajes para Envío Futuro',
      slug: 'mensajes/redaccion/agendar-mensajes',
      icon: Clock,
      category: 'Mensajes',
      badge: 'Nuevo',
    },
    {
      title: 'Notas de Voz Nativas (PTT) con Micrófono',
      slug: 'mensajes/redaccion/notas-de-voz-ptt',
      icon: Mic,
      category: 'Mensajes',
      badge: 'Popular',
    },
    {
      title: 'Campañas Masivas y Protección Anti-Baneo con IA',
      slug: 'campanas/antiban/campanas-ia-antiban',
      icon: Shield,
      category: 'Campañas',
      badge: 'Esencial',
    },
    {
      title: 'Programa de Fidelidad, Puntos y Reseñas',
      slug: 'fidelidad/puntos/programa-fidelidad',
      icon: Award,
      category: 'Fidelidad',
      badge: 'Lealtad',
    },
    {
      title: 'Gestión de Clientes y Etiquetas Jerárquicas UV',
      slug: 'clientes/tags/clientes-etiquetas-uv',
      icon: Users,
      category: 'Clientes',
      badge: 'Módulo Oculto',
    },
    {
      title: 'Diagnóstico y Reconexión del Motor WhatsApp',
      slug: 'soporte-tecnico/diagnostico/diagnostico-reconexion',
      icon: Zap,
      category: 'Soporte',
      badge: 'Técnico',
    },
  ];

  return (
    <div className="space-y-10 pb-12">
      {/* Hero Banner */}
      <div className="relative rounded-3xl p-6 sm:p-10 border border-white/10 bg-gradient-to-br from-emerald-950/40 via-slate-900 to-black overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            Centro de Documentación & Ayuda
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            ¿Cómo podemos ayudarte hoy en <span className="text-emerald-400">IMPERIA</span>?
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
            Aprende a dominar cada función con diagramas de flujo, capturas con zoom explicativo y guías paso a paso de todos los módulos.
          </p>
        </div>
      </div>

      {/* Featured Quick Articles */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-400" />
            Artículos Más Consultados
          </h2>
          <span className="text-xs text-slate-500">Acceso rápido</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {featuredArticles.map((item, idx) => {
            const Icon = item.icon;
            return (
              <Link
                key={idx}
                href={`/dashboard/ayuda/${item.slug}`}
                className="group p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-emerald-500/40 transition-all duration-200 flex flex-col justify-between shadow-lg"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-white/5 text-slate-400 group-hover:text-emerald-300 group-hover:bg-emerald-500/10 transition-colors">
                      {item.badge}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-white group-hover:text-emerald-300 transition-colors line-clamp-2">
                    {item.title}
                  </h3>
                </div>

                <div className="pt-3 mt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                  <span>{item.category}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Categories Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            Explorar por Módulo
          </h2>
          <span className="text-xs text-slate-500">{categories.length} categorías</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map((cat) => {
            const Icon = iconMap[cat.icon] || HelpCircle;
            const categoryArticles = articles.filter((a) => a.categoryId === cat.id);
            const firstArticle = categoryArticles[0];
            const targetHref = firstArticle
              ? `/dashboard/ayuda/${firstArticle.slug}`
              : `/dashboard/ayuda#${cat.id}`;

            return (
              <div
                key={cat.id}
                className="p-5 sm:p-6 rounded-3xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 hover:border-emerald-500/30 transition-all duration-200 flex flex-col justify-between space-y-4 shadow-xl group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform shadow-md">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-white group-hover:text-emerald-300 transition-colors">
                          {cat.title}
                        </h3>
                        <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                          {categoryArticles.length} {categoryArticles.length === 1 ? 'artículo' : 'artículos'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                    {cat.description}
                  </p>

                  {/* Subcategories pills */}
                  {Array.isArray(cat.subcategories) && cat.subcategories.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {cat.subcategories.map((sub) => (
                        <span
                          key={sub.id}
                          className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-white/5 text-slate-400 border border-white/5"
                        >
                          {sub.title}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                  <Link
                    href={targetHref}
                    className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 transition-colors"
                  >
                    <span>Ver documentación</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
