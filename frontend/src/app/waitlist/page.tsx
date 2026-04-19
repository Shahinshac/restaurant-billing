"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { socket } from "@/lib/socket";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";
import { 
  Users, 
  Clock, 
  UserPlus, 
  Bell, 
  CheckCircle, 
  XCircle, 
  Grid, 
  Phone,
  ArrowRight,
  Flame,
  Activity
} from "lucide-react";

export default function WaitlistPage() {
  const [waitlist, setWaitlist] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newGuest, setNewGuest] = useState({ customerName: '', peopleCount: '2', notes: '', customerPhone: '' });
  const [selectedForSeating, setSelectedForSeating] = useState<any>(null);

  useEffect(() => {
    fetchData();
    socket.on('waitlist_updated', fetchData);
    socket.on('table_updated', fetchData);
    return () => {
      socket.off('waitlist_updated');
      socket.off('table_updated');
    };
  }, []);

  const fetchData = async () => {
    try {
      const [wlRes, tblRes] = await Promise.all([
        api.get('/waitlist'),
        api.get('/tables')
      ]);
      setWaitlist(wlRes.data.data);
      setTables(tblRes.data.data);
    } catch (error) {
      toast.error("Waitlist sync error");
    } finally {
      setLoading(false);
    }
  };

  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/waitlist', newGuest);
      toast.success("Guest added to Waitlist");
      setNewGuest({ customerName: '', peopleCount: '2', notes: '', customerPhone: '' });
      setShowAddForm(false);
    } catch (error) {
      toast.error("Failed to add guest");
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/waitlist/${id}/status`, { status });
      if (status === 'NOTIFIED') toast.success("Guest notified!");
    } catch (error) {
      toast.error("Status update failed");
    }
  };

  const seatGuest = async (waitlistId: string, tableId: string) => {
    try {
      await api.post(`/waitlist/${waitlistId}/assign`, { tableId });
      toast.success("Guest Seated!");
      setSelectedForSeating(null);
    } catch (error) {
      toast.error("Seating failed");
    }
  };

  const deleteEntry = async (id: string) => {
    try {
      await api.delete(`/waitlist/${id}`);
      toast.success("Removed from list");
    } catch (error) {
      toast.error("Remove failed");
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-10 h-10 border-[3px] rounded-full animate-spin mb-4"
        style={{ borderColor: 'var(--bg-elevated)', borderTopColor: 'var(--accent)' }}
      ></div>
      <p className="font-bold text-[10px] uppercase tracking-widest text-[#52525b]">Syncing Waitlist...</p>
    </div>
  );

  const freeTables = tables.filter(t => t.status === 'FREE');

  return (
    <div className="p-5 md:p-8 lg:p-10 min-h-screen" style={{ background: 'var(--bg-deep)' }}>
      {/* Header Section */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-10 gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 glass-card flex items-center justify-center text-orange-500 bg-[#18181b] border border-white/5 rounded-2xl">
            <Users size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white" style={{ fontFamily: 'var(--font-outfit), sans-serif' }}>
              Waitlist
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] mt-1 text-[#a1a1aa]">
              Guest Flow Management
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full xl:w-auto">
          <div className="flex-1 xl:flex-none glass-card px-6 py-3 border border-white/5 bg-[#18181b] rounded-2xl flex items-center gap-8">
            <div className="flex flex-col">
              <span className="text-[9px] font-bold uppercase tracking-widest text-[#52525b] mb-1 flex items-center gap-1.5">
                <Activity size={10} />
                Live Status
              </span>
              <div className="flex items-center gap-3">
                <span className="text-xl font-black text-white">{waitlist.length}</span>
                <span className="text-[10px] font-bold text-[#a1a1aa] uppercase tracking-wider">Waiting</span>
              </div>
            </div>
            <div className="w-px h-8 bg-white/5"></div>
            <div className="flex flex-col">
              <span className="text-[9px] font-bold uppercase tracking-widest text-[#52525b] mb-1 flex items-center gap-1.5">
                <Grid size={10} />
                Tables
              </span>
              <div className="flex items-center gap-3">
                <span className="text-xl font-black text-emerald-500">{freeTables.length}</span>
                <span className="text-[10px] font-bold text-[#a1a1aa] uppercase tracking-wider">Available</span>
              </div>
            </div>
          </div>

          <button 
            onClick={() => setShowAddForm(true)}
            className="btn-saanam whitespace-nowrap"
          >
            <UserPlus size={16} />
            Add Guest
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main List Area */}
        <div className="lg:col-span-8 space-y-4">
          {waitlist.length === 0 ? (
            <div className="py-24 flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-[#27272a]">
              <div className="w-16 h-16 rounded-full bg-[#18181b] flex items-center justify-center mb-6">
                <Users size={32} className="text-[#52525b]" />
              </div>
              <p className="text-sm font-bold uppercase tracking-widest text-[#52525b]">No guests waiting</p>
            </div>
          ) : (
            waitlist.map((entry) => (
              <div key={entry.id} 
                className="group relative overflow-hidden glass-card p-6 flex items-center gap-6 border border-white/5 bg-[#18181b] rounded-[2rem] transition-all hover:scale-[1.01]"
              >
                {/* Visual Status Indicator */}
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${entry.status === 'NOTIFIED' ? 'bg-orange-500' : 'bg-blue-500/50'}`}></div>

                <div className="w-16 h-16 shrink-0 rounded-2xl flex items-center justify-center font-black text-2xl"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--accent)' }}
                >
                  {entry.peopleCount}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-bold text-white truncate">{entry.customerName}</h3>
                    {entry.status === 'NOTIFIED' && (
                      <span className="badge badge-accent bg-orange-500/10 text-orange-500 text-[9px] animate-pulse">NOTIFIED</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-[#a1a1aa]">
                    <span className="text-[11px] font-medium flex items-center gap-1.5 uppercase tracking-wider">
                      <Clock size={12} />
                      {formatDistanceToNow(new Date(entry.createdAt))}
                    </span>
                    {entry.customerPhone && (
                      <span className="text-[11px] font-medium flex items-center gap-1.5">
                        <Phone size={12} />
                        {entry.customerPhone}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => updateStatus(entry.id, 'NOTIFIED')}
                    className="p-3 rounded-xl transition-all hover:bg-orange-500/10 hover:text-orange-500 text-[#52525b]"
                    title="Notify Guest"
                  >
                    <Bell size={20} />
                  </button>
                  <button 
                    onClick={() => setSelectedForSeating(entry)}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white"
                  >
                    <ArrowRight size={16} />
                    Seat Guest
                  </button>
                  <button 
                    onClick={() => deleteEntry(entry.id)}
                    className="p-3 rounded-xl transition-all hover:bg-rose-500/10 hover:text-rose-500 text-[#52525b]"
                  >
                    <XCircle size={20} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Sidebar Info/Live Stats */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-card p-8 border border-white/5 bg-[#18181b] rounded-[2.5rem]">
            <h2 className="text-xl font-black mb-6 flex items-center gap-3 text-white">
              <Clock size={22} className="text-orange-500" />
              Guidelines
            </h2>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0 text-orange-500 font-bold text-sm">1</div>
                <p className="text-sm leading-relaxed text-[#a1a1aa]">Always cross-check party size with table capacity before seating.</p>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0 text-orange-500 font-bold text-sm">2</div>
                <p className="text-sm leading-relaxed text-[#a1a1aa]">Notify guests via SMS or voice when their table is ready for service.</p>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0 text-orange-500 font-bold text-sm">3</div>
                <p className="text-sm leading-relaxed text-[#a1a1aa]">Reserved tables are prioritized for confirmed bookings.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════ MODAL: Add Guest Form ═══════ */}
      {showAddForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-5 bg-black/80 backdrop-blur-sm animate-in">
          <div 
            className="w-full max-w-md glass-card p-8 bg-[#18181b] border border-white/5 rounded-[2.5rem] shadow-2xl relative animate-scale-in"
            onClick={e => e.stopPropagation()}
          >
            <button onClick={() => setShowAddForm(false)} className="absolute top-6 right-6 p-2 text-[#52525b] hover:text-white transition-colors">
              <XCircle size={22} />
            </button>
            <h2 className="text-2xl font-black mb-1 text-white">Guest Entry</h2>
            <p className="text-[10px] font-bold uppercase tracking-widest text-orange-500 mb-8">Add to Active List</p>
            
            <form onSubmit={handleAddGuest} className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#52525b] ml-4">Guest Name</label>
                <input 
                  autoFocus
                  required
                  type="text" 
                  placeholder="e.g. Rahul Sharma"
                  className="input-saanam"
                  value={newGuest.customerName}
                  onChange={e => setNewGuest({...newGuest, customerName: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#52525b] ml-4">Party Size</label>
                  <input 
                    required
                    type="number" 
                    placeholder="2"
                    className="input-saanam"
                    value={newGuest.peopleCount}
                    onChange={e => setNewGuest({...newGuest, peopleCount: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#52525b] ml-4">Contact</label>
                  <input 
                    type="tel" 
                    placeholder="98765 43210"
                    className="input-saanam"
                    value={newGuest.customerPhone}
                    onChange={e => setNewGuest({...newGuest, customerPhone: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#52525b] ml-4">Special Notes</label>
                <textarea 
                  placeholder="Allergies, specific table requested..."
                  className="input-saanam min-h-[100px] resize-none"
                  value={newGuest.notes}
                  onChange={e => setNewGuest({...newGuest, notes: e.target.value})}
                />
              </div>

              <button type="submit" className="btn-saanam w-full py-5 text-[11px] uppercase tracking-[0.2em]">
                Confirm Entry
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ═══════ MODAL: Seat Guest (Table Selector) ═══════ */}
      {selectedForSeating && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-5 bg-black/80 backdrop-blur-sm animate-in">
          <div 
            className="w-full max-w-2xl glass-card p-10 bg-[#18181b] border border-white/5 rounded-[3rem] shadow-2xl relative animate-scale-in"
            onClick={e => e.stopPropagation()}
          >
            <button onClick={() => setSelectedForSeating(null)} className="absolute top-8 right-8 p-2 text-[#52525b] hover:text-white transition-colors">
              <XCircle size={22} />
            </button>
            
            <div className="flex items-center gap-6 mb-10">
              <div className="w-20 h-20 rounded-[1.5rem] flex items-center justify-center font-black text-3xl bg-orange-500 text-white shadow-lg">
                {selectedForSeating.peopleCount}
              </div>
              <div>
                <h2 className="text-3xl font-black text-white">{selectedForSeating.customerName}</h2>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-xs font-bold text-[#a1a1aa] tracking-tight">Assigning Table</span>
                  <ArrowRight size={14} className="text-emerald-500" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {tables.map((table) => {
                const isOccupied = table.status !== 'FREE';
                const isPerfectFit = table.capacity >= selectedForSeating.peopleCount && table.capacity <= selectedForSeating.peopleCount + 2;
                
                return (
                  <button 
                    disabled={isOccupied}
                    onClick={() => seatGuest(selectedForSeating.id, table.id)}
                    key={table.id}
                    className="relative aspect-square flex flex-col items-center justify-center rounded-3xl transition-all hover:scale-105 active:scale-95 disabled:opacity-20 disabled:scale-100"
                    style={{
                      background: isOccupied ? 'rgba(0,0,0,0.2)' : (isPerfectFit ? 'rgba(34,197,94,0.1)' : 'var(--bg-elevated)'),
                      border: isOccupied ? '1px solid transparent' : (isPerfectFit ? '2px solid var(--success)' : '1px solid var(--border)'),
                      color: isOccupied ? '#52525b' : (isPerfectFit ? 'var(--success)' : 'white')
                    }}
                  >
                    <span className="text-xl font-black tracking-tighter">T{table.tableNumber}</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest mt-1.5 opacity-60">{table.capacity} PAX</span>
                    {isPerfectFit && !isOccupied && (
                      <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
                        <CheckCircle size={12} className="text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-10 p-5 rounded-2xl bg-white/5 border border-white/5">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#52525b] text-center">
                Double tap any available table to finalize seating
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
