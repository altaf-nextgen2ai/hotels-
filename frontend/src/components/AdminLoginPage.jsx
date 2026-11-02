import React, { useState } from 'react';
import { ShieldCheck, Mail, Lock, Eye, EyeOff, KeyRound, ArrowLeft, AlertTriangle } from 'lucide-react';
import { apiService } from '../services/api';

// Admin secret key — in production this would be an env variable / SSO
// This is a secondary gate on top of email+password
const ADMIN_SECRET = 'TRUMI-ADMIN-2026';

export default function AdminLoginPage({ onLoginSuccess, onNavigateView }) {
  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [secretKey,  setSecretKey]  = useState('');
  const [showPass,   setShowPass]   = useState(false);
  const [showKey,    setShowKey]    = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [attempts,   setAttempts]   = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Rate limiting — too many attempts
    if (attempts >= 5) {
      setError('Too many failed attempts. Please contact the system administrator.');
      return;
    }

    // Secret key check FIRST (before hitting the API)
    if (secretKey.trim() !== ADMIN_SECRET) {
      setAttempts(a => a + 1);
      setError('Invalid admin secret key. Access denied.');
      return;
    }

    setLoading(true);
    const res = await apiService.login(email.trim().toLowerCase(), password);
    setLoading(false);

    if (res?.error) {
      setAttempts(a => a + 1);
      setError(res.error);
      return;
    }

    const user = res?.user;
    if (!user) { setError('Login failed. Please try again.'); return; }

    if (user.role !== 'ADMIN') {
      setAttempts(a => a + 1);
      setError('Access denied. This portal is for administrators only.');
      return;
    }

    // Success — log access (in production, this would go to an audit log)
    console.info(`[ADMIN ACCESS] ${user.email} logged in at ${new Date().toISOString()}`);
    onLoginSuccess(user);
  };

  const isLocked = attempts >= 5;

  return (
    <div className="min-h-screen bg-[#0A192F] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">

      {/* Background grid */}
      <div className="absolute inset-0 opacity-5"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, #ffffff 0px, #ffffff 1px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, #ffffff 0px, #ffffff 1px, transparent 1px, transparent 40px)' }}
      />

      {/* Back button */}
      <button
        onClick={() => onNavigateView('customer')}
        className="absolute top-6 left-6 flex items-center gap-2 text-slate-500 hover:text-slate-300 text-xs font-bold transition z-10"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="w-full max-w-sm sm:max-w-sm mx-auto relative z-10">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[#D4AF37]/10 border-2 border-[#D4AF37]/30 flex items-center justify-center mb-4 shadow-lg shadow-[#D4AF37]/10">
            <ShieldCheck className="w-8 h-8 text-[#D4AF37]" />
          </div>
          <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest mb-1">TRUMITRIP</p>
          <h1 className="text-2xl font-black text-white">Admin Access</h1>
          <p className="text-xs text-slate-500 mt-1">Restricted — Authorized Personnel Only</p>
        </div>

        {/* Locked state */}
        {isLocked ? (
          <div className="bg-red-900/30 border border-red-500/30 rounded-2xl p-6 text-center space-y-3">
            <AlertTriangle className="w-8 h-8 text-red-400 mx-auto" />
            <p className="text-sm font-black text-red-300">Account Temporarily Locked</p>
            <p className="text-xs text-red-400">Too many failed attempts. Contact the system administrator at support@trumitrip.com</p>
          </div>
        ) : (
          <div className="bg-slate-800/80 backdrop-blur border border-slate-700 rounded-3xl p-4 sm:p-8 shadow-2xl space-y-5">

            {attempts > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-center gap-2 text-xs text-amber-400 font-semibold">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {5 - attempts} attempt{5 - attempts !== 1 ? 's' : ''} remaining
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">Admin Email</label>
                <div className="flex items-center gap-2 bg-slate-900/80 border-2 border-slate-600 focus-within:border-[#D4AF37] rounded-xl px-3 py-2.5 transition">
                  <Mail className="w-4 h-4 text-slate-500 shrink-0" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="admin@trumitrip.com"
                    autoComplete="off"
                    className="flex-1 bg-transparent text-sm font-semibold text-white placeholder-slate-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">Password</label>
                <div className="flex items-center gap-2 bg-slate-900/80 border-2 border-slate-600 focus-within:border-[#D4AF37] rounded-xl px-3 py-2.5 transition">
                  <Lock className="w-4 h-4 text-slate-500 shrink-0" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Admin password"
                    autoComplete="new-password"
                    className="flex-1 bg-transparent text-sm font-semibold text-white placeholder-slate-600 focus:outline-none"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="text-slate-500 hover:text-slate-300 transition">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Secret Key */}
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-[#D4AF37]" />
                  Admin Secret Key
                </label>
                <div className="flex items-center gap-2 bg-slate-900/80 border-2 border-slate-600 focus-within:border-[#D4AF37] rounded-xl px-3 py-2.5 transition">
                  <KeyRound className="w-4 h-4 text-slate-500 shrink-0" />
                  <input
                    type={showKey ? 'text' : 'password'}
                    required
                    value={secretKey}
                    onChange={e => setSecretKey(e.target.value)}
                    placeholder="Secret access key"
                    autoComplete="off"
                    className="flex-1 bg-transparent text-sm font-mono font-bold text-[#D4AF37] placeholder-slate-600 focus:outline-none"
                  />
                  <button type="button" onClick={() => setShowKey(!showKey)} className="text-slate-500 hover:text-slate-300 transition">
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-600 mt-1 font-medium">Provided by system administrator. Never share this key.</p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-xs text-red-400 font-semibold flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#D4AF37] via-[#E5C158] to-[#B8860B] text-slate-950 font-black text-sm py-3.5 rounded-xl shadow-lg transition disabled:opacity-60 flex items-center justify-center gap-2 mt-2 min-h-[44px]"
              >
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" /> Verifying...</>
                ) : (
                  <><ShieldCheck className="w-4 h-4" /> Access Admin Panel</>
                )}
              </button>
            </form>

            {/* Hint for dev */}
            <div className="border-t border-slate-700 pt-4 text-center">
              <p className="text-[10px] text-slate-600 font-mono">
                admin@trumitrip.com · admin123 · TRUMI-ADMIN-2026
              </p>
              <p className="text-[9px] text-slate-700 mt-0.5">Dev mode credentials — remove in production</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
