"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { X, ShoppingBag, Search, Plus, Minus, Receipt, Clock, User, Phone, ChevronRight } from "lucide-react";

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
    <div className="flex h-screen bg-white relative overflow-hidden animate-slide-up">
      {/* Left Menu Section */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50/30">
        
        {/* Refined Header */}
        <header className="px-6 py-6 bg-white border-b border-slate-100 shrink-0">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                 Register Terminal
                 <div className="px-2 py-0.5 bg-emerald-100 text-emerald-600 rounded text-[9px] font-bold uppercase tracking-widest">Live</div>
              </h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Daily Operations & Order Entry</p>
            </div>

            <div className="flex items-center gap-3">
               {/* Mode Switch */}
               <div className="bg-slate-100 p-1 rounded-xl flex gap-1">
                  <button 
                    onClick={() => setIsTakeaway(false)}
                    className={`px-4 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${!isTakeaway ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Dine-In
                  </button>
                  <button 
                    onClick={() => setIsTakeaway(true)}
                    className={`px-4 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${isTakeaway ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Takeaway
                  </button>
               </div>

               {/* Modern Search */}
               <div className="relative">
                 <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                 <input 
                   type="text" 
                   placeholder="Search products..." 
                   className="pl-10 pr-4 py-2 bg-slate-100/50 border border-transparent rounded-xl outline-none focus:bg-white focus:border-emerald-500/20 focus:ring-4 focus:ring-emerald-500/5 transition-all text-xs font-semibold w-48 lg:w-64"
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                 />
               </div>
            </div>
          </div>

          {/* Compact Categories */}
          <div className="flex gap-2.5 overflow-x-auto no-scrollbar py-1">
            {categories.map(cat => (
              <button 
                key={cat} 
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-lg font-bold text-[9px] uppercase tracking-widest whitespace-nowrap transition-all border ${activeCategory === cat ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </header>

        {/* Dense Product Grid */}
        <div className="flex-1 p-6 overflow-y-auto no-scrollbar grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xxl:grid-cols-5 gap-4 content-start">
          {filteredMenu.map(item => (
            <div 
              key={item.id} 
              onClick={() => addToCart(item)}
              className="group bg-white p-4 rounded-[1.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer flex flex-col"
            >
              <div className="flex justify-between items-start mb-4">
                 <div className={`w-2 h-2 rounded-full ${item.isVeg ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                 <div className="px-2 py-0.5 bg-slate-50 rounded text-[8px] font-bold text-slate-400 tracking-widest uppercase">{item.category}</div>
              </div>
              
              <h3 className="text-sm font-bold text-slate-900 leading-tight mb-1 group-hover:text-emerald-600 transition-colors">{item.name}</h3>
              <p className="text-[9px] text-slate-400 font-medium mb-3 line-clamp-1">{item.description}</p>
              
              <div className="pt-3 border-t border-slate-50 flex justify-between items-center">
                <span className="text-sm font-black text-slate-900">₹{item.price}</span>
                <div className="w-8 h-8 bg-slate-50 group-hover:bg-emerald-600 group-hover:text-white rounded-lg flex items-center justify-center transition-all">
                  <Plus size={14} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modern Compact Cart Section */}
      <div className="w-[340px] bg-white border-l border-slate-100 flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-50">
          <div className="flex justify-between items-center mb-1">
             <h2 className="text-lg font-black text-slate-900 tracking-tight">Active Ticket</h2>
             <ShoppingBag size={18} className="text-slate-300" />
          </div>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Customer Selection Draft</p>
        </div>

        {/* Ticket Context (Table or Customer) */}
        <div className="p-6 bg-slate-50/50 border-b border-slate-50">
           {isTakeaway ? (
              <div className="space-y-3">
                 <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-100">
                    <User size={14} className="text-slate-300" />
                    <input 
                      type="text" 
                      placeholder="Guest Name"
                      className="flex-1 outline-none text-[10px] font-bold text-slate-900 placeholder:text-slate-300"
                      value={customerDetails.name}
                      onChange={(e) => setCustomerDetails({...customerDetails, name: e.target.value})}
                    />
                 </div>
                 <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-100">
                    <Phone size={14} className="text-slate-300" />
                    <input 
                      type="tel" 
                      placeholder="Phone (Optional)"
                      className="flex-1 outline-none text-[10px] font-bold text-slate-900 placeholder:text-slate-300"
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
                    className={`aspect-square rounded-xl border flex flex-col items-center justify-center transition-all ${
                      selectedTableId === table.id 
                        ? 'bg-slate-900 border-slate-900 text-white shadow-lg' 
                        : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'
                    }`}
                   >
                     <span className="text-[10px] font-black uppercase tracking-tighter">T{table.tableNumber}</span>
                   </button>
                ))}
              </div>
           )}
        </div>

        {/* Ticket Items Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-200">
               <Receipt size={32} strokeWidth={1.5} />
               <p className="text-[10px] font-bold uppercase tracking-[0.2em] mt-3">Empty Ticket</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex justify-between items-center group">
                 <div className="flex-1 pr-4">
                    <h4 className="font-bold text-slate-900 text-[11px] leading-tight group-hover:text-emerald-600 transition-colors uppercase tracking-tight">{item.name}</h4>
                    <p className="text-[10px] font-bold text-slate-400 mt-1">₹{item.price * item.quantity}</p>
                 </div>
                 <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                    <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 rounded-md text-slate-400 hover:bg-white hover:text-slate-900 transition-all flex items-center justify-center">
                       <Minus size={12} strokeWidth={3} />
                    </button>
                    <span className="text-[10px] font-black text-slate-900 min-w-[12px] text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 rounded-md text-slate-400 hover:bg-white hover:text-slate-900 transition-all flex items-center justify-center">
                       <Plus size={12} strokeWidth={3} />
                    </button>
                 </div>
              </div>
            ))
          )}
        </div>

        {/* Bill Summary */}
        <div className="p-6 bg-white border-t border-slate-100">
           <div className="space-y-2.5 mb-6">
              <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                 <span>Subtotal</span>
                 <span>₹{subtotal}</span>
              </div>
              <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                 <span>GST (5%)</span>
                 <span>₹{gst}</span>
              </div>
              <div className="flex justify-between items-end pt-2">
                 <span className="text-xs font-bold text-slate-900 uppercase tracking-widest">Total Amount</span>
                 <span className="text-2xl font-black text-slate-900 tracking-tighter">₹{total}</span>
              </div>
           </div>

           <button 
             onClick={handlePlaceOrder}
             className="w-full bg-slate-900 hover:bg-black text-white py-4 rounded-[1.5rem] font-bold text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95"
           >
             Confirm & Push
             <ChevronRight size={14} />
           </button>
        </div>
      </div>
    </div>
  );
}
