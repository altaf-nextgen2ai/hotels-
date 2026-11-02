import React, { useState } from 'react';
import { Building2, Mail, Lock, Eye, EyeOff, ArrowLeft, ShieldCheck, Hotel, Users, TrendingUp } from 'lucide-react';
import { apiService } from '../services/api';

export default function VendorLoginPage({ onLoginSuccess, onNavigateView }) {
  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [showPass,   setShowPass]   = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await apiService.login(email.trim().toLowerCase(), password);
    setLoading(false);

    if (res?.error) {
      setError(res.error);
      return;
    }

    const user = res?.user;
    if (!user) { setError('Login failed. Please try again.'); return; }

    if (user.role !== 'VENDOR' && user.role !== 'ADMIN') {
      setError('This portal is for Hotel Partners only. Customers please use the main site.');
      return;
    }

    onLoginSuccess(user);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 flex">

      {/* Left — Branding panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="absolute border border-white rounded-full"
              style={{ width: `${(i+1)*120}px`, height: `${(i+1)*120}px`, top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
          ))}
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <button onClick={() => onNavigateView('customer')} className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 flex items-center justify-center font-black text-slate-950 text-xl shadow-lg group-hover:scale-105 transition">T</div>
            <div>
              <p className="font-black text-white text-lg leading-none">TRUMITRIP</p>
              <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Partner Portal</p>
            </div>
          </button>
        </div>

        {/* Center content */}
        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="text-4xl font-black text-white leading-tight">
              Grow Your Hotel<br />
              <span className="text-emerald-400">Business with Us</span>
            </h1>
            <p className="text-slate-400 text-sm mt-3 leading-relaxed max-w-sm">
              Join 500+ hotel partners across India and internationally. Manage bookings, rates, and revenue — all from one dashboard.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: Hotel,    value: '500+',  label: 'Partner Hotels' },
              { icon: Users,    value: '50K+',  label: 'Bookings Done' },
              { icon: TrendingUp, value: '18%', label: 'Avg Commission' },
            ].map(({ icon: Icon, value, label }) => (
              <div key={label} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                <Icon className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
                <p className="text-xl font-black text-white">{value}</p>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-xs text-slate-500">© 2026 Trumitrip. All rights reserved.</p>
        </div>
      </div>

      {/* Right — Login form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-12">
        <div className="w-full max-w-md">

          {/* Back button */}
          <button
            onClick={() => onNavigateView('customer')}
            className="flex items-center gap-2 text-slate-400 hover:text-white text-xs font-bold mb-8 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Main Site
          </button>

          <div className="bg-slate-800/60 backdrop-blur border border-slate-700 rounded-3xl p-4 sm:p-8 shadow-2xl space-y-6">

            {/* Header */}
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mb-4">
                <Building2 className="w-6 h-6 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-black text-white">Partner Login</h2>
              <p className="text-sm text-slate-400 mt-1">Hotel Partners & Vendors only</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Email Address</label>
                <div className="flex items-center gap-2 bg-slate-900/60 border-2 border-slate-600 focus-within:border-emerald-500 rounded-xl px-3 py-2.5 transition">
                  <Mail className="w-4 h-4 text-slate-500 shrink-0" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="vendor@yourhotel.com"
                    className="flex-1 bg-transparent text-sm font-semibold text-white placeholder-slate-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Password</label>
                <div className="flex items-center gap-2 bg-slate-900/60 border-2 border-slate-600 focus-within:border-emerald-500 rounded-xl px-3 py-2.5 transition">
                  <Lock className="w-4 h-4 text-slate-500 shrink-0" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="flex-1 bg-transparent text-sm font-semibold text-white placeholder-slate-600 focus:outline-none"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="text-slate-500 hover:text-slate-300 transition">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-xs text-red-400 font-semibold">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-sm py-3.5 rounded-xl shadow-lg transition disabled:opacity-60 flex items-center justify-center gap-2 min-h-[44px]"
              >
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Signing In...</>
                ) : 'Sign In to Partner Dashboard'}
              </button>
            </form>

            {/* Security note */}
            <div className="flex items-start gap-2 bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-400 font-medium">
                This portal is exclusively for approved hotel partners. Your credentials were set up by the Trumitrip admin team.
              </p>
            </div>

            {/* Not a partner yet */}
            <p className="text-center text-xs text-slate-500">
              Not a partner yet?{' '}
              <button onClick={() => onNavigateView('become-partner')} className="text-emerald-400 font-bold hover:underline">
                Apply to join →
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
