'use client';

import { Champion } from '@/types/champion';
import Image from 'next/image';
import Link from 'next/link';

interface ChampionCardProps {
  champion: Champion;
}

export default function ChampionCard({ champion }: ChampionCardProps) {
  //const imageUrl = `https://ddragon.leagueoflegends.com/cdn/12.10.1/img/champion/${champion.image.full}`;
  
  return (
    <Link href={`/champion/${champion.id}`} className="group">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 overflow-hidden">
        <div className="relative">
          {/* <Image
            src={imageUrl}
            alt={champion.name}
            width={300}
            height={300}
            className="w-full h-48 object-cover"
          /> */}
          <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
            {champion.tags.join(', ')}
          </div>
        </div>
        <div className="p-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {champion.name}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 italic">
            {champion.title}
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-400 mt-2 line-clamp-3">
            {champion.blurb}
          </p>
          <div className="flex justify-between items-center mt-3">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {champion.partype}
            </span>
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-red-500 rounded-full" title="Attack"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full" title="Defense"></div>
              <div className="w-2 h-2 bg-green-500 rounded-full" title="Magic"></div>
              <div className="w-2 h-2 bg-yellow-500 rounded-full" title="Difficulty"></div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
