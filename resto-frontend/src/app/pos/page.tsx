"use client";

import { useEffect, useState, useRef } from "react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { X, Printer, Grid, ShoppingBag, ChevronRight, Search, Plus, Minus, CreditCard, Receipt, Clock } from "lucide-react";

export default function POSPage() {
  const [categories, setCategories] = useState<string[]>([]);
  const [menu, setMenu] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [cart, setCart] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Checkout State
  const [showCheckout, setShowCheckout] = useState(false);
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [splitMethod, setSplitMethod] = useState<'single' | 'split'>('single');
  const [singlePayment, setSinglePayment] = useState('cash');
  const [splitPayments, setSplitPayments] = useState([{ method: 'cash', amount: 0 }, { method: 'card', amount: 0 }]);

  useEffect(() => {
    fetchData();
    window.addEventListener('online', syncOfflineOrders);
    return () => window.removeEventListener('online', syncOfflineOrders);
  }, []);

  const syncOfflineOrders = async () => {
    const offlineOrders = JSON.parse(localStorage.getItem('offlineOrders') || '[]');
    if (offlineOrders.length === 0) return;
    
    toast.loading("Internet recovered: Syncing offline orders...", { id: 'offline-sync' });
    
    for (const order of offlineOrders) {
      try {
        await api.post('/orders', { tableId: order.tableId, items: order.items, notes: 'Synced from offline' });
      } catch (e) {
        console.error("Failed to sync an order", e);
      }
    }
    
    localStorage.removeItem('offlineOrders');
    toast.success("Offline orders synced successfully!", { id: 'offline-sync' });
    fetchData();
  };

  const fetchData = async () => {
    try {
      const [cats, items, tbls, ords] = await Promise.all([
        api.get('/menu/categories'),
        api.get('/menu'),
        api.get('/tables'),
        api.get('/orders')
      ]);
      setCategories(["All", ...cats.data.data]);
      setMenu(items.data.data);
      setTables(tbls.data.data.filter((t: any) => t.status === 'OCCUPIED' || t.status === 'FREE'));
      setOrders(ords.data.data);
    } catch (error) {
      toast.error("Failed to load POS data");
    }
  };

  const filteredMenu = menu.filter(m => {
    const matchesCategory = activeCategory === "All" || m.category === activeCategory;
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addToCart = (item: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.menuItem === item.id);
      if (existing) {
        return prev.map(i => i.menuItem === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { menuItem: item.id, name: item.name, price: item.price, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.menuItem === id) {
        const newQ = item.quantity + delta;
        return newQ > 0 ? { ...item, quantity: newQ } : item;
      }
      return item;
    }).filter(i => i.quantity > 0));
  };

  const placeOrder = async () => {
    if (!selectedTable) return toast.error("Select a table first");
    if (cart.length === 0) return toast.error("Cart is empty");

    if (!navigator.onLine) {
      const offlineOrders = JSON.parse(localStorage.getItem('offlineOrders') || '[]');
      offlineOrders.push({ id: Date.now(), tableId: selectedTable, items: cart });
      localStorage.setItem('offlineOrders', JSON.stringify(offlineOrders));
      setCart([]);
      return toast.success("Offline mode: Order saved locally", { duration: 5000 });
    }

    try {
      const tableObj = tables.find(t => t.id === selectedTable);
      if (tableObj.currentOrderId) {
        await api.post(`/orders/${tableObj.currentOrderId}/add-items`, { items: cart });
      } else {
        await api.post('/orders', { tableId: selectedTable, items: cart });
      }
      toast.success("Order sent to kitchen!");
      setCart([]);
      fetchData(); 
    } catch (error) {
       toast.error("Failed to place order");
    }
  };

  const openCheckout = () => {
    const tableObj = tables.find(t => t.id === selectedTable);
    if (!tableObj || !tableObj.currentOrderId) return toast.error("No active order for this table");

    const orderObj = orders.find(o => o.id === tableObj.currentOrderId);
    if (!orderObj) return toast.error("Could not load order details");

    setActiveOrder(orderObj);
    setSplitPayments([
      { method: 'card', amount: Number((orderObj.totalAmount / 2).toFixed(2)) },
      { method: 'cash', amount: Number((orderObj.totalAmount / 2).toFixed(2)) }
    ]);
    setShowCheckout(true);
  };

  const processPaymentAndPrint = async () => {
    try {
      const payload: any = { paymentMethod: splitMethod === 'single' ? singlePayment : 'split' };
      if (splitMethod === 'split') {
        const totalSplit = splitPayments.reduce((sum, p) => sum + Number(p.amount), 0);
        if (Math.abs(totalSplit - activeOrder.totalAmount) > 0.1) {
           return toast.error("Split amounts must equal total bill");
        }
        payload.splitPayments = splitPayments;
      }

      await api.post(`/orders/${activeOrder.id}/pay`, payload);
      toast.success("Payment successful!");

      window.print();

      setShowCheckout(false);
      setSelectedTable("");
      fetchData();
    } catch (error) {
       toast.error("Failed to process payment");
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const gst = cartTotal * 0.05;
  const grandTotal = cartTotal + gst;

  return (
    <>
      <div className="flex flex-col md:flex-row h-screen bg-slate-50 no-print">
        {/* Left Section: Menu & Products */}
        <div className="flex-1 flex flex-col min-w-0 bg-white md:bg-inherit overflow-hidden">
          {/* Top Bar: Search & Categories */}
          <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 shrink-0">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                   <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Terminal POS</h1>
                   <p className="text-xs text-slate-500 font-medium">Register #01 • Indian Cuisine</p>
                </div>
                <div className="relative w-full md:w-80">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                   <input 
                      type="text"
                      placeholder="Search menu items..."
                      className="w-full h-11 bg-white border border-slate-200 rounded-xl pl-11 pr-4 text-sm font-medium outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 transition-all"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                   />
                </div>
             </div>

             <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {categories.map(c => (
                  <button 
                    key={c} 
                    onClick={() => setActiveCategory(c)}
                    className={`px-6 py-2.5 rounded-xl font-bold text-[11px] uppercase tracking-wider whitespace-nowrap transition-all ${
                      activeCategory === c 
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' 
                        : 'bg-white text-slate-500 border border-slate-200 hover:border-emerald-500/30'
                    }`}
                  >
                    {c}
                  </button>
                ))}
             </div>
          </div>

          {/* Menu Grid */}
          <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-32 md:pb-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5 content-start no-scrollbar">
            {filteredMenu.map(item => (
              <div 
                key={item.id} 
                onClick={() => addToCart(item)}
                className="group bg-white p-4 md:p-5 rounded-2xl border border-slate-100 shadow-sm cursor-pointer active:scale-[0.98] transition-all hover:shadow-xl hover:border-emerald-500/20 flex flex-col relative overflow-hidden"
              >
                <div className="flex justify-between items-start mb-3">
                   <div className={`w-2 h-2 rounded-full ${item.isVeg ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                   <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase">
                      <Clock size={10} />
                      {item.prepTime}m
                   </div>
                </div>
                
                <h3 className="font-bold text-slate-900 leading-tight mb-1 text-sm tracking-tight">{item.name}</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-4">{item.category}</p>
                
                <div className="mt-auto flex items-center justify-between pt-2">
                   <span className="font-bold text-emerald-600 text-base">₹{item.price}</span>
                   <div className="w-7 h-7 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <Plus size={14} />
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Section: Order Cart */}
        <div className="hidden md:flex flex-col w-[380px] lg:w-[420px] bg-white border-l border-slate-100 shadow-sm shrink-0">
          <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Active Order</h2>
                {selectedTable && (
                   <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                     Table {tables.find(t => t.id === selectedTable)?.tableNumber}
                   </div>
                )}
            </div>

            <select 
              className="w-full h-12 bg-slate-50 border border-slate-100 text-slate-700 rounded-xl px-4 font-bold text-xs uppercase tracking-wider outline-none focus:border-emerald-500/30 transition-all appearance-none cursor-pointer"
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
            >
              <option value="" disabled>SELECT TABLE</option>
              {tables.map(t => (
                <option key={t.id} value={t.id}>
                  T{t.tableNumber} — {t.currentOrderId ? 'SERVICE' : 'FREE'}
                </option>
              ))}
            </select>

            {selectedTable && tables.find(t => t.id === selectedTable)?.currentOrderId && (
               <button onClick={openCheckout} className="w-full py-3 bg-slate-900 hover:bg-black text-white rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 uppercase tracking-widest shadow-lg">
                  <CreditCard size={14} />
                  Settle Bill
               </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-6 space-y-4 no-scrollbar">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4 opacity-40">
                 <ShoppingBag size={48} strokeWidth={1.5} />
                 <p className="font-bold text-[10px] uppercase tracking-[0.2em]">Add products to start</p>
              </div>
            ) : (
              cart.map((item, idx) => (
                <div key={`${item.menuItem}-${idx}`} className="flex items-center gap-4 bg-slate-50 border border-slate-100 rounded-2xl p-4 animate-slide-up">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 text-sm truncate">{item.name}</p>
                    <p className="text-xs font-bold text-emerald-600">₹{item.price}</p>
                  </div>
                  <div className="flex items-center gap-2 bg-white rounded-lg p-1 border border-slate-100">
                    <button onClick={() => updateQuantity(item.menuItem, -1)} className="w-7 h-7 flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 rounded transition-colors"><Minus size={12} /></button>
                    <span className="font-bold text-xs w-4 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.menuItem, 1)} className="w-7 h-7 flex items-center justify-center hover:bg-emerald-50 hover:text-emerald-500 rounded transition-colors"><Plus size={12} /></button>
                  </div>
                </div>
              ))
            )}
          </div>

          {cart.length > 0 && (
            <div className="p-8 border-t border-slate-50 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-slate-400 text-xs font-bold px-1">
                  <span>SUBTOTAL</span>
                  <span className="text-slate-900">₹{cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400 text-xs font-bold px-1">
                  <span>TAX (5%)</span>
                  <span className="text-slate-900">₹{gst.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="flex justify-between items-end pt-2 pb-4 px-1">
                <div>
                   <span className="text-slate-400 font-bold uppercase text-[9px] tracking-widest block mb-0.5">Total Amount</span>
                   <span className="text-4xl font-bold text-slate-900 tracking-tight">₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <button 
                onClick={placeOrder}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
              >
                Send to Kitchen
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Drawer (Simplied for Mobile View) */}
      <div className="md:hidden fixed bottom-16 left-0 right-0 p-4 no-print bg-white border-t border-slate-100 z-50">
         {cart.length > 0 ? (
            <div className="flex items-center justify-between">
               <div>
                  <p className="text-[10px] font-bold text-slate-400">ORDER TOTAL</p>
                  <p className="text-xl font-bold text-slate-900">₹{grandTotal.toFixed(2)}</p>
               </div>
               <button onClick={placeOrder} className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-widest">
                  Process Order
               </button>
            </div>
         ) : (
            <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest py-2">Select items to begin</p>
         )}
      </div>

      {/* Checkout Modal */}
      {showCheckout && activeOrder && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 md:p-10 z-[100] animate-fade-in backdrop-blur-md no-print">
          <div className="bg-white rounded-[2rem] w-full max-w-5xl shadow-2xl flex flex-col md:flex-row overflow-hidden max-h-[90vh] border border-slate-200">
            
            {/* Left: Summary */}
            <div className="md:w-1/2 p-8 lg:p-12 bg-slate-50/50 border-r border-slate-100 flex flex-col overflow-y-auto">
              <div className="mb-8">
                 <h3 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                    <Receipt size={24} className="text-emerald-600" />
                    Review Statement
                 </h3>
                 <p className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-widest">ORDER #{activeOrder.orderNumber}</p>
              </div>

              <div className="flex-1 space-y-4">
                 {activeOrder.items.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-100">
                      <div>
                        <span className="font-bold text-sm text-slate-900 block">{item.name}</span>
                        <span className="text-[10px] font-bold text-slate-400">₹{item.price} x {item.quantity}</span>
                      </div>
                      <span className="font-bold text-sm text-slate-900">₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                 ))}
              </div>

              <div className="mt-8 pt-8 border-t border-slate-100 space-y-3">
                <div className="flex justify-between text-slate-400 font-bold text-[11px] uppercase tracking-widest px-1"><span>Net Total</span><span>₹{activeOrder.subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-slate-400 font-bold text-[11px] uppercase tracking-widest px-1"><span>Tax (5.0%)</span><span>₹{activeOrder.gstAmount.toFixed(2)}</span></div>
                <div className="flex justify-between items-end pt-4 px-1">
                   <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Amount Due</span>
                   <span className="text-4xl font-bold text-slate-900 tracking-tight">₹{activeOrder.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Right: Payment */}
            <div className="md:w-1/2 p-8 lg:p-12 flex flex-col relative bg-white overflow-y-auto">
              <button onClick={() => setShowCheckout(false)} className="absolute top-6 right-6 p-3 text-slate-400 transition-all"><X size={20} /></button>
              
              <div className="mb-8">
                 <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Settle Transaction</h3>
                 <p className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-widest">Select payment configuration</p>
              </div>
              
              <div className="flex bg-slate-50 p-1.5 rounded-xl mb-8 border border-slate-100">
                <button 
                  onClick={() => setSplitMethod('single')} 
                  className={`flex-1 py-3 font-bold transition-all rounded-lg text-[10px] uppercase tracking-widest ${
                    splitMethod === 'single' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'
                  }`}
                >
                  Regular Pay
                </button>
                <button 
                  onClick={() => setSplitMethod('split')} 
                  className={`flex-1 py-3 font-bold transition-all rounded-lg text-[10px] uppercase tracking-widest ${
                    splitMethod === 'split' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'
                  }`}
                >
                  Split Group
                </button>
              </div>

              {splitMethod === 'single' ? (
                <div className="grid grid-cols-1 gap-4 flex-1">
                   {['cash', 'card', 'upi'].map(m => (
                     <button 
                      key={m} 
                      onClick={() => setSinglePayment(m)} 
                      className={`h-16 px-6 flex items-center justify-between rounded-xl font-bold uppercase tracking-widest border-2 transition-all ${
                        singlePayment === m 
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-700' 
                          : 'border-slate-50 text-slate-400 hover:border-slate-200'
                      }`}
                     >
                       <span className="text-[11px]">{m}</span>
                       <div className={`w-3 h-3 rounded-full border-2 ${singlePayment === m ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'}`}></div>
                     </button>
                   ))}
                </div>
              ) : (
                <div className="space-y-4 flex-1">
                  {splitPayments.map((p, index) => (
                    <div key={index} className="flex gap-3 animate-slide-up">
                      <select 
                        value={p.method}
                        onChange={(e) => {
                           const newSplit = [...splitPayments];
                           newSplit[index].method = e.target.value;
                           setSplitPayments(newSplit);
                        }}
                        className="w-1/3 bg-slate-50 border border-slate-100 rounded-xl px-4 outline-none font-bold text-[10px] uppercase tracking-wider"
                      >
                        <option value="cash">CASH</option>
                        <option value="card">CARD</option>
                        <option value="upi">UPI</option>
                      </select>
                      <input 
                        type="number" 
                        value={p.amount} 
                        onChange={(e) => {
                           const newSplit = [...splitPayments];
                           newSplit[index].amount = Number(e.target.value);
                           setSplitPayments(newSplit);
                        }}
                        className="flex-1 h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 outline-none font-bold text-sm"
                        placeholder="Amount"
                      />
                    </div>
                  ))}
                </div>
              )}

              <button 
                onClick={processPaymentAndPrint}
                className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-3 mt-10"
              >
                <Printer size={16} />
                Confirm & Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 80mm Print Receipt */}
      {showCheckout && activeOrder && (
        <div className="hidden print-only text-black mx-auto p-4 bg-white" style={{ width: '80mm' }}>
           <div className="text-center mb-4 pb-4 border-b border-black">
              <h1 className="text-lg font-bold">RESTOPRO INDIAN</h1>
              <p className="text-[10px]">Quality Restaurant Management</p>
           </div>
           <div className="text-[10px] mb-4 space-y-1">
              <div className="flex justify-between"><span>ORDER:</span> <span>{activeOrder.orderNumber}</span></div>
              <div className="flex justify-between"><span>TABLE:</span> <span>T{activeOrder.tableNumber}</span></div>
              <div className="flex justify-between"><span>DATE:</span> <span>{new Date().toLocaleString()}</span></div>
           </div>
           <div className="border-b border-black mb-4">
              <table className="w-full text-[10px]">
                <thead><tr className="border-b border-black text-left"><th className="py-1">ITEM</th><th className="py-1 text-center">QTY</th><th className="py-1 text-right">AMT</th></tr></thead>
                <tbody>
                  {activeOrder.items.map((item: any, i: number) => (
                    <tr key={i}><td className="py-1">{item.name}</td><td className="py-1 text-center">{item.quantity}</td><td className="py-1 text-right">{item.price * item.quantity}</td></tr>
                  ))}
                </tbody>
              </table>
           </div>
           <div className="text-[10px] space-y-1 font-bold">
              <div className="flex justify-between"><span>NET TOTAL:</span> <span>{activeOrder.subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>GST (5%):</span> <span>{activeOrder.gstAmount.toFixed(2)}</span></div>
              <div className="flex justify-between text-base mt-2 pt-2 border-t border-black"><span>TOTAL:</span> <span>₹{activeOrder.totalAmount.toFixed(2)}</span></div>
           </div>
           <div className="mt-8 text-center text-[10px]">
              <p>Thank you! Visit again.</p>
           </div>
        </div>
      )}
    </>
  );
}
