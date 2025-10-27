This configuration includes key resources for:
✅ Data ingestion (API Gateway, Lambda, S3)
✅ Data processing (Lambda, OpenSearch)
✅ AI/ML (SageMaker, Bedrock placeholder)
✅ Frontend delivery (Amplify, CloudFront)
✅ Security & Access control (IAM, Cognito)



Plan: 17 to add, 0 to change, 0 to destroy.

Changes to Outputs:
  + amplify_app_url            = (known after apply)
  + api_gateway_url            = (known after apply)
  + cloudfront_distribution_id = (known after apply)
  + cloudfront_domain_name     = (known after apply)
  + cognito_client_id          = (known after apply)
  + cognito_user_pool_id       = (known after apply)
  + lambda_ingest_name         = "league-ai-analytics-data-ingest"
  + lambda_process_name        = "league-ai-analytics-data-process"
  + opensearch_endpoint        = (known after apply)
  + s3_bucket_name             = "league-ai-analytics-raw-data"
  + sagemaker_notebook_name    = "league-ai-analytics-notebook"


Terraform state list:

aws_amplify_app.frontend
aws_apigatewayv2_api.ingestion_api
aws_apigatewayv2_integration.lambda_integration
aws_apigatewayv2_route.api_route
aws_cognito_user_pool.user_pool
aws_cognito_user_pool_client.user_pool_client
aws_iam_role.lambda_exec_role
aws_iam_role_policy_attachment.lambda_basic_exec
aws_lambda_function.data_ingest
aws_lambda_function.data_process
aws_lambda_permission.allow_apigw_invoke
aws_lambda_permission.allow_s3_invoke
aws_s3_bucket.raw_data
aws_s3_bucket_notification.s3_to_lambda
aws_sagemaker_notebook_instance.ml_notebook





