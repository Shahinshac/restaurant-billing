"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag, Lock, User } from "lucide-react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulated login for professional feel
    setTimeout(() => {
      if (username === "shahinsha" && password === "262007") {
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("user", JSON.stringify({ name: "Shahinsha", role: "admin" }));
        toast.success("Login Successful", {
          style: {
            borderRadius: '12px',
            background: '#FFFFFF',
            color: '#1F2937',
            border: '1px solid #E5E7EB',
            fontSize: '14px',
          },
        });
        router.push("/dashboard");
      } else {
        toast.error("Invalid credentials. Please try again.", {
          style: {
            borderRadius: '12px',
          }
        });
        setLoading(false);
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#F8F9FB] p-6 lg:p-12 font-sans">
      {/* Top Logo */}
      <div className="mb-12 flex flex-col items-center">
        <div className="w-16 h-16 bg-[#FF6B35] rounded-2xl flex items-center justify-center shadow-lg mb-4">
          <ShoppingBag size={32} className="text-white" />
        </div>
        <h1 className="text-3xl font-black text-[#1F2937] tracking-tight">RESTOPRO</h1>
        <p className="text-[#6B7280] text-sm mt-1 font-medium">Point of Sale System</p>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-[460px] bg-white rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#E5E7EB] p-10 lg:p-14 transition-all animate-fade-in">
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-[#1F2937] mb-2">Welcome Back</h2>
          <p className="text-[#6B7280] text-sm">Please enter your details to sign in.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {/* User ID Input */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#1F2937] ml-1">User ID</label>
            <div className="relative group">
              <input
                type="text"
                required
                className="w-full h-[56px] bg-[#F9FAFB] border border-[#E5E7EB] rounded-[12px] px-12 text-[#1F2937] font-medium outline-none focus:border-[#FF6B35] focus:bg-white transition-all"
                placeholder="Enter operator ID"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] group-focus-within:text-[#FF6B35] transition-colors">
                <User size={20} />
              </div>
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#1F2937] ml-1">Password</label>
            <div className="relative group">
              <input
                type="password"
                required
                className="w-full h-[56px] bg-[#F9FAFB] border border-[#E5E7EB] rounded-[12px] px-12 text-[#1F2937] font-medium outline-none focus:border-[#FF6B35] focus:bg-white transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] group-focus-within:text-[#FF6B35] transition-colors">
                <Lock size={20} />
              </div>
            </div>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-[56px] bg-[#FF6B35] hover:bg-[#FF8C5E] active:scale-[0.99] disabled:opacity-50 text-white font-bold rounded-[14px] shadow-lg shadow-orange-500/10 transition-all flex items-center justify-center text-lg mt-8"
          >
            {loading ? (
              <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              "Login"
            )}
          </button>
        </form>

        <div className="mt-12 text-center">
          <p className="text-[#9CA3AF] text-xs font-medium uppercase tracking-wider">
            Enterprise Management v4.0.0
          </p>
        </div>
      </div>

      {/* Helper text */}
      <p className="mt-8 text-[#6B7280] text-sm">
        Having trouble? <span className="text-[#FF6B35] font-semibold cursor-pointer">Contact Support</span>
      </p>
    </div>
  );
}
