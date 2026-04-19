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
      toast.error("Failed to load floor data");
    } finally {
      setLoading(false);
    }
  };

  const handleTableUpdate = () => {
    fetchTables();
  };

  const handleFreeTable = async (id: string, tableNumber: number) => {
    if (!window.confirm(`Are you sure you want to manually free Table ${tableNumber}?`)) return;
    try {
      await api.post(`/tables/${id}/free`);
      toast.success(`Table ${tableNumber} is now available`);
      fetchTables();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to free table");
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen" style={{ background: 'var(--bg-deep)' }}>
      <div className="w-12 h-12 border-[3px] rounded-full animate-spin mb-5"
        style={{ borderColor: 'var(--bg-elevated)', borderTopColor: 'var(--accent)' }}
      ></div>
      <p className="font-bold text-[10px] uppercase tracking-[0.3em]" style={{ color: 'var(--text-dim)' }}>Mapping Floor...</p>
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
    <div className="p-6 lg:p-10 max-w-screen-2xl mx-auto animate-in space-y-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 glass-card flex items-center justify-center" style={{ color: 'var(--accent)' }}>
              <Map size={22} />
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-black tracking-tight" style={{ fontFamily: 'var(--font-outfit), sans-serif', color: 'var(--text-primary)' }}>
                Floor Map
              </h1>
              <p className="font-medium text-sm mt-0.5" style={{ color: 'var(--text-tertiary)' }}>Live table tracking & capacity</p>
            </div>
          </div>
        </div>
        
        {/* Filter */}
        <div className="flex items-center gap-2 p-1.5 rounded-xl self-stretch lg:self-auto"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-1.5 px-3 text-[10px] font-bold uppercase tracking-widest"
            style={{ color: 'var(--text-dim)', borderRight: '1px solid var(--border)' }}
          >
            <Filter size={12} />
            Status
          </div>
          <div className="flex gap-1 flex-1 lg:flex-none">
            {['ALL', 'AVAILABLE', 'OCCUPIED'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className="flex-1 lg:flex-none px-5 py-2 rounded-lg font-bold text-[10px] uppercase tracking-widest transition-all"
                style={filter === f ? {
                  background: 'var(--text-primary)',
                  color: 'var(--bg-deep)',
                } : {
                  color: 'var(--text-dim)',
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table Grid */}
      <div className="space-y-16">
        {sections.map((section) => {
          const sectionTables = filteredTables.filter(t => (t.section || 'General') === section);
          if (sectionTables.length === 0) return null;

          return (
            <div key={section} className="space-y-8">
              <div className="flex items-center gap-5">
                <h2 className="text-[11px] font-bold tracking-[0.3em] uppercase whitespace-nowrap" style={{ color: 'var(--text-dim)' }}>
                  {section} Section
                </h2>
                <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, var(--border-hover), transparent)' }}></div>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5 stagger-children">
                {sectionTables.map((table, i) => {
                  const isOccupied = table.status === 'OCCUPIED' || table.status === 'RESERVED';
                  
                  return (
                    <div
                      key={table.id}
                      className="group relative glass-card p-8 flex flex-col items-center justify-center transition-all duration-500 animate-in"
                      style={{
                        opacity: 0, animationDelay: `${i * 50}ms`, animationFillMode: 'forwards',
                        ...(isOccupied ? {
                          background: 'linear-gradient(135deg, rgba(239,68,68,0.08), var(--bg-surface))',
                          borderColor: 'rgba(239,68,68,0.2)',
                        } : {}),
                      }}
                    >
                      {/* Status LED */}
                      <div className={`absolute top-4 right-4 w-2.5 h-2.5 rounded-full ${isOccupied ? 'animate-pulse' : ''}`}
                        style={{
                          background: isOccupied ? 'var(--danger)' : 'var(--success)',
                          boxShadow: isOccupied ? '0 0 12px rgba(239,68,68,0.5)' : '0 0 12px rgba(34,197,94,0.4)',
                        }}
                      ></div>

                      <div className="flex flex-col items-center">
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1 transition-colors"
                          style={{ color: 'var(--text-dim)' }}
                        >Table</span>
                        <span className="text-5xl font-black tracking-tighter mb-6 transform transition-transform group-hover:scale-110"
                          style={{ color: isOccupied ? 'var(--danger)' : 'var(--text-primary)' }}
                        >
                          {table.tableNumber}
                        </span>
                        
                        <div className="flex items-center gap-2 py-2 px-4 rounded-xl"
                          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
                        >
                          <Users size={14} style={{ color: isOccupied ? 'var(--accent)' : 'var(--text-dim)' }} strokeWidth={2.5} />
                          <span className="text-[10px] font-bold uppercase tracking-widest"
                            style={{ color: 'var(--text-secondary)' }}
                          >{table.capacity} Seats</span>
                        </div>

                        {isOccupied ? (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleFreeTable(table.id, table.tableNumber); }}
                            className="mt-5 flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-xl transition-all hover:scale-110 active:scale-95 group-hover:bg-red-500 group-hover:text-white"
                            style={{ background: 'var(--danger-soft)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.2)' }}
                          >
                            <Clock size={10} strokeWidth={3} />
                            Free Table
                          </button>
                        ) : (
                          <div className="mt-5 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.3em] px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all transform translate-y-1 group-hover:translate-y-0"
                            style={{ background: 'var(--success-soft)', color: 'var(--success)', border: '1px solid rgba(34,197,94,0.2)' }}
                          >
                            <CheckCircle2 size={10} strokeWidth={3} />
                            Available
                          </div>
                        )}
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
        <div className="py-32 flex flex-col items-center justify-center glass-card" style={{ border: '1px dashed var(--border-hover)' }}>
          <MenuIcon size={56} strokeWidth={1} className="mb-5" style={{ color: 'var(--text-dim)' }} />
          <p className="text-sm font-bold uppercase tracking-[0.3em]" style={{ color: 'var(--text-dim)' }}>No tables in this filter</p>
        </div>
      )}
    </div>
  );
}
