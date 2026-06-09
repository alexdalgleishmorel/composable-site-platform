# Project status & operations

**Start here.** This is the living snapshot of what's deployed, what's left, and how to operate the
platform. [`ARCHITECTURE.md`](ARCHITECTURE.md) is the design source of truth (what the system *is*);
this doc is the operational state (where it *is*). Last updated **2026-06-08**.

## TL;DR

Build-complete and **deployed to production**. The shared backend and the shared admin app are live
on AWS; the first client, **jmdm.studio**, is registered, provisioned, and serving live content that
the client edits himself through the admin. Remaining work is all externally gated (waiting on the
client), not code.

## What's live

| Thing | URL / id |
| --- | --- |
| AWS account / region | `696532327395` / `us-east-1` |
| First client (public site) | https://jmdm.studio |
| Shared admin app | https://dubbyynbuy5nm.cloudfront.net |
| API base | `https://j2xlicenh6.execute-api.us-east-1.amazonaws.com` |
| Cognito user pool / client | `us-east-1_wkhAu5Zed` / `62rb7le9g30n1qlg36c7m0b7e2` |
| Cognito hosted domain | `csp-auth-696532327395.auth.us-east-1.amazoncognito.com` |
| DynamoDB tables | `csp-content` (content), `csp-tenant-map` (email → tenantId) |
| GitHub Project board | https://github.com/users/alexdalgleishmorel/projects (v2 board) |

**Auth model:** the admin uses Cognito Hosted UI (OIDC code+PKCE) straight to Google. A
**pre-token-generation Lambda** injects `custom:tenantId` for federated Google users by looking up
their email in `csp-tenant-map` — this is what makes a Google login carry the right tenant. Local
dev/tests fall back to mock auth when `VITE_COGNITO_*` is unset.

**Tenant resolution (public site):** each client bundle derives its tenant from
`window.location.hostname` (www-stripped) and fetches `GET /content?tenant=<host>`. One shared API
serves every tenant; there is no client-custom backend code.

## How CI/CD works (keyless, no stored AWS keys)

GitHub Actions authenticates to AWS via **OIDC federation** — no long-lived secrets anywhere. Roles:
`gh-actions-plan` (read/plan) and `gh-actions-deploy` (apply). The `production` GitHub Environment is
gated by a **required reviewer** (the repo owner), so every deploy/onboard waits on a human approval.

Repo **variables** (not secrets) carry non-sensitive config, e.g. `COGNITO_DOMAIN_PREFIX`
(`csp-auth-696532327395`) and the OIDC role ARNs. The Google client id/secret are set directly in
Cognito by the owner — never handled in code or CI.

Workflows (`.github/workflows/`):

| Workflow | Trigger | Does |
| --- | --- | --- |
| `ci.yml` | push / PR | build, typecheck, lint, test |
| `deploy-shared.yml` | push to `main` touching `infra/shared`, `services/api`, `packages/{blocks,core}` — or manual | apply shared backend + build/deploy the admin app |
| `deploy-client.yml` | manual | build + deploy one client bundle to its S3/CloudFront |
| `provision-tenant.yml` | manual | `infra/tenant` for one domain (cert, CloudFront, DNS, tenant-map row) |
| `onboard-client.yml` | manual | **provision + deploy + seed** a client in one dispatch |

## Operating playbooks

### Onboard a new client (the productized path)

1. **Register the domain** via Route 53 Domains (registrant = the client). This is the one manual,
   paid step. (jmdm.studio cost ~$13/yr.)
2. Add a **bundle** under `clients/<client>/bundle` (start from jmdm's; it's the bespoke render — the
   only per-client code) and a **seed** (`src/seed.ts`).
3. Run the **`onboard-client`** workflow (Actions tab → Run workflow) with: `client`,
   `tenant_domain`, `client_email`, `user_pool_id`, `api_base_url`. Approve the production gate.
4. It provisions the tenant, deploys the bundle, writes the email→tenant map row, and PUTs the seed.
5. Send the client [`handoff-jmdm.md`](handoff-jmdm.md) (adapt per client).

`user_pool_id` / `api_base_url` are outputs of `infra/shared` (see the Terraform outputs or the
table above).

### Re-seed / fix a client's content

Edit `clients/<client>/bundle/src/seed.ts`, then re-run `onboard-client` (it's idempotent and PUTs
the seed). Note: this **overwrites** whatever the client has since edited in the admin — only do it
before handoff or with the client's say-so.

