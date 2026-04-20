"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { CheckCircle2, Loader2, Sparkles, X } from "lucide-react";

function PaymentProcessor() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');

  useEffect(() => {
    const orderId = searchParams.get("order_id");
    const tableId = searchParams.get("table_id");

    if (!orderId) {
      setStatus('error');
      return;
    }

    const verifyAndMarkPaid = async () => {
      try {
        await api.post(`/orders/${orderId}/pay`, { paymentMethod: 'razorpay' });
        setStatus('success');
        setTimeout(() => {
          if (tableId) {
            router.push(`/menu/${tableId}`);
          } else {
            router.push('/');
          }
        }, 3000);
      } catch (err) {
        console.error(err);
        setStatus('error');
      }
    };

    verifyAndMarkPaid();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: 'var(--bg-deep)' }}>
      {status === 'processing' && (
        <div className="flex flex-col items-center gap-6 animate-in fade-in duration-500">
          <Loader2 size={48} className="animate-spin text-[#635BFF]" />
          <div className="text-center">
            <h1 className="text-xl font-bold tracking-tight text-white mb-2">Verifying Payment...</h1>
            <p className="text-xs font-medium text-zinc-400">Please do not close this page.</p>
          </div>
        </div>
      )}

      {status === 'success' && (
        <div className="flex flex-col items-center gap-6 animate-in zoom-in duration-500">
          <div className="w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center relative">
            <CheckCircle2 size={48} className="text-emerald-500 relative z-10" />
            <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full"></div>
            <Sparkles size={20} className="absolute -top-1 -right-1 text-emerald-400 animate-pulse" />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-black tracking-tight text-white mb-2">Payment Successful!</h1>
            <p className="text-sm font-medium text-emerald-400">Your bill has been settled!</p>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-8">Redirecting back to menu...</p>
        </div>
      )}

      {status === 'error' && (
        <div className="flex flex-col items-center gap-6 animate-in fade-in duration-500">
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center">
            <X size={40} className="text-red-500" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold tracking-tight text-white mb-2">Verification Failed</h1>
            <p className="text-sm font-medium text-zinc-400">Please contact a staff member.</p>
          </div>
          <button 
            onClick={() => router.back()}
            className="mt-6 px-6 py-3 rounded-xl bg-zinc-800 text-white font-bold text-xs"
          >
            Go Back
          </button>
        </div>
      )}
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-white" /></div>}>
      <PaymentProcessor />
    </Suspense>
  );
}
