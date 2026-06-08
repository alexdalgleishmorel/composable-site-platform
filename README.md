# Composable Site Platform

A productized managed service that designs, builds, and hosts highly customized websites for
non-technical clients on a shared, block-based content backbone.

- [`docs/STATUS.md`](docs/STATUS.md) — **start here**: live deployment, what's left, and operating playbooks (onboard a client, re-seed, local dev).
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — the standing architecture brief (the source of truth for what the system _is_).
- [`docs/adr/`](docs/adr/) — recorded decisions · [`docs/aws-oidc.md`](docs/aws-oidc.md) — keyless CI/CD setup · [`docs/handoff-jmdm.md`](docs/handoff-jmdm.md) — client editing guide.

**Status:** deployed to production; first client [jmdm.studio](https://jmdm.studio) is live. Details in [`docs/STATUS.md`](docs/STATUS.md).

## Monorepo layout

| Path                  | Package            | What it is                                                      |
| --------------------- | ------------------ | --------------------------------------------------------------- |
| `packages/core`       | `@csp/core`        | Shared types (`TenantContent` envelope) and the API client.     |
| `packages/blocks`     | `@csp/blocks`      | The block registry: per-type `{ type, schema, EditForm }`.      |
| `packages/admin`      | `@csp/admin`       | The shared admin app (block editor + iframe preview).           |
| `packages/bundle-kit` | `@csp/bundle-kit`  | Client-bundle contract: `BlockRenderer` + live-preview harness. |
| `services/api`        | `@csp/api`         | Lambda handlers (content CRUD, presign, checkout, webhook).     |
| `infra/shared`        | —                  | Terraform for the shared backend (API GW, Lambda, DynamoDB, …). |
| `infra/tenant`        | —                  | Terraform module provisioning one client tenant.                |
| `tools/onboard`       | —                  | Seeder used by the `onboard-client` workflow (PUTs the seed).   |
| `clients/jmdm/bundle` | `@csp/jmdm-bundle` | The brother's bespoke render bundle (the first client).         |
| `clients/jmdm/design` | —                  | Claude Design handoff (visual reference only — not source).     |

## Toolchain

- **pnpm** workspaces + **Turborepo** task orchestration
- **TypeScript** (strict) + **Zod** for runtime-validated schemas
- **Vitest** for tests, **ESLint** + **Prettier** for quality
- **Terraform** for all AWS infrastructure (keyless CI via GitHub OIDC)

## Common commands

```bash
corepack enable pnpm   # one-time: provision the pinned pnpm
pnpm install
pnpm build             # turbo run build across the workspace
pnpm test              # turbo run test
pnpm lint              # turbo run lint
pnpm typecheck         # turbo run typecheck
```

Internal packages publish their TypeScript source directly (`main` -> `src/index.ts`); apps bundle
them at build time. Library packages therefore have no separate build step — `typecheck` is their
gate.
