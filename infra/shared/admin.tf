# ---------------------------------------------------------------------------------------------------
# Shared admin app hosting (#14): private S3 + CloudFront (OAC). ONE admin app serves every tenant —
# the tenant is determined by the signed-in user's custom:tenantId claim, not by the host. Uses the
# default *.cloudfront.net domain (no custom domain needed for an internal tool).
# ---------------------------------------------------------------------------------------------------

resource "aws_s3_bucket" "admin" {
  bucket_prefix = "csp-admin-"
}

resource "aws_s3_bucket_public_access_block" "admin" {
  bucket                  = aws_s3_bucket.admin.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_cloudfront_origin_access_control" "admin" {
  name                              = "csp-admin-oac"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "admin" {
  enabled             = true
  default_root_object = "index.html"

  origin {
    domain_name              = aws_s3_bucket.admin.bucket_regional_domain_name
    origin_id                = "admin"
    origin_access_control_id = aws_cloudfront_origin_access_control.admin.id
  }

  default_cache_behavior {
    target_origin_id       = "admin"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    cache_policy_id        = "658327ea-f89d-4fab-a63d-7e88639e58f6" # Managed-CachingOptimized
  }

  # SPA: serve index.html on 403/404 so the OIDC redirect (/?code=…) resolves to the app.
  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }
  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}

resource "aws_s3_bucket_policy" "admin" {
  bucket = aws_s3_bucket.admin.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "AllowCloudFrontRead"
      Effect    = "Allow"
      Principal = { Service = "cloudfront.amazonaws.com" }
      Action    = "s3:GetObject"
      Resource  = "${aws_s3_bucket.admin.arn}/*"
      Condition = {
        StringEquals = { "AWS:SourceArn" = aws_cloudfront_distribution.admin.arn }
      }
    }]
  })
}
