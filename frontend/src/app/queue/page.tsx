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
        {queues.length === 0 ? (
          <div className="col-span-full py-20 text-center text-gray-500 bg-white rounded-2xl border border-dashed border-gray-300">
            <Users className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <p className="text-lg font-medium text-gray-900">Queue is empty</p>
            <p>No one is waiting right now.</p>
          </div>
        ) : queues.map((q) => (
          <div key={q.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col relative overflow-hidden transition-all hover:shadow-md">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#FF6B35]" />
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1 block">Queue #{q.queueNumber}</span>
                <h3 className="text-xl font-bold text-gray-900">{q.customerName}</h3>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold badge-${q.status}`}>
                {q.status.toUpperCase()}
              </span>
            </div>
            
            <div className="flex items-center gap-4 text-gray-600 mb-6 bg-gray-50 p-3 rounded-xl">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-[#FF6B35]" />
                <span className="font-semibold">{q.partySize} pax</span>
              </div>
              <div className="w-px h-4 bg-gray-300"></div>
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-[#FF6B35]" />
                <span className="font-semibold">~{q.estimatedWait}m</span>
              </div>
            </div>

            <div className="mt-auto flex gap-3">
              {q.status === 'waiting' && (
                <>
                  <button onClick={() => handleStatusChange(q.id, 'ready')} className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 py-2.5 rounded-xl font-medium transition-colors">
                    Mark Ready
                  </button>
                  <button onClick={() => handleAutoAssign(q.id)} className="flex-1 bg-[#1F2937] hover:bg-black text-white py-2.5 rounded-xl font-medium transition-colors">
                    Auto-Assign
                  </button>
                </>
              )}
               {q.status === 'ready' && (
                 <button onClick={() => handleAutoAssign(q.id)} className="w-full bg-[#1F2937] hover:bg-black text-white py-2.5 rounded-xl font-medium transition-colors flex justify-center items-center gap-2">
                    <MapPin size={18} />
                    Assign Table Now
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
