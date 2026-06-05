# Composable Site Platform — Project Knowledge
 
This document is the standing brief for a productized managed service that designs, builds, and hosts
highly customized websites for non-technical clients on a shared, block-based content backbone.
Upload it as project knowledge so every conversation starts with this context.
 
> **Naming note:** this project was formerly “Portfolio Site Platform.” It has been generalized from
> portfolio sites to *any* small site (portfolios **and** modernized small-business sites) built from
> a shared library of content blocks. The portfolio use case is now just one preset.
 
-----
 
## 1. What this is
 
A repeatable service, not a series of bespoke projects — but with a deliberate, sellable split between
what’s bespoke and what’s shared:
 
1. **Creative design (high-cost, bespoke)** — I work closely with the client to produce something
   genuinely creative and hard to achieve elsewhere, prototyped in Claude Design. This is the
   differentiator and the main thing the client pays an **upfront fee** for.
1. **Implement** — export to Claude Code: a static front-end bundle of *render components* keyed by
   block type, plus theme and page composition.
1. **Host + operate (low-cost, standardized)** — deploy the static site to S3/CloudFront on the
   client’s own domain, give them a shared admin app to edit their own content, charge a small
   subscription.
**The business thesis:** site *creation* is bespoke and creative (and priced accordingly); site
*maintenance* after creation is an identical, standardized process for every client, regardless of how
wildly different two sites look. The architecture below is what makes those two statements compatible.
 
**Two segments, one engine:**
 
- **Portfolios** — the original wedge. About + projects + optional shop.
- **Business modernization** — refactor/modernize basic small-business sites (dentist, restaurant,
  trades, etc.). Different content needs, same block engine, plus a content-import step.
**First client:** my brother. Tenant id / domain: `jmdm.org`. Projects page, About page, beta Shop,
admin mode (`/admin`) for editing content after Google login. His site is the MVP target and is
reconstructed entirely from three blocks (see §5).
 
-----
 
## 2. The core architectural principle
 
**Fix the data contract, vary the presentation** — now expressed as a block registry.
 
The unit of content is a **block**: a stable id, a `type` discriminant, and a `data` payload whose
shape is determined by its type. Every block type splits cleanly into three planes:
 
|Plane           |What it is                                           |Shared or bespoke?|Lives where      |
|----------------|-----------------------------------------------------|------------------|-----------------|
|**Data**        |`schema` — the validated shape of the block’s content|**Shared**        |Block registry   |
|**Editing**     |`EditForm` — the admin form for that content         |**Shared**        |Shared admin app |
|**Presentation**|`Render` — how the block looks on the live site      |**Bespoke**       |Per-client bundle|
 
The `type` string is the join key across all three planes. This is the whole architecture:
 
```ts
interface BlockType<T> {
  type: string;                          // registry key + the join key
  schema: ZodSchema<T>;                  // SHARED  — the data contract, validated
  EditForm: FC<{ data: T; onChange }>;   // SHARED  — how content is edited
  Render: FC<{ data: T }>;               // BESPOKE — the creative Claude Design work
}
```
 
**Why this delivers the thesis:** the admin app needs only `schema` + `EditForm`, *never* a client’s
`Render`. So one shared admin app serves every tenant with zero client-custom code — maintenance is
literally the same app for everyone. Meanwhile the creative work lives entirely in `Render` (plus
theme and composition), where it can be as bespoke as the upfront fee justifies.
 
### The one discipline that protects all of this
 
A custom `Render` may vary **how** content is presented, never **what fields exist**. The data schema
is immovable; creativity happens strictly downstream of it.
 
When the creative phase needs data no block currently holds, the move is:
**add a new block type to the shared registry first** (schema + EditForm), **then** build the custom
render against it. Never let a render reach for a field the shared schema doesn’t know about — the
shared edit form can’t expose it, and that client’s maintenance silently fragments.
 
Payoff of holding the line: even bespoke creative work *feeds* the shared library. Every new data
need becomes a reusable block type for future clients.
 
-----
 
## 3. The block model
 
### Hierarchy: site → pages → blocks
 
