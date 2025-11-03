'use client';

import { useEffect, useState } from 'react';

interface MatchDataWidgetProps {
  matchId: string;
  showControls?: boolean;
}

export default function MatchDataWidget({ matchId, showControls = true }: MatchDataWidgetProps) {
  const [matchData, setMatchData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMatchData = async () => {
      if (!matchId) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch match data - in production, use an API route
        const response = await fetch(`/api/match/${matchId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch match data');
        }

        const data = await response.json();
        setMatchData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load match data');
      } finally {
        setLoading(false);
      }
    };

    fetchMatchData();
  }, [matchId]);

  if (loading) {
    return (
      <div className="w-full bg-[#181818] rounded-lg border border-gray-800 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error || !matchData) {
    return (
      <div className="w-full bg-[#181818] rounded-lg border border-gray-800 p-6">
        <div className="text-gray-400 text-sm text-center py-4">{error || 'Failed to load match data'}</div>
      </div>
    );
  }

  const winningTeam = matchData.info.teams.find((team: any) => team.win);
  const losingTeam = matchData.info.teams.find((team: any) => !team.win);
  const winningParticipants = matchData.info.participants.filter((p: any) => p.teamId === winningTeam?.teamId);
  const losingParticipants = matchData.info.participants.filter((p: any) => p.teamId === losingTeam?.teamId);
  
  const duration = Math.floor(matchData.info.gameDuration / 60);
  const seconds = matchData.info.gameDuration % 60;

  return (
    <div className="w-full bg-[#181818] rounded-lg border border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-[#121212] border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-semibold text-sm">League of Legends Match</h3>
            <p className="text-gray-400 text-xs mt-1">{matchData.info.gameMode}</p>
          </div>
          {showControls && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.open(`/match/${matchId}/rewind`, '_blank')}
                className="w-8 h-8 bg-green-500 hover:bg-green-400 rounded-full flex items-center justify-center transition-colors"
                aria-label="View Match"
              >
                <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Match Info */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className={`px-3 py-1 rounded text-xs font-semibold ${
              winningTeam?.teamId === 100 ? 'bg-blue-600 text-white' : 'bg-red-600 text-white'
            }`}>
              Team {winningTeam?.teamId === 100 ? 'Blue' : 'Red'} Victory
            </div>
            <span className="text-gray-400 text-xs">{duration}:{seconds.toString().padStart(2, '0')}</span>
          </div>
        </div>

        {/* Teams */}
        <div className="space-y-3">
          {/* Winning Team */}
          <div className="bg-[#121212] rounded p-3 border border-green-800/30">
            <div className="text-xs text-green-400 font-semibold mb-2">Winning Team</div>
            <div className="space-y-1.5">
              {winningParticipants.slice(0, 5).map((p: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="text-gray-300">{p.riotIdGameName || p.summonerName}</span>
                  <div className="flex items-center gap-3 text-gray-400">
                    <span className="font-mono">{p.championName}</span>
                    <span>{p.kills}/{p.deaths}/{p.assists}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Losing Team */}
          <div className="bg-[#121212] rounded p-3 border border-red-800/30">
            <div className="text-xs text-red-400 font-semibold mb-2">Losing Team</div>
            <div className="space-y-1.5">
              {losingParticipants.slice(0, 5).map((p: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="text-gray-300">{p.riotIdGameName || p.summonerName}</span>
                  <div className="flex items-center gap-3 text-gray-400">
                    <span className="font-mono">{p.championName}</span>
                    <span>{p.kills}/{p.deaths}/{p.assists}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 bg-[#121212] border-t border-gray-800 flex items-center justify-between">
        <span className="text-gray-500 text-xs">Match ID: {matchId}</span>
        {showControls && (
          <a
            href={`/match/${matchId}/rewind`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white text-xs transition-colors"
          >
            View Details →
          </a>
        )}
      </div>
    </div>
  );
}

