'use client';

import { useEffect, useState } from 'react';

interface Player5MatchesWidgetProps {
  puuid: string;
  showControls?: boolean;
}

export default function Player5MatchesWidget({ puuid, showControls = true }: Player5MatchesWidgetProps) {
  const [matches, setMatches] = useState<any[]>([]);
  const [playerName, setPlayerName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMatches = async () => {
      if (!puuid) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch match history
        const matchHistoryResponse = await fetch(`/api/match-history?puuid=${puuid}&count=5`);
        if (!matchHistoryResponse.ok) throw new Error('Failed to fetch match history');
        const matchIds = await matchHistoryResponse.json();
        
        if (matchIds.length === 0) throw new Error('No matches found');

        // Fetch all matches in parallel
        const matchPromises = matchIds.map(async (matchId: string) => {
          const response = await fetch(`/api/match/${matchId}`);
          if (!response.ok) return null;
          const matchData = await response.json();
          const participant = matchData.info.participants.find((p: any) => p.puuid === puuid);
          if (!participant) return null;
          
          return {
            matchId,
            gameDuration: matchData.info.gameDuration,
            gameMode: matchData.info.gameMode,
            win: participant.win,
            champion: participant.championName,
            kills: participant.kills,
            deaths: participant.deaths,
            assists: participant.assists,
            summonerName: participant.riotIdGameName || participant.summonerName
          };
        });

        const matchesData = await Promise.all(matchPromises);
        const validMatches = matchesData.filter(m => m !== null);
        
        if (validMatches.length > 0) {
          setPlayerName(validMatches[0].summonerName);
        }
        
        setMatches(validMatches);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load matches');
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [puuid]);

  if (loading) {
    return (
      <div className="w-full bg-[#181818] rounded-lg border border-gray-800 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error || matches.length === 0) {
    return (
      <div className="w-full bg-[#181818] rounded-lg border border-gray-800 p-6">
        <div className="text-gray-400 text-sm text-center py-4">{error || 'No matches found'}</div>
      </div>
    );
  }

  const wins = matches.filter(m => m.win).length;
  const winRate = ((wins / matches.length) * 100).toFixed(0);

  return (
    <div className="w-full bg-[#181818] rounded-lg border border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-[#121212] border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-semibold text-sm">{playerName}</h3>
            <p className="text-gray-400 text-xs mt-1">Last 5 Matches</p>
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

      {/* Summary Stats */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <div className="bg-[#121212] rounded p-2 border border-gray-800">
            <div className="text-gray-400 text-xs mb-1">Win Rate</div>
            <div className="text-white font-semibold text-lg">{winRate}%</div>
          </div>
          <div className="bg-[#121212] rounded p-2 border border-gray-800">
            <div className="text-gray-400 text-xs mb-1">Wins</div>
            <div className="text-green-400 font-semibold text-lg">{wins}</div>
          </div>
          <div className="bg-[#121212] rounded p-2 border border-gray-800">
            <div className="text-gray-400 text-xs mb-1">Losses</div>
            <div className="text-red-400 font-semibold text-lg">{matches.length - wins}</div>
          </div>
        </div>
      </div>

      {/* Matches List */}
      <div className="p-4 space-y-2 max-h-[400px] overflow-y-auto">
        {matches.map((match, idx) => {
          const duration = Math.floor(match.gameDuration / 60);
          const seconds = match.gameDuration % 60;
          const kda = ((match.kills + match.assists) / Math.max(match.deaths, 1)).toFixed(2);

          return (
            <div
              key={idx}
              className={`bg-[#121212] rounded p-3 border ${
                match.win ? 'border-green-800/30' : 'border-red-800/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className={`w-2 h-2 rounded-full ${
                    match.win ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-semibold text-xs">{match.champion}</span>
                      <span className="text-gray-400 text-xs">•</span>
                      <span className="text-gray-400 text-xs">{match.gameMode}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-gray-300">{match.kills}/{match.deaths}/{match.assists}</span>
                      <span className="text-gray-500">•</span>
                      <span className="text-gray-400">KDA: {kda}</span>
                    </div>
                  </div>
                </div>
                <div className="text-gray-400 text-xs ml-4">
                  {duration}:{seconds.toString().padStart(2, '0')}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-4 bg-[#121212] border-t border-gray-800 flex items-center justify-between">
        <span className="text-gray-500 text-xs">{matches.length} matches shown</span>
        {showControls && (
          <a
            href={`/player/${puuid}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white text-xs transition-colors"
          >
            View All Matches →
          </a>
        )}
      </div>
    </div>
  );
}

