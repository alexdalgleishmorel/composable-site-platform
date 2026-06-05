variable "tenant_domain" {
  description = "The tenant's domain — also its tenantId (e.g. \"jmdm.org\")."
  type        = string
}

variable "client_google_email" {
  description = "The client's allow-listed Google email; mapped to this tenant in Cognito (§8)."
  type        = string
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "user_pool_id" {
  description = "The shared Cognito user pool id (output of infra/shared)."
  type        = string
}
