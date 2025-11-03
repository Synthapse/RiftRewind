'use client';

import { useParams } from 'next/navigation';
import Player5MatchesWidget from '@/components/widgets/Player5MatchesWidget';

export default function Player5MatchesEmbedPage() {
  const params = useParams();
  const puuid = params?.puuid as string;

  return (
    <div className="min-h-screen bg-black p-4 flex items-center justify-center">
      <div className="w-full max-w-md">
        <Player5MatchesWidget puuid={puuid} showControls={false} />
      </div>
    </div>
  );
}

