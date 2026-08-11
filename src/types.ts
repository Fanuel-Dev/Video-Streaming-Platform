export interface Video {
  id: string;
  title: string;
  description: string;
  category: 'Action' | 'Sci-Fi' | 'Drama' | 'Documentary' | 'Thriller';
  posterUrl: string;
  videoUrls: {
    '1080p': string;
    '720p': string;
    '360p': string;
  };
  duration: number; // in seconds
  views: number;
  rating: number;
  releaseYear: number;
  creator: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  avatarUrl: string;
}

export interface WatchHistoryItem {
  id: string;
  videoId: string;
  lastWatchedPosition: number; // in seconds
  completed: boolean;
  updatedAt: string;
}

export interface AnalyticsEvent {
  id: string;
  videoId: string;
  userId?: string;
  timestamp: string;
  action: 'play' | 'pause' | 'buffer_start' | 'buffer_end' | 'resolution_switch' | 'completed' | 'progress';
  position: number; // in seconds
  bitrate: number; // in kbps (e.g. 1000, 2500, 5000)
  resolution: '360p' | '720p' | '1080p';
  networkSpeedSimulated: string; // 'Slow 3G' | 'Fast 3G' | 'WiFi'
  sessionDuration: number; // in seconds
}

export interface OfflineDownload {
  id: string;
  videoId: string;
  title: string;
  posterUrl: string;
  status: 'downloading' | 'completed' | 'failed';
  progress: number; // 0 to 100
  blobSize?: number; // in bytes
  downloadedAt?: string;
}

export interface SyncState {
  history: WatchHistoryItem[];
  favorites: string[]; // videoIds
}

export interface MeetingRoom {
  id: string;
  name: string;
  hostName: string;
  activeParticipants: number;
  createdAt: string;
}

export interface MeetingMessage {
  id: string;
  senderName: string;
  text: string;
  timestamp: string;
  isMe?: boolean;
}

