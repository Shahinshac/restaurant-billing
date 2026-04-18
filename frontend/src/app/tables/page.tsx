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
                
                const isFree = table.status === 'free';
                const isOccupied = table.status === 'occupied';
                const isReserved = table.status === 'reserved';

                let bgClass = "bg-white border-gray-200 outline outline-2 outline-transparent";
                if(isFree) bgClass = "bg-[#ECFDF5] border-[#10B981]/20 outline-[#10B981]";
                if(isOccupied) bgClass = "bg-[#FEF2F2] border-[#EF4444]/20 outline-[#EF4444]";
                if(isReserved) bgClass = "bg-[#EFF6FF] border-[#3B82F6]/20 outline-[#3B82F6]";

                return (
                  <div 
                    key={table.id} 
                    className={`${bgClass} rounded-2xl p-5 border shadow-sm relative transition-all duration-300 hover:shadow-md flex flex-col items-center justify-center min-h-[140px] gap-2`}
                  >
                    <span className="text-3xl font-black text-gray-900">
                      T{table.tableNumber}
                    </span>
                    
                    <div className="flex items-center gap-1.5 text-sm text-gray-600 bg-white/60 px-2 py-1 rounded-lg backdrop-blur-sm">
                      <Users size={14} />
                      <span className="font-semibold">{table.capacity}</span>
                    </div>

                    {isOccupied && (
                       <button onClick={() => handleFreeTable(table.id)} className="absolute -top-2 -right-2 bg-white text-gray-500 hover:text-red-600 shadow-md rounded-full p-1 border">
                         <RefreshCcw size={14} />
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
