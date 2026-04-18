"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { socket } from "@/lib/socket";
import toast from "react-hot-toast";
import { Users, AlertCircle, CheckCircle, RefreshCcw } from "lucide-react";

export default function TablesPage() {
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTables();
    
    socket.on('table_updated', handleTableUpdate);
    return () => {
      socket.off('table_updated', handleTableUpdate);
    };
  }, []);

  const fetchTables = async () => {
    try {
      const res = await api.get('/tables');
      setTables(res.data.data);
    } catch (error) {
      toast.error("Failed to load tables");
    } finally {
      setLoading(false);
    }
  };

  const handleTableUpdate = () => {
    fetchTables();
  };

  const handleFreeTable = async (id: string) => {
    try {
      if(confirm("Are you sure you want to mark this table as free? Checkouts should normally be via POS.")) {
         await api.post(`/tables/${id}/free`);
         toast.success("Table freed manually");
         fetchTables();
      }
    } catch (error) {
      toast.error("Error freeing table");
    }
  }

  if (loading) return <div className="p-8">Loading tables...</div>;

  // Group by section
  const sections = Array.from(new Set(tables.map(t => t.section)));

  return (
    <div className="p-6 md:p-8 animate-fade-in max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
         <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Tables</h1>
          <p className="text-gray-500 mt-1">Live floor map and occupancy status.</p>
         </div>
         <div className="flex gap-4">
            <span className="flex items-center gap-2 text-sm"><div className="w-3 h-3 rounded-full bg-[#10B981]"></div> Free</span>
            <span className="flex items-center gap-2 text-sm"><div className="w-3 h-3 rounded-full bg-[#EF4444]"></div> Occupied</span>
            <span className="flex items-center gap-2 text-sm"><div className="w-3 h-3 rounded-full bg-[#3B82F6]"></div> Reserved</span>
         </div>
      </div>

      <div className="space-y-12 pb-20">
        {sections.map(section => (
          <div key={section}>
            <h2 className="text-xl font-bold mb-6 text-gray-800 border-b pb-2 flex items-center gap-2">
              {section}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {tables.filter(t => t.section === section).map(table => {
                
                const isFree = table.status === 'FREE';
                const isOccupied = table.status === 'OCCUPIED';
                const isReserved = table.status === 'RESERVED';

                let bgClass = "bg-white/40 border-slate-200";
                let accentColor = "bg-slate-400";
                
                if(isFree) {
                  bgClass = "bg-emerald-50/50 border-emerald-100/50 hover:bg-emerald-50 hover:border-emerald-200";
                  accentColor = "bg-emerald-500";
                }
                if(isOccupied) {
                  bgClass = "bg-rose-50/50 border-rose-100/50 hover:bg-rose-50 hover:border-rose-200 text-rose-900";
                  accentColor = "bg-rose-500";
                }
                if(isReserved) {
                  bgClass = "bg-blue-50/50 border-blue-100/50 hover:bg-blue-50 hover:border-blue-200 text-blue-900";
                  accentColor = "bg-blue-500";
                }

                return (
                  <div 
                    key={table.id} 
                    className={`${bgClass} rounded-[2rem] p-8 border-2 shadow-sm relative transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col items-center justify-center min-h-[160px] gap-3 group group-hover:bg-white`}
                  >
                    <div className={`absolute top-4 right-4 w-2 h-2 rounded-full ${accentColor} shadow-[0_0_8px] group-hover:scale-125 transition-transform`}></div>
                    
                    <span className="text-4xl font-black text-gray-900 tracking-tighter">
                      {table.tableNumber}
                    </span>
                    
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-500 bg-white/80 px-4 py-2 rounded-xl backdrop-blur-sm shadow-sm border border-gray-100">
                      <Users size={14} className="text-[#FF6B35]" />
                      <span>{table.capacity} COVERS</span>
                    </div>

                    {isOccupied && (
                       <button 
                         onClick={() => handleFreeTable(table.id)} 
                         className="absolute -bottom-2 bg-white text-slate-400 hover:text-red-500 shadow-lg shadow-slate-200 rounded-full p-2 border border-slate-100 transition-all hover:rotate-180"
                         title="Manual Reset"
                       >
                         <RefreshCcw size={16} />
                       </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
