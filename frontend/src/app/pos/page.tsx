"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { socket } from "@/lib/socket";
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
  AlertCircle,
  Bell,
  BellOff
} from "lucide-react";
import { notifier } from "@/lib/notifications";

export default function POSTerminal() {
  const [menu, setMenu] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTakeaway, setIsTakeaway] = useState(false);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [customerDetails, setCustomerDetails] = useState({ name: '', phone: '' });
  const [heldOrder, setHeldOrder] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [portionSelectionItem, setPortionSelectionItem] = useState<any>(null);
  const [printData, setPrintData] = useState<any>(null);
  const [billRequestedTableId, setBillRequestedTableId] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('pos_held_order');
    if (saved) setHeldOrder(JSON.parse(saved));
  }, []);

  const handleTableSelect = (table: any) => {
    setSelectedTableId(prev => prev === table.id ? null : table.id);
  };

  const handleClearTable = async (tableId: string) => {
    try {
      await api.post(`/tables/${tableId}/clear`);
      toast.success("Table Cleared");
      fetchInitialData();
    } catch (error) {
      toast.error("Failed to clear table");
    }
  };

  const handleSettlePayment = async (tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (!table || !table.currentOrderId) return;
    
    // Setup data to print before clearing the table
    setPrintData({
      isTakeaway: false,
      tableNumber: table.tableNumber,
      customerName: table.currentOrder?.customerName || '',
      items: table.currentOrder?.items?.map((i: any) => ({
        name: i.itemName,
        quantity: i.quantity,
        price: i.price
      })) || [],
      subtotal: table.currentOrder?.subtotal || 0,
      gst: table.currentOrder?.gstAmount || 0,
      total: table.currentOrder?.totalAmount || 0
    });
    
    try {
      setIsSubmitting(true);
      await api.post(`/orders/${table.currentOrderId}/pay`, { paymentMethod: 'cash' });
      toast.success("Payment Settled & Table Freed");
      
      // Delay printing slightly so the react component receives the printData state
      setTimeout(() => {
        window.print();
        setTimeout(() => setPrintData(null), 1000); // clear after printing
      }, 500);
      
      setSelectedTableId(null);
      setBillRequestedTableId(null);
      fetchInitialData();
    } catch (error) {
      toast.error("Settlement failed");
      setPrintData(null);
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const handleApproveOrder = async (orderId: string) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status: 'PENDING' });
      toast.success("Order Approved via POS");
      fetchInitialData();
    } catch {
      toast.error("Failed to approve order");
    }
  };

  const handleRejectOrder = async (tableId: string | null, orderId: string) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status: 'CANCELLED' });
      if (tableId) {
        await api.post(`/tables/${tableId}/clear`);
      }
      toast.success("Order Rejected & Table Cleared");
      fetchInitialData();
    } catch {
      toast.error("Failed to reject order");
    }
  };

  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    // Attempt silent init on first interaction
    const initNotifier = () => {
      if (!notifier.initialized) {
        notifier.initialize();
        setNotificationsEnabled(true);
      }
    };
    window.addEventListener('click', initNotifier, { once: true });

    fetchInitialData();

    socket.on('table_updated', (data) => {
      setTables(prev => prev.map(t => t.id === data.table.id ? data.table : t));
    });

    socket.on('order_created', (data: any) => {
      if (data.order.status === 'PENDING_APPROVAL') {
        notifier.playPOSChime();
        notifier.sendPushNotification('New QR Order', `Approval required for Table ${data.order.tableNumber}`);
      }
      fetchInitialData();
    });

    socket.on('order_updated', (data: any) => {
      if (data.order?.status === 'PENDING_APPROVAL') {
         // for existing orders adding items
         notifier.playPOSChime();
         notifier.sendPushNotification('Add-on Order', `Table ${data.order.tableNumber} added items`);
      }
      fetchInitialData();
    });

    return () => {
      socket.off('table_updated');
      socket.off('order_created');
      socket.off('order_updated');
      window.removeEventListener('click', initNotifier);
    };
  }, []);

  const fetchInitialData = async () => {
    try {
      const [menuRes, tablesRes] = await Promise.all([
        api.get('/menu'),
        api.get('/tables'),
      ]);
      setMenu(menuRes.data.data);
      setTables(tablesRes.data.data);
    } catch (error) {
      toast.error("Failed to sync terminal data");
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item: any, selectedPortion: string = 'FULL') => {
    const itemName = selectedPortion === 'FULL' ? item.name : `${item.name} (${selectedPortion})`;
    const priceRatio = selectedPortion === '1/4' ? 0.25 : selectedPortion === '1/2' ? 0.5 : selectedPortion === '3/4' ? 0.75 : 1;
    const finalPrice = Math.round(item.price * priceRatio);

    setCart(prev => {
      // Find matches that are NOT existing items (already sent to kitchen)
      const existing = prev.find(i => i.name === itemName && !i.isExisting);
      if (existing) {
        return prev.map(i => (i.name === itemName && !i.isExisting) ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { 
        id: item.id, 
        name: itemName, 
        price: finalPrice, 
        quantity: 1, 
        portion: selectedPortion,
        isExisting: false 
      }];
    });
    setPortionSelectionItem(null);
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(i => i.id !== itemId));
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart(prev => prev.map(i => i.id === itemId ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i));
  };

  const handlePlaceOrder = async () => {
    if (isSubmitting || cart.length === 0) return;
    if (!isTakeaway && !selectedTableId) return toast.error("Please select a table");

    setIsSubmitting(true);
    try {
      const payload = {
        tableId: isTakeaway ? null : selectedTableId,
        orderType: isTakeaway ? 'TAKEAWAY' : 'DINE_IN',
        customerName: customerDetails.name,
        customerPhone: customerDetails.phone,
        paymentStatus: 'unpaid',
        paymentMethod: 'pending',
        items: cart.map(i => ({
          menuItemId: i.id,
          name: i.name,
          price: i.price,
          quantity: i.quantity
        }))
      };
      await api.post('/orders', payload);
      toast.success("Order sent to kitchen!");

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

  const filteredMenu = menu;
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const gst = subtotal * 0.05;
  const total = subtotal + gst;

  const handlePrint = () => {
    if (cart.length === 0) return toast.error("Nothing to print");
    window.print();
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
            <span>{printData ? 'DINE-IN' : (isTakeaway ? 'TAKEAWAY' : 'DINE-IN')}</span>
          </div>
          {!(printData?.isTakeaway ?? isTakeaway) && (
            <div className="flex justify-between font-bold">
              <span>Table:</span>
              <span>{printData ? printData.tableNumber : (tables.find(t => t.id === selectedTableId)?.tableNumber || 'N/A')}</span>
            </div>
          )}
          {(!printData && isTakeaway && customerDetails.name) || (printData && printData.customerName) ? (
            <div className="flex justify-between">
              <span>Guest:</span>
              <span className="truncate max-w-[120px]">{printData ? printData.customerName : customerDetails.name}</span>
            </div>
          ) : null}
        </div>

        <div className="border-b border-dashed border-black mb-2"></div>
        <div className="grid grid-cols-[1fr_auto_auto] gap-2 mb-2 font-bold">
          <span>Item</span>
          <span>Qty</span>
          <span>Price</span>
        </div>
        <div className="border-b border-dashed border-black mb-2"></div>

        <div className="space-y-1 mb-4">
          {(printData ? printData.items : cart).map((item: any, i: number) => (
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
            <span>₹{(printData ? printData.subtotal : subtotal).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>GST (5%):</span>
            <span>₹{(printData ? printData.gst : gst).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-base font-bold">
            <span>TOTAL:</span>
            <span>₹{(printData ? printData.total : total).toFixed(2)}</span>
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
                <button 
                  onClick={() => {
                    notifier.initialize();
                    setNotificationsEnabled(true);
                    toast.success("Notifications Enabled");
                  }}
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-all bg-zinc-800/50"
                  style={{ color: notificationsEnabled ? 'var(--success)' : 'var(--text-dim)' }}
                >
                  {notificationsEnabled ? <Bell size={18} /> : <BellOff size={18} />}
                </button>
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

          </header>

          <div className="flex-1 p-6 overflow-y-auto custom-scroll grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 content-start">
            {filteredMenu.map(item => (
              <div 
                key={item.id} 
                onClick={() => {
                  if (item.hasPortions) {
                    setPortionSelectionItem(item);
                  } else {
                    addToCart(item);
                  }
                }}
                className="glow-card group p-5 cursor-pointer flex flex-col"
              >
                <div className="relative aspect-[4/3] mb-4 rounded-xl overflow-hidden flex items-center justify-center"
                  style={{ background: 'var(--bg-elevated)' }}
                >
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform duration-700 transform group-hover:scale-110" />
                  ) : (
                    <div className="text-4xl filter grayscale group-hover:grayscale-0 transition-all duration-500 transform group-hover:scale-110">
                      🍲
                    </div>
                  )}
                  <div className={`absolute top-2.5 left-2.5 w-3 h-3 z-10 shadow-sm border-2 ${item.isVeg ? 'bg-emerald-500 border-emerald-400/30' : 'bg-rose-500 border-rose-400/30'}`}></div>
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
              <div className="space-y-4">
                {tables.filter(t => t.currentOrder?.status === 'PENDING_APPROVAL').length > 0 && (
                  <div className="mb-6 p-4 rounded-2xl border border-blue-500/30 bg-blue-500/5">
                    <h3 className="text-sm font-bold text-blue-500 mb-3 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                      Pending Approvals (QR Orders)
                    </h3>
                    <div className="flex flex-col gap-3">
                      {tables.filter(t => t.currentOrder?.status === 'PENDING_APPROVAL').map(table => (
                        <div key={table.id} className="flex justify-between items-center bg-white dark:bg-zinc-900 border border-blue-500/20 p-3 rounded-xl shadow-sm">
                          <div>
                            <p className="font-bold text-sm">Table {table.tableNumber} <span className="text-blue-500 ml-1">#{table.currentOrder?.orderNumber.slice(-4)}</span></p>
                            <p className="text-[10px] uppercase tracking-widest text-zinc-500 mt-1">{table.currentOrder?.items?.length} Items • ₹{table.currentOrder?.totalAmount.toFixed(2)}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleRejectOrder(table.id, table.currentOrder!.id)}
                              className="px-4 py-2 rounded-lg bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-500 text-[10px] font-bold uppercase tracking-widest hover:bg-red-100 transition-colors"
                            >
                              Reject
                            </button>
                            <button 
                              onClick={() => handleApproveOrder(table.currentOrder!.id)}
                              className="px-4 py-2 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-500 border border-blue-500/20 text-[10px] font-bold uppercase tracking-widest hover:bg-blue-100 transition-colors"
                            >
                              Approve
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-5 gap-2">
                {tables.map(table => {
                  const isOccupied = table.status === 'OCCUPIED' || table.status === 'RESERVED';
                  return (
                    <button 
                      key={table.id}
                      onClick={() => handleTableSelect(table)}
                      className="relative aspect-square rounded-xl flex flex-col items-center justify-center transition-all"
                      style={selectedTableId === table.id ? {
                        background: 'linear-gradient(135deg, var(--accent), #ea580c)',
                        color: '#fff',
                        boxShadow: '0 4px 20px rgba(249,115,22,0.35)',
                      } : isOccupied ? {
                        background: table.currentOrder?.paymentStatus === 'unpaid' ? 'var(--warning-soft)' : 'var(--danger-soft)',
                        color: table.currentOrder?.paymentStatus === 'unpaid' ? 'var(--warning)' : 'var(--danger)',
                        border: table.currentOrder?.paymentStatus === 'unpaid' ? '1px solid rgba(245,158,11,0.2)' : '1px solid rgba(239,68,68,0.2)',
                      } : {
                        background: 'var(--bg-surface)',
                        color: 'var(--text-dim)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <span className="text-[11px] font-black tracking-tight leading-none mb-0.5">T{table.tableNumber}</span>
                      <span className="text-[8px] font-bold uppercase tracking-widest opacity-60">{table.capacity} PAX</span>
                      <div className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full ${isOccupied ? (table.currentOrder?.paymentStatus === 'unpaid' ? 'bg-amber-500 animate-pulse' : 'bg-red-500 animate-pulse') : 'bg-emerald-500'}`}></div>
                      {table.currentOrder?.paymentStatus === 'unpaid' && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center text-[8px] font-black shadow-lg">₹</div>
                      )}
                    </button>
                  );
                })}
              </div>
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
              cart.map((item, idx) => (
                <div key={`${item.id}-${idx}`} className="flex justify-between items-center group animate-in">
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
            
            {selectedTableId && tables.find(t => t.id === selectedTableId)?.status === 'OCCUPIED' && (
              <div className="space-y-2 mb-2">
                {tables.find(t => t.id === selectedTableId)?.currentOrder?.paymentStatus === 'unpaid' && (
                  <>
                    {billRequestedTableId !== selectedTableId ? (
                      <button 
                        onClick={() => setBillRequestedTableId(selectedTableId)}
                        disabled={isSubmitting}
                        className="w-full btn-saanam flex items-center justify-center gap-2 py-4"
                        style={{ background: 'var(--warning)', color: '#fff', border: 'none' }}
                      >
                        <Clock size={16} />
                        Pay After Food
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleSettlePayment(selectedTableId)}
                        disabled={isSubmitting}
                        className="w-full btn-saanam flex items-center justify-center gap-2 py-4"
                        style={{ background: 'var(--success)', color: '#fff', border: 'none' }}
                      >
                        <CheckCircle2 size={16} />
                        Settle Cash
                      </button>
                    )}
                  </>
                )}
                <button 
                  onClick={() => handleClearTable(selectedTableId)}
                  className="w-full btn-saanam flex items-center justify-center gap-2.5 py-4"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                >
                  <X size={18} />
                  Force Clear Table
                </button>
              </div>
            )}

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
                disabled={isSubmitting || cart.length === 0}
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
      {/* Portion Selection Modal */}
      {portionSelectionItem && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}
        >
          <div className="glass-card w-full max-w-sm p-8 animate-scale-in text-center relative">
            <button 
              onClick={() => setPortionSelectionItem(null)}
              className="absolute top-6 right-6 text-zinc-500 hover:text-white"
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-black mb-1 capitalize">{portionSelectionItem.name}</h2>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-8 border-b border-white/5 pb-4">Select Portion Size</p>
            
            <div className="grid grid-cols-2 gap-4">
              {['1/4', '1/2', '3/4', 'FULL'].map(p => {
                const ratio = p === '1/4' ? 0.25 : p === '1/2' ? 0.5 : p === '3/4' ? 0.75 : 1;
                const price = Math.round(portionSelectionItem.price * ratio);
                return (
                  <button 
                    key={p}
                    onClick={() => addToCart(portionSelectionItem, p)}
                    className="p-6 rounded-2xl bg-zinc-900 border border-white/5 hover:border-orange-500/50 hover:bg-orange-500/5 transition-all text-center group"
                  >
                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-2 group-hover:text-orange-500">{p}</p>
                    <p className="text-lg font-black tracking-tight">₹{price}</p>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
