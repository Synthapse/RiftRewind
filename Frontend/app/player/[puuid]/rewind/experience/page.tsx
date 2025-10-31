'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { RIOT_API_CONFIG } from '@/lib/config';
import RewindShare from '@/components/RewindShare';

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

interface AggregatedStats {
  totalKills: number;
  totalDeaths: number;
  totalAssists: number;
  avgKDA: string;
  winRate: string;
  totalDamage: number | string | any;
  avgDamage: number | string | any;
  totalVision: number | string | any; 
  avgVision: number | string | any;
  totalGold: number | string | any;
  avgGold: number | string | any;
  totalCS: number | string | any;
  avgCS: number | string; 
  bestChampion: string;
  bestChampionStats: { played: number; wins: number; winRate: string; avgKDA: string };
  championPool: Array<{ champion: string; played: number; wins: number; winRate: string; avgKDA: string }>;
  firstBloods: number;
  firstBloodRate: string;
}

export default function PlayerRewindExperiencePage() {
  const params = useParams();
  const router = useRouter();
  const puuid = params.puuid as string;
  
  const [playerName, setPlayerName] = useState<string>('');
  const [matches, setMatches] = useState<MatchSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aggregatedStats, setAggregatedStats] = useState<AggregatedStats | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showShare, setShowShare] = useState(false);
  
  const API_KEY = RIOT_API_CONFIG.API_KEY;

  useEffect(() => {
    const fetchMatchesAndCalculateStats = async () => {
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
        
        // Calculate aggregated statistics
        const totalKills = matchesData.reduce((sum, m) => sum + m.kills, 0);
        const totalDeaths = matchesData.reduce((sum, m) => sum + m.deaths, 0);
        const totalAssists = matchesData.reduce((sum, m) => sum + m.assists, 0);
        const avgKDA = totalDeaths > 0 ? ((totalKills + totalAssists) / totalDeaths).toFixed(2) : '0.00';
        const wins = matchesData.filter(m => m.win).length;
        const winRate = ((wins / matchesData.length) * 100).toFixed(0);
        
        // Fetch detailed match data for advanced stats
        const detailedMatchesData = [];
        for (const match of matchesData) {
          const matchUrl = `https://${RIOT_API_CONFIG.REGION}.api.riotgames.com/lol/match/v5/matches/${match.matchId}?api_key=${API_KEY}`;
          const matchResponse = await fetch(matchUrl);
          
          if (matchResponse.ok) {
            const matchData = await matchResponse.json();
            detailedMatchesData.push(matchData);
          }
        }
        
        // Get detailed stats from all matches
        let totalDamage = 0;
        let totalVision = 0;
        let totalGold = 0;
        let totalCS = 0;
        let firstBloods = 0;
        
        const championStats: Record<string, { played: number; wins: number; avgKDA: number; totalDamage: number; totalVision: number }> = {};
        
        detailedMatchesData.forEach((match: any) => {
          const player = match.info.participants.find((p: any) => p.puuid === puuid);
          if (player) {
            totalDamage += player.totalDamageDealtToChampions || 0;
            totalVision += player.visionScore || 0;
            totalGold += player.goldEarned || 0;
            totalCS += player.totalMinionsKilled || 0;
            if (player.firstBloodKill) firstBloods++;
            
            const champ = player.championName;
            if (!championStats[champ]) {
              championStats[champ] = { played: 0, wins: 0, avgKDA: 0, totalDamage: 0, totalVision: 0 };
            }
            championStats[champ].played++;
            if (player.win) championStats[champ].wins++;
            championStats[champ].avgKDA += (player.kills + player.assists) / (player.deaths || 1);
            championStats[champ].totalDamage += player.totalDamageDealtToChampions || 0;
            championStats[champ].totalVision += player.visionScore || 0;
          }
        });
        
        const championPool = Object.entries(championStats).map(([champ, stats]) => ({
          champion: champ,
          played: stats.played,
          wins: stats.wins,
          winRate: ((stats.wins / stats.played) * 100).toFixed(0),
          avgKDA: (stats.avgKDA / stats.played).toFixed(2)
        }));
        
        const bestChampion = championPool.reduce((best, champ) => {
          if (best === null) return champ;
          const bestWinRate = parseFloat(best.winRate);
          const champWinRate = parseFloat(champ.winRate);
          if (champWinRate > bestWinRate) return champ;
          if (champWinRate === bestWinRate && parseFloat(champ.avgKDA) > parseFloat(best.avgKDA)) return champ;
          return best;
        }, championPool[0] || null);
        
        setAggregatedStats({
          totalKills,
          totalDeaths,
          totalAssists,
          avgKDA,
          winRate,
          totalDamage,
          avgDamage: (totalDamage / matchesData.length).toFixed(0),
          totalVision,
          avgVision: (totalVision / matchesData.length).toFixed(1),
          totalGold,
          avgGold: (totalGold / matchesData.length).toFixed(0),
          totalCS,
          avgCS: (totalCS / matchesData.length).toFixed(1),
          bestChampion: bestChampion?.champion || 'Unknown',
          bestChampionStats: bestChampion || { played: 0, wins: 0, winRate: '0', avgKDA: '0.00' },
          championPool,
          firstBloods,
          firstBloodRate: ((firstBloods / matchesData.length) * 100).toFixed(0)
        });
      } catch (error) {
        console.error('Error fetching player matches:', error);
        setError('Failed to fetch player match history.');
      } finally {
        setLoading(false);
      }
    };

    fetchMatchesAndCalculateStats();
  }, [puuid, API_KEY]);

  useEffect(() => {
    if (!isPlaying || currentSlide >= 7) return;
    
    const timer = setTimeout(() => {
      if (currentSlide < 6) {
        setCurrentSlide(currentSlide + 1);
      } else {
        setIsPlaying(false);
        setShowShare(true);
      }
    }, 3000); // 3 seconds per slide
    
    return () => clearTimeout(timer);
  }, [currentSlide, isPlaying, router]);

  const startPlayback = () => {
    setCurrentSlide(0);
    setIsPlaying(true);
  };

  const stopPlayback = () => {
    setIsPlaying(false);
  };

  const nextSlide = () => {
    if (currentSlide < 6) {
      setCurrentSlide(currentSlide + 1);
    } else {
      stopPlayback();
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const renderSlide = () => {
    if (!aggregatedStats) return null;
    
    switch (currentSlide) {
      case 0: // Intro
        return (
          <div className="text-center">
            <div className="text-8xl mb-8 animate-bounce">⏪</div>
            <h2 className="text-6xl font-bold text-white mb-6">Performance Rewind</h2>
            <p className="text-2xl text-white/80 mb-4">{playerName}</p>
            <p className="text-xl text-white/60">Last 5 Matches</p>
          </div>
        );
      
      case 1: // Overall Stats
        return (
          <div className="text-center">
            <div className="text-8xl mb-8 animate-bounce drop-shadow-2xl">📊</div>
            <h2 className="text-6xl font-bold text-white mb-6 drop-shadow-lg">Overall Performance</h2>
            <p className="text-2xl text-white/90 mb-8">
              {aggregatedStats.winRate}% Win Rate • {aggregatedStats.avgKDA} KDA • {aggregatedStats.totalKills} Kills • {aggregatedStats.totalAssists} Assists
            </p>
            <div className="grid grid-cols-3 gap-4 max-w-3xl mx-auto mt-8">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 border border-white/30 hover:scale-110 hover:shadow-xl transition-transform">
                <div className="text-3xl font-bold text-white mb-2">{parseInt(aggregatedStats.totalGold).toLocaleString()}</div>
                <div className="text-white/80">Total Gold</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 border border-white/30 hover:scale-110 hover:shadow-xl transition-transform">
                <div className="text-3xl font-bold text-white mb-2">{parseInt(aggregatedStats.totalCS)}</div>
                <div className="text-white/80">Total CS</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 border border-white/30 hover:scale-110 hover:shadow-xl transition-transform">
                <div className="text-3xl font-bold text-white mb-2">{parseInt(aggregatedStats.totalDamage).toLocaleString()}</div>
                <div className="text-white/80">Total Damage</div>
              </div>
            </div>
          </div>
        );
      
      case 2: // Damage Stats
        return (
          <div className="text-center">
            <div className="text-8xl mb-8 animate-bounce drop-shadow-2xl">🔥</div>
            <h2 className="text-6xl font-bold text-white mb-6 drop-shadow-lg">Damage Dealt</h2>
            <p className="text-2xl text-white/90 mb-8">
              {parseInt(aggregatedStats.totalDamage).toLocaleString()} total damage
            </p>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-8 border border-white/30 max-w-2xl mx-auto">
              <div className="text-7xl font-bold text-orange-400 mb-4">{parseInt(aggregatedStats.avgDamage).toLocaleString()}</div>
              <div className="text-2xl text-white/80">Average per match</div>
            </div>
          </div>
        );
      
      case 3: // Best Champion
        return (
          <div className="text-center">
            <div className="text-8xl mb-8 animate-bounce drop-shadow-2xl">⭐</div>
            <h2 className="text-6xl font-bold text-white mb-6 drop-shadow-lg">Best Champion</h2>
            <p className="text-2xl text-white/90 mb-8">
              {aggregatedStats.bestChampion}
            </p>
            <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mt-8">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 border border-white/30 hover:scale-110 hover:shadow-xl transition-transform">
                <div className="text-3xl font-bold text-white mb-2">{aggregatedStats.bestChampionStats.played}</div>
                <div className="text-white/80">Played</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 border border-white/30 hover:scale-110 hover:shadow-xl transition-transform">
                <div className="text-3xl font-bold text-green-400 mb-2">{aggregatedStats.bestChampionStats.winRate}%</div>
                <div className="text-white/80">Win Rate</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 border border-white/30 hover:scale-110 hover:shadow-xl transition-transform">
                <div className="text-3xl font-bold text-white mb-2">{aggregatedStats.bestChampionStats.avgKDA}</div>
                <div className="text-white/80">Avg KDA</div>
              </div>
            </div>
          </div>
        );
      
      case 4: // Champion Pool
        return (
          <div className="text-center">
            <div className="text-8xl mb-8 animate-bounce drop-shadow-2xl">🎮</div>
            <h2 className="text-6xl font-bold text-white mb-6 drop-shadow-lg">Champion Pool</h2>
            <p className="text-2xl text-white/90 mb-8">
              {aggregatedStats.championPool.length} unique champions
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto mt-8">
              {aggregatedStats.championPool.map((champ, idx) => (
                <div key={idx} className="bg-white/20 backdrop-blur-sm rounded-xl p-6 border border-white/30 hover:scale-110 hover:shadow-xl transition-transform">
                  <div className="text-2xl font-bold text-white mb-2">{champ.champion}</div>
                  <div className="text-sm text-white/80 mb-3">{champ.played} game{champ.played > 1 ? 's' : ''}</div>
                  <div className="flex justify-between text-sm">
                    <span className="text-green-400 font-semibold">{champ.winRate}% WR</span>
                    <span className="text-white font-semibold">{champ.avgKDA} KDA</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      
      case 5: // Vision & Utility
        return (
          <div className="text-center">
            <div className="text-8xl mb-8 animate-bounce drop-shadow-2xl">👁️</div>
            <h2 className="text-6xl font-bold text-white mb-6 drop-shadow-lg">Vision & Utility</h2>
            <p className="text-2xl text-white/90 mb-8">
              {aggregatedStats.firstBloods} first bloods at {aggregatedStats.firstBloodRate}% rate
            </p>
            <div className="grid grid-cols-2 gap-6 max-w-2xl mx-auto mt-8">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 border border-white/30 hover:scale-110 hover:shadow-xl transition-transform">
                <div className="text-5xl font-bold text-blue-400 mb-2">{parseInt(aggregatedStats.totalVision).toLocaleString()}</div>
                <div className="text-white/80">Total Vision Score</div>
                <div className="text-2xl font-semibold text-white mt-4">{parseFloat(aggregatedStats.avgVision).toLocaleString()} avg</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 border border-white/30 hover:scale-110 hover:shadow-xl transition-transform">
                <div className="text-5xl font-bold text-red-400 mb-2">{aggregatedStats.firstBloods}</div>
                <div className="text-white/80">First Bloods</div>
                <div className="text-2xl font-semibold text-white mt-4">{aggregatedStats.firstBloodRate}% rate</div>
              </div>
            </div>
          </div>
        );
      
      case 6: // Outro
        return (
          <div className="text-center space-y-8">
            <div className="text-8xl mb-8 animate-pulse">🎉</div>
            <h2 className="text-6xl font-bold text-white mb-6">Great Performance!</h2>
            <p className="text-2xl text-white/80 mb-4">{aggregatedStats.winRate}% Win Rate</p>
            <p className="text-xl text-white/60">{aggregatedStats.avgKDA} Average KDA</p>
          </div>
        );
      
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading rewind experience...</p>
        </div>
      </div>
    );
  }

  if (error || !aggregatedStats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😢</div>
          <h1 className="text-3xl font-bold text-white mb-2">Failed to Load Experience</h1>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
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

          {/* Rewind Slides */}
          <div className="mb-12">
            <div 
              key={currentSlide}
              className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 backdrop-blur-sm rounded-2xl border-2 border-white/20 p-12 shadow-2xl animate-fadeIn"
            >
              <div className="min-h-[400px] flex items-center justify-center">
                {renderSlide()}
              </div>
              
              {/* Controls */}
              <div className="mt-8 flex items-center justify-center gap-4">
                <button
                  onClick={prevSlide}
                  disabled={currentSlide === 0}
                  className="p-3 bg-white/20 hover:bg-white/30 disabled:bg-white/10 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                {!isPlaying ? (
                  <button
                    onClick={startPlayback}
                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg font-medium transition-colors"
                  >
                    ▶️ Play
                  </button>
                ) : (
                  <button
                    onClick={stopPlayback}
                    className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-lg font-medium transition-colors"
                  >
                    ⏸️ Pause
                  </button>
                )}
                
                <button
                  onClick={nextSlide}
                  disabled={currentSlide >= 6}
                  className="p-3 bg-white/20 hover:bg-white/30 disabled:bg-white/10 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              
              {/* Progress */}
              <div className="mt-6">
                <div className="flex justify-between text-white/60 text-sm mb-2">
                  <span>Slide {currentSlide + 1} of 7</span>
                  <span>{Math.round(((currentSlide + 1) / 7) * 100)}%</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((currentSlide + 1) / 7) * 100}%` }}
                  />
                </div>
              </div>

            </div>
          </div>

          {/* Share Section - Shown after rewind completes */}
          {showShare && (
            <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 animate-fadeIn">
              <div className="bg-gradient-to-br from-purple-900/95 to-blue-900/95 backdrop-blur-lg rounded-2xl p-6 border-2 border-white/30 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white text-xl font-bold">Share This Rewind</h3>
                  <button
                    onClick={() => router.push(`/player/${puuid}/rewind`)}
                    className="text-white/60 hover:text-white transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <RewindShare 
                  title={`${playerName}'s Performance Rewind`}
                  description={aggregatedStats ? `Win Rate: ${aggregatedStats.winRate}% • KDA: ${aggregatedStats.avgKDA}` : 'Last 5 matches performance'}
                />
              </div>
            </div>
          )}

          {/* Back Button */}
          <div className="text-center">
            <button
              onClick={() => router.push(`/player/${puuid}/rewind`)}
              className="px-8 py-3 bg-white/20 hover:bg-white/30 text-white rounded-lg font-semibold transition-colors"
            >
              Back to Player Rewind
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

