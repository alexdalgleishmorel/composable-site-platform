import { newId } from '@csp/core';
import { z } from 'zod';

/** A shop item — money stored as integer cents, never a float (§5). */
export const shopItemSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  description: z.string().optional(),
  priceCents: z.number().int().nonnegative(), // integer cents
  images: z.array(z.string().url()), // CDN URLs
  stripeProductId: z.string().optional(), // synced to the Stripe Connect account
  stripePriceId: z.string().optional(),
  inStock: z.boolean(),
  order: z.number().int().nonnegative(),
});
export type ShopItem = z.infer<typeof shopItemSchema>;

/** type: "shop" — the beta Shop (§5). */
export const shopSchema = z.object({
  enabled: z.boolean(),
  currency: z.string(), // e.g. "USD", "CAD"
  items: z.array(shopItemSchema),
});
export type ShopData = z.infer<typeof shopSchema>;

export const shopDefault = (): ShopData => ({ enabled: false, currency: 'USD', items: [] });

export const newShopItem = (order = 0): ShopItem => ({
  id: newId(),
  name: '',
  priceCents: 0,
  images: [],
  inStock: true,
  order,
});

/**
 * Stricter-than-schema validation for the shop block — prioritised because the shop handles real
 * money (§5). Beyond the schema's "integer, non-negative", this enforces an ISO-4217-shaped currency
 * and a strictly positive, safe-integer price per item. Throws on the first violation; the message
 * is surfaced as a content validation issue.
 */
export function validateShop(data: ShopData): void {
  if (!/^[A-Z]{3}$/.test(data.currency)) {
    throw new Error(`currency must be a 3-letter ISO code (e.g. "USD"), got "${data.currency}"`);
  }
  for (const item of data.items) {
    const label = item.name || item.id;
    if (!Number.isSafeInteger(item.priceCents) || item.priceCents <= 0) {
      throw new Error(
        `item "${label}" must have a positive integer priceCents (got ${item.priceCents})`,
      );
    }
  }
}
