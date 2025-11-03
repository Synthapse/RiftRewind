'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import MatchDataWidget from '@/components/widgets/MatchDataWidget';
import PlayerPerformanceWidget from '@/components/widgets/PlayerPerformanceWidget';
import Player5MatchesWidget from '@/components/widgets/Player5MatchesWidget';

function WidgetsShareContent() {
  const searchParams = useSearchParams();
  const widgetType = searchParams?.get('type') || 'match'; // 'match', 'player', 'matches'
  const matchId = searchParams?.get('matchId') || '';
  const puuid = searchParams?.get('puuid') || '';
  
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'widget' | 'embed'>('widget');

  const getBaseUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return '';
  };

  const getWidgetUrl = () => {
    const baseUrl = getBaseUrl();
    if (widgetType === 'match' && matchId) {
      return `${baseUrl}/embed/match/${matchId}`;
    } else if (widgetType === 'player' && puuid) {
      const matchIdParam = searchParams?.get('matchId') ? `?matchId=${searchParams.get('matchId')}` : '';
      return `${baseUrl}/embed/player/${puuid}${matchIdParam}`;
    } else if (widgetType === 'matches' && puuid) {
      return `${baseUrl}/embed/player/${puuid}/matches`;
    }
    return '';
  };

  const getIframeCode = () => {
    const url = getWidgetUrl();
    if (!url) return '';
    
    const width = widgetType === 'matches' ? '400' : '400';
    const height = widgetType === 'matches' ? '700' : '600';
    
    return `<iframe src="${url}" width="${width}" height="${height}" frameborder="0" allowtransparency="true" allow="encrypted-media"></iframe>`;
  };

  const handleCopyIframe = async () => {
    const code = getIframeCode();
    if (!code) return;
    
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleCopyUrl = async () => {
    const url = getWidgetUrl();
    if (!url) return;
    
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShareOnX = () => {
    const url = getWidgetUrl();
    if (!url) return;

    let text = '';
    if (widgetType === 'match') {
      text = `Check out this League of Legends match! ${matchId}`;
    } else if (widgetType === 'player') {
      text = `Check out this player's performance in League of Legends!`;
    } else if (widgetType === 'matches') {
      text = `Check out this player's last 5 matches!`;
    }

    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, '_blank', 'width=550,height=420');
  };

  // Get current page URL for sharing
  const currentPageUrl = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
              Shareable Widget
            </h1>
            <p className="text-gray-400 text-lg">
              {widgetType === 'match' && 'Match Data Widget'}
              {widgetType === 'player' && 'Player Performance Widget'}
              {widgetType === 'matches' && 'Player 5 Matches Widget'}
            </p>
          </div>

          {/* Share Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
            <button
              onClick={handleShareOnX}
              className="flex items-center gap-2 px-6 py-3 bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white rounded-lg font-medium transition-colors shadow-lg hover:shadow-xl"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              <span>Share on X</span>
            </button>

            <button
              onClick={handleCopyUrl}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                copied
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
            >
              {copied ? (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>Copy URL</span>
                </>
              )}
            </button>

            <button
              onClick={() => handleShareOnX()}
              className="flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <span>Share This Page</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-4xl mx-auto mb-6">
          <div className="flex border-b border-gray-700">
            <button
              onClick={() => setActiveTab('widget')}
              className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'widget'
                  ? 'text-white border-b-2 border-green-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Widget Preview
            </button>
            <button
              onClick={() => setActiveTab('embed')}
              className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'embed'
                  ? 'text-white border-b-2 border-green-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Embed Code
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto">
          {activeTab === 'widget' && (
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-8">
              <div className="flex justify-center">
                <div className="w-full max-w-md">
                  {widgetType === 'match' && matchId && (
                    <MatchDataWidget matchId={matchId} showControls={false} />
                  )}
                  {widgetType === 'player' && puuid && (
                    <PlayerPerformanceWidget 
                      puuid={puuid} 
                      matchId={searchParams?.get('matchId') || undefined}
                      showControls={false} 
                    />
                  )}
                  {widgetType === 'matches' && puuid && (
                    <Player5MatchesWidget puuid={puuid} showControls={false} />
                  )}
                  {(!matchId && widgetType === 'match') && (
                    <div className="bg-[#181818] rounded-lg border border-gray-800 p-6 text-center text-gray-400">
                      Match ID required
                    </div>
                  )}
                  {(!puuid && (widgetType === 'player' || widgetType === 'matches')) && (
                    <div className="bg-[#181818] rounded-lg border border-gray-800 p-6 text-center text-gray-400">
                      Player PUUID required
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'embed' && (
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-8">
              <h2 className="text-2xl font-bold mb-4 text-white">Embed Code</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Iframe Code
                  </label>
                  <textarea
                    readOnly
                    value={getIframeCode()}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white font-mono text-sm h-32 focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
                  />
                  <button
                    onClick={handleCopyIframe}
                    className={`mt-3 w-full px-4 py-3 rounded-lg font-medium transition-colors ${
                      copied
                        ? 'bg-green-600 text-white'
                        : 'bg-green-500 hover:bg-green-400 text-white'
                    }`}
                  >
                    {copied ? '✓ Copied!' : 'Copy Iframe Code'}
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Widget URL
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={getWidgetUrl()}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                </div>

                <div className="mt-6 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-2">Instructions</h3>
                  <ol className="list-decimal list-inside space-y-2 text-gray-300 text-sm">
                    <li>Copy the iframe code above</li>
                    <li>Paste it into your website's HTML where you want the widget to appear</li>
                    <li>The widget will automatically display match or player data</li>
                    <li>Click "Share on X" to share the widget on Twitter/X</li>
                    <li>Share the widget URL directly or embed it on any website</li>
                  </ol>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="max-w-4xl mx-auto mt-8">
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-lg border border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a
                href="/widgets"
                className="p-4 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors text-center"
              >
                <div className="text-white font-medium">Create New Widget</div>
                <div className="text-gray-400 text-sm mt-1">Go to Widget Generator</div>
              </a>
              <a
                href="/"
                className="p-4 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors text-center"
              >
                <div className="text-white font-medium">Home</div>
                <div className="text-gray-400 text-sm mt-1">Back to Main Page</div>
              </a>
              <button
                onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent('Check out this League of Legends widget!')}&url=${encodeURIComponent(currentPageUrl)}`, '_blank')}
                className="p-4 bg-[#1DA1F2]/20 hover:bg-[#1DA1F2]/30 rounded-lg transition-colors text-center"
              >
                <div className="text-white font-medium">Share This Page</div>
                <div className="text-gray-400 text-sm mt-1">Share on X/Twitter</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WidgetsSharePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <WidgetsShareContent />
    </Suspense>
  );
}

