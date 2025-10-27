'use client';

import { useState } from 'react';

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

interface MatchTimelineProps {
  timeline: TimelineData;
  participants: Array<{
    summonerName: string;
    championName: string;
    teamId: number;
    [key: string]: any; // Allow additional properties
  }>;
}

export default function MatchTimeline({ timeline, participants }: MatchTimelineProps) {
  if (!timeline) return null;

  // Filter state
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [showDetails, setShowDetails] = useState<Record<number, boolean>>({});
  const [selectedChampion, setSelectedChampion] = useState<string>('all');
  const [showKillMap, setShowKillMap] = useState(false);

  // Extract key events from timeline
  const keyEvents: Array<{
    timestamp: number;
    type: string;
    participantId?: number;
    killerId?: number;
    victimId?: number;
    buildingType?: string;
    monsterType?: string;
    itemId?: number;
    level?: number;
    position?: { x: number; y: number };
    skillSlot?: number;
    assistingParticipantIds?: number[];
    killType?: string;
    dragonType?: string;
    afterId?: number;
    beforeId?: number;
    gold?: number;
  }> = [];

  timeline.info.frames.forEach((frame) => {
    frame.events.forEach((event) => {
      if (
        event.type === 'CHAMPION_KILL' ||
        event.type === 'CHAMPION_SPECIAL_KILL' ||
        event.type === 'ELITE_MONSTER_KILL' ||
        event.type === 'BUILDING_KILL' ||
        event.type === 'TURRET_PLATE_DESTROYED' ||
        event.type === 'DRAGON_SOUL_GIVEN' ||
        event.type === 'LEVEL_UP' ||
        event.type === 'WARD_KILL' ||
        event.type === 'OBJECTIVE_BOUNTY_FINISH' ||
        event.type === 'GAME_END'
      ) {
        keyEvents.push({
          timestamp: event.timestamp,
          type: event.type,
          participantId: event.participantId,
          killerId: event.killerId,
          victimId: event.victimId,
          buildingType: event.buildingType,
          monsterType: event.monsterType,
          itemId: event.itemId,
          level: event.level,
          position: event.position,
          skillSlot: event.skillSlot,
          assistingParticipantIds: event.assistingParticipantIds,
          killType: event.killType,
          dragonType: event.dragonType,
          afterId: event.afterId,
          beforeId: event.beforeId,
          gold: event.gold,
        });
      }
    });
  });

  // Group events by time periods (e.g., every 5 minutes)
  const timePeriods: Record<number, typeof keyEvents> = {};
  keyEvents.forEach((event) => {
    const period = Math.floor(event.timestamp / 300000) * 5; // 5-minute periods
    if (!timePeriods[period]) {
      timePeriods[period] = [];
    }
    timePeriods[period].push(event);
  });

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'CHAMPION_KILL':
        return '⚔️';
      case 'CHAMPION_SPECIAL_KILL':
        return '💀';
      case 'ELITE_MONSTER_KILL':
        return '🐉';
      case 'BUILDING_KILL':
        return '🏰';
      case 'TURRET_PLATE_DESTROYED':
        return '💥';
      case 'DRAGON_SOUL_GIVEN':
        return '🌟';
      case 'LEVEL_UP':
        return '⬆️';
      case 'WARD_KILL':
        return '🗡️';
      case 'OBJECTIVE_BOUNTY_FINISH':
        return '💰';
      case 'GAME_END':
        return '🏁';
      default:
        return '📌';
    }
  };

  const getEventDescription = (event: any) => {
    switch (event.type) {
      case 'CHAMPION_KILL':
        const killer = participants[event.killerId - 1];
        const victim = participants[event.victimId - 1];
        const assisters = event.assistingParticipantIds?.map((id: number) => participants[id - 1]?.championName).filter(Boolean) || [];
        const assistText = assisters.length > 0 ? ` (+${assisters.join(', ')})` : '';
        return killer && victim
          ? `${killer.championName} killed ${victim.championName}${assistText}`
          : 'Champion Kill';
      
      case 'CHAMPION_SPECIAL_KILL':
        const specialKiller = participants[event.killerId - 1];
        const killType = event.killType || 'Special Kill';
        return specialKiller ? `${specialKiller.championName} - ${killType}` : killType;
      
      case 'ELITE_MONSTER_KILL':
        const slayer = participants[event.killerId - 1];
        let monster = 'Monster';
        if (event.monsterType === 'DRAGON') {
          monster = event.dragonType || 'Dragon';
        } else if (event.monsterType === 'BARON_NASHOR') {
          monster = 'Baron Nashor';
        } else if (event.monsterType === 'RIFTHERALD') {
          monster = 'Rift Herald';
        }
        return slayer ? `${slayer.championName} killed ${monster}` : `${monster} killed`;
      
      case 'BUILDING_KILL':
        const destroyer = participants[event.killerId - 1];
        let building = 'Building';
        if (event.buildingType === 'TOWER_BUILDING') {
          building = 'Tower';
        } else if (event.buildingType === 'INHIBITOR_BUILDING') {
          building = 'Inhibitor';
        }
        return destroyer ? `${destroyer.championName} destroyed ${building}` : `${building} destroyed`;
      
      case 'TURRET_PLATE_DESTROYED':
        const plateDestroyer = participants[event.participantId - 1];
        return plateDestroyer ? `${plateDestroyer.championName} destroyed turret plate` : 'Turret plate destroyed';
      
      case 'DRAGON_SOUL_GIVEN':
        const soulReceiver = participants[event.teamId === 100 ? 0 : 5];
        return soulReceiver ? `Dragon Soul obtained by ${participants.filter(p => p.teamId === event.teamId).map(p => p.championName).join(', ')}` : 'Dragon Soul obtained';
      
      case 'LEVEL_UP':
        const leveler = participants[event.participantId - 1];
        return leveler ? `${leveler.championName} reached level ${event.level}` : `Level ${event.level}`;
      
      case 'WARD_KILL':
        const wardKiller = participants[event.killerId - 1];
        return wardKiller ? `${wardKiller.championName} killed ward` : 'Ward killed';
      
      case 'OBJECTIVE_BOUNTY_FINISH':
        const bountyTeam = participants.filter(p => p.teamId === event.teamId).map(p => p.championName).join(', ');
        return `Objective bounty completed by ${bountyTeam}`;
      
      case 'GAME_END':
        return 'Game Ended';
      
      default:
        return event.type;
    }
  };

  const formatTime = (timestamp: number) => {
    const minutes = Math.floor(timestamp / 60000);
    const seconds = Math.floor((timestamp % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Get unique champions from kills
  const getChampionsFromKills = () => {
    const champions = new Set<string>();
    keyEvents.forEach((event) => {
      if (event.type === 'CHAMPION_KILL' || event.type === 'CHAMPION_SPECIAL_KILL') {
        if (event.killerId) {
          const killer = participants[event.killerId - 1];
          if (killer) champions.add(killer.championName);
        }
        if (event.victimId) {
          const victim = participants[event.victimId - 1];
          if (victim) champions.add(victim.championName);
        }
      }
    });
    return Array.from(champions).sort();
  };

  // Get kill events with positions
  const getKillEventsWithPositions = () => {
    return keyEvents.filter((event) => 
      (event.type === 'CHAMPION_KILL' || event.type === 'CHAMPION_SPECIAL_KILL') &&
      event.position &&
      event.killerId &&
      event.victimId
    );
  };

  // Filter kills by champion
  const getFilteredKills = () => {
    const killEvents = getKillEventsWithPositions();
    if (selectedChampion === 'all') return killEvents;
    
    return killEvents.filter((event) => {
      const killer = participants[event.killerId! - 1];
      const victim = participants[event.victimId! - 1];
      return killer?.championName === selectedChampion || victim?.championName === selectedChampion;
    });
  };

  // Analyze kill positioning
  const analyzeKillPositions = () => {
    const kills = getFilteredKills();
    if (kills.length === 0) return null;

    // Map dimensions: Summoner's Rift is approximately 14800 x 14800
    const mapWidth = 14800;
    const mapHeight = 14800;
    
    // Analyze by lanes (approximate positions)
    const topLane = kills.filter(k => k.position && k.position.y < mapHeight * 0.3);
    const midLane = kills.filter(k => k.position && k.position.y >= mapHeight * 0.3 && k.position.y < mapHeight * 0.7);
    const botLane = kills.filter(k => k.position && k.position.y >= mapHeight * 0.7);
    
    // Analyze by jungle
    const jungle = kills.filter(k => {
      if (!k.position) return false;
      const x = k.position.x;
      const y = k.position.y;
      // Approximate jungle areas (middle area away from lanes)
      return (x > mapWidth * 0.3 && x < mapWidth * 0.7) || 
             (y > mapHeight * 0.3 && y < mapHeight * 0.7);
    });

    // Find hotspots (areas with multiple kills)
    const hotspots: Array<{x: number, y: number, count: number}> = [];
    const gridSize = 1000; // 1k unit grid
    
    for (let x = 0; x < mapWidth; x += gridSize) {
      for (let y = 0; y < mapHeight; y += gridSize) {
        const killsInArea = kills.filter(k => 
          k.position && 
          k.position.x >= x && k.position.x < x + gridSize &&
          k.position.y >= y && k.position.y < y + gridSize
        );
        if (killsInArea.length >= 2) {
          hotspots.push({
            x: x + gridSize / 2,
            y: y + gridSize / 2,
            count: killsInArea.length
          });
        }
      }
    }
    
    // Important locations on Summoner's Rift
    const importantLocations = [
      { name: 'Blue Nexus', x: 400, y: 400, color: 'blue' },
      { name: 'Mid Lane Center', x: 7500, y: 7500, color: 'yellow' },
      { name: 'Red Nexus', x: 14400, y: 14400, color: 'red' }
    ];

    return {
      total: kills.length,
      topLane: topLane.length,
      midLane: midLane.length,
      botLane: botLane.length,
      jungle: jungle.length,
      hotspots,
      importantLocations
    };
  };

  const positionAnalysis = analyzeKillPositions();

  // Filter events based on selected filter AND champion
  const getFilteredEvents = () => {
    let filtered = keyEvents;
    
    // First filter by event type
    if (selectedFilter === 'all') {
      filtered = keyEvents.filter((e) => 
        e.type === 'CHAMPION_KILL' || 
        e.type === 'CHAMPION_SPECIAL_KILL' ||
        e.type === 'ELITE_MONSTER_KILL' || 
        e.type === 'BUILDING_KILL' ||
        e.type === 'DRAGON_SOUL_GIVEN' ||
        e.type === 'TURRET_PLATE_DESTROYED' ||
        e.type === 'OBJECTIVE_BOUNTY_FINISH' ||
        e.type === 'GAME_END'
      );
    } else {
      filtered = keyEvents.filter((e) => e.type === selectedFilter);
    }
    
    // Then filter by champion if one is selected
    if (selectedChampion !== 'all') {
      filtered = filtered.filter((event) => {
        // Check if the event involves the selected champion
        if (event.killerId) {
          const killer = participants[event.killerId - 1];
          if (killer?.championName === selectedChampion) return true;
        }
        if (event.victimId) {
          const victim = participants[event.victimId - 1];
          if (victim?.championName === selectedChampion) return true;
        }
        if (event.participantId) {
          const participant = participants[event.participantId - 1];
          if (participant?.championName === selectedChampion) return true;
        }
        return false;
      });
    }
    
    return filtered;
  };

  const filteredEvents = getFilteredEvents();

  const toggleDetails = (index: number) => {
    setShowDetails(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Timeline</h3>
      </div>

      {/* Timeline Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Kills</div>
          <div className="text-xl font-semibold text-gray-900 dark:text-white">
            {keyEvents.filter((e) => e.type === 'CHAMPION_KILL').length}
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Special</div>
          <div className="text-xl font-semibold text-gray-900 dark:text-white">
            {keyEvents.filter((e) => e.type === 'CHAMPION_SPECIAL_KILL').length}
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Dragons</div>
          <div className="text-xl font-semibold text-gray-900 dark:text-white">
            {keyEvents.filter((e) => e.type === 'ELITE_MONSTER_KILL' && e.monsterType === 'DRAGON').length}
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Barons</div>
          <div className="text-xl font-semibold text-gray-900 dark:text-white">
            {keyEvents.filter((e) => e.type === 'ELITE_MONSTER_KILL' && e.monsterType === 'BARON_NASHOR').length}
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Towers</div>
          <div className="text-xl font-semibold text-gray-900 dark:text-white">
            {keyEvents.filter((e) => e.type === 'BUILDING_KILL').length}
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Souls</div>
          <div className="text-xl font-semibold text-gray-900 dark:text-white">
            {keyEvents.filter((e) => e.type === 'DRAGON_SOUL_GIVEN').length}
          </div>
        </div>
      </div>

      {/* Champion Filter */}
      <div className="mb-6">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Filter by Champion:
          </label>
          <select
            value={selectedChampion}
            onChange={(e) => setSelectedChampion(e.target.value)}
            className="px-3 py-1.5 rounded-md text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Champions</option>
            {getChampionsFromKills().map((champion) => (
              <option key={champion} value={champion}>
                {champion}
              </option>
            ))}
          </select>
          {selectedChampion !== 'all' && (
            <button
              onClick={() => setSelectedChampion('all')}
              className="px-3 py-1.5 text-sm bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors flex items-center space-x-1"
            >
              <span>✕</span>
              <span>Clear Filter</span>
            </button>
          )}
          <button
            onClick={() => setShowKillMap(!showKillMap)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              showKillMap
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {showKillMap ? 'Hide' : 'Show'} Kill Map
          </button>
        </div>
        {selectedChampion !== 'all' && (
          <div className="mt-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-md">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              🔍 Showing events for <strong>{selectedChampion}</strong> ({filteredEvents.length} events)
            </p>
          </div>
        )}
      </div>

      {/* Kill Position Analysis */}
      {positionAnalysis && showKillMap && (
        <div className="mb-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-700">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Kill Position Analysis {selectedChampion !== 'all' && `- ${selectedChampion}`}
          </h4>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Total Kills</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{positionAnalysis.total}</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Top Lane</div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{positionAnalysis.topLane}</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Mid Lane</div>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{positionAnalysis.midLane}</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Bot Lane</div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{positionAnalysis.botLane}</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Jungle</div>
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{positionAnalysis.jungle}</div>
            </div>
          </div>

          {/* Kill Map Visualization */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Kill Locations</h5>
            <div 
              className="relative mx-auto" 
              style={{ 
                width: '600px', 
                height: '600px',
                backgroundColor: '#718096'
              }}
            >
              {/* Map Background with 10% opacity */}
              <div 
                className="absolute inset-0"
                style={{ 
                  backgroundImage: 'url(https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fwww.gry-online.pl%2Fstatic%2Fmapy%2Fpl%2Fgfx%2Fmap_2413.jpg&f=1&nofb=1&ipt=002c8eb757a872037055ebd8b0fe297797a4ec7dfb8a9d57ca612048f7f16247)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  opacity: 0.25
                }}
              />
              {/* X-Axis Labels */}
              <div className="absolute bottom-0 left-0 right-0 flex justify-between px-1 text-xs text-white/60">
                <span>0</span>
                <span>3700</span>
                <span>7400</span>
                <span>11100</span>
                <span>14800</span>
              </div>
              
              {/* Y-Axis Labels */}
              <div className="absolute top-0 bottom-0 left-0 flex flex-col justify-between py-1 text-xs text-white/60" style={{ writingMode: 'vertical-rl' }}>
                <span>0</span>
                <span>3700</span>
                <span>7400</span>
                <span>11100</span>
                <span>14800</span>
              </div>
              
              {/* Map grid lines */}
              <div className="absolute inset-0 pointer-events-none">
                {/* Horizontal lines */}
                <div className="absolute top-[20%] left-0 right-0 h-px bg-white/20" />
                <div className="absolute top-[40%] left-0 right-0 h-px bg-white/20" />
                <div className="absolute top-[60%] left-0 right-0 h-px bg-white/20" />
                <div className=" dividing-line" style={{ top: '50%', left: 0, right: 0, height: '2px', background: 'rgba(255,255,255,0.4)' }} />
                <div className="absolute top-[80%] left-0 right-0 h-px bg-white/20" />
                
                {/* Vertical lines */}
                <div className="absolute left-[20%] top-0 bottom-0 w-px bg-white/20" />
                <div className=" dividing-line" style={{ left: '50%', top: 0, bottom: 0, width: '2px', background: 'rgba(255,255,255,0.4)' }} />
                <div className="absolute left-[80%] top-0 bottom-0 w-px bg-white/20" />
              </div>
              
              {/* Kill/Death Icons with hover info */}
              {getFilteredKills().map((kill, index) => {
                if (!kill.position) return null;
                const x = (kill.position.x / 14800) * 100;
                const y = 100 - (kill.position.y / 14800) * 100; // Flip Y axis for correct map orientation
                const killer = participants[kill.killerId! - 1];
                const victim = participants[kill.victimId! - 1];
                
                // Determine color based on killer's team - make dots
                const teamColor = killer?.teamId === 100 
                  ? 'bg-blue-500 border-blue-300' 
                  : killer?.teamId === 200 
                    ? 'bg-red-500 border-red-300' 
                    : 'bg-gray-500 border-gray-300';
                
                const formatTime = (timestamp: number) => {
                  const minutes = Math.floor(timestamp / 60000);
                  const seconds = Math.floor((timestamp % 60000) / 1000);
                  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
                };
                
                return (
                  <div
                    key={index}
                    className="group absolute cursor-pointer z-10"
                    style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
                  >
                    {/* Colored dot representing the kill */}
                    <div className={`w-4 h-4 ${teamColor} rounded-full border-2 shadow-lg transform group-hover:scale-150 transition-transform`} />
                    
                    {/* Hover tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 whitespace-nowrap">
                      <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl border border-gray-700">
                        <div className="font-semibold mb-1">{formatTime(kill.timestamp)}</div>
                        <div className="flex items-center space-x-1">
                          <span className="text-blue-400">{killer?.championName}</span>
                          <span className="text-gray-400">killed</span>
                          <span className="text-red-400">{victim?.championName}</span>
                        </div>
                        <div className="text-gray-400 text-[10px] mt-1">
                          X: {Math.round(kill.position.x)}, Y: {Math.round(kill.position.y)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex items-center justify-center space-x-4 text-xs text-gray-600 dark:text-gray-400">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-blue-500 rounded-full border border-blue-300"></div>
                <span>Team 100 Kills</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-red-500 rounded-full border border-red-300"></div>
                <span>Team 200 Kills</span>
              </div>
            </div>
          </div>

          {/* Hotspots */}
          {positionAnalysis.hotspots.length > 0 && (
            <div className="mt-4 bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Kill Hotspots</h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {positionAnalysis.hotspots.slice(0, 6).map((hotspot, index) => (
                  <div key={index} className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 border border-orange-200 dark:border-orange-700">
                    <div className="text-xs font-medium text-orange-700 dark:text-orange-300 mb-1">
                      Hotspot #{index + 1}
                    </div>
                    <div className="text-sm font-bold text-orange-900 dark:text-orange-100">
                      {hotspot.count} kills
                    </div>
                    <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                      X: {Math.round(hotspot.x)}, Y: {Math.round(hotspot.y)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filter Buttons */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              selectedFilter === 'all'
                ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setSelectedFilter('CHAMPION_KILL')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              selectedFilter === 'CHAMPION_KILL'
                ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Kills
          </button>
          <button
            onClick={() => setSelectedFilter('CHAMPION_SPECIAL_KILL')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              selectedFilter === 'CHAMPION_SPECIAL_KILL'
                ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Special
          </button>
          <button
            onClick={() => setSelectedFilter('ELITE_MONSTER_KILL')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              selectedFilter === 'ELITE_MONSTER_KILL'
                ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Monsters
          </button>
          <button
            onClick={() => setSelectedFilter('BUILDING_KILL')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              selectedFilter === 'BUILDING_KILL'
                ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Buildings
          </button>
          <button
            onClick={() => setSelectedFilter('DRAGON_SOUL_GIVEN')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              selectedFilter === 'DRAGON_SOUL_GIVEN'
                ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Souls
          </button>
          <button
            onClick={() => setSelectedFilter('OBJECTIVE_BOUNTY_FINISH')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              selectedFilter === 'OBJECTIVE_BOUNTY_FINISH'
                ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Bounties
          </button>
        </div>
      </div>

      {/* Key Events Timeline */}
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
            Key Events ({filteredEvents.length})
          </h4>
        </div>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredEvents
            .slice(0, 100)
            .map((event, index) => {
              const participant = event.killerId ? participants[event.killerId - 1] : null;
              const teamColor = participant?.teamId === 100 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400';

              const isExpanded = showDetails[index];
              
              return (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                >
                  <div
                    className="flex items-center space-x-3 p-3 cursor-pointer"
                    onClick={() => toggleDetails(index)}
                  >
                    <div className="flex-shrink-0 w-16 text-center">
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400">{formatTime(event.timestamp)}</div>
                    </div>
                    <div className="flex-shrink-0 text-lg">{getEventIcon(event.type)}</div>
                    <div className="flex-1">
                      <div className="text-sm text-gray-900 dark:text-white">{getEventDescription(event)}</div>
                    </div>
                    <div className="flex-shrink-0">
                      <svg 
                        className={`w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="px-3 pb-3 pt-0 border-t border-gray-200 dark:border-gray-600">
                      <div className="grid grid-cols-2 gap-4 mt-3 text-xs">
                        <div>
                          <div className="font-semibold text-gray-700 dark:text-gray-300 mb-1">Event Details</div>
                          <div className="space-y-1 text-gray-600 dark:text-gray-400">
                            <div>Type: <span className="font-medium">{event.type}</span></div>
                            {event.killerId && <div>Killer ID: <span className="font-medium">{event.killerId}</span></div>}
                            {event.victimId && <div>Victim ID: <span className="font-medium">{event.victimId}</span></div>}
                            {event.participantId && <div>Participant ID: <span className="font-medium">{event.participantId}</span></div>}
                            {event.monsterType && <div>Monster: <span className="font-medium">{event.monsterType}</span></div>}
                            {event.dragonType && <div>Dragon Type: <span className="font-medium">{event.dragonType}</span></div>}
                            {event.buildingType && <div>Building: <span className="font-medium">{event.buildingType}</span></div>}
                            {event.killType && <div>Kill Type: <span className="font-medium">{event.killType}</span></div>}
                            {event.gold && <div>Gold Awarded: <span className="font-medium">{event.gold}</span></div>}
                          </div>
                        </div>
                        {event.position && (
                          <div>
                            <div className="font-semibold text-gray-700 dark:text-gray-300 mb-1">Position</div>
                            <div className="space-y-1 text-gray-600 dark:text-gray-400">
                              <div>X: <span className="font-medium">{Math.round(event.position.x)}</span></div>
                              <div>Y: <span className="font-medium">{Math.round(event.position.y)}</span></div>
                            </div>
                          </div>
                        )}
                        {event.assistingParticipantIds && event.assistingParticipantIds.length > 0 && (
                          <div className="col-span-2">
                            <div className="font-semibold text-gray-700 dark:text-gray-300 mb-1">Assists</div>
                            <div className="text-gray-600 dark:text-gray-400">
                              {event.assistingParticipantIds.map((id, idx) => {
                                const assister = participants[id - 1];
                                return assister ? (
                                  <span key={idx} className="mr-2">
                                    {assister.championName} ({id})
                                  </span>
                                ) : null;
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>

      {/* Game Phases */}
      <div className="mt-6">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Game Phases</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {Object.keys(timePeriods)
            .map(Number)
            .sort((a, b) => a - b)
            .slice(0, 4)
            .map((period) => (
              <div key={period} className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-md p-3">
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {period}-{period + 5} min
                </div>
                <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                  <div>Kills: {timePeriods[period].filter((e) => e.type === 'CHAMPION_KILL').length}</div>
                  <div>Dragons: {timePeriods[period].filter((e) => e.type === 'ELITE_MONSTER_KILL' && e.monsterType === 'DRAGON').length}</div>
                  <div>Towers: {timePeriods[period].filter((e) => e.type === 'BUILDING_KILL').length}</div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

