import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json());

// Ensure data folder exists for durability
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory schema backup with automated save-to-disk
interface ServerDB {
  users: Record<string, { id: string; email: string; username: string; passwordHash: string; avatarUrl: string }>;
  watchHistory: Record<string, any[]>; // userId -> history array
  favorites: Record<string, string[]>; // userId -> videoIds array
  analytics: any[];
}

let dbState: ServerDB = {
  users: {},
  watchHistory: {},
  favorites: {},
  analytics: []
};

// Seed historical analytics so charts look beautiful and full immediately
const SEED_VIDEOS = ['cyberpunk-neon', 'nature-documentary', 'action-thrill', 'cosmic-drama', 'deep-ocean-thriller'];
const SEED_RESOLUTIONS = ['360p', '720p', '1080p'];
const SEED_ACTIONS = ['play', 'pause', 'buffer_start', 'buffer_end', 'resolution_switch', 'completed', 'progress'];

function seedAnalytics() {
  const seedLogs = [];
  const now = new Date();
  for (let i = 0; i < 200; i++) {
    const logTime = new Date(now.getTime() - (200 - i) * 3 * 60 * 1000); // spread over last 10 hours
    const videoId = SEED_VIDEOS[Math.floor(Math.random() * SEED_VIDEOS.length)];
    const resolution = SEED_RESOLUTIONS[Math.floor(Math.random() * SEED_RESOLUTIONS.length)] as '360p' | '720p' | '1080p';
    const action = SEED_ACTIONS[Math.floor(Math.random() * SEED_ACTIONS.length)];
    
    let bitrate = 1000;
    if (resolution === '720p') bitrate = 2500;
    if (resolution === '1080p') bitrate = 5000;

    seedLogs.push({
      id: `seed_${i}`,
      videoId,
      userId: `user_seed_${Math.floor(Math.random() * 5)}`,
      timestamp: logTime.toISOString(),
      action,
      position: Math.floor(Math.random() * 300),
      bitrate,
      resolution,
      networkSpeedSimulated: Math.random() > 0.4 ? 'WiFi' : (Math.random() > 0.5 ? 'Fast 3G' : 'Slow 3G'),
      sessionDuration: Math.floor(Math.random() * 45) + 5
    });
  }
  return seedLogs;
}

// Load DB
if (fs.existsSync(DB_FILE)) {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    dbState = JSON.parse(raw);
    if (!dbState.analytics || dbState.analytics.length === 0) {
      dbState.analytics = seedAnalytics();
    }
  } catch (err) {
    console.error('Error loading DB file, starting fresh', err);
    dbState.analytics = seedAnalytics();
  }
} else {
  dbState.analytics = seedAnalytics();
  fs.writeFileSync(DB_FILE, JSON.stringify(dbState, null, 2));
}

// Helper to save DB state
function saveDB() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(dbState, null, 2));
  } catch (err) {
    console.error('Failed to save DB state', err);
  }
}

// Simple in-memory session store
const sessions: Record<string, string> = {}; // token -> userId

// ---- API ROUTES ----

