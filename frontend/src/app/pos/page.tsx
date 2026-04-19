"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { 
  ShoppingBag, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  CheckCircle2, 
  ChevronRight, 
  Clock, 
  LayoutGrid, 
  User, 
  Phone, 
  ArrowRight,
  Receipt,
  Flame,
  X,
  AlertCircle
} from "lucide-react";

export default function POSTerminal() {
  const [categories, setCategories] = useState<string[]>([]);
  const [menu, setMenu] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTakeaway, setIsTakeaway] = useState(false);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [customerDetails, setCustomerDetails] = useState({ name: '', phone: '' });
  const [heldOrder, setHeldOrder] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('pos_held_order');
    if (saved) setHeldOrder(JSON.parse(saved));
  }, []);

  const saveHold = () => {
    if (cart.length === 0) return;
    const holdData = { cart, isTakeaway, selectedTableId, customerDetails };
    localStorage.setItem('pos_held_order', JSON.stringify(holdData));
    setHeldOrder(holdData);
    setCart([]);
    toast.success("Order Held");
  };

  const recallHold = () => {
    if (!heldOrder) return;
    setCart(heldOrder.cart);
    setIsTakeaway(heldOrder.isTakeaway);
    setSelectedTableId(heldOrder.selectedTableId);
    setCustomerDetails(heldOrder.customerDetails);
    setHeldOrder(null);
    localStorage.removeItem('pos_held_order');
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [menuRes, tablesRes, catRes] = await Promise.all([
        api.get('/menu'),
        api.get('/tables'),
        api.get('/menu/categories')
      ]);
      setMenu(menuRes.data.data);
      setTables(tablesRes.data.data);
      setCategories(["All", ...catRes.data.data]);
    } catch (error) {
      toast.error("Failed to sync terminal data");
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(i => i.id !== itemId));
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.id === itemId) {
        const newQty = Math.max(1, i.quantity + delta);
        return { ...i, quantity: newQty };
      }
      return i;
    }));
  };

  const filteredMenu = activeCategory === "All" ? menu : menu.filter(m => m.category === activeCategory);
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const gst = subtotal * 0.05;
  const total = subtotal + gst;

  const handlePrint = () => {
    if (cart.length === 0) return toast.error("Nothing to print");
    window.print();
  };

  const handlePlaceOrder = async () => {
    if (isSubmitting) return;
    if (cart.length === 0) return toast.error("Cart is empty");
    if (!isTakeaway && !selectedTableId) return toast.error("Please select a table");
    if (isTakeaway && !customerDetails.name) return toast.error("Guest name required for takeaway");

    setIsSubmitting(true);
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
    } finally {
      setIsSubmitting(false);
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
      {/* ═══════ Printable Receipt (Hidden) ═══════ */}
      <div className="hidden print:block print-only print:w-[80mm] print:p-4 text-black bg-white font-mono text-[12px] leading-tight">
        <div className="text-center mb-4">
          <h1 className="text-lg font-bold uppercase tracking-tighter">26:07</h1>
          <p className="text-[10px]">Restaurant Management Suite</p>
          <div className="border-b border-dashed border-black my-2"></div>
          <p className="uppercase font-bold">Bill Receipt</p>
          <div className="border-b border-dashed border-black my-2"></div>
        </div>

        <div className="space-y-1 mb-4">
          <div className="flex justify-between">
            <span>Date:</span>
            <span>{new Date().toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Type:</span>
            <span>{isTakeaway ? 'TAKEAWAY' : 'DINE-IN'}</span>
          </div>
          {!isTakeaway && (
            <div className="flex justify-between font-bold">
              <span>Table:</span>
              <span>{tables.find(t => t.id === selectedTableId)?.tableNumber || 'N/A'}</span>
            </div>
          )}
          {isTakeaway && customerDetails.name && (
            <div className="flex justify-between">
              <span>Guest:</span>
              <span className="truncate max-w-[120px]">{customerDetails.name}</span>
            </div>
          )}
        </div>

        <div className="border-b border-dashed border-black mb-2"></div>
        <div className="grid grid-cols-[1fr_auto_auto] gap-2 mb-2 font-bold">
          <span>Item</span>
          <span>Qty</span>
          <span>Price</span>
        </div>
        <div className="border-b border-dashed border-black mb-2"></div>

        <div className="space-y-1 mb-4">
          {cart.map((item, i) => (
            <div key={i} className="grid grid-cols-[1fr_auto_auto] gap-2">
              <span className="truncate">{item.name}</span>
              <span>x{item.quantity}</span>
              <span>₹{item.price * item.quantity}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-dashed border-black pt-2 space-y-1">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>GST (5%):</span>
            <span>₹{gst.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-base font-bold">
            <span>TOTAL:</span>
            <span>₹{total.toFixed(2)}</span>
          </div>
        </div>

        <div className="text-center mt-8 pt-4 border-t border-dashed border-black">
          <p className="text-[10px] mb-1">Thank you for visiting 26:07!</p>
          <p className="text-[9px] uppercase tracking-widest">Visit us again</p>
        </div>
      </div>

      {/* ═══════ Main UI ═══════ */}
      <div className="flex-1 flex flex-row min-w-0 print:hidden">
        
        {/* Product Grid Area */}
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
                  26:07
                </h1>
              </div>

              <div className="flex items-center gap-3">
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
                      background: 'var(--bg-surface)',
                      color: 'var(--text-primary)',
                      boxShadow: 'var(--shadow-sm)',
                    } : {
                      color: 'var(--text-dim)',
                    }}
                  >
                    Takeaway
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {categories.map(cat => (
                <button 
                  key={cat} 
                  onClick={() => setActiveCategory(cat)}
                  className="px-5 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all whitespace-nowrap"
                  style={activeCategory === cat ? {
                    background: 'var(--text-primary)',
                    color: 'var(--bg-deep)',
                  } : {
                    background: 'var(--bg-elevated)',
                    color: 'var(--text-dim)',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </header>

          <div className="flex-1 p-6 overflow-y-auto custom-scroll grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 content-start">
            {filteredMenu.map(item => (
              <div 
                key={item.id} 
                onClick={() => addToCart(item)}
                className="glow-card group p-5 cursor-pointer flex flex-col"
              >
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

        {/* Cart Sidebar */}
        <div className="w-[360px] flex flex-col shrink-0 hidden md:flex"
          style={{ background: 'var(--bg-surface)', borderLeft: '1px solid var(--border)' }}
        >
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
                      <span className="text-[11px] font-black tracking-tight leading-none mb-0.5">T{table.tableNumber}</span>
                      <span className="text-[8px] font-bold uppercase tracking-widest opacity-60">{table.capacity} PAX</span>
                      <div className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full ${isOccupied ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

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
                    <div className="w-1.5 h-6 rounded-full mt-0.5" style={{ background: 'var(--accent)' }}></div>
                    <div>
                      <p className="text-xs font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>{item.name}</p>
                      <p className="text-[10px] font-bold mt-1" style={{ color: 'var(--text-dim)' }}>₹{item.price}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center bg-zinc-800/50 rounded-lg p-1 border border-white/5">
                      <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:text-white transition-colors"><Minus size={12} /></button>
                      <span className="w-6 text-center text-xs font-bold">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:text-white transition-colors"><Plus size={12} /></button>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="text-zinc-600 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-6 space-y-4" style={{ background: 'var(--bg-elevated)', borderTop: '1px solid var(--border)' }}>
            <div className="space-y-2">
              <div className="flex justify-between text-[11px] font-medium" style={{ color: 'var(--text-tertiary)' }}>
                <span>Subtotal</span>
                <span className="font-bold">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[11px] font-medium" style={{ color: 'var(--text-tertiary)' }}>
                <span>GST (5.0%)</span>
                <span className="font-bold">₹{gst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-black pt-2" style={{ borderTop: '1px dashed var(--border)', color: 'var(--text-primary)' }}>
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={handlePrint}
                disabled={cart.length === 0}
                className="px-6 py-4 rounded-xl flex items-center justify-center gap-2 font-bold text-[11px] uppercase tracking-widest transition-all"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              >
                <Receipt size={16} />
                Print
              </button>
              <button 
                className="px-6 py-4 rounded-xl flex items-center justify-center gap-2 font-bold text-[11px] uppercase tracking-widest transition-all"
                style={{ 
                  background: heldOrder ? 'var(--accent-soft)' : 'var(--bg-surface)', 
                  border: heldOrder ? '1px solid var(--accent-border)' : '1px solid var(--border)', 
                  color: heldOrder ? 'var(--accent)' : 'var(--text-dim)' 
                }}
                onClick={heldOrder ? recallHold : saveHold}
                disabled={!heldOrder && cart.length === 0}
              >
                {heldOrder ? <ArrowRight size={16} /> : <Clock size={16} />}
                {heldOrder ? 'Recall' : 'Hold'}
              </button>
              <button 
                onClick={handlePlaceOrder}
                disabled={cart.length === 0 || isSubmitting}
                className="btn-saanam col-span-2 text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-2.5"
                style={{ padding: '18px 28px' }}
              >
                <Flame size={16} />
                Fire Order
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
