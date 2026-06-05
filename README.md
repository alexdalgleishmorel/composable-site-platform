# Composable Site Platform

A productized managed service that designs, builds, and hosts highly customized websites for
non-technical clients on a shared, block-based content backbone. See
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the standing architecture brief (the source of
truth) and [`docs/adr/`](docs/adr/) for recorded decisions.

## Monorepo layout

| Path                  | Package            | What it is                                                      |
| --------------------- | ------------------ | --------------------------------------------------------------- |
| `packages/core`       | `@csp/core`        | Shared types (`TenantContent` envelope) and the API client.     |
| `packages/blocks`     | `@csp/blocks`      | The block registry: per-type `{ type, schema, EditForm }`.      |
| `packages/admin`      | `@csp/admin`       | The shared admin app (block editor + iframe preview).           |
| `services/api`        | `@csp/api`         | Lambda handlers (content CRUD, presign, checkout, webhook).     |
| `infra/shared`        | —                  | Terraform for the shared backend (API GW, Lambda, DynamoDB, …). |
| `infra/tenant`        | —                  | Terraform module provisioning one client tenant.                |
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
