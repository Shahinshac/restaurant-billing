"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { 
  Users, 
  CreditCard, 
  Clock, 
  Grid, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  Activity,
  Zap,
  Target,
  BarChart3,
  Flame
} from "lucide-react";

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/analytics/summary');
      setStats(res.data.data);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--bg-deep)' }}>
      <div className="flex flex-col items-center gap-5">
        <div className="relative">
          <div className="w-14 h-14 border-[3px] rounded-full animate-spin"
            style={{ borderColor: 'var(--bg-elevated)', borderTopColor: 'var(--accent)' }}
          ></div>
          <Flame className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" size={22} style={{ color: 'var(--accent)' }} />
        </div>
        <p className="font-bold text-[10px] uppercase tracking-[0.3em]" style={{ color: 'var(--text-dim)' }}>Loading Intelligence...</p>
      </div>
    </div>
  );

  if (!stats) return (
    <div className="p-12 flex flex-col items-center justify-center min-h-[60vh] max-w-lg mx-auto text-center" style={{ color: 'var(--text-tertiary)' }}>
      <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-8" style={{ background: 'var(--bg-elevated)' }}>
        <Activity size={40} style={{ color: 'var(--text-dim)' }} />
      </div>
      <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Connection Error</h2>
      <p className="text-sm mb-10 leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>Unable to reach the analytics engine. Check your network and try again.</p>
      <button onClick={fetchStats} className="btn-saanam">Retry Connection</button>
    </div>
  );

  const metricCards = [
    { label: "Today's Revenue", value: `₹${stats.revenueToday.toLocaleString()}`, icon: CreditCard, color: 'var(--accent)', bg: 'var(--accent-soft)' },
    { label: "Guest Volume", value: stats.totalOrdersToday, icon: Users, color: '#3b82f6', bg: 'var(--info-soft)' },
    { label: "Active Tables", value: stats.activeTablesCount, icon: Grid, color: '#a855f7', bg: 'rgba(168,85,247,0.1)' },
    { label: "Avg Wait Time", value: `${stats.avgWaitTime}m`, icon: Clock, color: 'var(--success)', bg: 'var(--success-soft)' },
  ];

  return (
    <div className="p-6 lg:p-10 max-w-screen-2xl mx-auto space-y-10 animate-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="badge badge-accent">
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--accent)' }}></span>
              Live Dashboard
            </div>
            <span className="text-xs font-medium italic" style={{ color: 'var(--text-dim)' }}>Updated just now</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-black tracking-tight" style={{ fontFamily: 'var(--font-outfit), sans-serif', color: 'var(--text-primary)' }}>
            Command Center
          </h1>
          <p className="font-medium text-base" style={{ color: 'var(--text-tertiary)' }}>Real-time performance and operations overview.</p>
        </div>
        <button onClick={fetchStats} className="btn-ghost group">
          <Zap size={16} className="group-hover:text-[var(--accent)] transition-colors" />
          Refresh Data
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 stagger-children">
        {metricCards.map((stat, i) => (
          <div key={i} className="glow-card group p-7 animate-in" style={{ opacity: 0, animationDelay: `${i * 80}ms`, animationFillMode: 'forwards' }}>
            <div className="flex justify-between items-start mb-5">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110"
                style={{ background: stat.bg, color: stat.color }}
              >
                <stat.icon size={24} strokeWidth={2} />
              </div>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: 'var(--text-dim)' }}>{stat.label}</p>
            <p className="text-3xl font-black tracking-tighter" style={{ color: 'var(--text-primary)' }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Charts & System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Peak Hours */}
        <div className="lg:col-span-3 glass-card p-8">
          <div className="flex justify-between items-center mb-10">
            <div className="space-y-1">
              <h2 className="text-lg font-bold tracking-tight flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
                <TrendingUp style={{ color: 'var(--accent)' }} size={22} />
                Peak Hour Analysis
              </h2>
              <p className="text-sm font-medium italic" style={{ color: 'var(--text-dim)' }}>Hourly order distribution</p>
            </div>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-all hover:opacity-80"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-dim)' }}
            >
              <BarChart3 size={16} />
            </div>
          </div>
          
          <div className="space-y-6">
            {stats?.peakHours?.length ? stats.peakHours.slice(0, 6).map((h: any, i: number) => {
              const pct = Math.min(100, (h.count / 8) * 100); 
              return (
                <div key={i} className="group relative">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-xs font-bold uppercase tracking-tighter" style={{ color: 'var(--text-primary)' }}>
                      {h.hour}:00
                    </span>
                    <span className="text-[11px] font-bold" style={{ color: 'var(--text-dim)' }}>
                      {h.count} orders
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
                    <div 
                      className="h-full rounded-full transition-all duration-1000 group-hover:shadow-lg"
                      style={{ 
                        width: `${pct}%`,
                        background: 'linear-gradient(90deg, var(--accent), #fbbf24)',
                        boxShadow: 'none',
                      }}
                    ></div>
                  </div>
                </div>
              );
            }) : (
              <div className="py-20 flex flex-col items-center justify-center rounded-3xl" style={{ background: 'var(--bg-elevated)', border: '1px dashed var(--border-hover)' }}>
                <Target size={44} strokeWidth={1} className="mb-4 animate-pulse" style={{ color: 'var(--accent)', opacity: 0.5 }} />
                <p className="text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: 'var(--text-dim)' }}>Collecting Data</p>
              </div>
            )}
          </div>
        </div>

        {/* System Status */}
        <div className="lg:col-span-2 glass-card p-8 relative overflow-hidden group" style={{ background: 'var(--bg-surface)' }}>
          {/* Ambient glow */}
          <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl transition-all duration-700 group-hover:opacity-100 opacity-50"
            style={{ background: 'rgba(249,115,22,0.08)' }}
          ></div>
          
          <div className="relative z-10">
            <h2 className="text-lg font-bold mb-7 flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
              <Zap size={20} style={{ color: 'var(--accent)' }} />
              System Health
            </h2>
            
            <div className="space-y-3">
              {[
                { name: "POS Engine", status: "Online", delay: "4ms", ok: true },
                { name: "KDS Cloud", status: "Active", delay: "2ms", ok: true },
                { name: "Socket Relay", status: "Active", delay: "12ms", ok: true },
                { name: "Webhooks", status: "Monitoring", delay: "0ms", ok: false },
              ].map((sys, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-xl transition-all hover:bg-[var(--bg-elevated)]"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full"
                      style={{ 
                        background: sys.ok ? 'var(--success)' : 'var(--warning)',
                        boxShadow: sys.ok ? 'var(--shadow-glow-success)' : 'none',
                      }}
                    ></div>
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>{sys.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-primary)' }}>{sys.status}</p>
                    <p className="text-[10px] font-mono" style={{ color: 'var(--text-dim)' }}>{sys.delay}</p>
                  </div>
                </div>
              ))}
            </div>

            <button className="w-full mt-7 py-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95 btn-saanam">
              Run System Scan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
