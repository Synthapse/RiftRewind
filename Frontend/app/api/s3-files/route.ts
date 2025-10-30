import { NextRequest, NextResponse } from 'next/server';
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import { AWS_CONFIG } from '@/lib/aws-config';

interface S3File {
  key: string;
  name: string;
  lastModified: string;
  size: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileKey = searchParams.get('key');

    // If a specific file key is provided, fetch its content
    if (fileKey) {
      return await getFileContent(fileKey);
    }

    // Otherwise, list all files
    const files = await listS3Files();
    
    return NextResponse.json({ 
      files,
      count: files.length
    });
  } catch (error) {
    console.error('Error fetching S3 files:', error);
    return NextResponse.json({ 
      files: [],
      count: 0,
      error: 'Failed to fetch files'
    }, { status: 500 });
  }
}

async function listS3Files(): Promise<S3File[]> {
  try {
    const s3Client = new S3Client({
      region: AWS_CONFIG.region,
      credentials: {
        accessKeyId: AWS_CONFIG.accessKeyId,
        secretAccessKey: AWS_CONFIG.secretAccessKey,
      },
    });
    
    const command = new ListObjectsV2Command({
      Bucket: AWS_CONFIG.bucket,
      Prefix: AWS_CONFIG.prefix,
    });
    
    const response = await s3Client.send(command);
    
    if (!response.Contents) {
      return [];
    }

    return response.Contents.map((object) => ({
      key: object.Key || '',
      name: object.Key?.replace(AWS_CONFIG.prefix, '') || '',
      lastModified: object.LastModified?.toISOString() || '',
      size: object.Size || 0,
    }));
  } catch (error) {
    console.error('Error listing S3 files:', error);
    return [];
  }
}

async function getFileContent(fileKey: string) {
  try {
    const s3Client = new S3Client({
      region: AWS_CONFIG.region,
      credentials: {
        accessKeyId: AWS_CONFIG.accessKeyId,
        secretAccessKey: AWS_CONFIG.secretAccessKey,
      },
    });
    
    const command = new GetObjectCommand({
      Bucket: AWS_CONFIG.bucket,
      Key: fileKey,
    });
    
    const response = await s3Client.send(command);
    const body = await response.Body?.transformToString();
    
    // Try to parse as JSON and extract the response field
    let parsedContent = null;
    let hasResponseField = false;
    let responseText = null;
    
    try {
      parsedContent = JSON.parse(body || '{}');
      
      // Check for response field (could be in nested structure)
      if (typeof parsedContent === 'object') {
        if (parsedContent.response !== undefined) {
          hasResponseField = true;
          responseText = parsedContent.response;
        } else if (parsedContent.body !== undefined) {
          hasResponseField = true;
          responseText = parsedContent.body;
        }
      }
    } catch (e) {
      parsedContent = body;
    }
    
    return NextResponse.json({
      key: fileKey,
      content: parsedContent,
      rawContent: body,
      contentType: response.ContentType,
      hasResponse: hasResponseField,
      responseText: responseText,
    });
  } catch (error) {
    console.error('Error fetching file content:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch file content'
    }, { status: 500 });
  }
}

