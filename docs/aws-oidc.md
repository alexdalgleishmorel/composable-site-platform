# AWS bootstrap: OIDC federation + Terraform state backend

This is the **one-time** AWS setup that makes CI deploys keyless. You run it once, with your own AWS
admin credentials, on your machine. It is the only place your personal AWS credentials are used — they
never go into GitHub. Defined as Terraform in [`infra/bootstrap`](../infra/bootstrap).

## What it creates

- A **GitHub OIDC identity provider** (`token.actions.githubusercontent.com`).
- Two IAM roles, both trusting **only this repo** via the OIDC provider:
  - `gh-actions-plan` — read-only, assumable by any run in the repo (incl. PRs); used by PR
    build/`terraform plan`.
  - `gh-actions-deploy` — write, assumable **only** from `main` or the gated `production` environment;
    used by deploy/provision workflows.
- The **Terraform remote state backend**: a versioned, encrypted S3 bucket + a DynamoDB lock table.

## Run it (once)

```bash
cd infra/bootstrap
# Authenticate however you normally do (SSO, `aws configure`, env vars). Confirm the account:
aws sts get-caller-identity

terraform init        # local state — this stack *creates* the remote backend
terraform apply       # review the plan, then approve
```

Bucket names are global; if `csp-tfstate-alexdalgleishmorel` is taken, pass
`-var state_bucket_name=<something-unique>`.

## Wire the outputs into GitHub

```bash
terraform output
```

Add the two role ARNs as **repository variables** (Settings → Secrets and variables → Actions →
Variables — these are ARNs, not secrets):

- `AWS_DEPLOY_ROLE_ARN` = `deploy_role_arn`
- `AWS_PLAN_ROLE_ARN`   = `plan_role_arn`

Create a `production` environment (Settings → Environments) — optionally with required reviewers — so
deploy jobs are gated.

The `state_bucket` / `lock_table` outputs are referenced by the `backend "s3"` blocks in
`infra/shared` and `infra/tenant` (issues #12–#15, #24).

## Verify (no static keys anywhere)

The CI workflow (#3) runs `aws sts get-caller-identity` after assuming `gh-actions-plan` via OIDC. A
green run with **no** `AWS_ACCESS_KEY_ID` secret in the repo confirms federation works.

## Tightening later

`gh-actions-deploy` uses a broad service policy for the MVP (a handful of stacks). Once the resource
set stabilises, scope the actions in [`infra/bootstrap/oidc.tf`](../infra/bootstrap/oidc.tf) to
specific resource ARNs. `iam:*` is required because `infra/shared` creates Lambda execution roles and
`infra/tenant` creates per-tenant roles.