```ts
interface TenantContent {
  tenantId: string;          // partition key, e.g. "jmdm.org"
  siteMeta: SiteMeta;        // typed, universal site-wide config (not a block)
  pages: Page[];
  updatedAt: string;         // ISO timestamp
}
 
interface SiteMeta {
  siteName: string;
  tagline?: string;
  contactEmail?: string;
  socialLinks?: { label: string; url: string }[];
  // branding/theme tokens may live here or in the client bundle — see §11
}
 
interface Page {
  id: string;
  slug: string;              // "/", "/about", "/shop"
  title: string;
  blocks: Block[];
}
 
interface Block {
  id: string;                // stable UUID — NEVER a content hash (hashes change on edit)
  type: string;              // registry key — the discriminant
  data: unknown;             // shape determined by `type`, validated per type
  order: number;             // display order within the page
}
```
 
`siteMeta` stays a typed top-level object because site-wide config is genuinely universal and isn’t a
block. Everything else is blocks on pages.
 
### The registry grows; the architecture doesn’t
 
```ts
const registry = { richText, projectGrid, shop /* , hero, hours, menu, ... */ };
```
 
Both the public site and the admin app read from this registry. **Adding a block type = adding one
module and registering it.** The backend never redeploys, the admin shell never changes, the API never
changes. That is the “architecture stays fixed, library expands forever” property made concrete. The
growing, hardened block library *is* the product moat.
 
### Why not opaque/arbitrary per-tenant JSON
 
Considered and rejected. Storing schemaless blobs doesn’t delete the schema — it relocates it into
scattered, unvalidated render logic, forces bespoke admin forms per client (the thing productization
exists to avoid), and removes the ability to migrate or even *find* similar content across tenants.
The `type` discriminant is exactly what buys back validation, a build-once admin form, and per-type
migration. This is the model every serious composable CMS converged on (Sanity, Contentful, Notion,
Editor.js), and not by accident.
 
-----
 
## 4. AWS components
 
|Concern       |Service                       |Notes                                                         |
|--------------|------------------------------|--------------------------------------------------------------|
|Static hosting|S3 + CloudFront (OAC)         |Bucket private; only CloudFront reads it.                     |
|TLS           |ACM                           |Cert per domain, **must be in us-east-1** for CloudFront.     |
|DNS           |Route 53 hosted zone          |~$0.50/mo per zone. The piece you must control to host a site.|
|API           |API Gateway (HTTP API)        |Cheaper/simpler than REST API.                                |
|Compute       |Lambda                        |Content CRUD, presigned uploads, checkout, Stripe webhook.    |
|Content store |DynamoDB (on-demand)          |One table, partition key = tenantId.                          |
|Image store   |S3                            |Uploaded via presigned PUT; served via CloudFront.            |
|Auth          |Cognito user pool + Google IdP|One pool, all tenants; user mapped to a tenantId.             |
|Payments      |Stripe Connect                |Each client = a connected account receiving their own payouts.|
 
**Static shell + dynamic content:** the HTML/JS/CSS bundle (render components, theme, composition)
ships to S3 and changes only on redeploy. Content (the `TenantContent` document) is **not** baked in.
On page load the site fetches `GET /content`; admin edits write back via authenticated calls. Edits
go live instantly — no rebuild, no CloudFront invalidation.
 
*Alternative considered (content as JSON in S3):* cheaper at very high read volume, but forces a
cache-invalidation step on every edit. Wrong tradeoff for low-traffic sites. Use DynamoDB.
 
**SPA routing gotcha:** `/admin` and other deep links are client-side routes. Configure CloudFront to
return `index.html` on 403/404 so deep links don’t break.
 
-----
 
## 5. Data contract & MVP block library
 
One DynamoDB item per tenant: `{ tenantId, siteMeta, pages, updatedAt }` (see §3 for the envelope).
Start by validating the envelope; layer in per-type `data` validation from the shared registry
validators when you want the safety — it matters most for the shop (real money).
 
### MVP blocks (reconstruct the brother’s site exactly)
 
```ts
// type: "richText"  — the About page; reusable everywhere, incl. first business client
interface RichTextData {
  heading?: string;
  paragraphs: string[];      // one entry per paragraph
  image?: string;            // CDN URL
}
 
// type: "projectGrid"  — the Projects page
interface ProjectGridData {
  projects: Project[];
}
interface Project {
  id: string;
  title: string;
  summary?: string;          // short card text
  body?: string;             // full description
  images: string[];          // CDN URLs
  link?: string;             // external link
  tags?: string[];
  order: number;
}
 
// type: "shop"  — the beta Shop
interface ShopData {
  enabled: boolean;
  currency: string;          // e.g. "USD"
  items: ShopItem[];
}
interface ShopItem {
  id: string;
  name: string;
  description?: string;
  priceCents: number;        // store money as integer cents
  images: string[];          // CDN URLs
  stripeProductId?: string;  // synced to Stripe Connect account
  stripePriceId?: string;
  inStock: boolean;
  order: number;
}
```
 
