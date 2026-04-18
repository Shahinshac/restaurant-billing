"use client";

import { useEffect, useState, useRef } from "react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { X, Printer } from "lucide-react";

export default function POSPage() {
  const [categories, setCategories] = useState<string[]>([]);
  const [menu, setMenu] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [cart, setCart] = useState<any[]>([]);

  // Checkout State
  const [showCheckout, setShowCheckout] = useState(false);
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [splitMethod, setSplitMethod] = useState<'single' | 'split'>('single');
  const [singlePayment, setSinglePayment] = useState('cash');
  const [splitPayments, setSplitPayments] = useState([{ method: 'cash', amount: 0 }, { method: 'card', amount: 0 }]);

  const printRef = useRef<HTMLDivElement>(null);

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
      setTables(tbls.data.data.filter((t: any) => t.status === 'occupied' || t.status === 'free'));
      setOrders(ords.data.data);
    } catch (error) {
      toast.error("Failed to load POS data");
    }
  };

  const filteredMenu = activeCategory === "All" ? menu : menu.filter(m => m.category === activeCategory);

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
      return toast.success("You are offline. Order saved locally and will sync when internet returns.", { duration: 5000 });
    }

    try {
      const tableObj = tables.find(t => t.id === selectedTable);
      if (tableObj.currentOrder) {
        await api.post(`/orders/${tableObj.currentOrder}/add-items` || `/orders/${tableObj.currentOrder.id}/add-items`, { items: cart });
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
    if (!tableObj || !tableObj.currentOrder) return toast.error("No active order for this table");

    // find the full order object from orders state
    const orderObj = orders.find(o => o.id === tableObj.currentOrder || o.id === tableObj.currentOrder.id);
    if (!orderObj) return toast.error("Could not load order details");

    setActiveOrder(orderObj);
    // prefill half-half just as an example default for split
    setSplitPayments([
      { method: 'card', amount: Number((orderObj.total / 2).toFixed(2)) },
      { method: 'cash', amount: Number((orderObj.total / 2).toFixed(2)) }
    ]);
    setShowCheckout(true);
  };

  const processPaymentAndPrint = async () => {
    try {
      const payload: any = { paymentMethod: splitMethod === 'single' ? singlePayment : 'split' };
      if (splitMethod === 'split') {
        const totalSplit = splitPayments.reduce((sum, p) => sum + Number(p.amount), 0);
        if (Math.abs(totalSplit - activeOrder.total) > 0.1) {
           return toast.error("Split amounts must equal total bill");
        }
        payload.splitPayments = splitPayments;
      }

      await api.post(`/orders/${activeOrder.id}/pay`, payload);
      toast.success("Payment successful!");

      // Print Receipt
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
      <div className="flex h-full animate-fade-in bg-[var(--surface)] no-print">
        <div className="flex-1 flex flex-col overflow-hidden pt-4 pb-20 md:pb-4 px-4 md:px-6 z-0">
          <div className="flex gap-3 overflow-x-auto pb-4 shrink-0 no-scrollbar">
            {categories.map(c => (
              <button 
                key={c} 
                onClick={() => setActiveCategory(c)}
                className={`px-5 py-2.5 rounded-full font-medium whitespace-nowrap transition-colors border ${activeCategory === c ? 'bg-[#1F2937] text-white border-transparent' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 content-start pb-4 pr-2">
            {filteredMenu.map(item => (
              <div 
                key={item.id} 
                onClick={() => addToCart(item)}
                className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 cursor-pointer active:scale-95 transition-transform hover:border-[#FF6B35]/30 hover:shadow-md flex flex-col h-full"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className={`w-3 h-3 rounded-full mt-1 shrink-0 ${item.isVeg ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="font-bold text-[#FF6B35]">₹{item.price}</span>
                </div>
                <h3 className="font-semibold text-gray-900 leading-tight mb-2 flex-grow">{item.name}</h3>
                <p className="text-xs text-gray-500 truncate overflow-hidden">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="hidden md:flex flex-col w-[400px] bg-white border-l border-gray-200 shadow-xl z-10 shrink-0">
          <div className="p-5 border-b border-gray-100 flex flex-col gap-3">
            <h2 className="text-2xl font-bold text-gray-900">Order Management</h2>
            <select 
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 font-medium outline-none focus:ring-2 focus:ring-[#FF6B35]/50 focus:border-[#FF6B35]"
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
            >
              <option value="" disabled>Select Table</option>
              {tables.map(t => (
                <option key={t.id} value={t.id} className="font-medium">
                  Table {t.tableNumber} {t.currentOrder ? '• Active Order' : '• Free'}
                </option>
              ))}
            </select>
            {selectedTable && tables.find(t => t.id === selectedTable)?.currentOrder && (
               <button onClick={openCheckout} className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl transition-colors">
                  Checkout Table
               </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50/50">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <p>Tap items to add new orders for table</p>
              </div>
            ) : (
              cart.map((item, idx) => (
                <div key={`${item.menuItem}-${idx}`} className="flex items-center justify-between group bg-white border rounded-xl p-3">
                  <div className="flex-1 pr-4">
                    <p className="font-semibold text-gray-900 text-sm">{item.name}</p>
                    <p className="text-xs text-gray-500">₹{item.price}</p>
                  </div>
                  <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1 border">
                    <button onClick={() => updateQuantity(item.menuItem, -1)} className="w-8 h-8 flex items-center justify-center bg-white rounded shadow-sm text-gray-600 hover:text-black font-bold border border-gray-100">-</button>
                    <span className="font-bold text-sm w-4 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.menuItem, 1)} className="w-8 h-8 flex items-center justify-center bg-white rounded shadow-sm text-[#FF6B35] font-bold border border-gray-100">+</button>
                  </div>
                </div>
              ))
            )}
          </div>

          {cart.length > 0 && (
            <div className="p-5 border-t border-gray-200 bg-white">
              <div className="flex justify-between mb-2 text-gray-600 text-sm font-medium">
                <span>New Subtotal</span>
                <span>₹{cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-4 text-gray-600 text-sm font-medium">
                <span>Tax (5%)</span>
                <span>₹{gst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-6 text-2xl font-black text-gray-900">
                <span>Total Additions</span>
                <span className="text-[#FF6B35]">₹{grandTotal.toFixed(2)}</span>
              </div>
              <button 
                onClick={placeOrder}
                className="w-full bg-[#1F2937] hover:bg-black text-white py-4 rounded-xl font-bold text-lg shadow-[0_4px_14px_0_rgba(0,0,0,0.1)] transition-all flex items-center justify-center gap-2"
              >
                Send to Kitchen
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckout && activeOrder && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[100] animate-fade-in backdrop-blur-sm no-print">
          <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl flex overflow-hidden max-h-[90vh]">
            
            {/* Left: Bill Details */}
            <div className="w-1/2 p-8 bg-gray-50 border-r border-gray-200 flex flex-col">
              <h3 className="text-2xl font-bold mb-6">Bill Summary</h3>
              <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                 {activeOrder.items.map((item: any, i: number) => (
                   <div key={i} className="flex justify-between border-b border-gray-200 border-dashed pb-2">
                     <div>
                       <span className="font-semibold text-gray-800">{item.quantity}x {item.name}</span>
                     </div>
                     <span className="font-medium text-gray-600">₹{(item.price * item.quantity).toFixed(2)}</span>
                   </div>
                 ))}
              </div>
              <div className="mt-6 pt-4 border-t border-gray-300 space-y-2">
                <div className="flex justify-between text-gray-600 font-medium"><span>Subtotal</span><span>₹{activeOrder.subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-gray-600 font-medium"><span>GST (5%)</span><span>₹{activeOrder.gstAmount.toFixed(2)}</span></div>
                <div className="flex justify-between text-3xl font-black text-gray-900 mt-4 pt-2 border-t"><span>Total</span><span>₹{activeOrder.total.toFixed(2)}</span></div>
              </div>
            </div>

            {/* Right: Payment Method & Split */}
            <div className="w-1/2 p-8 flex flex-col relative text-gray-900">
              <button onClick={() => setShowCheckout(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 bg-gray-50 rounded-full p-2">
                <X size={20} />
              </button>
              
              <h3 className="text-2xl font-bold mb-6">Payment</h3>
              
              <div className="flex gap-2 p-1 bg-gray-100 rounded-xl mb-6">
                <button onClick={() => setSplitMethod('single')} className={`flex-1 py-2 font-bold rounded-lg transition-all ${splitMethod === 'single' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-gray-700'}`}>Single Payment</button>
                <button onClick={() => setSplitMethod('split')} className={`flex-1 py-2 font-bold rounded-lg transition-all ${splitMethod === 'split' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-gray-700'}`}>Split Bill</button>
              </div>

              {splitMethod === 'single' ? (
                <div className="grid grid-cols-3 gap-4 mb-auto text-black">
                   {['cash', 'card', 'upi'].map(m => (
                     <button key={m} onClick={() => setSinglePayment(m)} className={`p-4 rounded-xl font-bold capitalize border-2 transition-all ${singlePayment === m ? 'border-[#FF6B35] bg-[#FF6B35]/5 text-[#FF6B35]' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                       {m}
                     </button>
                   ))}
                </div>
              ) : (
                <div className="space-y-4 mb-auto">
                  {splitPayments.map((p, index) => (
                    <div key={index} className="flex gap-4 items-end">
                      <div className="flex-1">
                        <label className="block text-xs font-bold text-gray-500 px-1 mb-1">Method {index + 1}</label>
                        <select 
                          value={p.method}
                          onChange={(e) => {
                             const newSplit = [...splitPayments];
                             newSplit[index].method = e.target.value;
                             setSplitPayments(newSplit);
                          }}
                          className="w-full border-gray-300 rounded-xl p-3 border focus:ring-2 outline-none font-medium capitalize"
                        >
                          <option value="cash">Cash</option>
                          <option value="card">Card</option>
                          <option value="upi">UPI</option>
                        </select>
                      </div>
                      <div className="flex-1 text-black">
                        <label className="block text-xs font-bold text-gray-500 px-1 mb-1">Amount (₹)</label>
                        <input 
                          type="number" 
                          value={p.amount} 
                          onChange={(e) => {
                             const newSplit = [...splitPayments];
                             newSplit[index].amount = Number(e.target.value);
                             setSplitPayments(newSplit);
                          }}
                          className="w-full border-gray-300 rounded-xl p-3 border focus:ring-2 outline-none font-bold"
                        />
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-between items-center text-sm px-2 pt-2 text-black">
                     <span className="font-medium text-gray-500">Remaining to allocate:</span>
                     <span className={`font-bold ${activeOrder.total - splitPayments.reduce((s,p)=>s+Number(p.amount),0) !== 0 ? 'text-red-500' : 'text-green-500'}`}>
                       ₹{(activeOrder.total - splitPayments.reduce((s,p)=>s+Number(p.amount),0)).toFixed(2)}
                     </span>
                  </div>
                </div>
              )}

              <button 
                onClick={processPaymentAndPrint}
                className="w-full bg-[#1F2937] hover:bg-black text-white py-4 rounded-xl font-bold text-lg shadow-xl shadow-black/10 transition-all flex items-center justify-center gap-2 mt-8"
              >
                <Printer size={20} />
                Pay & Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 80mm Thermal Print Receipt (Hidden on web, visible on print via CSS) */}
      {showCheckout && activeOrder && (
        <div className="hidden print-only print-receipt text-black mx-auto p-4 bg-white" style={{ width: '80mm' }}>
           <div className="text-center mb-4">
              <h1 className="text-xl font-bold">RESTOPRO CAFE</h1>
              <p className="text-xs">123 Culinary Street, Food City</p>
              <p className="text-xs">GSTIN: 22AAAAA0000A1Z5</p>
           </div>
           
           <div className="border-b border-t border-dashed border-black py-2 mb-2 text-xs">
              <div className="flex justify-between"><span className="font-bold">Order #:</span> <span>{activeOrder.orderNumber}</span></div>
              <div className="flex justify-between"><span className="font-bold">Table:</span> <span>T{activeOrder.tableNumber}</span></div>
              <div className="flex justify-between"><span className="font-bold">Date:</span> <span>{new Date().toLocaleString()}</span></div>
           </div>

           <div className="mb-2">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-dashed border-black text-left">
                    <th className="font-bold py-1 w-1/2">Item</th>
                    <th className="font-bold py-1 text-center">Qty</th>
                    <th className="font-bold py-1 text-right">Amt</th>
                  </tr>
                </thead>
                <tbody>
                  {activeOrder.items.map((item: any, i: number) => (
                    <tr key={i}>
                      <td className="py-1 break-words pb-2 pr-1 truncate">{item.name}</td>
                      <td className="py-1 text-center align-top">{item.quantity}</td>
                      <td className="py-1 text-right align-top">{item.price * item.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
           </div>

           <div className="border-t border-black pt-2 text-xs space-y-1">
              <div className="flex justify-between"><span>Subtotal:</span> <span>{activeOrder.subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>CGST (2.5%):</span> <span>{(activeOrder.gstAmount / 2).toFixed(2)}</span></div>
              <div className="flex justify-between"><span>SGST (2.5%):</span> <span>{(activeOrder.gstAmount / 2).toFixed(2)}</span></div>
              
              <div className="flex justify-between font-bold text-sm mt-2 pt-2 border-t border-black">
                 <span>TOTAL:</span> <span>₹{activeOrder.total.toFixed(2)}</span>
              </div>
           </div>

           <div className="border-t border-dashed border-black mt-4 pt-4 text-center">
              <p className="font-bold text-sm uppercase">Payment: {splitMethod === 'split' ? 'SPLIT BILL' : singlePayment}</p>
              {splitMethod === 'split' && splitPayments.map((sp, idx) => (
                <p key={idx} className="text-xs uppercase">{sp.method}: ₹{sp.amount.toFixed(2)}</p>
              ))}
              <p className="text-xs mt-4">Thank you for dining with us!</p>
           </div>
        </div>
      )}
    </>
  );
}
