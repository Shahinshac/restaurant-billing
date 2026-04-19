"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Filter, 
  X, 
  Check,
  AlertCircle,
  Image as ImageIcon,
  Flame
} from "lucide-react";

export default function MenuManager() {
  const [menu, setMenu] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    price: 0,
    description: "",
    isVeg: true,
    isAvailable: true,
    prepTime: 10,
    hasPortions: false,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [menuRes, catRes] = await Promise.all([
        api.get("/menu"),
        api.get("/menu/categories")
      ]);
      setMenu(menuRes.data.data);
      setCategories(["All", ...catRes.data.data]);
    } catch (error) {
      toast.error("Failed to load menu data");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (item: any = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        category: item.category,
        price: item.price,
        description: item.description || "",
        isVeg: item.isVeg,
        isAvailable: item.isAvailable,
        prepTime: item.prepTime || 10,
        hasPortions: item.hasPortions || false,
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: "",
        category: categories[1] || "",
        price: 0,
        description: "",
        isVeg: true,
        isAvailable: true,
        prepTime: 10,
        hasPortions: false,
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.put(`/menu/${editingItem.id}`, formData);
        toast.success("Item updated");
      } else {
        await api.post("/menu", formData);
        toast.success("Item created");
      }
      setShowModal(false);
      fetchData();
    } catch (error) {
      toast.error("Operation failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      await api.delete(`/menu/${id}`);
      toast.success("Item deleted");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete item");
    }
  };

  const filteredMenu = menu.filter(item => {
    const matchesCategory = activeCategory === "All" || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-10 h-10 border-[3px] rounded-full animate-spin mb-4"
        style={{ borderColor: 'var(--bg-elevated)', borderTopColor: 'var(--accent)' }}
      ></div>
      <p className="font-bold text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-dim)' }}>Loading Menu...</p>
    </div>
  );

  return (
    <div className="p-6 md:p-8 lg:p-10 max-w-7xl mx-auto animate-in space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 glass-card flex items-center justify-center" style={{ color: 'var(--accent)' }}>
              <Flame size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-outfit), sans-serif', color: 'var(--text-primary)' }}>
                Menu Manager
              </h1>
              <p className="text-sm font-medium mt-0.5" style={{ color: 'var(--text-tertiary)' }}>Create and manage food items</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch gap-4 w-full md:w-auto">
          <div className="relative group flex-1 sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors" size={16} style={{ color: 'var(--text-dim)' }} />
            <input 
              type="text" 
              placeholder="Search dishes..." 
              className="input-saanam pl-10 w-full"
              style={{ padding: '10px 16px 10px 38px', fontSize: '13px' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="btn-saanam whitespace-nowrap"
          >
            <Plus size={16} strokeWidth={3} />
            Add Item
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {categories.map(cat => (
          <button 
            key={cat} 
            onClick={() => setActiveCategory(cat)}
            className="px-5 py-2.5 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all whitespace-nowrap"
            style={activeCategory === cat ? {
              background: 'var(--text-primary)',
              color: 'var(--bg-deep)',
            } : {
              background: 'var(--bg-surface)',
              color: 'var(--text-dim)',
              border: '1px solid var(--border)'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredMenu.map(item => (
          <div key={item.id} className="glow-card group p-6 flex flex-col h-full animate-in">
            <div className="flex justify-between items-start mb-6">
              <div className="p-3.5 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-dim)' }}
              >
                <ImageIcon size={24} />
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-y-1 group-hover:translate-y-0">
                <button 
                  onClick={() => handleOpenModal(item)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--info)' }}
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => handleDelete(item.id)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--danger)' }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-2.5 h-2.5 rounded-full border ${item.isVeg ? 'bg-emerald-500 border-emerald-400' : 'bg-rose-500 border-rose-400'}`}></div>
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-dim)' }}>{item.category}</span>
              </div>
              <h3 className="text-base font-bold tracking-tight mb-2 truncate" style={{ color: 'var(--text-primary)' }}>{item.name}</h3>
              <p className="text-xs font-medium line-clamp-2 leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
                {item.description || "No description provided."}
              </p>
              {item.hasPortions && (
                <div className="flex gap-1.5 mt-3">
                  {['1/4', '1/2', '3/4'].map(p => (
                    <span key={p} className="px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-500 text-[8px] font-black tracking-widest uppercase">{p}</span>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 pt-5 flex justify-between items-end" style={{ borderTop: '1px solid var(--border)' }}>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-dim)' }}>{item.hasPortions ? 'Starting at' : 'Price'}</p>
                <p className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>₹{item.hasPortions ? (item.price * 0.25).toFixed(0) : item.price}</p>
              </div>
              {!item.isAvailable && (
                <div className="badge badge-danger text-[9px] mb-1">Sold Out</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)' }}
        >
          <div className="glass-card w-full max-w-xl p-8 md:p-10 relative animate-scale-in"
            style={{ maxHeight: '90vh', overflowY: 'auto' }}
          >
            <button onClick={() => setShowModal(false)} className="absolute top-8 right-8 transition-all hover:opacity-60" style={{ color: 'var(--text-dim)' }}>
              <X size={22} />
            </button>

            <div className="space-y-1 mb-8">
              <h2 className="text-2xl font-black tracking-tight" style={{ fontFamily: 'var(--font-outfit), sans-serif', color: 'var(--text-primary)' }}>
                {editingItem ? "Edit Item" : "New Food Item"}
              </h2>
              <p className="text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>Fill in the details below</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] px-0.5" style={{ color: 'var(--text-dim)' }}>Dish Name</label>
                  <input required type="text" className="input-saanam" placeholder="e.g. Butter Chicken" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] px-0.5" style={{ color: 'var(--text-dim)' }}>Category</label>
                  <input required type="text" className="input-saanam" placeholder="e.g. Main Course" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] px-0.5" style={{ color: 'var(--text-dim)' }}>Full Portion Price (₹)</label>
                  <input required type="number" className="input-saanam" placeholder="0" value={formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] px-0.5" style={{ color: 'var(--text-dim)' }}>Prep Time (m)</label>
                  <input required type="number" className="input-saanam" placeholder="10" value={formData.prepTime} onChange={e => setFormData({...formData, prepTime: parseInt(e.target.value)})} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] px-0.5" style={{ color: 'var(--text-dim)' }}>Description</label>
                <textarea rows={3} className="input-saanam resize-none" placeholder="A brief description of the dish..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>

              {/* Automatic Portions Preview */}
              <div className="p-5 rounded-2xl bg-zinc-900/50 border border-white/5 space-y-4">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-10 h-6 p-1 rounded-full transition-all ${formData.hasPortions ? 'bg-orange-500' : 'bg-zinc-700'}`}
                    onClick={() => setFormData({...formData, hasPortions: !formData.hasPortions})}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full transition-all ${formData.hasPortions ? 'translate-x-4' : 'translate-x-0'}`}></div>
                  </div>
                  <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>Variable Portions (1/4, 1/2, 3/4)</span>
                </label>

                {formData.hasPortions && (
                  <div className="grid grid-cols-3 gap-3 animate-in">
                    <div className="p-3 rounded-xl bg-black/30 border border-white/5 text-center">
                      <p className="text-[8px] font-bold uppercase tracking-widest opacity-40 mb-1">1/4 Price</p>
                      <p className="text-sm font-black">₹{(formData.price * 0.25).toFixed(0)}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-black/30 border border-white/5 text-center">
                      <p className="text-[8px] font-bold uppercase tracking-widest opacity-40 mb-1">1/2 Price</p>
                      <p className="text-sm font-black">₹{(formData.price * 0.5).toFixed(0)}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-black/30 border border-white/5 text-center">
                      <p className="text-[8px] font-bold uppercase tracking-widest opacity-40 mb-1">3/4 Price</p>
                      <p className="text-sm font-black">₹{(formData.price * 0.75).toFixed(0)}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-8 pt-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-10 h-6 p-1 rounded-full transition-all ${formData.isVeg ? 'bg-emerald-500' : 'bg-zinc-700'}`}
                    onClick={() => setFormData({...formData, isVeg: !formData.isVeg})}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full transition-all ${formData.isVeg ? 'translate-x-4' : 'translate-x-0'}`}></div>
                  </div>
                  <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>Vegetarian</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-10 h-6 p-1 rounded-full transition-all ${formData.isAvailable ? 'bg-orange-500' : 'bg-zinc-700'}`}
                    onClick={() => setFormData({...formData, isAvailable: !formData.isAvailable})}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full transition-all ${formData.isAvailable ? 'translate-x-4' : 'translate-x-0'}`}></div>
                  </div>
                  <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>In Stock</span>
                </label>
              </div>

              <button type="submit" className="btn-saanam w-full flex items-center justify-center gap-3 mt-4" style={{ padding: '16px' }}>
                <Check size={18} strokeWidth={3} />
                {editingItem ? "Save Changes" : "Create Item"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
