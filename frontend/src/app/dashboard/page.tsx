"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Users, PhilippinePeso, Clock, Grid, TrendingUp } from "lucide-react";

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

  if (loading) return <div className="p-8 flex items-center justify-center h-full"><div className="animate-pulse flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-[#FF6B35]"></div>Loading Dashboard...</div></div>;

  if (!stats) return <div className="p-8 flex flex-col items-center justify-center h-full text-gray-500">
    <p>Unable to load statistics. Please check your connection.</p>
    <button onClick={fetchStats} className="mt-4 px-4 py-2 bg-[#FF6B35] text-white rounded-lg">Retry</button>
  </div>;

  return (
    <div className="p-6 md:p-8 animate-fade-in max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Today's Overview</h1>
        <p className="text-gray-500 mt-1">Real-time restaurant performance metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: "Total Revenue", value: `₹${stats.revenueToday}`, icon: TrendingUp, color: "bg-[#ECFDF5]", text: "text-[#059669]" },
          { label: "Orders Today", value: stats.totalOrdersToday, icon: PhilippinePeso, color: "bg-[#EFF6FF]", text: "text-[#2563EB]" },
          { label: "Active Tables", value: stats.activeTablesCount, icon: Grid, color: "bg-[#FEF2F2]", text: "text-[#DC2626]" },
          { label: "Avg Wait Time", value: `${stats.avgWaitTime} mins`, icon: Clock, color: "bg-[#FFFbeb]", text: "text-[#D97706]" },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className={`w-12 h-12 rounded-full ${stat.color} ${stat.text} flex items-center justify-center mb-4`}>
              <stat.icon size={24} />
            </div>
            <h3 className="text-gray-500 font-medium text-sm">{stat.label}</h3>
            <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hidden md:block">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Peak Hours</h2>
            <div className="space-y-4">
              {stats?.peakHours?.length ? stats.peakHours.map((h: any, i: number) => (
                 <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                   <div className="flex items-center gap-3">
                     <Clock className="text-[#FF6B35]" size={20} />
                     <span className="font-semibold">{h.hour}:00 - {h.hour + 1}:00</span>
                   </div>
                   <span className="text-gray-600 bg-white px-3 py-1 rounded-lg border">{h.count} Orders</span>
                 </div>
              )) : <p className="text-gray-500">No data available yet</p>}
            </div>
        </div>
      </div>
    </div>
  );
}
