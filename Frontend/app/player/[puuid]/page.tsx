'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Champion, ChampionData } from '@/types/champion';
import { RIOT_API_CONFIG, LAMBDA_CONFIG } from '@/lib/config';

interface MatchData {
  metadata: {
    dataVersion: string;
    matchId: string;
    participants: string[];
  };
  info: {
    endOfGameResult: string;
    gameCreation: number;
    gameDuration: number;
    gameEndTimestamp: number;
    gameId: number;
    gameMode: string;
    gameName: string;
    gameStartTimestamp: number;
    gameType: string;
    gameVersion: string;
    mapId: number;
    participants: Array<{
      summonerName: string;
      championName: string;
      championData: Champion | null;
      champLevel: number;
      kills: number;
      deaths: number;
      assists: number;
      totalMinionsKilled: number;
      goldEarned: number;
      teamId: number;
      puuid: string;
      riotIdGameName: string;
      riotIdTagline: string;
      individualPosition: string;
      teamPosition: string;
      role: string;
      win: boolean;
      item0: number;
      item1: number;
      item2: number;
      item3: number;
      item4: number;
      item5: number;
      item6: number;
      spell1Casts: number;
      spell2Casts: number;
      spell3Casts: number;
      spell4Casts: number;
      summoner1Id: number;
      summoner2Id: number;
      totalDamageDealt: number;
      totalDamageDealtToChampions: number;
      totalDamageTaken: number;
      totalHeal: number;
      visionScore: number;
      wardsPlaced: number;
      wardsKilled: number;
      turretKills: number;
      dragonKills: number;
      baronKills: number;
      firstBloodKill: boolean;
      firstBloodAssist: boolean;
      firstTowerKill: boolean;
      firstTowerAssist: boolean;
      killingSprees: number;
      largestKillingSpree: number;
      largestMultiKill: number;
      longestTimeSpentLiving: number;
      totalTimeSpentDead: number;
      timePlayed: number;
      champExperience: number;
      summonerLevel: number;
      profileIcon: number;
    }>;
    platformId: string;
    queueId: number;
    teams: Array<{
      teamId: number;
      win: boolean;
      bans: Array<{
        championId: number;
        pickTurn: number;
      }>;
      objectives: {
        baron: { first: boolean; kills: number };
        dragon: { first: boolean; kills: number };
        tower: { first: boolean; kills: number };
        inhibitor: { first: boolean; kills: number };
      };
    }>;
    tournamentCode: string;
  };
  timeline?: {
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
  };
}

interface PlayerMatchSummary {
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

export default function PlayerHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const puuid = params.puuid as string;
  
  // State management
  const [playerName, setPlayerName] = useState<string>('');
  const [playerMatches, setPlayerMatches] = useState<PlayerMatchSummary[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [championMap, setChampionMap] = useState<Record<string, Champion>>({});
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Riot API configuration
  const API_KEY = RIOT_API_CONFIG.API_KEY;

  // Fetch champion data for mapping
  const fetchChampionData = async () => {
    try {
      const response = await fetch('https://ddragon.leagueoflegends.com/cdn/12.10.1/data/en_US/champion.json');
      if (!response.ok) {
        throw new Error('Failed to fetch champion data');
      }
      const data: ChampionData = await response.json();
      
      const championNameMap: Record<string, Champion> = {};
      Object.values(data.data).forEach(champion => {
        championNameMap[champion.name] = champion;
      });
      
      setChampionMap(championNameMap);
    } catch (err) {
      console.error('Error fetching champion data:', err);
    }
  };

  // Fetch player's last 5 matches
  const fetchPlayerMatches = async () => {
    if (!puuid) return;
    
    try {
      setLoadingMatches(true);
      setError(null);
      
      // Fetch match IDs by PUUID
      const matchIdsUrl = `https://${RIOT_API_CONFIG.REGION}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=5&api_key=${API_KEY}`;
      const matchIdsResponse = await fetch(matchIdsUrl);
      
      if (!matchIdsResponse.ok) {
        throw new Error(`Failed to fetch match IDs: ${matchIdsResponse.status}`);
      }
      
      const matchIds: string[] = await matchIdsResponse.json();
      
      // Fetch all matches in parallel
      const matchPromises = matchIds.map(matchId => 
        fetch(`https://${RIOT_API_CONFIG.REGION}.api.riotgames.com/lol/match/v5/matches/${matchId}?api_key=${API_KEY}`)
          .then(res => {
            if (!res.ok) {
              throw new Error(`Failed to fetch match ${matchId}: ${res.status}`);
            }
            return res.json();
          })
          .catch(err => {
            console.error(`Failed to fetch match ${matchId}:`, err);
            return null;
          })
      );
      
      const matches = await Promise.all(matchPromises);
      
      // Filter out null results and transform data
      const validMatches = matches
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
      
      if (validMatches.length > 0) {
        setPlayerName(validMatches[0].summonerName);
      }
      
      setPlayerMatches(validMatches);
    } catch (error) {
      console.error('Error fetching player matches:', error);
      setError('Failed to fetch player match history. Please check your API key and try again.');
    } finally {
      setLoadingMatches(false);
    }
  };

  // Fetch detailed match data with timeline
  const fetchDetailedMatchData = async (matchId: string) => {
    try {
      // Fetch match data
      const matchUrl = `https://${RIOT_API_CONFIG.REGION}.api.riotgames.com/lol/match/v5/matches/${matchId}?api_key=${API_KEY}`;
      const matchResponse = await fetch(matchUrl);
      
      if (!matchResponse.ok) {
        throw new Error(`Failed to fetch match data: ${matchResponse.status}`);
      }
      
      const matchData = await matchResponse.json();
      
      // Fetch timeline data
      const timelineUrl = `https://${RIOT_API_CONFIG.REGION}.api.riotgames.com/lol/match/v5/matches/${matchId}/timeline?api_key=${API_KEY}`;
      let timelineData = null;
      
      try {
        const timelineResponse = await fetch(timelineUrl);
        if (timelineResponse.ok) {
          timelineData = await timelineResponse.json();
        }
      } catch (timelineErr) {
        console.warn('Failed to fetch timeline data:', timelineErr);
      }
      
      return {
        match: matchData,
        timeline: timelineData
      };
    } catch (error) {
      console.error('Error fetching detailed match data:', error);
      throw error;
    }
  };

  // Save match data to file
  const saveMatchDataToFile = async (matchId: string, matchData: any, timelineData: any) => {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `player-match-data-${matchId}-${timestamp}.json`;
      
      const response = await fetch('/api/save-gemini-response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename,
          content: JSON.stringify({
            matchId,
            matchData,
            timelineData,
            timestamp: new Date().toISOString()
          }, null, 2),
          matchId,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        console.error('Failed to save match data to file');
      } else {
        console.log('Match data saved successfully');
      }
    } catch (error) {
      console.error('Error saving match data:', error);
    }
  };

