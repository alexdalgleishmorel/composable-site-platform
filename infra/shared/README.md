# infra/shared — shared backend (Terraform)

The **deploy-once** backend serving every tenant (#12–#15). Deployed by `deploy-shared.yml` (#17) via
the keyless OIDC role.

- **DynamoDB** content table (`tenantId` PK) — #12
- **HTTP API Gateway** + three Lambda integrations (`GET /content`, `PUT /content`,
  `POST /uploads/presign`) with a Cognito **JWT authorizer** on the admin routes — #13
- **Cognito** user pool + `custom:tenantId` + **Google IdP** + hosted domain + admin app client — #14
- **S3 uploads** bucket (private, CORS for presigned PUT) + **CloudFront** (OAC) for serving — #15

## Apply (CI does this; manual form)

```bash
terraform init \
  -backend-config="bucket=<state bucket from bootstrap>" \
  -backend-config="dynamodb_table=<lock table>" \
  -backend-config="region=us-east-1"
TF_VAR_google_client_id=… TF_VAR_google_client_secret=… terraform apply
```

The Lambda zip is produced by `pnpm --filter @csp/api bundle` (esbuild, CJS, React-free) into
`services/api/dist` before apply.

## GitHub config the deploy workflow needs

- Variables: `AWS_DEPLOY_ROLE_ARN`, `TF_STATE_BUCKET`, `TF_LOCK_TABLE`
- Secrets (in the `production` environment): `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

> Validated with `terraform validate`; a real `terraform apply` happens on AWS day (needs #2).
