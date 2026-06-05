variable "aws_region" {
  description = "Region for the state backend and IAM (us-east-1 keeps it close to the ACM certs CloudFront requires)."
  type        = string
  default     = "us-east-1"
}

variable "github_org" {
  description = "GitHub org/user that owns the repo allowed to assume the deploy role."
  type        = string
  default     = "alexdalgleishmorel"
}

variable "github_repo" {
  description = "Repository name scoped in the OIDC trust policy."
  type        = string
  default     = "composable-site-platform"
}

variable "state_bucket_name" {
  description = "Globally-unique S3 bucket name for Terraform remote state."
  type        = string
  default     = "csp-tfstate-alexdalgleishmorel"
}

variable "lock_table_name" {
  description = "DynamoDB table for Terraform state locking."
  type        = string
  default     = "csp-tflock"
}

variable "deploy_environment" {
  description = "GitHub Actions environment that gates the deploy role (extra scope on the trust policy)."
  type        = string
  default     = "production"
}
