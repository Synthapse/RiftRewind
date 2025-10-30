import { NextRequest, NextResponse } from 'next/server';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { AWS_CONFIG } from '@/lib/aws-config';

export async function GET(request: NextRequest) {
  try {
    const counts = await getS3ObjectCounts();
    
    return NextResponse.json(counts);
  } catch (error) {
    console.error('Error fetching S3 count:', error);
    // Return 0 instead of error to gracefully degrade
    return NextResponse.json({ 
      matchCount: 0,
      playerCount: 0,
      totalCount: 0
    });
  }
}

async function getS3ObjectCounts(): Promise<{ matchCount: number; playerCount: number; totalCount: number }> {
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
    const objects = response.Contents || [];
    
    // Count by type based on filename patterns
    let matchCount = 0;
    let playerCount = 0;
    
    objects.forEach((object) => {
      const key = object.Key || '';
      // Check if filename contains "match" or "player" patterns
      if (key.includes('match') || key.includes('Match')) {
        matchCount++;
      } else if (key.includes('player') || key.includes('Player')) {
        playerCount++;
      } else {
        // If unclear, count as match by default (most analysis files are matches)
        matchCount++;
      }
    });
    
    return {
      matchCount,
      playerCount,
      totalCount: objects.length
    };
  } catch (error) {
    console.error('Error counting S3 objects:', error);
    return {
      matchCount: 0,
      playerCount: 0,
      totalCount: 0
    };
  }
}

