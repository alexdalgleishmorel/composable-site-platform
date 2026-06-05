import { z } from 'zod';

/** type: "richText" — the About page; reusable everywhere, incl. the first business client (§5). */
export const richTextSchema = z.object({
  heading: z.string().optional(),
  paragraphs: z.array(z.string()), // one entry per paragraph
  image: z.string().url().optional(), // CDN URL
});

export type RichTextData = z.infer<typeof richTextSchema>;

export const richTextDefault = (): RichTextData => ({ paragraphs: [''] });
