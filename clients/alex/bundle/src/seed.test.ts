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

  it('home lists the five projects, each with a built-in animation', () => {
    const data = alexSeed.pages[0]!.blocks[0]!.data as PortfolioProjectsData;
    expect(data.projects).toHaveLength(5);
    expect(data.projects.every((p) => p.animation.kind === 'builtin')).toBe(true);
    expect(data.projects.map((p) => p.order)).toEqual([0, 1, 2, 3, 4]);
  });
});
