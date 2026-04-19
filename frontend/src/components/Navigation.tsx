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
  QrCode,
  Bell,
  Flame,
  Sun,
  Moon,
  Map,
  Monitor,
  FileText
} from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useTheme } from "@/context/ThemeContext";

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("user");
    toast.success("Signed out successfully");
    router.push("/login");
  };

  const links = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/pos", label: "POS Terminal", icon: ShoppingBag },
    { href: "/tables", label: "Tables", icon: Grid },
    { href: "/kds", label: "Kitchen", icon: ChefHat },
    { href: "/status", label: "Status Board", icon: Monitor },
  ];

  const adminLinks = [
    { href: "/admin/menu", label: "Menu Manager", icon: Flame },
    { href: "/admin/tables", label: "Floor Layout", icon: Map },
    { href: "/admin/qr", label: "QR Manager", icon: QrCode },
    { href: "/invoices", label: "Invoices", icon: FileText },
  ];

  return (
    <>
      {/* ═══════ Desktop Sidebar ═══════ */}
      <aside className="hidden lg:flex flex-col w-[272px] h-screen sticky top-0 shrink-0 z-40"
        style={{
          background: 'var(--bg-surface)',
          borderRight: '1px solid var(--border)',
        }}
      >
        {/* Logo */}
        <div className="p-7 mb-2">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, var(--accent), #ea580c)',
                boxShadow: '0 8px 24px rgba(249, 115, 22, 0.3)',
              }}
            >
              <Flame size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight" style={{ fontFamily: 'var(--font-outfit), sans-serif', color: 'var(--text-primary)' }}>
                26:07
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--success)' }}></div>
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-dim)' }}>
                  Cloud Suite
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Nav Links */}
        <div className="flex-1 px-4 space-y-1 overflow-y-auto no-scrollbar">
          <p className="px-4 text-[10px] font-bold uppercase tracking-[0.2em] mb-4" style={{ color: 'var(--text-dim)' }}>
            Main Menu
          </p>
          {links.map((link) => {
            const isActive = pathname.startsWith(link.href);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`nav-item group ${isActive ? "nav-item-active" : ""}`}
              >
                <div className="relative">
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                  {isActive && (
                    <div className="absolute -left-[22px] top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full" style={{ background: 'var(--accent)' }}></div>
                  )}
                </div>
                <span className="text-[13px]">{link.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }}></div>
                )}
              </Link>
            );
          })}

          {/* Admin Management */}
          <div className="pt-8">
            <p className="px-4 text-[10px] font-bold uppercase tracking-[0.2em] mb-4" style={{ color: 'var(--text-dim)' }}>
              Management
            </p>
            {adminLinks.map((link) => {
              const isActive = pathname.startsWith(link.href);
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`nav-item group ${isActive ? "nav-item-active" : ""}`}
                >
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                  <span className="text-[13px]">{link.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="rounded-2xl p-4 mb-3" style={{ background: 'var(--bg-elevated)' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm"
                style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
              >
                S
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>Shahinsha</p>
                <p className="text-[11px] font-medium truncate" style={{ color: 'var(--text-tertiary)' }}>Administrator</p>
              </div>
              <div className="flex items-center gap-0.5">
                <button 
                  onClick={toggleTheme}
                  className="p-2 transition-all hover:scale-110" 
                  style={{ color: 'var(--accent)' }}
                  title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
                >
                  {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                </button>
                <button className="p-2 transition-colors hover:opacity-80" style={{ color: 'var(--text-dim)' }}>
                  <Bell size={16} />
                </button>
              </div>
            </div>
          </div>
          
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl font-bold text-xs transition-all duration-200 hover:opacity-90"
            style={{
              background: 'var(--danger-soft)',
              color: 'var(--danger)',
              border: '1px solid rgba(239, 68, 68, 0.15)',
            }}
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ═══════ Mobile Experience ═══════ */}
      <div className="lg:hidden">
        {/* Top bar */}
        <header className="fixed top-0 left-0 right-0 h-16 flex items-center justify-between px-5 z-50"
          style={{
            background: 'var(--glass-heavy)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, var(--accent), #ea580c)' }}
            >
              <Flame size={18} className="text-white" />
            </div>
            <span className="text-base font-bold tracking-tight" style={{ fontFamily: 'var(--font-outfit), sans-serif', color: 'var(--text-primary)' }}>
              26:07
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={toggleTheme}
              className="p-2.5 rounded-xl transition-all" 
              style={{ background: 'var(--bg-elevated)', color: 'var(--accent)' }}
            >
              {theme === 'dark' ? <Sun size={18} strokeWidth={2.5} /> : <Moon size={18} strokeWidth={2.5} />}
            </button>
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2.5 rounded-xl"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
            >
              <Menu size={20} />
            </button>
          </div>
        </header>

        {/* Spacer for fixed header */}
        <div className="h-16"></div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 z-[60] animate-in"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <div 
              className="absolute top-3 right-3 bottom-3 w-72 rounded-3xl p-6 flex flex-col animate-slide-right"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-8">
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-dim)' }}>Navigation</span>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2" style={{ color: 'var(--text-dim)' }}>
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-1 flex-1 overflow-y-auto no-scrollbar">
                {[...links, ...adminLinks].map((link) => (
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
              <div className="pt-5" style={{ borderTop: '1px solid var(--border)' }}>
                <button 
                  onClick={handleLogout} 
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl text-sm font-bold"
                  style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Floating Bottom Nav */}
        <nav className="fixed bottom-5 left-5 right-5 h-16 rounded-2xl flex justify-around items-center px-2 z-50"
          style={{
            background: 'var(--glass)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            border: '1px solid var(--border)',
            boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
          }}
        >
          {links.slice(0, 4).map((link) => {
            const isActive = pathname.startsWith(link.href);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all duration-300"
                style={isActive ? {
                  background: 'linear-gradient(135deg, var(--accent), #ea580c)',
                  color: '#fff',
                  boxShadow: '0 4px 16px rgba(249, 115, 22, 0.4)',
                } : {
                  color: 'var(--text-dim)',
                }}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
