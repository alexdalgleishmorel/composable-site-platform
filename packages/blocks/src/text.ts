import { z } from 'zod';

/**
 * The shared styled-text value — React-free so the backend (`@csp/api`, via `./schemas`) can validate
 * it without pulling EditForms into the Lambda bundle, and so client render bundles can import the
 * codec + CSS helper.
 *
 * A piece of text is either a **bare string** (the original, still-valid shape — every previously
 * written paragraph/description) or an **object** carrying an editable `style` (bold / italic /
 * regular). The union keeps all existing content valid; the editor upgrades a value to the object
 * shape the moment its style is changed (the same pattern as `./image`'s framed image value).
 */

export const textStyleSchema = z.enum(['regular', 'bold', 'italic']);
export type TextStyle = z.infer<typeof textStyleSchema>;

export const styledTextObjectSchema = z.object({
  text: z.string(),
  style: textStyleSchema.optional(),
});
export type StyledTextObject = z.infer<typeof styledTextObjectSchema>;

export const styledTextSchema = z.union([z.string(), styledTextObjectSchema]);
export type StyledText = z.infer<typeof styledTextSchema>;

export const DEFAULT_TEXT_STYLE: TextStyle = 'regular';

export const TEXT_STYLE_OPTIONS: readonly { value: TextStyle; label: string }[] = [
  { value: 'regular', label: 'Regular' },
  { value: 'bold', label: 'Bold' },
  { value: 'italic', label: 'Italic' },
];

/** The text content, whichever shape the value is in. */
export const textOf = (v: StyledText): string => (typeof v === 'string' ? v : v.text);

export interface NormalizedText {
  text: string;
  style: TextStyle;
}

/** Normalise any stored value to the full object form, applying the "regular" default. Used by both
 *  the editor and the render bundles so legacy plain-string text keeps rendering unstyled. */
export function readText(v: StyledText): NormalizedText {
  if (typeof v === 'string') return { text: v, style: DEFAULT_TEXT_STYLE };
  return { text: v.text, style: v.style ?? DEFAULT_TEXT_STYLE };
}

/** CSS for a text style — `font-weight`/`font-style`. */
export function fontStyleCss(style: TextStyle): { fontWeight?: number; fontStyle?: string } {
  return {
    fontWeight: style === 'bold' ? 700 : undefined,
    fontStyle: style === 'italic' ? 'italic' : undefined,
  };
}
