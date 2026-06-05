variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "google_client_id" {
  description = "Google OAuth client id for the Cognito Google IdP."
  type        = string
  default     = ""
}

variable "google_client_secret" {
  description = "Google OAuth client secret."
  type        = string
  sensitive   = true
  default     = ""
}

variable "cognito_domain_prefix" {
  description = "Globally-unique prefix for the Cognito hosted-UI domain."
  type        = string
  default     = "csp-auth"
}

variable "admin_callback_urls" {
  description = "Allowed OAuth callback URLs (the admin app at each tenant's /admin)."
  type        = list(string)
  default     = ["http://localhost:5173/admin"]
}

variable "lambda_dist_dir" {
  description = "Bundled Lambda output (esbuild) — produced by the deploy workflow before apply."
  type        = string
  default     = "../../services/api/dist"
}
