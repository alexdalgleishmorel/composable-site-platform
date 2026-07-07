import { z } from 'zod';
import { imageValueSchema } from '../../image';

/** type: "richText" — the About page; reusable everywhere, incl. the first business client (§5). */
export const richTextSchema = z.object({
  heading: z.string().optional(),
  paragraphs: z.array(z.string()), // one entry per paragraph
  image: imageValueSchema.optional(), // CDN URL, or a framed object (aspect ratio + focal point)
});

export type RichTextData = z.infer<typeof richTextSchema>;

export const richTextDefault = (): RichTextData => ({ paragraphs: [''] });