`Project` and `ShopItem` are carried over verbatim from the old fixed schema — they’re now the `data`
shapes of their blocks rather than top-level fields. The brother’s site = an `/about` page with a
`richText` block, a projects page with a `projectGrid` block, a `/shop` page with a `shop` block.
 
**First obvious expansions for the business segment** (build only when a real client needs one):
`hero`, `serviceList`, `hours`, `team`, `testimonials`, `contactForm`, `mapEmbed`, `cta`, `gallery`.
 
### Schema evolution rules
 
- **Additive only** by default — new *optional* fields, never renames/removals. Keeps every existing
  custom render working untouched.
- A breaking change becomes a known, bounded migration across a uniform contract — affordable
  precisely because the contract is uniform. This is the whole reason for having a schema.
- New data need → **new block type in the shared registry first**, custom render second. (See §2.)
-----
 
## 6. API contract
 
HTTP API (API Gateway). Public routes need no auth; admin routes require a valid Cognito JWT whose
`tenantId` claim matches the resource.
 
### Public
 
- `GET /content` — returns the tenant’s full `TenantContent`. Cached briefly or not at all.
- `POST /checkout` — body `{ items: [{ id, qty }] }` → Stripe Checkout session against the client’s
  connected account → returns `{ url }`.
- `POST /webhook/stripe` — signature-verified webhook. Records orders, updates stock.
### Admin (Cognito-authenticated, tenant-scoped)
 
Baseline (simplest, single-admin, last-write-wins):
 
- `PUT /content` — replace the whole `TenantContent` document.
- `POST /uploads/presign` — body `{ contentType }` → `{ uploadUrl, cdnUrl }`. Browser PUTs image
  bytes directly to S3; **never route image bytes through Lambda.**
Recommendation: start with `PUT /content`. One admin per site means concurrency isn’t a real concern,
and a single endpoint is much less to build and maintain. The backend stays deployed once and
untouched per client.
 
-----
 
## 7. Admin app & iframe preview
 
**Editing model: generic admin + live iframe preview** (deliberately *not* full WYSIWYG).
 
Rationale: clients don’t design post-creation — *I* do, during the paid creative phase. After that,
clients edit *content* inside a look that’s already fixed. So they need accurate preview, not
edit-with-live-styling. Full WYSIWYG would pull bespoke render code back into the editing path and
re-couple the exact thing the §2 split decoupled — destroying the standardized-maintenance guarantee.
 
### How it works
 
- **One shared admin app**, served to every tenant. Renders forms from the shared `EditForm`s, plus a
  block-list editor (add-from-registry, reorder, delete). Contains **zero client-custom code**.
- Beside the form, the client’s **real deployed site is embedded in an iframe**.
- On debounced change, the admin posts the working content into the iframe via `postMessage`; the
  iframe re-renders from that payload instead of refetching. On save, the admin `PUT`s `/content` and
  the iframe reloads clean.
- The client watches their actual custom-styled site update as they type — full WYSIWYG *feel*, none
  of the re-coupling.
### Client bundle contract (hard spec for the Claude Code export)
 
Every per-client bundle must:
 
1. Fetch `GET /content` on load.
1. Render blocks by `type` via its (bespoke) render components — a `<BlockRenderer>` mapping
   `type` → component, reading the registry for which component to use.
1. Accept a preview payload over `postMessage` and re-render from it (the only integration the bundle
   owes the shared admin app).
The bundle ships render components, theme, and page composition — **not** schemas, **not** edit forms.
 
-----
 
## 8. Auth model
 
- One Cognito user pool, Google configured as a federated identity provider.
- The client (admin) signs in at `/admin` with their Google account.
- Their JWT carries identity; map it to a `tenantId` (custom attribute `custom:tenantId`, or a small
  mapping table). Only allow-listed Google emails get a tenant mapping.
