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

  // Filter events based on selected filter
  const getFilteredEvents = () => {
    if (selectedFilter === 'all') {
      return keyEvents.filter((e) => 
        e.type === 'CHAMPION_KILL' || 
        e.type === 'CHAMPION_SPECIAL_KILL' ||
        e.type === 'ELITE_MONSTER_KILL' || 
        e.type === 'BUILDING_KILL' ||
        e.type === 'DRAGON_SOUL_GIVEN' ||
        e.type === 'TURRET_PLATE_DESTROYED' ||
        e.type === 'OBJECTIVE_BOUNTY_FINISH' ||
        e.type === 'GAME_END'
      );
    }
    return keyEvents.filter((e) => e.type === selectedFilter);
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

