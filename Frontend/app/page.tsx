'use client';

import MatchLookup from '@/components/ChampionList';
import VideoAnalyzer from '@/components/VideoAnalyzer';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="space-y-12">
        <MatchLookup />
        <VideoAnalyzer />
      </div>
    </div>
  );
}
