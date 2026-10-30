export type HelpTone = 'info' | 'tip' | 'warning' | 'danger';

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
  description?: string;
}

export interface ShotMetadata {
  id: string;
  title: string;
  imagePath: string;
  videoPath?: string;
  width: number;
  height: number;
  elements: Record<string, BoundingBox>;
}

export type HelpBlock =
  | {
      type: 'paragraph';
      text: string;
    }
  | {
      type: 'steps';
      title?: string;
      items: Array<{
        step: number;
        title: string;
        description: string;
        tip?: string;
        focusElement?: string;
      }>;
    }
  | {
      type: 'table';
      title?: string;
      headers: string[];
      rows: string[][];
    }
  | {
      type: 'callout';
      tone: HelpTone;
      title?: string;
      text: string;
    }
  | {
      type: 'screenshot';
      shotId: string;
      focusId?: string;
      mode: 'full' | 'zoom' | 'split' | 'annotated';
      caption?: string;
      zoomPadding?: number;
    }
  | {
      type: 'media';
      mediaType: 'video' | 'gif' | 'image';
      src: string;
      poster?: string;
      caption?: string;
      loop?: boolean;
    }
  | {
      type: 'diagram';
      title?: string;
      mermaid: string;
      caption?: string;
    }
  | {
      type: 'faq';
      items: Array<{
        question: string;
        answer: string;
      }>;
    };

export interface HelpArticle {
  id: string;
  slug: string;
  categoryId: string;
  subcategoryId?: string;
  title: string;
  summary: string;
  keywords: string[];
  moduleRoute?: string;
  order: number;
  updatedAt: string;
  blocks: HelpBlock[];
}

export interface HelpSubcategory {
  id: string;
  categoryId: string;
  title: string;
  description?: string;
  order: number;
  articleIds?: string[];
}

export interface HelpCategory {
  id: string;
  title: string;
  icon: string;
  description: string;
  order: number;
  subcategories: HelpSubcategory[];
}

export interface HelpTreeItem {
  category: HelpCategory;
  subcategories: Array<{
    subcategory: HelpSubcategory;
    articles: HelpArticle[];
  }>;
  directArticles: HelpArticle[];
}
