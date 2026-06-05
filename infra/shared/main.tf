data "aws_caller_identity" "current" {}

# --- Content store (#12) --------------------------------------------------------------------------
resource "aws_dynamodb_table" "content" {
  name         = "csp-content"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "tenantId"

  attribute {
    name = "tenantId"
    type = "S"
  }
}

# --- Image store (#15): private bucket, browser PUTs via presign, served through CloudFront --------
resource "aws_s3_bucket" "uploads" {
  bucket_prefix = "csp-uploads-"
}

resource "aws_s3_bucket_public_access_block" "uploads" {
  bucket                  = aws_s3_bucket.uploads.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_cors_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id
  cors_rule {
    allowed_methods = ["PUT"]
    allowed_origins = ["*"] # presigned PUT is already scoped to one key; tighten to admin origin later
    allowed_headers = ["*"]
    max_age_seconds = 3000
  }
}

resource "aws_cloudfront_origin_access_control" "uploads" {
  name                              = "csp-uploads-oac"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "uploads" {
  enabled = true

  origin {
    domain_name              = aws_s3_bucket.uploads.bucket_regional_domain_name
    origin_id                = "uploads"
    origin_access_control_id = aws_cloudfront_origin_access_control.uploads.id
  }

  default_cache_behavior {
    target_origin_id       = "uploads"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    cache_policy_id        = "658327ea-f89d-4fab-a63d-7e88639e58f6" # Managed-CachingOptimized
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

resource "aws_s3_bucket_policy" "uploads" {
  bucket = aws_s3_bucket.uploads.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "AllowCloudFrontRead"
      Effect    = "Allow"
      Principal = { Service = "cloudfront.amazonaws.com" }
      Action    = "s3:GetObject"
      Resource  = "${aws_s3_bucket.uploads.arn}/*"
      Condition = {
        StringEquals = { "AWS:SourceArn" = aws_cloudfront_distribution.uploads.arn }
      }
    }]
  })
}

# --- Auth: Cognito + Google IdP (#14) -------------------------------------------------------------
resource "aws_cognito_user_pool" "main" {
  name = "csp-users"

  # Tenant-isolation claim: the Lambda asserts this against the resource (§8).
  schema {
    name                = "tenantId"
    attribute_data_type = "String"
    mutable             = true
    string_attribute_constraints {
      min_length = 1
      max_length = 255
    }
  }
}

resource "aws_cognito_identity_provider" "google" {
  user_pool_id  = aws_cognito_user_pool.main.id
  provider_name = "Google"
  provider_type = "Google"

  provider_details = {
    client_id        = var.google_client_id
    client_secret    = var.google_client_secret
    authorize_scopes = "openid email profile"
  }

  attribute_mapping = {
    email    = "email"
    username = "sub"
  }
}

resource "aws_cognito_user_pool_domain" "main" {
  domain       = var.cognito_domain_prefix
  user_pool_id = aws_cognito_user_pool.main.id
}

resource "aws_cognito_user_pool_client" "admin" {
  name                         = "csp-admin"
  user_pool_id                 = aws_cognito_user_pool.main.id
  supported_identity_providers = [aws_cognito_identity_provider.google.provider_name]
  # The hosted admin URL (this apply) plus any extra (e.g. localhost for dev) from the variable.
  callback_urls                        = concat(["https://${aws_cloudfront_distribution.admin.domain_name}/"], var.admin_callback_urls)
  logout_urls                          = ["https://${aws_cloudfront_distribution.admin.domain_name}/"]
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_scopes                 = ["openid", "email", "profile"]
  allowed_oauth_flows_user_pool_client = true
  generate_secret                      = false
}

# --- Lambda (#13/#15) -----------------------------------------------------------------------------
data "archive_file" "api" {
  type        = "zip"
  source_dir  = var.lambda_dist_dir
  output_path = "${path.module}/.build/api.zip"
}

resource "aws_iam_role" "lambda" {
  name = "csp-api-lambda"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "lambda_access" {
  name = "csp-api-access"
  role = aws_iam_role.lambda.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["dynamodb:GetItem", "dynamodb:PutItem"]
        Resource = aws_dynamodb_table.content.arn
      },
      {
        Effect   = "Allow"
        Action   = ["s3:PutObject"]
        Resource = "${aws_s3_bucket.uploads.arn}/*"
      },
    ]
  })
}

locals {
  lambda_env = {
    CONTENT_TABLE = aws_dynamodb_table.content.name
    UPLOAD_BUCKET = aws_s3_bucket.uploads.bucket
    CDN_BASE_URL  = "https://${aws_cloudfront_distribution.uploads.domain_name}"
  }
  handlers = {
    get_content     = "index.getContent"
    put_content     = "index.putContent"
    uploads_presign = "index.uploadsPresign"
  }
}

resource "aws_lambda_function" "api" {
  for_each         = local.handlers
  function_name    = "csp-${replace(each.key, "_", "-")}"
  role             = aws_iam_role.lambda.arn
  runtime          = "nodejs20.x"
  handler          = each.value
  filename         = data.archive_file.api.output_path
  source_code_hash = data.archive_file.api.output_base64sha256
  timeout          = 10

  environment {
    variables = local.lambda_env
  }
}

# --- HTTP API (#13) -------------------------------------------------------------------------------
resource "aws_apigatewayv2_api" "http" {
  name          = "csp-api"
  protocol_type = "HTTP"
  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["GET", "PUT", "POST", "OPTIONS"]
    allow_headers = ["content-type", "authorization"]
  }
}

resource "aws_apigatewayv2_authorizer" "jwt" {
  api_id           = aws_apigatewayv2_api.http.id
  authorizer_type  = "JWT"
  identity_sources = ["$request.header.Authorization"]
  name             = "cognito-jwt"

  jwt_configuration {
    audience = [aws_cognito_user_pool_client.admin.id]
    issuer   = "https://cognito-idp.${var.aws_region}.amazonaws.com/${aws_cognito_user_pool.main.id}"
  }
}

resource "aws_apigatewayv2_integration" "api" {
  for_each               = local.handlers
  api_id                 = aws_apigatewayv2_api.http.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.api[each.key].invoke_arn
  payload_format_version = "2.0"
}

locals {
  routes = {
    get_content     = { key = "GET /content", auth = false }
    put_content     = { key = "PUT /content", auth = true }
    uploads_presign = { key = "POST /uploads/presign", auth = true }
  }
}

resource "aws_apigatewayv2_route" "api" {
  for_each           = local.routes
  api_id             = aws_apigatewayv2_api.http.id
  route_key          = each.value.key
  target             = "integrations/${aws_apigatewayv2_integration.api[each.key].id}"
  authorization_type = each.value.auth ? "JWT" : "NONE"
  authorizer_id      = each.value.auth ? aws_apigatewayv2_authorizer.jwt.id : null
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.http.id
  name        = "$default"
  auto_deploy = true
}

resource "aws_lambda_permission" "api" {
  for_each      = local.handlers
  statement_id  = "AllowApiGwInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api[each.key].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http.execution_arn}/*/*"
}
