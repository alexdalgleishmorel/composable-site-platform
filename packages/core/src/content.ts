import { z } from 'zod';

/**
 * The content data contract — the site -> pages -> blocks envelope from ARCHITECTURE.md §3.
 *
 * These schemas validate *structure*. A block's `data` is intentionally left `unknown` here and
 * validated per-type by the shared registry in `@csp/blocks` (§5: "validate the envelope; layer in
 * per-type data validation from the registry validators").
 */

export const socialLinkSchema = z.object({
  label: z.string().min(1),
  url: z.string().url(),
});
export type SocialLink = z.infer<typeof socialLinkSchema>;

/** Typed, universal site-wide config (deliberately NOT a block — §3). */
export const siteMetaSchema = z.object({
  siteName: z.string().min(1),
  tagline: z.string().optional(),
  contactEmail: z.string().email().optional(),
  socialLinks: z.array(socialLinkSchema).optional(),
  // Additive fields flagged from the jmdm wireframe contact block (ADR 0001): the studio's physical
  // location and opening hours are genuinely site-wide config, so they live here, not in a block.
  studioLocation: z.string().optional(),
  hours: z.string().optional(),
});
export type SiteMeta = z.infer<typeof siteMetaSchema>;

/**
 * A block: a stable id, a `type` discriminant, and a `data` payload whose shape is determined by its
 * type. `.required()` keeps `data` a required key even though its value is `unknown` at this layer.
 *
 * `id` MUST be a stable UUID, never a content hash — hashes change on edit (§3).
 *
 * `data` is deliberately opaque (`unknown`) at this envelope layer — the registry in `@csp/blocks`
 * validates it per-type. The block's structural fields (id/type/order) are what the envelope guards.
 */
export const blockSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  data: z.unknown(),
  order: z.number().int().nonnegative(),
});
export type Block = z.infer<typeof blockSchema>;

export const pageSchema = z.object({
  id: z.string().min(1),
  slug: z.string().startsWith('/'), // "/", "/about", "/shop"
  title: z.string().min(1),
  blocks: z.array(blockSchema),
});
export type Page = z.infer<typeof pageSchema>;

/** One DynamoDB item per tenant: `{ tenantId, siteMeta, pages, updatedAt }` (§5). */
export const tenantContentSchema = z.object({
  tenantId: z.string().min(1), // partition key, e.g. "jmdm.org"
  siteMeta: siteMetaSchema,
  pages: z.array(pageSchema),
  updatedAt: z.string().datetime(), // ISO timestamp
});
export type TenantContent = z.infer<typeof tenantContentSchema>;

/**
 * The platform-owner's registry of clients: one DynamoDB item per tenant in `csp-tenants`. This is
 * owner-controlled and deliberately separate from the client-controlled content document so a
 * client's `PUT /content` can never touch its own provisioning.
 *
 * `blocks` is the per-tenant block allow-list. **Absent ⇒ every registered block type is allowed**
 * (the default); an explicit array restricts the editor's "Add a block" menu and is enforced on
 * `PUT /content`. Provisioning therefore only ever *restricts* — existing tenants with no row keep
 * working untouched.
 */
export const tenantRecordSchema = z.object({
  tenantId: z.string().min(1), // partition key — the tenant's domain, e.g. "jmdm.studio"
  displayName: z.string().min(1),
  status: z.enum(['active', 'suspended']),
  blocks: z.array(z.string().min(1)).optional(), // absent => all block types allowed
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});
export type TenantRecord = z.infer<typeof tenantRecordSchema>;
