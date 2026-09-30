import React, { useState } from 'react';
import { X, Mail, Lock, User, Phone } from 'lucide-react';
import { apiService } from '../services/api';

export default function AuthModal({ onClose, onLoginSuccess }) {
  const [mode, setMode] = useState('login'); // 'login', 'signup'
  
  // Login Form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup Form
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [awaitingVerification, setAwaitingVerification] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) return;

    setLoading(true);
    setErrorMsg('');
    const res = await apiService.login(loginEmail, loginPassword);
    setLoading(false);

    if (res.user) {
      onLoginSuccess(res.user);
    } else {
      setErrorMsg(res.error || 'Login failed. Please check credentials.');
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    if (!signupName || !signupEmail || !signupPassword) return;

    setLoading(true);
    setErrorMsg('');
    const res = await apiService.signup(signupName, signupEmail, signupPhone, signupPassword);
    setLoading(false);

    if (!res.error) {
      setAwaitingVerification(true);
      setVerificationCode('');
      setErrorMsg(res.message || 'Verification code sent to your email.');
    } else {
      setErrorMsg(res.error || 'Signup failed. Email might already exist.');
    }
  };

  const handleVerificationSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    const res = await apiService.verifySignup(signupEmail, verificationCode);
    setLoading(false);
    if (!res.error) {
      setMode('login');
      setAwaitingVerification(false);
      setErrorMsg('Email verified. Please login to continue.');
    } else {
      setErrorMsg(res.error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 my-6">
        
        {/* Modal Header */}
        <div className="bg-[#0A192F] text-white px-6 py-5 flex justify-between items-center relative">
          <div>
            <h2 className="text-xl font-black text-[#D4AF37]">
              {mode === 'login' ? 'Account Login' : 'Create Customer Account'}
            </h2>
            <p className="text-xs text-slate-300">TRUMITRIP Luxury Hotel Booking Portal</p>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center font-bold text-slate-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          
          {errorMsg && (
            <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold p-3 rounded-xl">
              {errorMsg}
            </div>
          )}

          {/* LOGIN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl focus-within:border-[#D4AF37]">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <input 
                    type="text"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="name@domain.com"
                    className="w-full bg-transparent text-xs font-bold text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl focus-within:border-[#D4AF37]">
                  <Lock className="w-4 h-4 text-slate-400" />
                  <input 
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full bg-transparent text-xs font-bold text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#D4AF37] via-[#E5C158] to-[#B8860B] text-slate-950 font-black text-sm py-3.5 rounded-xl hover:brightness-110 shadow-lg transition flex items-center justify-center gap-2"
              >
                {loading ? 'Logging in...' : 'Sign In To Account'}
              </button>

              {/* Toggle to Signup */}
              <div className="text-center pt-2">
                <p className="text-xs text-slate-500 font-medium">
                  Don't have an account?{' '}
                  <button 
                    type="button" 
                    onClick={() => { setMode('signup'); setErrorMsg(''); }}
                    className="font-bold text-amber-600 hover:underline"
                  >
                    Sign Up Now
                  </button>
                </p>
              </div>

            </form>
          )}

          {/* SIGNUP FORM */}
          {mode === 'signup' && awaitingVerification ? (
            <form onSubmit={handleVerificationSubmit} className="space-y-4">
              <p className="text-sm text-slate-600">Enter the 6-digit code sent to <strong>{signupEmail}</strong>.</p>
              <input type="text" inputMode="numeric" maxLength="6" required value={verificationCode} onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))} placeholder="6-digit OTP" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" />
              <button type="submit" disabled={loading} className="w-full bg-slate-900 text-[#D4AF37] font-black text-sm py-3.5 rounded-xl">{loading ? 'Verifying...' : 'Verify Email'}</button>
            </form>
          ) : mode === 'signup' && (
            <form onSubmit={handleSignupSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <User className="w-4 h-4 text-slate-400" />
                  <input 
                    type="text"
                    required
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    placeholder="e.g. Altaf Fateh"
                    className="w-full bg-transparent text-xs font-bold text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
                <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <input 
                    type="email"
                    required
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="name@domain.com"
                    className="w-full bg-transparent text-xs font-bold text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Phone Number</label>
                <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <input 
                    type="tel"
                    value={signupPhone}
                    onChange={(e) => setSignupPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full bg-transparent text-xs font-bold text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Create Password *</label>
                <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <Lock className="w-4 h-4 text-slate-400" />
                  <input 
                    type="password"
                    required
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="Create a strong password"
                    className="w-full bg-transparent text-xs font-bold text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#0F172A] to-[#1E293B] text-[#D4AF37] font-black text-sm py-3.5 rounded-xl hover:bg-slate-800 shadow-lg transition flex items-center justify-center gap-2"
              >
                {loading ? 'Creating Account...' : 'Complete Registration'}
              </button>

              <div className="text-center pt-2">
                <p className="text-xs text-slate-500 font-medium">
                  Already have an account?{' '}
                  <button 
                    type="button" 
                    onClick={() => { setMode('login'); setErrorMsg(''); }}
                    className="font-bold text-amber-600 hover:underline"
                  >
                    Login Instead
                  </button>
                </p>
              </div>

            </form>
          )}

        </div>

      </div>
    </div>
  );
}
