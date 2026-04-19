"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { socket } from "@/lib/socket";
import toast from "react-hot-toast";
import { 
  Plus, 
  Clock, 
  Users, 
  X, 
  UserPlus, 
  CheckCircle2,
  ListOrdered
} from "lucide-react";

export default function QueuePage() {
  const [queues, setQueues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ customerName: '', partySize: 2, phone: '' });

  useEffect(() => {
    fetchQueue();
    
    socket.on('queue_updated', handleQueueUpdate);
    return () => {
      socket.off('queue_updated', handleQueueUpdate);
    };
  }, []);

  const fetchQueue = async () => {
    try {
      const res = await api.get('/queue');
      setQueues(res.data.data);
    } catch (error) {
      toast.error("Failed to synchronize waitlist assets");
    } finally {
      setLoading(false);
    }
  };

  const handleQueueUpdate = () => {
    fetchQueue();
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/queue', formData);
      toast.success("Guest registration successful");
      setShowAddModal(false);
      setFormData({ customerName: '', partySize: 2, phone: '' });
      fetchQueue();
    } catch (error) {
      toast.error("Error processing registration");
    }
  };

  const handleAutoAssign = async (id: string) => {
    try {
      const res = await api.post(`/queue/${id}/auto-assign`);
      toast.success(`Table ${res.data.data.table.tableNumber} assigned successfully`);
      fetchQueue();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "No suitable assets currently available");
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
     try {
       await api.patch(`/queue/${id}/status`, { status });
       toast.success("Guest operational status updated");
       fetchQueue();
     } catch (err) {
       toast.error("Failed to update status");
     }
  }

  if (loading) return (
    <div className="p-12 flex flex-col items-center justify-center min-h-screen bg-slate-50">
      <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin mb-6"></div>
      <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.3em]">Syncing Personnel Queue...</p>
    </div>
  );

  return (
    <div className="p-8 lg:p-12 max-w-screen-2xl mx-auto h-full flex flex-col animate-in space-y-12">
      {/* Strategic Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 bg-white premium-card flex items-center justify-center text-emerald-600">
                <ListOrdered size={24} />
             </div>
             <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">Waitlist Manager</h1>
                <p className="text-slate-500 font-medium text-lg leading-none mt-1">Real-time throughput and guest logistics.</p>
             </div>
          </div>
        </div>
        
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn-premium px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-3 w-full lg:w-auto justify-center"
        >
          <UserPlus size={18} strokeWidth={2.5} />
          Register Party
        </button>
      </div>

      {/* Grid Architecture */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {queues.length === 0 ? (
          <div className="col-span-full py-40 flex flex-col items-center justify-center text-slate-300 bg-white premium-card border-dashed">
            <Users size={64} strokeWidth={1} className="mb-6 text-slate-200" />
            <p className="text-sm font-black uppercase tracking-[0.4em] text-slate-300">Waitlist architecture is clear</p>
          </div>
        ) : queues.map((q) => (
          <div key={q.id} className="group premium-card p-10 flex flex-col relative overflow-hidden transition-all duration-500 hover:-translate-y-3">
            {/* Status Visualizer */}
            <div className={`absolute top-0 left-0 w-2 h-full transition-all group-hover:w-3 ${q.status === 'READY' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
            
            <div className="flex justify-between items-start mb-10">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2 block">Index #{q.queueNumber || q.id.slice(-4).toUpperCase()}</span>
                <h3 className="text-2xl font-black text-slate-900 tracking-tighter group-hover:text-emerald-600 transition-colors">{q.customerName}</h3>
              </div>
              <div className={`px-4 py-1.5 rounded-full text-[9px] font-black tracking-widest uppercase border-2 ${
                q.status === 'READY' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'
              }`}>
                {q.status}
              </div>
            </div>
            
            <div className="flex items-center gap-10 mb-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                   <Users size={20} />
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-tight">Covers</p>
                  <p className="text-base font-black text-slate-900 tracking-tighter">{q.partySize || q.peopleCount}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                   <Clock size={20} />
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-tight">Wait</p>
                  <p className="text-base font-black text-slate-900 tracking-tighter">~{q.estimatedWait} Min</p>
                </div>
              </div>
            </div>

            <div className="mt-auto pt-6 border-t border-slate-50 flex gap-4">
              {q.status === 'WAITING' && (
                <>
                  <button 
                    onClick={() => handleStatusChange(q.id, 'READY')}
                    className="flex-1 px-4 py-3.5 bg-slate-50 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 rounded-xl font-bold text-[10px] uppercase tracking-widest border border-transparent hover:border-emerald-100 transition-all"
                  >
                    Set Ready
                  </button>
                  <button 
                    onClick={() => handleAutoAssign(q.id)}
                    className="flex-1 px-4 py-3.5 bg-slate-900 hover:bg-black text-white rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-slate-200"
                  >
                    Assign
                  </button>
                </>
              )}
               {q.status === 'READY' && (
                 <button 
                  onClick={() => handleAutoAssign(q.id)}
                  className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all flex justify-center items-center gap-3 shadow-xl shadow-emerald-500/20"
                 >
                    <CheckCircle2 size={18} strokeWidth={2.5} />
                    Auto-Allocate
                 </button>
               )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Guest Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-6 z-[100] animate-in fade-in duration-300 backdrop-blur-xl">
          <div className="bg-white rounded-[2.5rem] p-12 w-full max-w-lg shadow-2xl relative border border-white/20 animate-in slide-in-from-bottom-5">
            <button onClick={() => setShowAddModal(false)} className="absolute top-10 right-10 text-slate-300 hover:text-slate-900 hover:rotate-90 transition-all">
              <X size={24} />
            </button>
            
            <div className="space-y-2 mb-10">
               <h2 className="text-3xl font-black text-slate-900 tracking-tight">Party Registration</h2>
               <p className="text-sm font-bold text-slate-400 uppercase tracking-widest px-1">Log internal personnel throughput.</p>
            </div>
            
            <form onSubmit={handleAdd} className="space-y-8">
              <div className="space-y-3">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-1">Primary Guest Identifier</label>
                <input required type="text" className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 text-sm font-black outline-none focus:bg-white focus:border-emerald-500/30 focus:ring-[6px] focus:ring-emerald-500/5 transition-all" value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} placeholder="ENTRANT NAME" />
              </div>
              <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-3">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-1">Initial Partition</label>
                  <input required type="number" min="1" className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 text-sm font-black outline-none focus:bg-white focus:border-emerald-500/30 focus:ring-[6px] focus:ring-emerald-500/5 transition-all" value={formData.partySize} onChange={e => setFormData({...formData, partySize: parseInt(e.target.value)})} />
                </div>
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-1">Contact Protocol</label>
                  <input type="tel" className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 text-sm font-black outline-none focus:bg-white focus:border-emerald-500/30 focus:ring-[6px] focus:ring-emerald-500/5 transition-all" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="OPTIONAL NUM" />
                </div>
              </div>
              <button type="submit" className="w-full bg-slate-900 hover:bg-black text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-3">
                Initialize Entry
                <UserPlus size={18} strokeWidth={2.5} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
