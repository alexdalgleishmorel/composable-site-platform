import { z } from 'zod';

/**
 * type: "shopNotes" — flagged from the jmdm wireframe (ADR 0001). The shop page's "Shipping" and
 * "Note from the studio" prose is deliberately kept OFF the shop block's schema (§2 — don't bolt
 * presentation prose onto the money contract); it gets its own block instead.
 */
export const shopNoteSchema = z.object({
  heading: z.string(),
  body: z.string(),
});
export type ShopNote = z.infer<typeof shopNoteSchema>;

export const shopNotesSchema = z.object({
  notes: z.array(shopNoteSchema),
});
export type ShopNotesData = z.infer<typeof shopNotesSchema>;

export const shopNotesDefault = (): ShopNotesData => ({ notes: [] });
export const newShopNote = (): ShopNote => ({ heading: '', body: '' });
