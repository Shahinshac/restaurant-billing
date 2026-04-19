"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { socket } from "@/lib/socket";
import { ShoppingBag, CheckCircle2, Search, Clock } from "lucide-react";

export default function StatusBoard() {
  const [preparingOrders, setPreparingOrders] = useState<any[]>([]);
  const [readyOrders, setReadyOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
    
    socket.on('kds_update', () => fetchOrders());
    socket.on('order_updated', () => fetchOrders());
    
    return () => {
      socket.off('kds_update');
      socket.off('order_updated');
    };
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders/status-board');
      const data = res.data.data;
      setPreparingOrders(data.filter((o: any) => o.status === 'PREPARING' || o.status === 'PENDING'));
      setReadyOrders(data.filter((o: any) => o.status === 'READY'));
    } catch (error) {
      console.error("Board sync error");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
       <div className="w-12 h-12 border-4 border-emerald-900 border-t-emerald-500 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col overflow-hidden font-sans">
      {/* Dynamic Header */}
      <header className="p-10 border-b border-slate-900 flex justify-between items-end bg-slate-900/20 backdrop-blur-xl shrink-0">
        <div>
           <div className="flex items-center gap-4 mb-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
              <h1 className="text-4xl font-bold tracking-tighter">Live Order Tracker</h1>
           </div>
           <p className="text-slate-500 font-bold text-sm uppercase tracking-[0.3em]">Status for Pickup & Walk-in</p>
        </div>
        <div className="text-right">
           <p className="text-5xl font-black text-white tracking-tighter">
             {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
           </p>
        </div>
      </header>

      {/* Main Boards */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Preparing Column */}
        <div className="flex-1 flex flex-col border-r border-slate-900">
          <div className="p-10 pb-6">
             <div className="flex items-center gap-4 text-amber-500 mb-2">
                <Clock size={32} />
                <h2 className="text-5xl font-black uppercase tracking-tighter">Preparing</h2>
             </div>
             <div className="h-1 w-20 bg-amber-500/20 rounded-full mt-4"></div>
          </div>
          
          <div className="flex-1 p-10 pt-0 overflow-y-auto no-scrollbar">
             <div className="grid grid-cols-2 gap-4">
                {preparingOrders.map(order => (
                   <div key={order.id} className="bg-slate-900/50 border border-slate-800 p-8 rounded-[2.5rem] flex items-center justify-center animate-fade-in aspect-[4/3]">
                      <span className="text-7xl font-black text-slate-300 tracking-tighter">
                         {order.orderNumber.slice(-3)}
                      </span>
                   </div>
                ))}
                {preparingOrders.length === 0 && (
                  <p className="col-span-2 text-slate-700 font-bold uppercase tracking-widest text-center mt-20 italic">Queue Clear</p>
                )}
             </div>
          </div>
        </div>

        {/* Ready Column */}
        <div className="flex-1 flex flex-col bg-emerald-500/5">
          <div className="p-10 pb-6">
             <div className="flex items-center gap-4 text-emerald-500 mb-2">
                <CheckCircle2 size={32} />
                <h2 className="text-5xl font-black uppercase tracking-tighter">Pick-up</h2>
             </div>
             <div className="h-1 w-20 bg-emerald-500/20 rounded-full mt-4"></div>
          </div>

          <div className="flex-1 p-10 pt-0 overflow-y-auto no-scrollbar">
             <div className="grid grid-cols-2 gap-6">
                {readyOrders.map(order => (
                   <div key={order.id} className="bg-emerald-500 p-10 rounded-[2.5rem] flex flex-col items-center justify-center animate-bounce-subtle shadow-[0_0_60px_rgba(16,185,129,0.2)] aspect-[4/3]">
                      <span className="text-9xl font-black text-slate-950 tracking-tighter">
                         {order.orderNumber.slice(-3)}
                      </span>
                      <p className="mt-4 text-[10px] font-black uppercase tracking-[0.4em] text-emerald-950 opacity-60">Ready Now</p>
                   </div>
                ))}
                {readyOrders.length === 0 && (
                  <p className="col-span-2 text-slate-700 font-bold uppercase tracking-widest text-center mt-20 italic">Awaiting Orders</p>
                )}
             </div>
          </div>
        </div>

      </div>

      {/* Footer Branding */}
      <footer className="p-10 border-t border-slate-900 bg-slate-950 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
             <div className="px-6 py-2 bg-slate-900 rounded-full text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">
                RestoPro <span className="text-emerald-500">Premium</span> System
             </div>
          </div>
          <div className="flex gap-10">
             <div className="flex flex-col items-end">
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1">Kitchen Load</p>
                <div className="h-2 w-32 bg-slate-900 rounded-full overflow-hidden">
                   <div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, (preparingOrders.length / 10) * 100)}%` }}></div>
                </div>
             </div>
          </div>
      </footer>
    </div>
  );
}
