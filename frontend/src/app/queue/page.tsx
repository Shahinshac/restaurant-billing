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
      toast.error("Failed to add guest");
    }
  };

  const handleAutoAssign = async (id: string) => {
    try {
      const res = await api.post(`/queue/${id}/auto-assign`);
      toast.success(`Table ${res.data.data.table.tableNumber} assigned`);
      fetchQueue();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "No tables available");
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
     try {
       await api.patch(`/queue/${id}/status`, { status });
       toast.success("Status updated");
       fetchQueue();
     } catch (err) {
       toast.error("Failed to update");
     }
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen" style={{ background: 'var(--bg-deep)' }}>
      <div className="w-12 h-12 border-[3px] rounded-full animate-spin mb-5"
        style={{ borderColor: 'var(--bg-elevated)', borderTopColor: 'var(--accent)' }}
      ></div>
      <p className="font-bold text-[10px] uppercase tracking-[0.3em]" style={{ color: 'var(--text-dim)' }}>Loading Waitlist...</p>
    </div>
  );

  return (
    <div className="p-6 lg:p-10 max-w-screen-2xl mx-auto h-full flex flex-col animate-in space-y-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 glass-card flex items-center justify-center" style={{ color: 'var(--accent)' }}>
              <ListOrdered size={22} />
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-black tracking-tight" style={{ fontFamily: 'var(--font-outfit), sans-serif', color: 'var(--text-primary)' }}>
                Waitlist
              </h1>
              <p className="font-medium text-sm mt-0.5" style={{ color: 'var(--text-tertiary)' }}>Guest queue & table assignment</p>
            </div>
          </div>
        </div>
        
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn-saanam w-full lg:w-auto"
        >
          <UserPlus size={16} strokeWidth={2.5} />
          Add Guest
        </button>
      </div>

      {/* Queue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 stagger-children">
        {queues.length === 0 ? (
          <div className="col-span-full py-32 flex flex-col items-center justify-center glass-card" style={{ border: '1px dashed var(--border-hover)' }}>
            <Users size={56} strokeWidth={1} className="mb-5" style={{ color: 'var(--text-dim)' }} />
            <p className="text-sm font-bold uppercase tracking-[0.3em]" style={{ color: 'var(--text-dim)' }}>Waitlist is empty</p>
          </div>
        ) : queues.map((q, i) => (
          <div key={q.id} className="group glow-card p-8 flex flex-col relative overflow-hidden animate-in"
            style={{ opacity: 0, animationDelay: `${i * 80}ms`, animationFillMode: 'forwards' }}
          >
            {/* Status Bar */}
            <div className="absolute top-0 left-0 w-1 h-full transition-all group-hover:w-1.5"
              style={{ background: q.status === 'READY' ? 'var(--success)' : 'var(--accent)' }}
            />
            
            <div className="flex justify-between items-start mb-8">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2 block" style={{ color: 'var(--text-dim)' }}>
                  #{q.queueNumber || q.id.slice(-4).toUpperCase()}
                </span>
                <h3 className="text-xl font-black tracking-tighter transition-colors" style={{ color: 'var(--text-primary)' }}>
                  {q.customerName}
                </h3>
              </div>
              <span className={`badge ${q.status === 'READY' ? 'badge-success' : 'badge-warning'} text-[9px]`}>
                {q.status}
              </span>
            </div>
            
            <div className="flex items-center gap-8 mb-8">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-dim)' }}
                >
                  <Users size={16} />
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest leading-tight" style={{ color: 'var(--text-dim)' }}>Party</p>
                  <p className="text-sm font-black tracking-tighter" style={{ color: 'var(--text-primary)' }}>{q.partySize || q.peopleCount}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-dim)' }}
                >
                  <Clock size={16} />
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest leading-tight" style={{ color: 'var(--text-dim)' }}>Wait</p>
                  <p className="text-sm font-black tracking-tighter" style={{ color: 'var(--text-primary)' }}>~{q.estimatedWait}m</p>
                </div>
              </div>
            </div>

            <div className="mt-auto pt-5 flex gap-3" style={{ borderTop: '1px solid var(--border)' }}>
              {q.status === 'WAITING' && (
                <>
                  <button 
                    onClick={() => handleStatusChange(q.id, 'READY')}
                    className="btn-ghost flex-1 text-[10px] uppercase tracking-widest"
                    style={{ padding: '12px' }}
                  >
                    Set Ready
                  </button>
                  <button 
                    onClick={() => handleAutoAssign(q.id)}
                    className="btn-saanam flex-1 text-[10px] uppercase tracking-widest"
                    style={{ padding: '12px' }}
                  >
                    Assign
                  </button>
                </>
              )}
              {q.status === 'READY' && (
                <button 
                  onClick={() => handleAutoAssign(q.id)}
                  className="btn-saanam w-full flex justify-center items-center gap-2 text-[10px] uppercase tracking-widest"
                  style={{ padding: '14px' }}
                >
                  <CheckCircle2 size={14} strokeWidth={2.5} />
                  Auto-Assign Table
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Guest Modal */}
      {showAddModal && (
        <div className="fixed inset-0 flex items-center justify-center p-6 z-[100] animate-in"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)' }}
        >
          <div className="rounded-3xl p-10 w-full max-w-lg relative animate-scale-in"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}
          >
            <button onClick={() => setShowAddModal(false)} className="absolute top-8 right-8 transition-all hover:opacity-60" style={{ color: 'var(--text-dim)' }}>
              <X size={22} />
            </button>
            
            <div className="space-y-1 mb-8">
              <h2 className="text-2xl font-black tracking-tight" style={{ fontFamily: 'var(--font-outfit), sans-serif', color: 'var(--text-primary)' }}>
                Add to Waitlist
              </h2>
              <p className="text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>Register a new party</p>
            </div>
            
            <form onSubmit={handleAdd} className="space-y-5">
              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] px-0.5" style={{ color: 'var(--text-dim)' }}>Guest Name</label>
                <input required type="text" className="input-saanam" value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} placeholder="Enter name" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold uppercase tracking-[0.2em] px-0.5" style={{ color: 'var(--text-dim)' }}>Party Size</label>
                  <input required type="number" min="1" className="input-saanam" value={formData.partySize} onChange={e => setFormData({...formData, partySize: parseInt(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold uppercase tracking-[0.2em] px-0.5" style={{ color: 'var(--text-dim)' }}>Phone</label>
                  <input type="tel" className="input-saanam" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="Optional" />
                </div>
              </div>
              <button type="submit" className="btn-saanam w-full flex items-center justify-center gap-2 mt-2" style={{ padding: '16px' }}>
                Add to Queue
                <UserPlus size={16} strokeWidth={2.5} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
