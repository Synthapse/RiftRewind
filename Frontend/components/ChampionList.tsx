'use client';

import { useState, useEffect } from 'react';
import { Champion, ChampionData } from '@/types/champion';
import Link from 'next/link';
import MatchAnalyzer from './MatchAnalyzer';

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
}

export default function MatchLookup() {
  // Match data states
  const [matchId, setMatchId] = useState('EUN1_3849902044');
  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchError, setMatchError] = useState<string | null>(null);
  
  // Champion mapping states
  const [championMap, setChampionMap] = useState<Record<string, Champion>>({});
  
  // Riot API configuration
  const API_KEY = "RGAPI-cbd4e7fa-c38d-44e3-8ce3-9e38dd73baac";
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
      const url = `https://europe.api.riotgames.com/lol/match/v5/matches/${fullMatchId}?api_key=${API_KEY}`;
      
      const response = await fetch(url);
      
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
        }
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


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-12">
        {/* Header Section */}

        {/* Match Input Section */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/20 p-8">
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
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={fetchMatchData}
                  disabled={matchLoading || !matchId.trim()}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 text-white rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 shadow-lg disabled:shadow-none"
                >
                  {matchLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading...</span>
                    </div>
                  ) : (
                    'Get Match Data'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* Error Display */}
        {matchError && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-6 py-4 rounded-xl backdrop-blur-sm">
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">{matchError}</span>
              </div>
            </div>
          </div>
        )}

        {/* Match Data Display */}
        {matchData && (
          <div className="max-w-6xl mx-auto">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/20 p-8 mb-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Match Information</h3>
              </div>
              
              {/* Basic Match Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v1m0 0V1a1 1 0 011-1h2a1 1 0 011 1v1m0 0V2a1 1 0 011 1v1m-3 0V2a1 1 0 011-1h2a1 1 0 011 1v1m0 0V1a1 1 0 011-1h2a1 1 0 011 1v1" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Match ID</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">{matchData.metadata.matchId}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Duration</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {Math.floor(matchData.info.gameDuration / 60)}:{(matchData.info.gameDuration % 60).toString().padStart(2, '0')}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Game Mode</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">{matchData.info.gameMode}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Game Type</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">{matchData.info.gameType}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Queue ID</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">{matchData.info.queueId}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Version</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">{matchData.info.gameVersion}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Match Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Game ID</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">{matchData.info.gameId}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-rose-500 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Platform</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">{matchData.info.platformId}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Map ID</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">{matchData.info.mapId}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-violet-500 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Result</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">{matchData.info.endOfGameResult}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              
              {/* Team 100 (Blue Team) */}
              <div className="mb-8">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h4 className="text-2xl font-bold text-blue-900 dark:text-blue-100">Blue Team (Team 100)</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {matchData.info.participants
                    .filter(participant => participant.teamId === 100)
                    .map((participant, index) => {
                      const teamColor = 'from-blue-500 to-cyan-500';
                      const teamBgColor = 'from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20';
                      
                      return (
                        <div key={index} className={`bg-gradient-to-r ${teamBgColor} rounded-2xl p-6 border border-white/20 dark:border-gray-700/20 backdrop-blur-sm`}>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h5 className="font-bold text-lg text-gray-900 dark:text-white">
                            {participant.summonerName}
                          </h5>
                          <div className="flex items-center space-x-2 mt-1">
                            <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${teamColor} text-white`}>
                              Team {participant.teamId}
                            </div>
                            <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                              participant.win 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                            }`}>
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
                              <div className={`absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-r ${teamColor} rounded-full flex items-center justify-center text-xs font-bold text-white`}>
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

              {/* Team 200 (Red Team) */}
              <div className="mb-8">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h4 className="text-2xl font-bold text-red-900 dark:text-red-100">Red Team (Team 200)</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {matchData.info.participants
                    .filter(participant => participant.teamId === 200)
                    .map((participant, index) => {
                      const teamColor = 'from-red-500 to-pink-500';
                      const teamBgColor = 'from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20';
                      
                      return (
                        <div key={index} className={`bg-gradient-to-r ${teamBgColor} rounded-2xl p-6 border border-white/20 dark:border-gray-700/20 backdrop-blur-sm`}>
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h5 className="font-bold text-lg text-gray-900 dark:text-white">
                                {participant.summonerName}
                              </h5>
                              <div className="flex items-center space-x-2 mt-1">
                                <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${teamColor} text-white`}>
                                  Team {participant.teamId}
                                </div>
                                <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                  participant.win 
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                }`}>
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
                                  <div className={`absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-r ${teamColor} rounded-full flex items-center justify-center text-xs font-bold text-white`}>
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
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h4 className="text-2xl font-bold text-gray-900 dark:text-white">Team Objectives & Bans</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {matchData.info.teams.map((team, index) => (
                      <div key={index} className={`bg-gradient-to-r ${
                        team.teamId === 100 
                          ? 'from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20' 
                          : 'from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20'
                      } rounded-2xl p-6 border border-white/20 dark:border-gray-700/20 backdrop-blur-sm`}>
                        <div className="flex items-center justify-between mb-4">
                          <h5 className={`font-bold text-lg ${
                            team.teamId === 100 ? 'text-blue-900 dark:text-blue-100' : 'text-red-900 dark:text-red-100'
                          }`}>
                            Team {team.teamId}
                          </h5>
                          <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            team.win 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                          }`}>
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
                                <div key={banIndex} className="bg-white/60 dark:bg-gray-700/60 px-3 py-1 rounded-full text-sm">
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

        {/* Match Analyzer */}
        {matchData && (
          <div className="max-w-6xl mx-auto mb-8">
            <MatchAnalyzer matchData={matchData} />
          </div>
        )}
      </div>
    </div>
  );
}
