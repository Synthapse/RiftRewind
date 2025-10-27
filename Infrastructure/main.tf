###########################################################
# Terraform & Provider Configuration
###########################################################

terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.region
}

###########################################################
# IAM Roles and Policies
###########################################################

# Lambda execution role
resource "aws_iam_role" "lambda_exec_role" {
  name = "${var.project_name}-lambda-exec-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_basic_exec" {
  role       = aws_iam_role.lambda_exec_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

###########################################################
# Amazon S3 - Raw Data Storage
###########################################################

resource "aws_s3_bucket" "raw_data" {
  bucket = "${var.project_name}-raw-data"
  force_destroy = true
}

###########################################################
# AWS Lambda - Data Ingestion & Processing
###########################################################

# Lambda for ingesting data
resource "aws_lambda_function" "data_ingest" {
  function_name = "${var.project_name}-data-ingest"
  role          = aws_iam_role.lambda_exec_role.arn
  handler       = "index.handler"
  runtime       = "python3.11"
  filename      = "lambda_ingest.zip"

  environment {
    variables = {
      S3_BUCKET = aws_s3_bucket.raw_data.bucket
    }
  }
}

# Lambda triggered by S3 for data processing
resource "aws_lambda_function" "data_process" {
  function_name = "${var.project_name}-data-process"
  role          = aws_iam_role.lambda_exec_role.arn
  handler       = "index.handler"
  runtime       = "python3.11"
  filename      = "lambda_process.zip"
}

# S3 trigger for data processing
resource "aws_s3_bucket_notification" "s3_to_lambda" {
  bucket = aws_s3_bucket.raw_data.id

  lambda_function {
    lambda_function_arn = aws_lambda_function.data_process.arn
    events              = ["s3:ObjectCreated:*"]
  }

  depends_on = [aws_lambda_permission.allow_s3_invoke]
}

resource "aws_lambda_permission" "allow_s3_invoke" {
  statement_id  = "AllowS3Invoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.data_process.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.raw_data.arn
}

###########################################################
# Amazon API Gateway - Data Ingestion Endpoint
###########################################################

resource "aws_apigatewayv2_api" "ingestion_api" {
  name          = "${var.project_name}-api"
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_integration" "lambda_integration" {
  api_id                 = aws_apigatewayv2_api.ingestion_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.data_ingest.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "api_route" {
  api_id    = aws_apigatewayv2_api.ingestion_api.id
  route_key = "POST /ingest"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
}

resource "aws_lambda_permission" "allow_apigw_invoke" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.data_ingest.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.ingestion_api.execution_arn}/*/*"
}

###########################################################
# Amazon OpenSearch Service - Processed Data Indexing
###########################################################

resource "aws_opensearch_domain" "analytics_domain" {
  domain_name = "${var.project_name}-os"
  engine_version = "OpenSearch_2.13"

  cluster_config {
    instance_type = "t3.small.search"
    instance_count = 1
  }

  ebs_options {
    ebs_enabled = true
    volume_size = 10
  }
}

###########################################################
# Amazon SageMaker - ML Model Training (Placeholder)
###########################################################

resource "aws_sagemaker_notebook_instance" "ml_notebook" {
  name          = "${var.project_name}-notebook"
  instance_type = "ml.t3.medium"
  role_arn      = aws_iam_role.lambda_exec_role.arn
}

###########################################################
# Amazon Bedrock - (Placeholder)
###########################################################

# Bedrock is fully managed and accessed via API. 
# This section assumes integration via Lambda or SDK.

###########################################################
# Amazon Cognito - User Authentication
###########################################################

resource "aws_cognito_user_pool" "user_pool" {
  name = "${var.project_name}-user-pool"
}

resource "aws_cognito_user_pool_client" "user_pool_client" {
  name         = "${var.project_name}-client"
  user_pool_id = aws_cognito_user_pool.user_pool.id
}

###########################################################
# Amazon Amplify - Frontend Hosting
###########################################################

resource "aws_amplify_app" "frontend" {
  name = "${var.project_name}-frontend"
  repository = "https://github.com/Synthapse/RiftRewind" # Replace with your repo
  access_token = var.amplify_token

  environment_variables = {
    REACT_APP_API_URL = aws_apigatewayv2_api.ingestion_api.api_endpoint
  }
}

###########################################################
# Amazon CloudFront - CDN Distribution
###########################################################

resource "aws_cloudfront_distribution" "cdn" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "${var.project_name} CDN"
  default_root_object = "index.html"

  origin {
    domain_name = aws_amplify_app.frontend.default_domain
    origin_id   = "amplify-origin"
  }

  default_cache_behavior {
    target_origin_id       = "amplify-origin"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
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