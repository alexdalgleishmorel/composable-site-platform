import { z } from 'zod';

/**
 * type: "noteCards" — flagged from the jmdm wireframe (ADR 0001). The About page's "currently" grid
 * is a list of small label + body cards (making / reading / open to) that doesn't fit richText's flat
 * paragraph list.
 */
export const noteCardSchema = z.object({
  label: z.string(),
  body: z.string(),
});
export type NoteCard = z.infer<typeof noteCardSchema>;

export const noteCardsSchema = z.object({
  heading: z.string().optional(),
  cards: z.array(noteCardSchema),
});
export type NoteCardsData = z.infer<typeof noteCardsSchema>;

export const noteCardsDefault = (): NoteCardsData => ({ cards: [] });
export const newNoteCard = (): NoteCard => ({ label: '', body: '' });