  // Analyze player performance
  const analyzePlayerPerformance = async () => {
    if (playerMatches.length === 0) return;
    
    try {
      setAnalyzing(true);
      setError(null);
      
      // Fetch detailed data for all matches
      const detailedMatches = [];
      for (const match of playerMatches) {
        const detailedData = await fetchDetailedMatchData(match.matchId);
        detailedMatches.push({
          ...match,
          detailedMatch: detailedData.match,
          detailedTimeline: detailedData.timeline
        });
        
        // Save each match data to file
        await saveMatchDataToFile(match.matchId, detailedData.match, detailedData.timeline);
      }
      
      // Prepare data for LLM analysis
      const analysisData = {
        playerName: playerName,
        puuid: puuid,
        matches: detailedMatches.map(match => ({
          matchId: match.matchId,
          gameCreation: match.gameCreation,
          gameDuration: match.gameDuration,
          gameMode: match.gameMode,
          win: match.win,
          champion: match.champion,
          kills: match.kills,
          deaths: match.deaths,
          assists: match.assists,
          detailedMatch: match.detailedMatch,
          detailedTimeline: match.detailedTimeline
        }))
      };
      
      // Create comprehensive prompt for player analysis
      const prompt = `You are a **League of Legends Player Performance Analyzer**. Analyze this player's performance across their last 5 matches and provide:

- Overall performance trends and patterns
- Champion-specific strengths and weaknesses
- Decision making analysis across matches
- Improvement suggestions based on multiple games
- Consistency analysis
- Role-specific insights
- Timeline-based performance evaluation

Use markdown headers (#, ##, ###) and bullet points (-) for clarity.

## Player Information:
- **Summoner Name:** ${playerName}
- **PUUID:** ${puuid}
- **Matches Analyzed:** ${playerMatches.length}

## Match Summary:
${playerMatches.map((match, index) => `
### Match ${index + 1} - ${match.matchId}
- **Date:** ${new Date(match.gameCreation).toLocaleDateString()}
- **Duration:** ${Math.floor(match.gameDuration / 60)}:${(match.gameDuration % 60).toString().padStart(2, '0')}
- **Champion:** ${match.champion}
- **Result:** ${match.win ? 'Victory' : 'Defeat'}
- **KDA:** ${match.kills}/${match.deaths}/${match.assists}
- **Game Mode:** ${match.gameMode}
`).join('\n')}

## Detailed Analysis:
Please provide a comprehensive analysis of this player's performance across all matches, including:
1. Performance consistency
2. Champion mastery
3. Decision making patterns
4. Areas for improvement
5. Strengths to build upon
6. Timeline-based insights from match events

Focus on actionable insights that can help the player improve their gameplay.`;

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
      console.log('Player analysis Lambda response:', result);

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
        setAnalysisResult(analysisText);
        
        // Save analysis to file
        await saveAnalysisToFile(analysisText);
      } else {
        throw new Error('No analysis text found in response');
      }
    } catch (error) {
      console.error('Player analysis error:', error);
      setError('Failed to analyze player performance. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  // Save analysis to file
  const saveAnalysisToFile = async (content: string) => {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `player-analysis-${playerName}-${puuid}-${timestamp}.txt`;
      
      const response = await fetch('/api/save-gemini-response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename,
          content,
          playerName,
          puuid,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        console.error('Failed to save analysis to file');
      } else {
        console.log('Analysis saved successfully');
      }
    } catch (error) {
      console.error('Error saving analysis:', error);
    }
  };

  useEffect(() => {
    fetchChampionData();
    fetchPlayerMatches();
  }, [puuid]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="max-w-6xl mx-auto mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.back()}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Player History: {playerName || 'Loading...'}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    PUUID: {puuid}
                  </p>
                </div>
              </div>
              
              <button
                onClick={analyzePlayerPerformance}
                disabled={analyzing || playerMatches.length === 0}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                {analyzing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <span>🤖</span>
                    <span>Analyze Player Performance</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="max-w-6xl mx-auto mb-8">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-md">
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loadingMatches && (
          <div className="max-w-6xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
              <div className="flex items-center justify-center py-12">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-4 text-gray-600 dark:text-gray-400">Loading player matches...</span>
              </div>
            </div>
          </div>
        )}

        {/* Matches List */}
        {!loadingMatches && playerMatches.length > 0 && (
          <div className="max-w-6xl mx-auto mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Last 5 Matches</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {playerMatches.map((match, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                      match.win
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-500 dark:border-green-700'
                        : 'bg-red-50 dark:bg-red-900/20 border-red-500 dark:border-red-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className={`px-2 py-1 rounded text-xs font-semibold ${
                        match.win ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                      }`}>
                        {match.win ? 'Victory' : 'Defeat'}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(match.gameCreation).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className="font-bold text-lg text-gray-900 dark:text-white mb-1">
                      {match.champion}
                    </div>
                    
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {match.gameMode}
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="text-gray-900 dark:text-white font-semibold">
                        {match.kills}/{match.deaths}/{match.assists}
                      </div>
                      <div className="text-gray-500 dark:text-gray-400">
                        {Math.floor(match.gameDuration / 60)}:{(match.gameDuration % 60).toString().padStart(2, '0')}
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Match ID: {match.matchId}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Analysis Result */}
        {analysisResult && (
          <div className="max-w-6xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="text-4xl">🤖</div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Player Performance Analysis
                </h2>
              </div>
              
              <div className="prose dark:prose-invert max-w-none">
                <div className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {analysisResult.split('\n').map((line, index) => {
                    // Handle main headers
                    if (line.startsWith('# ')) {
                      return (
                        <h1 key={index} className="text-4xl font-bold text-gray-900 dark:text-white mb-6 mt-8 border-b-2 border-gray-200 dark:border-gray-600 pb-2">
                          {line.substring(2)}
                        </h1>
                      );
                    }
                    // Handle section headers
                    if (line.startsWith('## ')) {
                      return (
                        <h2 key={index} className="text-3xl font-bold text-gray-900 dark:text-white mb-4 mt-6 border-b border-gray-200 dark:border-gray-600 pb-2">
                          {line.substring(3)}
                        </h2>
                      );
                    }
                    // Handle subsection headers
                    if (line.startsWith('### ')) {
                      return (
                        <h3 key={index} className="text-2xl font-semibold text-gray-900 dark:text-white mb-3 mt-4">
                          {line.substring(4)}
                        </h3>
                      );
                    }
                    // Handle bold text with colons
                    if (line.includes('**') && line.includes(':')) {
                      const parts = line.split('**');
                      return (
                        <p key={index} className="mb-3">
                          <strong className="font-semibold text-gray-900 dark:text-white text-lg">
                            {parts[1]}:
                          </strong>
                          {parts[2] && <span className="ml-2">{parts[2]}</span>}
                        </p>
                      );
                    }
                    // Handle bullet points
                    if (line.startsWith('- ')) {
                      return (
                        <li key={index} className="ml-6 mb-2 list-disc text-gray-700 dark:text-gray-300">
                          {line.substring(2)}
                        </li>
                      );
                    }
                    // Handle numbered lists
                    if (/^\d+\.\s/.test(line)) {
                      return (
                        <li key={index} className="ml-6 mb-2 list-decimal text-gray-700 dark:text-gray-300">
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
                      <p key={index} className="mb-4 text-gray-700 dark:text-gray-300">
                        {line}
                      </p>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* No Matches State */}
        {!loadingMatches && playerMatches.length === 0 && !error && (
          <div className="max-w-6xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">No Matches Found</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  No recent matches found for this player.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
