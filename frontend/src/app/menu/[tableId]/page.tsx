"use client";

import { useEffect, useState, use } from "react";
import api from "@/lib/api";
import { socket } from "@/lib/socket";
import toast from "react-hot-toast";
import Script from "next/script";
import { ShoppingBag, Star, ChevronRight, Plus, Minus, Flame, Clock, CheckCircle2, X, CreditCard } from "lucide-react";

export default function DigitalMenu({ params }: { params: Promise<{ tableId: string }> }) {
  const unwrappedParams = use(params);
  const tableId = unwrappedParams.tableId;

  const [categories, setCategories] = useState<string[]>([]);
  const [menu, setMenu] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableInfo, setTableInfo] = useState<any>(null);
  const [portionSelectionItem, setPortionSelectionItem] = useState<any>(null);
  const [isPaying, setIsPaying] = useState(false);

  useEffect(() => {
    fetchData();
    
    socket.on('order_updated', (data) => {
      if (data.order.tableId === tableId) {
        fetchData();
      }
    });

    return () => {
      socket.off('order_updated');
    };
  }, [tableId]);

  const fetchData = async () => {
    try {
      const [cats, items, tableRes] = await Promise.all([
        api.get('/menu/categories'),
        api.get('/menu'),
        api.get(`/tables/${tableId}`)
      ]);
      setCategories(["All", ...cats.data.data]);
      setMenu(items.data.data);
      setTableInfo(tableRes.data.data);
    } catch (error) {
      toast.error("Failed to load menu");
    } finally {
      setLoading(false);
    }
  };

  const filteredMenu = activeCategory === "All" ? menu : menu.filter(m => m.category === activeCategory);

  const addToCart = (item: any, selectedPortion: string = 'FULL') => {
    const itemName = selectedPortion === 'FULL' ? item.name : `${item.name} (${selectedPortion})`;
    const priceRatio = selectedPortion === '1/4' ? 0.25 : selectedPortion === '1/2' ? 0.5 : selectedPortion === '3/4' ? 0.75 : 1;
    const finalPrice = Math.round(item.price * priceRatio);

    setCart(prev => {
      const existing = prev.find(i => i.name === itemName);
      if (existing) {
        return prev.map(i => i.name === itemName ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { 
        menuItem: item.id, 
        name: itemName, 
        price: finalPrice, 
        quantity: 1, 
        isVeg: item.isVeg,
        portion: selectedPortion
      }];
    });
    setPortionSelectionItem(null);
    toast.success(`${itemName} added`, { position: 'bottom-center', duration: 1000 });
  };

  const removeFromCart = (itemName: string) => {
    setCart(prev => {
      const existing = prev.find(i => i.name === itemName);
      if (existing && existing.quantity > 1) {
        return prev.map(i => i.name === itemName ? { ...i, quantity: i.quantity - 1 } : i);
      }
      return prev.filter(i => i.name !== itemName);
    });
  };

  const placeOrder = async () => {
    if (cart.length === 0) return toast.error("Empty cart");

    try {
      if (tableInfo.currentOrder) {
        await api.post(`/orders/${tableInfo.currentOrder.id}/add-items`, { items: cart });
      } else {
        await api.post('/orders', { tableId: tableId, orderType: 'DINE_IN', items: cart });
      }
      toast.custom((t) => (
        <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl animate-in">
          <Flame className="text-orange-500" size={18} />
          <span className="text-xs font-bold text-white">Order sent to kitchen!</span>
        </div>
      ), { position: 'bottom-center' });
      setCart([]);
      fetchData(); 
    } catch (error) {
       toast.error("Failed to place order");
    }
  };

  const currentOrder = tableInfo?.currentOrder;

  const handleRazorpayPayment = async () => {
    if (!currentOrder || isPaying) return;
    setIsPaying(true);
    try {
      const res = await api.post(`/orders/${currentOrder.id}/create-razorpay-order`);
      if (res.data.success && res.data.razorpayOrder) {
        const orderInfo = res.data.razorpayOrder;
        
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_SfctuU5SK2mJUs', 
          amount: orderInfo.amount, 
          currency: orderInfo.currency,
          name: "26:07",
          description: `Bill Settlement - ${currentOrder.orderNumber}`,
          order_id: orderInfo.id, 
          handler: function (response: any) {
            window.location.href = `/menu/payment-success?order_id=${currentOrder.id}&table_id=${tableId}`;
          },
          prefill: {
             name: currentOrder.customerName || "Dine-in Guest",
             contact: currentOrder.customerPhone || "",
          },
          theme: {
             color: "#f97316"
          },
          modal: {
            ondismiss: function() {
              setIsPaying(false);
            }
          }
        };

        const rzp1 = new (window as any).Razorpay(options);
        rzp1.on('payment.failed', function (response: any){
             toast.error("Payment Failed");
             setIsPaying(false);
        });
        rzp1.open();
      } else {
        toast.error("Failed to initialize checkout.");
        setIsPaying(false);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Razorpay not configured on server.");
      setIsPaying(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--bg-deep)' }}>
      <div className="w-8 h-8 border-[3px] rounded-full animate-spin"
        style={{ borderColor: 'var(--bg-elevated)', borderTopColor: 'var(--accent)' }}
      ></div>
    </div>
  );

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="min-h-screen pb-32 no-scrollbar" style={{ background: 'var(--bg-deep)' }}>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      {/* Header */}
      <div className="px-5 pt-8 pb-6 sticky top-0 z-10 rounded-b-3xl"
        style={{ background: 'var(--glass-heavy)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Flame size={18} style={{ color: 'var(--accent)' }} />
              <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-outfit), sans-serif', color: 'var(--text-primary)' }}>
                26:07
              </h1>
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="badge badge-accent text-[9px]">
                Table {tableInfo?.tableNumber}
              </span>
              <div className="flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--text-dim)' }}>
                <Star size={12} className="fill-yellow-500 text-yellow-500" />
                4.9
              </div>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--bg-elevated)', color: 'var(--text-dim)' }}
          >
            <ShoppingBag size={20} />
          </div>
        </div>
        
        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto mt-6 pb-1 no-scrollbar">
          {categories.map(c => (
            <button 
              key={c} 
              onClick={() => setActiveCategory(c)}
              className="px-5 py-2 rounded-lg font-bold text-[11px] uppercase tracking-wider whitespace-nowrap transition-all"
              style={activeCategory === c ? {
                background: 'linear-gradient(135deg, var(--accent), #ea580c)',
                color: '#fff',
                boxShadow: '0 4px 16px rgba(249,115,22,0.3)',
              } : {
                background: 'var(--bg-elevated)',
                color: 'var(--text-dim)',
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* 🚀 Active Order Tracker */}
      {currentOrder && (
        <div className="mx-5 mt-6 p-5 rounded-3xl border border-orange-500/20 animate-in"
          style={{ background: 'rgba(249,115,22,0.03)' }}
        >
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-orange-500/10 text-orange-500">
                {currentOrder.status === 'READY' ? <CheckCircle2 size={18} /> : <Clock size={18} className="animate-spin-slow" />}
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-orange-500/60">Active Order</p>
                <p className="text-xs font-bold text-white uppercase">{currentOrder.status === 'READY' ? 'Ready to serve' : 'Cooking in kitchen'}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Token</p>
              <p className="text-xs font-black text-white">#{currentOrder.orderNumber.slice(-3)}</p>
            </div>
          </div>
          
          <div className="flex -space-x-2 overflow-hidden mb-4">
             {currentOrder.items.slice(0, 4).map((item: any, i: number) => (
               <div key={i} className="w-8 h-8 rounded-full border-2 border-zinc-950 flex items-center justify-center bg-zinc-800 text-[10px] uppercase font-bold text-white">
                 {item.itemName[0]}
               </div>
             ))}
             {currentOrder.items.length > 4 && (
               <div className="w-8 h-8 rounded-full border-2 border-zinc-950 flex items-center justify-center bg-zinc-700 text-[10px] font-bold text-white">
                 +{currentOrder.items.length - 4}
               </div>
             )}
          </div>

          <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden mb-5">
             <div className="h-full bg-orange-500 rounded-full transition-all duration-1000"
               style={{ width: currentOrder.status === 'READY' ? '100%' : '60%' }}
             ></div>
          </div>
          
          <div className="pt-5 border-t border-orange-500/10">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Total Bill</span>
              <span className="text-xl font-black text-white">₹{currentOrder.totalAmount.toFixed(2)}</span>
            </div>
            {currentOrder.paymentStatus !== 'paid' && (
              <button 
                onClick={handleRazorpayPayment}
                disabled={isPaying}
                className="w-full py-4 rounded-xl flex items-center justify-center gap-2 font-bold transition-all active:scale-[0.98]"
                style={{ background: '#3395FF', color: 'white' }}
              >
                {isPaying ? (
                   <Clock size={18} className="animate-spin" />
                ) : (
                   <CreditCard size={18} />
                )}
                {isPaying ? 'Connecting to Razorpay...' : 'Pay with Razorpay'}
              </button>
            )}
            {currentOrder.paymentStatus === 'paid' && (
              <div className="w-full py-3.5 rounded-xl flex items-center justify-center gap-2 font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <CheckCircle2 size={18} />
                Bill Paid
              </div>
            )}
           </div>
        </div>
      )}

      {/* Menu Items */}
      <div className="p-5 space-y-3">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-dim)' }}>
            {activeCategory} Menu
          </h2>
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--accent)' }}>
            {filteredMenu.length} items
          </span>
        </div>
        
        {filteredMenu.map(item => (
          <div key={item.id} className="flex gap-4 p-4 rounded-2xl transition-all active:scale-[0.98]"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
          >
            {item.image && (
              <div className="w-[72px] h-[72px] shrink-0 rounded-2xl overflow-hidden shadow-sm border border-white/5">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-2.5 h-2.5 rounded-sm border ${item.isVeg ? 'bg-emerald-500 border-emerald-400' : 'bg-rose-500 border-rose-400'}`}></div>
                <h3 className="font-bold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{item.name}</h3>
              </div>
              <p className="text-[11px] font-medium line-clamp-2 mt-0.5" style={{ color: 'var(--text-dim)' }}>
                {item.description || 'Authentic spices and ingredients.'}
              </p>
              <p className="font-bold mt-3 text-sm" style={{ color: 'var(--text-primary)' }}>₹{item.price}</p>
            </div>
            <div className="flex items-end shrink-0">
              {cart.find(i => i.menuItem === item.id) ? (
                <div className="flex items-center gap-2 bg-zinc-800/50 p-1.5 rounded-xl border border-white/5">
                  <button 
                    onClick={() => removeFromCart(item.name)} 
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-90"
                    style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
                  >
                    <Minus size={14} strokeWidth={3} />
                  </button>
                  <span className="w-6 text-center text-xs font-bold text-white">
                    {cart.filter(i => i.menuItem === item.id).reduce((acc, i) => acc + i.quantity, 0)}
                  </span>
                  <button 
                    onClick={() => item.hasPortions ? setPortionSelectionItem(item) : addToCart(item)} 
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-90"
                    style={{ background: 'var(--accent)', color: '#fff' }}
                  >
                    <Plus size={14} strokeWidth={3} />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => item.hasPortions ? setPortionSelectionItem(item) : addToCart(item)} 
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90"
                  style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}
                >
                  <Plus size={16} strokeWidth={3} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Cart Bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-5 left-5 right-5 lg:left-auto lg:right-5 lg:w-96 p-5 flex items-center justify-between z-50 rounded-2xl animate-slide-up"
          style={{
            background: 'var(--glass)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid var(--border)',
            boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
          }}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm"
              style={{ background: 'linear-gradient(135deg, var(--accent), #ea580c)', color: '#fff' }}
            >
              {cart.reduce((acc, i) => acc + i.quantity, 0)}
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-dim)' }}>Total</p>
              <p className="text-lg font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>₹{cartTotal}</p>
            </div>
          </div>
          <button 
            onClick={placeOrder} 
            className="btn-saanam text-xs uppercase tracking-widest"
            style={{ padding: '12px 20px' }}
          >
            Order
            <ChevronRight size={14} />
          </button>
        </div>
      )}
      {/* Portion Selection Modal */}
      {portionSelectionItem && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}
        >
          <div className="glass-card w-full max-w-sm p-8 animate-scale-in text-center relative">
            <button 
              onClick={() => setPortionSelectionItem(null)}
              className="absolute top-6 right-6 text-zinc-500 hover:text-white"
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-black mb-1 capitalize" style={{ color: 'var(--text-primary)' }}>{portionSelectionItem.name}</h2>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-8 border-b border-white/5 pb-4">Select Portion Size</p>
            
            <div className="grid grid-cols-2 gap-4">
              {['1/4', '1/2', '3/4', 'FULL'].map(p => {
                const ratio = p === '1/4' ? 0.25 : p === '1/2' ? 0.5 : p === '3/4' ? 0.75 : 1;
                const price = Math.round(portionSelectionItem.price * ratio);
                return (
                  <button 
                    key={p}
                    onClick={() => addToCart(portionSelectionItem, p)}
                    className="p-6 rounded-2xl bg-zinc-900 border border-white/5 hover:border-orange-500/50 hover:bg-orange-500/5 transition-all text-center group"
                  >
                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-2 group-hover:text-orange-500">{p}</p>
                    <p className="text-lg font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>₹{price}</p>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
