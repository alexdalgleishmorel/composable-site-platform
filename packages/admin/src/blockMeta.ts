/**
 * Presentation metadata for the editor chrome — a glyph, short name, and one-line blurb per block
 * type, keyed by our registry `type`. Kept here (admin) rather than in `@csp/blocks` because it's
 * pure editor presentation; the registry stays the data/validation source of truth.
 */
export interface BlockMeta {
  name: string;
  glyph: string;
  blurb: string;
}

export const BLOCK_META: Record<string, BlockMeta> = {
  richText: { name: 'Rich text', glyph: '¶', blurb: 'Heading + paragraphs' },
  projectGrid: { name: 'Project grid', glyph: '▦', blurb: 'Catalogue of works' },
  shop: { name: 'Shop', glyph: '$', blurb: 'Items for sale' },
  shopNotes: { name: 'Shop notes', glyph: '✎', blurb: 'Fine print' },
  entryList: { name: 'Entry list', glyph: '≣', blurb: 'CV / timeline' },
  noteCards: { name: 'Note cards', glyph: '❏', blurb: 'Short notes' },
  portfolioProject: { name: 'Portfolio project', glyph: '✦', blurb: 'Animated case studies' },
  linkList: { name: 'Link list', glyph: '↗', blurb: 'Labelled external links' },
};

/** Meta for a type, falling back to a sensible default for unknown/legacy types. */
export function blockMeta(type: string, fallbackLabel?: string): BlockMeta {
  return BLOCK_META[type] ?? { name: fallbackLabel ?? type, glyph: '◻', blurb: type };
}

const count = (n: number, noun: string) => `${n} ${noun}${n === 1 ? '' : 's'}`;
const len = (v: unknown): number => (Array.isArray(v) ? v.length : 0);

/** A one-line summary of a block's content for the collapsed card header (reads our `data` shapes). */
export function blockSummary(type: string, data: unknown): string {
  const d = (data ?? {}) as Record<string, unknown>;
  switch (type) {
    case 'richText': {
      const heading = typeof d.heading === 'string' ? d.heading : '';
      const first = Array.isArray(d.paragraphs) ? String(d.paragraphs[0] ?? '') : '';
      return heading || first.slice(0, 48) || 'Empty';
    }
    case 'projectGrid':
      return count(len(d.projects), 'project');
    case 'shop':
      return count(len(d.items), 'item');
    case 'entryList':
      return count(len(d.entries), 'entry').replace('entrys', 'entries');
    case 'noteCards':
      return count(len(d.cards), 'card');
    case 'shopNotes':
      return len(d.notes) ? count(len(d.notes), 'note') : 'Fine print';
    case 'portfolioProject':
      return count(len(d.projects), 'project');
    case 'linkList':
      return count(len(d.links), 'link');
    default:
      return '';
  }
}
