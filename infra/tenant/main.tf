locals {
  name = replace(var.tenant_domain, ".", "-")
}

# --- DNS (the piece you must control to host the site, §9) -----------------------------------------
# With Route 53 Domains the hosted zone is auto-created at registration (and the domain's nameservers
# already point at it), so reference it by default. manage_zone=true creates it instead.
resource "aws_route53_zone" "this" {
  count = var.manage_zone ? 1 : 0
  name  = var.tenant_domain
}

data "aws_route53_zone" "this" {
  count = var.manage_zone ? 0 : 1
  name  = var.tenant_domain
}

locals {
  zone_id     = var.manage_zone ? aws_route53_zone.this[0].zone_id : data.aws_route53_zone.this[0].zone_id
  nameservers = var.manage_zone ? aws_route53_zone.this[0].name_servers : data.aws_route53_zone.this[0].name_servers
}

# --- Optional primary domain: serve the site from a different domain than the tenantId -------------
# When set, the site is served from primary_domain and every other hostname (tenant_domain, www.*)
# 301-redirects to it with the path + query kept, so old links keep working. The tenantId (content,
# uploads, the email->tenant map) stays tenant_domain. The primary domain's hosted zone must already
# exist in this account (as Route 53 Domains creates it at registration).
locals {
  has_primary    = var.primary_domain != "" && var.primary_domain != var.tenant_domain
  primary_domain = local.has_primary ? var.primary_domain : var.tenant_domain
  hostnames = distinct(flatten([
    for d in [local.primary_domain, var.tenant_domain] : [d, "www.${d}"]
  ]))
}

data "aws_route53_zone" "primary" {
  count = local.has_primary ? 1 : 0
  name  = var.primary_domain
}

locals {
  primary_zone_id = local.has_primary ? data.aws_route53_zone.primary[0].zone_id : local.zone_id
  primary_names   = [local.primary_domain, "www.${local.primary_domain}"]
}

# --- TLS: ACM cert in us-east-1 (required by CloudFront), DNS-validated -----------------------------
resource "aws_acm_certificate" "cert" {
  provider                  = aws.us_east_1
  domain_name               = var.tenant_domain
  subject_alternative_names = [for h in local.hostnames : h if h != var.tenant_domain]
  validation_method         = "DNS"
  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.cert.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      type   = dvo.resource_record_type
      record = dvo.resource_record_value
    }
  }
  zone_id         = contains(local.primary_names, each.key) ? local.primary_zone_id : local.zone_id
  name            = each.value.name
  type            = each.value.type
  records         = [each.value.record]
  ttl             = 60
  allow_overwrite = true
}

resource "aws_acm_certificate_validation" "cert" {
  provider                = aws.us_east_1
  certificate_arn         = aws_acm_certificate.cert.arn
  validation_record_fqdns = [for r in aws_route53_record.cert_validation : r.fqdn]
}

# --- Static hosting: private S3 + CloudFront (OAC) -------------------------------------------------
resource "aws_s3_bucket" "site" {
  bucket = "csp-site-${local.name}"
}

resource "aws_s3_bucket_public_access_block" "site" {
  bucket                  = aws_s3_bucket.site.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_cloudfront_origin_access_control" "site" {
  name                              = "csp-site-${local.name}"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "site" {
  enabled             = true
  default_root_object = "index.html"
  aliases             = local.hostnames

  origin {
    domain_name              = aws_s3_bucket.site.bucket_regional_domain_name
    origin_id                = "site"
    origin_access_control_id = aws_cloudfront_origin_access_control.site.id
  }

  default_cache_behavior {
    target_origin_id       = "site"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    cache_policy_id        = "658327ea-f89d-4fab-a63d-7e88639e58f6" # Managed-CachingOptimized

    dynamic "function_association" {
      for_each = local.has_primary ? [1] : []
      content {
        event_type   = "viewer-request"
        function_arn = aws_cloudfront_function.redirect_to_primary[0].arn
      }
    }
  }

  # SPA deep links (/admin, /projects/...) — serve index.html on 403/404 so client routing works (§4).
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
    acm_certificate_arn      = aws_acm_certificate_validation.cert.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }
}

