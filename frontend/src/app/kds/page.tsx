"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { socket } from "@/lib/socket";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";
import { Check, Clock, ChefHat, Activity, Maximize2, Minimize2, Flame, Bell, BellOff } from "lucide-react";
import { notifier } from "@/lib/notifications";

export default function KDSPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [wallMode, setWallMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    const initNotifier = () => {
      if (!notifier.initialized) {
        notifier.initialize();
        setNotificationsEnabled(true);
      }
    };
    window.addEventListener('click', initNotifier, { once: true });
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
      toast.error("KDS sync error");
    } finally {
      setLoading(false);
    }
  };

  const handleOrderUpdate = (data?: any) => {
    fetchOrders();
    if (data?.action === 'new_order' || data?.action === 'status_change') {
       if (data.order?.status === 'PENDING') {
         notifier.playKDSBell();
         notifier.sendPushNotification('New Kitchen Order', `Cooking required for Table ${data.order.tableNumber}`);
       }
    }
  };

  const updateItemStatus = async (orderId: string, itemIndex: number, newStatus: string) => {
    try {
      await api.patch(`/orders/${orderId}/items/${itemIndex}/status`, { status: newStatus });
    } catch (error) {
      toast.error("Update failed");
    }
  };


  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-10 h-10 border-[3px] rounded-full animate-spin mb-4"
        style={{ borderColor: 'var(--bg-elevated)', borderTopColor: 'var(--accent)' }}
      ></div>
      <p className="font-bold text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-dim)' }}>Opening Kitchen...</p>
    </div>
  );

  return (
    <div className={`min-h-screen flex flex-col h-full no-scrollbar transition-all duration-500 ${wallMode ? 'p-0' : 'p-5 md:p-8 lg:p-10'}`}
      style={{ background: wallMode ? '#000' : 'var(--bg-deep)' }}
    >
      
      {/* Header */}
      <div className={`flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-5 shrink-0 transition-opacity ${wallMode ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100'}`}>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 glass-card flex items-center justify-center" style={{ color: 'var(--accent)' }}>
            <ChefHat size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-outfit), sans-serif', color: 'var(--text-primary)' }}>
              Kitchen Display
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-widest mt-0.5" style={{ color: 'var(--text-dim)' }}>
              Wall Display Available
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Load Bar */}
          <div className="flex items-center gap-6 px-5 py-3 rounded-xl"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
          >
            <div className="flex flex-col">
              <span className="text-[9px] font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--text-dim)' }}>
                <Activity size={10} />
                Kitchen Load
              </span>
              <div className="flex items-center gap-3">
                <div className="h-1.5 w-24 md:w-36 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, (orders.length / 8) * 100)}%`, background: 'linear-gradient(90deg, var(--accent), #fbbf24)' }}
                  ></div>
                </div>
                <span className="text-[10px] font-bold" style={{ color: 'var(--text-primary)' }}>{orders.length} ACTIVE</span>
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => {
              notifier.initialize();
              setNotificationsEnabled(true);
              toast.success("KDS Audio Enabled");
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all"
            style={{ 
              background: notificationsEnabled ? 'var(--success-soft)' : 'var(--bg-elevated)',
              color: notificationsEnabled ? 'var(--success)' : 'var(--text-dim)',
              border: notificationsEnabled ? '1px solid rgba(34,197,94,0.2)' : '1px solid var(--border)'
            }}
          >
            {notificationsEnabled ? <Bell size={16} /> : <BellOff size={16} />}
          </button>
          <button 
            onClick={() => setWallMode(true)}
            className="btn-saanam text-[10px] uppercase tracking-widest"
            style={{ padding: '12px 20px' }}
          >
            <Maximize2 size={14} />
            Wall Mode
          </button>
        </div>
      </div>

      {/* Wall Mode Exit */}
      {wallMode && (
        <button 
          onClick={() => setWallMode(false)}
          className="fixed bottom-6 right-6 z-[100] w-14 h-14 rounded-full flex items-center justify-center transition-all opacity-20 hover:opacity-100 active:scale-95"
          style={{ background: 'var(--accent)', color: '#fff', boxShadow: '0 8px 30px rgba(249,115,22,0.4)' }}
        >
          <Minimize2 size={22} />
        </button>
      )}

      {/* Orders Rail */}
      <div className={`flex-1 overflow-x-auto pb-4 flex gap-5 no-scrollbar items-stretch ${wallMode ? 'p-8' : 'px-1'}`}>
        {orders.length === 0 ? (
          <div className="w-full flex flex-col items-center justify-center py-20 rounded-3xl"
            style={{ border: '2px dashed var(--border-hover)' }}
          >
            <ChefHat size={56} strokeWidth={1} style={{ color: 'var(--text-dim)' }} />
            <p className="text-sm font-bold uppercase tracking-widest mt-5" style={{ color: 'var(--text-dim)' }}>Orders Clear</p>
          </div>
        ) : (
          orders.map((order) => {
            const isNew = order.status === 'PENDING';
            const isTakeaway = order.orderType === 'TAKEAWAY';
            
            return (
              <div 
                key={order.id} 
                className="flex flex-col rounded-3xl transition-all duration-500 overflow-hidden shrink-0"
                style={{
                  minWidth: wallMode ? '420px' : '320px',
                  maxWidth: wallMode ? '420px' : '320px',
                  background: wallMode ? 'var(--bg-surface)' : 'var(--bg-surface)',
                  border: wallMode 
                    ? `3px solid ${isNew ? 'var(--info)' : 'var(--border)'}` 
                    : `1px solid ${isNew ? 'rgba(59,130,246,0.3)' : 'var(--border)'}`,
                  boxShadow: isNew ? '0 0 30px rgba(59,130,246,0.1)' : 'none',
                }}
              >
                {/* Order Header */}
                <div className="p-6 flex justify-between items-start" style={{ borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="font-black tracking-tighter" 
                        style={{ fontSize: wallMode ? '3.5rem' : '2rem', color: 'var(--text-primary)' }}
                      >
                        {isTakeaway ? 'TA' : `T${order.tableNumber}`}
                      </h2>
                      {isTakeaway && (
                        <span className="badge badge-accent text-[9px]">TAKEAWAY</span>
                      )}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] mt-1 block" style={{ color: 'var(--text-dim)' }}>
                      #{order.orderNumber.slice(-4)} {order.customerName && `• ${order.customerName}`}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 font-bold text-[10px] justify-end uppercase tracking-widest mb-3" style={{ color: 'var(--text-dim)' }}>
                      <Clock size={10} />
                      {formatDistanceToNow(new Date(order.createdAt))}
                    </div>
                    <span className={`badge ${isNew ? 'badge-accent' : 'badge-warning'} text-[9px]`}>
                      {order.status}
                    </span>
                  </div>
                </div>

                {/* Items */}
                <div className="p-6 flex-1 overflow-y-auto space-y-3 no-scrollbar" style={{ background: wallMode ? 'rgba(0,0,0,0.2)' : 'transparent' }}>
                  {order.items.map((item: any) => {
                    const isReady = item.status === 'READY' || item.status === 'COMPLETED';
                    
                    return (
                      <div key={item.id} className="flex items-center gap-4 p-4 rounded-xl transition-all"
                        style={{
                          background: isReady ? 'transparent' : 'var(--bg-elevated)',
                          border: isReady ? '1px solid transparent' : '1px solid var(--border)',
                          opacity: isReady ? 0.3 : 1,
                        }}
                      >
                        <div className="shrink-0 rounded-lg flex items-center justify-center font-bold"
                          style={{
                            width: wallMode ? '48px' : '36px',
                            height: wallMode ? '48px' : '36px',
                            fontSize: wallMode ? '1.2rem' : '0.875rem',
                            background: 'linear-gradient(135deg, var(--accent), #ea580c)',
                            color: '#fff',
                          }}
                        >
                          {item.quantity}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-bold ${isReady ? 'line-through' : ''}`}
                            style={{ fontSize: wallMode ? '1.1rem' : '0.875rem', color: 'var(--text-primary)' }}
                          >
                            {item.itemName}
                          </p>
                          {item.notes && (
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <div className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--danger)' }}></div>
                              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--danger)' }}>{item.notes}</p>
                            </div>
                          )}
                        </div>
                        {!isReady && (
                          <button 
                            onClick={() => updateItemStatus(order.id, item.id, 'READY')}
                            className="rounded-xl flex items-center justify-center transition-all hover:opacity-80"
                            style={{
                              width: wallMode ? '52px' : '40px',
                              height: wallMode ? '52px' : '40px',
                              background: 'var(--success-soft)',
                              color: 'var(--success)',
                              border: '1px solid rgba(34,197,94,0.2)',
                            }}
                          >
                            <Check size={wallMode ? 24 : 18} strokeWidth={3} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="p-6 pt-0 mt-auto">
                  <div className="w-full text-center py-4 font-bold uppercase tracking-widest rounded-xl flex items-center justify-center gap-2"
                    style={{
                      background: 'var(--bg-elevated)',
                      color: isNew ? 'var(--info)' : (order.status === 'READY' ? 'var(--success)' : 'var(--accent)'),
                      border: isNew ? '1px solid rgba(59,130,246,0.2)' : (order.status === 'READY' ? '1px solid var(--success-glow)' : '1px solid var(--accent-border)'),
                      fontSize: '9px',
                    }}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${isNew ? 'bg-blue-500' : (order.status === 'READY' ? 'bg-emerald-500' : 'bg-orange-500')} animate-pulse`}></div>
                    {isNew ? 'New Order • Kitchen' : (order.status === 'READY' ? 'Order Ready' : 'Cooking in Progress')}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
