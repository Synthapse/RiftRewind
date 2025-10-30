// AWS Configuration Example
// Copy this file to aws-config.ts and add your credentials

export const AWS_CONFIG = {
  accessKeyId: 'YOUR_AWS_ACCESS_KEY_ID',
  secretAccessKey: 'YOUR_AWS_SECRET_ACCESS_KEY',
  region: 'us-east-1',
  bucket: 'league-ai-analytics-raw-data',
  prefix: 'lambda-results/',
} as const;

