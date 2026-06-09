import { registry, validateContent, type PortfolioProjectsData } from '@csp/blocks';
import { describe, expect, it } from 'vitest';
import { alexSeed } from './seed';

describe('alex seed', () => {
  it('is a valid TenantContent against the shared registry', () => {
    const result = validateContent(registry.toValidators(), alexSeed);
    // Surface the issues if it fails, so the assertion message is actionable.
    expect(result.ok ? 'ok' : JSON.stringify(result.issues)).toBe('ok');
  });

  it('has home + about pages', () => {
    expect(alexSeed.pages.map((p) => p.slug)).toEqual(['/', '/about']);
  });

  it('home lists the six projects: five built-in motifs plus one uploaded Lottie', () => {
    const data = alexSeed.pages[0]!.blocks[0]!.data as PortfolioProjectsData;
    expect(data.projects).toHaveLength(6);
    expect(data.projects.filter((p) => p.animation.kind === 'builtin')).toHaveLength(5);
    const lottie = data.projects.filter((p) => p.animation.kind === 'lottie');
    expect(lottie).toHaveLength(1);
    expect(lottie[0]!.id).toBe('recipes');
    expect(data.projects.map((p) => p.order)).toEqual([0, 1, 2, 3, 4, 5]);
  });
});
