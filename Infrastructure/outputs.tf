###########################################################
# OUTPUTS
###########################################################

output "api_gateway_url" {
  description = "Public URL for the API Gateway endpoint"
  value       = aws_apigatewayv2_api.ingestion_api.api_endpoint
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket storing raw gameplay data"
  value       = aws_s3_bucket.raw_data.bucket
}

output "lambda_ingest_name" {
  description = "Name of the data ingestion Lambda function"
  value       = aws_lambda_function.data_ingest.function_name
}

output "lambda_process_name" {
  description = "Name of the data processing Lambda function"
  value       = aws_lambda_function.data_process.function_name
}

output "opensearch_endpoint" {
  description = "Endpoint for the OpenSearch domain (for processed data)"
  value       = aws_opensearch_domain.analytics_domain.endpoint
}

output "sagemaker_notebook_name" {
  description = "SageMaker notebook instance name"
  value       = aws_sagemaker_notebook_instance.ml_notebook.name
}

output "cognito_user_pool_id" {
  description = "ID of the Cognito user pool"
  value       = aws_cognito_user_pool.user_pool.id
}

output "cognito_client_id" {
  description = "Client ID for the Cognito user pool app client"
  value       = aws_cognito_user_pool_client.user_pool_client.id
}

output "amplify_app_url" {
  description = "Default domain for the Amplify-hosted frontend app"
  value       = aws_amplify_app.frontend.default_domain
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.cdn.id
}

output "cloudfront_domain_name" {
  description = "Domain name for the CloudFront CDN"
  value       = aws_cloudfront_distribution.cdn.domain_name
}
