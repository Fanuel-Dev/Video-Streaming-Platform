import React from 'react';
import { User } from '../types';
import { Video, Download, Activity, Cloud, LogIn, LogOut, RefreshCw, Users } from 'lucide-react';

interface NavigationProps {
  activeTab: 'catalog' | 'offline' | 'analytics' | 'meetings';
  setActiveTab: (tab: 'catalog' | 'offline' | 'analytics' | 'meetings') => void;
  currentUser: User | null;
  onLoginClick: () => void;
  onLogoutClick: () => void;
  syncing: boolean;
}

export default function Navigation({
  activeTab,
  setActiveTab,
  currentUser,
  onLoginClick,
  onLogoutClick,
  syncing
}: NavigationProps) {
  return (
    <header className="bg-neutral-950/80 backdrop-blur-md border-b border-neutral-900 sticky top-0 z-40 px-4 md:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Humble Literal Logo */}
        <div className="flex items-center gap-2">
          <div className="bg-red-600 p-1.5 rounded-lg text-white">
            <Video className="w-5 h-5 fill-current" />
          </div>
          <span className="text-sm font-bold text-white uppercase tracking-wider">
            Video Streaming Platform
          </span>
        </div>

        {/* Tab Selection */}
        <nav className="flex items-center gap-1 bg-neutral-900 p-1 rounded-xl">
          <button
            id="nav-catalog-tab"
            onClick={() => setActiveTab('catalog')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'catalog' 
                ? 'bg-neutral-800 text-white' 
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Catalog</span>
          </button>

          <button
            id="nav-offline-tab"
            onClick={() => setActiveTab('offline')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'offline' 
                ? 'bg-neutral-800 text-white' 
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Offline Vault</span>
          </button>

          <button
            id="nav-analytics-tab"
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'analytics' 
                ? 'bg-neutral-800 text-white' 
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Live Analytics</span>
          </button>

          <button
            id="nav-meetings-tab"
            onClick={() => setActiveTab('meetings')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'meetings' 
                ? 'bg-neutral-800 text-white' 
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Live Rooms</span>
          </button>
        </nav>

        {/* Auth Panel & Sync Indicators */}
        <div className="flex items-center gap-4">
          
          {/* Synchronizer indicator */}
          {currentUser && (
            <div 
              id="sync-indicator" 
              className={`flex items-center gap-1.5 px-2 py-1 rounded bg-neutral-900 border border-neutral-800/80 text-[10px] ${
                syncing ? 'text-red-500 font-bold' : 'text-neutral-500'
              }`}
              title={syncing ? 'Synchronizing Watch Progress...' : 'History Cloud-Synced'}
            >
              {syncing ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <Cloud className="w-3 h-3 text-emerald-500" />
              )}
              <span className="hidden sm:inline">
                {syncing ? 'Syncing...' : 'Synced'}
              </span>
            </div>
          )}

          {/* User Section */}
          {currentUser ? (
            <div id="user-profile-badge" className="flex items-center gap-3">
              <div className="flex flex-col items-end hidden sm:flex">
                <span className="text-xs font-semibold text-white truncate max-w-[120px]">
                  {currentUser.username}
                </span>
                <span className="text-[9px] text-neutral-500">Authenticated</span>
              </div>
              <img 
                src={currentUser.avatarUrl} 
                alt="Profile Avatar" 
                className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800"
                referrerPolicy="no-referrer"
              />
              <button
                id="sign-out-btn"
                onClick={onLogoutClick}
                className="p-2 text-neutral-400 hover:text-red-500 rounded-lg hover:bg-neutral-900 transition cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              id="sign-in-btn"
              onClick={onLoginClick}
              className="bg-red-600 hover:bg-red-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-lg shadow-red-600/10 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In / Sync</span>
            </button>
          )}

        </div>

      </div>
    </header>
  );
}
