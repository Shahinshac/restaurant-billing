"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import QRCode from "qrcode";
import { QrCode, Printer, Download, ChevronRight, Flame } from "lucide-react";
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
      
      const codes: Record<string, string> = {};
      const baseUrl = window.location.origin;
      
      for (const table of tableData) {
        const url = `${baseUrl}/menu/${table.id}`;
        const qr = await QRCode.toDataURL(url, {
          width: 400,
          margin: 2,
          color: {
            dark: "#09090b",
            light: "#FFFFFF"
          }
        });
        codes[table.id] = qr;
      }
      setQrCodes(codes);
    } catch (error) {
      toast.error("Failed to generate QR codes");
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
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-10 h-10 border-[3px] rounded-full animate-spin mb-4"
        style={{ borderColor: 'var(--bg-elevated)', borderTopColor: 'var(--accent)' }}
      ></div>
      <p className="font-bold text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-dim)' }}>Generating QR Codes...</p>
    </div>
  );

  return (
    <div className="p-6 md:p-8 lg:p-10 max-w-7xl mx-auto animate-in no-scrollbar">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 glass-card flex items-center justify-center" style={{ color: 'var(--accent)' }}>
            <QrCode size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-outfit), sans-serif', color: 'var(--text-primary)' }}>
              QR Code Manager
            </h1>
            <p className="text-sm font-medium mt-0.5" style={{ color: 'var(--text-tertiary)' }}>Generate table ordering codes</p>
          </div>
        </div>
        <button 
          onClick={() => window.print()}
          className="btn-saanam text-[10px] uppercase tracking-widest"
          style={{ padding: '12px 20px' }}
        >
          <Printer size={14} />
          Print All
        </button>
      </div>

      {/* QR Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 stagger-children">
        {tables.map((table, i) => (
          <div key={table.id} className="group glass-card p-7 flex flex-col items-center text-center print:shadow-none animate-in"
            style={{ opacity: 0, animationDelay: `${i * 60}ms`, animationFillMode: 'forwards' }}
          >
            {/* Section badge */}
            <div className="flex items-center gap-1.5 mb-4">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--success)' }}></div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--text-dim)' }}>{table.section}</span>
            </div>
            
            {/* Table Number */}
            <h2 className="text-4xl font-black tracking-tighter mb-6 group-hover:scale-110 transition-transform"
              style={{ fontFamily: 'var(--font-outfit), sans-serif', color: 'var(--text-primary)' }}
            >
              T{table.tableNumber}
            </h2>
            
            {/* QR Code */}
            <div className="relative mb-6 p-3 bg-white rounded-2xl transition-all group-hover:shadow-lg"
              style={{ border: '2px solid var(--border)' }}
            >
              <img 
                src={qrCodes[table.id]} 
                alt={`QR for Table ${table.tableNumber}`}
                className="w-40 h-40 print:w-56 print:h-56"
              />
            </div>

            <p className="text-[10px] font-bold leading-relaxed mb-6 max-w-[180px]" style={{ color: 'var(--text-dim)' }}>
              Scan to view menu and order directly to kitchen.
            </p>

            {/* Actions */}
            <div className="flex gap-2 w-full mt-auto print:hidden">
              <button 
                onClick={() => downloadQR(table.tableNumber, qrCodes[table.id])}
                className="btn-ghost flex-1 text-[10px] uppercase tracking-widest"
                style={{ padding: '12px' }}
              >
                <Download size={14} />
                PNG
              </button>
              <button 
                className="w-12 h-12 rounded-xl flex items-center justify-center transition-all hover:opacity-80"
                style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}
                title="Preview"
                onClick={() => window.open(`/menu/${table.id}`, '_blank')}
              >
                <ChevronRight size={18} />
              </button>
            </div>
            
            <div className="hidden print:block text-sm font-bold mt-4" style={{ color: 'var(--text-primary)' }}>
              Table {table.tableNumber} • {table.section}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
