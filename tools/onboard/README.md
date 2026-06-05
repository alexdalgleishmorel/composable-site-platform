# @csp/onboard — customer onboarding helpers

Tools that make adding a new client mostly a matter of dispatching one workflow.

## The onboarding recipe

**One-time platform setup** (done once, ever): `infra/bootstrap` (#2), deploy shared backend (#17),
Google OAuth.

**Per customer:**

1. **Creative design + build** the bundle → commit `clients/<id>/bundle` (the bespoke, paid part).
   Each client's `bundle/src/seed.ts` must `export const seed` (the initial content).
2. **Register the domain** — `./register-domain.sh <domain> <contact.json>` (client = registrant; Route
   53 Domains auto-creates the hosted zone, so no manual nameserver step).
3. **Onboard** — run the **`onboard-client`** workflow (one dispatch): provisions the tenant
   (`infra/tenant`), deploys the bundle, and seeds content. Gated by the `production` approval.
4. **Hand off** — give the client `/admin`, confirm Google login.

The discrete `provision-tenant` / `deploy-client` workflows still exist for re-running a single phase.

## Seeding content directly

`onboard-client` calls this, but you can run it standalone (uses your AWS creds; no admin login needed):

```bash
pnpm --filter @csp/onboard seed -- --client jmdm --table csp-content
```

It loads `clients/jmdm/bundle/src/seed.ts`'s `seed`, validates it against the shared registry, and
`PUT`s it into DynamoDB.

## Registering a domain

```bash
cp contact-template.json /tmp/jack-contact.json   # fill in the client's real details
./register-domain.sh jmdm.org /tmp/jack-contact.json
```

A real ~$12–14/yr purchase; asynchronous. Track with
`aws route53domains list-operations --region us-east-1`.
