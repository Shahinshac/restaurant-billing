"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { socket } from "@/lib/socket";
import toast from "react-hot-toast";
import { Users, LayoutGrid, Clock, ChevronRight } from "lucide-react";

export default function TablesPage() {
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'AVAILABLE' | 'OCCUPIED'>('ALL');

  useEffect(() => {
    fetchTables();
    
    socket.on('table_updated', handleTableUpdate);
    return () => {
      socket.off('table_updated', handleTableUpdate);
    };
  }, []);

  const fetchTables = async () => {
    try {
      const res = await api.get('/tables');
      setTables(res.data.data);
    } catch (error) {
      toast.error("Failed to load floor plan");
    } finally {
      setLoading(false);
    }
  };

  const handleTableUpdate = () => {
    fetchTables();
  };

  if (loading) return (
    <div className="p-12 flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-10 h-10 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin mb-4"></div>
      <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Scanning Floor Plan...</p>
    </div>
  );

  const sections = Array.from(new Set(tables.map(t => t.section)));
  
  const filteredTables = tables.filter(t => {
    if (filter === 'ALL') return true;
    if (filter === 'AVAILABLE') return t.status === 'FREE' || t.status === 'AVAILABLE';
    if (filter === 'OCCUPIED') return t.status === 'OCCUPIED';
    return true;
  });

  return (
    <div className="p-6 md:p-10 lg:p-12 max-w-7xl mx-auto animate-slide-up">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Operations Floor</h1>
          <p className="text-slate-500 font-medium mt-1">Live table status and capacity management</p>
        </div>
        
        {/* Modern Filter Switch */}
        <div className="flex bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm self-stretch md:self-auto">
          {['ALL', 'AVAILABLE', 'OCCUPIED'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`flex-1 md:flex-none px-6 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all ${
                filter === f 
                  ? "bg-slate-900 text-white shadow-lg" 
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Sections & Tables */}
      <div className="space-y-16">
        {sections.map((section) => (
          <div key={section}>
            <div className="flex items-center gap-4 mb-8">
               <h2 className="text-[11px] font-bold text-slate-400 tracking-[0.2em] uppercase whitespace-nowrap">{section}</h2>
               <div className="h-px flex-1 bg-slate-100"></div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {filteredTables.filter(t => t.section === section).map((table) => {
                const isOccupied = table.status === 'OCCUPIED' || table.status === 'RESERVED';
                
                return (
                  <div
                    key={table.id}
                    className={`group relative p-6 rounded-[2rem] flex flex-col items-center justify-center transition-all duration-300 border-2 ${
                      isOccupied
                        ? "bg-white border-slate-50 shadow-sm"
                        : "bg-white border-white shadow-xl shadow-slate-200/40 hover:-translate-y-2 cursor-pointer"
                    }`}
                  >
                    {/* Minimal Status Dot */}
                    <div className="absolute top-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                       <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{isOccupied ? 'Occupied' : 'Free'}</span>
                    </div>

                    <div className="mb-4">
                       <div className={`w-3 h-3 rounded-full ${isOccupied ? 'bg-rose-500' : 'bg-emerald-500'} shadow-lg shadow-emerald-500/20`}></div>
                    </div>
                    
                    <div className="flex flex-col items-center">
                       <span className="text-5xl font-bold text-slate-900 tracking-tighter mb-4 group-hover:scale-110 transition-transform">
                         {table.tableNumber}
                       </span>
                       
                       <div className="flex items-center gap-2 py-1.5 px-4 bg-slate-50 rounded-full border border-slate-100">
                          <Users size={12} className={isOccupied ? 'text-slate-300' : 'text-emerald-600'} />
                          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">{table.capacity} Person</span>
                       </div>

                       {isOccupied && (
                          <div className="mt-4 flex items-center gap-1 text-[8px] font-bold text-rose-500 uppercase tracking-[0.2em]">
                             <Clock size={10} strokeWidth={3} />
                             Active Service
                          </div>
                       )}
                    </div>

                    {/* Quick Action Overlay */}
                    {!isOccupied && (
                       <div className="mt-4 flex items-center gap-1 text-[9px] font-bold text-emerald-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                          Assign Table
                          <ChevronRight size={12} />
                       </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
