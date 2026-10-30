import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getHelpArticleBySlug, getHelpCategories, getHelpArticles } from '@/lib/help-store';
import HelpBreadcrumbs from '@/components/help/HelpBreadcrumbs';
import HelpBlockRenderer from '@/components/help/HelpBlockRenderer';
import {
  FileText,
  Calendar,
  ExternalLink,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Sparkles,
  HelpCircle,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    slug: string[];
  }>;
}

export default async function HelpArticlePage({ params }: PageProps) {
  const resolvedParams = await params;
  const slugParts = resolvedParams.slug || [];
  const fullSlug = slugParts.join('/');

  // 1. Try resolving as an article
  const article = await getHelpArticleBySlug(fullSlug);

  // 2. If not found, check if slug is a category id (e.g. 'mensajes')
  if (!article) {
    const [categories, allArticles] = await Promise.all([
      getHelpCategories(),
      getHelpArticles(),
    ]);

    const category = categories.find((c) => c.id === slugParts[0]);
    if (category) {
      const categoryArticles = allArticles.filter((a) => a.categoryId === category.id);
      return (
        <div className="space-y-8 pb-12">
          <HelpBreadcrumbs
            items={[
              { label: category.title },
            ]}
          />

          <div className="space-y-3 border-b border-white/10 pb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
              <BookOpen className="w-3.5 h-3.5" />
              Categoría de Documentación
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {category.title}
            </h1>
            <p className="text-sm sm:text-base text-slate-300 font-normal leading-relaxed">
              {category.description}
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-base font-bold text-white tracking-tight">Artículos en esta categoría:</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {categoryArticles.map((art) => (
                <Link
                  key={art.id}
                  href={`/dashboard/ayuda/${art.slug}`}
                  className="p-5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 hover:border-emerald-500/40 transition-all flex flex-col justify-between group shadow-lg"
                >
                  <div className="space-y-2">
                    <h3 className="font-bold text-sm text-white group-hover:text-emerald-300 transition-colors">
                      {art.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2">{art.summary}</p>
                  </div>
                  <div className="pt-3 mt-3 border-t border-white/5 flex items-center justify-between text-xs text-emerald-400 font-bold">
                    <span>Leer guía</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      );
    }

    notFound();
  }

  // 3. Resolve category info and prev/next navigation
  const [categories, allArticles] = await Promise.all([
    getHelpCategories(),
    getHelpArticles(),
  ]);

  const category = categories.find((c) => c.id === article.categoryId);
  const subcategory = category?.subcategories.find((s) => s.id === article.subcategoryId);

  // Find next and prev articles within same category or overall
  const categoryArticles = allArticles.filter((a) => a.categoryId === article.categoryId);
  const currentIndex = categoryArticles.findIndex((a) => a.id === article.id);
  const prevArticle = currentIndex > 0 ? categoryArticles[currentIndex - 1] : null;
  const nextArticle = currentIndex < categoryArticles.length - 1 ? categoryArticles[currentIndex + 1] : null;

  const breadcrumbItems = [];
  if (category) {
    breadcrumbItems.push({
      label: category.title,
      href: `/dashboard/ayuda/${category.id}`,
    });
  }
  if (subcategory) {
    breadcrumbItems.push({
      label: subcategory.title,
    });
  }
  breadcrumbItems.push({
    label: article.title,
  });

  return (
    <article className="space-y-8 pb-16">
      {/* Breadcrumbs */}
      <HelpBreadcrumbs items={breadcrumbItems} />

      {/* Article Header */}
      <header className="space-y-4 border-b border-white/10 pb-6">
        <div className="flex flex-wrap items-center gap-2">
          {category && (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {category.title}
            </span>
          )}
          {subcategory && (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-white/5 text-slate-400 border border-white/10">
              {subcategory.title}
            </span>
          )}
          {article.moduleRoute && (
            <Link
              href={article.moduleRoute}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20 hover:bg-sky-500/20 transition-colors ml-auto"
            >
              <span>Ir al módulo en vivo</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </Link>
          )}
        </div>

        <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
          {article.title}
        </h1>

        <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
          {article.summary}
        </p>

        <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>Actualizado: {new Date(article.updatedAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
          </div>
          {article.keywords && article.keywords.length > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 flex-wrap">
              <span>Etiquetas:</span>
              {article.keywords.map((k) => (
                <span key={k} className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-slate-400 font-mono">
                  #{k}
                </span>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Main Blocks Content */}
      <div className="prose prose-invert max-w-none">
        <HelpBlockRenderer blocks={article.blocks} />
      </div>

      {/* Prev / Next Article Navigation Footer */}
      <footer className="pt-8 border-t border-white/10 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {prevArticle ? (
            <Link
              href={`/dashboard/ayuda/${prevArticle.slug}`}
              className="p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-emerald-500/30 transition-all flex items-center gap-3 group text-left"
            >
              <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 group-hover:-translate-x-1 transition-all shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Anterior</span>
                <span className="text-xs sm:text-sm font-bold text-white group-hover:text-emerald-300 truncate block">
                  {prevArticle.title}
                </span>
              </div>
            </Link>
          ) : <div />}

          {nextArticle ? (
            <Link
              href={`/dashboard/ayuda/${nextArticle.slug}`}
              className="p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-emerald-500/30 transition-all flex items-center justify-between gap-3 group text-right sm:ml-auto w-full"
            >
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Siguiente</span>
                <span className="text-xs sm:text-sm font-bold text-white group-hover:text-emerald-300 truncate block">
                  {nextArticle.title}
                </span>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all shrink-0" />
            </Link>
          ) : <div />}
        </div>

        {/* Return to help center */}
        <div className="text-center pt-2">
          <Link
            href="/dashboard/ayuda"
            className="text-xs font-bold text-slate-400 hover:text-emerald-400 transition-colors inline-flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Volver al índice general del Centro de Ayuda</span>
          </Link>
        </div>
      </footer>
    </article>
  );
}
