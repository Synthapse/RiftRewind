'use client';

import { useState, useEffect } from 'react';
import { Champion, ChampionData } from '@/types/champion';
import Link from 'next/link';
import MatchAnalyzer from './MatchAnalyzer';
import MatchTimeline from './MatchTimeline';

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
  const [activeTab, setActiveTab] = useState<'match' | 'timeline'>('match');
  
  // Champion mapping states
  const [championMap, setChampionMap] = useState<Record<string, Champion>>({});
  
  // AI Analysis states
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  
  // Riot API configuration

  // 3850859744



  const API_KEY = "RGAPI-61e4f1c7-f5d9-4cd9-a285-0e84b66428f6";
  const platform = "eun1"; // EUNE server

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
      const matchUrl = `https://europe.api.riotgames.com/lol/match/v5/matches/${fullMatchId}?api_key=${API_KEY}`;
      
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
      const timelineUrl = `https://europe.api.riotgames.com/lol/match/v5/matches/${fullMatchId}/timeline?api_key=${API_KEY}`;
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
      
      // Transform match data for Lambda
      const lambdaData = {
        matchData: {
          matchId: matchData.metadata.matchId,
          gameDuration: matchData.info.gameDuration,
          gameMode: matchData.info.gameMode,
          queueId: matchData.info.queueId,
          teams: matchData.info.participants.reduce((acc: any[], participant: any) => {
            let team = acc.find((t) => t.teamId === participant.teamId);
            if (!team) {
              team = {
                teamId: participant.teamId,
                win: participant.win,
                participants: [],
              };
              acc.push(team);
            }
            team.participants.push({
              championName: participant.championName,
              summonerName: participant.summonerName,
              kills: participant.kills,
              deaths: participant.deaths,
              assists: participant.assists,
              cs: participant.totalMinionsKilled,
              gold: participant.goldEarned,
              damage: participant.totalDamageDealtToChampions,
              visionScore: participant.visionScore,
              level: participant.champLevel,
              position: participant.teamPosition,
            });
            return acc;
          }, []),
          objectives: {
            baronKills: matchData.info.teams[0]?.objectives?.baron?.kills || 0,
            dragonKills: matchData.info.teams[0]?.objectives?.dragon?.kills || 0,
            riftHeraldKills: 0,
            towerKills: matchData.info.teams[0]?.objectives?.tower?.kills || 0,
          },
          timeline: matchData.timeline || null,
        },
      };

      const APIUrl = "https://or0v98ycwe.execute-api.us-east-1.amazonaws.com/prod/league-ai-analytics-data-ingest";
      const response = await fetch(APIUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(lambdaData),
      });

      if (!response.ok) {
        throw new Error(`Lambda error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (result.statusCode === 200 && result.body) {
        setAiAnalysis(result.body);
        setShowAiModal(true);
      } else {
        throw new Error(result.body || 'Failed to get analysis');
      }
    } catch (error) {
      console.error('AI Analysis error:', error);
      alert('Failed to get AI analysis. Please try again.');
    } finally {
      setAiLoading(false);
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
                {matchData.timeline && (
                  <a
                    href={`/match/${matchData.metadata.matchId}/rewind`}
                    className="flex-1 px-6 py-4 text-sm font-medium transition-all bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white hover:text-white flex items-center justify-center rounded-tr-lg"
                  >
                    <span className="mr-2">🎬</span>
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
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white transition-all flex items-center space-x-2 font-medium"
                >
                  {aiLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>AI Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <span>🤖</span>
                      <span>AI Analysis</span>
                    </>
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
              
              
              {/* Team 100 (Blue Team) */}
              <div className="mb-6">
                <div className="mb-4">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Team 100</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {matchData.info.participants
                    .filter(participant => participant.teamId === 100)
                    .map((participant, index) => {
                      return (
                        <div key={index} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h5 className="font-bold text-lg text-gray-900 dark:text-white">
                            {participant.summonerName}
                          </h5>
                          <div className="flex items-center space-x-2 mt-1">
                            <div className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                              {participant.win ? 'Victory' : 'Defeat'}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Clickable Champion Card */}
                      {participant.championData ? (
                        <Link 
                          href={`/champion/${participant.championData.id}`}
                          className="block mb-4 p-4 bg-white/60 dark:bg-gray-700/60 rounded-xl hover:bg-white/80 dark:hover:bg-gray-600/80 transition-all duration-200 transform hover:scale-105"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="relative">
                              <div className="w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 rounded-xl flex items-center justify-center overflow-hidden">
                                <img
                                  src={`https://ddragon.leagueoflegends.com/cdn/14.1.1/img/champion/${participant.championData.image.full}`}
                                  alt={participant.championName}
                                  className="w-14 h-14 object-cover"
                                />
                              </div>
                              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gray-900 dark:bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-white dark:text-gray-900">
                                {participant.champLevel}
                              </div>
                            </div>
                            <div className="flex-1">
                              <p className="font-bold text-lg text-gray-900 dark:text-white">
                                {participant.championName}
                            </p>
                              <p className="text-sm text-gray-600 dark:text-gray-300">
                                {participant.championData.title}
                              </p>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className="text-xs text-gray-500 dark:text-gray-400">{participant.individualPosition}</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">•</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">{participant.role}</span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      ) : (
                        <div className="mb-4 p-4 bg-white/60 dark:bg-gray-700/60 rounded-xl">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {participant.championName} (Level {participant.champLevel})
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs text-gray-500 dark:text-gray-400">{participant.individualPosition}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">•</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{participant.role}</span>
                          </div>
                        </div>
                      )}
                      
                      {/* Basic Stats */}
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {participant.kills}/{participant.deaths}/{participant.assists}
                          </div>
                          <div className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">KDA</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {participant.totalMinionsKilled}
                          </div>
                          <div className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">CS</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {Math.floor(participant.goldEarned / 1000)}k
                          </div>
                          <div className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Gold</div>
                        </div>
                      </div>

                      {/* Detailed Stats */}
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

                      {/* Objectives and Achievements */}
                      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
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
                      );
                    })}
                </div>
              </div>

              {/* Team 200 */}
              <div className="mb-6">
                <div className="mb-4">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Team 200</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {matchData.info.participants
                    .filter(participant => participant.teamId === 200)
                    .map((participant, index) => {
                      return (
                        <div key={index} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h5 className="font-bold text-lg text-gray-900 dark:text-white">
                                {participant.summonerName}
                              </h5>
                              <div className="flex items-center space-x-2 mt-1">
                                <div className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                                  {participant.win ? 'Victory' : 'Defeat'}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Clickable Champion Card */}
                          {participant.championData ? (
                            <Link 
                              href={`/champion/${participant.championData.id}`}
                              className="block mb-4 p-4 bg-white/60 dark:bg-gray-700/60 rounded-xl hover:bg-white/80 dark:hover:bg-gray-600/80 transition-all duration-200 transform hover:scale-105"
                            >
                              <div className="flex items-center space-x-4">
                                <div className="relative">
                                  <div className="w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 rounded-xl flex items-center justify-center overflow-hidden">
                                    <img
                                      src={`https://ddragon.leagueoflegends.com/cdn/14.1.1/img/champion/${participant.championData.image.full}`}
                                      alt={participant.championName}
                                      className="w-14 h-14 object-cover"
                                    />
                                  </div>
                                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gray-900 dark:bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-white dark:text-gray-900">
                                    {participant.champLevel}
                                  </div>
                                </div>
                                <div className="flex-1">
                                  <p className="font-bold text-lg text-gray-900 dark:text-white">
                                    {participant.championName}
                                  </p>
                                  <p className="text-sm text-gray-600 dark:text-gray-300">
                                    {participant.championData.title}
                                  </p>
                                  <div className="flex items-center space-x-2 mt-1">
                                    <span className="text-xs text-gray-500 dark:text-gray-400">{participant.individualPosition}</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">•</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">{participant.role}</span>
                                  </div>
                                </div>
                              </div>
                            </Link>
                          ) : (
                            <div className="mb-4 p-4 bg-white/60 dark:bg-gray-700/60 rounded-xl">
                              <p className="font-medium text-gray-900 dark:text-white">
                                {participant.championName} (Level {participant.champLevel})
                              </p>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className="text-xs text-gray-500 dark:text-gray-400">{participant.individualPosition}</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">•</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">{participant.role}</span>
                              </div>
                            </div>
                          )}
                          
                          {/* Basic Stats */}
                          <div className="grid grid-cols-3 gap-4 mb-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                {participant.kills}/{participant.deaths}/{participant.assists}
                              </div>
                              <div className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">KDA</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                {participant.totalMinionsKilled}
                              </div>
                              <div className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">CS</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                {Math.floor(participant.goldEarned / 1000)}k
                              </div>
                              <div className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Gold</div>
                            </div>
                          </div>

                          {/* Detailed Stats */}
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

                          {/* Objectives and Achievements */}
                          <div className="grid grid-cols-2 gap-4 text-sm mb-4">
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
                      );
                    })}
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

        {/* AI Analysis Modal */}
        {showAiModal && aiAnalysis && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-8">
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-4xl max-h-[90vh] overflow-y-auto border-2 border-gray-200 dark:border-gray-700 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="text-4xl">🤖</div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white">AI Match Analysis</h2>
                </div>
                <button
                  onClick={() => setShowAiModal(false)}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors text-2xl"
                >
                  ✕
                </button>
              </div>
              <div className="prose dark:prose-invert max-w-none">
                <div className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {aiAnalysis.split('\n').map((line, index) => {
                    if (line.startsWith('# ')) {
                      return (
                        <h1 key={index} className="text-4xl font-bold text-gray-900 dark:text-white mb-6 mt-8">
                          {line.substring(2)}
                        </h1>
                      );
                    }
                    if (line.startsWith('## ')) {
                      return (
                        <h2 key={index} className="text-3xl font-bold text-gray-900 dark:text-white mb-4 mt-6">
                          {line.substring(3)}
                        </h2>
                      );
                    }
                    if (line.startsWith('### ')) {
                      return (
                        <h3 key={index} className="text-2xl font-semibold text-gray-900 dark:text-white mb-3 mt-4">
                          {line.substring(4)}
                        </h3>
                      );
                    }
                    if (line.includes('**') && line.includes(':')) {
                      const parts = line.split('**');
                      return (
                        <p key={index} className="mb-2">
                          <strong className="font-semibold text-gray-900 dark:text-white">
                            {parts[1]}:
                          </strong>
                          {parts[2] && <span>{parts[2]}</span>}
                        </p>
                      );
                    }
                    if (line.startsWith('- ')) {
                      return (
                        <li key={index} className="ml-6 mb-1 list-disc">
                          {line.substring(2)}
                        </li>
                      );
                    }
                    if (line.trim() === '') {
                      return <br key={index} />;
                    }
                    return (
                      <p key={index} className="mb-4">
                        {line}
                      </p>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
