import { z } from 'zod';

/**
 * type: "entryList" — flagged from the jmdm wireframe (ADR 0001). The About page's CV sections
 * ("selected works", "press / writing") are rows of year + title + subtitle, which fit neither
 * richText nor projectGrid. Reusable across the business segment (awards, experience, etc.).
 */
export const entrySchema = z.object({
  year: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
});
export type Entry = z.infer<typeof entrySchema>;

export const entryListSchema = z.object({
  heading: z.string().optional(),
  entries: z.array(entrySchema),
});
export type EntryListData = z.infer<typeof entryListSchema>;

export const entryListDefault = (): EntryListData => ({ entries: [] });
export const newEntry = (): Entry => ({ year: '', title: '' });
