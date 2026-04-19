"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { socket } from "@/lib/socket";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";
import { Check, Clock, ChefHat, Activity, CheckCircle2 } from "lucide-react";

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
      toast.error("Failed to load KDS stream");
    } finally {
      setLoading(false);
    }
  };

  const handleOrderUpdate = () => {
    fetchOrders();
  };

  const updateItemStatus = async (orderId: string, itemIndex: number, newStatus: string) => {
    try {
      await api.patch(`/orders/${orderId}/items/${itemIndex}/status`, { status: newStatus });
      // UI will update via socket or manual fetch
    } catch (error) {
      toast.error("Error updating item status");
    }
  };

  const markOrderPreparing = async (orderId: string) => {
    try {
       await api.patch(`/orders/${orderId}/status`, { status: 'preparing' });
       toast.success("Ticket moved to Preparing");
    } catch (error) {
       toast.error("Error updating ticket status");
    }
  };

  if (loading) return (
    <div className="p-12 flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-10 h-10 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin mb-4"></div>
      <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Opening Kitchen Stream...</p>
    </div>
  );

  return (
    <div className="min-h-screen p-6 md:p-10 lg:p-12 flex flex-col h-full animate-slide-up no-scrollbar">
      {/* KDS Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-10 gap-6 shrink-0">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-white rounded-2xl border border-slate-100 flex items-center justify-center shadow-sm text-emerald-600">
              <ChefHat size={24} />
           </div>
           <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Kitchen Operations</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Live Production Pipeline</p>
           </div>
        </div>

        <div className="flex items-center gap-8 bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm">
           <div className="flex flex-col">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <Activity size={10} />
                Workload
              </span>
              <div className="flex items-center gap-3">
                 <div className="h-1.5 w-24 md:w-40 bg-slate-50 rounded-full overflow-hidden p-[1px]">
                    <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${Math.min(100, (orders.length / 8) * 100)}%` }}></div>
                 </div>
                 <span className="text-[10px] font-bold text-slate-900">{orders.length} Active Tickets</span>
              </div>
           </div>
           <div className="h-8 w-px bg-slate-100 mx-2 hidden md:block"></div>
           <div className="hidden md:flex items-center gap-6">
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">New</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">In Progress</span>
             </div>
           </div>
        </div>
      </div>

      {/* Orders Stream */}
      <div className="flex-1 overflow-x-auto pb-6 flex gap-6 px-1 no-scrollbar items-stretch">
        {orders.length === 0 ? (
          <div className="w-full flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-100 rounded-[3rem] py-20">
             <CheckCircle2 size={64} strokeWidth={1} />
             <p className="text-sm font-bold uppercase tracking-widest mt-6">Order Stream Clear</p>
          </div>
        ) : (
          orders.map((order) => {
            const isNew = order.status === 'PENDING';
            
            return (
              <div 
                key={order.id} 
                className="min-w-[340px] max-w-[340px] bg-white rounded-[2rem] border border-slate-100 flex flex-col shadow-sm transition-all hover:shadow-xl group overflow-hidden"
              >
                {/* Header Section */}
                <div className="p-6 border-b border-slate-50 flex justify-between items-start">
                  <div>
                    <h2 className="text-4xl font-bold text-slate-900 tracking-tighter">T{order.tableNumber}</h2>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Order #{order.orderNumber.slice(-4)}</span>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-slate-500 font-bold text-[9px] justify-end uppercase tracking-widest mb-3">
                      <Clock size={10} />
                      {formatDistanceToNow(new Date(order.createdAt))}
                    </div>
                    <span className={`text-[9px] font-bold tracking-widest uppercase px-3 py-1 rounded-full border ${isNew ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                      {order.status}
                    </span>
                  </div>
                </div>

                {/* Items List */}
                <div className="p-6 flex-1 overflow-y-auto space-y-3 no-scrollbar">
                  {order.items.map((item: any) => {
                     const isReady = item.status === 'READY' || item.status === 'COMPLETED';
                     
                     return (
                       <div key={item.id} className={`flex items-center gap-4 p-4 rounded-xl transition-all ${isReady ? 'bg-slate-50/50 opacity-40' : 'bg-slate-50/50 border border-transparent hover:border-emerald-100'}`}>
                          <div className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm ${isReady ? 'bg-slate-200 text-slate-400' : 'bg-emerald-600 text-white'}`}>
                            {item.quantity}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-bold text-sm truncate ${isReady ? 'line-through text-slate-400' : 'text-slate-800'}`}>{item.itemName}</p>
                            {item.notes && <p className="text-[9px] text-rose-500 mt-0.5 font-bold uppercase tracking-tighter">{item.notes}</p>}
                          </div>
                          {!isReady && (
                            <button 
                              onClick={() => updateItemStatus(order.id, item.id, 'READY')}
                              className="w-9 h-9 rounded-lg bg-white border border-slate-200 text-slate-400 hover:bg-emerald-600 hover:text-white hover:border-transparent transition-all flex items-center justify-center"
                            >
                               <Check size={16} strokeWidth={3} />
                            </button>
                          )}
                       </div>
                     );
                  })}
                </div>

                {/* Footer Action */}
                <div className="p-6 pt-0">
                  {isNew ? (
                    <button 
                      onClick={() => markOrderPreparing(order.id)}
                      className="w-full h-12 font-bold text-[10px] uppercase tracking-widest bg-slate-900 hover:bg-black text-white rounded-xl transition-all shadow-md group-hover:scale-[1.02]"
                    >
                      Start Preparation
                    </button>
                  ) : (
                    <div className="w-full text-center py-3 text-[9px] font-bold text-slate-300 uppercase tracking-widest border border-slate-50 rounded-xl">
                       In Progress
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
