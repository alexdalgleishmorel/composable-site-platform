import type { ShopData } from '@csp/blocks';
import type { TenantContent } from '@csp/core';
import { createContext, useContext } from 'react';

export const ContentContext = createContext<TenantContent | null>(null);

export function useSiteContent(): TenantContent {
  const content = useContext(ContentContext);
  if (!content) throw new Error('useSiteContent must be used within a content provider');
  return content;
}

/** Whether the shop block is publicly enabled (drives nav visibility — beta shops stay hidden). */
export function useShopEnabled(): boolean {
  const content = useSiteContent();
  const shopBlock = content.pages
    .find((page) => page.slug === '/shop')
    ?.blocks.find((block) => block.type === 'shop');
  return (shopBlock?.data as ShopData | undefined)?.enabled ?? false;
}
