"use client";

import { useEffect, useState, use } from "react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { ShoppingBag, Star, ChevronRight, Plus, Flame } from "lucide-react";

export default function DigitalMenu({ params }: { params: Promise<{ tableId: string }> }) {
  const unwrappedParams = use(params);
  const tableId = unwrappedParams.tableId;

  const [categories, setCategories] = useState<string[]>([]);
  const [menu, setMenu] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableInfo, setTableInfo] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

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

  const addToCart = (item: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.menuItem === item.id);
      if (existing) {
        return prev.map(i => i.menuItem === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { menuItem: item.id, name: item.name, price: item.price, quantity: 1, isVeg: item.isVeg }];
    });
    toast.success(`${item.name} added`, { position: 'bottom-center' });
  };

  const placeOrder = async () => {
    if (cart.length === 0) return toast.error("Empty cart");

    try {
      if (tableInfo.currentOrder) {
        await api.post(`/orders/${tableInfo.currentOrder.id}/add-items`, { items: cart });
      } else {
        await api.post('/orders', { tableId: tableId, items: cart });
      }
      toast.success("Order sent to kitchen!", { position: 'bottom-center' });
      setCart([]);
      fetchData(); 
    } catch (error) {
       toast.error("Failed to place order");
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
    <div className="min-h-screen pb-28 no-scrollbar" style={{ background: 'var(--bg-deep)' }}>
      {/* Header */}
      <div className="px-5 pt-8 pb-6 sticky top-0 z-10 rounded-b-3xl"
        style={{ background: 'var(--glass-heavy)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Flame size={18} style={{ color: 'var(--accent)' }} />
              <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-outfit), sans-serif', color: 'var(--text-primary)' }}>
                Saanam
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
              <button 
                onClick={() => addToCart(item)} 
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90"
                style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}
              >
                <Plus size={16} strokeWidth={3} />
              </button>
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
    </div>
  );
}
