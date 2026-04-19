"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { socket } from "@/lib/socket";
import toast from "react-hot-toast";
import { Plus, Clock, Users, MapPin, X, UserPlus, CheckCircle2 } from "lucide-react";

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
      toast.error("Failed to load waitlist");
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
      toast.success("Guest added to waitlist");
      setShowAddModal(false);
      setFormData({ customerName: '', partySize: 2, phone: '' });
      fetchQueue();
    } catch (error) {
      toast.error("Error adding guest");
    }
  };

  const handleAutoAssign = async (id: string) => {
    try {
      const res = await api.post(`/queue/${id}/auto-assign`);
      toast.success(`Table ${res.data.data.table.tableNumber} assigned!`);
      fetchQueue();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "No suitable table available");
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
     try {
       await api.patch(`/queue/${id}/status`, { status });
       toast.success("Guest status updated");
       fetchQueue();
     } catch (err) {
       toast.error("Failed to update status");
     }
  }

  if (loading) return (
    <div className="p-12 flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-10 h-10 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin mb-4"></div>
      <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Loading Waitlist...</p>
    </div>
  );

  return (
    <div className="p-6 md:p-10 lg:p-12 max-w-7xl mx-auto h-full flex flex-col animate-slide-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Waitlist Manager</h1>
          <p className="text-slate-500 font-medium mt-1">Real-time guest tracking and seating control</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/20 transition-all"
        >
          <UserPlus size={18} />
          Append New Party
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {queues.length === 0 ? (
          <div className="col-span-full py-32 text-center rounded-[2.5rem] bg-white border border-slate-100 shadow-sm flex flex-col items-center justify-center border-dashed">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-6">
              <Users className="h-8 w-8 text-slate-300" />
            </div>
            <p className="text-lg font-bold text-slate-900">Waitlist is Empty</p>
            <p className="text-sm text-slate-400 font-medium">Add incoming parties to begin real-time tracking.</p>
          </div>
        ) : queues.map((q) => (
          <div key={q.id} className="group bg-white rounded-[2rem] p-8 shadow-sm border border-slate-50 flex flex-col relative overflow-hidden transition-all hover:shadow-xl">
            <div className={`absolute top-0 left-0 w-1.5 h-full transition-all group-hover:w-2.5 ${q.status === 'READY' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
            
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-2 block">Token #{q.queueNumber || q.id.slice(-4).toUpperCase()}</span>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">{q.customerName}</h3>
              </div>
              <div className={`px-3 py-1 rounded-full text-[9px] font-bold tracking-widest uppercase border ${
                q.status === 'READY' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
              }`}>
                {q.status}
              </div>
            </div>
            
            <div className="flex items-center gap-6 mb-8">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                   <Users size={16} />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Party</p>
                  <p className="text-sm font-bold text-slate-900">{q.peopleCount} Covers</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                   <Clock size={16} />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Wait</p>
                  <p className="text-sm font-bold text-slate-900">~{q.estimatedWait} Mins</p>
                </div>
              </div>
            </div>

            <div className="mt-auto pt-4 flex gap-3">
              {q.status === 'WAITING' && (
                <>
                  <button 
                    onClick={() => handleStatusChange(q.id, 'READY')}
                    className="flex-1 px-4 py-3 bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all"
                  >
                    Set Ready
                  </button>
                  <button 
                    onClick={() => handleAutoAssign(q.id)}
                    className="flex-1 px-4 py-3 bg-slate-900 hover:bg-black text-white rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all shadow-lg"
                  >
                    Assign Table
                  </button>
                </>
              )}
               {q.status === 'READY' && (
                 <button 
                  onClick={() => handleAutoAssign(q.id)}
                  className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all flex justify-center items-center gap-2 shadow-lg shadow-emerald-600/20"
                 >
                    <CheckCircle2 size={16} />
                    Auto-Assign Node
                 </button>
               )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Guest Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-[100] animate-fade-in backdrop-blur-md">
          <div className="bg-white rounded-[2rem] p-10 w-full max-w-md shadow-2xl relative border border-slate-100">
            <button onClick={() => setShowAddModal(false)} className="absolute top-8 right-8 text-slate-300 hover:text-slate-900 transition-colors">
              <X size={20} />
            </button>
            
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Check-in Guest</h2>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-8">Enter party registration details</p>
            
            <form onSubmit={handleAdd} className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Customer Name</label>
                <input required type="text" className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm font-semibold outline-none focus:border-emerald-500/30 transition-all" value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} placeholder="Full name" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Party Size</label>
                  <input required type="number" min="1" className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm font-semibold outline-none focus:border-emerald-500/30 transition-all" value={formData.partySize} onChange={e => setFormData({...formData, partySize: parseInt(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Contact</label>
                  <input type="tel" className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm font-semibold outline-none focus:border-emerald-500/30 transition-all" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="(Optional)" />
                </div>
              </div>
              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl font-bold text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 transition-all mt-6">
                Register Entry
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
