'use client';

import { useState, useEffect } from 'react';
import { Champion, ChampionData } from '@/types/champion';
import Link from 'next/link';
import MatchAnalyzer from './MatchAnalyzer';
import MatchTimeline from './MatchTimeline';
import { RIOT_API_CONFIG, LAMBDA_CONFIG } from '../lib/config';

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

export default function MatchLookup() {
  // Match data states
  const [matchId, setMatchId] = useState('EUN1_3849902044');
  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchError, setMatchError] = useState<string | null>(null);
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'match' | 'timeline' | 'ai-analysis'>('match');
  
  // Champion mapping states
  const [championMap, setChampionMap] = useState<Record<string, Champion>>({});
  
  // AI Analysis states
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [championAnalysis, setChampionAnalysis] = useState<string | null>(null);
  const [championAnalysisLoading, setChampionAnalysisLoading] = useState(false);
  const [selectedChampionForAnalysis, setSelectedChampionForAnalysis] = useState<string | null>(null);
  
  
  // Accordion states for detailed stats
  const [expandedPlayers, setExpandedPlayers] = useState<Set<string>>(new Set());
  
  // Riot API configuration
  const API_KEY = RIOT_API_CONFIG.API_KEY;
  const platform = RIOT_API_CONFIG.PLATFORM;

  // Function to fetch champion data for mapping
  const fetchChampionData = async () => {
    try {
      const response = await fetch('https://ddragon.leagueoflegends.com/cdn/12.10.1/data/en_US/champion.json');
      if (!response.ok) {
        throw new Error('Failed to fetch champion data');
      }
      const data: ChampionData = await response.json();
      
      // Create a map of champion names to champion data
      const championNameMap: Record<string, Champion> = {};
      Object.values(data.data).forEach(champion => {
        championNameMap[champion.name] = champion;
      });
      
      setChampionMap(championNameMap);
    } catch (err) {
      console.error('Error fetching champion data:', err);
    }
  };

  const fetchMatchData = async () => {
    if (!matchId.trim()) return;
    
    try {
      setMatchLoading(true);
      setMatchError(null);
      
      // Use the full match ID (e.g., EUN1_3849902044)
      const fullMatchId = matchId;
      
      // Match endpoint with API key as query parameter
      const matchUrl = `https://${RIOT_API_CONFIG.REGION}.api.riotgames.com/lol/match/v5/matches/${fullMatchId}?api_key=${API_KEY}`;
      
      const response = await fetch(matchUrl);
      
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("Forbidden: Check if your API key is valid or expired.");
        } else if (response.status === 404) {
          throw new Error("Match not found: The match ID might be invalid or from a different region.");
        } else {
          throw new Error(`Riot API error: ${response.status}`);
        }
      }
      
      const data = await response.json();
      
      // Fetch timeline data
      const timelineUrl = `https://${RIOT_API_CONFIG.REGION}.api.riotgames.com/lol/match/v5/matches/${fullMatchId}/timeline?api_key=${API_KEY}`;
      let timelineData = null;
      
      try {
        const timelineResponse = await fetch(timelineUrl);
        if (timelineResponse.ok) {
          timelineData = await timelineResponse.json();
        }
      } catch (timelineErr) {
        console.warn('Failed to fetch timeline data:', timelineErr);
      }
      
      // Transform the data to match our frontend interface
      const transformedData = {
        metadata: {
          dataVersion: data.metadata?.dataVersion || 'N/A',
          matchId: data.metadata?.matchId || 'N/A',
          participants: data.metadata?.participants || []
        },
        info: {
          endOfGameResult: data.info?.endOfGameResult || 'N/A',
          gameCreation: data.info?.gameCreation || 0,
          gameDuration: data.info?.gameDuration || 0,
          gameEndTimestamp: data.info?.gameEndTimestamp || 0,
          gameId: data.info?.gameId || 0,
          gameMode: data.info?.gameMode || 'N/A',
          gameName: data.info?.gameName || 'N/A',
          gameStartTimestamp: data.info?.gameStartTimestamp || 0,
          gameType: data.info?.gameType || 'N/A',
          gameVersion: data.info?.gameVersion || 'N/A',
          mapId: data.info?.mapId || 0,
          platformId: data.info?.platformId || 'N/A',
          queueId: data.info?.queueId || 0,
          tournamentCode: data.info?.tournamentCode || '',
          participants: data.info?.participants?.map((participant: any) => {
            // Map champion name to champion data
            const championData = championMap[participant.championName];
            
            return {
              summonerName: participant.summonerName || 'Unknown',
              championName: participant.championName || 'Unknown',
              championData: championData || null,
              champLevel: participant.champLevel || 0,
              kills: participant.kills || 0,
              deaths: participant.deaths || 0,
              assists: participant.assists || 0,
              totalMinionsKilled: participant.totalMinionsKilled || 0,
              goldEarned: participant.goldEarned || 0,
              teamId: participant.teamId || 0,
              puuid: participant.puuid || '',
              riotIdGameName: participant.riotIdGameName || '',
              riotIdTagline: participant.riotIdTagline || '',
              individualPosition: participant.individualPosition || '',
              teamPosition: participant.teamPosition || '',
              role: participant.role || '',
              win: participant.win || false,
              item0: participant.item0 || 0,
              item1: participant.item1 || 0,
              item2: participant.item2 || 0,
              item3: participant.item3 || 0,
              item4: participant.item4 || 0,
              item5: participant.item5 || 0,
              item6: participant.item6 || 0,
              spell1Casts: participant.spell1Casts || 0,
              spell2Casts: participant.spell2Casts || 0,
              spell3Casts: participant.spell3Casts || 0,
              spell4Casts: participant.spell4Casts || 0,
              summoner1Id: participant.summoner1Id || 0,
              summoner2Id: participant.summoner2Id || 0,
              totalDamageDealt: participant.totalDamageDealt || 0,
              totalDamageDealtToChampions: participant.totalDamageDealtToChampions || 0,
              totalDamageTaken: participant.totalDamageTaken || 0,
              totalHeal: participant.totalHeal || 0,
              visionScore: participant.visionScore || 0,
              wardsPlaced: participant.wardsPlaced || 0,
              wardsKilled: participant.wardsKilled || 0,
              turretKills: participant.turretKills || 0,
              dragonKills: participant.dragonKills || 0,
              baronKills: participant.baronKills || 0,
              firstBloodKill: participant.firstBloodKill || false,
              firstBloodAssist: participant.firstBloodAssist || false,
              firstTowerKill: participant.firstTowerKill || false,
              firstTowerAssist: participant.firstTowerAssist || false,
              killingSprees: participant.killingSprees || 0,
              largestKillingSpree: participant.largestKillingSpree || 0,
              largestMultiKill: participant.largestMultiKill || 0,
              longestTimeSpentLiving: participant.longestTimeSpentLiving || 0,
              totalTimeSpentDead: participant.totalTimeSpentDead || 0,
              timePlayed: participant.timePlayed || 0,
              champExperience: participant.champExperience || 0,
              summonerLevel: participant.summonerLevel || 0,
              profileIcon: participant.profileIcon || 0
            };
          }) || [],
          teams: data.info?.teams?.map((team: any) => ({
            teamId: team.teamId || 0,
            win: team.win || false,
            bans: team.bans?.map((ban: any) => ({
              championId: ban.championId || 0,
              pickTurn: ban.pickTurn || 0
            })) || [],
            objectives: {
              baron: {
                first: team.objectives?.baron?.first || false,
                kills: team.objectives?.baron?.kills || 0
              },
              dragon: {
                first: team.objectives?.dragon?.first || false,
                kills: team.objectives?.dragon?.kills || 0
              },
              tower: {
                first: team.objectives?.tower?.first || false,
                kills: team.objectives?.tower?.kills || 0
              },
              inhibitor: {
                first: team.objectives?.inhibitor?.first || false,
                kills: team.objectives?.inhibitor?.kills || 0
              }
            }
          })) || []
        },
        timeline: timelineData || undefined
      };
      
      setMatchData(transformedData);
    } catch (err) {
      setMatchError(err instanceof Error ? err.message : 'An error occurred');
      setMatchData(null);
    } finally {
      setMatchLoading(false);
    }
  };

  useEffect(() => {
    fetchChampionData();
  }, []);


  const fetchAIAnalysis = async () => {
    if (!matchData) return;

    try {
      setAiLoading(true);
      
      // Determine winning and losing teams
      const winningTeam = matchData.info.teams.find(team => team.win);
      const losingTeam = matchData.info.teams.find(team => !team.win);
      
      // Get participants for each team
      const winningTeamParticipants = matchData.info.participants.filter(p => p.teamId === winningTeam?.teamId);
      const losingTeamParticipants = matchData.info.participants.filter(p => p.teamId === losingTeam?.teamId);
      
      // Construct the prompt from match data
      const prompt = `You are a **League of Legends Match Analyzer**. Analyze this match and provide:
- Strategic insights
- Team composition breakdown
- Key turning points
- Suggestions for improvement

Use markdown headers (#, ##, ###) and bullet points (-) for clarity.

Match Information:
- Match ID: ${matchData.metadata.matchId}
- Duration: ${Math.floor(matchData.info.gameDuration / 60)} minutes ${matchData.info.gameDuration % 60} seconds
- Game Mode: ${matchData.info.gameMode}
- Queue ID: ${matchData.info.queueId}

Winning Team (${winningTeam?.teamId}):
${winningTeamParticipants.map(p => 
  `- ${p.championName} (${p.summonerName}): ${p.kills}/${p.deaths}/${p.assists} KDA, ` +
  `${p.totalMinionsKilled} CS, ${p.goldEarned} Gold, ${p.totalDamageDealtToChampions} Damage, ${p.visionScore} Vision Score`
).join('\n')}

Losing Team (${losingTeam?.teamId}):
${losingTeamParticipants.map(p => 
  `- ${p.championName} (${p.summonerName}): ${p.kills}/${p.deaths}/${p.assists} KDA, ` +
  `${p.totalMinionsKilled} CS, ${p.goldEarned} Gold, ${p.totalDamageDealtToChampions} Damage, ${p.visionScore} Vision Score`
).join('\n')}

Team Objectives:
- Baron Kills: ${matchData.info.teams[0]?.objectives?.baron?.kills || 0}
- Dragon Kills: ${matchData.info.teams[0]?.objectives?.dragon?.kills || 0}
- Rift Herald Kills: 0
- Tower Kills: ${matchData.info.teams[0]?.objectives?.tower?.kills || 0}`;

      // Send only the prompt to Lambda
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
      console.log('Lambda response:', result);

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
        console.log('Setting AI analysis:', analysisText);
        // Save the response to a file
        await saveGeminiResponse(matchData.metadata.matchId, analysisText);
        
        // Display the analysis in the interface
        setAiAnalysis(analysisText);
        setActiveTab('ai-analysis');
        console.log('AI analysis set and tab switched to ai-analysis');
      } else {
        console.error('No analysis text found in response:', result);
        throw new Error('No analysis text found in response');
      }
    } catch (error) {
      console.error('AI Analysis error:', error);
      alert('Failed to get AI analysis. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const saveGeminiResponse = async (matchId: string, content: string) => {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `gemini-analysis-match-${matchId}-${timestamp}.txt`;
      
      const response = await fetch('/api/save-gemini-response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename,
          content,
          matchId,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        console.error('Failed to save Gemini response to file');
      } else {
        console.log('Gemini response saved successfully');
      }
    } catch (error) {
      console.error('Error saving Gemini response:', error);
    }
  };

  const togglePlayerExpansion = (puuid: string) => {
    setExpandedPlayers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(puuid)) {
        newSet.delete(puuid);
      } else {
        newSet.add(puuid);
      }
      return newSet;
    });
  };

  const fetchChampionAnalysis = async (participant: any) => {
    if (!matchData) return;

    try {
      setChampionAnalysisLoading(true);
      setSelectedChampionForAnalysis(participant.puuid);
      
      // Get player-specific events from timeline
      const playerEvents = matchData.timeline?.info.frames.flatMap(frame => 
        frame.events.filter((event: any) => 
          event.participantId === participant.participantId || 
          (event.killerId === participant.participantId) ||
          (event.victimId === participant.participantId) ||
          (event.assistingParticipantIds && event.assistingParticipantIds.includes(participant.participantId))
        )
      ) || [];

      // Get team context
      const team = matchData.info.teams.find(t => t.teamId === participant.teamId);
      const teammates = matchData.info.participants.filter(p => p.teamId === participant.teamId && p.puuid !== participant.puuid);
      const enemies = matchData.info.participants.filter(p => p.teamId !== participant.teamId);

      // Construct champion-specific prompt
      const prompt = `You are a **League of Legends Champion Performance Analyzer**. Analyze this specific player's performance in the match and provide:

- Individual performance assessment
- Champion-specific strengths and weaknesses
- Decision making analysis
- Improvement suggestions
- Micro and macro play evaluation

Use markdown headers (#, ##, ###) and bullet points (-) for clarity.

## Player Information:
- **Summoner Name:** ${participant.summonerName}
- **Champion:** ${participant.championName} (Level ${participant.champLevel})
- **Position:** ${participant.individualPosition} / ${participant.role}
- **Team:** ${participant.teamId} (${team?.win ? 'Victory' : 'Defeat'})

## Match Context:
- **Match ID:** ${matchData.metadata.matchId}
- **Duration:** ${Math.floor(matchData.info.gameDuration / 60)} minutes ${matchData.info.gameDuration % 60} seconds
- **Game Mode:** ${matchData.info.gameMode}

## Player Performance:
- **KDA:** ${participant.kills}/${participant.deaths}/${participant.assists}
- **CS:** ${participant.totalMinionsKilled}
- **Gold Earned:** ${participant.goldEarned}
- **Damage Dealt to Champions:** ${participant.totalDamageDealtToChampions}
- **Damage Taken:** ${participant.totalDamageTaken}
- **Vision Score:** ${participant.visionScore}
- **Wards Placed:** ${participant.wardsPlaced}
- **Wards Killed:** ${participant.wardsKilled}

## Team Composition:
**Teammates:**
${teammates.map(tm => `- ${tm.championName} (${tm.summonerName}): ${tm.kills}/${tm.deaths}/${tm.assists} KDA`).join('\n')}

**Enemies:**
${enemies.map(enemy => `- ${enemy.championName} (${enemy.summonerName}): ${enemy.kills}/${enemy.deaths}/${enemy.assists} KDA`).join('\n')}

## Key Events (from timeline):
${playerEvents.slice(0, 20).map((event, index) => {
  const eventType = event.type;
  const timestamp = Math.floor(event.timestamp / 60000);
  let description = '';
  
  switch(eventType) {
    case 'CHAMPION_KILL':
      description = `Kill: ${event.killerId === participant.participantId ? 'Killed' : 'Killed by'} ${event.victimId === participant.participantId ? 'player' : 'enemy'}`;
      break;
    case 'CHAMPION_DEATH':
      description = `Death at ${timestamp}min`;
      break;
    case 'WARD_PLACED':
      description = `Ward placed (${event.wardType})`;
      break;
    case 'WARD_KILL':
      description = `Ward killed`;
      break;
    case 'BUILDING_KILL':
      description = `Building ${event.killerId === participant.participantId ? 'destroyed' : 'lost'}`;
      break;
    case 'ELITE_MONSTER_KILL':
      description = `Monster killed: ${event.monsterType || 'Unknown'}`;
      break;
    default:
      description = `${eventType} event`;
  }
  
  return `${index + 1}. [${timestamp}min] ${description}`;
}).join('\n')}

## Objectives:
- **Dragon Kills:** ${participant.dragonKills}
- **Baron Kills:** ${participant.baronKills}
- **Turret Kills:** ${participant.turretKills}
- **First Blood:** ${participant.firstBloodKill ? 'Yes' : 'No'}
- **First Tower:** ${participant.firstTowerKill ? 'Yes' : 'No'}

Please provide a detailed analysis focusing on this specific player's performance, decision-making, and areas for improvement.`;

      // Send only the prompt to Lambda
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
      console.log('Champion analysis Lambda response:', result);

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
        console.log('Setting champion analysis:', analysisText);
        // Save the response to a file
        await saveChampionAnalysis(matchData.metadata.matchId, participant.championName, analysisText);
        
        // Display the analysis in the interface
        setChampionAnalysis(analysisText);
        setActiveTab('ai-analysis');
        console.log('Champion analysis set and tab switched to ai-analysis');
      } else {
        console.error('No analysis text found in response:', result);
        throw new Error('No analysis text found in response');
      }
    } catch (error) {
      console.error('Champion Analysis error:', error);
      alert('Failed to get champion analysis. Please try again.');
    } finally {
      setChampionAnalysisLoading(false);
    }
  };

  const saveChampionAnalysis = async (matchId: string, championName: string, content: string) => {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `gemini-analysis-champion-${championName}-${matchId}-${timestamp}.txt`;
      
      const response = await fetch('/api/save-gemini-response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename,
          content,
          championName,
          matchId,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        console.error('Failed to save champion analysis to file');
      } else {
        console.log('Champion analysis saved successfully');
      }
    } catch (error) {
      console.error('Error saving champion analysis:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}

        {/* Match Input Section */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Match ID
                </label>
                <input
                  type="text"
                  placeholder="EUN1_3849902044"
                  value={matchId}
                  onChange={(e) => setMatchId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={fetchMatchData}
                  disabled={matchLoading || !matchId.trim()}
                  className="px-6 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed rounded-md font-medium transition-colors"
                >
                  {matchLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white dark:border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading...</span>
                    </div>
                  ) : (
                    'Fetch Match'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* Error Display */}
        {matchError && (
          <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-md">
              <span className="font-medium">{matchError}</span>
            </div>
          </div>
        )}

        {/* Tabs */}
        {matchData && (
          <div className="max-w-6xl mx-auto mb-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex border-b border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setActiveTab('match')}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                    activeTab === 'match'
                      ? 'text-gray-900 dark:text-white border-b-2 border-gray-900 dark:border-gray-100'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  Match Information
                </button>
                {matchData.timeline && (
                  <button
                    onClick={() => setActiveTab('timeline')}
                    className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                      activeTab === 'timeline'
                        ? 'text-gray-900 dark:text-white border-b-2 border-gray-900 dark:border-gray-100'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    Timeline
                  </button>
                )}
                <button
                  onClick={() => setActiveTab('ai-analysis')}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                    activeTab === 'ai-analysis'
                      ? 'text-gray-900 dark:text-white border-b-2 border-gray-900 dark:border-gray-100'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  AI Analysis
                </button>
                {matchData.timeline && (
                  <a
                    href={`/match/${matchData.metadata.matchId}/rewind`}
                    className="flex-1 px-6 py-4 text-sm font-medium transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center justify-center"
                  >
                    Rewind
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Match Data Display */}
        {matchData && activeTab === 'match' && (
          <div className="max-w-6xl mx-auto mb-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Match Details</h3>
                <button
                  onClick={fetchAIAnalysis}
                  disabled={aiLoading}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-md text-gray-700 dark:text-gray-300 transition-colors flex items-center space-x-2 font-medium border border-gray-200 dark:border-gray-600"
                >
                  {aiLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white dark:border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                      <span>AI Analyzing...</span>
                    </>
                  ) : (
                    'AI Analysis'
                  )}
                </button>
              </div>
              
              {/* Basic Match Info */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-md p-3 border border-gray-200 dark:border-gray-600">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Match ID</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{matchData.metadata.matchId}</p>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-md p-3 border border-gray-200 dark:border-gray-600">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Duration</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {Math.floor(matchData.info.gameDuration / 60)}:{(matchData.info.gameDuration % 60).toString().padStart(2, '0')}
                  </p>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-md p-3 border border-gray-200 dark:border-gray-600">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Game Mode</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{matchData.info.gameMode}</p>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-md p-3 border border-gray-200 dark:border-gray-600">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Game Type</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{matchData.info.gameType}</p>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-md p-3 border border-gray-200 dark:border-gray-600">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Queue ID</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{matchData.info.queueId}</p>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-md p-3 border border-gray-200 dark:border-gray-600">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Version</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{matchData.info.gameVersion}</p>
                </div>
              </div>

              {/* Additional Match Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-md p-3 border border-gray-200 dark:border-gray-600">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Game ID</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{matchData.info.gameId}</p>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-md p-3 border border-gray-200 dark:border-gray-600">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Platform</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{matchData.info.platformId}</p>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-md p-3 border border-gray-200 dark:border-gray-600">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Map ID</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{matchData.info.mapId}</p>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-md p-3 border border-gray-200 dark:border-gray-600">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Result</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{matchData.info.endOfGameResult}</p>
                </div>
              </div>
              
              
              {/* Teams Side by Side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
                {/* Team 100 (Left Side) */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xl font-bold text-gray-900 dark:text-white">Team 100</h4>
                    <div className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">
                      {matchData.info.teams.find(t => t.teamId === 100)?.win ? 'Victory' : 'Defeat'}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {matchData.info.participants
                      .filter(participant => participant.teamId === 100)
                      .map((participant, index) => {
                        const isExpanded = expandedPlayers.has(participant.puuid);
                        return (
                          <div key={index} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
                            {/* Player Header */}
                            <div className="p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-3">
                                  {participant.championData ? (
                                    <div className="relative">
                                      <div className="w-12 h-12 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                                        <img
                                          src={`https://ddragon.leagueoflegends.com/cdn/14.1.1/img/champion/${participant.championData.image.full}`}
                                          alt={participant.championName}
                                          className="w-10 h-10 object-cover"
                                        />
                                      </div>
                                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gray-900 dark:bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-white dark:text-gray-900">
                                        {participant.champLevel}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                                      <span className="text-xs font-bold text-gray-600 dark:text-gray-300">?</span>
                                    </div>
                                  )}
                                  
                                  <div>
                                    <h5 className="font-bold text-lg text-gray-900 dark:text-white">
                                      {participant.summonerName}
                                    </h5>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">
                                      {participant.championName} • {participant.individualPosition}
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="flex items-center space-x-3">
                                  {/* Basic Stats */}
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                                      {participant.kills}/{participant.deaths}/{participant.assists}
                                    </div>
                                    <div className="text-xs text-gray-600 dark:text-gray-400">KDA</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                                      {participant.totalMinionsKilled}
                                    </div>
                                    <div className="text-xs text-gray-600 dark:text-gray-400">CS</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                                      {Math.floor(participant.goldEarned / 1000)}k
                                    </div>
                                    <div className="text-xs text-gray-600 dark:text-gray-400">Gold</div>
                                  </div>
                                  
                                  {/* Expand/Collapse Button */}
                                  <button
                                    onClick={() => togglePlayerExpansion(participant.puuid)}
                                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                                  >
                                    <svg
                                      className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform ${
                                        isExpanded ? 'rotate-180' : ''
                                      }`}
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                              
                              {/* Action Buttons */}
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => fetchChampionAnalysis(participant)}
                                  disabled={championAnalysisLoading && selectedChampionForAnalysis === participant.puuid}
                                  className="flex-1 p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 rounded-md transition-colors text-sm font-medium flex items-center justify-center border border-gray-200 dark:border-gray-600"
                                >
                                  {championAnalysisLoading && selectedChampionForAnalysis === participant.puuid ? (
                                    <>
                                      <div className="w-4 h-4 border-2 border-white dark:border-gray-900 border-t-transparent rounded-full animate-spin mr-2"></div>
                                      <span>Analyzing...</span>
                                    </>
                                  ) : (
                                    'AI Analysis'
                                  )}
                                </button>
                                
                                {participant.championData && (
                                  <Link
                                    href={`/player/${participant.puuid}`}
                                    className="flex-1 p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md transition-colors text-sm font-medium flex items-center justify-center border border-gray-200 dark:border-gray-600"
                                  >
                                    History
                                  </Link>
                                )}
                              </div>
                            </div>
                            
                            {/* Detailed Stats (Accordion) */}
                            {isExpanded && (
                              <div className="border-t border-gray-200 dark:border-gray-600 p-4 bg-white/40 dark:bg-gray-800/40">
                                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                                  <div className="space-y-2">
                                    <div className="flex justify-between">
                                      <span className="text-gray-600 dark:text-gray-400">Damage Dealt:</span>
                                      <span className="font-medium text-gray-900 dark:text-white">{participant.totalDamageDealt.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600 dark:text-gray-400">Damage to Champs:</span>
                                      <span className="font-medium text-gray-900 dark:text-white">{participant.totalDamageDealtToChampions.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600 dark:text-gray-400">Damage Taken:</span>
                                      <span className="font-medium text-gray-900 dark:text-white">{participant.totalDamageTaken.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600 dark:text-gray-400">Healing:</span>
                                      <span className="font-medium text-gray-900 dark:text-white">{participant.totalHeal.toLocaleString()}</span>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <div className="flex justify-between">
                                      <span className="text-gray-600 dark:text-gray-400">Vision Score:</span>
                                      <span className="font-medium text-gray-900 dark:text-white">{participant.visionScore}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600 dark:text-gray-400">Wards Placed:</span>
                                      <span className="font-medium text-gray-900 dark:text-white">{participant.wardsPlaced}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600 dark:text-gray-400">Wards Killed:</span>
                                      <span className="font-medium text-gray-900 dark:text-white">{participant.wardsKilled}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600 dark:text-gray-400">Turret Kills:</span>
                                      <span className="font-medium text-gray-900 dark:text-white">{participant.turretKills}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div className="space-y-2">
                                    <div className="flex justify-between">
                                      <span className="text-gray-600 dark:text-gray-400">Dragon Kills:</span>
                                      <span className="font-medium text-gray-900 dark:text-white">{participant.dragonKills}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600 dark:text-gray-400">Baron Kills:</span>
                                      <span className="font-medium text-gray-900 dark:text-white">{participant.baronKills}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600 dark:text-gray-400">Killing Sprees:</span>
                                      <span className="font-medium text-gray-900 dark:text-white">{participant.killingSprees}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600 dark:text-gray-400">Largest Spree:</span>
                                      <span className="font-medium text-gray-900 dark:text-white">{participant.largestKillingSpree}</span>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <div className="flex justify-between">
                                      <span className="text-gray-600 dark:text-gray-400">First Blood:</span>
                                      <span className={`font-medium ${participant.firstBloodKill ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                        {participant.firstBloodKill ? 'Yes' : 'No'}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600 dark:text-gray-400">First Tower:</span>
                                      <span className={`font-medium ${participant.firstTowerKill ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                        {participant.firstTowerKill ? 'Yes' : 'No'}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600 dark:text-gray-400">Time Played:</span>
                                      <span className="font-medium text-gray-900 dark:text-white">{Math.floor(participant.timePlayed / 60)}:{(participant.timePlayed % 60).toString().padStart(2, '0')}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600 dark:text-gray-400">Summoner Level:</span>
                                      <span className="font-medium text-gray-900 dark:text-white">{participant.summonerLevel}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Team 200 (Right Side) */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xl font-bold text-gray-900 dark:text-white">Team 200</h4>
                    <div className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200">
                      {matchData.info.teams.find(t => t.teamId === 200)?.win ? 'Victory' : 'Defeat'}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {matchData.info.participants
                      .filter(participant => participant.teamId === 200)
                      .map((participant, index) => {
                        const isExpanded = expandedPlayers.has(participant.puuid);
                        return (
                          <div key={index} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
                            {/* Player Header */}
                            <div className="p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-3">
                                  {participant.championData ? (
                                    <div className="relative">
                                      <div className="w-12 h-12 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                                        <img
                                          src={`https://ddragon.leagueoflegends.com/cdn/14.1.1/img/champion/${participant.championData.image.full}`}
                                          alt={participant.championName}
                                          className="w-10 h-10 object-cover"
                                        />
                                      </div>
                                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gray-900 dark:bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-white dark:text-gray-900">
                                        {participant.champLevel}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                                      <span className="text-xs font-bold text-gray-600 dark:text-gray-300">?</span>
                                    </div>
                                  )}
                                  
                                  <div>
                                    <h5 className="font-bold text-lg text-gray-900 dark:text-white">
                                      {participant.summonerName}
                                    </h5>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">
                                      {participant.championName} • {participant.individualPosition}
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="flex items-center space-x-3">
                                  {/* Basic Stats */}
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                                      {participant.kills}/{participant.deaths}/{participant.assists}
                                    </div>
                                    <div className="text-xs text-gray-600 dark:text-gray-400">KDA</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                                      {participant.totalMinionsKilled}
                                    </div>
                                    <div className="text-xs text-gray-600 dark:text-gray-400">CS</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                                      {Math.floor(participant.goldEarned / 1000)}k
                                    </div>
                                    <div className="text-xs text-gray-600 dark:text-gray-400">Gold</div>
                                  </div>
                                  
                                  {/* Expand/Collapse Button */}
                                  <button
                                    onClick={() => togglePlayerExpansion(participant.puuid)}
                                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                                  >
                                    <svg
                                      className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform ${
                                        isExpanded ? 'rotate-180' : ''
                                      }`}
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                              
                              {/* Action Buttons */}
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => fetchChampionAnalysis(participant)}
                                  disabled={championAnalysisLoading && selectedChampionForAnalysis === participant.puuid}
                                  className="flex-1 p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 rounded-md transition-colors text-sm font-medium flex items-center justify-center border border-gray-200 dark:border-gray-600"
                                >
                                  {championAnalysisLoading && selectedChampionForAnalysis === participant.puuid ? (
                                    <>
                                      <div className="w-4 h-4 border-2 border-white dark:border-gray-900 border-t-transparent rounded-full animate-spin mr-2"></div>
                                      <span>Analyzing...</span>
                                    </>
                                  ) : (
                                    'AI Analysis'
                                  )}
                                </button>
                                
                                {participant.championData && (
                                  <Link
                                    href={`/player/${participant.puuid}`}
                                    className="flex-1 p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md transition-colors text-sm font-medium flex items-center justify-center border border-gray-200 dark:border-gray-600"
                                  >
                                    History
                                  </Link>
                                )}
                              </div>
                            </div>
                            
                            {/* Detailed Stats (Accordion) */}
                            {isExpanded && (
                              <div className="border-t border-gray-200 dark:border-gray-600 p-4 bg-white/40 dark:bg-gray-800/40">
                                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                                  <div className="space-y-2">
                                    <div className="flex justify-between">
                                      <span className="text-gray-600 dark:text-gray-400">Damage Dealt:</span>
                                      <span className="font-medium text-gray-900 dark:text-white">{participant.totalDamageDealt.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600 dark:text-gray-400">Damage to Champs:</span>
                                      <span className="font-medium text-gray-900 dark:text-white">{participant.totalDamageDealtToChampions.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600 dark:text-gray-400">Damage Taken:</span>
                                      <span className="font-medium text-gray-900 dark:text-white">{participant.totalDamageTaken.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600 dark:text-gray-400">Healing:</span>
                                      <span className="font-medium text-gray-900 dark:text-white">{participant.totalHeal.toLocaleString()}</span>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <div className="flex justify-between">
                                      <span className="text-gray-600 dark:text-gray-400">Vision Score:</span>
                                      <span className="font-medium text-gray-900 dark:text-white">{participant.visionScore}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600 dark:text-gray-400">Wards Placed:</span>
                                      <span className="font-medium text-gray-900 dark:text-white">{participant.wardsPlaced}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600 dark:text-gray-400">Wards Killed:</span>
                                      <span className="font-medium text-gray-900 dark:text-white">{participant.wardsKilled}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600 dark:text-gray-400">Turret Kills:</span>
                                      <span className="font-medium text-gray-900 dark:text-white">{participant.turretKills}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div className="space-y-2">
                                    <div className="flex justify-between">
                                      <span className="text-gray-600 dark:text-gray-400">Dragon Kills:</span>
                                      <span className="font-medium text-gray-900 dark:text-white">{participant.dragonKills}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600 dark:text-gray-400">Baron Kills:</span>
                                      <span className="font-medium text-gray-900 dark:text-white">{participant.baronKills}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600 dark:text-gray-400">Killing Sprees:</span>
                                      <span className="font-medium text-gray-900 dark:text-white">{participant.killingSprees}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600 dark:text-gray-400">Largest Spree:</span>
                                      <span className="font-medium text-gray-900 dark:text-white">{participant.largestKillingSpree}</span>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <div className="flex justify-between">
                                      <span className="text-gray-600 dark:text-gray-400">First Blood:</span>
                                      <span className={`font-medium ${participant.firstBloodKill ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                        {participant.firstBloodKill ? 'Yes' : 'No'}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600 dark:text-gray-400">First Tower:</span>
                                      <span className={`font-medium ${participant.firstTowerKill ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                        {participant.firstTowerKill ? 'Yes' : 'No'}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600 dark:text-gray-400">Time Played:</span>
                                      <span className="font-medium text-gray-900 dark:text-white">{Math.floor(participant.timePlayed / 60)}:{(participant.timePlayed % 60).toString().padStart(2, '0')}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600 dark:text-gray-400">Summoner Level:</span>
                                      <span className="font-medium text-gray-900 dark:text-white">{participant.summonerLevel}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>

              {/* Team Objectives and Bans */}
              {matchData.info.teams && matchData.info.teams.length > 0 && (
                <div className="mt-8">
                  <div className="mb-4">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Team Objectives & Bans</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {matchData.info.teams.map((team, index) => (
                      <div key={index} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                        <div className="flex items-center justify-between mb-4">
                          <h5 className="font-semibold text-base text-gray-900 dark:text-white">
                            Team {team.teamId}
                          </h5>
                          <div className="px-2 py-1 rounded-md text-xs font-medium bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                            {team.win ? 'Victory' : 'Defeat'}
                          </div>
                        </div>
                        
                        {/* Objectives */}
                        <div className="mb-4">
                          <h6 className="font-semibold text-gray-900 dark:text-white mb-2">Objectives</h6>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Baron:</span>
                                <span className="font-medium text-gray-900 dark:text-white">{team.objectives.baron.kills}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Dragon:</span>
                                <span className="font-medium text-gray-900 dark:text-white">{team.objectives.dragon.kills}</span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Towers:</span>
                                <span className="font-medium text-gray-900 dark:text-white">{team.objectives.tower.kills}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Inhibitors:</span>
                                <span className="font-medium text-gray-900 dark:text-white">{team.objectives.inhibitor.kills}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Bans */}
                        {team.bans && team.bans.length > 0 && (
                          <div>
                            <h6 className="font-semibold text-gray-900 dark:text-white mb-2">Bans</h6>
                            <div className="flex flex-wrap gap-2">
                              {team.bans.map((ban, banIndex) => (
                                <div key={banIndex} className="bg-white dark:bg-gray-700 px-2 py-1 rounded-md text-xs border border-gray-200 dark:border-gray-600">
                                  <span className="text-gray-600 dark:text-gray-400">Pick {ban.pickTurn}:</span>
                                  <span className="ml-1 font-medium text-gray-900 dark:text-white">Champion {ban.championId}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Timeline Tab Content */}
        {matchData && activeTab === 'timeline' && matchData.timeline && (
          <div className="max-w-6xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <MatchTimeline 
                timeline={matchData.timeline} 
                participants={matchData.info.participants}
              />
            </div>
          </div>
        )}

        {/* AI Analysis Tab Content */}
        {matchData && activeTab === 'ai-analysis' && (
          <div className="max-w-6xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="text-4xl">🤖</div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {championAnalysis ? 'AI Champion Analysis' : 'AI Match Analysis'}
                  </h2>
                </div>
                <div className="flex space-x-2">
                  {!championAnalysis && (
                    <button
                      onClick={fetchAIAnalysis}
                      disabled={aiLoading}
                      className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-md text-gray-700 dark:text-gray-300 transition-colors flex items-center space-x-2 font-medium border border-gray-200 dark:border-gray-600"
                    >
                      {aiLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-gray-400 dark:border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                          <span>Analyzing...</span>
                        </>
                      ) : (
                        'Refresh Match Analysis'
                      )}
                    </button>
                  )}
                  {championAnalysis && (
                    <button
                      onClick={() => {
                        setChampionAnalysis(null);
                        setSelectedChampionForAnalysis(null);
                      }}
                      className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md transition-colors flex items-center space-x-2 font-medium border border-gray-200 dark:border-gray-600"
                    >
                      Back to Match Analysis
                    </button>
                  )}
                </div>
              </div>
              
              {(aiAnalysis || championAnalysis) ? (
                <div className="prose dark:prose-invert max-w-none">
                  <div className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {(championAnalysis || aiAnalysis)?.split('\n').map((line, index) => {
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
                      // Handle bold text with colons (like "**Strengths:**")
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
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🤖</div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">No Analysis Available</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Click the "AI Analysis" button above to generate a strategic analysis of this match, or click individual champion "AI Analysis" buttons for player-specific insights.
                  </p>
                  <button
                    onClick={fetchAIAnalysis}
                    disabled={aiLoading}
                    className="px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-md text-gray-700 dark:text-gray-300 transition-colors flex items-center space-x-2 font-medium mx-auto border border-gray-200 dark:border-gray-600"
                  >
                    {aiLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-gray-400 dark:border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                        <span>Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <span>🚀</span>
                        <span>Generate Match Analysis</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}


      </div>
    </div>
  );
}
