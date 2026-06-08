import type {
  LinkListData,
  PortfolioProject,
  PortfolioProjectsData,
  RichTextData,
} from '@csp/blocks';
import type { TenantContent } from '@csp/core';
import { createContext, useContext } from 'react';

export const ContentContext = createContext<TenantContent | null>(null);

export function useSiteContent(): TenantContent {
  const content = useContext(ContentContext);
  if (!content) throw new Error('useSiteContent must be used within a content provider');
  return content;
}

/** Find one block's `data` by page slug + block type (the bundle composes pages directly). */
function blockData<T>(content: TenantContent, slug: string, type: string): T | undefined {
  return content.pages.find((p) => p.slug === slug)?.blocks.find((b) => b.type === type)?.data as
    | T
    | undefined;
}

/** The portfolio projects (home `portfolioProject` block), sorted by display order. */
export function useProjects(): PortfolioProject[] {
  const content = useSiteContent();
  const data = blockData<PortfolioProjectsData>(content, '/', 'portfolioProject');
  return [...(data?.projects ?? [])].sort((a, b) => a.order - b.order);
}

/** The about-page bio paragraphs (a `richText` block). */
export function useBioParagraphs(): string[] {
  const content = useSiteContent();
  return blockData<RichTextData>(content, '/about', 'richText')?.paragraphs ?? [];
}

/** The about-page external links (a `linkList` block). */
export function useAboutLinks(): LinkListData['links'] {
  const content = useSiteContent();
  return blockData<LinkListData>(content, '/about', 'linkList')?.links ?? [];
}
