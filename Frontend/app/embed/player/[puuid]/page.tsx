'use client';

import { Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import PlayerPerformanceWidget from '@/components/widgets/PlayerPerformanceWidget';

function PlayerEmbedContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const puuid = params?.puuid as string;
  const matchId = searchParams?.get('matchId') || undefined;

  return (
    <div className="min-h-screen bg-black p-4 flex items-center justify-center">
      <div className="w-full max-w-md">
        <PlayerPerformanceWidget puuid={puuid} matchId={matchId} showControls={false} />
      </div>
    </div>
  );
}

export default function PlayerEmbedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black p-4 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <PlayerEmbedContent />
    </Suspense>
  );
}

