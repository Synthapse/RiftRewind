'use client';

import { useParams } from 'next/navigation';
import MatchDataWidget from '@/components/widgets/MatchDataWidget';

export default function MatchEmbedPage() {
  const params = useParams();
  const matchId = params?.matchId as string;

  return (
    <div className="min-h-screen bg-black p-4 flex items-center justify-center">
      <div className="w-full max-w-md">
        <MatchDataWidget matchId={matchId} showControls={false} />
      </div>
    </div>
  );
}