### Local dev

```bash
corepack enable pnpm && pnpm install
pnpm build && pnpm test          # turbo across the workspace
pnpm --filter @csp/admin dev     # admin on localhost:5173 (mock auth, in-memory API)
```

The admin's mock mode uses `packages/admin/src/mockContent.ts` (a tenant-agnostic `Demo Site`) — keep
it generic; don't commit client-specific demo content there.

## Open work (all externally gated — no autonomous code needed)

| Issue | What | Blocked on |
| --- | --- | --- |
| **#29** | Handoff to Jack | Jack does the live Google-login test (interactive) + walkthrough |
| **#23 / #15** | Image migration | Jack uploads his real photos via the admin (presign endpoint exercises here); placeholders until then |
| **#16** | Stripe checkout (`POST /checkout` + webhook) | Deferred by decision ([ADR 0001](adr/)); for when the shop goes live |

## Editor redesign — shipped (2026-06-08)

The shared editor (admin app) has been **rebuilt with the "liquid glass" / glassmorphism look** from
the design handoff (`design_handoff_knit_editor/`, kept as reference) and is **live in production**
(deployed via `deploy-shared`, PR #81). It's a platform-level tool with its own identity ("Knit") —
deliberately independent of any client's branding (e.g. jmdm's lemon/Arial look, which shows only
inside the preview iframe).

Scope was look-and-feel + editing interactions, **not** the data model — the content contract, API,
and validation are unchanged. Notable behaviour: drag-to-reorder replaces up/down arrows (shared in
`@csp/blocks` `ui/fields.tsx` / `ui/upload.tsx`, with ↑/↓ keyboard fallback), delete goes through a
confirm modal, add-page, success/error toasts on save, Light/Dark + density persisted to
`localStorage`, and a **live** (not publish-gated) WYSIWYG preview. The shell lives in
`packages/admin/src/*` — `tokens.css` + `admin.css`, `shell/*`, and the `toasts.tsx` / `confirm.tsx` /
`theme.tsx` providers.

## Owner console — built (pending deploy)

A platform-**owner** role now sits above the per-tenant editor. After sign-in, `GET /admin/whoami`
routes platform owners to an **owner console** (list of active clients + per-client block
provisioning) and everyone else to their tenant editor as before. Provisioning is an **allow-list per
tenant** stored in a new `csp-tenants` DynamoDB table; **absent ⇒ all blocks allowed** (so the two
live clients keep working with no backfill). It's enforced server-side on `PUT /content` and mirrored
in the editor's "Add a block" menu.

- **Owner = email allowlist.** Set the repo **variable `OWNER_EMAILS`** to a JSON array, e.g.
  `["alex.dalgleishmorel@gmail.com"]`; `deploy-shared` passes it to the Lambda as `OWNER_EMAILS`.
  Until set, the console is inaccessible (every caller is treated as a client). Local mock owner is in
  `packages/admin/src/auth.tsx` (`DEFAULT_OWNERS`).
- **New routes** (Cognito-authed): `GET /admin/whoami`, `GET /admin/tenants` (owner-only),
  `PUT /admin/tenants/{tenantId}/blocks` (owner-only). Client list is a Scan-merge of `csp-tenants`
  and `csp-tenant-map`, so live-but-unprovisioned tenants appear without a row.
- **Touch points:** `services/api/src/{handlers,http,store,index}.ts`, `infra/shared` (table + IAM +
  env + routes), `infra/tenant` (writes a `csp-tenants` row on onboard), and `packages/admin/src/*`
  (`OwnerConsole.tsx`, `RoleRouter.tsx`, transports in `api.ts`, Add-menu filter in `BlockEditor.tsx`).
- `deploy-shared.yml` now also triggers on `packages/admin/**`.

## Conventions / guardrails for the next session

- **`docs/ARCHITECTURE.md` is the source of truth** and is prettier-ignored — do **not** reformat it.
- **No long-lived AWS keys** — keyless OIDC only. **Production is gated by a required reviewer.**
- **Never commit PII or secret values** (client contact info, Google client id/secret). Contact info
  goes to `/tmp` only, never the repo.
- **Per-issue PRs**, merged to `main` only with explicit in-conversation authorization.
- The block model is **"fix the data contract, vary the presentation"**: data + editing are shared;
  only the render bundle is bespoke per client.
