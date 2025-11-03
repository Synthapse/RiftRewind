'use client';

import { useEffect, useState } from 'react';

interface PlayerPerformanceWidgetProps {
  puuid: string;
  matchId?: string;
  showControls?: boolean;
}

export default function PlayerPerformanceWidget({ puuid, matchId, showControls = true }: PlayerPerformanceWidgetProps) {
  const [playerData, setPlayerData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlayerData = async () => {
      if (!puuid) return;

      try {
        setLoading(true);
        setError(null);

        let data;
        if (matchId) {
          // Fetch specific match data for this player
          const response = await fetch(`/api/match/${matchId}`);
          if (!response.ok) throw new Error('Failed to fetch match data');
          const matchData = await response.json();
          const participant = matchData.info.participants.find((p: any) => p.puuid === puuid);
          if (!participant) throw new Error('Player not found in match');
          
          data = {
            summonerName: participant.riotIdGameName || participant.summonerName,
            matchData: participant,
            matchInfo: {
              matchId,
              gameDuration: matchData.info.gameDuration,
              gameMode: matchData.info.gameMode,
              win: participant.win
            }
          };
        } else {
          // Fetch player's latest match
          const matchHistoryResponse = await fetch(`/api/match-history?puuid=${puuid}&count=1`);
          if (!matchHistoryResponse.ok) throw new Error('Failed to fetch match history');
          const matchHistory = await matchHistoryResponse.json();
          
          if (matchHistory.length === 0) throw new Error('No matches found');
          
          const latestMatchId = matchHistory[0];
          const matchResponse = await fetch(`/api/match/${latestMatchId}`);
          if (!matchResponse.ok) throw new Error('Failed to fetch match data');
          const matchData = await matchResponse.json();
          const participant = matchData.info.participants.find((p: any) => p.puuid === puuid);
          
          data = {
            summonerName: participant.riotIdGameName || participant.summonerName,
            matchData: participant,
            matchInfo: {
              matchId: latestMatchId,
              gameDuration: matchData.info.gameDuration,
              gameMode: matchData.info.gameMode,
              win: participant.win
            }
          };
        }

        setPlayerData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load player data');
      } finally {
        setLoading(false);
      }
    };

    fetchPlayerData();
  }, [puuid, matchId]);

  if (loading) {
    return (
      <div className="w-full bg-[#181818] rounded-lg border border-gray-800 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error || !playerData) {
    return (
      <div className="w-full bg-[#181818] rounded-lg border border-gray-800 p-6">
        <div className="text-gray-400 text-sm text-center py-4">{error || 'Failed to load player data'}</div>
      </div>
    );
  }

  const p = playerData.matchData;
  const kda = ((p.kills + p.assists) / Math.max(p.deaths, 1)).toFixed(2);
  const duration = Math.floor(playerData.matchInfo.gameDuration / 60);
  const seconds = playerData.matchInfo.gameDuration % 60;

  return (
    <div className="w-full bg-[#181818] rounded-lg border border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-[#121212] border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-semibold text-sm">{playerData.summonerName}</h3>
            <p className="text-gray-400 text-xs mt-1">Player Performance</p>
          </div>
          {showControls && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.open(`/player/${puuid}/rewind`, '_blank')}
                className="w-8 h-8 bg-green-500 hover:bg-green-400 rounded-full flex items-center justify-center transition-colors"
                aria-label="View Player Rewind"
              >
                <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Performance Info */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className={`px-3 py-1 rounded text-xs font-semibold ${
            playerData.matchInfo.win ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
          }`}>
            {playerData.matchInfo.win ? 'Victory' : 'Defeat'}
          </div>
          <span className="text-gray-400 text-xs">{duration}:{seconds.toString().padStart(2, '0')}</span>
        </div>

        {/* Champion and KDA */}
        <div className="bg-[#121212] rounded p-3 mb-3 border border-gray-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-xs">Champion</span>
            <span className="text-white font-semibold text-sm">{p.championName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-xs">KDA</span>
            <span className="text-white font-semibold">{p.kills}/{p.deaths}/{p.assists}</span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-gray-400 text-xs">KDA Ratio</span>
            <span className="text-white font-semibold">{kda}</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-[#121212] rounded p-2 border border-gray-800">
            <div className="text-gray-400 text-xs mb-1">CS</div>
            <div className="text-white font-semibold text-sm">{p.totalMinionsKilled}</div>
          </div>
          <div className="bg-[#121212] rounded p-2 border border-gray-800">
            <div className="text-gray-400 text-xs mb-1">Gold</div>
            <div className="text-white font-semibold text-sm">{Math.floor(p.goldEarned / 1000)}k</div>
          </div>
          <div className="bg-[#121212] rounded p-2 border border-gray-800">
            <div className="text-gray-400 text-xs mb-1">Damage</div>
            <div className="text-white font-semibold text-sm">{Math.floor(p.totalDamageDealtToChampions / 1000)}k</div>
          </div>
          <div className="bg-[#121212] rounded p-2 border border-gray-800">
            <div className="text-gray-400 text-xs mb-1">Vision</div>
            <div className="text-white font-semibold text-sm">{p.visionScore}</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 bg-[#121212] border-t border-gray-800 flex items-center justify-between">
        <span className="text-gray-500 text-xs">{playerData.matchInfo.gameMode}</span>
        {showControls && (
          <a
            href={`/player/${puuid}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white text-xs transition-colors"
          >
            View Profile →
          </a>
        )}
      </div>
    </div>
  );
}

