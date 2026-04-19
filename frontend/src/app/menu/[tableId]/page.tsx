"use client";

import { useEffect, useState, use } from "react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { ShoppingBag, Star, ChevronRight, Check, Plus } from "lucide-react";

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
      toast.error("Network synchronization error");
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
      toast.success("Ticket sent to kitchen!", { position: 'bottom-center' });
      setCart([]);
      fetchData(); 
    } catch (error) {
       toast.error("Failed to process request");
    }
  };

  if (loading) return (
    <div className="p-20 flex flex-col items-center justify-center min-h-screen bg-white">
       <div className="w-8 h-8 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
    </div>
  );

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="bg-slate-50 min-h-screen pb-32 font-sans animate-slide-up no-scrollbar">
      {/* Branding Header */}
      <div className="bg-white px-6 py-10 rounded-b-[2.5rem] shadow-sm sticky top-0 z-10 border-b border-slate-100">
        <div className="flex justify-between items-start">
           <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">RestoPro <span className="text-emerald-600">Indian</span></h1>
              <div className="flex items-center gap-2 mt-2">
                 <div className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    Table {tableInfo?.tableNumber}
                 </div>
                 <div className="flex items-center gap-1 text-slate-400 text-xs font-medium">
                    <Star size={12} className="text-amber-400 fill-amber-400" />
                    4.9 (500+ Reviews)
                 </div>
              </div>
           </div>
           <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300">
              <ShoppingBag size={24} />
           </div>
        </div>
        
        <div className="flex gap-2.5 overflow-x-auto mt-8 pb-1 no-scrollbar">
          {categories.map(c => (
            <button 
              key={c} 
              onClick={() => setActiveCategory(c)}
              className={`px-6 py-2.5 rounded-xl font-bold text-[11px] uppercase tracking-wider whitespace-nowrap transition-all ${activeCategory === c ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 shadow-lg' : 'bg-slate-50 text-slate-400 hover:text-slate-600'}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Menu List */}
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between mb-4">
           <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{activeCategory} Selection</h2>
           <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">{filteredMenu.length} Options</span>
        </div>
        
        {filteredMenu.map(item => (
          <div key={item.id} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-50 flex gap-5 transition-all active:scale-[0.98]">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                 <div className={`w-2.5 h-2.5 rounded-full ${item.isVeg ? 'bg-emerald-500' : 'bg-rose-500'} ring-4 ring-white shadow-sm`}></div>
                 <h3 className="font-bold text-slate-900 text-base lg:text-lg truncate">{item.name}</h3>
              </div>
              <p className="text-xs text-slate-400 font-medium line-clamp-2 mt-1">{item.description || 'Authentic spices and ingredients.'}</p>
              <p className="font-bold text-slate-900 mt-4 text-base">₹{item.price}</p>
            </div>
            <div className="flex items-end shrink-0">
               <button 
                onClick={() => addToCart(item)} 
                className="w-12 h-12 bg-white text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-2xl border border-emerald-100 flex items-center justify-center transition-all shadow-sm"
               >
                 <Plus size={18} strokeWidth={3} />
               </button>
            </div>
          </div>
        ))}
      </div>

      {/* Cart Drawer */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 left-6 right-6 lg:left-auto lg:right-6 lg:w-96 bg-slate-900 text-white rounded-[2rem] shadow-2xl p-6 flex items-center justify-between z-50 animate-slide-up border border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center font-bold text-sm">
               {cart.reduce((Acc, i) => Acc + i.quantity, 0)}
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Basket Total</p>
              <p className="text-xl font-bold text-white tracking-tight">₹{cartTotal}</p>
            </div>
          </div>
          <button 
            onClick={placeOrder} 
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3.5 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
          >
            Review
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
