"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, User, ChevronRight, UtensilsCrossed } from "lucide-react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Artificial delay for better UX feel
    setTimeout(() => {
      if (username === "shahinsha" && password === "262007") {
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("user", JSON.stringify({ name: "Shahinsha", role: "admin" }));
        toast.success("Welcome back, Shahinsha!", {
          style: {
            borderRadius: '12px',
            background: '#333',
            color: '#fff',
          },
        });
        router.push("/dashboard");
      } else {
        toast.error("Invalid credentials. Try again.", {
          icon: '❌',
        });
        setLoading(false);
      }
    }, 1200);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-[#0F172A]">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-[#FF6B35] blur-[120px] opacity-20 animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-[#FF9F1C] blur-[120px] opacity-20 animate-pulse delay-700"></div>

      <div className="w-full max-w-md z-10 animate-fade-in-up">
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-[#FF6B35] to-[#FF9F1C] rounded-2xl flex items-center justify-center shadow-2xl shadow-orange-500/30 mb-4 transform hover:rotate-12 transition-transform duration-500">
            <UtensilsCrossed size={40} className="text-white" />
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">Resto<span className="text-[#FF6B35]">Pro</span></h1>
          <p className="text-slate-400 mt-2 font-medium">Management Suite Login</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[2rem] shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300 ml-1">Username</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-[#FF6B35] transition-colors">
                  <User size={20} />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-11 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/50 focus:border-[#FF6B35] transition-all"
                  placeholder="Enter your username"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300 ml-1">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-[#FF6B35] transition-colors">
                  <Lock size={20} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/50 focus:border-[#FF6B35] transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-[#FF6B35] to-[#FF9F1C] hover:from-[#FF9F1C] hover:to-[#FF6B35] text-white rounded-2xl font-bold text-lg shadow-xl shadow-orange-600/20 transform hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  Connect System <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 flex justify-center">
             <div className="flex items-center gap-2 text-slate-500 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                Operational Status: Ready
             </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-slate-500 text-sm mt-8">
          RestoPro Enterprise v2.4.0 &copy; 2026 Admin Portal
        </p>
      </div>
    </div>
  );
}
