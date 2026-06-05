# infra/tenant — per-tenant provisioning (Terraform module)

A reusable, parameterized Terraform module that stands up **one client tenant** (issue #24). Inputs:
the tenant's domain and the client's Google email. Provisions:

- Private S3 site bucket + CloudFront distribution (OAC)
- ACM certificate (us-east-1, required by CloudFront)
- Route 53 hosted zone + alias records
- CloudFront 403/404 -> `index.html` (SPA deep links such as `/admin`)
- DynamoDB tenant record + Cognito user/tenant mapping
- Resource tagging for per-client cost tracking

Invoked from CI via `provision-tenant.yml` (#25). The first instantiation is `jmdm.org` (#28).

> Terraform sources land with their issues; this folder is a placeholder for now.
