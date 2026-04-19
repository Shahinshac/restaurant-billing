"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Users, CreditCard, Clock, Grid, TrendingUp, ArrowUpRight, ArrowDownRight, Activity } from "lucide-react";

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
    <div className="p-8 flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium animate-pulse">Syncing operations...</p>
      </div>
    </div>
  );

  if (!stats) return (
    <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] text-slate-500">
      <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
        <Activity size={32} className="text-slate-300" />
      </div>
      <p className="font-semibold text-slate-900">Failed to load console</p>
      <p className="text-sm">Check your connection to the server.</p>
      <button onClick={fetchStats} className="mt-6 btn btn-secondary">Reconnect</button>
    </div>
  );

  const metricCards = [
    { label: "Daily Revenue", value: `₹${stats.revenueToday.toLocaleString()}`, icon: CreditCard, trend: "+12.5%", isUp: true },
    { label: "Total Covers", value: stats.totalOrdersToday, icon: Users, trend: "+5.2%", isUp: true },
    { label: "Active Tables", value: stats.activeTablesCount, icon: Grid, trend: "Stable", isUp: true },
    { label: "Avg. Turnaround", value: `${stats.avgWaitTime}m`, icon: Clock, trend: "-2m", isUp: false },
  ];

  return (
    <div className="p-6 md:p-10 lg:p-12 max-w-7xl mx-auto animate-slide-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Executive Dashboard</h1>
          <p className="text-slate-500 font-medium mt-1">Real-time performance metrics for today</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            System Live
          </div>
          <button onClick={fetchStats} className="btn btn-secondary !py-2 !px-4 text-xs">
            Refresh Data
          </button>
        </div>
      </div>

      {/* Primary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {metricCards.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                <stat.icon size={20} />
              </div>
              <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg ${stat.isUp ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>
                {stat.isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {stat.trend}
              </div>
            </div>
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Busy Hours Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
           <div className="flex justify-between items-center mb-8">
              <div>
                 <h2 className="text-lg font-bold text-slate-900">Operation Velocity</h2>
                 <p className="text-xs text-slate-500 font-medium mt-0.5">Order distribution by hour</p>
              </div>
              <TrendingUp size={20} className="text-emerald-600" />
           </div>
           
           <div className="space-y-6 pt-2">
              {stats?.peakHours?.length ? stats.peakHours.slice(0, 6).map((h: any, i: number) => {
                 const pct = Math.min(100, (h.count / 8) * 100); 
                 return (
                   <div key={i} className="group flex items-center gap-4">
                     <span className="text-[11px] font-bold text-slate-400 w-12 text-right">
                       {h.hour}:00
                     </span>
                     <div className="flex-1 h-2.5 bg-slate-50 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full transition-all duration-1000 group-hover:bg-emerald-600"
                          style={{ width: `${pct}%` }}
                        ></div>
                     </div>
                     <span className="text-[11px] font-bold text-slate-900 w-16">
                       {h.count} Orders
                     </span>
                   </div>
                 );
              }) : (
                <div className="py-20 flex flex-col items-center justify-center text-slate-300">
                   <Clock size={40} strokeWidth={1.5} className="mb-3" />
                   <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Recording Data Cycles</p>
                </div>
              )}
           </div>
        </div>

        {/* System Health */}
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex flex-col">
           <h2 className="text-lg font-bold text-slate-900 mb-6 font-primary">Node Connectivity</h2>
           
           <div className="space-y-4 flex-1">
              {[
                { name: "POS Mainframe", status: "Healthy", delay: "4ms", color: "bg-emerald-500" },
                { name: "KDS Terminal", status: "Active", delay: "2ms", color: "bg-emerald-500" },
                { name: "Kitchen Printer", status: "Standby", delay: "0ms", color: "bg-emerald-500" },
                { name: "External Payment", status: "Online", delay: "12ms", color: "bg-emerald-500" },
              ].map((sys, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/50 border border-slate-50">
                   <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${sys.color} shadow-[0_0_8px_rgba(16,185,129,0.5)]`}></div>
                      <span className="text-xs font-semibold text-slate-700">{sys.name}</span>
                   </div>
                   <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-900">{sys.status}</p>
                      <p className="text-[10px] text-slate-400">{sys.delay}</p>
                   </div>
                </div>
              ))}
           </div>

           <button className="w-full mt-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all">
              Initialize System Scan
           </button>
        </div>
      </div>
    </div>
  );
}
