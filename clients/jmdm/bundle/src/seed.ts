import type { Project, ShopItem } from '@csp/blocks';
import type { TenantContent } from '@csp/core';

/**
 * The jmdm.studio content seed (issue #23) — the wireframe's `data.js` (CATALOG / CV / CURRENTLY /
 * SHOPNOTES / CONTACT) reconstructed on the block model.
 *
 * - The home index ("/") is a `projectGrid` of every work.
 * - The shoppable subset is a separate `shop` block (priceCents, CAD, beta-disabled).
 * - About ("/about") is richText (bio) + two entryLists (CV) + noteCards ("currently").
 *
 * Images are intentionally empty — real imagery is uploaded to S3 during image migration (the rest of
 * #23, gated on the presign endpoint #15); the bundle renders styled placeholders until then.
 *
 * This module is the dev fallback for the bundle AND the document PUT to the tenant at hand-off (#28).
 */

const projects: Project[] = [
  {
    id: 'quiet-furniture',
    title: 'Quiet Furniture',
    summary: 'Three plywood objects for small rooms',
    body: 'A set of three plywood objects designed to occupy small rooms without occupying attention. Each piece is built from a single sheet of 3/4" birch plywood, milled on a flatbed CNC and finished by hand.',
    images: [],
    tags: ['Furniture', 'Plywood', 'Photography'],
    order: 0,
  },
  {
    id: 'margin-notes',
    title: 'Margin Notes',
    summary: 'Risograph zine, 32pp, ed. of 80',
    body: 'Thirty-two pages of overheard sentences set in 9pt Arial, printed two-color risograph.',
    images: [],
    tags: ['Risograph', 'Editorial'],
    order: 1,
  },
  {
    id: 'two-lemons',
    title: 'A Room With Two Lemons',
    summary: 'Installation, three weeks, Studio West',
    body: 'A three-week installation in a 4×5m room. Visitors entered to find the room empty except for two lemons placed on the floor, three meters apart.',
    images: [],
    tags: ['Installation', 'Sound'],
    order: 2,
  },
  {
    id: 'telephone-table',
    title: 'Telephone Table',
    summary: 'One-off, white oak + bronze',
    body: 'A small table for a hallway, sized for a single object.',
    images: [],
    tags: ['Furniture', 'White oak', 'Bronze'],
    order: 3,
  },
  {
    id: 'morning-pages',
    title: 'Morning Pages',
    summary: 'Photo essay, 14 plates, ed. of 25',
    body: 'Fourteen photographs taken between 6:00 and 7:30 AM over the course of a winter.',
    images: [],
    tags: ['Photography', '35mm'],
    order: 4,
  },
  {
    id: 'lemon-bowl',
    title: 'Lemon Bowl',
    summary: 'Turned ash, oil finish, ed. of 12',
    body: 'A small bowl. Holds one lemon.',
    images: [],
    tags: ['Woodturning', 'Ash'],
    order: 5,
  },
  {
    id: 'notes-on-arial',
    title: 'Notes on Arial',
    summary: 'Essay, ~3,400 words, ed. of 50',
    body: 'On why Arial is the right answer most of the time, and what we lose pretending otherwise.',
    images: [],
    tags: ['Writing', 'Type'],
    order: 6,
  },
  {
    id: 'still-life-with-rule',
    title: 'Still Life With Rule',
    summary: 'Print series, 6 plates, ed. of 24',
    body: 'Six still-lifes, each anchored by a hairline rule.',
    images: [],
    tags: ['Risograph', 'Still life'],
    order: 7,
  },
  {
    id: 'two-chairs',
    title: 'Two Chairs',
    summary: 'Solid maple, ebonised, pair',
    body: 'Two chairs, designed to be sat in by people having a difficult conversation.',
    images: [],
    tags: ['Furniture', 'Maple'],
    order: 8,
  },
  {
    id: 'ash-stool',
    title: 'Ash Stool',
    summary: 'Steam-bent ash, ed. of 30',
    body: 'A stool. Eighteen inches tall. Ash.',
    images: [],
    tags: ['Furniture', 'Ash'],
    order: 9,
  },
  {
    id: 'field-notes',
    title: 'Field Notes',
    summary: 'Notebooks, hand-bound, ed. of 60',
    body: 'Saddle-stitched notebooks made from off-cuts of a calendar press run.',
    images: [],
    tags: ['Bookbinding'],
    order: 10,
  },
  {
    id: 'kitchen-light',
    title: 'Kitchen Light',
    summary: 'Pendant, brass + ash, ed. of 8',
    body: "A pendant for kitchens that don't already have enough opinions.",
    images: [],
    tags: ['Lighting'],
    order: 11,
  },
  {
    id: 'first-house',
    title: 'First House',
    summary: 'Drawing series, 9 plates, ed. of 30',
    body: 'Nine measured drawings of a house Jack designed in his head and never built.',
    images: [],
    tags: ['Architectural drawing'],
    order: 12,
  },
  {
    id: 'winter-table',
    title: 'Winter Table',
    summary: 'Walnut, one-off',
    body: 'A small walnut table that has been waiting patiently in the studio.',
    images: [],
    tags: ['Furniture', 'Walnut'],
    order: 13,
  },
];

