"use client";

import { useState } from "react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { Calendar, Users, Phone, Mail, User, Clock, MessageSquare, CheckCircle } from "lucide-react";

export default function BookingPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    partySize: '2',
    bookingDate: '',
    bookingTime: '19:00',
    specialRequests: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const dateTime = `${formData.bookingDate}T${formData.bookingTime}:00`;
      await api.post('/bookings', {
        ...formData,
        bookingDate: dateTime
      });
      setSuccess(true);
      toast.success("Reservation Request Sent!");
    } catch (error) {
      toast.error("Failed to process reservation");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
        <div className="bg-white rounded-[3rem] p-12 max-w-lg w-full text-center shadow-2xl border border-slate-100 animate-slide-up">
           <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-8">
              <CheckCircle size={48} />
           </div>
           <h1 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight">Reservation Confirmed</h1>
           <p className="text-slate-500 font-medium leading-relaxed mb-10">
             Thank you, <span className="text-slate-900 font-bold">{formData.customerName}</span>. 
             We've successfully reserved a spot for <span className="text-slate-900 font-bold">{formData.partySize} guests</span> on <span className="text-slate-900 font-bold">{formData.bookingDate}</span>.
           </p>
           <button 
            onClick={() => window.location.reload()}
            className="w-full bg-slate-900 text-white py-5 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl hover:bg-black transition-all"
           >
             Book Another Table
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-20 px-6 font-sans flex flex-col items-center">
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-2 bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 animate-slide-up">
        
        {/* Left: Info Side */}
        <div className="bg-slate-900 p-12 lg:p-16 text-white flex flex-col justify-between relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
           
           <div>
              <div className="px-4 py-1.5 bg-emerald-600/20 text-emerald-400 rounded-full text-[10px] font-bold uppercase tracking-widest inline-block mb-6">
                 Dine-In Reservations
              </div>
              <h1 className="text-5xl font-bold tracking-tighter leading-none mb-6">Reserve your <span className="text-emerald-500">experience.</span></h1>
              <p className="text-slate-400 font-medium leading-relaxed">Join us for an unforgettable culinary journey. Provide your details and we'll handle the rest.</p>
           </div>
           
           <div className="space-y-6 mt-12 lg:mt-0">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-emerald-500">
                    <Clock size={18} />
                </div>
                <div>
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Opening Hours</p>
                   <p className="text-sm font-semibold">12:00 PM • 11:30 PM</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-emerald-500">
                    <CheckCircle size={18} />
                </div>
                <div>
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Instant Confirmation</p>
                   <p className="text-sm font-semibold">Real-time table availability</p>
                </div>
              </div>
           </div>
        </div>

        {/* Right: Form Side */}
        <div className="p-10 lg:p-16">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-5">
              <div className="relative">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2 block px-1">Full Name</label>
                <div className="relative">
                   <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                   <input required type="text" className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 pl-12 text-sm font-bold outline-none focus:border-emerald-500/30 focus:ring-4 focus:ring-emerald-500/5 transition-all text-slate-900" placeholder="John Doe" value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2 block px-1">Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input required type="tel" className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 pl-12 text-sm font-bold outline-none focus:border-emerald-500/30 transition-all text-slate-900" placeholder="+91 ..." value={formData.customerPhone} onChange={e => setFormData({...formData, customerPhone: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2 block px-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input type="email" className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 pl-12 text-sm font-bold outline-none focus:border-emerald-500/30 transition-all text-slate-900" placeholder="optional@email.com" value={formData.customerEmail} onChange={e => setFormData({...formData, customerEmail: e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2 block px-1">Guests</label>
                  <div className="relative">
                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <select className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 pl-12 text-sm font-bold outline-none appearance-none" value={formData.partySize} onChange={e => setFormData({...formData, partySize: e.target.value})}>
                       {[1,2,3,4,5,6,8,10].map(n => <option key={n} value={n}>{n} Persons</option>)}
                    </select>
                  </div>
                </div>
                <div>
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2 block px-1">Date</label>
                   <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input required type="date" className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 pl-12 text-sm font-bold outline-none" value={formData.bookingDate} onChange={e => setFormData({...formData, bookingDate: e.target.value})} />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2 block px-1">Special Requests</label>
                <div className="relative">
                   <MessageSquare className="absolute left-4 top-4 text-slate-300" size={18} />
                   <textarea rows={3} className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 pl-12 text-sm font-bold outline-none focus:border-emerald-500/30 transition-all" placeholder="Birthdays, Allergies, Table preference..." value={formData.specialRequests} onChange={e => setFormData({...formData, specialRequests: e.target.value})} />
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-5 rounded-2xl font-bold text-xs uppercase tracking-[0.2em] shadow-2xl shadow-emerald-600/20 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? "Syncing..." : "Confirm Reservation"}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
