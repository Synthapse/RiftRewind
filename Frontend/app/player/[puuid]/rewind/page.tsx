'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Player5MatchesWidget from '@/components/widgets/Player5MatchesWidget';
import { RIOT_API_CONFIG, LAMBDA_CONFIG } from '@/lib/config';
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
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  
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
                summonerName: player?.riotIdGameName || player?.summonerName || 'Unknown'
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

  const startRewind = async () => {
    if (matches.length === 0) return;
    
    // Navigate to full rewind experience page
    router.push(`/player/${puuid}/rewind/experience`);
  };

  const fetchAIAnalysis = async () => {
    if (matches.length === 0) return;
    
    try {
      setAnalyzing(true);
      setError(null);
      
      // Fetch detailed match data for aggregation
      const detailedMatches = [];
      for (const match of matches) {
        const matchUrl = `https://${RIOT_API_CONFIG.REGION}.api.riotgames.com/lol/match/v5/matches/${match.matchId}?api_key=${API_KEY}`;
        const matchResponse = await fetch(matchUrl);
        
        if (matchResponse.ok) {
          const matchData = await matchResponse.json();
          detailedMatches.push(matchData);
        }
      }
      
      // Prepare aggregated statistics
      const totalKills = matches.reduce((sum, m) => sum + m.kills, 0);
      const totalDeaths = matches.reduce((sum, m) => sum + m.deaths, 0);
      const totalAssists = matches.reduce((sum, m) => sum + m.assists, 0);
      const avgKDA = totalDeaths > 0 ? ((totalKills + totalAssists) / totalDeaths).toFixed(2) : '0.00';
      const wins = matches.filter(m => m.win).length;
      const winRate = ((wins / matches.length) * 100).toFixed(0);
      
      // Get champion diversity and performance
      const championStats = matches.reduce((acc, match) => {
        if (!acc[match.champion]) {
          acc[match.champion] = { played: 0, wins: 0, avgKDA: 0 };
        }
        acc[match.champion].played++;
        if (match.win) acc[match.champion].wins++;
        acc[match.champion].avgKDA += (match.kills + match.assists) / (match.deaths || 1);
        return acc;
      }, {} as Record<string, { played: number; wins: number; avgKDA: number }>);
      
      const championPerformance = Object.entries(championStats).map(([champ, stats]) => ({
        champion: champ,
        played: stats.played,
        winRate: ((stats.wins / stats.played) * 100).toFixed(0),
        avgKDA: (stats.avgKDA / stats.played).toFixed(2)
      }));
      
      // Create comprehensive prompt for aggregated insights
      const prompt = `You are a **League of Legends Player Performance Analyzer**. Analyze this player's aggregated performance across their last 5 matches and provide the MOST INTERESTING INSIGHTS.

Focus on:
- Unusual patterns or trends
- Unique strengths or surprising weaknesses
- Champion-specific mastery or struggles
- Win condition analysis across games
- Aggressive/defensive playstyle indicators
- Early game vs late game performance

Use markdown headers (#, ##, ###) and bullet points (-) for clarity. Keep insights CONCISE and ACTIONABLE.

## Player Information:
- **Summoner Name:** ${playerName}
- **PUUID:** ${puuid}
- **Matches Analyzed:** ${matches.length}

## Overall Performance:
- **Win Rate:** ${winRate}% (${wins}/${matches.length})
- **Average KDA:** ${avgKDA}
- **Total Kills:** ${totalKills}
- **Total Deaths:** ${totalDeaths}
- **Total Assists:** ${totalAssists}

## Champion Performance:
${championPerformance.map(champ => `- **${champ.champion}**: Played ${champ.played} time(s), ${champ.winRate}% win rate, ${champ.avgKDA} avg KDA`).join('\n')}

## Match Summary:
${matches.map((match, index) => `
### Match ${index + 1} - ${match.matchId}
- **Date:** ${new Date(match.gameCreation).toLocaleDateString()}
- **Duration:** ${Math.floor(match.gameDuration / 60)}:${(match.gameDuration % 60).toString().padStart(2, '0')}
- **Champion:** ${match.champion}
- **Result:** ${match.win ? 'Victory' : 'Defeat'}
- **KDA:** ${match.kills}/${match.deaths}/${match.assists}
- **Game Mode:** ${match.gameMode}
`).join('\n')}

## Detailed Match Data:
${detailedMatches.slice(0, 3).map((match, idx) => {
  const player = match.info.participants.find((p: any) => p.puuid === puuid);
  return `Match ${idx + 1} - ${player ? `${player.totalDamageDealtToChampions} damage, ${player.visionScore} vision, ${player.goldEarned} gold, ${player.totalMinionsKilled} CS` : 'N/A'}`;
}).join('\n')}

Please provide the MOST INTERESTING insights from this aggregated data that would surprise or help the player understand their performance better.`;

      // Send to Lambda for LLM analysis
      const lambdaData = { prompt: prompt };

      const APIUrl = LAMBDA_CONFIG.AI_ANALYSIS_URL;
      const response = await fetch(APIUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lambdaData),
      });
      
      if (!response.ok) {
        throw new Error(`Lambda error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Player rewind analysis Lambda response:', result);

      // Handle different response formats
      let analysisText = null;
      
      if (result.success && result.response) {
        analysisText = result.response;
      } else if (result.body) {
        analysisText = result.body;
      } else if (typeof result === 'string') {
        analysisText = result;
      }
      
      if (analysisText) {
        setAiAnalysis(analysisText);
      } else {
        throw new Error('No analysis text found in response');
      }
    } catch (error) {
      console.error('AI Analysis error:', error);
      setError('Failed to get AI insights. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#181818] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300 text-lg">Loading player matches...</p>
        </div>
      </div>
    );
  }

  if (error || matches.length === 0) {
    return (
      <div className="min-h-screen bg-[#181818] flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😢</div>
          <h1 className="text-3xl font-bold text-white mb-2">Failed to Load Matches</h1>
          <p className="text-gray-400 mb-6">{error || 'No matches found'}</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-[#121212] text-white rounded-lg font-semibold hover:bg-[#1a1a1a] transition-colors border border-gray-800"
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
    <div className="min-h-screen bg-[#181818]">
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
            
            {/* AI Analysis Button */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={startRewind}
                disabled={matches.length === 0}
                className="px-6 py-3 bg-[#121212] hover:bg-[#1a1a1a] disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all flex items-center space-x-2 shadow-lg hover:shadow-xl border border-gray-800"
              >
                <span>⏪</span>
                <span>Start Rewind Experience</span>
              </button>
              <button
                onClick={fetchAIAnalysis}
                disabled={analyzing || matches.length === 0}
                className="px-6 py-3 bg-[#121212] hover:bg-[#1a1a1a] disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all flex items-center space-x-2 shadow-lg hover:shadow-xl border border-gray-800"
              >
                {analyzing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <span>🤖</span>
                    <span>Get AI Insights</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Player 5 Matches Widget */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-4 text-center">Player 5 Matches Widget</h2>
            <div className="max-w-md mx-auto">
              <Player5MatchesWidget puuid={puuid} />
            </div>
          </div>

          {/* Overall Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            <div className="bg-[#121212] rounded-lg p-6 border border-gray-800">
              <div className="text-gray-400 text-sm mb-2">Win Rate</div>
              <div className="text-4xl font-bold text-white">{winRate}%</div>
            </div>
            <div className="bg-[#121212] rounded-lg p-6 border border-gray-800">
              <div className="text-gray-400 text-sm mb-2">Average KDA</div>
              <div className="text-4xl font-bold text-white">{avgKDA}</div>
            </div>
            <div className="bg-[#121212] rounded-lg p-6 border border-gray-800">
              <div className="text-gray-400 text-sm mb-2">Total Kills</div>
              <div className="text-4xl font-bold text-white">{totalKills}</div>
            </div>
            <div className="bg-[#121212] rounded-lg p-6 border border-gray-800">
              <div className="text-gray-400 text-sm mb-2">Total Assists</div>
              <div className="text-4xl font-bold text-white">{totalAssists}</div>
            </div>
          </div>

          {/* Matches Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matches.map((match, index) => (
              <div
                key={match.matchId}
                className={`relative bg-[#121212] rounded-lg p-6 border transition-all hover:scale-105 ${
                  match.win
                    ? 'border-green-600 hover:border-green-500'
                    : 'border-red-600 hover:border-red-500'
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
                  className="w-full px-4 py-2 bg-[#1a1a1a] hover:bg-[#222222] text-white rounded-lg font-medium transition-colors border border-gray-800"
                >
                  ⏪ Rewind This Match
                </button>
              </div>
            ))}
          </div>

          {/* AI Analysis Results */}
          {aiAnalysis && (
            <div className="mt-12">
              <div className="bg-[#121212] rounded-lg p-8 border border-gray-800">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="text-4xl">🤖</div>
                  <h2 className="text-3xl font-bold text-white">
                    AI Performance Insights
                  </h2>
                </div>
                
                <div className="prose max-w-none">
                  <div className="text-white/90 leading-relaxed">
                    {aiAnalysis.split('\n').map((line, index) => {
                      // Handle main headers
                      if (line.startsWith('# ')) {
                        return (
                          <h1 key={index} className="text-4xl font-bold text-white mb-6 mt-8 border-b-2 border-white/20 pb-2">
                            {line.substring(2)}
                          </h1>
                        );
                      }
                      // Handle section headers
                      if (line.startsWith('## ')) {
                        return (
                          <h2 key={index} className="text-3xl font-bold text-white mb-4 mt-6 border-b border-white/20 pb-2">
                            {line.substring(3)}
                          </h2>
                        );
                      }
                      // Handle subsection headers
                      if (line.startsWith('### ')) {
                        return (
                          <h3 key={index} className="text-2xl font-semibold text-white mb-3 mt-4">
                            {line.substring(4)}
                          </h3>
                        );
                      }
                      // Handle bold text
                      if (line.includes('**')) {
                        const parts = line.split('**');
                        return (
                          <p key={index} className="mb-3">
                            {parts.map((part, i) => {
                              if (i % 2 === 1) {
                                return <strong key={i} className="font-bold text-white text-lg">{part}</strong>;
                              }
                              return <span key={i}>{part}</span>;
                            })}
                          </p>
                        );
                      }
                      // Handle bullet points
                      if (line.startsWith('- ')) {
                        return (
                          <li key={index} className="ml-6 mb-2 list-disc text-white/90">
                            {line.substring(2)}
                          </li>
                        );
                      }
                      // Handle numbered lists
                      if (/^\d+\.\s/.test(line)) {
                        return (
                          <li key={index} className="ml-6 mb-2 list-decimal text-white/90">
                            {line.replace(/^\d+\.\s/, '')}
                          </li>
                        );
                      }
                      // Handle empty lines
                      if (line.trim() === '') {
                        return <br key={index} />;
                      }
                      // Handle regular paragraphs
                      return (
                        <p key={index} className="mb-4 text-white/90">
                          {line}
                        </p>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Back Button */}
          <div className="mt-12 text-center">
            <button
              onClick={() => router.back()}
              className="px-8 py-3 bg-[#121212] hover:bg-[#1a1a1a] text-white rounded-lg font-semibold transition-colors border border-gray-800"
            >
              Back to Player Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
