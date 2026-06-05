# ADR 0001 — Stack choices and wireframe block-gap decisions

- **Status:** Accepted
- **Date:** 2026-06-05
- **Context:** Kicking off the build of the composable site platform (see `docs/ARCHITECTURE.md`).
  Decisions below were made with the project owner before implementation and are referenced
  throughout the issues and PRs.

## Decisions

### D1–D3 — Wireframe block gaps (the jmdm Claude Design handoff)

The `clients/jmdm/design` wireframe predates the settled block model. It is treated as a **visual
reference**, not a data-model spec; where its implied structure conflicts with the block model in the
architecture brief, **the brief wins** (§2/§3). Mapping the wireframe onto MVP blocks surfaced content
that fits none of the three MVP blocks (richText / projectGrid / shop). Per §2 ("new block type in the
shared registry first"), we chose to add new shared block types rather than invent ad-hoc fields:

- **D1 — `entryList`** for the About page CV sections ("selected works", "press / writing"): rows of
  `year + title + subtitle`. Reusable across the business segment (awards, experience, team).
- **D2 — maximal new blocks** for the remaining gaps rather than folding them lossily into richText:
  - **`noteCards`** for the About "currently" cards (`label + body`).
  - **`shopNotes`** for the shop page's "Shipping" / "Note from the studio" prose — kept **off** the
    `shop` money schema (don't bolt presentation prose onto the money contract).
  - The contact block's **studio location + hours** are genuinely site-wide config, so they are
    **additive optional `siteMeta` fields**, not a new block.
- **D3 — drop the unified `JM-NNN` catalog for MVP.** The wireframe's "one catalog, projects and shop
  share a single numbering system" conceit conflicts with the brief's two-independent-blocks model
  (`projectGrid` + `shop`). We reconstruct as two separate blocks and **drop cross-section `JM-NNN`
  numbering** for the MVP. Revisit only if the client considers it essential; it would then be a
  cross-block concern beyond MVP scope.

### D4 — App-code tooling

**pnpm workspaces + Turborepo + TypeScript (strict) + Zod.** Zod is load-bearing: it is the runtime
enforcement of every block `schema` (the data plane of §2).

### D5 — Infrastructure as Code: Terraform

**Terraform** (not CDK/SST) for all AWS infrastructure, by owner preference and as the cloud-agnostic
industry default. State lives in a **remote S3 backend + DynamoDB lock table** created by the
bootstrap (issue #2). The shared backend is one root module (`infra/shared`); per-tenant provisioning
is a reusable module (`infra/tenant`). CI deploys via **GitHub OIDC federation** — a short-lived
assumed IAM role, **no long-lived AWS keys** in GitHub secrets.

### D6 — Stripe checkout deferred

The shop ships **hidden/beta** for the jmdm launch; real Stripe Connect checkout + webhook (issue #16)
is **deferred post-launch** (the wireframe itself says "checkout opens autumn 2026").

## Consequences

- The shared block library ships six types at MVP: `richText`, `projectGrid`, `shop`, `entryList`,
  `noteCards`, `shopNotes`. Each new type feeds the reusable library (the product moat, §3).
- `siteMeta` gains optional `studioLocation` and `hours`.
- No unified catalog/numbering work in MVP.
- All infra is Terraform; CI is keyless via OIDC.
- jmdm.org launches with the shop in beta.
