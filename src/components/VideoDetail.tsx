import React, { useEffect, useState } from 'react';
import { Video, WatchHistoryItem } from '../types';
import { Play, Heart, Download, CheckCircle, Clock, ArrowLeft, Loader2 } from 'lucide-react';
import { getVideoBlob } from '../utils/indexedDB';

interface VideoDetailProps {
  video: Video;
  onBack: () => void;
  onPlayClick: (video: Video, offlineBlobUrl?: string | null) => void;
  isFavorite: boolean;
  onToggleFavorite: (videoId: string) => void;
  watchHistoryItem?: WatchHistoryItem | null;
  downloadsList: any[];
}

export default function VideoDetail({
  video,
  onBack,
  onPlayClick,
  isFavorite,
  onToggleFavorite,
  watchHistoryItem,
  downloadsList
}: VideoDetailProps) {
  const [offlineBlobUrl, setOfflineBlobUrl] = useState<string | null>(null);
  const [checkingOffline, setCheckingOffline] = useState(true);

  // Check if this video has a saved binary blob in IndexedDB for offline playing
  useEffect(() => {
    checkOfflineStatus();
  }, [video, downloadsList]);

  const checkOfflineStatus = async () => {
    setCheckingOffline(true);
    try {
      const blob = await getVideoBlob(video.id);
      if (blob) {
        const url = URL.createObjectURL(blob);
        setOfflineBlobUrl(url);
      } else {
        setOfflineBlobUrl(null);
      }
    } catch (e) {
      console.error('Failed to resolve offline blob', e);
      setOfflineBlobUrl(null);
    } finally {
      setCheckingOffline(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const percentComplete = watchHistoryItem 
    ? Math.round((watchHistoryItem.lastWatchedPosition / video.duration) * 100) 
    : 0;

  return (
    <div id={`video-detail-panel-${video.id}`} className="space-y-6">
      
      {/* Back navigation banner */}
      <button
        id="detail-back-button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Catalog</span>
      </button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Poster cover / Play trigger */}
        <div className="md:col-span-1">
          <div className="relative rounded-2xl overflow-hidden aspect-[3/4] bg-neutral-950 border border-neutral-800 shadow-2xl group">
            <img
              src={video.posterUrl}
              alt={video.title}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
              referrerPolicy="no-referrer"
            />
            
            {/* Play trigger overlay */}
            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2">
              <button
                id="detail-big-play-btn"
                onClick={() => onPlayClick(video, offlineBlobUrl)}
                className="w-16 h-16 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-lg transition transform active:scale-90 cursor-pointer"
              >
                <Play className="w-6 h-6 fill-current ml-1" />
              </button>
              <span className="text-xs font-semibold text-white tracking-widest uppercase mt-2">
                Launch Player
              </span>
            </div>
          </div>
        </div>

        {/* Info Column */}
        <div className="md:col-span-2 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <span className="text-xs font-bold bg-red-600/10 text-red-500 border border-red-500/15 px-2.5 py-1 rounded-md tracking-wide uppercase">
                {video.category}
              </span>
              <h1 className="text-3xl font-extrabold text-white mt-3 leading-tight">{video.title}</h1>
              <p className="text-xs text-neutral-500 mt-1">
                Released in {video.releaseYear} • Directed by {video.creator}
              </p>
            </div>

            <p className="text-sm text-neutral-300 leading-relaxed max-w-2xl">
              {video.description}
            </p>

            {/* Watch Progress Tracker */}
            {watchHistoryItem && watchHistoryItem.lastWatchedPosition > 0 && (
              <div id="watch-progress-tracker" className="bg-neutral-900 border border-neutral-800/80 rounded-xl p-4 max-w-md">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-neutral-300 font-medium flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-red-500" /> 
                    {watchHistoryItem.completed ? 'Finished Watching' : 'Resume Playback'}
                  </span>
                  <span className="text-neutral-400 font-mono font-bold">{percentComplete}% Complete</span>
                </div>
                <div className="w-full bg-neutral-950 h-1.5 rounded-full overflow-hidden mb-1.5">
                  <div 
                    className="bg-red-600 h-full rounded-full transition-all duration-300" 
                    style={{ width: `${percentComplete}%` }}
                  />
                </div>
                <p className="text-[10px] text-neutral-500">
                  Last watched at {formatTime(watchHistoryItem.lastWatchedPosition)} of {formatTime(video.duration)}
                </p>
              </div>
            )}
          </div>

          {/* Quick Action Controls Row */}
          <div className="flex flex-wrap items-center gap-3 pt-6 border-t border-neutral-900">
            <button
              id={`play-stream-${video.id}`}
              onClick={() => onPlayClick(video, offlineBlobUrl)}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold text-sm px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-red-600/10 transition transform active:scale-95 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{watchHistoryItem && watchHistoryItem.lastWatchedPosition > 0 ? 'Resume Video' : 'Stream Now'}</span>
            </button>

            {/* Favorite toggle */}
            <button
              id={`toggle-favorite-${video.id}`}
              onClick={() => onToggleFavorite(video.id)}
              className={`px-4 py-2.5 rounded-xl border font-semibold text-sm transition flex items-center gap-2 cursor-pointer ${
                isFavorite
                  ? 'bg-red-600/10 border-red-500/20 text-red-500'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current text-red-500' : ''}`} />
              <span>{isFavorite ? 'In Favorites' : 'Add to Favorites'}</span>
            </button>

            {/* Offline status indicator */}
            {checkingOffline ? (
              <div className="flex items-center gap-1.5 text-xs text-neutral-500 px-3">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking offline copy...
              </div>
            ) : offlineBlobUrl ? (
              <div className="bg-emerald-950/20 border border-emerald-500/20 text-emerald-400 font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>Ready Offline (IndexedDB)</span>
              </div>
            ) : (
              <div className="text-xs text-neutral-500 px-3 flex items-center gap-1.5 bg-neutral-950 border border-neutral-900 rounded-xl py-2">
                <Download className="w-3.5 h-3.5 text-neutral-600" />
                <span>Go to <strong>Offline Vault</strong> tab to download copy</span>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
