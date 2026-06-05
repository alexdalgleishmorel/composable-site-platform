# infra/shared — shared backend (Terraform)

Terraform root module for the **shared, deploy-once** backend that serves every tenant:

- DynamoDB content table (issue #12)
- API Gateway HTTP API + content Lambdas (#13)
- Cognito user pool + Google IdP + JWT authorizer (#14)
- S3 image bucket + presign Lambda (#15)

State is stored in the remote backend (S3 bucket + DynamoDB lock table) created by the bootstrap in
issue #2. Deployed from CI via the keyless GitHub OIDC role (`deploy-shared.yml`, #17).

> Terraform sources land with their issues; this folder is a placeholder for now.
