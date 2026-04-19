"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { socket } from "@/lib/socket";
import toast from "react-hot-toast";
import { 
  Users, 
  Clock, 
  Map,
  Filter,
  CheckCircle2,
  Trash2,
  Menu as MenuIcon
} from "lucide-react";

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
      toast.error("Failed to synchronize floor layout");
    } finally {
      setLoading(false);
    }
  };

  const handleTableUpdate = () => {
    fetchTables();
  };

  if (loading) return (
    <div className="p-12 flex flex-col items-center justify-center min-h-screen bg-slate-50">
      <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin mb-6"></div>
      <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.3em]">Mapping Floor Assets...</p>
    </div>
  );

  const sections = Array.from(new Set(tables.map(t => t.section || 'General')));
  
  const filteredTables = tables.filter(t => {
    if (filter === 'ALL') return true;
    if (filter === 'AVAILABLE') return t.status === 'FREE' || t.status === 'AVAILABLE';
    if (filter === 'OCCUPIED') return t.status === 'OCCUPIED';
    return true;
  });

  return (
    <div className="p-8 lg:p-12 max-w-screen-2xl mx-auto animate-in space-y-12">
      {/* Strategic Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 bg-white premium-card flex items-center justify-center text-emerald-600">
                <Map size={24} />
             </div>
             <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">Operations Floor</h1>
                <p className="text-slate-500 font-medium text-lg leading-none mt-1">Live asset tracking and capacity synchronization.</p>
             </div>
          </div>
        </div>
        
        {/* Superior Filter System */}
        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm self-stretch lg:self-auto">
          <div className="flex items-center gap-2 px-4 text-slate-400 text-[10px] font-black uppercase tracking-widest border-r border-slate-100">
            <Filter size={14} />
            Status
          </div>
          <div className="flex gap-1 flex-1 lg:flex-none">
            {['ALL', 'AVAILABLE', 'OCCUPIED'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`flex-1 lg:flex-none px-6 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all ${
                  filter === f 
                    ? "bg-slate-900 text-white shadow-xl shadow-slate-200" 
                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid Architecture */}
      <div className="space-y-20">
        {sections.map((section) => {
          const sectionTables = filteredTables.filter(t => (t.section || 'General') === section);
          if (sectionTables.length === 0) return null;

          return (
            <div key={section} className="space-y-10">
              <div className="flex items-center gap-6">
                 <h2 className="text-xs font-black text-slate-400 tracking-[0.4em] uppercase whitespace-nowrap">{section} Section</h2>
                 <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent"></div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
                {sectionTables.map((table) => {
                  const isOccupied = table.status === 'OCCUPIED' || table.status === 'RESERVED';
                  
                  return (
                    <div
                      key={table.id}
                      className={`group relative premium-card p-10 flex flex-col items-center justify-center transition-all duration-500 ${
                        isOccupied
                          ? "bg-slate-900 text-white border-transparent"
                          : "hover:-translate-y-3 cursor-pointer"
                      }`}
                    >
                      {/* Operational Status Pin */}
                      <div className={`absolute top-6 right-6 w-3 h-3 rounded-full ${isOccupied ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'} shadow-lg ${isOccupied ? 'shadow-rose-500/50' : 'shadow-emerald-500/50'}`}></div>

                      <div className="flex flex-col items-center">
                         <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-2 group-hover:text-emerald-500 transition-colors">Table</span>
                         <span className={`text-6xl font-black tracking-tighter mb-8 transform transition-transform group-hover:scale-110 ${isOccupied ? 'text-white' : 'text-slate-900'}`}>
                           {table.tableNumber}
                         </span>
                         
                         <div className={`flex items-center gap-2.5 py-2.5 px-6 rounded-2xl border ${isOccupied ? 'bg-white/10 border-white/20' : 'bg-slate-50 border-slate-100'} transition-all`}>
                            <Users size={16} className={isOccupied ? 'text-emerald-400' : 'text-slate-400'} strokeWidth={2.5} />
                            <span className={`text-xs font-bold uppercase tracking-widest ${isOccupied ? 'text-white' : 'text-slate-600'}`}>{table.capacity} Guests</span>
                         </div>

                         {isOccupied ? (
                            <div className="mt-8 flex items-center gap-2 text-[10px] font-black text-rose-400 uppercase tracking-[0.3em] bg-rose-400/10 px-4 py-2 rounded-lg border border-rose-400/20">
                               <Clock size={12} strokeWidth={3} />
                               Active Terminal
                            </div>
                         ) : (
                            <div className="mt-8 flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-[0.3em] opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 border border-emerald-100">
                               <CheckCircle2 size={12} strokeWidth={3} />
                               Available
                            </div>
                         )}
                      </div>

                      {/* Tooling Layer */}
                      <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/0 rounded-[2rem] transition-all flex flex-col items-center justify-center p-8 opacity-0 group-hover:opacity-100 pointer-events-none">
                         {/* Hidden tools for future expansion */}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {filteredTables.length === 0 && (
         <div className="py-40 flex flex-col items-center justify-center text-slate-300 bg-white premium-card border-dashed">
            <MenuIcon size={64} strokeWidth={1} className="mb-6 text-slate-200" />
            <p className="text-sm font-black uppercase tracking-[0.4em] text-slate-300">No assets in this category</p>
         </div>
      )}
    </div>
  );
}
