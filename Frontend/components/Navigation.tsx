'use client';

import Link from 'next/link';

export default function Navigation() {
  return (
    <nav className="bg-white dark:bg-gray-800 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">L</span>
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              League Champions
            </span>
          </Link>
          
          <div className="flex items-center space-x-4">
            <Link 
              href="/" 
              className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Champions
            </Link>
            <a 
              href="https://ddragon.leagueoflegends.com/cdn/12.10.1/data/en_US/champion.json" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              API Data
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
