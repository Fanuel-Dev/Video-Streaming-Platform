import React, { useState, useEffect, useRef } from 'react';
import { MeetingRoom, MeetingMessage, User } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Send, 
  Users, 
  PhoneOff, 
  Plus, 
  Hand, 
  Monitor, 
  Tv, 
  Search, 
  MessageSquare, 
  Radio, 
  Volume2, 
  Crown, 
  Sparkles, 
  X, 
  RefreshCw 
} from 'lucide-react';

interface LiveMeetingProps {
  currentUser: User | null;
  onLoginPrompt: () => void;
}

// Simulated active participants with initial static properties
interface Participant {
  name: string;
  avatarUrl: string;
  isHost?: boolean;
  isMuted?: boolean;
  isVideoOff?: boolean;
  isHandRaised?: boolean;
  isTalking?: boolean;
}

const SIM_PARTICIPANTS: Record<string, Participant[]> = {
  'room-1': [
    { name: 'Nexus_Creator', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces', isHost: true, isMuted: false, isVideoOff: false },
    { name: 'Alice', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces', isMuted: true },
    { name: 'Bob', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces', isMuted: false }
  ],
  'room-2': [
    { name: 'AdrenalineJunkie', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=faces', isHost: true, isMuted: false, isVideoOff: false },
    { name: 'Sarah', avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=faces', isMuted: false },
    { name: 'David', avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=faces', isMuted: true }
  ],
  'room-3': [
    { name: 'CodeVanguard', avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop&crop=faces', isHost: true, isMuted: false, isVideoOff: false },
    { name: 'Elena', avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=faces', isMuted: false }
  ]
};

export default function LiveMeeting({ currentUser, onLoginPrompt }: LiveMeetingProps) {
  // Navigation & Room state
  const [rooms, setRooms] = useState<MeetingRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<MeetingRoom | null>(null);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Create Room modal / form
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');

  // Inside meeting room state
  const [messages, setMessages] = useState<MeetingMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [participants, setParticipants] = useState<Participant[]>([]);
  
  // Local media controls
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [cameraPermissionError, setCameraPermissionError] = useState(false);

  // References
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  const pollIntervalRef = useRef<number | null>(null);

  // Fetch rooms list
  const fetchRooms = async () => {
    try {
      const res = await fetch('/api/meetings');
      if (res.ok) {
        const data = await res.json();
        setRooms(data);
      }
    } catch (err) {
      console.error('Failed to load rooms', err);
    } finally {
      setLoadingRooms(false);
    }
  };

  useEffect(() => {
    fetchRooms();
    const interval = window.setInterval(fetchRooms, 10000);
    return () => clearInterval(interval);
  }, []);

  // Set up camera & mic
  const startMediaStream = async () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      mediaStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setCameraPermissionError(false);
    } catch (err) {
      console.warn('Unable to get webcam/mic stream, using high-fidelity avatar view', err);
      setCameraPermissionError(true);
    }
  };

  const stopMediaStream = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
  };

  // Manage WebRTC stream when camera or active room changes
  useEffect(() => {
    if (activeRoom && isCamOn && !isScreenSharing) {
      startMediaStream();
    } else {
      stopMediaStream();
    }

    return () => stopMediaStream();
  }, [activeRoom, isCamOn, isScreenSharing]);

  // Sync / poll chat messages
  const fetchMessages = async (roomId: string) => {
    try {
      const res = await fetch(`/api/meetings/${roomId}/messages`);
      if (res.ok) {
        const data = await res.json();
        
        // Match simulated user names with active chat messages to highlight speaker tiles
        if (data.length > 0) {
          const lastMsg = data[data.length - 1];
          // If message is fresh (last 4 seconds), flag that participant as active speaker
          const msgTime = new Date(lastMsg.timestamp).getTime();
          const isFresh = Date.now() - msgTime < 4000;

          setParticipants(prev => 
            prev.map(p => ({
              ...p,
              isTalking: isFresh && p.name === lastMsg.senderName
            }))
          );
        }

        setMessages(data);
      }
    } catch (err) {
      console.error('Error fetching chat messages', err);
    }
  };

  // Start polling when joining a room
  useEffect(() => {
    if (activeRoom) {
      // Fetch instantly
      fetchMessages(activeRoom.id);
      // Poll every 3 seconds
      const poll = window.setInterval(() => {
        fetchMessages(activeRoom.id);
      }, 3000);
      pollIntervalRef.current = poll;

      // Seed current participants based on selection
      const seedPart = SIM_PARTICIPANTS[activeRoom.id] || [
        { name: 'Host_Streamer', avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces', isHost: true },
        { name: 'Spectator_A', avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&h=100&fit=crop&crop=faces' }
      ];
      setParticipants(seedPart);
    } else {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      setMessages([]);
      setParticipants([]);
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [activeRoom]);

  // Auto scroll to chat bottom
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Handle Room Actions
  const handleJoinRoom = async (room: MeetingRoom) => {
    if (!currentUser) {
      onLoginPrompt();
      return;
    }
    
    try {
      await fetch(`/api/meetings/${room.id}/join`, { method: 'POST' });
      setActiveRoom(room);
      setIsHandRaised(false);
      setIsScreenSharing(false);
    } catch (err) {
      console.error('Failed joining room', err);
    }
  };

  const handleLeaveRoom = async () => {
    if (!activeRoom) return;
    try {
      await fetch(`/api/meetings/${activeRoom.id}/leave`, { method: 'POST' });
    } catch (err) {
      console.error('Failed leaving room', err);
    } finally {
      setActiveRoom(null);
      stopMediaStream();
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onLoginPrompt();
      return;
    }
    if (!newRoomName.trim()) return;

    try {
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newRoomName.trim(),
          hostName: currentUser.username
        })
      });
      if (res.ok) {
        const newRoom = await res.json();
        setNewRoomName('');
        setShowCreateModal(false);
        fetchRooms();
        handleJoinRoom(newRoom);
      }
    } catch (err) {
      console.error('Failed creating room', err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !activeRoom || !chatInput.trim()) return;

    const textToSend = chatInput.trim();
    setChatInput('');

    // Optimistic render locally
    const tempMsg: MeetingMessage = {
      id: `temp-${Date.now()}`,
      senderName: currentUser.username,
      text: textToSend,
      timestamp: new Date().toISOString(),
      isMe: true
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      await fetch(`/api/meetings/${activeRoom.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderName: currentUser.username,
          text: textToSend
        })
      });
      fetchMessages(activeRoom.id);
    } catch (err) {
      console.error('Error posting message', err);
    }
  };

  // Helper filters
  const filteredRooms = rooms.filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.hostName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full space-y-6">
      
      {/* Dynamic Banner Header */}
      <div className="relative rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-800 p-6 md:p-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-left">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-red-600/10 border border-red-500/15 rounded-full text-[10px] font-semibold text-red-500 uppercase tracking-wider">
            <Radio className="w-3 h-3 animate-pulse" /> Community Live Hub
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Co-Watching & Real-Time Discussion
          </h2>
          <p className="text-xs text-neutral-400 max-w-xl">
            Join video conference lounges, stream live feeds from your webcam, raise your hand, and chat with creators or fellow film enthusiasts with low latency.
          </p>
        </div>

        {currentUser && !activeRoom && (
          <button
            id="create-room-btn"
            onClick={() => setShowCreateModal(true)}
            className="shrink-0 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs px-4 py-2 rounded-xl transition shadow-lg shadow-red-600/15 cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Start Live Room
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!activeRoom ? (
          /* ROOMS DIRECTORY VIEW */
          <motion.div
            key="directory"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Search Filter Controls */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative w-full sm:flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  id="room-search-input"
                  type="text"
                  placeholder="Search active community rooms or host name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-neutral-900/60 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-500 transition"
                />
              </div>

              <button
                id="refresh-rooms-btn"
                onClick={() => {
                  setLoadingRooms(true);
                  fetchRooms();
                }}
                className="w-full sm:w-auto px-4 py-2 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-xl text-neutral-300 hover:text-white transition flex items-center justify-center gap-1.5 text-xs cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingRooms ? 'animate-spin' : ''}`} />
                <span>Refresh Directory</span>
              </button>
            </div>

            {/* List Grid */}
            {loadingRooms ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-3">
                <RefreshCw className="w-8 h-8 text-neutral-600 animate-spin" />
                <span className="text-xs text-neutral-500 font-mono">Loading active lounges...</span>
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className="bg-neutral-900/30 border border-neutral-800 rounded-2xl p-12 text-center space-y-3">
                <Users className="w-10 h-10 text-neutral-600 mx-auto" />
                <h3 className="text-sm font-semibold text-white">No active meeting rooms</h3>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                  {searchQuery ? 'No rooms match your search query. Try another term.' : 'Be the first to open a live lounge and invite friends! Log in to get started.'}
                </p>
                {!currentUser && (
                  <button
                    onClick={onLoginPrompt}
                    className="mt-2 text-xs font-semibold text-red-500 hover:text-red-400 underline transition cursor-pointer"
                  >
                    Sign In to Create Room
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRooms.map((room) => (
                  <motion.div
                    key={room.id}
                    id={`room-card-${room.id}`}
                    whileHover={{ y: -2 }}
                    className="bg-neutral-900/60 border border-neutral-800 hover:border-neutral-700/80 rounded-xl p-5 space-y-4 flex flex-col justify-between transition group relative"
                  >
                    {/* Live glow badge */}
                    <div className="absolute top-4 right-4 flex items-center gap-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[9px] font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span> Live
                    </div>

                    <div className="space-y-1.5 text-left pr-8">
                      <h3 className="font-bold text-white text-sm tracking-tight group-hover:text-red-500 transition">
                        {room.name}
                      </h3>
                      <div className="flex items-center gap-1 text-[11px] text-neutral-500">
                        <Crown className="w-3 h-3 text-red-500" />
                        <span>Hosted by</span>
                        <span className="font-semibold text-neutral-300 truncate">{room.hostName}</span>
                      </div>
                    </div>

                    <div className="border-t border-neutral-900 pt-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1 text-neutral-400">
                        <Users className="w-3.5 h-3.5 text-neutral-500" />
                        <span className="font-bold text-neutral-200">{room.activeParticipants}</span>
                        <span className="text-neutral-500">active</span>
                      </div>

                      <button
                        id={`join-btn-${room.id}`}
                        onClick={() => handleJoinRoom(room)}
                        className="bg-neutral-800 hover:bg-red-600 text-white font-semibold text-[10px] uppercase px-3 py-1.5 rounded-lg transition tracking-wider cursor-pointer"
                      >
                        Join Room
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          /* ACTIVE MEETING ROOM ENVIRONMENT */
          <motion.div
            key="meeting-room"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[640px] md:h-[720px] items-stretch"
          >
            
            {/* LEFT SECTION: VIDEO CHANNELS (GRID) & INTERACTIVE PANEL CONTROLS */}
            <div className="lg:col-span-8 flex flex-col justify-between bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden p-4 space-y-4">
              
              {/* VIDEO GRID */}
              <div className="flex-1 grid grid-cols-2 gap-3 items-stretch min-h-0 overflow-y-auto pr-1">
                
                {/* LOCAL USER'S VIDEO CARD */}
                <div className={`relative rounded-xl overflow-hidden bg-neutral-900 border transition-all duration-300 flex flex-col justify-between ${
                  isHandRaised ? 'border-amber-500' : 'border-neutral-800'
                }`}>
                  {/* Aspect video canvas wrapper */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    {isCamOn && !isScreenSharing && !cameraPermissionError ? (
                      <video
                        id="local-webcam-feed"
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      /* HIGH-FIDELITY AVATAR GRAPHIC */
                      <div className="absolute inset-0 bg-gradient-to-b from-neutral-900 to-neutral-950 flex flex-col items-center justify-center space-y-3">
                        <div className="relative">
                          <img
                            src={currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces'}
                            alt="Your avatar"
                            className="w-16 h-16 rounded-full border-2 border-neutral-700 shadow-xl"
                            referrerPolicy="no-referrer"
                          />
                          {isMicOn && (
                            /* Pulse ring animation */
                            <div className="absolute -inset-1.5 rounded-full border border-emerald-500/40 animate-ping"></div>
                          )}
                        </div>
                        <div className="text-center">
                          <span className="text-xs font-semibold text-neutral-300">{currentUser?.username} (You)</span>
                          <span className="block text-[9px] text-neutral-500">
                            {isScreenSharing ? 'Screen sharing active' : (isCamOn ? 'Feed starting...' : 'Camera Disabled')}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* SCREEN SHARE PRESENTATION LAYER */}
                    {isScreenSharing && (
                      <div className="absolute inset-0 bg-neutral-950 border border-red-500/35 flex flex-col items-center justify-center text-center p-4">
                        <Tv className="w-10 h-10 text-red-500 animate-pulse mb-1.5" />
                        <span className="text-xs font-semibold text-neutral-100 uppercase tracking-widest">Presenter Screen</span>
                        <span className="text-[10px] text-neutral-400 mt-0.5">Capturing presentation console view</span>
                        <div className="mt-3 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
                          <span className="text-[9px] font-mono text-red-500">1080p @ 60 FPS</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Overlays */}
                  <div className="relative z-10 p-3 flex justify-between items-start pointer-events-none w-full">
                    <span className="bg-neutral-950/80 backdrop-blur-md px-2 py-0.5 rounded-lg text-[10px] font-medium text-neutral-300 flex items-center gap-1">
                      {isMicOn ? <Mic className="w-3 h-3 text-emerald-500" /> : <MicOff className="w-3 h-3 text-red-500" />}
                      <span>You</span>
                    </span>

                    <div className="flex gap-1.5">
                      {isHandRaised && (
                        <span className="bg-amber-500 text-neutral-950 font-bold px-2 py-0.5 rounded-lg text-[9px] uppercase flex items-center gap-0.5 animate-bounce">
                          <Hand className="w-3 h-3 fill-current" /> Hand Raised
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="relative z-10 p-3 pointer-events-none w-full text-left">
                    <span className="bg-neutral-950/40 backdrop-blur-sm text-[9px] text-neutral-400 font-mono">
                      {isScreenSharing ? 'SYSTEM_DISPLAY_SHARE' : 'LOCAL_WEBCAM_LOOPBACK'}
                    </span>
                  </div>
                </div>

                {/* OTHER PARTICIPANTS */}
                {participants.map((p, i) => (
                  <div
                    key={i}
                    className={`relative rounded-xl overflow-hidden bg-neutral-900 border transition-all duration-300 flex flex-col justify-between ${
                      p.isTalking ? 'border-emerald-500 shadow-lg shadow-emerald-500/5' : 'border-neutral-800'
                    }`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-b from-neutral-900 to-neutral-950 flex flex-col items-center justify-center space-y-3">
                      <div className="relative">
                        <img
                          src={p.avatarUrl}
                          alt={p.name}
                          className="w-16 h-16 rounded-full border-2 border-neutral-800"
                          referrerPolicy="no-referrer"
                        />
                        {p.isTalking && (
                          <div className="absolute -inset-1.5 rounded-full border border-emerald-500 animate-ping"></div>
                        )}
                        {p.isHost && (
                          <span className="absolute -top-1 -right-1 bg-red-600 p-0.5 rounded-full text-white" title="Host">
                            <Crown className="w-3.5 h-3.5 fill-current" />
                          </span>
                        )}
                      </div>

                      <div className="text-center">
                        <span className="text-xs font-semibold text-neutral-300">{p.name}</span>
                        {p.isTalking ? (
                          <span className="block text-[9px] text-emerald-500 font-medium animate-pulse">Speaking...</span>
                        ) : (
                          <span className="block text-[9px] text-neutral-500">Connected</span>
                        )}
                      </div>
                    </div>

                    {/* Participant Labels */}
                    <div className="relative z-10 p-3 flex justify-between items-start pointer-events-none w-full">
                      <span className="bg-neutral-950/80 backdrop-blur-md px-2 py-0.5 rounded-lg text-[10px] font-medium text-neutral-300 flex items-center gap-1">
                        {p.isMuted ? <MicOff className="w-3 h-3 text-red-500" /> : <Mic className="w-3 h-3 text-emerald-500" />}
                        <span>{p.name}</span>
                      </span>

                      {p.isHost && (
                        <span className="bg-red-500/10 text-red-500 border border-red-500/20 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider">
                          Host
                        </span>
                      )}
                    </div>

                    <div className="relative z-10 p-3 pointer-events-none w-full text-left">
                      {p.isTalking && (
                        /* Sound wave bar visual animation */
                        <div className="flex items-end gap-0.5 h-3">
                          <span className="w-0.5 bg-emerald-500 animate-[bounce_0.6s_infinite_100ms] h-1.5"></span>
                          <span className="w-0.5 bg-emerald-500 animate-[bounce_0.6s_infinite_300ms] h-3"></span>
                          <span className="w-0.5 bg-emerald-500 animate-[bounce_0.6s_infinite_200ms] h-2"></span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

              </div>

              {/* BOTTOM CONTROLS PANEL BAR */}
              <div className="border-t border-neutral-900 pt-4 flex flex-wrap items-center justify-between gap-3 bg-neutral-950">
                
                {/* Information badge */}
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-white truncate max-w-[180px]">{activeRoom.name}</span>
                  <span className="text-[9px] text-neutral-500 font-mono">ID: {activeRoom.id}</span>
                </div>

                {/* Main Action buttons */}
                <div className="flex items-center gap-2">
                  <button
                    id="toggle-mic-btn"
                    onClick={() => setIsMicOn(!isMicOn)}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition border cursor-pointer ${
                      isMicOn 
                        ? 'bg-neutral-900 border-neutral-800 text-emerald-400 hover:bg-neutral-800' 
                        : 'bg-red-600/15 border-red-500/30 text-red-500 hover:bg-red-600/25'
                    }`}
                    title={isMicOn ? 'Mute Microphone' : 'Unmute Microphone'}
                  >
                    {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                  </button>

                  <button
                    id="toggle-cam-btn"
                    onClick={() => setIsCamOn(!isCamOn)}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition border cursor-pointer ${
                      isCamOn 
                        ? 'bg-neutral-900 border-neutral-800 text-emerald-400 hover:bg-neutral-800' 
                        : 'bg-red-600/15 border-red-500/30 text-red-500 hover:bg-red-600/25'
                    }`}
                    title={isCamOn ? 'Disable Camera' : 'Enable Camera'}
                  >
                    {isCamOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                  </button>

                  <button
                    id="toggle-hand-btn"
                    onClick={() => setIsHandRaised(!isHandRaised)}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition border cursor-pointer ${
                      isHandRaised 
                        ? 'bg-amber-500 text-neutral-950 border-amber-600 hover:bg-amber-600' 
                        : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                    }`}
                    title="Raise Hand"
                  >
                    <Hand className="w-4 h-4 fill-current" />
                  </button>

                  <button
                    id="toggle-share-btn"
                    onClick={() => setIsScreenSharing(!isScreenSharing)}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition border cursor-pointer ${
                      isScreenSharing 
                        ? 'bg-red-600 text-white border-red-700 hover:bg-red-700' 
                        : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                    }`}
                    title="Share Screen"
                  >
                    <Monitor className="w-4 h-4" />
                  </button>
                </div>

                {/* Hang up call button */}
                <button
                  id="leave-meeting-btn"
                  onClick={handleLeaveRoom}
                  className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-lg shadow-red-600/15"
                >
                  <PhoneOff className="w-4 h-4" /> Leave Room
                </button>

              </div>

            </div>

            {/* RIGHT SECTION: CHAT & MEMBER ACTIVITY STREAM COLUMN */}
            <div className="lg:col-span-4 flex flex-col bg-neutral-900/40 border border-neutral-800 rounded-2xl overflow-hidden h-full">
              
              {/* Box Title */}
              <div className="bg-neutral-900/60 border-b border-neutral-800 px-4 py-3 flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                  <MessageSquare className="w-4 h-4 text-red-500" /> Active Conversation
                </span>
                
                <span className="bg-neutral-800 text-neutral-400 text-[10px] font-mono px-2 py-0.5 rounded-full">
                  {messages.length} messages
                </span>
              </div>

              {/* Chat timeline feed */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-left">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-2 opacity-50">
                    <MessageSquare className="w-8 h-8 text-neutral-600" />
                    <span className="text-xs font-semibold text-neutral-500">No chat history yet</span>
                    <p className="text-[10px] text-neutral-500 max-w-xs leading-relaxed">
                      Lobby chats are synced every 3 seconds. Send a greeting to begin!
                    </p>
                  </div>
                ) : (
                  messages.map((m, idx) => {
                    const isSystem = m.senderName === 'System';
                    const isCurrentUser = m.senderName === currentUser?.username;

                    if (isSystem) {
                      return (
                        <div key={m.id || idx} className="text-center">
                          <span className="inline-block bg-neutral-900 text-neutral-400 text-[9px] font-mono border border-neutral-800/60 px-2.5 py-0.5 rounded-full">
                            {m.text}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={m.id || idx}
                        className={`flex flex-col max-w-[85%] ${
                          isCurrentUser ? 'ml-auto items-end' : 'mr-auto items-start'
                        }`}
                      >
                        {/* Sender info */}
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-[10px] font-bold text-neutral-300">
                            {m.senderName}
                          </span>
                          <span className="text-[9px] text-neutral-500 font-mono">
                            {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>

                        {/* Bubble */}
                        <div className={`p-3 rounded-2xl text-xs leading-relaxed break-words text-left ${
                          isCurrentUser 
                            ? 'bg-red-600 text-white rounded-tr-none' 
                            : 'bg-neutral-900 text-neutral-200 border border-neutral-800 rounded-tl-none'
                        }`}>
                          {m.text}
                        </div>
                      </div>
                    );
                  })
                )}
                
                <div ref={chatBottomRef} />
              </div>

              {/* Chat Input panel */}
              <form onSubmit={handleSendMessage} className="p-3 bg-neutral-950 border-t border-neutral-900">
                <div className="relative flex items-center">
                  <input
                    id="chat-message-input"
                    type="text"
                    placeholder="Type a message to the group..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 focus:border-red-500 rounded-xl pl-4 pr-10 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none transition"
                  />
                  
                  <button
                    id="send-chat-btn"
                    type="submit"
                    className="absolute right-1.5 p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition cursor-pointer"
                    title="Send Message"
                  >
                    <Send className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </form>

            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* CREATE ROOM BLUEPRINT MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 max-w-md w-full shadow-2xl relative space-y-4"
            >
              <button
                id="close-create-modal-btn"
                onClick={() => setShowCreateModal(false)}
                className="absolute top-4 right-4 p-1.5 text-neutral-500 hover:text-white rounded-lg hover:bg-neutral-900 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-1.5 text-left">
                <h3 className="text-base font-bold text-white flex items-center gap-1.5 uppercase tracking-wide">
                  <Sparkles className="w-4 h-4 text-red-500" /> Create Live Room
                </h3>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  Lobby rooms host audio, video, screen share broadcasts, and live synchronizer chats for friends and subscribers.
                </p>
              </div>

              <form onSubmit={handleCreateRoom} className="space-y-4 text-left">
                <div className="space-y-1.5">
                  <label htmlFor="roomName" className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                    Room Name / Stream Topic
                  </label>
                  <input
                    id="create-room-name-input"
                    type="text"
                    required
                    placeholder="e.g. Creator Post-Show Discussion, Sci-Fi Film Club"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 focus:border-red-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none transition"
                  />
                </div>

                <div className="border-t border-neutral-900 pt-4 flex gap-3 justify-end text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 bg-neutral-900 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    id="submit-create-room-btn"
                    type="submit"
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition cursor-pointer shadow-lg shadow-red-600/10"
                  >
                    Create and Launch Room
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
