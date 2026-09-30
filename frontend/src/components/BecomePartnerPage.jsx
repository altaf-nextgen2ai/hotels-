import React, { useState } from 'react';
import { 
  Building2, ShieldCheck, TrendingUp, Users, CheckCircle, Clock, 
  ArrowRight, Phone, Mail, User, Lock, MapPin, Hotel, Sparkles, Check 
} from 'lucide-react';
import { apiService } from '../services/api';
import Logo from './Logo';

export default function BecomePartnerPage({ currentUser, onLoginSuccess, onNavigateView, onLogout }) {
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    password: '',
    hotel_name: '',
    city: 'Goa',
    address: '',
    total_rooms: '15'
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [submittedVendor, setSubmittedVendor] = useState(null);

  // If user is already a VENDOR with PENDING status
  const isPendingVendor = currentUser?.role === 'VENDOR' && currentUser?.vendor_status === 'PENDING';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password || !formData.hotel_name) {
      setErrorMsg('Full Name, Email, Password, and Hotel Name are required.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    const res = await apiService.createVendor({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
      hotel_name: formData.hotel_name,
      city: formData.city,
      address: formData.address
    });

    setLoading(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      const vendorObj = res.vendor || {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: 'VENDOR',
        vendor_status: 'PENDING',
        hotel_name: formData.hotel_name
      };
      setSubmittedVendor(vendorObj);
      if (onLoginSuccess && res.vendor) {
        onLoginSuccess({ ...res.vendor, role: 'VENDOR', vendor_status: 'PENDING' });
      }
    }
  };

  // Status Screen for Pending Approval
  if (isPendingVendor || submittedVendor) {
    const activeUser = submittedVendor || currentUser;
    return (
      <div className="min-h-screen bg-[#0A192F] text-slate-100 flex flex-col justify-between p-4 md:p-12 relative overflow-hidden">
        {/* Decorative Background Effects */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Navbar */}
        <div className="max-w-6xl w-full mx-auto flex justify-between items-center z-10">
          <div onClick={() => onNavigateView('customer')} className="cursor-pointer">
            <Logo size="medium" />
          </div>
          <button 
            onClick={() => onNavigateView('customer')}
            className="text-xs font-bold text-slate-400 hover:text-white transition cursor-pointer"
          >
            ← Back to Customer Site
          </button>
        </div>

        {/* Main Status Container */}
        <div className="max-w-2xl w-full mx-auto my-auto bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-10 shadow-2xl backdrop-blur-xl z-10 space-y-6 animate-in fade-in zoom-in-95">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
              <Clock className="w-8 h-8 animate-pulse" />
            </div>
            <span className="inline-block bg-amber-500/20 text-amber-300 text-[11px] font-black px-3.5 py-1 rounded-full uppercase tracking-wider border border-amber-500/30">
              Application Under Review
            </span>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Hotel Partner Registration Received!
            </h1>
            <p className="text-xs md:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
              Thank you for applying to list <strong className="text-amber-400">{activeUser?.hotel_name || formData.hotel_name || 'your property'}</strong> on TRUMITRIP. Our executive team is reviewing your registration details.
            </p>
          </div>

          {/* Details Card */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-5 text-xs space-y-3">
            <div className="flex justify-between items-center pb-2.5 border-b border-slate-800">
              <span className="text-slate-400 font-medium">Applicant Name</span>
              <span className="font-bold text-white">{activeUser?.name}</span>
            </div>
            <div className="flex justify-between items-center pb-2.5 border-b border-slate-800">
              <span className="text-slate-400 font-medium">Registered Email</span>
              <span className="font-bold text-emerald-400">{activeUser?.email}</span>
            </div>
            <div className="flex justify-between items-center pb-2.5 border-b border-slate-800">
              <span className="text-slate-400 font-medium">Property Name</span>
              <span className="font-bold text-amber-400">{activeUser?.hotel_name || formData.hotel_name || 'Pending Details'}</span>
            </div>
            <div className="flex justify-between items-center pb-2.5 border-b border-slate-800">
              <span className="text-slate-400 font-medium">Commission Rate</span>
              <span className="font-bold text-emerald-400">10% Platform Fee (90% Payout)</span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-slate-400 font-medium">Approval Status</span>
              <span className="bg-amber-500/20 text-amber-300 font-black px-2.5 py-0.5 rounded text-[10px] uppercase border border-amber-500/30">
                PENDING ADMIN APPROVAL
              </span>
            </div>
          </div>

          <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Once approved by Administrator, logging into your account will automatically open your full <strong>Hotel Partner App Dashboard</strong> with access to Rooms, Pricing, Inventory & Revenue.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button 
              onClick={() => onNavigateView('customer')}
              className="flex-1 bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-slate-950 font-black text-xs py-3.5 rounded-xl hover:brightness-110 shadow-lg transition cursor-pointer"
            >
              Explore TRUMITRIP Site
            </button>
            <button 
              onClick={onLogout}
              className="px-5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs py-3.5 rounded-xl transition cursor-pointer"
            >
              Sign Out Account
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-[11px] text-slate-500 z-10 mt-6">
          Need partner support? Contact us at <a href="mailto:partner@trumitrip.com" className="text-amber-400 underline">partner@trumitrip.com</a>
        </div>
      </div>
    );
  }

  // Registration Form View
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Navbar Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 sticky top-0 z-40 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div onClick={() => onNavigateView('customer')} className="cursor-pointer">
            <Logo size="medium" />
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => onNavigateView('customer')}
              className="text-xs font-bold text-slate-400 hover:text-white transition cursor-pointer"
            >
              Customer Site
            </button>
            <button 
              onClick={() => onNavigateView('partner')}
              className="bg-[#D4AF37] text-slate-950 font-black text-xs px-4 py-2 rounded-xl hover:bg-amber-400 transition shadow cursor-pointer"
            >
              Partner Login
            </button>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="py-12 md:py-16 px-6 relative overflow-hidden bg-gradient-to-b from-[#0A192F] to-slate-950">
        <div className="max-w-5xl mx-auto text-center space-y-4">
          <span className="bg-[#D4AF37]/10 text-[#D4AF37] text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-wider border border-[#D4AF37]/30 inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Join TRUMITRIP Hotel Partner Network
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
            Grow Your Hotel Business & Maximize <span className="text-[#D4AF37]">Direct Revenue</span>
          </h1>
          <p className="text-slate-300 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Register your hotel or resort in minutes. Gain access to thousands of luxury travelers with low 10% commission and 90% direct payouts.
          </p>
        </div>
      </section>

      {/* Main Registration Grid */}
      <section className="max-w-6xl mx-auto px-6 pb-20 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* Left Benefits Column */}
        <div className="lg:col-span-5 space-y-6 pt-4">
          <h2 className="text-xl font-black text-white">Why Partner with TRUMITRIP?</h2>
          
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold shrink-0">
                90%
              </div>
              <div>
                <h3 className="font-extrabold text-white text-sm">Industry Best 90% Payout</h3>
                <p className="text-xs text-slate-400 mt-1">We charge a flat 10% platform fee. You keep 90% of every confirmed booking revenue.</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-sm">Dedicated Hotel Partner App</h3>
                <p className="text-xs text-slate-400 mt-1">Manage rooms, pricing, availability, and guest bookings from a single sleek dashboard.</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center font-bold shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-sm">Verified Guests & Instant Alerts</h3>
                <p className="text-xs text-slate-400 mt-1">Receive verified bookings with instant notification and real-time status management.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Partner Application Form */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl">
          <div className="border-b border-slate-800 pb-4 mb-6">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Hotel className="w-5 h-5 text-[#D4AF37]" />
              <span>Hotel Partner Application</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">Fill out your owner details and hotel information to register.</p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Owner Credentials */}
            <div className="space-y-3">
              <span className="text-[10px] font-black text-[#D4AF37] uppercase tracking-wider block">1. Owner / Manager Account</span>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Full Name *</label>
                  <div className="flex items-center gap-2 p-3 bg-slate-950 border border-slate-800 rounded-xl focus-within:border-[#D4AF37]">
                    <User className="w-4 h-4 text-slate-500" />
                    <input 
                      type="text" 
                      required 
                      value={formData.name} 
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                      placeholder="e.g. Ramesh Sharma" 
                      className="w-full bg-transparent text-xs font-bold text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Email Address *</label>
                  <div className="flex items-center gap-2 p-3 bg-slate-950 border border-slate-800 rounded-xl focus-within:border-[#D4AF37]">
                    <Mail className="w-4 h-4 text-slate-500" />
                    <input 
                      type="email" 
                      required 
                      value={formData.email} 
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                      placeholder="owner@hotelname.com" 
                      className="w-full bg-transparent text-xs font-bold text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Mobile Phone *</label>
                  <div className="flex items-center gap-2 p-3 bg-slate-950 border border-slate-800 rounded-xl focus-within:border-[#D4AF37]">
                    <Phone className="w-4 h-4 text-slate-500" />
                    <input 
                      type="tel" 
                      required 
                      value={formData.phone} 
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
                      placeholder="+91 9876543210" 
                      className="w-full bg-transparent text-xs font-bold text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Create Password *</label>
                  <div className="flex items-center gap-2 p-3 bg-slate-950 border border-slate-800 rounded-xl focus-within:border-[#D4AF37]">
                    <Lock className="w-4 h-4 text-slate-500" />
                    <input 
                      type="password" 
                      required 
                      value={formData.password} 
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
                      placeholder="Strong password" 
                      className="w-full bg-transparent text-xs font-bold text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Property Information */}
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <span className="text-[10px] font-black text-[#D4AF37] uppercase tracking-wider block">2. Property & Business Details</span>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Hotel / Property Name *</label>
                <div className="flex items-center gap-2 p-3 bg-slate-950 border border-slate-800 rounded-xl focus-within:border-[#D4AF37]">
                  <Building2 className="w-4 h-4 text-slate-500" />
                  <input 
                    type="text" 
                    required 
                    value={formData.hotel_name} 
                    onChange={(e) => setFormData({ ...formData, hotel_name: e.target.value })} 
                    placeholder="e.g. Grand Heritage Palace & Spa" 
                    className="w-full bg-transparent text-xs font-bold text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">City / Region *</label>
                  <input 
                    type="text"
                    required
                    list="partner-city-suggestions"
                    value={formData.city} 
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g. Udaipur, Goa, Shimla, Dubai"
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                  <datalist id="partner-city-suggestions">
                    {["Goa", "Mumbai", "Delhi", "Manali", "Jaipur", "Dubai", "Paris", "Singapore", "Bengaluru", "Udaipur", "Shimla", "Agra", "Kolkata", "Kochi", "Varanasi"].map(c => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Total Room Capacity</label>
                  <input 
                    type="number" 
                    min="1" 
                    value={formData.total_rooms} 
                    onChange={(e) => setFormData({ ...formData, total_rooms: e.target.value })}
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Property Address</label>
                <div className="flex items-start gap-2 p-3 bg-slate-950 border border-slate-800 rounded-xl focus-within:border-[#D4AF37]">
                  <MapPin className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                  <textarea 
                    rows="2" 
                    value={formData.address} 
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })} 
                    placeholder="Full postal address of the property..." 
                    className="w-full bg-transparent text-xs font-bold text-white focus:outline-none resize-none"
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full mt-4 bg-gradient-to-r from-[#D4AF37] via-[#E5C158] to-[#B8860B] text-slate-950 font-black text-sm py-4 rounded-xl hover:brightness-110 shadow-xl transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? 'Submitting Application...' : 'Submit Partner Application →'}
            </button>
          </form>
        </div>

      </section>
    </div>
  );
}
