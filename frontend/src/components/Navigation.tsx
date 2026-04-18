"use client";

import { useRouter } from "next/navigation";
import { Users, Grid, ShoppingBag, ChefHat, LayoutDashboard, LogOut } from "lucide-react";
import toast from "react-hot-toast";

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("user");
    toast.success("Logged out successfully");
    router.push("/login");
  };

  const links = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/queue", label: "Queue", icon: Users },
    { href: "/tables", label: "Tables", icon: Grid },
    { href: "/pos", label: "POS", icon: ShoppingBag },
    { href: "/kds", label: "KDS", icon: ChefHat },
  ];

  return (
    <>
      {/* Tablet/Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-72 h-screen bg-[#0F172A] border-r border-white/5 sticky top-0 shrink-0 z-40">
        <div className="p-8">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-[#FF6B35] rounded-xl flex items-center justify-center shadow-lg shadow-[#FF6B35]/20">
                <ShoppingBag size={22} className="text-white" />
             </div>
             <h1 className="text-2xl font-black text-white tracking-tight">Resto<span className="text-[#FF6B35]">Pro</span></h1>
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-1.5 mt-2">
          {links.map((link) => {
            const isActive = pathname.startsWith(link.href);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 font-semibold group ${
                  isActive
                    ? "bg-[#FF6B35] text-white shadow-xl shadow-[#FF6B35]/30 translate-x-1"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <div className={`p-1 rounded-lg transition-colors ${isActive ? "text-white" : "text-slate-500 group-hover:text-white"}`}>
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-white/5">
           <button 
             onClick={handleLogout}
             className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-300 font-semibold group"
           >
             <LogOut size={22} className="group-hover:-translate-x-1 transition-transform" />
             Sign Out
           </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-xl border-t border-gray-100 flex justify-around items-center px-4 z-50 rounded-t-3xl shadow-[0_-10px_25px_rgba(0,0,0,0.05)] pb-safe">
        {links.map((link) => {
          const isActive = pathname.startsWith(link.href);
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`relative flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300 ${
                isActive ? "text-[#FF6B35] bg-orange-50" : "text-gray-400"
              }`}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-[10px] mt-1 font-bold ${isActive ? "opacity-100 scale-100" : "opacity-0 scale-90"} transition-all`}>
                {link.label}
              </span>
              {isActive && (
                <div className="absolute -top-1 w-1 h-1 bg-[#FF6B35] rounded-full shadow-[0_0_8px_#FF6B35]"></div>
              )}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
