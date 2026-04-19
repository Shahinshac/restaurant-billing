"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { 
  ShoppingBag, 
  Search, 
  Plus, 
  Minus, 
  Receipt, 
  User, 
  Phone, 
  ArrowRight,
  Filter,
  CheckCircle2,
  AlertCircle,
  Flame,
  Sparkles
} from "lucide-react";

export default function POSPage() {
  const [categories, setCategories] = useState<string[]>([]);
  const [menu, setMenu] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [cart, setCart] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [isTakeaway, setIsTakeaway] = useState(false);
  const [customerDetails, setCustomerDetails] = useState({ name: '', phone: '' });

  const [tables, setTables] = useState<any[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [cats, items, tablesRes] = await Promise.all([
        api.get('/menu/categories'),
        api.get('/menu'),
        api.get('/tables')
      ]);
      setCategories(["All", ...cats.data.data]);
      setMenu(items.data.data);
      setTables(tablesRes.data.data);
    } catch (error) {
      toast.error("Failed to load menu data");
    } finally {
      setLoading(false);
    }
  };

  const filteredMenu = menu.filter(item => {
    const matchesCategory = activeCategory === "All" || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addToCart = (item: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    toast.success(`${item.name} added`, { duration: 1000, position: 'bottom-center' });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const gst = subtotal * 0.05;
  const total = subtotal + gst;

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return toast.error("Cart is empty");
    if (!isTakeaway && !selectedTableId) return toast.error("Please select a table");
    if (isTakeaway && !customerDetails.name) return toast.error("Guest name required for takeaway");

    try {
      const payload = {
        tableId: isTakeaway ? null : selectedTableId,
        orderType: isTakeaway ? 'TAKEAWAY' : 'DINE_IN',
        customerName: customerDetails.name,
        customerPhone: customerDetails.phone,
        items: cart.map(i => ({
          menuItemId: i.id,
          name: i.name,
          price: i.price,
          quantity: i.quantity
        }))
      };

      await api.post('/orders', payload);
      toast.custom((t) => (
        <div className="flex items-center gap-3 px-5 py-4 rounded-2xl animate-in"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}
        >
          <CheckCircle2 style={{ color: 'var(--success)' }} size={20} />
          <div className="flex flex-col">
            <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Order Fired!</span>
            <span className="text-[11px]" style={{ color: 'var(--text-dim)' }}>Sent to kitchen successfully</span>
          </div>
        </div>
      ));
      setCart([]);
      setSelectedTableId(null);
      setCustomerDetails({ name: '', phone: '' });
      fetchInitialData();
    } catch (error) {
      toast.error("Failed to place order");
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen" style={{ background: 'var(--bg-deep)' }}>
      <div className="w-12 h-12 border-[3px] rounded-full animate-spin mb-5"
        style={{ borderColor: 'var(--bg-elevated)', borderTopColor: 'var(--accent)' }}
      ></div>
      <p className="font-bold text-[10px] uppercase tracking-[0.3em]" style={{ color: 'var(--text-dim)' }}>Initializing POS...</p>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden animate-in" style={{ background: 'var(--bg-deep)' }}>
      {/* ═══════ Product Grid ═══════ */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Bar */}
        <header className="px-6 py-5 shrink-0" style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
          <div className="flex justify-between items-center mb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full" style={{ background: 'var(--success)' }}></span>
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-dim)' }}>POS Terminal • Online</p>
              </div>
              <h1 className="text-xl font-black tracking-tight" style={{ fontFamily: 'var(--font-outfit), sans-serif', color: 'var(--text-primary)' }}>
                Menu Register
              </h1>
            </div>

            <div className="flex items-center gap-3">
              {/* Mode Switcher */}
              <div className="p-1 rounded-xl flex" style={{ background: 'var(--bg-elevated)' }}>
                <button 
                  onClick={() => setIsTakeaway(false)}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold transition-all"
                  style={!isTakeaway ? {
                    background: 'var(--bg-surface)',
                    color: 'var(--text-primary)',
                    boxShadow: 'var(--shadow-sm)',
                  } : {
                    color: 'var(--text-dim)',
                  }}
                >
                  Dine-In
                </button>
                <button 
                  onClick={() => setIsTakeaway(true)}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold transition-all"
                  style={isTakeaway ? {
                    background: 'linear-gradient(135deg, var(--accent), #ea580c)',
                    color: '#fff',
                    boxShadow: '0 4px 16px rgba(249,115,22,0.3)',
                  } : {
                    color: 'var(--text-dim)',
                  }}
                >
                  Takeaway
                </button>
              </div>

              {/* Search */}
              <div className="relative group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors" size={16} style={{ color: 'var(--text-dim)' }} />
                <input 
                  type="text" 
                  placeholder="Search menu..." 
                  className="input-saanam pl-10 w-56 xl:w-72"
                  style={{ padding: '10px 16px 10px 38px', fontSize: '13px' }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 pr-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-dim)', borderRight: '1px solid var(--border)' }}>
              <Filter size={12} />
              <span>Filter</span>
            </div>
            <div className="flex gap-2 flex-1 overflow-x-auto no-scrollbar">
              {categories.map(cat => (
                <button 
                  key={cat} 
                  onClick={() => setActiveCategory(cat)}
                  className="px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap"
                  style={activeCategory === cat ? {
                    background: 'var(--text-primary)',
                    color: 'var(--bg-deep)',
                  } : {
                    background: 'var(--bg-elevated)',
                    color: 'var(--text-dim)',
                    border: '1px solid transparent',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Menu Grid */}
        <div className="flex-1 p-6 overflow-y-auto custom-scroll grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 content-start">
          {filteredMenu.map(item => (
            <div 
              key={item.id} 
              onClick={() => addToCart(item)}
              className="glow-card group p-5 cursor-pointer flex flex-col"
            >
              {/* Thumbnail */}
              <div className="relative aspect-[4/3] mb-4 rounded-xl overflow-hidden flex items-center justify-center"
                style={{ background: 'var(--bg-elevated)' }}
              >
                <div className="text-4xl filter grayscale group-hover:grayscale-0 transition-all duration-500 transform group-hover:scale-110">
                  {item.category?.includes('Drink') ? '🥤' : item.category?.includes('Burger') ? '🍔' : item.category?.includes('Pizza') ? '🍕' : item.category?.includes('Dessert') ? '🍰' : '🍲'}
                </div>
                <div className={`absolute top-2.5 left-2.5 w-3 h-3 rounded-full border-2 ${item.isVeg ? 'bg-emerald-500 border-emerald-400/30' : 'bg-rose-500 border-rose-400/30'}`}></div>
              </div>
              
              <div className="flex-1">
                <h3 className="text-sm font-bold leading-snug transition-colors line-clamp-2 mb-1"
                  style={{ color: 'var(--text-primary)' }}
                >{item.name}</h3>
                <p className="text-[11px] font-medium mb-3 line-clamp-2 leading-relaxed" style={{ color: 'var(--text-dim)' }}>
                  {item.description || 'Authentic preparation.'}
                </p>
              </div>
              
              <div className="pt-3 flex justify-between items-center mt-auto" style={{ borderTop: '1px solid var(--border)' }}>
                <span className="text-base font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>₹{item.price}</span>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-dim)' }}
                >
                  <Plus size={16} strokeWidth={2.5} />
                </div>
              </div>
            </div>
          ))}
          {filteredMenu.length === 0 && (
            <div className="col-span-full py-28 flex flex-col items-center justify-center">
              <AlertCircle size={44} strokeWidth={1.5} className="mb-3" style={{ color: 'var(--text-dim)' }} />
              <p className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--text-dim)' }}>No items found</p>
            </div>
          )}
        </div>
      </div>

      {/* ═══════ Cart Panel ═══════ */}
      <div className="w-[360px] flex flex-col shrink-0 hidden md:flex"
        style={{ background: 'var(--bg-surface)', borderLeft: '1px solid var(--border)' }}
      >
        {/* Cart Header */}
        <div className="p-6" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex justify-between items-center mb-1">
            <h2 className="text-lg font-bold tracking-tight flex items-center gap-2.5" style={{ color: 'var(--text-primary)' }}>
              Active Order
              {cart.length > 0 && (
                <span className="w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center"
                  style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
                >{cart.length}</span>
              )}
            </h2>
            <div className="p-2 rounded-lg" style={{ background: 'var(--bg-elevated)', color: 'var(--text-dim)' }}>
              <Receipt size={18} />
            </div>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--text-dim)' }}>Order Draft</p>
        </div>

        {/* Table / Customer Selection */}
        <div className="px-6 py-5" style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
          {isTakeaway ? (
            <div className="space-y-2.5">
              <div className="group flex items-center gap-3 p-3.5 rounded-xl transition-all"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                <User size={15} style={{ color: 'var(--text-dim)' }} />
                <input 
                  type="text" 
                  placeholder="Guest Name"
                  className="flex-1 outline-none text-xs font-bold bg-transparent"
                  style={{ color: 'var(--text-primary)' }}
                  value={customerDetails.name}
                  onChange={(e) => setCustomerDetails({...customerDetails, name: e.target.value})}
                />
              </div>
              <div className="group flex items-center gap-3 p-3.5 rounded-xl transition-all"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                <Phone size={15} style={{ color: 'var(--text-dim)' }} />
                <input 
                  type="tel" 
                  placeholder="Phone (Optional)"
                  className="flex-1 outline-none text-xs font-bold bg-transparent"
                  style={{ color: 'var(--text-primary)' }}
                  value={customerDetails.phone}
                  onChange={(e) => setCustomerDetails({...customerDetails, phone: e.target.value})}
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-2">
              {tables.map(table => {
                const isOccupied = table.status === 'OCCUPIED' || table.status === 'RESERVED';
                return (
                  <button 
                    key={table.id}
                    onClick={() => setSelectedTableId(table.id)}
                    className="relative aspect-square rounded-xl flex flex-col items-center justify-center transition-all"
                    style={selectedTableId === table.id ? {
                      background: 'linear-gradient(135deg, var(--accent), #ea580c)',
                      color: '#fff',
                      boxShadow: '0 4px 20px rgba(249,115,22,0.35)',
                    } : isOccupied ? {
                      background: 'var(--danger-soft)',
                      color: 'var(--danger)',
                      border: '1px solid rgba(239,68,68,0.2)',
                    } : {
                      background: 'var(--bg-surface)',
                      color: 'var(--text-dim)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <span className="text-[11px] font-black tracking-tight">{table.tableNumber}</span>
                    <div className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full ${isOccupied ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scroll">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center py-10">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: 'var(--bg-elevated)' }}>
                <ShoppingBag size={32} strokeWidth={1} style={{ color: 'var(--text-dim)' }} />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: 'var(--text-dim)' }}>Cart is empty</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex justify-between items-center group animate-in">
                <div className="flex-1 pr-4 flex items-start gap-2.5">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--accent)' }}></div>
                  <div>
                    <h4 className="font-bold text-xs leading-tight uppercase tracking-tight transition-colors" style={{ color: 'var(--text-primary)' }}>{item.name}</h4>
                    <p className="text-[11px] font-bold mt-1" style={{ color: 'var(--text-dim)' }}>₹{item.price}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-1.5 rounded-xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                  <button onClick={() => updateQuantity(item.id, -1)} className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:opacity-80"
                    style={{ background: 'var(--bg-surface)', color: 'var(--danger)' }}
                  >
                    <Minus size={12} strokeWidth={3} />
                  </button>
                  <span className="text-xs font-black min-w-[12px] text-center" style={{ color: 'var(--text-primary)' }}>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:opacity-80"
                    style={{ background: 'var(--bg-surface)', color: 'var(--success)' }}
                  >
                    <Plus size={12} strokeWidth={3} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Totals & CTA */}
        <div className="p-6 shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
              <span style={{ color: 'var(--text-dim)' }}>Subtotal</span>
              <span style={{ color: 'var(--text-primary)' }}>₹{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
              <span style={{ color: 'var(--text-dim)' }}>GST 5%</span>
              <span style={{ color: 'var(--text-primary)' }}>₹{gst.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-end pt-3" style={{ borderTop: '1px solid var(--border)' }}>
              <span className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: 'var(--text-secondary)' }}>Total</span>
              <span className="text-2xl font-black tracking-tighter" style={{ color: 'var(--text-primary)' }}>₹{total.toLocaleString()}</span>
            </div>
          </div>

          <button 
            onClick={handlePlaceOrder}
            disabled={cart.length === 0}
            className="btn-saanam w-full text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2.5"
            style={{ padding: '18px 28px' }}
          >
            <Flame size={16} />
            Fire Order
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
