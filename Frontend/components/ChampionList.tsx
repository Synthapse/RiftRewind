'use client';

import { useState, useEffect } from 'react';
import { Champion, ChampionData } from '@/types/champion';
import ChampionCard from './ChampionCard';

export default function ChampionList() {
  const [champions, setChampions] = useState<Champion[]>([]);
  const [filteredChampions, setFilteredChampions] = useState<Champion[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tags = ['Fighter', 'Tank', 'Mage', 'Assassin', 'Marksman', 'Support'];

  useEffect(() => {
    const fetchChampions = async () => {
      try {
        setLoading(true);
        const response = await fetch('https://ddragon.leagueoflegends.com/cdn/12.10.1/data/en_US/champion.json');
        if (!response.ok) {
          throw new Error('Failed to fetch champions');
        }
        const data: ChampionData = await response.json();
        const championArray = Object.values(data.data);
        setChampions(championArray);
        setFilteredChampions(championArray);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchChampions();
  }, []);

  useEffect(() => {
    let filtered = champions;

    if (searchTerm) {
      filtered = filtered.filter(champion =>
        champion.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        champion.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedTag) {
      filtered = filtered.filter(champion =>
        champion.tags.includes(selectedTag)
      );
    }

    setFilteredChampions(filtered);
  }, [champions, searchTerm, selectedTag]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Champions</h2>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-center text-gray-900 dark:text-white mb-8">
          League of Legends Champions
        </h1>
        
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search champions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
          <div className="md:w-64">
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">All Roles</option>
              {tags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-center text-gray-600 dark:text-gray-400 mb-4">
          Showing {filteredChampions.length} of {champions.length} champions
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredChampions.map((champion) => (
          <ChampionCard key={champion.id} champion={champion} />
        ))}
      </div>

      {filteredChampions.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400">
            No champions found matching your criteria
          </h3>
          <p className="text-gray-500 dark:text-gray-500 mt-2">
            Try adjusting your search or filter options
          </p>
        </div>
      )}
    </div>
  );
}
