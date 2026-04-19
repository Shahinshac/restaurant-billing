"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { 
  Users, 
  Grid, 
  ShoppingBag, 
  ChefHat, 
  LayoutDashboard, 
  LogOut, 
  Menu, 
  X,
  Settings,
  Bell
} from "lucide-react";
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
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/pos", label: "POS Terminal", icon: ShoppingBag },
    { href: "/tables", label: "Tables", icon: Grid },
    { href: "/kds", label: "Kitchen", icon: ChefHat },
    { href: "/queue", label: "Queue", icon: Users },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 h-screen bg-white border-r border-slate-100 sticky top-0 shrink-0 z-40">
        <div className="p-8 mb-4">
          <div className="flex items-center gap-3.5">
             <div className="w-11 h-11 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
                <ChefHat size={22} className="text-white" />
             </div>
             <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-tight">RestoPro</h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enterprise v2</p>
                </div>
             </div>
          </div>
        </div>
        
        <div className="flex-1 px-6 space-y-1.5">
          <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Main Menu</p>
          {links.map((link) => {
            const isActive = pathname.startsWith(link.href);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`nav-item group ${isActive ? "nav-item-active" : ""}`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} className={isActive ? "text-emerald-600" : "text-slate-400 group-hover:text-slate-600"} />
                <span className="text-sm">{link.label}</span>
                {isActive && (
                   <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                )}
              </Link>
            );
          })}

          <div className="pt-8">
            <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Support & Tools</p>
            <Link href="/settings" className="nav-item group">
              <Settings size={20} className="text-slate-400 group-hover:text-slate-600" />
              <span className="text-sm font-medium">Settings</span>
            </Link>
          </div>
        </div>

        <div className="p-6 border-t border-slate-50">
           <div className="bg-slate-50/80 rounded-2xl p-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-emerald-600 font-bold text-sm">JS</div>
                <div className="flex-1 min-w-0">
                   <p className="text-sm font-bold text-slate-900 truncate">John Smith</p>
                   <p className="text-[11px] font-medium text-slate-500 truncate">Manager</p>
                </div>
                <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                  <Bell size={18} />
                </button>
              </div>
           </div>
           
           <button 
             onClick={handleLogout}
             className="w-full flex items-center justify-center gap-2.5 px-4 py-3 bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-[var(--radius-md)] transition-all duration-200 font-bold text-xs border border-slate-100 hover:border-rose-100"
           >
             <LogOut size={16} />
             Sign Out System
           </button>
        </div>
      </aside>

      {/* Mobile Experience */}
      <div className="lg:hidden">
        <header className="fixed top-0 left-0 right-0 h-20 bg-white/70 backdrop-blur-xl border-b border-slate-100 flex items-center justify-between px-6 z-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-100">
              <ChefHat size={20} className="text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900 tracking-tight">RestoPro</span>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 transition-all"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </header>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[60]" onClick={() => setIsMobileMenuOpen(false)}>
            <div className="absolute top-4 right-4 bottom-4 w-72 bg-white rounded-3xl shadow-2xl p-6 flex flex-col animate-in" onClick={e => e.stopPropagation()}>
               <div className="flex justify-between items-center mb-8">
                  <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Navigation</span>
                  <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-slate-400"><X size={20} /></button>
               </div>
               <div className="space-y-2 flex-1">
                  {links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`nav-item ${pathname.startsWith(link.href) ? "nav-item-active" : ""}`}
                    >
                      <link.icon size={20} />
                      <span className="text-sm font-semibold">{link.label}</span>
                    </Link>
                  ))}
               </div>
               <div className="pt-6 border-t border-slate-100">
                  <button 
                    onClick={handleLogout} 
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-rose-50 text-rose-600 rounded-2xl text-sm font-bold"
                  >
                    <LogOut size={18} />
                    Sign Out
                  </button>
               </div>
            </div>
          </div>
        )}

        {/* Floating Bottom Nav (Mobile) */}
        <nav className="fixed bottom-6 left-6 right-6 h-16 bg-white/90 backdrop-blur-xl border border-slate-100 shadow-2xl shadow-slate-200/50 rounded-2xl flex justify-around items-center px-4 z-50">
          {links.slice(0, 4).map((link) => {
            const isActive = pathname.startsWith(link.href);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 ${
                  isActive ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200" : "text-slate-400"
                }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}

