'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import MatchLookup from '@/components/ChampionList';
import VideoAnalyzer from '@/components/VideoAnalyzer';
import { useTheme } from '@/contexts/ThemeContext';

const heroImages = [
  'https://static.invenglobal.com/upload/image/2024/12/05/i1733359478358820.jpeg',
  'https://static.invenglobal.com/upload/image/2024/12/05/i1733359482890889.jpeg',
  'https://static.invenglobal.com/upload/image/2024/12/05/i1733359476388368.jpeg',
  'https://static.invenglobal.com/upload/image/2024/12/05/i1733359474000614.jpeg',
  'https://static.invenglobal.com/upload/image/2024/12/05/i1733359480446978.jpeg',
  'https://static.invenglobal.com/upload/image/2024/12/05/i1733359631470058.jpeg'
];

export default function Home() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { theme, toggleTheme } = useTheme();
  const [s3Counts, setS3Counts] = useState<{ matchCount: number; playerCount: number; totalCount: number } | null>(null);

  // Auto-rotate images
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000); // Change image every 5 seconds
    return () => clearInterval(interval);
  }, []);

  // Fetch S3 count
  useEffect(() => {
    const fetchS3Count = async () => {
      try {
        const response = await fetch('/api/s3-count');
        if (response.ok) {
          const data = await response.json();
          setS3Counts(data);
        }
      } catch (error) {
        console.error('Failed to fetch S3 count:', error);
        setS3Counts({ matchCount: 0, playerCount: 0, totalCount: 0 });
      }
    };

    fetchS3Count();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a]">
      {/* Floating Theme Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={toggleTheme}
          className={`p-3 rounded-full shadow-lg transition-all duration-200 ${
            theme === 'light' 
              ? 'bg-white hover:bg-gray-100 text-gray-600' 
              : 'bg-[#121212] hover:bg-[#1a1a1a] text-gray-300'
          }`}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
          title={`Current: ${theme} theme - Click to switch to ${theme === 'light' ? 'dark' : 'light'}`}
        >
          {theme === 'light' ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          )}
        </button>
      </div>

      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-blue-50 to-gray-100 dark:bg-[#0a0a0a] overflow-hidden">
        {/* Background overlay */}
        <div className="absolute inset-0 bg-black/5 dark:bg-[#0a0a0a]"></div>
        
        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left side - Text content */}
            <div className="text-center lg:text-left space-y-6 overflow-visible relative z-10">
              <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white leading-tight">
                RiftRewind
              </h1>
              <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 font-light">
                Your Ultimate League of Legends Match Analyzer
              </p>
              <div className="space-y-4 text-gray-700 dark:text-gray-300">
                <p className="text-base">
                  Dive deep into your League of Legends matches with advanced analytics, AI-powered insights, and comprehensive performance tracking.
                </p>
                <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                  <div className="flex items-center space-x-2 text-xs">
                    <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Match History</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs">
                    <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>AI Insights</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs">
                    <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Performance</span>
                  </div>
                </div>
              </div>

              {/* Match Lookup Input */}
              <div className="pt-4">
                <div className="bg-white/80 dark:bg-[#121212] rounded-lg p-4 border border-gray-200 dark:border-gray-800 overflow-visible shadow-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <label className="block text-sm font-medium text-gray-900 dark:text-white">
                      Enter Match ID
                    </label>
                    <div className="group relative flex items-center gap-1 overflow-visible">
                      <svg className="w-4 h-4 text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-gray-600 dark:text-white/60 text-xs hover:text-gray-900 dark:hover:text-white cursor-help">How to find Match ID</span>
                      <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-[9999] pointer-events-none">
                        <div className="bg-gray-900 text-white text-base rounded-lg p-6 shadow-2xl border border-gray-700 w-[800px] pointer-events-auto">
                          <p className="mb-2 font-semibold">This is available in your League of Legends client match history</p>
                          <p className="mb-4">Include the region (e.g., EUN1, EUW1, NA1, etc.)</p>
                          <img 
                            src="/gameId.png" 
                            alt="Match ID location" 
                            className="rounded border border-gray-600 w-full"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <input
                      id="hero-match-id-input"
                      type="text"
                      placeholder="EUN1_3849902044"
                      className="flex-1 px-4 py-2 rounded-md bg-white dark:bg-[#181818] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-500 border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-gray-600"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          const input = document.getElementById('hero-match-id-input') as HTMLInputElement;
                          const searchValue = input.value.trim() || input.placeholder;
                          if (searchValue) {
                            // Find and update the input in MatchLookup component
                            const matchLookupInput = document.querySelector('#match-lookup input[type="text"]') as HTMLInputElement;
                            if (matchLookupInput) {
                              matchLookupInput.value = searchValue;
                              matchLookupInput.dispatchEvent(new Event('input', { bubbles: true }));
                              // Trigger the fetch button
                              const fetchButton = document.querySelector('#match-lookup button') as HTMLButtonElement;
                              if (fetchButton) {
                                fetchButton.click();
                              }
                            }
                            // Scroll to match lookup component
                            setTimeout(() => {
                              document.getElementById('match-lookup')?.scrollIntoView({ behavior: 'smooth' });
                            }, 100);
                          }
                        }
                      }}
                    />
                    <button
                      onClick={(e) => {
                        const input = document.getElementById('hero-match-id-input') as HTMLInputElement;
                        if (input) {
                          const searchValue = input.value.trim() || input.placeholder;
                          // Find and update the input in MatchLookup component
                          const matchLookupInput = document.querySelector('#match-lookup input[type="text"]') as HTMLInputElement;
                          if (matchLookupInput) {
                            matchLookupInput.value = searchValue;
                            matchLookupInput.dispatchEvent(new Event('input', { bubbles: true }));
                            // Trigger the fetch button
                            const fetchButton = document.querySelector('#match-lookup button') as HTMLButtonElement;
                            if (fetchButton) {
                              fetchButton.click();
                            }
                          }
                          // Scroll to match lookup component
                          setTimeout(() => {
                            document.getElementById('match-lookup')?.scrollIntoView({ behavior: 'smooth' });
                          }, 100);
                        }
                      }}
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-[#121212] dark:hover:bg-[#1a1a1a] text-white rounded-md font-medium transition-colors border border-blue-700 dark:border-gray-800"
                    >
                      Search
                    </button>
                  </div>
                  
                  {/* S3 Count Display */}
                  {s3Counts !== null && (
                    <div className="mt-3 text-left">
                      {s3Counts.totalCount > 0 ? (
                        <Link
                          href="/analysis"
                          className="text-gray-700 dark:text-white/80 text-sm underline hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
                        >
                          {s3Counts.totalCount} match & player analysis
                        </Link>
                      ) : (
                        <span className="text-gray-700 dark:text-white/80 text-sm">No analysis yet</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Right side - Image Slider */}
            <div className="relative z-[5]">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                {/* Slider Container */}
                <div className="relative" style={{ height: '400px' }}>
                  {heroImages.map((image, index) => (
                    <div
                      key={index}
                      className={`absolute inset-0 transition-opacity duration-1000 ${
                        index === currentImageIndex ? 'opacity-100' : 'opacity-0'
                      }`}
                    >
                      <img 
                        src={image}
                        alt={`League of Legends ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  ))}
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-50/80 dark:from-[#0a0a0a]/80 to-transparent"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div id="match-lookup" className="space-y-12 py-12">
        <MatchLookup />
        {/* <VideoAnalyzer /> */}
      </div>
    </div>
  );
}