# Viewer-request redirect: any hostname other than the primary domain -> https://<primary><uri>?<qs>.
# Runs before the cache, so redirects are never cached against the primary's objects.
resource "aws_cloudfront_function" "redirect_to_primary" {
  count   = local.has_primary ? 1 : 0
  name    = "csp-redirect-${local.name}"
  runtime = "cloudfront-js-2.0"
  publish = true
  code    = <<-EOT
    function handler(event) {
      var req = event.request;
      var host = req.headers.host ? req.headers.host.value : '';
      if (host === '${local.primary_domain}') return req;
      var parts = [];
      for (var key in req.querystring) {
        var q = req.querystring[key];
        var values = q.multiValue ? q.multiValue : [q];
        for (var i = 0; i < values.length; i++) {
          parts.push(values[i].value === '' ? key : key + '=' + values[i].value);
        }
      }
      var location = 'https://${local.primary_domain}' + req.uri + (parts.length ? '?' + parts.join('&') : '');
      return {
        statusCode: 301,
        statusDescription: 'Moved Permanently',
        headers: { location: { value: location } },
      };
    }
  EOT
}

resource "aws_s3_bucket_policy" "site" {
  bucket = aws_s3_bucket.site.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "AllowCloudFrontRead"
      Effect    = "Allow"
      Principal = { Service = "cloudfront.amazonaws.com" }
      Action    = "s3:GetObject"
      Resource  = "${aws_s3_bucket.site.arn}/*"
      Condition = {
        StringEquals = { "AWS:SourceArn" = aws_cloudfront_distribution.site.arn }
      }
    }]
  })
}

# --- Alias records: apex + www -> CloudFront -------------------------------------------------------
# allow_overwrite so onboarding can *adopt* a domain that already resolves elsewhere (e.g. apex/www
# A or CNAME records left by a prior host like GitHub Pages): the cutover is then an atomic UPSERT to
# CloudFront rather than a "record already exists" failure — and zero-downtime.
resource "aws_route53_record" "apex" {
  zone_id         = local.zone_id
  name            = var.tenant_domain
  type            = "A"
  allow_overwrite = true
  alias {
    name                   = aws_cloudfront_distribution.site.domain_name
    zone_id                = aws_cloudfront_distribution.site.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "www" {
  zone_id         = local.zone_id
  name            = "www.${var.tenant_domain}"
  type            = "A"
  allow_overwrite = true
  alias {
    name                   = aws_cloudfront_distribution.site.domain_name
    zone_id                = aws_cloudfront_distribution.site.hosted_zone_id
    evaluate_target_health = false
  }
}

# Primary domain apex + www -> the same CloudFront (only when primary_domain is set).
resource "aws_route53_record" "primary_apex" {
  count           = local.has_primary ? 1 : 0
  zone_id         = local.primary_zone_id
  name            = var.primary_domain
  type            = "A"
  allow_overwrite = true
  alias {
    name                   = aws_cloudfront_distribution.site.domain_name
    zone_id                = aws_cloudfront_distribution.site.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "primary_www" {
  count           = local.has_primary ? 1 : 0
  zone_id         = local.primary_zone_id
  name            = "www.${var.primary_domain}"
  type            = "A"
  allow_overwrite = true
  alias {
    name                   = aws_cloudfront_distribution.site.domain_name
    zone_id                = aws_cloudfront_distribution.site.hosted_zone_id
    evaluate_target_health = false
  }
}

# --- Tenant mapping: allow-listed Google email -> this tenant (§8) ---------------------------------
# Written into the shared csp-tenant-map table (created by infra/shared); the pre-token Lambda reads
# it on sign-in to inject custom:tenantId — which works for federated Google identities, unlike a
# pre-created native user.
resource "aws_dynamodb_table_item" "tenant_map" {
  table_name = "csp-tenant-map"
  hash_key   = "email"
  item = jsonencode({
    email    = { S = lower(var.client_google_email) }
    tenantId = { S = var.tenant_domain }
  })
}

# --- Tenant registry row (owner console): registers this client so it appears in the clients list
# pre-provisioned. No `blocks` attribute is written, so the default — every block type allowed —
# applies until the owner restricts it from the console. (csp-tenants is created by infra/shared.)
resource "aws_dynamodb_table_item" "tenant" {
  table_name = "csp-tenants"
  hash_key   = "tenantId"
  item = jsonencode({
    tenantId    = { S = var.tenant_domain }
    displayName = { S = var.display_name != "" ? var.display_name : var.tenant_domain }
    status      = { S = "active" }
  })

  # The owner console manages `blocks` (and may update displayName/status) at runtime; don't let a
  # re-apply clobber those owner-set attributes.
  lifecycle {
    ignore_changes = [item]
  }
}
