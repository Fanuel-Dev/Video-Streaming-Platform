import React, { useEffect, useState } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, BarChart, Bar, Legend 
} from 'recharts';
import { Activity, ShieldAlert, Wifi, Eye, RefreshCw, BarChart2 } from 'lucide-react';

const COLORS = ['#e11d48', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

export default function AnalyticsDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/analytics/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (e) {
      console.error('Failed to load telemetry stats', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchStats, 4000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  if (loading || !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-neutral-400 gap-2 bg-neutral-900 border border-neutral-800 rounded-2xl">
        <RefreshCw className="w-8 h-8 animate-spin text-red-500" />
        <p className="text-sm">Initiating real-time telemetry pipelines...</p>
      </div>
    );
  }

  return (
    <div id="analytics-dashboard-panel" className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-widest">Concurrent Streamers</span>
            <Eye className="w-4 h-4 text-emerald-500 animate-pulse" />
          </div>
          <h3 className="text-2xl font-bold text-white">{stats.activeWatchers}</h3>
          <p className="text-[10px] text-emerald-400 mt-1">● Live sessions active in sandbox</p>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-widest">Ingested Logs</span>
            <Activity className="w-4 h-4 text-blue-500" />
          </div>
          <h3 className="text-2xl font-bold text-white">{stats.totalEvents}</h3>
          <p className="text-[10px] text-blue-400 mt-1">Telemetry events parsed to disk</p>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-widest">Buffer Stall Index</span>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          <h3 className="text-2xl font-bold text-white">{stats.stallRate}%</h3>
          <p className="text-[10px] text-rose-400 mt-1">Buffer-starts / Plays ratio</p>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-widest">Pipeline Refresh</span>
            <button 
              onClick={fetchStats} 
              className="text-neutral-500 hover:text-white transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] text-neutral-400">Auto-Polling (4s)</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={autoRefresh} 
                onChange={() => setAutoRefresh(!autoRefresh)} 
                className="sr-only peer"
              />
              <div className="w-7 h-4 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-red-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Dynamic Timeline Area Chart */}
        <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-2xl p-5 flex flex-col">
          <h3 className="text-sm font-bold text-white flex items-center gap-1.5 mb-4">
            <BarChart2 className="w-4 h-4 text-red-500" /> Real-time Activity Timeline (Playback vs Stalls)
          </h3>
          <div className="flex-1 h-64 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.timelineChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPlayback" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorBuffering" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e11d48" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#e11d48" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#525252" fontSize={10} tickLine={false} />
                <YAxis stroke="#525252" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#262626', fontSize: 11 }} />
                <Area type="monotone" dataKey="playback" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorPlayback)" name="Active Streams" />
                <Area type="monotone" dataKey="buffering" stroke="#e11d48" strokeWidth={2} fillOpacity={1} fill="url(#colorBuffering)" name="Buffering Delay" />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Resolution Donut Chart */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 flex flex-col items-center">
          <h3 className="text-sm font-bold text-white self-start flex items-center gap-1.5 mb-4">
            <Wifi className="w-4 h-4 text-blue-500" /> Resolution Distribution
          </h3>
          <div className="flex-1 w-full h-52 min-h-[200px] flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.qualityChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {stats.qualityChartData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#262626', fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 m-auto w-16 h-16 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] text-neutral-500 uppercase tracking-widest">Active</span>
              <span className="text-base font-extrabold text-white">Stream</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 w-full text-center mt-2">
            {stats.qualityChartData.map((entry: any, index: number) => (
              <div key={entry.name} className="bg-neutral-950 border border-neutral-800/40 rounded py-1">
                <span className="block text-[10px] text-neutral-500 font-bold uppercase">{entry.name}</span>
                <span className="text-xs font-mono font-bold text-white">{entry.value} logs</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Network Profile and Popularity Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Network Speeds Profiles */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 flex flex-col">
          <h3 className="text-sm font-bold text-white flex items-center gap-1.5 mb-4">
            <Wifi className="w-4 h-4 text-emerald-500" /> Simulated Streamers Network Profile
          </h3>
          <div className="flex-1 h-56 min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.networkChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#525252" fontSize={10} tickLine={false} />
                <YAxis stroke="#525252" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#262626', fontSize: 11 }} />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Session Sessions">
                  {stats.networkChartData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 1) % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Video Popularity share */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 flex flex-col">
          <h3 className="text-sm font-bold text-white flex items-center gap-1.5 mb-4">
            <Activity className="w-4 h-4 text-orange-500" /> In-App Playback Ingests By Video
          </h3>
          <div className="flex-1 h-56 min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                layout="vertical"
                data={stats.videoChartData} 
                margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
              >
                <XAxis type="number" stroke="#525252" fontSize={9} tickLine={false} />
                <YAxis dataKey="name" type="category" stroke="#525252" fontSize={9} tickLine={false} width={80} />
                <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#262626', fontSize: 11 }} />
                <Bar dataKey="count" fill="#f59e0b" radius={[0, 4, 4, 0]} name="Hits" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