// The shoppable subset (wireframe status === "shop"), as standalone ShopItems priced in CAD cents.
const shopItems: ShopItem[] = [
  ['margin-notes', 'Margin Notes', 'Risograph zine, 32pp, ed. of 80', 2200],
  ['telephone-table', 'Telephone Table', 'One-off, white oak + bronze', 185000],
  ['morning-pages', 'Morning Pages', 'Photo essay, 14 plates, ed. of 25', 8500],
  ['lemon-bowl', 'Lemon Bowl', 'Turned ash, oil finish, ed. of 12', 14000],
  ['notes-on-arial', 'Notes on Arial', 'Essay, ~3,400 words, ed. of 50', 1800],
  ['still-life-with-rule', 'Still Life With Rule', 'Print series, 6 plates, ed. of 24', 9500],
  ['two-chairs', 'Two Chairs', 'Solid maple, ebonised, pair', 240000],
  ['ash-stool', 'Ash Stool', 'Steam-bent ash, ed. of 30', 32000],
  ['field-notes', 'Field Notes', 'Notebooks, hand-bound, ed. of 60', 2800],
  ['kitchen-light', 'Kitchen Light', 'Pendant, brass + ash, ed. of 8', 48000],
  ['first-house', 'First House', 'Drawing series, 9 plates, ed. of 30', 5500],
  ['winter-table', 'Winter Table', 'Walnut, one-off', 165000],
].map(([id, name, description, priceCents], order) => ({
  id: id as string,
  name: name as string,
  description: description as string,
  priceCents: priceCents as number,
  images: [],
  inStock: true,
  order,
}));

export const jmdmSeed: TenantContent = {
  tenantId: 'jmdm.studio',
  siteMeta: {
    siteName: 'jmdm',
    tagline: 'Index of works',
    contactEmail: 'jack.dalgleishmorel@live.ca',
    socialLinks: [{ label: 'instagram', url: 'https://instagram.com/jackkme' }],
    studioLocation: 'harbord village, toronto on',
    hours: 'by appointment',
  },
  pages: [
    {
      id: 'home',
      slug: '/',
      title: 'Index of works',
      blocks: [{ id: 'home-index', type: 'projectGrid', order: 0, data: { projects } }],
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
            heading: 'background',
            paragraphs: [
              'Jack Dalgleish-Morel is a designer in Harbord Village, Toronto.',
              'Bachelor of Architectural Science (with honours), TMU. Day job: digital fabrication and design with Hot Pop Factory and Custom Engineered Arts — the work that pays the rent for the lemons.',
              'After hours: object, furniture, lighting, and installation work. Mostly small. Mostly slow. Available for commissions, collaborations, and unsolicited opinions about citrus.',
            ],
          },
        },
        {
          id: 'about-selected',
          type: 'entryList',
          order: 1,
          data: {
            heading: 'selected works · 2020 — present',
            entries: [
              { year: '2024', title: 'Quiet Furniture', subtitle: 'Studio West, Toronto — solo' },
              {
                year: '2024',
                title: 'Margin Notes',
                subtitle: 'Risograph zine, ed. 80 — Atelier Coyote',
              },
              {
                year: '2023',
                title: 'A Room With Two Lemons',
                subtitle: 'Studio West, Toronto — three-week installation',
              },
              { year: '2023', title: 'Telephone Table', subtitle: 'Private commission, Toronto' },
              { year: '2022', title: 'Two Chairs', subtitle: 'Plural, Toronto — group show' },
              { year: '2021', title: 'Field Notes', subtitle: 'Self-published, ed. 60' },
            ],
          },
        },
        {
          id: 'about-press',
          type: 'entryList',
          order: 2,
          data: {
            heading: 'press / writing',
            entries: [
              {
                year: '2024',
                title: 'Sight Unseen',
                subtitle: '"Furniture That Refuses to Perform"',
              },
              { year: '2024', title: 'Disegno Daily', subtitle: 'Interview, May issue' },
              { year: '2023', title: 'Apartamento', subtitle: 'Studio visit, n°31' },
              { year: '2022', title: 'Wallpaper*', subtitle: 'Graduate showcase' },
            ],
          },
        },
        {
          id: 'about-currently',
          type: 'noteCards',
          order: 3,
          data: {
            heading: 'currently',
            cards: [
              { label: 'making', body: 'A set of four side tables in steam-bent ash. Slow.' },
              { label: 'reading', body: 'The Poetics of Space, Bachelard. For the third time.' },
              { label: 'open to', body: 'Furniture commissions. Print collabs. Studio visits.' },
            ],
          },
        },
      ],
    },
    {
      id: 'shop',
      slug: '/shop',
      title: 'Shop',
      blocks: [
        {
          id: 'shop-notes',
          type: 'shopNotes',
          order: 0,
          data: {
            notes: [
              {
                heading: 'Shipping',
                body: 'Each item ships from the studio. Furniture is dispatched within four weeks; smaller editions within seven days. Some pieces are made to order.',
              },
              {
                heading: 'Note from the studio',
                body: "Editions are kept deliberately small. Once a run is sold, it doesn't return. The shop is part of the catalog — every item lives at its original index number, with or without a price tag.",
              },
            ],
          },
        },
        {
          id: 'shop-grid',
          type: 'shop',
          order: 1,
          // enabled:false — the shop ships in beta (admin-only) until checkout opens (ADR 0001 / §5).
          data: { enabled: false, currency: 'CAD', items: shopItems },
        },
      ],
    },
  ],
  updatedAt: '2026-06-05T00:00:00.000Z',
};

/** Convention: every client bundle exports its seed as `seed` so the onboard seeder can load it. */
export const seed = jmdmSeed;
