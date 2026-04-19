"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { socket } from "@/lib/socket";
import { CheckCircle2, Clock, Flame } from "lucide-react";

export default function StatusBoard() {
  const [preparingOrders, setPreparingOrders] = useState<any[]>([]);
  const [readyOrders, setReadyOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    fetchOrders();
    
    socket.on('kds_update', () => fetchOrders());
    socket.on('order_updated', () => fetchOrders());
    
    // Live clock
    const interval = setInterval(() => setTime(new Date()), 1000);
    
    return () => {
      socket.off('kds_update');
      socket.off('order_updated');
      clearInterval(interval);
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
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#000' }}>
      <div className="w-12 h-12 border-[3px] rounded-full animate-spin"
        style={{ borderColor: 'var(--bg-elevated)', borderTopColor: 'var(--accent)' }}
      ></div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col overflow-hidden font-sans" style={{ background: '#000', color: '#fff' }}>
      
      {/* 🚀 Status ticker (New) */}
      <div className="bg-orange-600 h-10 flex items-center overflow-hidden shrink-0">
        <div className="whitespace-nowrap flex items-center animate-ticker-slow">
          {[...readyOrders, ...readyOrders, ...readyOrders].map((order, i) => (
            <div key={i} className="flex items-center gap-6 px-10">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/80">Order Ready</span>
              <span className="text-xl font-black text-white px-3 py-0.5 rounded-lg bg-black/20">#{order.orderNumber.slice(-3)}</span>
            </div>
          ))}
          {readyOrders.length === 0 && (
            <div className="flex items-center gap-6 px-10">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/50">Awaiting delicious orders...</span>
            </div>
          )}
        </div>
      </div>

      {/* Cinematic Header */}
      <header className="p-8 lg:p-10 flex justify-between items-end shrink-0"
        style={{ background: 'rgba(24,24,27,0.3)', borderBottom: '1px solid var(--border)' }}
      >
        <div>
          <div className="flex items-center gap-4 mb-2">
            <div className="w-3 h-3 rounded-full animate-pulse"
              style={{ background: 'var(--success)', boxShadow: '0 0 12px rgba(34,197,94,0.5)' }}
            ></div>
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tighter" style={{ fontFamily: 'var(--font-outfit), sans-serif' }}>
              Order Tracker
            </h1>
          </div>
          <p className="font-bold text-xs uppercase tracking-[0.3em]" style={{ color: 'var(--text-dim)' }}>
            Live Status Board
          </p>
        </div>
        <div className="text-right">
          <p className="text-4xl lg:text-5xl font-black tracking-tighter" style={{ fontFamily: 'var(--font-outfit), sans-serif' }}>
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="text-xs font-bold uppercase tracking-widest mt-1" style={{ color: 'var(--text-dim)' }}>
            {time.toLocaleDateString('en-IN', { weekday: 'long' })}
          </p>
        </div>
      </header>

      {/* Status Columns */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Preparing */}
        <div className="flex-1 flex flex-col" style={{ borderRight: '1px solid var(--border)' }}>
          <div className="p-8 lg:p-10 pb-5">
            <div className="flex items-center gap-3 mb-2" style={{ color: 'var(--warning)' }}>
              <Clock size={28} />
              <h2 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter" style={{ fontFamily: 'var(--font-outfit), sans-serif' }}>
                Preparing
              </h2>
            </div>
            <div className="h-1 w-16 rounded-full mt-3" style={{ background: 'var(--warning-soft)' }}></div>
          </div>
          
          <div className="flex-1 p-8 lg:p-10 pt-0 overflow-y-auto no-scrollbar">
            <div className="grid grid-cols-2 gap-4">
              {preparingOrders.map(order => (
                <div key={order.id} className="flex items-center justify-center aspect-[4/3] rounded-3xl animate-in"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
                >
                  <span className="text-6xl lg:text-7xl font-black tracking-tighter animate-ticker" style={{ color: 'var(--text-secondary)' }}>
                    {order.orderNumber.slice(-3)}
                  </span>
                </div>
              ))}
              {preparingOrders.length === 0 && (
                <p className="col-span-2 font-bold uppercase tracking-widest text-center mt-16 italic" style={{ color: 'var(--text-dim)' }}>Queue Clear</p>
              )}
            </div>
          </div>
        </div>

        {/* Ready */}
        <div className="flex-1 flex flex-col" style={{ background: 'rgba(34,197,94,0.03)' }}>
          <div className="p-8 lg:p-10 pb-5">
            <div className="flex items-center gap-3 mb-2" style={{ color: 'var(--success)' }}>
              <CheckCircle2 size={28} />
              <h2 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter" style={{ fontFamily: 'var(--font-outfit), sans-serif' }}>
                Ready
              </h2>
            </div>
            <div className="h-1 w-16 rounded-full mt-3" style={{ background: 'var(--success-soft)' }}></div>
          </div>

          <div className="flex-1 p-8 lg:p-10 pt-0 overflow-y-auto no-scrollbar">
            <div className="grid grid-cols-2 gap-5">
              {readyOrders.map(order => (
                <div key={order.id} className="flex flex-col items-center justify-center aspect-[4/3] rounded-3xl animate-float"
                  style={{
                    background: 'var(--success)',
                    boxShadow: '0 0 50px rgba(34,197,94,0.25)',
                  }}
                >
                  <span className="text-7xl lg:text-8xl font-black tracking-tighter" style={{ color: '#000' }}>
                    {order.orderNumber.slice(-3)}
                  </span>
                  <p className="mt-2 text-[10px] font-black uppercase tracking-[0.4em] opacity-60" style={{ color: '#000' }}>Ready Now</p>
                </div>
              ))}
              {readyOrders.length === 0 && (
                <p className="col-span-2 font-bold uppercase tracking-widest text-center mt-16 italic" style={{ color: 'var(--text-dim)' }}>Awaiting Orders</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="p-8 lg:p-10 flex justify-between items-center shrink-0"
        style={{ background: '#000', borderTop: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-3">
          <Flame size={16} style={{ color: 'var(--accent)' }} />
          <span className="text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: 'var(--text-dim)' }}>
            Saanam <span style={{ color: 'var(--accent)' }}>Suite</span>
          </span>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-dim)' }}>Kitchen Load</p>
          <div className="h-1.5 w-28 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
            <div className="h-full rounded-full"
              style={{ width: `${Math.min(100, (preparingOrders.length / 10) * 100)}%`, background: 'linear-gradient(90deg, var(--accent), #fbbf24)' }}
            ></div>
          </div>
        </div>
      </footer>
    </div>
  );
}
