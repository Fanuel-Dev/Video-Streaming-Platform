import React, { useRef, useState, useEffect } from 'react';
import { Video, AnalyticsEvent } from '../types';
import { 
  Play, Pause, RotateCcw, Volume2, VolumeX, Maximize2, 
  Settings, Wifi, ShieldAlert, WifiOff, Loader2, Gauge 
} from 'lucide-react';

interface VideoPlayerProps {
  video: Video;
  offlineBlobUrl?: string | null;
  authToken?: string;
  onProgressSync?: (videoId: string, position: number, completed: boolean) => void;
  initialPosition?: number;
}

export default function VideoPlayer({ 
  video, 
  offlineBlobUrl, 
  authToken, 
  onProgressSync,
  initialPosition = 0
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Playing state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(video.duration);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  // Quality & Network Simulation State
  const [qualityMode, setQualityMode] = useState<'auto' | 'manual'>('auto');
  const [activeResolution, setActiveResolution] = useState<'1080p' | '720p' | '360p'>('1080p');
  const [networkSpeed, setNetworkSpeed] = useState<'WiFi' | 'Fast 3G' | 'Slow 3G'>('WiFi');
  const [isBuffering, setIsBuffering] = useState(false);
  const [telemetryLogs, setTelemetryLogs] = useState<string[]>([]);
  const [showSettings, setShowSettings] = useState(false);

  // Tracks active source stream URL
  const [videoSrc, setVideoSrc] = useState('');

  // Setup actual Video Source depending on mode (Offline Blob vs Quality)
  useEffect(() => {
    if (offlineBlobUrl) {
      setVideoSrc(offlineBlobUrl);
      addTelemetryLog('📥 Loaded from offline storage. Bypassing stream adaptation.');
      setActiveResolution('1080p'); // Play downloaded high quality
    } else {
      // Stream adaptive bitrate source
      setVideoSrc(video.videoUrls[activeResolution]);
    }
  }, [video, activeResolution, offlineBlobUrl]);

  // Handle Initial Position
  useEffect(() => {
    if (videoRef.current && initialPosition > 0) {
      videoRef.current.currentTime = initialPosition;
      addTelemetryLog(`🕒 Restored progress to: ${formatTime(initialPosition)}`);
    }
  }, [videoSrc]);

  // Automatic Quality Switching based on Simulated Network Speed
  useEffect(() => {
    if (offlineBlobUrl) return; // Ignore on offline mode

    if (qualityMode === 'auto') {
      let targetRes: '1080p' | '720p' | '360p' = '1080p';
      if (networkSpeed === 'Fast 3G') targetRes = '720p';
      if (networkSpeed === 'Slow 3G') targetRes = '360p';

      if (targetRes !== activeResolution) {
        addTelemetryLog(`⚡ Network state changed to [${networkSpeed}]. Adapting stream resolution...`);
        triggerBufferStall(targetRes);
      }
    }
  }, [networkSpeed, qualityMode, offlineBlobUrl]);

  // Helper to log telemetry both to screen and database backend
  const logTelemetry = async (action: AnalyticsEvent['action'], extra: Partial<AnalyticsEvent> = {}) => {
    const timestamp = new Date().toISOString();
    const eventLog: Omit<AnalyticsEvent, 'id'> = {
      videoId: video.id,
      timestamp,
      action,
      position: Math.floor(videoRef.current?.currentTime || currentTime),
      bitrate: activeResolution === '1080p' ? 5000 : (activeResolution === '720p' ? 2500 : 1000),
      resolution: activeResolution,
      networkSpeedSimulated: offlineBlobUrl ? 'Offline (Local)' : networkSpeed,
      sessionDuration: Math.floor(currentTime)
    };

    // Console logs for visual analytics HUD
    const logMsg = `[${action.toUpperCase()}] at ${formatTime(eventLog.position)} (${eventLog.resolution}, Sim Speed: ${eventLog.networkSpeedSimulated})`;
    addTelemetryLog(logMsg);

    // Call server ingest API
    try {
      await fetch('/api/analytics/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify(eventLog)
      });
    } catch (e) {
      console.error('Failed to dispatch telemetry event', e);
    }
  };

  const addTelemetryLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setTelemetryLogs(prev => [`[${time}] ${msg}`, ...prev.slice(0, 19)]);
  };

  // Buffer state simulation helper
  const triggerBufferStall = (nextRes: '1080p' | '720p' | '360p') => {
    setIsBuffering(true);
    const wasPlaying = isPlaying;
    if (videoRef.current) {
      videoRef.current.pause();
    }
    logTelemetry('buffer_start');

    // Simulate network delay duration based on simulated speed
    const delay = networkSpeed === 'Slow 3G' ? 2200 : (networkSpeed === 'Fast 3G' ? 1200 : 500);
    
    setTimeout(() => {
      setActiveResolution(nextRes);
      setIsBuffering(false);
      logTelemetry('resolution_switch');
      logTelemetry('buffer_end');
      
      if (videoRef.current && wasPlaying) {
        videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    }, delay);
  };

  // Play / Pause handlers
  const handlePlayPause = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
      logTelemetry('pause');
    } else {
      videoRef.current.play()
        .then(() => {
          setIsPlaying(true);
          logTelemetry('play');
        })
        .catch(err => {
          console.error(err);
          addTelemetryLog('⚠️ Error initiating playback: ' + err.message);
        });
    }
  };

  // Timeline Progress Check
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const time = videoRef.current.currentTime;
    setCurrentTime(time);

    // Synchronize history backend every 5 seconds or on finish
    const isFinished = videoRef.current.ended || time >= duration - 0.5;
    if (isFinished && isPlaying) {
      setIsPlaying(false);
      logTelemetry('completed');
      if (onProgressSync) onProgressSync(video.id, time, true);
    } else if (Math.floor(time) % 5 === 0 && Math.floor(time) !== Math.floor(currentTime)) {
      if (onProgressSync) onProgressSync(video.id, time, false);
      logTelemetry('progress');
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || video.duration);
    }
  };

  // Seek bar
  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const seekTime = parseFloat(e.target.value);
    videoRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
    addTelemetryLog(`🔍 Scrubbed to: ${formatTime(seekTime)}`);
  };

  // Volume
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
    }
  };

  const toggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    if (videoRef.current) {
      videoRef.current.muted = nextMute;
    }
  };

  // Rate
  const handleSpeedChange = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      addTelemetryLog(`⚡ Speed adjusted to ${rate}x`);
    }
  };

  // Fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error('Fullscreen failed', err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Video Viewport Column */}
      <div className="lg:col-span-2 space-y-4">
        <div 
          id={`player-container-${video.id}`}
          ref={containerRef}
          className="relative bg-neutral-950 aspect-video rounded-2xl overflow-hidden group border border-neutral-800 shadow-2xl"
        >
          {/* Main Video Tag */}
          <video
            ref={videoRef}
            src={videoSrc}
            className="w-full h-full object-cover"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onClick={handlePlayPause}
            playsInline
          />

          {/* Buffering Indicator Overlay */}
          {isBuffering && (
            <div id="player-buffer-overlay" className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3 z-30 pointer-events-none">
              <Loader2 className="w-12 h-12 text-red-600 animate-spin" />
              <div className="text-sm font-medium text-white tracking-widest uppercase">
                Buffering... Adaptive resolution switching active
              </div>
            </div>
          )}

          {/* Top Info Bar HUD */}
          <div className="absolute top-0 inset-x-0 p-4 bg-gradient-to-b from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between z-20">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold bg-red-600 text-white uppercase px-2 py-0.5 rounded tracking-wide">
                {offlineBlobUrl ? 'Offline View' : 'Streaming'}
              </span>
              <h3 className="text-sm font-medium text-white truncate max-w-xs">{video.title}</h3>
            </div>

            <div className="flex items-center gap-2 text-xs text-neutral-300">
              <Gauge className="w-3.5 h-3.5 text-green-500" />
              <span>Simulated Speed: <strong>{offlineBlobUrl ? 'Local Disk' : networkSpeed}</strong></span>
              <span className="bg-neutral-800 px-2 py-0.5 rounded text-white font-mono">{activeResolution}</span>
            </div>
          </div>

          {/* Big Center Play Overlay (visible on pause) */}
          {!isPlaying && !isBuffering && (
            <button 
              id="center-play-button"
              onClick={handlePlayPause}
              className="absolute inset-0 m-auto w-16 h-16 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-lg transform transition active:scale-95 cursor-pointer z-10"
            >
              <Play className="w-8 h-8 fill-current ml-1" />
            </button>
          )}

          {/* Bottom HUD Controller Bar */}
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-4 flex flex-col gap-3 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-300 z-20">
            {/* Timeline Scrub */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-neutral-300">{formatTime(currentTime)}</span>
              <input
                id="player-timeline-scrub"
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={handleScrub}
                className="flex-1 accent-red-600 bg-neutral-700 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-xs font-mono text-neutral-300">{formatTime(duration)}</span>
            </div>

            {/* Sub-controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  id="player-play-btn"
                  onClick={handlePlayPause}
                  className="text-neutral-300 hover:text-white transition cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                </button>

                {/* Volume slider */}
                <div className="flex items-center gap-2">
                  <button onClick={toggleMute} className="text-neutral-300 hover:text-white transition cursor-pointer">
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <input
                    id="player-volume-slider"
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-16 accent-white bg-neutral-700 h-1 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Quality & Settings controls */}
              <div className="flex items-center gap-3">
                {/* Speed selector */}
                <div className="flex items-center gap-1.5 bg-neutral-900/80 border border-neutral-800 rounded px-2 py-1 text-xs">
                  <span className="text-neutral-500 font-medium">Speed:</span>
                  {[1, 1.5, 2].map(speed => (
                    <button
                      key={speed}
                      onClick={() => handleSpeedChange(speed)}
                      className={`px-1.5 rounded hover:bg-neutral-800 ${playbackRate === speed ? 'text-red-500 font-bold bg-neutral-800' : 'text-neutral-400'}`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>

                {/* Settings Toggle */}
                <div className="relative">
                  <button
                    id="player-settings-toggle"
                    onClick={() => setShowSettings(!showSettings)}
                    className="text-neutral-300 hover:text-white transition p-1 rounded hover:bg-neutral-800 cursor-pointer"
                  >
                    <Settings className="w-4 h-4" />
                  </button>

                  {/* Settings dropdown card */}
                  {showSettings && (
                    <div id="player-settings-card" className="absolute bottom-8 right-0 w-64 bg-neutral-950 border border-neutral-800 rounded-xl p-4 shadow-2xl z-40 space-y-3 text-left">
                      <div className="text-xs font-semibold text-neutral-400 tracking-wider uppercase border-b border-neutral-900 pb-1.5">
                        Streaming Quality Control
                      </div>

                      {/* Quality Mode Select */}
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-neutral-400">Stream Source Selection</div>
                        <div className="grid grid-cols-2 gap-1 bg-neutral-900 p-0.5 rounded">
                          <button
                            onClick={() => { setQualityMode('auto'); setShowSettings(false); }}
                            className={`py-1 text-xs font-semibold rounded ${qualityMode === 'auto' ? 'bg-red-600 text-white shadow-sm' : 'text-neutral-400'}`}
                          >
                            Auto (Network)
                          </button>
                          <button
                            onClick={() => { setQualityMode('manual'); setShowSettings(false); }}
                            className={`py-1 text-xs font-semibold rounded ${qualityMode === 'manual' ? 'bg-red-600 text-white shadow-sm' : 'text-neutral-400'}`}
                          >
                            Manual Quality
                          </button>
                        </div>
                      </div>

                      {/* Manual resolutions list */}
                      {qualityMode === 'manual' ? (
                        <div className="space-y-1">
                          <div className="text-xs font-medium text-neutral-400">Resolution Force</div>
                          <div className="flex flex-col gap-0.5">
                            {(['1080p', '720p', '360p'] as const).map(res => (
                              <button
                                key={res}
                                onClick={() => { setActiveResolution(res); setShowSettings(false); addTelemetryLog(`🎯 Manually set resolution to ${res}`); }}
                                className={`w-full text-left px-2 py-1.5 text-xs rounded hover:bg-neutral-900 flex justify-between items-center ${activeResolution === res ? 'text-red-500 font-bold' : 'text-neutral-400'}`}
                              >
                                <span>{res}</span>
                                <span className="font-mono text-neutral-600">{res === '1080p' ? 'HD (5.0 Mbps)' : res === '720p' ? 'SD (2.5 Mbps)' : 'Mobile (1.0 Mbps)'}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1 text-xs text-neutral-400">
                          Currently choosing <span className="text-white font-bold">{activeResolution}</span> automatically based on your network speed selection.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <button onClick={toggleFullscreen} className="text-neutral-300 hover:text-white transition p-1 cursor-pointer">
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Video details & summary */}
        <div className="bg-neutral-900/40 border border-neutral-800/60 p-5 rounded-2xl">
          <h2 className="text-xl font-bold text-white mb-2">{video.title}</h2>
          <div className="flex flex-wrap items-center gap-3 text-xs mb-4">
            <span className="font-semibold bg-neutral-800 text-neutral-300 px-2 py-1 rounded">
              {video.category}
            </span>
            <span className="text-neutral-400">{video.releaseYear}</span>
            <span className="text-neutral-400">Duration: {formatTime(video.duration)}</span>
            <span className="text-neutral-400">Rating: ⭐ {video.rating}</span>
            <span className="text-neutral-400">{video.views.toLocaleString()} plays</span>
          </div>
          <p className="text-sm text-neutral-300 leading-relaxed">{video.description}</p>
          <div className="mt-4 pt-4 border-t border-neutral-800/50 flex justify-between items-center text-xs text-neutral-400">
            <span>Creator: <strong className="text-white">{video.creator}</strong></span>
          </div>
        </div>
      </div>

      {/* Real-time Telemetry Monitor Panel Column */}
      <div className="space-y-4">
        {/* Network speed simulator HUD */}
        {!offlineBlobUrl && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                <Wifi className="w-3.5 h-3.5 text-blue-500" /> Network Simulation
              </span>
              <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded font-mono">
                {networkSpeed}
              </span>
            </div>
            <p className="text-xs text-neutral-400 mb-3 leading-snug">
              Simulate high-congestion cell towers or ultra-fast broadband to see adaptive bitrates load and buffer.
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {(['WiFi', 'Fast 3G', 'Slow 3G'] as const).map(speed => (
                <button
                  key={speed}
                  id={`net-sim-${speed.replace(' ', '-')}`}
                  onClick={() => setNetworkSpeed(speed)}
                  className={`py-2 text-xs font-semibold rounded-lg border cursor-pointer transition flex flex-col items-center gap-1 ${
                    networkSpeed === speed 
                      ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/10' 
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <span>{speed}</span>
                  <span className="text-[10px] opacity-60 font-mono">
                    {speed === 'WiFi' ? '50+ Mbps' : speed === 'Fast 3G' ? '4.5 Mbps' : '1.2 Mbps'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Offline Badge */}
        {offlineBlobUrl && (
          <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-2xl p-4 flex gap-3 items-start">
            <WifiOff className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-white">Playing Offline Content</h4>
              <p className="text-xs text-neutral-400 mt-1 leading-normal">
                You are streaming this file locally from your high-performance browser sandbox (IndexedDB). No internet connectivity is required.
              </p>
            </div>
          </div>
        )}

        {/* Console Telemetry Logs HUD */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 h-[310px] flex flex-col">
          <div className="flex items-center justify-between mb-3 border-b border-neutral-900 pb-2">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
              <ShieldAlert className="w-3.5 h-3.5 text-red-500" /> Adaptive Stream Telemetry
            </span>
            <button 
              onClick={() => setTelemetryLogs([])} 
              className="text-[10px] text-neutral-500 hover:text-white transition cursor-pointer"
            >
              Clear Logs
            </button>
          </div>

          <div id="telemetry-logs-list" className="flex-1 overflow-y-auto space-y-1.5 pr-1 font-mono text-[10px] text-neutral-400 select-all">
            {telemetryLogs.length === 0 ? (
              <div className="text-neutral-600 text-center py-12 italic">
                Awaiting streaming triggers. Play, pause, scrub, or switch network to populate.
              </div>
            ) : (
              telemetryLogs.map((log, idx) => (
                <div key={idx} className="border-b border-neutral-900/50 pb-1 text-neutral-300">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
