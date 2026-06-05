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
  description = "Point the domain's registrar at these (§9)."
  value       = aws_route53_zone.this.name_servers
}

output "zone_id" {
  value = aws_route53_zone.this.zone_id
}
