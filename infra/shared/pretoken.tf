# ---------------------------------------------------------------------------------------------------
# Pre-token-generation: inject custom:tenantId for FEDERATED (Google) sign-ins (#14, §8). A Google
# user is a different identity than any native user, so the tenant claim is added at token time from
# a simple email -> tenantId map that infra/tenant writes per client.
# ---------------------------------------------------------------------------------------------------

resource "aws_dynamodb_table" "tenant_map" {
  name         = "csp-tenant-map"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "email"

  attribute {
    name = "email"
    type = "S"
  }
}

resource "aws_lambda_function" "pre_token" {
  function_name    = "csp-pre-token"
  role             = aws_iam_role.lambda.arn
  runtime          = "nodejs22.x"
  handler          = "index.preTokenGeneration"
  filename         = data.archive_file.api.output_path
  source_code_hash = data.archive_file.api.output_base64sha256
  timeout          = 5

  environment {
    variables = {
      TENANT_MAP_TABLE = aws_dynamodb_table.tenant_map.name
    }
  }
}

resource "aws_lambda_permission" "cognito_pre_token" {
  statement_id  = "AllowCognitoInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.pre_token.function_name
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = aws_cognito_user_pool.main.arn
}
