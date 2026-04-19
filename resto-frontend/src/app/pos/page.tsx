"use client";

import { useEffect, useState, useRef } from "react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { X, Printer, Grid, ShoppingBag, ChevronRight, Search, Plus, Minus, CreditCard, Receipt, Clock, User, Phone } from "lucide-react";

export default function POSPage() {
  const [categories, setCategories] = useState<string[]>([]);
  const [menu, setMenu] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [cart, setCart] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCheckout, setShowCheckout] = useState(false);
  
  // New States for Multi-Mode POS
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
      toast.error("Failed to sync production data");
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
    if (!isTakeaway && !selectedTableId) return toast.error("Please select a table for Dine-In");
    if (isTakeaway && !customerDetails.name) return toast.error("Customer name required for Takeaway");

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
      toast.success("Order pushed to Kitchen!");
      setCart([]);
      setSelectedTableId(null);
      setCustomerDetails({ name: '', phone: '' });
      setShowCheckout(false);
      fetchInitialData();
    } catch (error) {
      toast.error("Failed to place order");
    }
  };

  if (loading) return (
    <div className="p-12 flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-10 h-10 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin mb-4"></div>
      <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Waking up POS Terminal...</p>
    </div>
  );

  return (
    <div className="flex h-full bg-slate-50 relative overflow-hidden animate-slide-up">
      {/* Left: Menu Area */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-slate-100">
        <header className="p-8 bg-white border-b border-slate-100 shrink-0">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Main Register</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Order Entry Terminal</p>
            </div>
            
            <div className="flex items-center gap-4">
               {/* Mode Switcher */}
               <div className="bg-slate-100 p-1.5 rounded-2xl flex gap-1">
                  <button 
                    onClick={() => setIsTakeaway(false)}
                    className={`px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${!isTakeaway ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Dine-In
                  </button>
                  <button 
                    onClick={() => setIsTakeaway(true)}
                    className={`px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${isTakeaway ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Takeaway
                  </button>
               </div>

               <div className="relative group">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={18} />
                 <input 
                   type="text" 
                   placeholder="Search products..." 
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   className="pl-12 pr-6 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-emerald-500/20 focus:ring-4 focus:ring-emerald-500/5 transition-all text-sm font-semibold min-w-[300px]"
                 />
               </div>
            </div>
          </div>

          <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-2">
            {categories.map(cat => (
              <button 
                key={cat} 
                onClick={() => setActiveCategory(cat)}
                className={`px-6 py-2.5 rounded-xl font-bold text-[11px] uppercase tracking-widest whitespace-nowrap transition-all ${activeCategory === cat ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/10' : 'bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </header>

        <div className="flex-1 p-8 overflow-y-auto no-scrollbar grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
          {filteredMenu.map(item => (
            <div 
              key={item.id} 
              onClick={() => addToCart(item)}
              className="group bg-white p-6 rounded-[2rem] border border-slate-50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer flex flex-col h-full"
            >
              <div className="flex justify-between items-start mb-6">
                 <div className={`w-3 h-3 rounded-full ${item.isVeg ? 'bg-emerald-500' : 'bg-rose-500'} shadow-sm`}></div>
                 <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <Clock size={10} />
                    {item.prepTime}m
                 </div>
              </div>
              
              <h3 className="text-base font-bold text-slate-800 leading-tight mb-2 flex-1">{item.name}</h3>
              <p className="text-[10px] text-slate-400 line-clamp-2 mb-4 font-medium">{item.description}</p>
              
              <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                <span className="text-lg font-bold text-slate-900">₹{item.price}</span>
                <div className="w-10 h-10 bg-slate-50 group-hover:bg-emerald-600 group-hover:text-white rounded-xl flex items-center justify-center transition-colors">
                  <Plus size={18} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Cart Area */}
      <div className="w-[450px] bg-white border-l border-slate-100 flex flex-col animate-slide-left shrink-0">
        <div className="p-8 border-b border-slate-50">
          <div className="flex justify-between items-center mb-1">
             <h2 className="text-xl font-bold text-slate-900">Customer Ticket</h2>
             <ShoppingBag size={20} className="text-slate-300" />
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Draft Selection</p>
        </div>

        {/* Dynamic Detail Input depending on mode */}
        <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/30">
           {isTakeaway ? (
              <div className="space-y-4">
                 <div className="flex items-center gap-3 bg-white p-3.5 rounded-xl border border-slate-100">
                    <User size={18} className="text-slate-300" />
                    <input 
                      type="text" 
                      placeholder="Guest Name for Takeaway"
                      className="flex-1 outline-none text-xs font-bold text-slate-800 placeholder:text-slate-300"
                      value={customerDetails.name}
                      onChange={(e) => setCustomerDetails({...customerDetails, name: e.target.value})}
                    />
                 </div>
                 <div className="flex items-center gap-3 bg-white p-3.5 rounded-xl border border-slate-100">
                    <Phone size={18} className="text-slate-300" />
                    <input 
                      type="tel" 
                      placeholder="Contact Number (Optional)"
                      className="flex-1 outline-none text-xs font-bold text-slate-800 placeholder:text-slate-300"
                      value={customerDetails.phone}
                      onChange={(e) => setCustomerDetails({...customerDetails, phone: e.target.value})}
                    />
                 </div>
              </div>
           ) : (
              <div className="grid grid-cols-4 gap-2">
                {tables.map(table => (
                   <button 
                    key={table.id}
                    onClick={() => setSelectedTableId(table.id)}
                    className={`aspect-square rounded-2xl border flex flex-col items-center justify-center transition-all ${
                      selectedTableId === table.id 
                        ? 'bg-slate-900 border-slate-900 text-white shadow-lg' 
                        : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                    }`}
                   >
                     <span className="text-xs font-bold leading-none mb-0.5">T{table.tableNumber}</span>
                   </button>
                ))}
              </div>
           )}
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-200">
              <div className="w-16 h-16 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-4">
                 <Receipt size={32} />
              </div>
              <p className="text-sm font-bold uppercase tracking-widest">Empty Ticket</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex justify-between items-center group">
                <div className="flex-1">
                  <h4 className="font-bold text-slate-800 text-sm leading-tight group-hover:text-emerald-600 transition-colors">{item.name}</h4>
                  <p className="text-sm font-bold text-slate-400 mt-1.5">₹{item.price * item.quantity}</p>
                </div>
                <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-xl">
                  <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 rounded-lg text-slate-400 hover:bg-white hover:text-slate-900 transition-all flex items-center justify-center">
                    <Minus size={14} strokeWidth={3} />
                  </button>
                  <span className="text-xs font-black text-slate-900 min-w-[12px] text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 rounded-lg text-slate-400 hover:bg-white hover:text-slate-900 transition-all flex items-center justify-center">
                    <Plus size={14} strokeWidth={3} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-8 bg-white border-t border-slate-100">
          <div className="space-y-4 mb-8">
            <div className="flex justify-between text-xs font-bold text-slate-400">
              <span className="uppercase tracking-widest">Subtotal</span>
              <span>₹{subtotal}</span>
            </div>
            <div className="flex justify-between text-xs font-bold text-slate-400">
              <span className="uppercase tracking-widest">SGST/CGST (5%)</span>
              <span>₹{gst}</span>
            </div>
            <div className="flex justify-between text-2xl font-bold text-slate-900 items-end pt-2">
              <span className="tracking-tighter">Net Total</span>
              <span className="text-3xl font-black">₹{total}</span>
            </div>
          </div>

          <button 
            onClick={handlePlaceOrder}
            className="w-full bg-slate-900 hover:bg-black text-white py-5 rounded-[2rem] font-bold text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-2xl shadow-slate-900/20 active:scale-95"
          >
            Review & Push Service
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
