"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, User, Flame, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      if (username === "shahinsha" && password === "262007") {
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("user", JSON.stringify({ name: "Shahinsha", role: "admin" }));
        toast.success("Welcome back, Shahinsha");
        router.push("/dashboard");
      } else {
        toast.error("Invalid credentials");
        setLoading(false);
      }
    }, 1200);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden" style={{ background: 'var(--bg-deep)' }}>
      
      {/* Ambient Background */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Gradient orbs */}
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full animate-float"
          style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.12) 0%, transparent 70%)' }}
        />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 60%)', animationDelay: '1.5s' }}
        />
        {/* Dot grid */}
        <div className="absolute inset-0 dot-grid opacity-40"></div>
      </div>

      <div className="relative z-10 w-full max-w-[440px] mx-6">
        
        {/* Logo */}
        <div className="flex flex-col items-center mb-10 animate-slide-up">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
            style={{
              background: 'linear-gradient(135deg, var(--accent), #ea580c)',
              boxShadow: '0 12px 40px rgba(249, 115, 22, 0.35)',
            }}
          >
            <Flame size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-black tracking-tight" style={{ fontFamily: 'var(--font-outfit), sans-serif', color: 'var(--text-primary)' }}>
            Saanam
          </h1>
          <p className="text-sm mt-1 font-medium" style={{ color: 'var(--text-tertiary)' }}>
            Restaurant Management Suite
          </p>
        </div>

        {/* Login Card */}
        <div 
          className="rounded-3xl p-10 animate-in"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.03)',
          }}
        >
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Welcome back</h2>
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Enter your credentials to continue</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Username */}
            <div className="space-y-2">
              <label className="text-xs font-semibold ml-0.5" style={{ color: 'var(--text-secondary)' }}>User ID</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors" style={{ color: 'var(--text-dim)' }}>
                  <User size={18} />
                </div>
                <input
                  type="text"
                  required
                  className="input-saanam pl-12"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-xs font-semibold ml-0.5" style={{ color: 'var(--text-secondary)' }}>Password</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors" style={{ color: 'var(--text-dim)' }}>
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  required
                  className="input-saanam pl-12"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-saanam w-full mt-3 text-base"
              style={{ padding: '16px 28px' }}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-[11px] font-medium uppercase tracking-widest" style={{ color: 'var(--text-dim)' }}>
              Saanam Suite v2.0
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center mt-6 text-sm" style={{ color: 'var(--text-dim)' }}>
          Need help? <span className="font-semibold cursor-pointer" style={{ color: 'var(--accent)' }}>Contact Support</span>
        </p>
      </div>
    </div>
  );
}
