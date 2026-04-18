"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { socket } from "@/lib/socket";
import toast from "react-hot-toast";
import { Plus, Clock, Users, MapPin, X } from "lucide-react";

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
      toast.error("Failed to load queue");
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
      toast.success("Added to queue");
      setShowAddModal(false);
      setFormData({ customerName: '', partySize: 2, phone: '' });
      fetchQueue();
    } catch (error) {
      toast.error("Error adding to queue");
    }
  };

  const handleAutoAssign = async (id: string) => {
    try {
      const res = await api.post(`/queue/${id}/auto-assign`);
      toast.success(`Table ${res.data.data.table.tableNumber} assigned!`);
      fetchQueue();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error assigning table");
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
     try {
       await api.patch(`/queue/${id}/status`, { status });
       toast.success("Status updated");
       fetchQueue();
     } catch (err) {
       toast.error("Failed to update status");
     }
  }

  if (loading) return <div className="p-8">Loading queue...</div>;

  return (
    <div className="p-6 md:p-8 animate-fade-in max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex justify-between items-center mb-8 shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Waitlist</h1>
          <p className="text-gray-500 mt-1">Manage incoming customers & seating.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-[#FF6B35] hover:bg-[#E55A24] text-white px-5 py-3 rounded-xl font-medium shadow-[0_4px_14px_0_rgba(255,107,53,0.39)] transition-all flex items-center gap-2"
        >
          <Plus size={20} />
          <span className="hidden md:inline">Add Party</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-1 overflow-y-auto content-start pb-20">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 flex-1 overflow-y-auto content-start pb-20 px-1">
        {queues.length === 0 ? (
          <div className="col-span-full py-24 text-center text-gray-400 bg-gray-50/50 rounded-[2.5rem] border-2 border-dashed border-gray-200">
            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
              <Users className="h-10 w-10 text-gray-300" />
            </div>
            <p className="text-xl font-bold text-gray-900">Waitlist is clear</p>
            <p className="mt-2 text-gray-500">Add parties to see them appear here in real-time.</p>
          </div>
        ) : queues.map((q) => (
          <div key={q.id} className="group bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 flex flex-col relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <div className="absolute top-0 left-0 w-2 h-full bg-[#FF6B35] group-hover:w-3 transition-all" />
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF6B35] mb-2 block">ENTRY #{q.queueNumber}</span>
                <h3 className="text-2xl font-black text-gray-900 tracking-tight leading-tight">{q.customerName}</h3>
              </div>
              <div className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase border ${
                q.status === 'READY' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
              }`}>
                {q.status}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="flex flex-col gap-1.5 p-4 bg-gray-50 rounded-2xl border border-gray-100 group-hover:bg-orange-50/50 group-hover:border-orange-100 transition-colors">
                <Users size={20} className="text-[#FF6B35]" />
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Party Size</span>
                <span className="text-lg font-black text-gray-900">{q.peopleCount} People</span>
              </div>
              <div className="flex flex-col gap-1.5 p-4 bg-gray-50 rounded-2xl border border-gray-100 group-hover:bg-orange-50/50 group-hover:border-orange-100 transition-colors">
                <Clock size={20} className="text-[#FF6B35]" />
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Est. Wait</span>
                <span className="text-lg font-black text-gray-900">{q.estimatedWait} Mins</span>
              </div>
            </div>

            <div className="mt-auto flex gap-3">
              {q.status === 'WAITING' && (
                <>
                  <button onClick={() => handleStatusChange(q.id, 'READY')} className="flex-1 bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white py-4 rounded-2xl font-bold text-sm transition-all duration-300">
                    Ready
                  </button>
                  <button onClick={() => handleAutoAssign(q.id)} className="flex-1 bg-[#0F172A] hover:bg-black text-white py-4 rounded-2xl font-bold text-sm transition-all duration-300 shadow-lg shadow-slate-900/10">
                    Assign
                  </button>
                </>
              )}
               {q.status === 'READY' && (
                 <button onClick={() => handleAutoAssign(q.id)} className="w-full bg-[#0F172A] hover:bg-black text-white py-4 rounded-2xl font-bold text-sm transition-all duration-300 flex justify-center items-center gap-2 shadow-lg shadow-slate-900/10">
                    <MapPin size={18} />
                    Auto-Assign Table
                 </button>
               )}
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100] animate-fade-in backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl relative">
            <button onClick={() => setShowAddModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 bg-gray-50 rounded-full p-2">
              <X size={20} />
            </button>
            <h2 className="text-2xl font-bold mb-6">Add to Waitlist</h2>
            <form onSubmit={handleAdd} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Guest Name</label>
                <input required type="text" className="w-full border-gray-300 rounded-xl p-3 border focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35] outline-none transition-all" value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} placeholder="e.g. John Doe" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Party Size</label>
                  <input required type="number" min="1" className="w-full border-gray-300 rounded-xl p-3 border focus:ring-2 focus:ring-[#FF6B35] outline-none" value={formData.partySize} onChange={e => setFormData({...formData, partySize: parseInt(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone (Optional)</label>
                  <input type="tel" className="w-full border-gray-300 rounded-xl p-3 border focus:ring-2 focus:ring-[#FF6B35] outline-none" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="Phone" />
                </div>
              </div>
              <button type="submit" className="w-full bg-[#FF6B35] text-white py-3.5 rounded-xl font-semibold mt-4 hover:shadow-lg hover:shadow-[#FF6B35]/30 transition-all">
                Add to Queue
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
