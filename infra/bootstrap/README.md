# infra/bootstrap — one-time AWS bootstrap (issue #2)

Creates the GitHub OIDC provider, the `gh-actions-plan` / `gh-actions-deploy` IAM roles (trust scoped
to this repo), and the Terraform remote state backend (S3 + DynamoDB).

Applied **once**, locally, with your AWS admin credentials, using **local state** — this stack is what
creates the remote backend everything else uses. See the runbook: [`docs/aws-oidc.md`](../../docs/aws-oidc.md).

```bash
terraform init && terraform apply
terraform output            # -> set AWS_DEPLOY_ROLE_ARN / AWS_PLAN_ROLE_ARN as GitHub variables
```
