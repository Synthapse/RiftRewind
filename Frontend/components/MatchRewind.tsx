'use client';

import { useState, useEffect } from 'react';
import { formatAnalysisText } from '@/lib/format-analysis';

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

interface Highlight {
  type: 'killed' | 'objective' | 'multikill' | 'firstblood' | 'killstreak' | 'damage' | 'gold' | 'vision' | 'intro' | 'outro';
  timestamp: number;
  title: string;
  description: string;
  participants?: Participant[];
  icon?: string;
  teamId?: number;
}

interface MatchRewindProps {
  timeline: TimelineData;
  participants: Participant[];
  matchId: string;
  gameDuration: number;
  winningTeam: number;
  matchData?: any;
}

export default function MatchRewind({ timeline, participants, matchId, gameDuration, winningTeam, matchData }: MatchRewindProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showAiSlide, setShowAiSlide] = useState(false);

  // Extract key highlights from timeline
  useEffect(() => {
    const extractedHighlights: Highlight[] = [];
    
    // Intro slide
    extractedHighlights.push({
      type: 'intro',
      timestamp: 0,
      title: 'Match Rewind',
      description: `${matchId}`,
      icon: '🎮'
    });

    // Extract key events from timeline
    const keyEvents: Array<{
      timestamp: number;
      type: string;
      killerId?: number;
      victimId?: number;
      assistingParticipantIds?: number[];
      killType?: string;
      monsterType?: string;
      dragonType?: string;
      buildingType?: string;
      multiKillStreak?: number;
    }> = [];

    timeline.info.frames.forEach((frame) => {
      frame.events.forEach((event) => {
        if (
          event.type === 'CHAMPION_KILL' ||
          event.type === 'CHAMPION_SPECIAL_KILL' ||
          event.type === 'ELITE_MONSTER_KILL' ||
          event.type === 'BUILDING_KILL' ||
          event.type === 'TURRET_PLATE_DESTROYED' ||
          event.type === 'DRAGON_SOUL_GIVEN'
        ) {
          keyEvents.push({
            timestamp: event.timestamp,
            type: event.type,
            killerId: event.killerId,
            victimId: event.victimId,
            assistingParticipantIds: event.assistingParticipantIds,
            killType: event.killType,
            monsterType: event.monsterType,
            dragonType: event.dragonType,
            buildingType: event.buildingType,
            multiKillStreak: event.multiKillStreak
          });
        }
      });
    });

    // First Blood
    const firstBlood = keyEvents.find(e => e.type === 'CHAMPION_KILL');
    if (firstBlood && firstBlood.killerId) {
      const killer = participants[firstBlood.killerId - 1];
      if (killer) {
        extractedHighlights.push({
          type: 'firstblood',
          timestamp: firstBlood.timestamp,
          title: 'First Blood!',
          description: `${killer.championName} secured first blood`,
          participants: [killer],
          icon: '🩸',
          teamId: killer.teamId
        });
      }
    }

    // Multikills
    const multikills = keyEvents.filter(e => e.killType && ['DOUBLE_KILL', 'TRIPLE_KILL', 'QUADRA_KILL', 'PENTAKILL'].includes(e.killType));
    multikills.forEach((mk) => {
      if (mk.killerId) {
        const killer = participants[mk.killerId - 1];
        if (killer) {
          const killType = mk.killType?.replace('_KILL', '') || '';
          extractedHighlights.push({
            type: 'multikill',
            timestamp: mk.timestamp,
            title: `${killType}!`,
            description: `${killer.championName} achieved ${killType.toLowerCase()}`,
            participants: [killer],
            icon: '🔥',
            teamId: killer.teamId
          });
        }
      }
    });

    // Objectives
    const dragons = keyEvents.filter(e => e.type === 'ELITE_MONSTER_KILL' && e.monsterType === 'DRAGON');
    dragons.forEach((dragon) => {
      if (dragon.killerId) {
        const killer = participants[dragon.killerId - 1];
        if (killer) {
          extractedHighlights.push({
            type: 'objective',
            timestamp: dragon.timestamp,
            title: 'Dragon Slain',
            description: `${killer.championName} secured ${dragon.dragonType || 'Dragon'}`,
            participants: [killer],
            icon: '🐉',
            teamId: killer.teamId
          });
        }
      }
    });

    const barons = keyEvents.filter(e => e.type === 'ELITE_MONSTER_KILL' && e.monsterType === 'BARON_NASHOR');
    barons.forEach((baron) => {
      if (baron.killerId) {
        const killer = participants[baron.killerId - 1];
        if (killer) {
          extractedHighlights.push({
            type: 'objective',
            timestamp: baron.timestamp,
            title: 'Baron Nashor Slain',
            description: `${killer.championName} secured Baron`,
            participants: [killer],
            icon: '👹',
            teamId: killer.teamId
          });
        }
      }
    });

    // Dragon Soul
    const dragonSoul = keyEvents.find(e => e.type === 'DRAGON_SOUL_GIVEN');
    if (dragonSoul) {
      const soulTeam = (dragonSoul as any).teamId || winningTeam;
      const teamMembers = participants.filter(p => p.teamId === soulTeam);
      extractedHighlights.push({
        type: 'objective',
        timestamp: dragonSoul.timestamp,
        title: 'Dragon Soul!',
        description: `Team ${soulTeam} obtained Dragon Soul`,
        participants: teamMembers,
        icon: '⭐',
        teamId: soulTeam
      });
    }

    // Sort by timestamp
    extractedHighlights.sort((a, b) => a.timestamp - b.timestamp);

    // Add MVP stats
    const topDamage = [...participants].sort((a, b) => b.totalDamageDealtToChampions - a.totalDamageDealtToChampions)[0];
    const topGold = [...participants].sort((a, b) => b.goldEarned - a.goldEarned)[0];
    const topVision = [...participants].sort((a, b) => b.visionScore - a.visionScore)[0];

    if (topDamage) {
      extractedHighlights.push({
        type: 'damage',
        timestamp: gameDuration * 1000 * 0.8,
        title: 'Top Damage Dealer',
        description: `${topDamage.championName} dealt ${Math.floor(topDamage.totalDamageDealtToChampions / 1000)}k damage`,
        participants: [topDamage],
        icon: '💥',
        teamId: topDamage.teamId
      });
    }

    if (topGold) {
      extractedHighlights.push({
        type: 'gold',
        timestamp: gameDuration * 1000 * 0.85,
        title: 'Highest Gold Earned',
        description: `${topGold.championName} earned ${Math.floor(topGold.goldEarned / 1000)}k gold`,
        participants: [topGold],
        icon: '💰',
        teamId: topGold.teamId
      });
    }

    if (topVision) {
      extractedHighlights.push({
        type: 'vision',
        timestamp: gameDuration * 1000 * 0.9,
        title: 'Vision Leader',
        description: `${topVision.championName} provided ${topVision.visionScore} vision score`,
        participants: [topVision],
        icon: '👁️',
        teamId: topVision.teamId
      });
    }

    // Outro slide
    const winningPlayers = participants.filter(p => p.win);
    extractedHighlights.push({
      type: 'outro',
      timestamp: gameDuration * 1000,
      title: 'Match Complete',
      description: `Team ${winningTeam} Victory!`,
      participants: winningPlayers,
      icon: '🏆',
      teamId: winningTeam
    });

    setHighlights(extractedHighlights);
  }, [timeline, participants, matchId, gameDuration, winningTeam]);

  // Auto-play slides
  useEffect(() => {
    if (!isPlaying || highlights.length === 0) return;

    const timer = setTimeout(() => {
      if (currentSlide < highlights.length - 1) {
        setCurrentSlide(currentSlide + 1);
      } else {
        setIsPlaying(false);
      }
    }, 3000); // 3 seconds per slide

    return () => clearTimeout(timer);
  }, [currentSlide, isPlaying, highlights.length]);

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
          timeline: timeline || null,
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
        setShowAiSlide(true);
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

  const startRewind = () => {
    setCurrentSlide(0);
    setIsPlaying(true);
  };

  const nextSlide = () => {
    if (currentSlide < highlights.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const formatTime = (timestamp: number) => {
    const minutes = Math.floor(timestamp / 60000);
    const seconds = Math.floor((timestamp % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (highlights.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading highlights...</p>
        </div>
      </div>
    );
  }

  const currentHighlight = highlights[currentSlide];
  const progress = ((currentSlide + 1) / highlights.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
      </div>

      {/* Controls */}
      <div className="absolute top-8 left-8 right-8 z-20 flex items-center justify-between">
        <div className="text-white text-xl font-bold">Rift Rewind</div>
        <div className="flex items-center space-x-4">
          <button
            onClick={fetchAIAnalysis}
            disabled={aiLoading || !matchData}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white transition-all flex items-center space-x-2"
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
          <button
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white transition-all"
          >
            ← Prev
          </button>
          <div className="text-white text-sm">
            {currentSlide + 1} / {highlights.length}
          </div>
          <button
            onClick={nextSlide}
            disabled={currentSlide === highlights.length - 1}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white transition-all"
          >
            Next →
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="absolute top-20 left-0 right-0 h-1 bg-white/20 z-20">
        <div 
          className="h-full bg-gradient-to-r from-purple-400 to-blue-400 transition-all duration-500"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      {/* Main slide content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-8">
        <div className="w-full max-w-4xl">
          {/* Slide container */}
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-12 border border-white/20 shadow-2xl transition-all duration-500 transform hover:scale-105">
            {/* Icon */}
            <div className="text-center mb-8">
              <div className="text-8xl animate-bounce">{currentHighlight.icon}</div>
            </div>

            {/* Title */}
            <h1 className="text-6xl font-bold text-white text-center mb-6 drop-shadow-lg">
              {currentHighlight.title}
            </h1>

            {/* Description */}
            <p className="text-2xl text-white/90 text-center mb-8">
              {currentHighlight.description}
            </p>

            {/* Time stamp */}
            {currentHighlight.timestamp > 0 && (
              <div className="text-center mb-8">
                <div className="inline-block px-6 py-3 bg-white/20 rounded-full">
                  <span className="text-white text-lg font-semibold">
                    {formatTime(currentHighlight.timestamp)}
                  </span>
                </div>
              </div>
            )}

            {/* Participants */}
            {currentHighlight.participants && currentHighlight.participants.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-8">
                {currentHighlight.participants.slice(0, 5).map((participant, index) => (
                  <div 
                    key={index}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      participant.teamId === 100 
                        ? 'bg-blue-500/30 border-blue-400' 
                        : 'bg-red-500/30 border-red-400'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-xl font-bold text-white mb-1">
                        {participant.championName}
                      </div>
                      <div className="text-sm text-white/80">
                        {participant.summonerName}
                      </div>
                      <div className="text-xs text-white/60 mt-2">
                        {participant.kills}/{participant.deaths}/{participant.assists}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Analysis Modal */}
      {showAiSlide && aiAnalysis && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-8">
          <div className="bg-gradient-to-br from-purple-900 to-blue-900 rounded-3xl p-8 max-w-4xl max-h-[90vh] overflow-y-auto border-2 border-white/20 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="text-4xl">🤖</div>
                <h2 className="text-3xl font-bold text-white">AI Match Analysis</h2>
              </div>
              <button
                onClick={() => setShowAiSlide(false)}
                className="text-white hover:text-gray-300 transition-colors text-2xl"
              >
                ✕
              </button>
            </div>
            <div className="prose prose-invert max-w-none">
              <div className="text-white leading-relaxed">
                {formatAnalysisText(aiAnalysis)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Start button */}
      {!isPlaying && currentSlide === 0 && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-20">
          <button
            onClick={startRewind}
            className="px-12 py-6 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white text-2xl font-bold rounded-full shadow-2xl transition-all transform hover:scale-110"
          >
            Start Rewind
          </button>
        </div>
      )}

      {/* Play/Pause indicator */}
      {isPlaying && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
          <div className="flex items-center space-x-2 text-white/80">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-sm">Playing...</span>
          </div>
        </div>
      )}
    </div>
  );
}

