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
  BarChart3
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
    <div className="p-8 flex items-center justify-center min-h-screen bg-slate-50">
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
          <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-600 animate-pulse" size={24} />
        </div>
        <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.3em]">Syncing Intelligence...</p>
      </div>
    </div>
  );

  if (!stats) return (
    <div className="p-12 flex flex-col items-center justify-center min-h-[60vh] text-slate-500 max-w-lg mx-auto text-center">
      <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mb-8">
        <Activity size={40} className="text-slate-300" />
      </div>
      <h2 className="text-xl font-black text-slate-900 mb-2 mt-4">Console Disconnected</h2>
      <p className="text-slate-500 text-sm leading-relaxed mb-10">We're unable to establish a secure link with the core analytics engine. Please check your network credentials.</p>
      <button onClick={fetchStats} className="btn-premium px-10">Establish Connection</button>
    </div>
  );

  const metricCards = [
    { label: "Today's Revenue", value: `₹${stats.revenueToday.toLocaleString()}`, icon: CreditCard, trend: "+12.5%", isUp: true, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Guest Volume", value: stats.totalOrdersToday, icon: Users, trend: "+5.2%", isUp: true, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Operational Tables", value: stats.activeTablesCount, icon: Grid, trend: "Stable", isUp: true, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Avg Execution Time", value: `${stats.avgWaitTime}m`, icon: Clock, trend: "-2m", isUp: false, color: "text-rose-600", bg: "bg-rose-50" },
  ];

  return (
    <div className="p-8 lg:p-12 max-w-screen-2xl mx-auto animate-in space-y-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <div className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
               <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
               Live Intelligence
             </div>
             <span className="text-slate-300 text-xs font-medium italic">Updated just now</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Executive Console</h1>
          <p className="text-slate-500 font-medium text-lg">Daily performance and operational throughput summary.</p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={fetchStats} className="btn-secondary-premium group">
            <Zap size={16} className="group-hover:text-emerald-500 transition-colors" />
            Refresh Intelligence
          </button>
        </div>
      </div>

      {/* High-Impact Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {metricCards.map((stat, i) => (
          <div key={i} className="premium-card group p-8 hover:-translate-y-2">
            <div className="flex justify-between items-start mb-6">
              <div className={`w-14 h-14 rounded-2xl ${stat.bg} flex items-center justify-center ${stat.color} transition-all duration-500 group-hover:scale-110 shadow-sm`}>
                <stat.icon size={28} strokeWidth={2.5} />
              </div>
              <div className={`flex items-center gap-1.5 text-[11px] font-black px-3 py-1.5 rounded-xl ${stat.isUp ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                {stat.isUp ? <ArrowUpRight size={14} strokeWidth={3} /> : <ArrowDownRight size={14} strokeWidth={3} />}
                {stat.trend}
              </div>
            </div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em] mb-2">{stat.label}</p>
            <p className="text-3xl font-black text-slate-900 tracking-tighter">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Analytical Insights & Health */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        {/* Operation Velocity Chart */}
        <div className="lg:col-span-3 premium-card p-10">
           <div className="flex justify-between items-center mb-12">
              <div className="space-y-1">
                 <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                    <TrendingUp className="text-emerald-600" size={24} />
                    Operation Velocity
                 </h2>
                 <p className="text-sm text-slate-400 font-medium italic">Hourly distribution of incoming tickets</p>
              </div>
              <div className="flex gap-2">
                 <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer transition-all"><BarChart3 size={16} /></div>
              </div>
           </div>
           
           <div className="space-y-8">
              {stats?.peakHours?.length ? stats.peakHours.slice(0, 5).map((h: any, i: number) => {
                 const pct = Math.min(100, (h.count / 8) * 100); 
                 return (
                   <div key={i} className="group relative">
                      <div className="flex justify-between items-end mb-2.5">
                         <span className="text-xs font-black text-slate-900 uppercase tracking-tighter w-16">
                           {h.hour}:00
                         </span>
                         <span className="text-[11px] font-bold text-slate-400">
                           {h.count} Tickets / hour
                         </span>
                      </div>
                      <div className="h-3 bg-slate-50 rounded-full overflow-hidden border border-slate-100 flex items-center px-0.5">
                         <div 
                           className="h-2 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-1000 group-hover:shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                           style={{ width: `${pct}%` }}
                         ></div>
                      </div>
                   </div>
                 );
              }) : (
                <div className="py-24 flex flex-col items-center justify-center text-slate-300 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                   <Target size={48} strokeWidth={1} className="mb-6 opacity-40 animate-pulse text-emerald-600" />
                   <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400">Recording Data Cycles</p>
                </div>
              )}
           </div>
        </div>

        {/* Node Connectivity & Platform Health */}
        <div className="lg:col-span-2 premium-card p-10 bg-slate-900 text-white border-none shadow-2xl overflow-hidden relative group">
           {/* Abstract aesthetic element */}
           <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all duration-700"></div>
           
           <div className="relative z-10">
              <h2 className="text-xl font-bold mb-8 flex items-center gap-3">
                 <Zap size={22} className="text-emerald-400" />
                 Core Node Status
              </h2>
              
              <div className="space-y-5">
                 {[
                   { name: "POS Mainframe", status: "Nominal", delay: "4ms", color: "bg-emerald-400" },
                   { name: "KDS Cloud", status: "Active", delay: "2ms", color: "bg-emerald-400" },
                   { name: "Global Relay", status: "Active", delay: "12ms", color: "bg-emerald-400" },
                   { name: "External Webhooks", status: "Monitoring", delay: "0ms", color: "bg-amber-400" },
                 ].map((sys, i) => (
                   <div key={i} className="flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                      <div className="flex items-center gap-4">
                         <div className={`w-2.5 h-2.5 rounded-full ${sys.color} shadow-[0_0_12px_rgba(52,211,153,0.6)]`}></div>
                         <span className="text-xs font-bold tracking-tight opacity-70">{sys.name}</span>
                      </div>
                      <div className="text-right">
                         <p className="text-[11px] font-black uppercase tracking-widest">{sys.status}</p>
                         <p className="text-[10px] opacity-40 font-mono tracking-tighter">{sys.delay}</p>
                      </div>
                   </div>
                 ))}
              </div>

              <button className="w-full mt-10 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-900 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-emerald-500/20 active:scale-95">
                 Initialize Full Scan
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
