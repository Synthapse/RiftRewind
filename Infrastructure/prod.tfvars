###########################################################
# PROJECT CONFIGURATION
###########################################################

# The project prefix for naming AWS resources
project_name = "league-ai-analytics"

# AWS region for all resources
region = "us-east-1"

###########################################################
# LAMBDA CONFIGURATION
###########################################################

# Lambda runtime environment
lambda_runtime = "python3.11"

# Lambda function handlers
lambda_ingest_handler  = "index.handler"
lambda_process_handler = "index.handler"

# Paths to the zipped Lambda packages
lambda_ingest_zip  = "lambda_ingest.zip"
lambda_process_zip = "lambda_process.zip"

###########################################################
# S3 CONFIGURATION
###########################################################

# Allow Terraform to delete the bucket and all contents on destroy
s3_bucket_force_destroy = true

###########################################################
# OPENSEARCH CONFIGURATION
###########################################################

# OpenSearch instance type and volume size
opensearch_instance_type = "t3.small.search"
opensearch_volume_size   = 10

###########################################################
# SAGEMAKER CONFIGURATION
###########################################################

# Notebook instance type for model training and exploration
sagemaker_instance_type = "ml.t3.medium"
amplify_token = "ghp_YourGitHubTokenHere"
#######################
