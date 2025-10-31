// AWS Configuration
// This file loads AWS credentials from environment variables

export const AWS_CONFIG = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'AKIA6GY5OHKX7T6XNPS4',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  region: process.env.AWS_REGION || 'us-east-1',
  bucket: process.env.AWS_S3_BUCKET || 'league-ai-analytics-raw-data',
  prefix: process.env.AWS_S3_PREFIX || 'lambda-results/',
} as const;

