"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { 
  Search, 
  Printer, 
  Clock, 
  Calendar, 
  Receipt, 
  Filter,
  ArrowRight,
  ChevronRight,
  TrendingUp,
  History
} from "lucide-react";
import { format } from "date-fns";

export default function InvoicesPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState("all"); // all, paid, unpaid
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders');
      // Filter for COMPLETED or READY or PAID orders primarily, but showing all for record
      setOrders(res.data.data);
    } catch (error) {
      toast.error("Failed to load invoice history");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = (order: any) => {
    setSelectedOrder(order);
    // Wait for state to update and re-render the hidden printable div
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handleSettleOrder = async (orderId: string) => {
    try {
      setIsSubmitting(true);
      await api.post(`/orders/${orderId}/pay`, { paymentMethod: 'cash' });
      toast.success("Order Settled Successfully");
      fetchOrders();
    } catch (error) {
      toast.error("Settlement failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      (o.tableNumber && o.tableNumber.toString().includes(search)) ||
      (o.customerName && o.customerName.toLowerCase().includes(search.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'paid' && o.paymentStatus === 'paid') ||
      (statusFilter === 'unpaid' && o.paymentStatus === 'unpaid');
      
    return matchesSearch && matchesStatus;
  });

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-10 h-10 border-[3px] rounded-full animate-spin mb-4"
        style={{ borderColor: 'var(--bg-elevated)', borderTopColor: 'var(--accent)' }}
      ></div>
      <p className="font-bold text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-dim)' }}>Loading Records...</p>
    </div>
  );

  return (
    <div className="p-6 md:p-8 lg:p-10 max-w-7xl mx-auto animate-in">
      
      {/* ═══════ Hidden Printable Receipt ═══════ */}
      {selectedOrder && (
        <div className="hidden print:block print-only print:w-[80mm] print:p-4 text-black bg-white font-mono text-[12px] leading-tight">
          <div className="text-center mb-4">
            <h1 className="text-lg font-bold uppercase tracking-tighter">26:07</h1>
            <p className="text-[10px]">Restaurant Management Suite</p>
            <div className="border-b border-dashed border-black my-2"></div>
            <p className="uppercase font-bold">Duplicate Bill Receipt</p>
            <p className="text-[10px] italic">(Historical Record)</p>
            <div className="border-b border-dashed border-black my-2"></div>
          </div>

          <div className="space-y-1 mb-4">
            <div className="flex justify-between">
              <span>Order #:</span>
              <span>{selectedOrder.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Date:</span>
              <span>{format(new Date(selectedOrder.createdAt), 'dd/MM/yyyy HH:mm')}</span>
            </div>
            <div className="flex justify-between">
              <span>Type:</span>
              <span>{selectedOrder.orderType}</span>
            </div>
            {selectedOrder.tableNumber && (
              <div className="flex justify-between font-bold">
                <span>Table:</span>
                <span>{selectedOrder.tableNumber}</span>
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
            {selectedOrder.items.map((item: any, i: number) => (
              <div key={i} className="grid grid-cols-[1fr_auto_auto] gap-2">
                <span className="truncate">{item.itemName}</span>
                <span>x{item.quantity}</span>
                <span>₹{item.price * item.quantity}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-black pt-2 space-y-1">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>₹{selectedOrder.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>GST (5%):</span>
              <span>₹{selectedOrder.gstAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base font-bold">
              <span>TOTAL:</span>
              <span>₹{selectedOrder.totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <div className="text-center mt-8 pt-4 border-t border-dashed border-black">
            <p className="text-[10px] mb-1">Generated from Archive</p>
            <p className="text-[9px] uppercase tracking-widest">26:07 Restaurant Suite</p>
          </div>
        </div>
      )}

      {/* Header Area */}
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 print:hidden">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 glass-card flex items-center justify-center text-orange-500">
              <History size={20} />
            </div>
            <h1 className="text-3xl font-black tracking-tight" style={{ fontFamily: 'var(--font-outfit), sans-serif' }}>
              Invoice Library
            </h1>
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--text-dim)' }}>
            Search and Reprint Historical Records
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto mt-4 md:mt-0">
          <div className="flex bg-zinc-900/50 p-1 rounded-xl border border-white/5">
            {['all', 'paid', 'unpaid'].map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === f ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" size={18} />
            <input 
              type="text"
              placeholder="Search Order # or Table..."
              className="input-saanam pl-12"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Analytics Mini-cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 print:hidden">
        <div className="glass-card p-6 flex items-center gap-5">
           <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500">
             <Receipt size={24} />
           </div>
           <div>
             <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">Total Records</p>
             <p className="text-2xl font-black tracking-tighter">{orders.length}</p>
           </div>
        </div>
        <div className="glass-card p-6 flex items-center gap-5">
           <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
             <TrendingUp size={24} />
           </div>
           <div>
             <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">Avg Ticket Size</p>
             <p className="text-2xl font-black tracking-tighter">
               ₹{orders.length ? (orders.reduce((s, o) => s + o.totalAmount, 0) / orders.length).toFixed(0) : 0}
             </p>
           </div>
        </div>
        <div className="glass-card p-6 flex items-center gap-5">
           <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
             <Calendar size={24} />
           </div>
           <div>
             <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">Last Update</p>
             <p className="text-sm font-bold">{orders.length ? format(new Date(orders[0].createdAt), 'MMMM do, HH:mm') : 'N/A'}</p>
           </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="glass-card overflow-hidden print:hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr style={{ background: 'var(--bg-elevated)' }}>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest opacity-40">Date & Time</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest opacity-40">Order #</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest opacity-40">Source</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest opacity-40">Amount</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest opacity-40 text-center">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-sm italic opacity-40">No matching records found.</td>
                </tr>
              )}
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-white mb-0.5">{format(new Date(order.createdAt), 'dd MMM yyyy')}</span>
                      <span className="text-[10px] font-medium opacity-40">{format(new Date(order.createdAt), 'HH:mm:ss')}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                       <span className="w-1.5 h-1.5 rounded-full" style={{ background: order.paymentStatus === 'paid' ? 'var(--success)' : 'var(--warning)' }}></span>
                       <span className="text-sm font-mono font-bold tracking-tight text-white">{order.orderNumber}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: 'var(--accent)' }}>
                        {order.orderType === 'DINE_IN' ? `Table ${order.tableNumber}` : 'Takeaway'}
                      </span>
                      <span className="text-[10px] font-medium opacity-40">{order.customerName || 'Standard Guest'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-base font-black tracking-tighter">₹{order.totalAmount.toFixed(2)}</span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {order.paymentStatus === 'unpaid' && order.orderType === 'DINE_IN' && (
                        <button 
                          onClick={() => handleSettleOrder(order.id)}
                          disabled={isSubmitting}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white"
                        >
                          Settle Cash
                        </button>
                      )}
                      <button 
                        onClick={() => handlePrint(order)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
                        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                      >
                        <Printer size={14} className="text-orange-500" />
                        Reprint
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
