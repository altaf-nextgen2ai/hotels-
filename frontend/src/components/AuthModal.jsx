import React, { useEffect, useRef, useState } from 'react';
import { X, ShieldCheck, Star, MapPin } from 'lucide-react';
import { apiService } from '../services/api';

// ─── Your Google OAuth Client ID ──────────────────────────────────────────────
const GOOGLE_CLIENT_ID = '173907682716-hshq5rj7cjcft2ffgg2q9o0c507b1ae2.apps.googleusercontent.com';

export default function AuthModal({ onClose, onLoginSuccess, onOpenTerms, purpose = 'general', pendingHotelName, pendingRoomType }) {
  const googleBtnRef = useRef(null);
  const [loading, setLoading]   = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [sdkReady, setSdkReady] = useState(false);

  // ── Load Google Identity Services SDK ──────────────────────────────────────
  useEffect(() => {
    if (window.google?.accounts?.id) {
      initGoogle();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initGoogle;
    script.onerror = () => setErrorMsg('Failed to load Google Sign-In. Check your internet connection.');
    document.head.appendChild(script);

    return () => {
      // cleanup: cancel any pending one-tap prompt
      window.google?.accounts?.id?.cancel();
    };
  }, []);

  const initGoogle = () => {
    if (!window.google?.accounts?.id) return;

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleCredential,
      auto_select: false,
      cancel_on_tap_outside: false,
    });

    // Render the styled Google button into our container
    window.google.accounts.id.renderButton(googleBtnRef.current, {
      theme: 'outline',
      size: 'large',
      width: googleBtnRef.current?.offsetWidth || 360,
      text: 'continue_with',
      shape: 'rectangular',
      logo_alignment: 'left',
    });

    setSdkReady(true);
  };

  // ── Called by Google after user picks an account ───────────────────────────
  const handleGoogleCredential = async (googleResponse) => {
    setLoading(true);
    setErrorMsg('');

    const result = await apiService.googleLogin(googleResponse.credential);
    setLoading(false);

    if (result?.error) {
      setErrorMsg(result.error);
      return;
    }

    if (result?.user) {
      onLoginSuccess(result.user, result.token);
    } else {
      setErrorMsg('Something went wrong. Please try again.');
    }
  };

  const isBookingFlow = purpose === 'booking' || purpose === 'checkout';

  return (
    <div
      className="fixed inset-0 z-[200] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="bg-white rounded-none sm:rounded-3xl max-w-full sm:max-w-md w-full shadow-2xl border-0 sm:border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 overflow-y-auto max-h-screen sm:max-h-[calc(100vh-3rem)]">

        {/* Header */}
        <div className="bg-[#0A192F] px-6 py-5 flex justify-between items-start relative">
          <div>
            <p className="text-[11px] font-bold text-[#D4AF37] uppercase tracking-widest mb-1">TRUMITRIP</p>
            <h2 id="auth-modal-title" className="text-2xl font-black text-white leading-tight">
              {isBookingFlow ? 'Sign in to continue booking' : 'Welcome Back'}
            </h2>
            <p className="text-slate-400 text-xs font-medium mt-1">
              {isBookingFlow
                ? 'Login is required before payment. After sign-in, we will bring you back to checkout.'
                : 'Sign in to manage bookings, view history & get exclusive deals'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Trust badges */}
        <div className="flex items-center gap-4 px-6 py-3 bg-slate-50 border-b border-slate-100">
          {[
            { icon: ShieldCheck, text: 'Secure Login' },
            { icon: Star,        text: '50,000+ Bookings' },
            { icon: MapPin,      text: '200+ Hotels' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
              <Icon className="w-3.5 h-3.5 text-[#D4AF37]" />
              {text}
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="px-4 sm:px-6 py-6 sm:py-8 space-y-5">

          {isBookingFlow && pendingHotelName && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4">
              <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Your selection</p>
              <p className="text-sm font-extrabold text-slate-900 mt-1">{pendingHotelName}</p>
              {pendingRoomType && (
                <p className="text-xs text-slate-600 mt-0.5">{pendingRoomType}</p>
              )}
              <p className="text-[11px] text-blue-800 font-semibold mt-2">
                Step 1 of 2 — Sign in · Step 2 — Complete checkout &amp; pay
              </p>
            </div>
          )}

          {/* Error */}
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold p-3 rounded-xl">
              {errorMsg}
            </div>
          )}

          {/* Google Sign-In Button */}
          <div className="space-y-3">
            <p className="text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
              One-click sign in
            </p>

            {/* Google renders its button into this div */}
            <div
              ref={googleBtnRef}
              className="w-full min-h-[44px] flex items-center justify-center"
            />

            {/* Loading / SDK not ready fallback */}
            {!sdkReady && !errorMsg && (
              <div className="flex items-center justify-center gap-2 text-xs text-slate-400 font-medium py-2">
                <div className="w-4 h-4 border-2 border-slate-300 border-t-[#D4AF37] rounded-full animate-spin" />
                Loading Google Sign-In...
              </div>
            )}

            {loading && (
              <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-600 py-2">
                <div className="w-4 h-4 border-2 border-slate-300 border-t-[#0A192F] rounded-full animate-spin" />
                Signing you in...
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-[11px] text-slate-400 font-medium">No password required</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* What you get */}
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 space-y-2">
            <p className="text-xs font-extrabold text-slate-800">What you get after signing in:</p>
            <ul className="space-y-1.5">
              {[
                'Instant booking confirmation & e-vouchers',
                'Real-time booking history & status',
                'Exclusive member-only hotel rates',
                'One-click cancellation & refunds',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-[11px] text-slate-600 font-medium">
                  <span className="text-[#D4AF37] font-black mt-0.5">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Privacy note */}
          <p className="text-center text-[10px] text-slate-400 leading-relaxed">
            By continuing, you agree to Trumitrip's{' '}
            <button
              type="button"
              onClick={() => onOpenTerms && onOpenTerms()}
              className="text-amber-600 font-bold cursor-pointer hover:underline"
            >
              Terms of Service
            </button>
            {' '}and{' '}
            <span className="text-amber-600 font-bold cursor-pointer hover:underline">Privacy Policy</span>.
            <br />We only access your name and email — nothing else.
          </p>

        </div>
      </div>
    </div>
  );
}
