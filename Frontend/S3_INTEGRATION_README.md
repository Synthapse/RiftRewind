# S3 Integration Setup

This document explains how to set up the S3 bucket integration to display the count of match & player analysis files.

## Current Status

The S3 count feature is currently showing a placeholder count (0). To enable actual S3 integration, follow these steps:

## Setup Instructions

### 1. Install AWS SDK

Add the AWS SDK to your Next.js project:

```bash
npm install @aws-sdk/client-s3
```

### 2. Configure AWS Credentials

Add your AWS credentials to your environment variables. Create or update `.env.local`:

```env
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_REGION=us-east-1
```

**Important:** Never commit these credentials to version control. Add `.env.local` to your `.gitignore`.

### 3. Update the API Route

Uncomment the AWS SDK code in `Frontend/app/api/s3-count/route.ts`:

```typescript
const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const command = new ListObjectsV2Command({
  Bucket: 'league-ai-analytics-raw-data',
  Prefix: 'lambda-results/',
});

const response = await s3Client.send(command);
return response.Contents?.length || 0;
```

### 4. IAM Permissions

Ensure your AWS credentials have the following permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket",
        "s3:GetObject"
      ],
      "Resource": [
        "arn:aws:s3:::league-ai-analytics-raw-data",
        "arn:aws:s3:::league-ai-analytics-raw-data/lambda-results/*"
      ]
    }
  ]
}
```

### 5. Alternative: Use AWS API Gateway

For better security and scalability, consider setting up an AWS Lambda function behind API Gateway:

1. Create a Lambda function that lists S3 objects
2. Expose it via API Gateway
3. Update the API route to call the API Gateway endpoint instead

### 6. Test the Integration

1. Restart your Next.js development server
2. Visit the landing page
3. Check the count display under the search input
4. Verify the count matches the number of files in `s3://league-ai-analytics-raw-data/lambda-results/`

## Current Implementation

The landing page (`Frontend/app/page.tsx`) displays the count as:
- `X match & player analysis` (if count > 0)
- `No analysis yet` (if count = 0)

The count is fetched from `/api/s3-count` on page load.

## Troubleshooting

- If the count shows 0, check AWS credentials are correctly configured
- Verify the bucket name matches: `league-ai-analytics-raw-data`
- Check the prefix matches: `lambda-results/`
- Review browser console and server logs for errors

