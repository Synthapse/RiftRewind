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
            <div className="text-8xl mb-8 animate-bounce drop-shadow-2xl">⏪</div>
            <h1 className="text-6xl font-bold text-white text-center mb-6 drop-shadow-lg">Performance Rewind</h1>
            <p className="text-2xl text-white/90 text-center mb-4">{playerName}</p>
            <p className="text-xl text-white/60 text-center">Last 5 Matches</p>
          </div>
        );
      
      case 1: // Overall Stats
        return (
          <div className="text-center">
            <div className="text-8xl mb-8 animate-bounce drop-shadow-2xl">📊</div>
            <h1 className="text-6xl font-bold text-white text-center mb-6 drop-shadow-lg">Overall Performance</h1>
            <p className="text-2xl text-white/90 text-center mb-8">
              {aggregatedStats.winRate}% Win Rate • {aggregatedStats.avgKDA} KDA • {aggregatedStats.totalKills} Kills • {aggregatedStats.totalAssists} Assists
            </p>
            <div className="grid grid-cols-3 gap-4 max-w-3xl mx-auto mt-8">
              <div className="bg-[#181818] rounded-lg p-6 border border-gray-800 hover:scale-110 hover:shadow-xl transition-transform">
                <div className="text-3xl font-bold text-white mb-2">{parseInt(aggregatedStats.totalGold).toLocaleString()}</div>
                <div className="text-gray-300">Total Gold</div>
              </div>
              <div className="bg-[#181818] rounded-lg p-6 border border-gray-800 hover:scale-110 hover:shadow-xl transition-transform">
                <div className="text-3xl font-bold text-white mb-2">{parseInt(aggregatedStats.totalCS)}</div>
                <div className="text-gray-300">Total CS</div>
              </div>
              <div className="bg-[#181818] rounded-lg p-6 border border-gray-800 hover:scale-110 hover:shadow-xl transition-transform">
                <div className="text-3xl font-bold text-white mb-2">{parseInt(aggregatedStats.totalDamage).toLocaleString()}</div>
                <div className="text-gray-300">Total Damage</div>
              </div>
            </div>
          </div>
        );
      
      case 2: // Damage Stats
        return (
          <div className="text-center">
            <div className="text-8xl mb-8 animate-bounce drop-shadow-2xl">🔥</div>
            <h1 className="text-6xl font-bold text-white text-center mb-6 drop-shadow-lg">Damage Dealt</h1>
            <p className="text-2xl text-white/90 text-center mb-8">
              {parseInt(aggregatedStats.totalDamage).toLocaleString()} total damage
            </p>
            <div className="bg-[#181818] rounded-lg p-8 border border-gray-800 max-w-2xl mx-auto">
              <div className="text-7xl font-bold text-orange-400 mb-4">{parseInt(aggregatedStats.avgDamage).toLocaleString()}</div>
              <div className="text-2xl text-gray-300">Average per match</div>
            </div>
          </div>
        );
      
      case 3: // Best Champion
        return (
          <div className="text-center">
            <div className="text-8xl mb-8 animate-bounce drop-shadow-2xl">⭐</div>
            <h1 className="text-6xl font-bold text-white text-center mb-6 drop-shadow-lg">Best Champion</h1>
            <p className="text-2xl text-white/90 text-center mb-8">
              {aggregatedStats.bestChampion}
            </p>
            <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mt-8">
              <div className="bg-[#181818] rounded-lg p-6 border border-gray-800 hover:scale-110 hover:shadow-xl transition-transform">
                <div className="text-3xl font-bold text-white mb-2">{aggregatedStats.bestChampionStats.played}</div>
                <div className="text-gray-300">Played</div>
              </div>
              <div className="bg-[#181818] rounded-lg p-6 border border-gray-800 hover:scale-110 hover:shadow-xl transition-transform">
                <div className="text-3xl font-bold text-green-400 mb-2">{aggregatedStats.bestChampionStats.winRate}%</div>
                <div className="text-gray-300">Win Rate</div>
              </div>
              <div className="bg-[#181818] rounded-lg p-6 border border-gray-800 hover:scale-110 hover:shadow-xl transition-transform">
                <div className="text-3xl font-bold text-white mb-2">{aggregatedStats.bestChampionStats.avgKDA}</div>
                <div className="text-gray-300">Avg KDA</div>
              </div>
            </div>
          </div>
        );
      
      case 4: // Champion Pool
        return (
          <div className="text-center">
            <div className="text-8xl mb-8 animate-bounce drop-shadow-2xl">🎮</div>
            <h1 className="text-6xl font-bold text-white text-center mb-6 drop-shadow-lg">Champion Pool</h1>
            <p className="text-2xl text-white/90 text-center mb-8">
              {aggregatedStats.championPool.length} unique champions
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto mt-8">
              {aggregatedStats.championPool.map((champ, idx) => (
                <div key={idx} className="bg-[#181818] rounded-lg p-6 border border-gray-800 hover:scale-110 hover:shadow-xl transition-transform">
                  <div className="text-2xl font-bold text-white mb-2">{champ.champion}</div>
                  <div className="text-sm text-gray-400 mb-3">{champ.played} game{champ.played > 1 ? 's' : ''}</div>
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
            <h1 className="text-6xl font-bold text-white text-center mb-6 drop-shadow-lg">Vision & Utility</h1>
            <p className="text-2xl text-white/90 text-center mb-8">
              {aggregatedStats.firstBloods} first bloods at {aggregatedStats.firstBloodRate}% rate
            </p>
            <div className="grid grid-cols-2 gap-6 max-w-2xl mx-auto mt-8">
              <div className="bg-[#181818] rounded-lg p-6 border border-gray-800 hover:scale-110 hover:shadow-xl transition-transform">
                <div className="text-5xl font-bold text-blue-400 mb-2">{parseInt(aggregatedStats.totalVision).toLocaleString()}</div>
                <div className="text-gray-300">Total Vision Score</div>
                <div className="text-2xl font-semibold text-white mt-4">{parseFloat(aggregatedStats.avgVision).toLocaleString()} avg</div>
              </div>
              <div className="bg-[#181818] rounded-lg p-6 border border-gray-800 hover:scale-110 hover:shadow-xl transition-transform">
                <div className="text-5xl font-bold text-red-400 mb-2">{aggregatedStats.firstBloods}</div>
                <div className="text-gray-300">First Bloods</div>
                <div className="text-2xl font-semibold text-white mt-4">{aggregatedStats.firstBloodRate}% rate</div>
              </div>
            </div>
          </div>
        );
      
      case 6: // Outro
        return (
          <div className="text-center space-y-8">
            <div className="text-8xl mb-8 animate-pulse drop-shadow-2xl">🎉</div>
            <h1 className="text-6xl font-bold text-white text-center mb-6 drop-shadow-lg">Great Performance!</h1>
            <p className="text-2xl text-white/80 text-center mb-4">{aggregatedStats.winRate}% Win Rate</p>
            <p className="text-xl text-white/60 text-center">{aggregatedStats.avgKDA} Average KDA</p>
          </div>
        );
      
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#181818]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300 text-lg">Loading rewind experience...</p>
        </div>
      </div>
    );
  }

  if (error || !aggregatedStats) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#181818]">
        <div className="text-center">
          <div className="text-6xl mb-4">😢</div>
          <h1 className="text-3xl font-bold text-white mb-2">Failed to Load Experience</h1>
          <p className="text-white/80 mb-6">{error || 'No matches found'}</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-[#121212] hover:bg-[#1a1a1a] text-white rounded-lg font-semibold transition-colors border border-gray-800"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const totalSlides = 7;
  const progress = ((currentSlide + 1) / totalSlides) * 100;

  return (
    <div className="min-h-screen bg-[#181818] relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gray-700 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gray-800 rounded-full blur-3xl"></div>
      </div>

      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gray-800 z-20">
        <div 
          className="h-full bg-gray-600 transition-all duration-500"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      {/* Navigation Dots - Bottom Right */}
      <div className="fixed bottom-8 right-8 z-20 flex items-center gap-2">
        {Array.from({ length: totalSlides }).map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setCurrentSlide(index);
              setIsPlaying(false);
            }}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentSlide
                ? 'bg-gray-300 w-3 h-3'
                : 'bg-gray-600 hover:bg-gray-500'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Main slide content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-8">
        <div className="w-full max-w-4xl">
          {/* Slide container */}
          <div
            key={currentSlide}
            className="bg-[#121212] rounded-lg p-12 border border-gray-800 shadow-2xl transition-all duration-500 animate-fadeIn"
          >
            <div className="min-h-[400px] flex items-center justify-center">
              {renderSlide()}
            </div>
          </div>
        </div>
      </div>

      {/* Share Section - Shown after rewind completes - Bottom Left */}
      {showShare && (
        <div className="fixed bottom-8 left-8 z-50 animate-fadeIn">
          <div className="bg-[#121212] rounded-lg p-6 border border-gray-800 shadow-2xl max-w-sm">
            <div className="flex items-center justify-end mb-4">
              <button
                onClick={() => setShowShare(false)}
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
            <div className="mt-4 pt-4 border-t border-gray-800">
              <a
                href={`/widgets-share?type=matches&puuid=${puuid}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full block px-4 py-2 bg-[#1a1a1a] hover:bg-[#222222] text-white rounded-lg font-medium transition-colors text-center border border-gray-800"
              >
                <svg className="w-4 h-4 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Open Widget Page
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Start button */}
      {!isPlaying && currentSlide === 0 && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-20">
          <button
            onClick={startPlayback}
            className="px-12 py-6 bg-[#121212] hover:bg-[#1a1a1a] text-white text-2xl font-bold rounded-lg shadow-2xl transition-all transform hover:scale-110 border border-gray-800"
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

