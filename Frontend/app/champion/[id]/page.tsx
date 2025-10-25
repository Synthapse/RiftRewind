'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Champion, ChampionData } from '@/types/champion';
import Image from 'next/image';
import Link from 'next/link';
import { analyzeChampionWithGemini, ChampionAnalysisData } from '@/lib/gemini';

export default function ChampionDetail() {
  const params = useParams();
  const [champion, setChampion] = useState<Champion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Gemini Analysis states
  const [geminiAnalysis, setGeminiAnalysis] = useState<string | null>(null);
  const [geminiLoading, setGeminiLoading] = useState(false);
  const [geminiError, setGeminiError] = useState<string | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const handleGeminiAnalysis = async () => {
    if (!champion) return;

    try {
      setGeminiLoading(true);
      setGeminiError(null);

      // Create sample match data for analysis (in a real app, this would come from actual match data)
      const analysisData: ChampionAnalysisData = {
        championName: champion.name,
        matchStats: {
          kills: 8,
          deaths: 3,
          assists: 12,
          cs: 180,
          gold: 12000,
          damage: 25000,
          visionScore: 45,
          win: true
        },
        championStats: {
          level: 18,
          position: champion.tags[0] || 'Fighter',
          role: champion.tags[0] || 'Fighter'
        }
      };

      const result = await analyzeChampionWithGemini(analysisData);
      
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

  useEffect(() => {
    const fetchChampion = async () => {
      try {
        setLoading(true);
        const response = await fetch('https://ddragon.leagueoflegends.com/cdn/12.10.1/data/en_US/champion.json');
        if (!response.ok) {
          throw new Error('Failed to fetch champion data');
        }
        const data: ChampionData = await response.json();
        const championData = Object.values(data.data).find(champ => champ.id === params.id);
        
        if (!championData) {
          throw new Error('Champion not found');
        }
        
        setChampion(championData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchChampion();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !champion) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Champion Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <Link 
            href="/" 
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Champions
          </Link>
        </div>
      </div>
    );
  }

  const imageUrl = `https://ddragon.leagueoflegends.com/cdn/12.10.1/img/champion/${champion.image.full}`;
  const splashUrl = `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${champion.id}_0.jpg`;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <Link 
          href="/" 
          className="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mb-6"
        >
          ← Back to Champions
        </Link>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          {/* Hero Section */}
          <div className="relative h-96">
            {/* <Image
              src={splashUrl}
              alt={`${champion.name} splash art`}
              fill
              className="object-cover"
            /> */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
            <div className="absolute bottom-6 left-6 text-white">
              <h1 className="text-4xl font-bold mb-2">{champion.name}</h1>
              <p className="text-xl italic">{champion.title}</p>
            </div>
          </div>

          <div className="p-8">
            {/* Basic Info */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              <div className="lg:col-span-2">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">About</h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {champion.blurb}
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Resource Type</h3>
                  <p className="text-gray-700 dark:text-gray-300">{champion.partype}</p>
                </div>
                
                <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Roles</h3>
                  <div className="flex flex-wrap gap-2">
                    {champion.tags.map((tag, index) => (
                      <span 
                        key={index}
                        className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Base Stats</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                  <h3 className="font-semibold text-red-800 dark:text-red-200 mb-2">Health</h3>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">{champion.stats.hp}</p>
                  <p className="text-sm text-red-600 dark:text-red-400">+{champion.stats.hpperlevel} per level</p>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Mana</h3>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{champion.stats.mp}</p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">+{champion.stats.mpperlevel} per level</p>
                </div>
                
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">Movement Speed</h3>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{champion.stats.movespeed}</p>
                </div>
                
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                  <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Attack Damage</h3>
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{champion.stats.attackdamage}</p>
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">+{champion.stats.attackdamageperlevel} per level</p>
                </div>
                
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                  <h3 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">Armor</h3>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{champion.stats.armor}</p>
                  <p className="text-sm text-purple-600 dark:text-purple-400">+{champion.stats.armorperlevel} per level</p>
                </div>
                
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
                  <h3 className="font-semibold text-indigo-800 dark:text-indigo-200 mb-2">Magic Resist</h3>
                  <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{champion.stats.spellblock}</p>
                  <p className="text-sm text-indigo-600 dark:text-indigo-400">+{champion.stats.spellblockperlevel} per level</p>
                </div>
              </div>
            </div>

            {/* Difficulty and Info */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Attack</h3>
                <div className="flex justify-center space-x-1">
                  {[...Array(10)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-3 h-3 rounded-full ${
                        i < champion.info.attack ? 'bg-red-500' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{champion.info.attack}/10</p>
              </div>
              
              <div className="text-center">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Defense</h3>
                <div className="flex justify-center space-x-1">
                  {[...Array(10)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-3 h-3 rounded-full ${
                        i < champion.info.defense ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{champion.info.defense}/10</p>
              </div>
              
              <div className="text-center">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Magic</h3>
                <div className="flex justify-center space-x-1">
                  {[...Array(10)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-3 h-3 rounded-full ${
                        i < champion.info.magic ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{champion.info.magic}/10</p>
              </div>
              
              <div className="text-center">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Difficulty</h3>
                <div className="flex justify-center space-x-1">
                  {[...Array(10)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-3 h-3 rounded-full ${
                        i < champion.info.difficulty ? 'bg-yellow-500' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{champion.info.difficulty}/10</p>
              </div>
            </div>

            {/* Gemini AI Analysis Section */}
            <div className="mt-8">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-6 border border-purple-200 dark:border-purple-700">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m4.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">AI Strategic Analysis</h2>
                    <p className="text-gray-600 dark:text-gray-400">Get personalized strategy tips powered by Gemini AI</p>
                  </div>
                </div>

                {!showAnalysis && !geminiLoading && (
                  <div className="text-center py-8">
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Get AI-powered strategic analysis and improvement tips for {champion.name}
                    </p>
                    <button
                      onClick={handleGeminiAnalysis}
                      className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 transform hover:scale-105"
                    >
                      Analyze with Gemini AI
                    </button>
                  </div>
                )}

                {geminiLoading && (
                  <div className="text-center py-8">
                    <div className="inline-flex items-center space-x-3">
                      <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-gray-600 dark:text-gray-400">Analyzing with Gemini AI...</span>
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
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Strategic Analysis</h3>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setShowAnalysis(false)}
                          className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        >
                          Hide
                        </button>
                        <button
                          onClick={handleGeminiAnalysis}
                          className="px-3 py-1 text-sm bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
                        >
                          Refresh
                        </button>
                      </div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                      <div className="prose dark:prose-invert max-w-none">
                        <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed">
                          {geminiAnalysis}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                      Analysis generated by Gemini AI • Response saved to file
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
