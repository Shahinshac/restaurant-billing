"use client";

import { useState } from "react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { Calendar, Users, Phone, Mail, User, Clock, MessageSquare, CheckCircle, Flame, Sparkles } from "lucide-react";

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
      toast.success("Reservation confirmed!");
    } catch (error) {
      toast.error("Failed to process reservation");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg-deep)' }}>
        <div className="rounded-3xl p-12 max-w-lg w-full text-center animate-scale-in"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}
        >
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8"
            style={{ background: 'var(--success-soft)', color: 'var(--success)' }}
          >
            <CheckCircle size={44} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-4" style={{ fontFamily: 'var(--font-outfit), sans-serif', color: 'var(--text-primary)' }}>
            Reservation Confirmed
          </h1>
          <p className="font-medium leading-relaxed mb-10" style={{ color: 'var(--text-tertiary)' }}>
            Thank you, <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{formData.customerName}</span>. 
            We've reserved a table for <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{formData.partySize} guests</span> on <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{formData.bookingDate}</span>.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="btn-saanam w-full"
          >
            Book Another Table
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-16 px-6 flex flex-col items-center" style={{ background: 'var(--bg-deep)' }}>
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-2 rounded-3xl overflow-hidden animate-slide-up"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}
      >
        
        {/* Left: Brand Side */}
        <div className="p-12 lg:p-14 flex flex-col justify-between relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #18181b, #09090b)' }}
        >
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"
            style={{ background: 'rgba(249,115,22,0.1)' }}
          ></div>
          
          <div className="relative z-10">
            <div className="badge badge-accent inline-flex mb-6">
              <Sparkles size={10} />
              Reservations
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold tracking-tighter leading-none mb-5"
              style={{ fontFamily: 'var(--font-outfit), sans-serif', color: 'var(--text-primary)' }}
            >
              Reserve your <span className="text-gradient">experience.</span>
            </h1>
            <p className="font-medium leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
              Join us for an unforgettable culinary journey. Provide your details and we'll handle the rest.
            </p>
          </div>
          
          <div className="space-y-5 mt-12 lg:mt-0 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--bg-elevated)', color: 'var(--accent)' }}
              >
                <Clock size={18} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-dim)' }}>Opening Hours</p>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>12:00 PM — 11:30 PM</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--bg-elevated)', color: 'var(--accent)' }}
              >
                <CheckCircle size={18} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-dim)' }}>Instant Confirmation</p>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Real-time table availability</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Form Side */}
        <div className="p-10 lg:p-14">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2 block px-0.5" style={{ color: 'var(--text-dim)' }}>Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2" size={16} style={{ color: 'var(--text-dim)' }} />
                <input required type="text" className="input-saanam pl-11" placeholder="Your name" value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2 block px-0.5" style={{ color: 'var(--text-dim)' }}>Phone</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2" size={16} style={{ color: 'var(--text-dim)' }} />
                  <input required type="tel" className="input-saanam pl-11" placeholder="+91..." value={formData.customerPhone} onChange={e => setFormData({...formData, customerPhone: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2 block px-0.5" style={{ color: 'var(--text-dim)' }}>Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2" size={16} style={{ color: 'var(--text-dim)' }} />
                  <input type="email" className="input-saanam pl-11" placeholder="Optional" value={formData.customerEmail} onChange={e => setFormData({...formData, customerEmail: e.target.value})} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2 block px-0.5" style={{ color: 'var(--text-dim)' }}>Guests</label>
                <div className="relative">
                  <Users className="absolute left-4 top-1/2 -translate-y-1/2" size={16} style={{ color: 'var(--text-dim)' }} />
                  <select className="input-saanam pl-11 appearance-none" value={formData.partySize} onChange={e => setFormData({...formData, partySize: e.target.value})}>
                    {[1,2,3,4,5,6,8,10].map(n => <option key={n} value={n}>{n} Persons</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2 block px-0.5" style={{ color: 'var(--text-dim)' }}>Date</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2" size={16} style={{ color: 'var(--text-dim)' }} />
                  <input required type="date" className="input-saanam pl-11" value={formData.bookingDate} onChange={e => setFormData({...formData, bookingDate: e.target.value})} />
                </div>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2 block px-0.5" style={{ color: 'var(--text-dim)' }}>Special Requests</label>
              <div className="relative">
                <MessageSquare className="absolute left-4 top-4" size={16} style={{ color: 'var(--text-dim)' }} />
                <textarea rows={3} className="input-saanam pl-11 resize-none" placeholder="Allergies, birthdays, seating preference..." value={formData.specialRequests} onChange={e => setFormData({...formData, specialRequests: e.target.value})} />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="btn-saanam w-full mt-2"
              style={{ padding: '16px' }}
            >
              {loading ? "Processing..." : "Confirm Reservation"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