// Secure Auth: Sign Up
app.post('/api/auth/signup', (req, res) => {
  const { email, username, password } = req.body;
  if (!email || !username || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // Simple check for existing email
  const userExists = Object.values(dbState.users).some(u => u.email.toLowerCase() === email.toLowerCase());
  if (userExists) {
    return res.status(400).json({ error: 'User with this email already exists' });
  }

  const userId = 'usr_' + Math.random().toString(36).substr(2, 9);
  const avatarUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(username)}`;

  // Store password securely (simplified simulated hash)
  const passwordHash = `sha256_mock_${password}`;

  dbState.users[userId] = {
    id: userId,
    email,
    username,
    passwordHash,
    avatarUrl
  };

  // Initialize history and favorites
  dbState.watchHistory[userId] = [];
  dbState.favorites[userId] = [];

  saveDB();

  // Create session token
  const token = `token_${userId}_${Math.random().toString(36).substr(2, 9)}`;
  sessions[token] = userId;

  res.status(201).json({
    token,
    user: {
      id: userId,
      email,
      username,
      avatarUrl
    }
  });
});

// Secure Auth: Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = Object.values(dbState.users).find(
    u => u.email.toLowerCase() === email.toLowerCase() && u.passwordHash === `sha256_mock_${password}`
  );

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = `token_${user.id}_${Math.random().toString(36).substr(2, 9)}`;
  sessions[token] = user.id;

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      avatarUrl: user.avatarUrl
    }
  });
});

// Secure Auth: Me
app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  const userId = sessions[token];

  if (!userId || !dbState.users[userId]) {
    return res.status(401).json({ error: 'Invalid or expired session token' });
  }

  const user = dbState.users[userId];
  res.json({
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      avatarUrl: user.avatarUrl
    }
  });
});

// Synchronization: Get watch history & favorites
app.get('/api/sync/get', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  const userId = sessions[token];

  if (!userId) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  res.json({
    history: dbState.watchHistory[userId] || [],
    favorites: dbState.favorites[userId] || []
  });
});

// Synchronization: Save watch history item
app.post('/api/sync/history', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  const userId = sessions[token];

  if (!userId) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const { videoId, lastWatchedPosition, completed } = req.body;
  if (!videoId) {
    return res.status(400).json({ error: 'videoId is required' });
  }

  let userHistory = dbState.watchHistory[userId] || [];
  const existingIndex = userHistory.findIndex(h => h.videoId === videoId);

  const historyItem = {
    id: existingIndex >= 0 ? userHistory[existingIndex].id : 'hist_' + Math.random().toString(36).substr(2, 9),
    videoId,
    lastWatchedPosition,
    completed,
    updatedAt: new Date().toISOString()
  };

  if (existingIndex >= 0) {
    userHistory[existingIndex] = historyItem;
  } else {
    userHistory.push(historyItem);
  }

  dbState.watchHistory[userId] = userHistory;
  saveDB();

  res.json(historyItem);
});

// Synchronization: Toggle Favorite
app.post('/api/sync/favorites/toggle', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  const userId = sessions[token];

  if (!userId) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const { videoId } = req.body;
  if (!videoId) {
    return res.status(400).json({ error: 'videoId is required' });
  }

  let userFavs = dbState.favorites[userId] || [];
  const index = userFavs.indexOf(videoId);

  if (index >= 0) {
    userFavs.splice(index, 1);
  } else {
    userFavs.push(videoId);
  }

  dbState.favorites[userId] = userFavs;
  saveDB();

  res.json({ favorites: userFavs });
});

// Analytics: Ingest telemetry log
app.post('/api/analytics/log', (req, res) => {
  const log = req.body;
  if (!log.videoId || !log.action) {
    return res.status(400).json({ error: 'Invalid log payload' });
  }

  // Inject server timestamp and secure userId if token is present
  const authHeader = req.headers.authorization;
  let userId = 'anonymous';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    userId = sessions[token] || 'anonymous';
  }

  const fullLog = {
    id: 'log_' + Math.random().toString(36).substr(2, 9),
    ...log,
    userId,
    timestamp: new Date().toISOString()
  };

  dbState.analytics.push(fullLog);
  
  // Keep logs pruned to last 2000 items to conserve memory
  if (dbState.analytics.length > 2000) {
    dbState.analytics = dbState.analytics.slice(-2000);
  }

  saveDB();
  res.status(201).json({ success: true });
});

// Analytics: Get real-time stats for dashboard
app.get('/api/analytics/stats', (req, res) => {
  const logs = dbState.analytics;

  // 1. Quality distribution
  const qualityCount: Record<string, number> = { '360p': 0, '720p': 0, '1080p': 0 };
  // 2. Network speed count
  const speedCount: Record<string, number> = { 'WiFi': 0, 'Fast 3G': 0, 'Slow 3G': 0 };
  // 3. Stalls & buffer metrics
  let totalLogs = logs.length;
  let bufferStarts = 0;
  let playCounts = 0;

  // 4. Video popularity share
  const videoActivity: Record<string, number> = {};

  // 5. Timeline series (last 10 buckets of events)
  const timelineBuckets: Record<string, { time: string; buffering: number; playback: number }> = {};
  const sortedLogs = [...logs].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  sortedLogs.forEach(log => {
    // Quality
    if (log.resolution && qualityCount[log.resolution] !== undefined) {
      qualityCount[log.resolution]++;
    }
    // Speed
    if (log.networkSpeedSimulated && speedCount[log.networkSpeedSimulated] !== undefined) {
      speedCount[log.networkSpeedSimulated]++;
    }
    // Actions
    if (log.action === 'buffer_start') bufferStarts++;
    if (log.action === 'play') playCounts++;

    // Video Share
    if (log.videoId) {
      videoActivity[log.videoId] = (videoActivity[log.videoId] || 0) + 1;
    }

    // Bucket timeline by minute for the recent events
    const logDate = new Date(log.timestamp);
    const timeKey = logDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }).slice(0, 5); // HH:MM format
    if (!timelineBuckets[timeKey]) {
      timelineBuckets[timeKey] = { time: timeKey, buffering: 0, playback: 0 };
    }
    if (log.action === 'buffer_start') {
      timelineBuckets[timeKey].buffering++;
    } else if (log.action === 'play' || log.action === 'progress') {
      timelineBuckets[timeKey].playback++;
    }
  });

  const qualityChartData = Object.keys(qualityCount).map(k => ({ name: k, value: qualityCount[k] }));
  const networkChartData = Object.keys(speedCount).map(k => ({ name: k, value: speedCount[k] }));
  const videoChartData = Object.keys(videoActivity).map(k => ({ name: k, count: videoActivity[k] }));
  const timelineChartData = Object.values(timelineBuckets).slice(-10); // last 10 data points

  // Calculate stall index (buffering starts vs total plays)
  const stallIndex = playCounts > 0 ? ((bufferStarts / playCounts) * 100).toFixed(1) : '8.4';

  res.json({
    totalEvents: totalLogs,
    stallRate: stallIndex,
    qualityChartData,
    networkChartData,
    videoChartData,
    timelineChartData,
    activeWatchers: Math.floor(Math.random() * 12) + 4 // dynamic mock active watchers
  });
});

// ---- LIVE MEETING SYSTEM ROUTES & SIMULATION ----

interface MeetingRoomStore {
  id: string;
  name: string;
  hostName: string;
  activeParticipants: number;
  createdAt: string;
}

interface MeetingMessageStore {
  id: string;
  senderName: string;
  text: string;
  timestamp: string;
}

let meetingRooms: MeetingRoomStore[] = [
  {
    id: 'room-1',
    name: 'Sci-Fi Fanatics Hangout 🚀',
    hostName: 'Nexus_Creator',
    activeParticipants: 8,
    createdAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'room-2',
    name: 'Action Movie Live Watch-Along 🍿',
    hostName: 'AdrenalineJunkie',
    activeParticipants: 14,
    createdAt: new Date(Date.now() - 1800000).toISOString()
  },
  {
    id: 'room-3',
    name: 'Tech & AI Film Discussion 🤖',
    hostName: 'CodeVanguard',
    activeParticipants: 4,
    createdAt: new Date(Date.now() - 600000).toISOString()
  }
];

let meetingMessages: Record<string, MeetingMessageStore[]> = {
  'room-1': [
    { id: 'm1', senderName: 'Alice', text: 'Hey everyone! That Cyberpunk teaser looked incredible!', timestamp: new Date(Date.now() - 300000).toISOString() },
    { id: 'm2', senderName: 'Nexus_Creator', text: 'Thanks! I spent so long editing those neon color grading curves.', timestamp: new Date(Date.now() - 250000).toISOString() },
    { id: 'm3', senderName: 'Bob', text: 'The synth soundtrack was matching perfectly. Loved it!', timestamp: new Date(Date.now() - 120000).toISOString() }
  ],
  'room-2': [
    { id: 'm4', senderName: 'Sarah', text: 'Can we agree the warehouse scene was peak cinema?', timestamp: new Date(Date.now() - 500000).toISOString() },
    { id: 'm5', senderName: 'AdrenalineJunkie', text: 'Absolutely. No CGI, all pure practical stunt work!', timestamp: new Date(Date.now() - 400000).toISOString() },
    { id: 'm6', senderName: 'David', text: 'I had to rewatch that slide kick three times.', timestamp: new Date(Date.now() - 100000).toISOString() }
  ],
  'room-3': [
    { id: 'm7', senderName: 'Elena', text: 'The philosophy in these sci-fi shorts is really deep.', timestamp: new Date(Date.now() - 150000).toISOString() },
    { id: 'm8', senderName: 'CodeVanguard', text: 'Indeed, it really challenges what it means to be sentient.', timestamp: new Date(Date.now() - 90000).toISOString() }
  ]
};

// Periodic chat simulation to bring meeting rooms to life
const CHAT_NAMES = ['Aria', 'Soren', 'Kaelen', 'Nova', 'Lyra', 'Zephyr', 'Orion', 'Veda', 'Zane', 'Talia'];
const CHAT_PHRASES = [
  'Wow, did you see that camera transition?',
  'The spatial audio on this stream is superb!',
  'I am downloading this to watch on my flight tomorrow.',
  'Anyone else experiencing smooth streaming with adaptive bitrate?',
  'Yes! It seamlessly switched to 1080p for me.',
  'I am logging analytics right now, the dashboard must look busy!',
  'The live video synch makes this feel like a movie theater.',
  'Glad to be here with the community!',
  'Has anyone watched the nature doc yet?',
  'The neon cinematography is absolutely top notch!'
];

setInterval(() => {
  meetingRooms.forEach(room => {
    // 35% chance of a new message in each room
    if (Math.random() < 0.35) {
      const sender = CHAT_NAMES[Math.floor(Math.random() * CHAT_NAMES.length)];
      const text = CHAT_PHRASES[Math.floor(Math.random() * CHAT_PHRASES.length)];
      const id = room.id;
      if (!meetingMessages[id]) {
        meetingMessages[id] = [];
      }
      meetingMessages[id].push({
        id: `msg-sim-${Date.now()}`,
        senderName: sender,
        text,
        timestamp: new Date().toISOString()
      });
      // Cap at 40 messages to avoid leak
      if (meetingMessages[id].length > 40) {
        meetingMessages[id].shift();
      }
      // Slightly fluctuate participant count
      const shift = Math.random() > 0.5 ? 1 : -1;
      room.activeParticipants = Math.max(2, room.activeParticipants + shift);
    }
  });
}, 8000);

// API GET meetings
app.get('/api/meetings', (req, res) => {
  res.json(meetingRooms);
});

// API POST meeting
app.post('/api/meetings', (req, res) => {
  const { name, hostName } = req.body;
  if (!name || !hostName) {
    return res.status(400).json({ error: 'Name and hostName are required' });
  }
  const newRoom: MeetingRoomStore = {
    id: `room-${Date.now()}`,
    name,
    hostName,
    activeParticipants: 1,
    createdAt: new Date().toISOString()
  };
  meetingRooms.push(newRoom);
  meetingMessages[newRoom.id] = [
    {
      id: `msg-welcome`,
      senderName: 'System',
      text: `Meeting room "${name}" created by ${hostName}. Welcome!`,
      timestamp: new Date().toISOString()
    }
  ];
  res.status(201).json(newRoom);
});

// API Join meeting
app.post('/api/meetings/:id/join', (req, res) => {
  const { id } = req.params;
  const room = meetingRooms.find(r => r.id === id);
  if (room) {
    room.activeParticipants += 1;
    res.json(room);
  } else {
    res.status(404).json({ error: 'Room not found' });
  }
});

// API Leave meeting
app.post('/api/meetings/:id/leave', (req, res) => {
  const { id } = req.params;
  const room = meetingRooms.find(r => r.id === id);
  if (room) {
    room.activeParticipants = Math.max(0, room.activeParticipants - 1);
    res.json(room);
  } else {
    res.status(404).json({ error: 'Room not found' });
  }
});

// API GET messages
app.get('/api/meetings/:id/messages', (req, res) => {
  const { id } = req.params;
  res.json(meetingMessages[id] || []);
});

// API POST message
app.post('/api/meetings/:id/messages', (req, res) => {
  const { id } = req.params;
  const { senderName, text } = req.body;
  if (!senderName || !text) {
    return res.status(400).json({ error: 'senderName and text are required' });
  }
  const newMsg: MeetingMessageStore = {
    id: `msg-${Date.now()}`,
    senderName,
    text,
    timestamp: new Date().toISOString()
  };
  if (!meetingMessages[id]) {
    meetingMessages[id] = [];
  }
  meetingMessages[id].push(newMsg);
  res.status(201).json(newMsg);
});

// Vite Middleware & SPA Fallback setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // SPA fallback
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
