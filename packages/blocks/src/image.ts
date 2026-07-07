import { z } from 'zod';

/**
 * The shared image value — React-free so the backend (`@csp/api`, via `./schemas`) can validate it
 * without pulling EditForms into the Lambda bundle, and so client render bundles can import the codec
 * + CSS helpers.
 *
 * An image is either a **bare URL string** (the original, still-valid shape — every previously
 * uploaded image) or an **object** carrying an editable `aspectRatio` (default 4:5) and a focal point
 * (`focalX`/`focalY`, the CSS `object-position` percentages used to move the image within a cropping
 * frame). The union keeps all existing content valid; the editor upgrades a value to the object shape
 * the moment its frame is edited (§ "fix the contract, vary the presentation").
 */

/** A ratio like `"4:5"` (each side 1–99, non-zero) or the literal `"original"` (no fixed frame). */
const ratioRe = /^[1-9]\d?:[1-9]\d?$/;
export const aspectRatioSchema = z.union([
  z.literal('original'),
  z.string().regex(ratioRe, 'ratio must look like "4:5"'),
]);

export const imageObjectSchema = z.object({
  url: z.string().url(),
  aspectRatio: aspectRatioSchema.optional(),
  focalX: z.number().min(0).max(100).optional(),
  focalY: z.number().min(0).max(100).optional(),
});
export type ImageObject = z.infer<typeof imageObjectSchema>;

export const imageValueSchema = z.union([z.string().url(), imageObjectSchema]);
export type ImageValue = z.infer<typeof imageValueSchema>;

/** The customer-requested default frame. */
export const DEFAULT_ASPECT = '4:5';

/** The aspect-ratio choices the editor offers (plus a free-form custom entry). */
export const ASPECT_PRESETS = [
  { value: '4:5', label: '4:5 (portrait)' },
  { value: '1:1', label: '1:1 (square)' },
  { value: '4:3', label: '4:3' },
  { value: '3:2', label: '3:2' },
  { value: '16:9', label: '16:9 (wide)' },
  { value: 'original', label: 'Original' },
] as const;

/** True when `s` is a value the aspect-ratio control accepts (`"W:H"` or `"original"`). */
export const isAspectRatio = (s: string): boolean => s === 'original' || ratioRe.test(s);

/** The image URL, whichever shape the value is in. */
export const imageUrl = (v: ImageValue): string => (typeof v === 'string' ? v : v.url);

export interface NormalizedImage {
  url: string;
  aspectRatio: string;
  focalX: number;
  focalY: number;
}

/** Normalise any stored value to the full object form, applying the 4:5 / centre defaults. Used by
 *  both the editor and the render bundles so legacy string images gain the frame automatically. */
export function readImage(v: ImageValue): NormalizedImage {
  if (typeof v === 'string') return { url: v, aspectRatio: DEFAULT_ASPECT, focalX: 50, focalY: 50 };
  return {
    url: v.url,
    aspectRatio: v.aspectRatio ?? DEFAULT_ASPECT,
    focalX: v.focalX ?? 50,
    focalY: v.focalY ?? 50,
  };
}

/** CSS `aspect-ratio`: `"4:5"` → `"4 / 5"`; `"original"` → `"auto"` (no fixed frame). */
export function aspectCss(aspectRatio: string): string {
  if (aspectRatio === 'original') return 'auto';
  const [w, h] = aspectRatio.split(':');
  return `${w} / ${h}`;
}

/** CSS `object-position` from focal percentages, e.g. `"50% 50%"`. */
export const objectPositionCss = (focalX: number, focalY: number): string =>
  `${focalX}% ${focalY}%`;
