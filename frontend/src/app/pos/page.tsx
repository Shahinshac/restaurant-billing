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
  AlertCircle
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
        toast.success(`Increased ${item.name} quantity`, { duration: 1000, position: 'bottom-center' });
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      toast.success(`Added ${item.name} to ticket`, { duration: 1000, position: 'bottom-center' });
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
    if (cart.length === 0) return toast.error("Your ticket is currently empty");
    if (!isTakeaway && !selectedTableId) return toast.error("Please assign a table for this order");
    if (isTakeaway && !customerDetails.name) return toast.error("Guest name is required for takeaway");

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
        <div className="bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in">
          <CheckCircle2 className="text-emerald-400" />
          <div className="flex flex-col">
            <span className="font-bold text-sm">Order Synchronized</span>
            <span className="text-[11px] text-slate-400">Sent to Kitchen KDS successfully</span>
          </div>
        </div>
      ));
      setCart([]);
      setSelectedTableId(null);
      setCustomerDetails({ name: '', phone: '' });
      fetchInitialData();
    } catch (error) {
      toast.error("Network disruption: Failed to sync order");
    }
  };

  if (loading) return (
    <div className="p-12 flex flex-col items-center justify-center min-h-screen bg-slate-50">
      <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin mb-6"></div>
      <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.3em]">Initializing POS Terminal...</p>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#f1f5f9] overflow-hidden animate-in">
      {/* Product Discovery Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top bar with contextual info and actions */}
        <header className="px-8 py-6 bg-white border-b border-slate-200">
          <div className="flex justify-between items-center mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">POS Terminal • Online</p>
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Product Register</h1>
            </div>

            <div className="flex items-center gap-4">
               {/* Mode Switcher */}
               <div className="bg-slate-100 p-1.5 rounded-2xl flex">
                  <button 
                    onClick={() => setIsTakeaway(false)}
                    className={`flex items-center gap-2 px-6 py-2 rounded-[var(--radius-md)] text-xs font-bold transition-all ${!isTakeaway ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Dine-In
                  </button>
                  <button 
                    onClick={() => setIsTakeaway(true)}
                    className={`flex items-center gap-2 px-6 py-2 rounded-[var(--radius-md)] text-xs font-bold transition-all ${isTakeaway ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Takeaway
                  </button>
               </div>

               {/* Discovery Search */}
               <div className="relative group">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-emerald-600" size={16} />
                 <input 
                   type="text" 
                   placeholder="Discover products..." 
                   className="pl-12 pr-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-emerald-500/30 focus:ring-[6px] focus:ring-emerald-500/5 transition-all text-sm font-medium w-64 xl:w-80"
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                 />
               </div>
            </div>
          </div>

          {/* Filtering System */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold pr-4 border-r border-slate-100">
               <Filter size={14} />
               <span>FILTER</span>
            </div>
            <div className="flex gap-2 flex-1 overflow-x-auto no-scrollbar">
              {categories.map(cat => (
                <button 
                  key={cat} 
                  onClick={() => setActiveCategory(cat)}
                  className={`px-5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeCategory === cat ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-transparent'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Dynamic Items Grid */}
        <div className="flex-1 p-8 overflow-y-auto modern-scrollbar grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xxl:grid-cols-5 gap-6 content-start">
          {filteredMenu.map(item => (
            <div 
              key={item.id} 
              onClick={() => addToCart(item)}
              className="premium-card group p-5 cursor-pointer flex flex-col hover:-translate-y-2"
            >
              <div className="relative aspect-square mb-5 bg-slate-50 rounded-2xl overflow-hidden flex items-center justify-center">
                 {/* Item visual placeholder with category icon based text */}
                 <div className="text-4xl filter grayscale group-hover:grayscale-0 transition-all duration-500 transform group-hover:scale-110">
                    {item.category.includes('Drink') ? '🥤' : item.category.includes('Burger') ? '🍔' : item.category.includes('Pizza') ? '🍕' : item.category.includes('Dessert') ? '🍰' : '🍲'}
                 </div>
                 <div className={`absolute top-3 left-3 w-3 h-3 rounded-full border-2 border-white shadow-sm ${item.isVeg ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
              </div>
              
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                   <h3 className="text-sm font-bold text-slate-900 leading-snug group-hover:text-emerald-600 transition-colors line-clamp-2">{item.name}</h3>
                </div>
                <p className="text-[11px] text-slate-400 font-medium mb-4 line-clamp-2 leading-relaxed">{item.description || 'No description provided for this item.'}</p>
              </div>
              
              <div className="pt-4 border-t border-slate-50 flex justify-between items-center mt-auto">
                <span className="text-base font-black text-slate-900 tracking-tight">₹{item.price}</span>
                <div className="w-10 h-10 bg-slate-50 group-hover:bg-emerald-600 group-hover:text-white rounded-xl flex items-center justify-center transition-all shadow-sm group-hover:shadow-emerald-200">
                  <Plus size={18} strokeWidth={2.5} />
                </div>
              </div>
            </div>
          ))}
          {filteredMenu.length === 0 && (
             <div className="col-span-full py-32 flex flex-col items-center justify-center text-slate-400">
                <AlertCircle size={48} strokeWidth={1.5} className="mb-4 text-slate-200" />
                <p className="text-sm font-bold uppercase tracking-widest text-slate-300">No products match your search</p>
             </div>
          )}
        </div>
      </div>

      {/* Execution Panel (Cart) */}
      <div className="w-[380px] bg-white border-l border-slate-200 flex flex-col shrink-0">
        <div className="p-8 border-b border-slate-50">
          <div className="flex justify-between items-center mb-1">
             <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
               Active Ticket
               {cart.length > 0 && <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 text-[10px] flex items-center justify-center transform scale-90">{cart.length}</span>}
             </h2>
             <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
               <Receipt size={20} />
             </div>
          </div>
          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">Execution Draft Queue</p>
        </div>

        {/* Customer / Table Assignment */}
        <div className="px-8 py-6 bg-slate-50/50 border-b border-slate-100">
           {isTakeaway ? (
              <div className="space-y-3">
                 <div className="group flex items-center gap-3 bg-white p-4 rounded-2xl border border-slate-100 focus-within:border-emerald-500/20 focus-within:ring-[6px] focus-within:ring-emerald-500/5 transition-all">
                    <User size={16} className="text-slate-300 group-focus-within:text-emerald-500" />
                    <input 
                      type="text" 
                      placeholder="Guest Name"
                      className="flex-1 outline-none text-xs font-bold text-slate-900 placeholder:text-slate-300 bg-transparent"
                      value={customerDetails.name}
                      onChange={(e) => setCustomerDetails({...customerDetails, name: e.target.value})}
                    />
                 </div>
                 <div className="group flex items-center gap-3 bg-white p-4 rounded-2xl border border-slate-100 focus-within:border-emerald-500/20 focus-within:ring-[6px] focus-within:ring-emerald-500/5 transition-all">
                    <Phone size={16} className="text-slate-300 group-focus-within:text-emerald-500" />
                    <input 
                      type="tel" 
                      placeholder="Contact Number (Optional)"
                      className="flex-1 outline-none text-xs font-bold text-slate-900 placeholder:text-slate-300 bg-transparent"
                      value={customerDetails.phone}
                      onChange={(e) => setCustomerDetails({...customerDetails, phone: e.target.value})}
                    />
                 </div>
              </div>
           ) : (
              <div className="grid grid-cols-5 gap-3">
                {tables.map(table => {
                   const isOccupied = table.status === 'OCCUPIED' || table.status === 'RESERVED';
                   return (
                     <button 
                      key={table.id}
                      onClick={() => setSelectedTableId(table.id)}
                      className={`relative aspect-square rounded-xl border-2 flex flex-col items-center justify-center transition-all ${
                        selectedTableId === table.id 
                          ? 'bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-200' 
                          : isOccupied
                            ? 'bg-rose-50 border-rose-100 text-rose-600'
                            : 'bg-white border-transparent text-slate-400 hover:border-slate-200 hover:text-slate-600'
                      }`}
                     >
                       <span className="text-[11px] font-black tracking-tight">{table.tableNumber}</span>
                       <div className={`absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full ${isOccupied ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                     </button>
                   );
                })}
              </div>
           )}
        </div>

        {/* Live Ticket Display */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 modern-scrollbar">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-200 py-12">
               <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                <ShoppingBag size={40} strokeWidth={1} />
               </div>
               <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-300">Ticket is empty</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex justify-between items-center group animate-in">
                 <div className="flex-1 pr-6 flex items-start gap-3">
                    <div className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs leading-tight uppercase tracking-tight group-hover:text-emerald-600 transition-colors">{item.name}</h4>
                      <p className="text-[11px] font-bold text-slate-400 mt-1">₹{item.price}</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 rounded-lg bg-white text-slate-400 hover:text-rose-600 shadow-sm flex items-center justify-center transition-all">
                       <Minus size={14} strokeWidth={3} />
                    </button>
                    <span className="text-xs font-black text-slate-900 min-w-[12px] text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 rounded-lg bg-white text-slate-400 hover:text-emerald-600 shadow-sm flex items-center justify-center transition-all">
                       <Plus size={14} strokeWidth={3} />
                    </button>
                 </div>
              </div>
            ))
          )}
        </div>

        {/* Financial Overview & Submission */}
        <div className="p-8 bg-white border-t border-slate-100 shadow-[0_-10px_30px_rgba(0,0,0,0.02)]">
           <div className="space-y-2.5 mb-8">
              <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
                 <span>Subtotal</span>
                 <span className="text-slate-900">₹{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
                 <span>Tax (GST 5%)</span>
                 <span className="text-slate-900">₹{gst.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-end pt-4">
                 <span className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">Total Pay</span>
                 <span className="text-3xl font-black text-slate-900 tracking-tighter">₹{total.toLocaleString()}</span>
              </div>
           </div>

           <button 
             onClick={handlePlaceOrder}
             disabled={cart.length === 0}
             className="w-full bg-slate-900 hover:bg-black disabled:bg-slate-200 text-white py-5 rounded-2xl font-bold text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-2xl active:scale-[0.98]"
           >
             Initialize Production
             <ArrowRight size={16} />
           </button>
        </div>
      </div>
    </div>
  );
}
