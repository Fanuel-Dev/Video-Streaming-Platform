import React, { useState } from 'react';
import { Video } from '../types';
import { Search, Play, Star, Calendar } from 'lucide-react';

interface VideoGridProps {
  videos: Video[];
  onSelectVideo: (video: Video) => void;
  favorites: string[];
}

export default function VideoGrid({ videos, onSelectVideo, favorites }: VideoGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Action', 'Sci-Fi', 'Drama', 'Documentary', 'Thriller'];

  const filteredVideos = videos.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          video.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || video.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div id="video-catalog-grid" className="space-y-6">
      
      {/* Filters Hub */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            id="catalog-search"
            type="text"
            placeholder="Search movies, trailers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-2 pl-10 pr-4 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition"
          />
        </div>

        {/* Category Pill selectors */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1">
          {categories.map(cat => (
            <button
              key={cat}
              id={`filter-cat-${cat.toLowerCase()}`}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-full border transition cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-600/10'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Movie Cards */}
      {filteredVideos.length === 0 ? (
        <div id="catalog-empty-state" className="text-center py-20 text-neutral-500">
          <p className="text-sm font-medium">No video content matches your query</p>
          <p className="text-xs text-neutral-600 mt-1">Try relaxing filters or search string.</p>
        </div>
      ) : (
        <div id="movie-grid-container" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredVideos.map(video => {
            const isFav = favorites.includes(video.id);
            return (
              <div
                key={video.id}
                id={`movie-card-${video.id}`}
                onClick={() => onSelectVideo(video)}
                className="group bg-neutral-950 border border-neutral-900/60 rounded-2xl overflow-hidden hover:border-neutral-800 hover:shadow-2xl transition duration-300 flex flex-col justify-between cursor-pointer"
              >
                {/* Visual Cover */}
                <div className="aspect-[16/10] overflow-hidden relative bg-neutral-900">
                  <img
                    src={video.posterUrl}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    referrerPolicy="no-referrer"
                  />
                  
                  {/* Rating Badge */}
                  <span className="absolute top-3 left-3 bg-neutral-950/80 backdrop-blur-md text-yellow-500 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 border border-neutral-800/50">
                    <Star className="w-3 h-3 fill-current" /> {video.rating}
                  </span>

                  {/* Category overlay */}
                  <span className="absolute bottom-3 left-3 bg-red-600 text-white text-[9px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded-md shadow">
                    {video.category}
                  </span>

                  {/* Play Icon on hover */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                    <div className="bg-red-600 text-white p-3.5 rounded-full shadow-lg transform translate-y-2 group-hover:translate-y-0 transition duration-300">
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </div>
                  </div>
                </div>

                {/* Info block */}
                <div className="p-4 space-y-1.5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-white group-hover:text-red-500 transition-colors line-clamp-1">
                      {video.title}
                    </h3>
                    <p className="text-xs text-neutral-400 line-clamp-2 mt-1 leading-relaxed">
                      {video.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-neutral-500 pt-3 border-t border-neutral-900">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-neutral-600" /> {video.releaseYear}
                    </span>
                    <span>{video.views.toLocaleString()} plays</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
