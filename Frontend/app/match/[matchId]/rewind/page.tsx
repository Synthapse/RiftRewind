'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import MatchRewind from '@/components/MatchRewind';
import { RIOT_API_CONFIG } from '@/lib/config';

interface Participant {
  summonerName: string;
  championName: string;
  teamId: number;
  kills: number;
  deaths: number;
  assists: number;
  totalDamageDealtToChampions: number;
  goldEarned: number;
  visionScore: number;
  win: boolean;
  [key: string]: any;
}

interface TimelineData {
  metadata: {
    dataVersion: string;
    matchId: string;
    participants: string[];
  };
  info: {
    endOfGameResult: string;
    frameInterval: number;
    frames: Array<{
      events: any[];
      participantFrames: Record<string, any>;
      timestamp: number;
    }>;
  };
}

export default function RewindPage() {
  const params = useParams();
  const matchId = params?.matchId as string;
  
  const [matchData, setMatchData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_KEY = RIOT_API_CONFIG.API_KEY;

  useEffect(() => {
    const fetchMatchData = async () => {
      if (!matchId) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch match data
        const matchUrl = `https://${RIOT_API_CONFIG.REGION}.api.riotgames.com/lol/match/v5/matches/${matchId}?api_key=${API_KEY}`;
        const matchResponse = await fetch(matchUrl);

        if (!matchResponse.ok) {
          throw new Error(`Failed to fetch match: ${matchResponse.status}`);
        }

        const matchData = await matchResponse.json();

        // Fetch timeline data
        const timelineUrl = `https://${RIOT_API_CONFIG.REGION}.api.riotgames.com/lol/match/v5/matches/${matchId}/timeline?api_key=${API_KEY}`;
        const timelineResponse = await fetch(timelineUrl);

        if (!timelineResponse.ok) {
          throw new Error(`Failed to fetch timeline: ${timelineResponse.status}`);
        }

        const timelineData = await timelineResponse.json();

        // Determine winning team
        const winningTeam = matchData.info.teams.find((team: any) => team.win)?.teamId || 100;

        setMatchData({
          match: matchData,
          timeline: timelineData,
          winningTeam
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchMatchData();
  }, [matchId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#181818]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300 text-lg">Loading match data...</p>
        </div>
      </div>
    );
  }

  if (error || !matchData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#181818]">
        <div className="text-center">
          <div className="text-6xl mb-4">😢</div>
          <h1 className="text-3xl font-bold text-white mb-2">Failed to Load Match</h1>
          <p className="text-gray-400 mb-6">{error || 'Unknown error'}</p>
          <a
            href="/"
            className="px-6 py-3 bg-[#121212] text-white rounded-lg font-semibold hover:bg-[#1a1a1a] transition-colors border border-gray-800"
          >
            Go Back Home
          </a>
        </div>
      </div>
    );
  }

  // Transform participants to match the expected format
  const participants: Participant[] = matchData.match.info.participants.map((p: any) => ({
    summonerName: p.riotIdGameName || p.summonerName || 'Unknown',
    championName: p.championName || 'Unknown',
    teamId: p.teamId || 0,
    kills: p.kills || 0,
    deaths: p.deaths || 0,
    assists: p.assists || 0,
    totalDamageDealtToChampions: p.totalDamageDealtToChampions || 0,
    goldEarned: p.goldEarned || 0,
    visionScore: p.visionScore || 0,
    win: p.win || false
  }));

  return (
    <MatchRewind
      timeline={matchData.timeline}
      participants={participants}
      matchId={matchId}
      gameDuration={matchData.match.info.gameDuration}
      winningTeam={matchData.winningTeam}
      matchData={matchData.match}
    />
  );
}

