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
          <div className="w-full flex flex-col items-center justify-center text-gray-500 mt-20">
             <Check size={48} className="mb-4 text-gray-700" />
             <p className="text-xl">No active orders</p>
          </div>
        ) : (
          orders.map((order) => {
            const isNew = order.status === 'pending';
            const bgBorder = isNew ? 'border-blue-500/50' : 'border-yellow-500/50';
            const shadowColor = isNew ? 'rgba(59, 130, 246, 0.1)' : 'rgba(234, 179, 8, 0.1)';

            return (
              <div 
                key={order.id} 
                className={`min-w-[320px] max-w-[320px] bg-[#1F2937] rounded-xl border-t-4 ${bgBorder} flex flex-col snap-start overflow-hidden`}
                style={{ boxShadow: `0 10px 30px ${shadowColor}` }}
              >
                <div className="p-4 bg-[#374151]/50 border-b border-gray-700 flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-black text-white">T{order.tableNumber}</h2>
                    <span className="text-xs text-gray-400 font-medium tracking-widest">{order.orderNumber}</span>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-bold uppercase ${isNew ? 'text-blue-400' : 'text-yellow-400'}`}>
                      {order.status}
                    </span>
                    <div className="flex items-center gap-1 text-gray-400 text-xs mt-1 justify-end">
                      <Clock size={12} />
                      {formatDistanceToNow(new Date(order.createdAt))} ago
                    </div>
                  </div>
                </div>

                <div className="p-4 flex-1 overflow-y-auto space-y-3">
                  {order.items.map((item: any, i: number) => {
                     const isReady = item.status === 'ready' || item.status === 'served';
                     
                     return (
                       <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border ${isReady ? 'bg-gray-800/50 border-gray-700 opacity-60' : 'bg-gray-800 border-gray-600'}`}>
                          <div className={`mt-0.5 shrink-0 w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs ${isReady ? 'bg-green-500 text-white' : 'bg-[#FF6B35] text-white'}`}>
                            {item.quantity}
                          </div>
                          <div className="flex-1">
                            <p className={`font-medium ${isReady ? 'line-through text-gray-500' : 'text-white'}`}>{item.name}</p>
                            {item.notes && <p className="text-xs text-red-400 mt-1 font-medium bg-red-400/10 inline-block px-2 py-0.5 rounded">Note: {item.notes}</p>}
                          </div>
                          {!isReady && (
                            <button 
                              onClick={() => updateItemStatus(order.id, i, 'ready')}
                              className="w-8 h-8 rounded shrink-0 flex items-center justify-center bg-gray-700 hover:bg-green-600 transition-colors"
                            >
                               <Check size={16} />
                            </button>
                          )}
                       </div>
                     );
                  })}
                </div>

                {isNew && (
                  <button 
                    onClick={() => markOrderPreparing(order.id)}
                    className="w-full py-4 font-bold tracking-widest uppercase bg-blue-600 hover:bg-blue-500 transition-colors"
                  >
                    Start Preparing
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
