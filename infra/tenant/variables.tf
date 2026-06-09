variable "tenant_domain" {
  description = "The tenant's domain — also its tenantId (e.g. \"jmdm.org\")."
  type        = string
}

variable "client_google_email" {
  description = "The client's allow-listed Google email; mapped to this tenant in Cognito (§8)."
  type        = string
}

variable "display_name" {
  description = "Friendly client name shown in the owner console. Defaults to the domain."
  type        = string
  default     = ""
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "user_pool_id" {
  description = "The shared Cognito user pool id (output of infra/shared)."
  type        = string
}

variable "manage_zone" {
  description = <<-EOT
    false (default): reference an existing Route 53 hosted zone — the one Route 53 Domains auto-creates
    at registration, so provisioning is a single clean apply with no manual nameserver step.
    true: have Terraform create the zone (for domains registered with an external registrar; you then
    point that registrar's nameservers at the `nameservers` output).
  EOT
  type        = bool
  default     = false
}
