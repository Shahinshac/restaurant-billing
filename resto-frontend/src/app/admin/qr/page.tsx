"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import QRCode from "qrcode";
import { QrCode, Printer, Download, LayoutGrid, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";

export default function QRDashboard() {
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrCodes, setQrCodes] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const res = await api.get('/tables');
      const tableData = res.data.data;
      setTables(tableData);
      
      // Generate QRs
      const codes: Record<string, string> = {};
      const baseUrl = window.location.origin;
      
      for (const table of tableData) {
        const url = `${baseUrl}/menu/${table.id}`;
        const qr = await QRCode.toDataURL(url, {
          width: 400,
          margin: 2,
          color: {
            dark: "#0F172A",
            light: "#FFFFFF"
          }
        });
        codes[table.id] = qr;
      }
      setQrCodes(codes);
    } catch (error) {
      toast.error("Failed to generate terminal codes");
    } finally {
      setLoading(false);
    }
  };

  const downloadQR = (tableNumber: number, dataUrl: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `Table-${tableNumber}-QR.png`;
    link.click();
  };

  if (loading) return (
    <div className="p-12 flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-10 h-10 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin mb-4"></div>
      <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Generating Encrypted Terminal Codes...</p>
    </div>
  );

  return (
    <div className="p-6 md:p-10 lg:p-12 max-w-7xl mx-auto animate-slide-up no-scrollbar">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">QR Terminal Manager</h1>
          <p className="text-slate-500 font-medium mt-1">Generate and deploy table-specific ordering codes</p>
        </div>
        <button 
          onClick={() => window.print()}
          className="flex items-center gap-2 px-6 py-3.5 bg-slate-900 text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:bg-black transition-all"
        >
          <Printer size={16} />
          Print All Assets
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {tables.map((table) => (
          <div key={table.id} className="group bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col items-center text-center print:shadow-none print:border-slate-200">
            <div className="flex items-center gap-2 mb-6">
               <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{table.section}</span>
            </div>
            
            <h2 className="text-5xl font-black text-slate-900 tracking-tighter mb-8 group-hover:scale-110 transition-transform">T{table.tableNumber}</h2>
            
            <div className="relative mb-8 p-4 bg-white rounded-3xl border-2 border-slate-50 group-hover:border-emerald-500/20 transition-all">
               <img 
                 src={qrCodes[table.id]} 
                 alt={`QR for Table ${table.tableNumber}`}
                 className="w-48 h-48 print:w-64 print:h-64"
               />
               <div className="absolute inset-0 bg-emerald-500/0 group-hover:bg-emerald-500/5 transition-all rounded-3xl"></div>
            </div>

            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed mb-8 max-w-[180px]">
               Scan to view digital menu and place order directly to kitchen.
            </p>

            <div className="flex gap-2 w-full mt-auto print:hidden">
               <button 
                onClick={() => downloadQR(table.tableNumber, qrCodes[table.id])}
                className="flex-1 flex items-center justify-center gap-2 p-4 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-2xl transition-all border border-transparent"
               >
                 <Download size={16} />
                 <span className="text-[10px] font-bold uppercase tracking-widest">PNG</span>
               </button>
               <button 
                className="flex items-center justify-center w-14 h-14 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-2xl transition-all"
                title="View Link"
                onClick={() => window.open(`/menu/${table.id}`, '_blank')}
               >
                 <ChevronRight size={20} />
               </button>
            </div>
            
            <div className="hidden print:block text-[12px] font-bold text-slate-900 mt-4">
               Table {table.tableNumber} • {table.section}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
