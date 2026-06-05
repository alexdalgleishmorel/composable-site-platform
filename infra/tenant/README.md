# infra/tenant — per-tenant provisioning (Terraform root)

Parameterized provisioning for **one client tenant** (#24): inputs are the tenant's domain (also its
tenantId) and the client's Google email. Run per client by `provision-tenant.yml` (#25) with a
distinct state key (`tenant/<domain>/terraform.tfstate`).

Provisions (`terraform validate` ✓):

- **Route 53** hosted zone + apex/www alias records to CloudFront.
- **ACM** certificate in **us-east-1** (CloudFront requirement), DNS-validated.
- **Private S3** site bucket + **CloudFront** (OAC), `default_root_object=index.html`, and
  **403/404 → /index.html** so SPA deep links like `/admin` resolve (§4).
- **Cognito user** mapping the client's email → `custom:tenantId` (the isolation boundary, §8).

## Run (CI does this; manual form)

```bash
terraform init -backend-config="bucket=…" -backend-config="dynamodb_table=…" \
  -backend-config="region=us-east-1" -backend-config="key=tenant/jmdm.org/terraform.tfstate"
terraform apply -var tenant_domain=jmdm.org -var client_google_email=… -var user_pool_id=…
terraform output nameservers   # point the registrar here (§9)
```

The shared backend (`infra/shared`) is deployed once and untouched per tenant; a new client = a new
tenant apply + a bespoke bundle deploy (`deploy-client.yml`, #26).
