import type { PortfolioProject } from '@csp/blocks';
import type { TenantContent } from '@csp/core';

/**
 * The alexdalgleishmorel.com content seed — the standalone portfolio's `data/projects.ts` (plus bio
 * and links) reconstructed on the block model.
 *
 * - Home ("/") is a single `portfolioProject` block; the original five keep their built-in CSS motifs,
 *   while Recipes uses an uploaded Lottie animation (the "content, not code" path — no redeploy).
 * - About ("/about") is a `richText` bio + a `linkList` of external links.
 * - Brand (name / role) lives in `siteMeta` (set here; the admin edits blocks, not siteMeta).
 *
 * This module is the dev/standalone fallback for the bundle AND the document PUT at onboard (U6).
 */
const projects: PortfolioProject[] = [
  {
    id: 'expense-visualizer',
    name: 'Expense Visualizer',
    headline: 'Where is my money actually going? What will I spend next month?',
    description:
      'This AI-powered expense tracker lets you import statements, auto-categorize spending, build dashboards, and just ask questions about your money in plain language.',
    links: {
      github: 'https://github.com/alexdalgleishmorel/budget-trace',
      demo: 'https://www.youtube.com/watch?v=CJE12_HOLzs',
      try: 'https://alexdalgleishmorel.github.io/budget-trace/',
    },
    accent: '#38BDF8',
    accent2: '#2DD4BF',
    animation: { kind: 'builtin', key: 'expense-visualizer' },
    order: 0,
  },
  {
    id: 'mortgage',
    name: 'Mortgage Visualization App',
    headline: 'How much will my house really cost? How do lump sum payments affect my future?',
    description: 'This app enables new or prospective homeowners to easily answer those questions.',
    links: {
      github: 'https://github.com/alexdalgleishmorel/mortgage-calculator',
      try: 'https://alexdalgleishmorel.github.io/mortgage-calculator',
    },
    accent: '#F0A36B',
    accent2: '#7A4FE0',
    animation: { kind: 'builtin', key: 'mortgage' },
    order: 1,
  },
  {
    id: 'flow-report',
    name: 'Flow Report App',
    headline: "What are the current river surfing conditions? When's the next best time to surf?",
    description:
      'This app enables the Alberta river surfing community to easily answer those questions.',
    links: {
      github: 'https://github.com/alexdalgleishmorel/flow-report',
      demo: 'https://youtu.be/E7JZoNrNiq0',
      try: 'https://alexdalgleishmorel.github.io/flow-report',
    },
    accent: '#5FD0C8',
    accent2: '#3A6BFF',
    animation: { kind: 'builtin', key: 'flow-report' },
    order: 2,
  },
  {
    id: 'average-cost',
    name: 'Average Cost App',
    headline: 'How much more of an asset should I buy? How will it affect my average cost?',
    description: 'This app helps to answer those questions in a visual and intuitive way.',
    links: {
      github: 'https://github.com/alexdalgleishmorel/average-cost-app',
      demo: 'https://youtu.be/BLWp4dxiaz0',
      try: 'https://alexdalgleishmorel.github.io/average-cost-app',
    },
    accent: '#FFB070',
    accent2: '#E04F8E',
    animation: { kind: 'builtin', key: 'average-cost' },
    order: 3,
  },
  {
    id: 'poker-flow',
    name: 'Poker Flow V1',
    headline: 'Setting up and managing a poker game can be a hassle.',
    description:
      'This app simplifies the tasks of game setup, buy-ins and cashouts so that players can focus on the game itself.',
    links: {
      github: 'https://github.com/alexdalgleishmorel/poker-flow-app/tree/V1',
      demo: 'https://youtu.be/QoeoyLg-N_g',
    },
    accent: '#C8A2FF',
    accent2: '#5462E8',
    animation: { kind: 'builtin', key: 'poker-flow' },
    order: 4,
  },
  {
    id: 'recipes',
    name: 'Recipes',
    headline: 'What should I cook this week? What do I actually need to buy?',
    description:
      'A recipe library, meal planner, and grocery-list app. Browse a cookbook with a Datadog-style query language, sketch a week of meals on a calendar, and get an automatically aggregated grocery list from whichever meals you pick.',
    links: {
      github: 'https://github.com/alexdalgleishmorel/recipes',
      try: 'https://alexdalgleishmorel.github.io/recipes/',
    },
    accent: '#FB923C',
    accent2: '#34D399',
    animation: {
      kind: 'lottie',
      url: 'https://d2upo1phpjtftl.cloudfront.net/alexdalgleishmorel.com/264b624b-f761-42b6-be7d-1a749727f784.json',
    },
    order: 5,
  },
];

export const alexSeed: TenantContent = {
  tenantId: 'alexdalgleishmorel.com',
  siteMeta: {
    siteName: 'Alex Dalgleish-Morel',
    tagline: 'Full Stack Developer',
  },
  pages: [
    {
      id: 'home',
      slug: '/',
      title: 'Projects',
      blocks: [{ id: 'home-projects', type: 'portfolioProject', order: 0, data: { projects } }],
    },
    {
      id: 'about',
      slug: '/about',
      title: 'About',
      blocks: [
        {
          id: 'about-bio',
          type: 'richText',
          order: 0,
          data: {
            paragraphs: [
              'Full-stack developer drawn to data visualization. I shine where system-design problems meet backend optimization.',
            ],
          },
        },
        {
          id: 'about-links',
          type: 'linkList',
          order: 1,
          data: {
            heading: 'elsewhere',
            links: [
              // Placeholder until a real résumé is hosted; edit in the admin or re-seed.
              { label: 'Resume', url: 'https://alexdalgleishmorel.com/resume.pdf' },
              { label: 'GitHub', url: 'https://github.com/alexdalgleishmorel' },
              { label: 'LinkedIn', url: 'https://www.linkedin.com/in/alex-dalgleish-morel/' },
            ],
          },
        },
      ],
    },
  ],
  updatedAt: '2026-06-07T00:00:00.000Z',
};

/** Convention: every client bundle exports its seed as `seed` so the onboard seeder can load it. */
export const seed = alexSeed;
