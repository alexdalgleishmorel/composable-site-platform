import { newId } from '@csp/core';
import { z } from 'zod';

/**
 * type: "portfolioProject" — the developer-portfolio project model (Alex's site). Distinct from
 * `projectGrid` (gallery/shop works): each project drives a bespoke "laptop screen" animation and
 * carries three named action links + a per-project accent pair.
 */

/** Built-in CSS-motif keys the client bundle ships (the alternative animation source is upload). */
export const builtinMotifKeys = [
  'expense-visualizer',
  'mortgage',
  'flow-report',
  'average-cost',
  'poker-flow',
  'wave',
  'rings',
  'bars',
  'pulse',
] as const;
export type BuiltinMotifKey = (typeof builtinMotifKeys)[number];

/**
 * A project's animation is *content, not code*: either a built-in motif key (rendered by the bundle's
 * CSS-motif registry) or an uploaded Lottie JSON URL (played by lottie-react). This is what lets a new
 * project with a new animation be added from the admin with no redeploy.
 */
export const animationSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('builtin'), key: z.enum(builtinMotifKeys) }),
  z.object({ kind: z.literal('lottie'), url: z.string().url() }),
]);
export type Animation = z.infer<typeof animationSchema>;

const hexColor = z.string().regex(/^#([0-9a-fA-F]{6})$/, 'must be a #rrggbb hex colour');

/** The three optional, named action links (mirrors the source portfolio's `links`). */
export const portfolioLinksSchema = z.object({
  github: z.string().url().optional(),
  demo: z.string().url().optional(),
  try: z.string().url().optional(),
});
export type PortfolioLinks = z.infer<typeof portfolioLinksSchema>;

export const portfolioProjectSchema = z.object({
  id: z.string().min(1),
  name: z.string(), // may be empty while drafting; the render falls back to "(untitled)"
  headline: z.string(),
  description: z.string(),
  links: portfolioLinksSchema,
  accent: hexColor,
  accent2: hexColor,
  animation: animationSchema,
  order: z.number().int().nonnegative(),
});
export type PortfolioProject = z.infer<typeof portfolioProjectSchema>;

export const portfolioProjectsSchema = z.object({
  projects: z.array(portfolioProjectSchema),
});
export type PortfolioProjectsData = z.infer<typeof portfolioProjectsSchema>;

export const portfolioProjectsDefault = (): PortfolioProjectsData => ({ projects: [] });

/** A fresh project with a stable id (never a content hash), sensible accents, and a built-in motif. */
export const newPortfolioProject = (order = 0): PortfolioProject => ({
  id: newId(),
  name: '',
  headline: '',
  description: '',
  links: {},
  accent: '#38BDF8',
  accent2: '#2DD4BF',
  animation: { kind: 'builtin', key: 'pulse' },
  order,
});
