'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { RIOT_API_CONFIG } from '@/lib/config';
import { useTheme } from '@/contexts/ThemeContext';

interface MatchSummary {
  matchId: string;
  gameCreation: number;
  gameDuration: number;
  gameMode: string;
  win: boolean;
  champion: string;
  kills: number;
  deaths: number;
  assists: number;
  puuid: string;
  summonerName: string;
}

export default function PlayerRewindPage() {
  const params = useParams();
  const router = useRouter();
  const puuid = params.puuid as string;
  const { theme, toggleTheme } = useTheme();
  
  const [playerName, setPlayerName] = useState<string>('');
  const [matches, setMatches] = useState<MatchSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const API_KEY = RIOT_API_CONFIG.API_KEY;

  useEffect(() => {
    const fetchMatches = async () => {
      if (!puuid) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Check cache
        const cacheKey = `player-matches-${puuid}`;
        const cachedData = localStorage.getItem(cacheKey);
        let matchesData: MatchSummary[] = [];
        
        if (cachedData) {
          const parsed = JSON.parse(cachedData);
          const cacheAge = Date.now() - parsed.timestamp;
          if (cacheAge < 5 * 60 * 1000) {
            matchesData = parsed.matches;
          }
        }
        
        if (matchesData.length === 0) {
          // Fetch match IDs
          const matchIdsUrl = `https://${RIOT_API_CONFIG.REGION}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=5&api_key=${API_KEY}`;
          const matchIdsResponse = await fetch(matchIdsUrl);
          
          if (!matchIdsResponse.ok) {
            throw new Error(`Failed to fetch match IDs: ${matchIdsResponse.status}`);
          }
          
          const matchIds: string[] = await matchIdsResponse.json();
          
          // Fetch all matches in parallel
          const matchPromises = matchIds.map(matchId => 
            fetch(`https://${RIOT_API_CONFIG.REGION}.api.riotgames.com/lol/match/v5/matches/${matchId}?api_key=${API_KEY}`)
              .then(res => res.json())
              .catch(err => {
                console.error(`Failed to fetch match ${matchId}:`, err);
                return null;
              })
          );
          
          const matches = await Promise.all(matchPromises);
          
          matchesData = matches
            .filter((match: any) => match !== null && match.metadata && match.info)
            .map((match: any) => {
              const player = match.info.participants.find((p: any) => p.puuid === puuid);
              return {
                matchId: match.metadata.matchId,
                gameCreation: match.info.gameCreation,
                gameDuration: match.info.gameDuration,
                gameMode: match.info.gameMode,
                win: player?.win || false,
                champion: player?.championName || 'Unknown',
                kills: player?.kills || 0,
                deaths: player?.deaths || 0,
                assists: player?.assists || 0,
                puuid: puuid,
                summonerName: player?.summonerName || 'Unknown'
              };
            });
        }
        
        if (matchesData.length > 0) {
          setPlayerName(matchesData[0].summonerName);
        }
        
        setMatches(matchesData);
      } catch (error) {
        console.error('Error fetching player matches:', error);
        setError('Failed to fetch player match history.');
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [puuid, API_KEY]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading player matches...</p>
        </div>
      </div>
    );
  }

  if (error || matches.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😢</div>
          <h1 className="text-3xl font-bold text-white mb-2">Failed to Load Matches</h1>
          <p className="text-white/80 mb-6">{error || 'No matches found'}</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-white text-purple-900 rounded-lg font-semibold hover:bg-white/90 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Calculate overall stats
  const totalMatches = matches.length;
  const wins = matches.filter(m => m.win).length;
  const winRate = ((wins / totalMatches) * 100).toFixed(0);
  const totalKills = matches.reduce((sum, m) => sum + m.kills, 0);
  const totalDeaths = matches.reduce((sum, m) => sum + m.deaths, 0);
  const totalAssists = matches.reduce((sum, m) => sum + m.assists, 0);
  const avgKDA = ((totalKills + totalAssists) / totalDeaths).toFixed(2);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Theme Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={toggleTheme}
          className={`p-3 rounded-full shadow-lg transition-all duration-200 ${
            theme === 'light' 
              ? 'bg-white hover:bg-gray-100 text-gray-600' 
              : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
          }`}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
        >
          {theme === 'light' ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          )}
        </button>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-12 text-center">
            <div className="flex items-center justify-center space-x-4 mb-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-5xl font-bold text-white mb-2">Player Rewind</h1>
            </div>
            <p className="text-2xl text-white/80 mb-2">{playerName}</p>
            <p className="text-lg text-white/60">Last 5 Matches Performance</p>
          </div>

          {/* Overall Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <div className="text-white/60 text-sm mb-2">Win Rate</div>
              <div className="text-4xl font-bold text-white">{winRate}%</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <div className="text-white/60 text-sm mb-2">Average KDA</div>
              <div className="text-4xl font-bold text-white">{avgKDA}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <div className="text-white/60 text-sm mb-2">Total Kills</div>
              <div className="text-4xl font-bold text-white">{totalKills}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <div className="text-white/60 text-sm mb-2">Total Assists</div>
              <div className="text-4xl font-bold text-white">{totalAssists}</div>
            </div>
          </div>

          {/* Matches Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matches.map((match, index) => (
              <div
                key={match.matchId}
                className={`relative bg-white/10 backdrop-blur-sm rounded-lg p-6 border-2 transition-all hover:scale-105 ${
                  match.win
                    ? 'border-green-500 hover:border-green-400'
                    : 'border-red-500 hover:border-red-400'
                }`}
              >
                <div className="absolute top-4 right-4">
                  <div className={`w-3 h-3 rounded-full ${match.win ? 'bg-green-500' : 'bg-red-500'}`}></div>
                </div>
                
                <div className="mb-4">
                  <div className="text-white/60 text-sm mb-1">Match {index + 1}</div>
                  <div className="text-2xl font-bold text-white mb-2">{match.champion}</div>
                  <div className="text-white/80 text-sm">{match.gameMode}</div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-white">
                    <span>KDA</span>
                    <span className="font-semibold">{match.kills}/{match.deaths}/{match.assists}</span>
                  </div>
                  <div className="flex justify-between text-white/80">
                    <span>Result</span>
                    <span className={match.win ? 'text-green-400' : 'text-red-400'}>
                      {match.win ? 'Victory' : 'Defeat'}
                    </span>
                  </div>
                  <div className="flex justify-between text-white/80">
                    <span>Duration</span>
                    <span>{Math.floor(match.gameDuration / 60)}:{(match.gameDuration % 60).toString().padStart(2, '0')}</span>
                  </div>
                </div>
                
                <button
                  onClick={() => router.push(`/match/${match.matchId}/rewind`)}
                  className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                >
                  ⏪ Rewind This Match
                </button>
              </div>
            ))}
          </div>

          {/* Back Button */}
          <div className="mt-12 text-center">
            <button
              onClick={() => router.back()}
              className="px-8 py-3 bg-white/20 hover:bg-white/30 text-white rounded-lg font-semibold transition-colors"
            >
              Back to Player Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

