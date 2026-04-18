"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Grid, ShoppingBag, ChefHat, LayoutDashboard } from "lucide-react";

export function Navigation() {
  const pathname = usePathname();

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
      <aside className="hidden md:flex flex-col w-64 h-screen bg-[#FFFFFF] border-r border-[#E5E7EB] sticky top-0 shrink-0 shadow-[0_4px_12px_rgba(0,0,0,0.02)] z-40">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-[#FF6B35]">RestoPro<span className="text-[#1F2937]">.</span></h1>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          {links.map((link) => {
            const isActive = pathname.startsWith(link.href);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                  isActive
                    ? "bg-[#FF6B35] text-white shadow-md shadow-[#FF6B35]/20"
                    : "text-[#6B7280] hover:bg-[#F8F9FB] hover:text-[#1F2937]"
                }`}
              >
                <Icon size={20} className={isActive ? "text-white" : "text-[#6B7280]"} />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#FFFFFF] border-t border-[#E5E7EB] flex justify-around items-center px-2 z-50 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] pb-safe">
        {links.map((link) => {
          const isActive = pathname.startsWith(link.href);
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                isActive ? "text-[#FF6B35]" : "text-[#6B7280]"
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
