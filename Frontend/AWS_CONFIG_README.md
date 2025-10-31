# AWS Configuration Setup

This application uses AWS credentials for S3 access. The credentials are loaded from environment variables for security.

## Local Development

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and add your AWS credentials:
   ```env
   AWS_ACCESS_KEY_ID=your_aws_access_key_id
   AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
   AWS_REGION=us-east-1
   AWS_S3_BUCKET=league-ai-analytics-raw-data
   AWS_S3_PREFIX=lambda-results/
   ```

## Vercel Deployment

To configure AWS credentials in Vercel:

### Method 1: Using Vercel Dashboard (Recommended)

1. Go to your project in the [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to **Settings** → **Environment Variables**
3. Add each of the following environment variables:

   | Variable Name | Value |
   |--------------|-------|
   | `AWS_ACCESS_KEY_ID` | Your AWS access key ID |
   | `AWS_SECRET_ACCESS_KEY` | Your AWS secret access key |
   | `AWS_REGION` | `us-east-1` (or your preferred region) |
   | `AWS_S3_BUCKET` | `league-ai-analytics-raw-data` |
   | `AWS_S3_PREFIX` | `lambda-results/` |

4. Select the environments where these variables should be available:
   - ☑ Production
   - ☑ Preview
   - ☑ Development

5. Click **Save** on each variable

### Method 2: Using Vercel CLI

If you prefer using the command line:

```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Login to Vercel
vercel login

# Add environment variables
vercel env add AWS_ACCESS_KEY_ID production
vercel env add AWS_SECRET_ACCESS_KEY production
vercel env add AWS_REGION production
vercel env add AWS_S3_BUCKET production
vercel env add AWS_S3_PREFIX production

# Add for preview and development environments as well
vercel env add AWS_ACCESS_KEY_ID preview
vercel env add AWS_SECRET_ACCESS_KEY preview
# ... repeat for other variables and environments
```

### After Adding Environment Variables

After adding the environment variables in Vercel:

1. **Redeploy your application** to apply the changes:
   - Go to your project's **Deployments** tab
   - Click **⋮** (three dots) on the latest deployment
   - Click **Redeploy**

   OR trigger a new deployment by pushing to your repository.

2. **Verify the configuration** by checking that S3 file operations work correctly.

## Security Notes

- ✅ **Never commit** `.env.local` or any `.env` files to version control
- ✅ The `.gitignore` file is already configured to exclude these files
- ✅ AWS credentials are only loaded server-side in API routes
- ✅ Environment variables in Vercel are encrypted at rest
- ⚠️ **Important**: For production, consider using AWS IAM roles instead of access keys if deploying to AWS infrastructure

## Environment Variables

| Variable | Description | Example Value |
|----------|-------------|---------------|
| `AWS_ACCESS_KEY_ID` | AWS access key ID | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY` | AWS secret access key | `...` |
| `AWS_REGION` | AWS region | `us-east-1` |
| `AWS_S3_BUCKET` | S3 bucket name | `league-ai-analytics-raw-data` |
| `AWS_S3_PREFIX` | S3 key prefix | `lambda-results/` |

## Troubleshooting

### Environment variables not working in Vercel

- Ensure you've redeployed after adding the variables
- Check that the variable names match exactly (case-sensitive)
- Verify the variables are set for the correct environment (Production/Preview/Development)
- Check the deployment logs for any errors

### Local development not working

- Ensure you have a `.env.local` file in the `Frontend` directory
- Restart your Next.js development server after creating/editing `.env.local`
- Verify the file is not committed to git: `git check-ignore Frontend/.env.local`

## Need Help?

For more information:
- [Vercel Environment Variables Documentation](https://vercel.com/docs/projects/environment-variables)
- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)

