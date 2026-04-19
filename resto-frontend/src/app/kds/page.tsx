"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { socket } from "@/lib/socket";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";
import { Check, Clock, ChefHat, Activity, Maximize2, Minimize2 } from "lucide-react";

export default function KDSPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [wallMode, setWallMode] = useState(false);

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
      toast.error("Cloud synchronization error");
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
    } catch (error) {
      toast.error("Update failed");
    }
  };

  const markOrderPreparing = async (orderId: string) => {
    try {
       await api.patch(`/orders/${orderId}/status`, { status: 'preparing' });
    } catch (error) {
       toast.error("Status update error");
    }
  };

  if (loading) return (
    <div className="p-12 flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-10 h-10 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin mb-4"></div>
      <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Kitchen Pipeline Opening...</p>
    </div>
  );

  return (
    <div className={`min-h-screen flex flex-col h-full animate-slide-up no-scrollbar transition-all duration-500 ${wallMode ? 'p-0 bg-slate-950' : 'p-6 md:p-10 lg:p-12 bg-slate-50'}`}>
      
      {/* KDS Header - Hidden in Wall Mode or slimmed down */}
      <div className={`flex flex-col xl:flex-row justify-between items-start xl:items-center mb-10 gap-6 shrink-0 transition-opacity ${wallMode ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100'}`}>
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-white rounded-2xl border border-slate-100 flex items-center justify-center shadow-sm text-emerald-600">
              <ChefHat size={24} />
           </div>
           <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Kitchen Production</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Physical Wall Display Mode Available</p>
           </div>
        </div>

        <div className="flex items-center gap-6">
           <div className="flex items-center gap-8 bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex flex-col">
                 <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                   <Activity size={10} />
                   Live Load
                 </span>
                 <div className="flex items-center gap-3">
                    <div className="h-1.5 w-24 md:w-40 bg-slate-50 rounded-full overflow-hidden p-[1px]">
                       <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${Math.min(100, (orders.length / 8) * 100)}%` }}></div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-900">{orders.length} ACTIVE</span>
                 </div>
              </div>
           </div>
           
           <button 
            onClick={() => setWallMode(true)}
            className="flex items-center gap-2 px-6 py-3.5 bg-slate-900 text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-900/10"
           >
              <Maximize2 size={16} />
              Wall Display
           </button>
        </div>
      </div>

      {/* Mini Exit for Wall Mode */}
      {wallMode && (
         <button 
           onClick={() => setWallMode(false)}
           className="fixed bottom-8 right-8 z-[100] w-14 h-14 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all opacity-20 hover:opacity-100"
         >
            <Minimize2 size={24} />
         </button>
      )}

      {/* Orders Stream */}
      <div className={`flex-1 overflow-x-auto pb-6 flex gap-6 no-scrollbar items-stretch ${wallMode ? 'p-12' : 'px-1'}`}>
        {orders.length === 0 ? (
          <div className="w-full flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-200 rounded-[3rem] py-20">
             <ChefHat size={64} strokeWidth={1} />
             <p className="text-sm font-bold uppercase tracking-widest mt-6">Production Queue Clear</p>
          </div>
        ) : (
          orders.map((order) => {
            const isNew = order.status === 'PENDING';
            const isTakeaway = order.orderType === 'TAKEAWAY';
            
            return (
              <div 
                key={order.id} 
                className={`flex flex-col rounded-[2.5rem] transition-all duration-500 overflow-hidden ${
                  wallMode 
                    ? `min-w-[450px] max-w-[450px] border-4 ${isNew ? 'border-blue-500 animate-pulse-subtle' : 'border-slate-800'} bg-slate-900 shadow-[0_0_50px_rgba(0,0,0,0.3)]`
                    : `min-w-[340px] max-w-[340px] bg-white border border-slate-100 shadow-lg`
                }`}
              >
                {/* Header Section */}
                <div className={`p-8 border-b ${wallMode ? 'border-slate-800' : 'border-slate-50'} flex justify-between items-start`}>
                  <div>
                    <div className="flex items-center gap-3">
                       <h2 className={`font-bold tracking-tighter ${wallMode ? 'text-7xl text-white' : 'text-4xl text-slate-900'}`}>
                          {isTakeaway ? 'TA' : `T${order.tableNumber}`}
                       </h2>
                       {isTakeaway && (
                          <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${wallMode ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-600'}`}>
                             TAKEAWAY
                          </div>
                       )}
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-[0.2em] mt-2 block ${wallMode ? 'text-slate-500' : 'text-slate-400'}`}>
                       #{order.orderNumber.slice(-4)} {order.customerName && `• ${order.customerName}`}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className={`flex items-center gap-1 font-bold text-[10px] justify-end uppercase tracking-widest mb-4 ${wallMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      <Clock size={12} />
                      {formatDistanceToNow(new Date(order.createdAt))}
                    </div>
                    <span className={`text-[10px] font-bold tracking-widest uppercase px-4 py-2 rounded-xl border ${
                       isNew 
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>

                {/* Items List */}
                <div className={`p-8 flex-1 overflow-y-auto space-y-4 no-scrollbar ${wallMode ? 'bg-slate-950/30' : ''}`}>
                  {order.items.map((item: any) => {
                     const isReady = item.status === 'READY' || item.status === 'COMPLETED';
                     
                     return (
                       <div key={item.id} className={`flex items-center gap-6 p-5 rounded-2xl transition-all ${
                          isReady 
                            ? 'opacity-30' 
                            : wallMode 
                               ? 'bg-slate-800/50 border border-slate-700' 
                               : 'bg-slate-50/50 border border-transparent'
                       }`}>
                          <div className={`shrink-0 rounded-xl flex items-center justify-center font-bold ${
                             wallMode ? 'w-14 h-14 text-2xl bg-emerald-600 text-white shadow-lg' : 'w-10 h-10 text-lg bg-emerald-600 text-white'
                          }`}>
                            {item.quantity}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-bold transition-all ${
                               wallMode ? 'text-xl text-slate-100' : 'text-base text-slate-800'
                            } ${isReady ? 'line-through' : ''}`}>
                               {item.itemName}
                            </p>
                            {item.notes && (
                               <div className="flex items-center gap-1.5 mt-2">
                                  <div className="h-1.5 w-1.5 rounded-full bg-rose-500"></div>
                                  <p className="text-[10px] text-rose-500 font-bold uppercase tracking-widest">{item.notes}</p>
                               </div>
                            )}
                          </div>
                          {!isReady && (
                            <button 
                              onClick={() => updateItemStatus(order.id, item.id, 'READY')}
                              className={`rounded-2xl border transition-all flex items-center justify-center shadow-lg ${
                                 wallMode 
                                    ? 'w-16 h-16 bg-white border-white text-emerald-600 hover:bg-emerald-600 hover:text-white' 
                                    : 'w-11 h-11 bg-white border-slate-200 text-slate-400 hover:bg-emerald-600 hover:text-white hover:border-transparent'
                              }`}
                            >
                               <Check size={wallMode ? 28 : 20} strokeWidth={4} />
                            </button>
                          )}
                       </div>
                     );
                  })}
                </div>

                {/* Footer Action */}
                <div className={`p-8 pt-0 ${wallMode ? 'bg-slate-950/30' : ''}`}>
                  {isNew ? (
                    <button 
                      onClick={() => markOrderPreparing(order.id)}
                      className={`w-full font-bold uppercase tracking-widest transition-all shadow-xl active:scale-95 ${
                         wallMode 
                            ? 'h-20 text-sm bg-white text-slate-950 rounded-2xl' 
                            : 'h-14 text-[10px] bg-slate-900 text-white rounded-xl'
                      }`}
                    >
                      Start Preparation
                    </button>
                  ) : (
                    <div className={`w-full text-center py-4 font-bold uppercase tracking-widest border rounded-2xl ${
                        wallMode ? 'text-slate-600 border-slate-800' : 'text-slate-300 border-slate-50'
                    } ${wallMode ? 'text-sm' : 'text-[9px]'}`}>
                       In Production
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
