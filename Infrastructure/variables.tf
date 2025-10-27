###########################################################
# VARIABLES
###########################################################

# General settings
variable "project_name" {
  description = "Project name prefix for all resources"
  type        = string
  default     = "league-ai-analytics"
}

variable "region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "us-east-1"
}

# Lambda configuration
variable "lambda_runtime" {
  description = "Runtime for Lambda functions"
  type        = string
  default     = "python3.11"
}

variable "lambda_ingest_handler" {
  description = "Handler for the data ingestion Lambda function"
  type        = string
  default     = "index.handler"
}

variable "lambda_process_handler" {
  description = "Handler for the data processing Lambda function"
  type        = string
  default     = "index.handler"
}

variable "lambda_ingest_zip" {
  description = "Path to the packaged Lambda ingestion function ZIP"
  type        = string
  default     = "lambda_ingest.zip"
}

variable "lambda_process_zip" {
  description = "Path to the packaged Lambda processing function ZIP"
  type        = string
  default     = "lambda_process.zip"
}

# S3 configuration
variable "s3_bucket_force_destroy" {
  description = "Whether to force destroy the S3 bucket on terraform destroy"
  type        = bool
  default     = true
}

# OpenSearch configuration
variable "opensearch_instance_type" {
  description = "Instance type for the OpenSearch domain"
  type        = string
  default     = "t3.small.search"
}

variable "opensearch_volume_size" {
  description = "EBS volume size for OpenSearch (in GB)"
  type        = number
  default     = 10
}

# SageMaker configuration
variable "sagemaker_instance_type" {
  description = "Instance type for the SageMaker notebook instance"
  type        = string
  default     = "ml.t3.medium"
}

# Amplify configuration
variable "amplify_repo_url" {
  description = "GitHub repository URL for Amplify frontend hosting"
  type        = string
  default     = "https://github.com/example/frontend"
}

# CloudFront configuration
variable "cloudfront_comment" {
  description = "Description for the CloudFront distribution"
  type        = string
}

variable "amplify_token" {
  description = "GitHub access token for Amplify"
  type        = string
  sensitive   = true
}