import { registry, validateContent, type ProjectGridData, type ShopData } from '@csp/blocks';
import { describe, expect, it } from 'vitest';
import { jmdmSeed } from './seed';

describe('jmdm seed', () => {
  it('is a valid TenantContent against the shared registry', () => {
    const result = validateContent(registry.toValidators(), jmdmSeed);
    // Surface the issues if it fails, so the assertion message is actionable.
    expect(result.ok ? 'ok' : JSON.stringify(result.issues)).toBe('ok');
  });

  it('has the expected pages', () => {
    expect(jmdmSeed.pages.map((p) => p.slug)).toEqual(['/', '/about', '/shop']);
  });

  it('home index lists every work (14) and the shop is a beta CAD subset (12)', () => {
    const grid = jmdmSeed.pages[0]!.blocks[0]!.data as ProjectGridData;
    expect(grid.projects).toHaveLength(14);

    const shopPage = jmdmSeed.pages.find((p) => p.slug === '/shop')!;
    const shop = shopPage.blocks.find((b) => b.type === 'shop')!.data as ShopData;
    expect(shop.enabled).toBe(false); // beta
    expect(shop.currency).toBe('CAD');
    expect(shop.items).toHaveLength(12);
    expect(shop.items.every((i) => Number.isInteger(i.priceCents) && i.priceCents > 0)).toBe(true);
  });
});
