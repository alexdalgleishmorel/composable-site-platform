output "site_bucket" {
  description = "S3 bucket the client bundle is synced to (deploy-client workflow)."
  value       = aws_s3_bucket.site.bucket
}

output "distribution_id" {
  description = "CloudFront distribution to invalidate on deploy."
  value       = aws_cloudfront_distribution.site.id
}

output "distribution_domain" {
  value = aws_cloudfront_distribution.site.domain_name
}

output "nameservers" {
  description = "Zone nameservers. With Route 53 Domains the domain already points here; with an external registrar (manage_zone=true) set these at the registrar (§9)."
  value       = local.nameservers
}

output "zone_id" {
  value = local.zone_id
}
