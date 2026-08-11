import React, { useState, useEffect } from 'react';
import { Video, User, WatchHistoryItem } from './types';
import { VIDEO_LIBRARY } from './utils/videoData';
import Navigation from './components/Navigation';
import VideoGrid from './components/VideoGrid';
import VideoDetail from './components/VideoDetail';
import VideoPlayer from './components/VideoPlayer';
import OfflineLibrary from './components/OfflineLibrary';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import AuthModal from './components/AuthModal';
import LiveMeeting from './components/LiveMeeting';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, Database, ShieldAlert, CloudLightning } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'catalog' | 'offline' | 'analytics' | 'meetings'>('catalog');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Selected / Active Playing states
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [playingVideo, setPlayingVideo] = useState<Video | null>(null);
  const [playingOfflineUrl, setPlayingOfflineUrl] = useState<string | null>(null);

  // Synchronization collections
  const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [downloadsList, setDownloadsList] = useState<any[]>([]);

  // Authenticated state restoration on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token');
    if (savedToken) {
      restoreSession(savedToken);
    }
  }, []);

  const restoreSession = async (token: string) => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        setAuthToken(token);
        fetchSyncData(token);
      } else {
        localStorage.removeItem('auth_token');
      }
    } catch (e) {
      console.error('Failed to restore session', e);
    }
  };

  const fetchSyncData = async (token: string) => {
    try {
      const res = await fetch('/api/sync/get', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setWatchHistory(data.history || []);
        setFavorites(data.favorites || []);
      }
    } catch (e) {
      console.error('Failed to retrieve watch history/favorites', e);
    }
  };

  // Auth Action Handlers
  const handleAuthSuccess = (user: User, token: string) => {
    setCurrentUser(user);
    setAuthToken(token);
    localStorage.setItem('auth_token', token);
    fetchSyncData(token);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthToken(null);
    setWatchHistory([]);
    setFavorites([]);
    localStorage.removeItem('auth_token');
  };

  // Watch history progress cloud synchronizer
  const handleProgressSync = async (videoId: string, position: number, completed: boolean) => {
    // 1. Instantly update local client state for smooth offline response
    setWatchHistory(prev => {
      const index = prev.findIndex(item => item.videoId === videoId);
      const updatedItem: WatchHistoryItem = {
        id: index >= 0 ? prev[index].id : `hist_local_${Math.random()}`,
        videoId,
        lastWatchedPosition: position,
        completed,
        updatedAt: new Date().toISOString()
      };

      if (index >= 0) {
        const copy = [...prev];
        copy[index] = updatedItem;
        return copy;
      }
      return [...prev, updatedItem];
    });

    if (!authToken) return; // Skip server update if anonymous

    setSyncing(true);
    try {
      const res = await fetch('/api/sync/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ videoId, lastWatchedPosition: position, completed })
      });
      if (!res.ok) throw new Error('Progress sync failure');
    } catch (e) {
      console.error(e);
    } finally {
      // Small simulated delay to let the sync indicator be beautifully visible
      setTimeout(() => setSyncing(false), 500);
    }
  };

  // Toggle favorite trigger
  const handleToggleFavorite = async (videoId: string) => {
    if (!authToken) {
      setAuthModalOpen(true);
      return;
    }

    setFavorites(prev => {
      const exists = prev.includes(videoId);
      if (exists) {
        return prev.filter(id => id !== videoId);
      }
      return [...prev, videoId];
    });

    try {
      const res = await fetch('/api/sync/favorites/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ videoId })
      });
      if (res.ok) {
        const data = await res.json();
        setFavorites(data.favorites || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePlayVideo = (video: Video, offlineUrl?: string | null) => {
    setPlayingVideo(video);
    setPlayingOfflineUrl(offlineUrl || null);
    setSelectedVideo(null);
  };

  const handleClosePlayer = () => {
    setPlayingVideo(null);
    setPlayingOfflineUrl(null);
    // Refresh offline library metadata
    setDownloadsList([...downloadsList]);
  };

  // Retrieve current active watch progress to restore play times
  const getWatchProgressPosition = (videoId: string): number => {
    const item = watchHistory.find(h => h.videoId === videoId);
    return item ? item.lastWatchedPosition : 0;
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans flex flex-col justify-between">
      
      {/* Universal header block */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setSelectedVideo(null);
          setPlayingVideo(null);
        }}
        currentUser={currentUser}
        onLoginClick={() => setAuthModalOpen(true)}
        onLogoutClick={handleLogout}
        syncing={syncing}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-8">
        <AnimatePresence mode="wait">
          {playingVideo ? (
            // Full screen active player view
            <motion.div
              key="player-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <button
                id="close-player-btn"
                onClick={handleClosePlayer}
                className="text-xs text-neutral-400 hover:text-white transition cursor-pointer flex items-center gap-1"
              >
                ← Back to catalog and details
              </button>
              
              <VideoPlayer
                video={playingVideo}
                offlineBlobUrl={playingOfflineUrl}
                authToken={authToken || undefined}
                onProgressSync={handleProgressSync}
                initialPosition={getWatchProgressPosition(playingVideo.id)}
              />
            </motion.div>
          ) : selectedVideo ? (
            // Dedicated detailed view card
            <motion.div
              key="detail-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              <VideoDetail
                video={selectedVideo}
                onBack={() => setSelectedVideo(null)}
                onPlayClick={handlePlayVideo}
                isFavorite={favorites.includes(selectedVideo.id)}
                onToggleFavorite={handleToggleFavorite}
                watchHistoryItem={watchHistory.find(h => h.videoId === selectedVideo.id)}
                downloadsList={downloadsList}
              />
            </motion.div>
          ) : (
            // General Tab views
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'catalog' && (
                <div className="space-y-8">
                  {/* Hero banner section */}
                  <div className="relative rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-800 p-8 md:p-12 shadow-2xl flex flex-col md:flex-row items-center gap-8">
                    {/* Background glow overlay */}
                    <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/5 blur-[120px] rounded-full pointer-events-none"></div>
                    
                    <div className="flex-1 space-y-4 relative z-10 text-left">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-600/10 border border-red-500/15 rounded-full text-xs font-semibold text-red-500 uppercase tracking-wider">
                        <CloudLightning className="w-3.5 h-3.5" /> High-Performance Player
                      </div>
                      <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
                        Adaptive Bitrates & Real-Time Sync
                      </h1>
                      <p className="text-sm text-neutral-400 max-w-lg leading-relaxed">
                        Log in to synchronize watch progress, bookmark trailers, download binary blobs offline via IndexedDB, and watch live playback diagnostics.
                      </p>
                      
                      {!currentUser && (
                        <button
                          id="hero-sync-trigger"
                          onClick={() => setAuthModalOpen(true)}
                          className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition shadow-lg shadow-red-600/15 cursor-pointer flex items-center gap-1.5"
                        >
                          Enable Cross-Device Sync <ChevronRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Graphics / HUD illustration */}
                    <div className="w-full md:w-80 shrink-0 relative flex justify-center">
                      <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 w-full shadow-2xl max-w-sm space-y-3 font-mono text-[10px] text-neutral-400 select-none">
                        <div className="flex items-center justify-between border-b border-neutral-900 pb-1.5">
                          <span className="text-white font-bold uppercase tracking-widest text-[9px] flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> SYSTEM HEALTH
                          </span>
                          <span className="text-neutral-500">v1.2.0</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Bitrate Allocation:</span>
                          <span className="text-white font-bold">5.0 Mbps (1080p)</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Buffer Latency:</span>
                          <span className="text-emerald-400">0.02s</span>
                        </div>
                        <div className="flex justify-between">
                          <span>IndexedDB Pool:</span>
                          <span className="text-red-500 font-bold">Allocated</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <VideoGrid
                    videos={VIDEO_LIBRARY}
                    onSelectVideo={(video) => setSelectedVideo(video)}
                    favorites={favorites}
                  />
                </div>
              )}

              {activeTab === 'offline' && (
                <OfflineLibrary
                  onPlayOffline={(videoId, localUrl) => {
                    const video = VIDEO_LIBRARY.find(v => v.id === videoId);
                    if (video) {
                      handlePlayVideo(video, localUrl);
                    }
                  }}
                  videoLibrary={VIDEO_LIBRARY}
                />
              )}

              {activeTab === 'analytics' && (
                <AnalyticsDashboard />
              )}

              {activeTab === 'meetings' && (
                <LiveMeeting 
                  currentUser={currentUser} 
                  onLoginPrompt={() => setAuthModalOpen(true)} 
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Auth modal overlay portal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Simple literal footer */}
      <footer className="border-t border-neutral-900 bg-neutral-950/60 py-6 text-center text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <span>© 2026 Video Streaming Platform. Constructed cleanly using HTML5 & IndexedDB APIs.</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><Database className="w-3.5 h-3.5 text-neutral-600" /> Offline Enabled</span>
            <span>•</span>
            <span className="flex items-center gap-1"><ShieldAlert className="w-3.5 h-3.5 text-neutral-600" /> Secure Sessions</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
