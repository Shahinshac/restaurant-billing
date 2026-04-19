"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Users, Grid, ShoppingBag, ChefHat, LayoutDashboard, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("user");
    toast.success("Logged out successfully");
    router.push("/login");
  };

  const links = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/pos", label: "Point of Sale", icon: ShoppingBag },
    { href: "/tables", label: "Operations", icon: Grid },
    { href: "/kds", label: "Kitchen KDS", icon: ChefHat },
    { href: "/queue", label: "Waiting List", icon: Users },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 h-screen bg-white border-r border-slate-100 sticky top-0 shrink-0 z-40">
        <div className="p-8">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-600/20">
                <ChefHat size={20} className="text-white" />
             </div>
             <div>
                <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-none">RestoPro</h1>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-1">v2.0 Beta</p>
             </div>
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-1 mt-4">
          {links.map((link) => {
            const isActive = pathname.startsWith(link.href);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative ${
                  isActive
                    ? "bg-emerald-50 text-emerald-700"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} className={isActive ? "text-emerald-600" : "group-hover:text-slate-900"} />
                <span className="text-sm font-medium">{link.label}</span>
                {isActive && (
                  <div className="absolute left-0 w-1 h-6 bg-emerald-600 rounded-r-full"></div>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-slate-50">
           <div className="flex items-center gap-3 px-2 mb-6">
              <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-emerald-600 font-bold text-xs">S</div>
              <div className="flex-1 min-w-0">
                 <p className="text-xs font-semibold text-slate-900 truncate">Administrator</p>
                 <p className="text-[10px] text-slate-400 truncate">Online</p>
              </div>
           </div>
           
           <button 
             onClick={handleLogout}
             className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-xl transition-all duration-200 font-semibold text-xs border border-transparent hover:border-red-100"
           >
             <LogOut size={14} />
             Sign Out
           </button>
        </div>
      </aside>

      {/* Mobile Header & Bottom Nav */}
      <div className="md:hidden flex flex-col">
        <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-6 z-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <ChefHat size={16} className="text-white" />
            </div>
            <span className="text-sm font-bold text-slate-900">RestoPro</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-600">
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </header>

        {/* Mobile Sidebar Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
            <div className="absolute right-0 top-0 bottom-0 w-64 bg-white p-6 shadow-2xl animate-fade-in" onClick={e => e.stopPropagation()}>
               <div className="mt-12 space-y-2">
                  {links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg ${pathname.startsWith(link.href) ? "bg-emerald-50 text-emerald-700" : "text-slate-600"}`}
                    >
                      <link.icon size={18} />
                      <span className="text-sm font-medium">{link.label}</span>
                    </Link>
                  ))}
                  <button onClick={handleLogout} className="w-full mt-4 flex items-center gap-3 px-4 py-3 bg-slate-50 text-red-600 rounded-lg text-sm font-medium">
                    <LogOut size={18} />
                    Sign Out
                  </button>
               </div>
            </div>
          </div>
        )}

        <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-100 flex justify-around items-center px-4 z-50">
          {links.slice(0, 4).map((link) => {
            const isActive = pathname.startsWith(link.href);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex flex-col items-center justify-center px-4 py-1 rounded-xl transition-all duration-200 ${
                  isActive ? "text-emerald-600" : "text-slate-400"
                }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-bold mt-1 uppercase tracking-tighter">{link.label.split(' ')[0]}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
