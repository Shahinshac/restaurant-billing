"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { socket } from "@/lib/socket";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";
import { Check, Clock, UtensilsCrossed } from "lucide-react";

export default function KDSPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
    
    socket.on('kds_update', handleOrderUpdate);
    return () => {
      socket.off('kds_update', handleOrderUpdate);
    };
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders/kds');
      setOrders(res.data.data);
    } catch (error) {
      toast.error("Failed to load KDS");
    } finally {
      setLoading(false);
    }
  };

  const handleOrderUpdate = () => {
    fetchOrders(); // Refresh all to keep sync simple for now
  };

  const updateItemStatus = async (orderId: string, itemIndex: number, newStatus: string) => {
    try {
      await api.patch(`/orders/${orderId}/items/${itemIndex}/status`, { status: newStatus });
    } catch (error) {
      toast.error("Error updating item status");
    }
  };

  const markOrderPreparing = async (orderId: string) => {
    try {
       await api.patch(`/orders/${orderId}/status`, { status: 'preparing' });
       toast.success("Order marked as preparing");
    } catch (error) {
       toast.error("Error updating order status");
    }
  };

  if (loading) return <div className="p-8 text-white bg-[#111827] h-full flex items-center justify-center">Loading Kitchen Display...</div>;

  return (
    <div className="bg-[#111827] min-h-screen p-6 text-white overflow-hidden flex flex-col h-full animate-fade-in">
      <div className="flex justify-between items-center mb-6 shrink-0 border-b border-gray-800 pb-4">
        <div className="flex items-center gap-3">
          <UtensilsCrossed className="text-[#FF6B35]" size={28} />
          <h1 className="text-2xl font-bold tracking-wider">KITCHEN DISPLAY SYSTEM</h1>
        </div>
        <div className="flex items-center gap-4 text-sm font-medium">
          <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div> New</span>
          <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]"></div> Preparing</span>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto pb-8 snap-x no-scrollbar flex gap-6">
        {orders.length === 0 ? (
          <div className="w-full flex flex-col items-center justify-center text-gray-600 mt-20">
             <div className="w-24 h-24 bg-gray-800 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl">
               <Check size={48} className="text-gray-600" />
             </div>
             <p className="text-2xl font-black tracking-tight">KITCHEN IS CLEAR</p>
             <p className="text-gray-500 mt-2">Enjoy the silence while it lasts.</p>
          </div>
        ) : (
          orders.map((order) => {
            const isNew = order.status === 'PENDING';
            const bgBorder = isNew ? 'border-cyan-500' : 'border-[#FF6B35]';
            const shadowColor = isNew ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255, 107, 53, 0.15)';
            const glowClass = isNew ? 'shadow-[0_-8px_30px_-10px_rgba(6,182,212,0.5)]' : 'shadow-[0_-8px_30px_-10px_rgba(255,107,53,0.5)]';

            return (
              <div 
                key={order.id} 
                className={`min-w-[340px] max-w-[340px] bg-[#1a2233] rounded-[2.5rem] border-t-[8px] ${bgBorder} flex flex-col snap-start overflow-hidden transition-all duration-500 ${glowClass}`}
              >
                <div className="p-6 bg-white/5 border-b border-white/5 flex justify-between items-center">
                  <div>
                    <h2 className="text-3xl font-black text-white tracking-tighter">T{order.tableNumber}</h2>
                    <span className="text-[10px] text-gray-400 font-black tracking-[0.2em] uppercase opacity-50">{order.orderNumber}</span>
                  </div>
                  <div className="text-right">
                    <span className={`text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full border ${isNew ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' : 'bg-[#FF6B35]/10 text-[#FF6B35] border-[#FF6B35]/20'}`}>
                      {order.status}
                    </span>
                    <div className="flex items-center gap-1.5 text-gray-400 font-bold text-[10px] mt-2 justify-end opacity-60">
                      <Clock size={12} />
                      {formatDistanceToNow(new Date(order.createdAt))}
                    </div>
                  </div>
                </div>

                <div className="p-6 flex-1 overflow-y-auto space-y-4">
                  {order.items.map((item: any) => {
                     const isReady = item.status === 'READY' || item.status === 'COMPLETED';
                     
                     return (
                       <div key={item.id} className={`flex items-center gap-4 p-4 rounded-3xl border transition-all duration-300 ${isReady ? 'bg-white/5 border-transparent opacity-40 grayscale' : 'bg-white/[0.08] border-white/5 hover:bg-white/[0.12] hover:border-white/10'}`}>
                          <div className={`shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center font-black text-lg ${isReady ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-[#FF6B35] text-white shadow-[0_0_15px_rgba(255,107,53,0.3)]'}`}>
                            {item.quantity}
                          </div>
                          <div className="flex-1">
                            <p className={`font-bold text-base leading-tight ${isReady ? 'line-through' : 'text-white'}`}>{item.itemName}</p>
                            {item.notes && <p className="text-[10px] text-rose-400 mt-1 font-black uppercase tracking-wider bg-rose-400/10 inline-block px-2 py-0.5 rounded-md border border-rose-400/20">!! {item.notes}</p>}
                          </div>
                          {!isReady && (
                            <button 
                              onClick={() => updateItemStatus(order.id, item.id, 'READY')}
                              className="w-10 h-10 rounded-2xl shrink-0 flex items-center justify-center bg-white/5 hover:bg-emerald-500 text-white transition-all duration-300"
                            >
                               <Check size={20} strokeWidth={3} />
                            </button>
                          )}
                       </div>
                     );
                  })}
                </div>

                {isNew && (
                  <button 
                    onClick={() => markOrderPreparing(order.id)}
                    className="w-full py-6 font-black tracking-[0.3em] text-xs uppercase bg-cyan-600 hover:bg-cyan-500 text-white transition-all shadow-[0_-10px_30px_rgba(6,182,212,0.2)]"
                  >
                    Start Cook
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
