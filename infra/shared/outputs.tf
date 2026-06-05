output "api_base_url" {
  description = "HTTP API base URL — the bundle's VITE_API_BASE_URL and the admin's transport."
  value       = aws_apigatewayv2_api.http.api_endpoint
}

output "content_table" {
  value = aws_dynamodb_table.content.name
}

output "uploads_bucket" {
  value = aws_s3_bucket.uploads.bucket
}

output "uploads_cdn_base" {
  value = "https://${aws_cloudfront_distribution.uploads.domain_name}"
}

output "user_pool_id" {
  value = aws_cognito_user_pool.main.id
}

output "user_pool_client_id" {
  value = aws_cognito_user_pool_client.admin.id
}

output "cognito_domain" {
  value = "${aws_cognito_user_pool_domain.main.domain}.auth.${var.aws_region}.amazoncognito.com"
}

output "admin_url" {
  description = "The shared admin app URL (clients sign in here)."
  value       = "https://${aws_cloudfront_distribution.admin.domain_name}"
}

output "admin_bucket" {
  value = aws_s3_bucket.admin.bucket
}

output "admin_distribution_id" {
  value = aws_cloudfront_distribution.admin.id
}
