import { z } from 'zod';
import { imageValueSchema } from '../../image';
import { styledTextSchema } from '../../text';

/** type: "richText" — the About page; reusable everywhere, incl. the first business client (§5). */
export const richTextSchema = z.object({
  heading: z.string().optional(),
  paragraphs: z.array(styledTextSchema), // one entry per paragraph; plain string, or { text, style }
  image: imageValueSchema.optional(), // CDN URL, or a framed object (aspect ratio + focal point)
});

export type RichTextData = z.infer<typeof richTextSchema>;

export const richTextDefault = (): RichTextData => ({ paragraphs: [''] });
