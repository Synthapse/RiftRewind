'use client';

import { useState } from 'react';
import MatchDataWidget from '@/components/widgets/MatchDataWidget';
import PlayerPerformanceWidget from '@/components/widgets/PlayerPerformanceWidget';
import Player5MatchesWidget from '@/components/widgets/Player5MatchesWidget';

export default function WidgetsPage() {
  const [activeTab, setActiveTab] = useState<'match' | 'player' | 'matches'>('match');
  const [matchId, setMatchId] = useState('EUN1_3849902044');
  const [puuid, setPuuid] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const getBaseUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return 'https://your-domain.com';
  };

  const getMatchIframeCode = () => {
    const url = `${getBaseUrl()}/embed/match/${matchId}`;
    return `<iframe src="${url}" width="400" height="600" frameborder="0" allowtransparency="true" allow="encrypted-media"></iframe>`;
  };

  const getPlayerIframeCode = () => {
    const url = `${getBaseUrl()}/embed/player/${puuid}`;
    return `<iframe src="${url}" width="400" height="600" frameborder="0" allowtransparency="true" allow="encrypted-media"></iframe>`;
  };

  const getPlayer5MatchesIframeCode = () => {
    const url = `${getBaseUrl()}/embed/player/${puuid}/matches`;
    return `<iframe src="${url}" width="400" height="700" frameborder="0" allowtransparency="true" allow="encrypted-media"></iframe>`;
  };

  const handleCopy = async (code: string, type: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShareOnX = (type: string) => {
    let url = '';
    let text = '';

    if (type === 'match') {
      url = `${getBaseUrl()}/embed/match/${matchId}`;
      text = `Check out this League of Legends match! ${matchId}`;
    } else if (type === 'player') {
      url = `${getBaseUrl()}/embed/player/${puuid}`;
      text = `Check out this player's performance!`;
    } else if (type === 'matches') {
      url = `${getBaseUrl()}/embed/player/${puuid}/matches`;
      text = `Check out this player's last 5 matches!`;
    }

    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, '_blank', 'width=550,height=420');
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">League of Legends Widgets</h1>
          <p className="text-gray-400">Create embeddable widgets for matches and player data</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-800">
          <button
            onClick={() => setActiveTab('match')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'match'
                ? 'border-b-2 border-green-500 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Match Widget
          </button>
          <button
            onClick={() => setActiveTab('player')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'player'
                ? 'border-b-2 border-green-500 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Player Performance Widget
          </button>
          <button
            onClick={() => setActiveTab('matches')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'matches'
                ? 'border-b-2 border-green-500 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Player 5 Matches Widget
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Preview */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Preview</h2>
            <div className="bg-[#121212] rounded-lg p-6 border border-gray-800">
              {activeTab === 'match' && (
                <div className="space-y-4">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Match ID
                    </label>
                    <input
                      type="text"
                      value={matchId}
                      onChange={(e) => setMatchId(e.target.value)}
                      className="w-full px-4 py-2 bg-[#181818] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="EUN1_3849902044"
                    />
                  </div>
                  {matchId && <MatchDataWidget matchId={matchId} />}
                </div>
              )}

              {activeTab === 'player' && (
                <div className="space-y-4">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Player PUUID
                    </label>
                    <input
                      type="text"
                      value={puuid}
                      onChange={(e) => setPuuid(e.target.value)}
                      className="w-full px-4 py-2 bg-[#181818] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Enter player PUUID"
                    />
                  </div>
                  {puuid && <PlayerPerformanceWidget puuid={puuid} />}
                </div>
              )}

              {activeTab === 'matches' && (
                <div className="space-y-4">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Player PUUID
                    </label>
                    <input
                      type="text"
                      value={puuid}
                      onChange={(e) => setPuuid(e.target.value)}
                      className="w-full px-4 py-2 bg-[#181818] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Enter player PUUID"
                    />
                  </div>
                  {puuid && <Player5MatchesWidget puuid={puuid} />}
                </div>
              )}
            </div>
          </div>

          {/* Code */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Embed Code</h2>
            <div className="bg-[#121212] rounded-lg p-6 border border-gray-800 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Iframe Code
                </label>
                <textarea
                  readOnly
                  value={
                    activeTab === 'match'
                      ? getMatchIframeCode()
                      : activeTab === 'player'
                      ? getPlayerIframeCode()
                      : getPlayer5MatchesIframeCode()
                  }
                  className="w-full px-4 py-2 bg-[#181818] border border-gray-700 rounded-lg text-white font-mono text-sm h-32 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() =>
                    handleCopy(
                      activeTab === 'match'
                        ? getMatchIframeCode()
                        : activeTab === 'player'
                        ? getPlayerIframeCode()
                        : getPlayer5MatchesIframeCode(),
                      activeTab
                    )
                  }
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    copied === activeTab
                      ? 'bg-green-600 text-white'
                      : 'bg-green-500 hover:bg-green-400 text-white'
                  }`}
                >
                  {copied === activeTab ? '✓ Copied!' : 'Copy Iframe Code'}
                </button>

                <button
                  onClick={() => handleShareOnX(activeTab)}
                  className="flex-1 px-4 py-2 bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  Share on X
                </button>
              </div>

              <div className="mt-4">
                <a
                  href={
                    activeTab === 'match'
                      ? `/widgets-share?type=match&matchId=${matchId}`
                      : activeTab === 'player'
                      ? `/widgets-share?type=player&puuid=${puuid}`
                      : `/widgets-share?type=matches&puuid=${puuid}`
                  }
                  className="w-full block px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors text-center"
                >
                  Open Shareable Page →
                </a>
              </div>

              <div className="mt-4 p-4 bg-[#181818] rounded border border-gray-700">
                <p className="text-sm text-gray-400">
                  <strong className="text-white">Instructions:</strong>
                  <br />
                  1. Copy the iframe code above
                  <br />
                  2. Paste it into your website's HTML
                  <br />
                  3. The widget will display the match or player data
                  <br />
                  4. Click "Share on X" to share the widget on Twitter
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

