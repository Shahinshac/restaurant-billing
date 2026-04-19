"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { 
  Plus, 
  Trash2, 
  Map, 
  X, 
  Check,
  Grid,
  Users as UsersIcon,
  Layers,
  LayoutGrid
} from "lucide-react";

export default function TableManager() {
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    tableNumber: 0,
    capacity: 4,
    section: "Main Hall"
  });

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const res = await api.get("/tables");
      setTables(res.data.data);
    } catch (error) {
      toast.error("Failed to load tables");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/tables", formData);
      toast.success("Table added successfully");
      setShowModal(false);
      fetchTables();
    } catch (error) {
      toast.error("Failed to add table. Number may already exist.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This will remove the table and its QR mapping.")) return;
    try {
      await api.delete(`/tables/${id}`);
      toast.success("Table removed");
      fetchTables();
    } catch (error) {
      toast.error("Cannot delete an occupied table");
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-10 h-10 border-[3px] rounded-full animate-spin mb-4"
        style={{ borderColor: 'var(--bg-elevated)', borderTopColor: 'var(--accent)' }}
      ></div>
      <p className="font-bold text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-dim)' }}>Loading Floor Plan...</p>
    </div>
  );

  return (
    <div className="p-6 md:p-8 lg:p-10 max-w-7xl mx-auto animate-in space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 glass-card flex items-center justify-center" style={{ color: 'var(--accent)' }}>
              <LayoutGrid size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-outfit), sans-serif', color: 'var(--text-primary)' }}>
                Floor Layout
              </h1>
              <p className="text-sm font-medium mt-0.5" style={{ color: 'var(--text-tertiary)' }}>Manage tables and seating capacity</p>
            </div>
          </div>
        </div>

        <button 
          onClick={() => setShowModal(true)}
          className="btn-saanam whitespace-nowrap"
        >
          <Plus size={16} strokeWidth={3} />
          Add Table
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {tables.map(table => (
          <div key={table.id} className="glow-card group p-8 flex flex-col items-center text-center animate-in">
            <div className="flex justify-between w-full mb-6">
              <div className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-dim)', border: '1px solid var(--border)' }}
              >
                {table.section}
              </div>
              <button 
                onClick={() => handleDelete(table.id)}
                className="text-white/20 hover:text-rose-500 transition-colors"
                title="Remove Table"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="relative mb-6">
              <div className="w-24 h-24 rounded-[30px] flex flex-col items-center justify-center transition-all group-hover:scale-110"
                style={{ 
                  background: 'var(--bg-elevated)', 
                  border: '2px dashed var(--border)',
                  boxShadow: table.status === 'OCCUPIED' ? '0 0 30px rgba(249,115,22,0.1)' : 'none'
                }}
              >
                <span className="text-4xl font-black tracking-tighter" style={{ color: 'var(--text-primary)' }}>{table.tableNumber}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">TABLE</span>
              </div>
              {table.status === 'OCCUPIED' && (
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-orange-500 border-4 border-zinc-900 animate-pulse"></div>
              )}
            </div>

            <div className="flex items-center gap-4 py-3 px-6 rounded-2xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2">
                <UsersIcon size={14} style={{ color: 'var(--text-dim)' }} />
                <span className="text-xs font-black">{table.capacity}</span>
              </div>
              <div className="w-px h-3 bg-white/10"></div>
              <div className="flex items-center gap-2">
                <Layers size={14} style={{ color: 'var(--text-dim)' }} />
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: table.status === 'FREE' ? 'var(--success)' : 'var(--accent)' }}>
                  {table.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)' }}
        >
          <div className="glass-card w-full max-w-md p-8 md:p-10 relative animate-scale-in">
            <button onClick={() => setShowModal(false)} className="absolute top-8 right-8 transition-all hover:opacity-60" style={{ color: 'var(--text-dim)' }}>
              <X size={22} />
            </button>

            <div className="space-y-1 mb-10">
              <h2 className="text-2xl font-black tracking-tight" style={{ fontFamily: 'var(--font-outfit), sans-serif', color: 'var(--text-primary)' }}>
                Register Table
              </h2>
              <p className="text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>Assign table number and capacity</p>
            </div>

            <form onSubmit={handleAddTable} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] px-0.5" style={{ color: 'var(--text-dim)' }}>Table Number</label>
                <input required type="number" className="input-saanam" placeholder="e.g. 15" value={formData.tableNumber || ""} onChange={e => setFormData({...formData, tableNumber: parseInt(e.target.value)})} />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] px-0.5" style={{ color: 'var(--text-dim)' }}>Capacity</label>
                  <input required type="number" className="input-saanam" placeholder="4" value={formData.capacity} onChange={e => setFormData({...formData, capacity: parseInt(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] px-0.5" style={{ color: 'var(--text-dim)' }}>Section</label>
                  <select className="input-saanam appearance-none" value={formData.section} onChange={e => setFormData({...formData, section: e.target.value})}>
                    <option value="Main Hall">Main Hall</option>
                    <option value="Executive">Executive</option>
                    <option value="Outdoor">Outdoor</option>
                    <option value="Rooftop">Rooftop</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="btn-saanam w-full flex items-center justify-center gap-3 mt-4" style={{ padding: '16px' }}>
                <Check size={18} strokeWidth={3} />
                Create Table
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