- API Gateway uses a Cognito/JWT authorizer; the Lambda asserts the token’s `tenantId` matches the
  resource being edited. That’s the tenant-isolation boundary.
-----
 
## 9. Domains
 
Decouple two things people conflate:
 
- **Registration** — who owns the domain at the registrar.
- **DNS hosting** — the Route 53 hosted zone pointing the domain at CloudFront. The only piece you
  strictly need to control to run a client’s site. A domain can be registered anywhere as long as its
  nameservers point at your hosted zone.
**Brother:** register `jmdm.org` in your account, he reimburses you. Don’t overthink it.
 
**Real clients:** register on their behalf during onboarding, but set the client as registrant/owner
so it’s unambiguously theirs. Charge a setup fee or fold a markup into the subscription. Have a
written offboarding/transfer step (auth codes, ~60-day transfer lock apply). Offer “client registers
their own + delegates DNS” only to clients who insist — best ownership story, worst UX for
non-technical people.
 
-----
 
## 10. Onboarding workflow (repeatable)
 
Per-client infrastructure is parameterized infrastructure-as-code (CDK / Terraform / SST). Set this up
before client #2 — highest-leverage thing for making onboarding mechanical.
 
1. **Creative design (bespoke, paid upfront)** — work with the client in Claude Design to produce the
   custom look, composing pages from blocks. If a need arises that no block covers, add the block type
   to the shared registry (schema + EditForm) *before* styling its render.
1. **Implement** — export to Claude Code: render components keyed by block type + theme + page
   composition, honoring the §7 client-bundle contract. Commit to a per-client repo (or monorepo
   folder).
1. **Provision** (one IaC apply, params = domain + client Google email): S3 bucket, CloudFront dist
   with OAC, ACM cert (us-east-1), Route 53 hosted zone, DynamoDB tenant record, Cognito user mapping.
1. **Domain** — register or point the domain; nameservers → hosted zone; add CloudFront alias records.
1. **Import (business segment only)** — migrate the client’s existing site content into blocks.
1. **Deploy** — build frontend, sync to S3. Content populated via the shared admin app.
1. **Hand off** — give them the `/admin` link, confirm Google login, walk through editing one block
   with the live preview.
The shared backend and shared admin app are deployed once and untouched per client. New client =
new tenant record + new bespoke frontend bundle (+ any new shared block types it introduced).
 
-----
 
## 11. Open decisions / things to scope
 
- **Theme / styling boundary:** with bespoke `Render` per client, presentation is fully custom by
  design — but decide where shared design tokens (if any) live (`siteMeta` vs. baked into the bundle)
  and whether the import/preview steps assume any token contract. Currently leaning: tokens live in
  the client bundle; nothing about styling is shared.
- **Per-type `data` validation rollout:** envelope-only validation to start; prioritize adding strict
  per-type validators for `shop` (real money) early.
- **CloudFront topology:** one distribution per client (simplest, fine for a handful) vs. host-header
  routing on a shared distribution (more elegant at scale). Start per-client.
- **Cost tracking / isolation:** resource tagging now (lightweight) vs. separate AWS accounts per
  client via Organizations later (heavy, only at real scale). Start with tagging.
- **Content import pipeline (business segment):** scrape/convert existing sites into blocks. Likely
  where much of the real labor (and value) of the business offering sits. Scope as its own workstream.
- **Shop:** real money = a different liability tier. Stripe Connect keeps you out of PCI /
  money-transmission scope and makes each client the merchant of record. Treat as its own workstream
  and likely a premium tier rather than baseline.
- **IaC tool:** pick CDK, Terraform, or SST and commit before onboarding client #2.
-----
 
## 12. Cost & pricing note
 
At small-site traffic, per-client AWS cost is roughly: hosted zone ($0.50/mo) + domain amortized
(~$1/mo) + pennies of S3 / CloudFront / Lambda / API Gateway / DynamoDB / Cognito ≈ **~$2/client/mo**.
 
Pricing has two parts, matching the bespoke/standardized split:
 
- **Upfront creative fee** — covers the high-cost, bespoke design+build phase (the Claude Design
  collaboration and custom render components). This is where the differentiated value is priced.
- **Subscription ($5–15/mo range)** — covers hosting + standardized maintenance; almost entirely
  margin and labor on a ~$2 cost base.
Domain markup (e.g. charging $30 on a ~$12 registration) is a legitimate, transparent line item.
