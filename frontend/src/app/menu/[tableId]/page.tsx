"use client";

import { useEffect, useState, use } from "react";
import api from "@/lib/api";
import toast from "react-hot-toast";

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
    toast.success(`Added ${item.name}`);
  };

  const placeOrder = async () => {
    if (cart.length === 0) return toast.error("Cart is empty");

    try {
      if (tableInfo.currentOrder) {
        await api.post(`/orders/${tableInfo.currentOrder.id}/add-items`, { items: cart });
      } else {
        await api.post('/orders', { tableId: tableId, items: cart });
      }
      toast.success("Order sent to kitchen!");
      setCart([]);
      fetchData(); // refresh table info
    } catch (error) {
       toast.error("Failed to place order");
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading Menu...</div>;

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="bg-gray-50 min-h-screen pb-32 font-sans">
      <div className="bg-white p-6 shadow-sm sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-gray-900">RestoPro Menu</h1>
        <p className="text-gray-500 mt-1">Table {tableInfo?.tableNumber}</p>
        
        <div className="flex gap-3 overflow-x-auto mt-4 pb-2 no-scrollbar">
          {categories.map(c => (
            <button 
              key={c} 
              onClick={() => setActiveCategory(c)}
              className={`px-5 py-2 rounded-full font-medium whitespace-nowrap transition-colors border ${activeCategory === c ? 'bg-[#FF6B35] text-white border-transparent' : 'bg-white text-gray-600 border-gray-200'}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {filteredMenu.map(item => (
          <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                 <div className={`w-3 h-3 rounded-full ${item.isVeg ? 'bg-green-500' : 'bg-red-500'}`}></div>
                 <h3 className="font-bold text-gray-900">{item.name}</h3>
              </div>
              <p className="text-sm text-gray-500 mt-1">{item.description}</p>
              <p className="font-bold text-[#FF6B35] mt-2">₹{item.price}</p>
            </div>
            <div className="flex items-end shrink-0">
               <button onClick={() => addToCart(item)} className="bg-[#FF6B35]/10 text-[#FF6B35] font-bold px-4 py-2 rounded-xl border border-[#FF6B35]/20 active:bg-[#FF6B35]/20 transition-colors">
                 ADD
               </button>
            </div>
          </div>
        ))}
      </div>

      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] p-4 flex items-center justify-between z-20 pb-safe">
          <div>
            <p className="text-sm text-gray-500 font-medium">{cart.reduce((Acc, i) => Acc + i.quantity, 0)} Items</p>
            <p className="text-xl font-bold text-gray-900">₹{cartTotal}</p>
          </div>
          <button onClick={placeOrder} className="bg-[#1F2937] text-white px-8 py-3 rounded-xl font-bold shadow-lg">
            Place Order
          </button>
        </div>
      )}
    </div>
  );
}
