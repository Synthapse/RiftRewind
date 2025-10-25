'use client';

import { useState, useEffect } from 'react';
import { analyzeMatchWithGemini, MatchAnalysisData } from '@/lib/gemini';

interface MatchData {
  metadata: {
    matchId: string;
  };
  info: {
    gameDuration: number;
    gameMode: string;
    queueId: number;
    participants: {
      teamId: number;
      win: boolean;
      championName: string;
      summonerName: string;
      kills: number;
      deaths: number;
      assists: number;
      totalMinionsKilled: number;
      goldEarned: number;
      totalDamageDealtToChampions: number;
      visionScore: number;
      champLevel: number;
      teamPosition: string;
    }[];
    teams: {
      teamId: number;
      win: boolean;
      baronKills: number;
      dragonKills: number;
      riftHeraldKills: number;
      towerKills: number;
    }[];
  };
}

interface MatchAnalyzerProps {
  matchData?: MatchData | null;
}

export default function MatchAnalyzer({ matchData }: MatchAnalyzerProps) {
  const [geminiAnalysis, setGeminiAnalysis] = useState<string | null>(null);
  const [geminiLoading, setGeminiLoading] = useState(false);
  const [geminiError, setGeminiError] = useState<string | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const handleGeminiAnalysis = async () => {
    if (!matchData) return;

    try {
      setGeminiLoading(true);
      setGeminiError(null);

      // Transform match data for Gemini analysis
      const analysisData: MatchAnalysisData = {
        matchId: matchData.metadata.matchId,
        gameDuration: matchData.info.gameDuration,
        gameMode: matchData.info.gameMode,
        queueId: matchData.info.queueId,
        teams: matchData.info.participants.reduce((acc, participant) => {
          let team = acc.find(t => t.teamId === participant.teamId);
          if (!team) {
            team = {
              teamId: participant.teamId,
              win: participant.win,
              participants: []
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
            position: participant.teamPosition
          });
          return acc;
        }, [] as any[]),
        objectives: {
          baronKills: matchData.info.teams[0]?.baronKills || 0,
          dragonKills: matchData.info.teams[0]?.dragonKills || 0,
          riftHeraldKills: matchData.info.teams[0]?.riftHeraldKills || 0,
          towerKills: matchData.info.teams[0]?.towerKills || 0
        }
      };

      const result = await analyzeMatchWithGemini(analysisData);
      
      if (result.success && result.content) {
        setGeminiAnalysis(result.content);
        setShowAnalysis(true);
      } else {
        setGeminiError(result.error || 'Failed to get analysis');
      }
    } catch (error) {
      setGeminiError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setGeminiLoading(false);
    }
  };

  // Reset analysis when match data changes
  useEffect(() => {
    if (matchData) {
      setGeminiAnalysis(null);
      setShowAnalysis(false);
      setGeminiError(null);
    }
  }, [matchData]);

  if (!matchData) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-700">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Match Analyzer</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Load a match first to get AI-powered strategic analysis
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-700">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">AI Match Analysis</h2>
          <p className="text-gray-600 dark:text-gray-400">Get comprehensive strategic insights powered by Gemini AI</p>
        </div>
      </div>

      {!showAnalysis && !geminiLoading && (
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Analyze this match with AI to get strategic insights, team composition analysis, and key performance indicators
          </p>
          <button
            onClick={handleGeminiAnalysis}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 transform hover:scale-105"
          >
            Analyze Match with Gemini AI
          </button>
        </div>
      )}

      {geminiLoading && (
        <div className="text-center py-8">
          <div className="inline-flex items-center space-x-3">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-600 dark:text-gray-400">Analyzing match with Gemini AI...</span>
          </div>
        </div>
      )}

      {geminiError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-700 dark:text-red-300 font-medium">Analysis Error</span>
          </div>
          <p className="text-red-600 dark:text-red-400 mt-1">{geminiError}</p>
          <button
            onClick={handleGeminiAnalysis}
            className="mt-3 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {geminiAnalysis && showAnalysis && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Match Analysis</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowAnalysis(false)}
                className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Hide
              </button>
              <button
                onClick={handleGeminiAnalysis}
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="prose dark:prose-invert max-w-none">
              <div className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {geminiAnalysis.split('\n').map((line, index) => {
                  // Handle headers
                  if (line.startsWith('# ')) {
                    return (
                      <h1 key={index} className="text-4xl font-bold text-gray-900 dark:text-white mb-6 mt-8">
                        {line.substring(2)}
                      </h1>
                    );
                  }
                  if (line.startsWith('## ')) {
                    return (
                      <h2 key={index} className="text-4xl font-bold text-gray-900 dark:text-white mb-4 mt-6">
                        {line.substring(3)}
                      </h2>
                    );
                  }
                  if (line.startsWith('### ')) {
                    return (
                      <h3 key={index} className="text-3xl font-semibold text-gray-900 dark:text-white mb-3 mt-4">
                        {line.substring(4)}
                      </h3>
                    );
                  }
                  // Handle bold text
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
                  // Handle bullet points
                  if (line.startsWith('- ')) {
                    return (
                      <li key={index} className="ml-6 mb-1 list-disc">
                        {line.substring(2)}
                      </li>
                    );
                  }
                  // Handle empty lines
                  if (line.trim() === '') {
                    return <br key={index} />;
                  }
                  // Handle regular paragraphs
                  return (
                    <p key={index} className="mb-4">
                      {line}
                    </p>
                  );
                })}
              </div>
            </div>
          </div>
          
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Analysis generated by Gemini AI • Response saved to file
          </div>
        </div>
      )}
    </div>
  );
}
