import React, { useEffect } from 'react';
import { X, Headset, Phone, Mail, MapPin, Clock, MessageCircle, ExternalLink } from 'lucide-react';
import {
  SUPPORT_PHONE_TEL,
  SUPPORT_PHONE_DISPLAY,
  SUPPORT_EMAIL,
  SUPPORT_EMAIL_BOOKING,
  OFFICE_ADDRESS,
} from '../data/supportContact';

export default function SupportModal({ onClose, onNavigatePath }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const openHelp = () => {
    onClose?.();
    if (onNavigatePath) onNavigatePath('/help-faqs/');
    else window.location.href = '/help-faqs/';
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="support-modal-title"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-br from-[#0A192F] via-[#0F2744] to-[#0A192F] text-white px-5 sm:px-6 py-5 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
            aria-label="Close support"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-start gap-4 pr-10">
            <div className="w-12 h-12 rounded-2xl bg-[#D4AF37] text-[#0A192F] flex items-center justify-center shrink-0 shadow-lg shadow-amber-900/30">
              <Headset className="w-6 h-6" strokeWidth={2.25} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37] mb-1">Always here for you</p>
              <h2 id="support-modal-title" className="text-xl font-extrabold leading-tight">
                TRUMITRIP 24/7 Support
              </h2>
              <p className="text-sm text-slate-300 mt-1 font-medium">
                Bookings, cancellations, payments, or travel help — reach us anytime.
              </p>
            </div>
          </div>
          <div className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-emerald-300 bg-emerald-950/50 border border-emerald-500/30 rounded-full px-3 py-1.5">
            <Clock className="w-3.5 h-3.5" />
            Available 24 hours · 7 days a week
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-3 bg-slate-50/80">
          <a
            href={`tel:${SUPPORT_PHONE_TEL}`}
            className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-200 hover:border-[#D4AF37]/50 hover:shadow-md transition group"
          >
            <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-100 transition">
              <Phone className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Call us</p>
              <p className="text-lg font-extrabold text-slate-900">{SUPPORT_PHONE_DISPLAY}</p>
            </div>
            <span className="text-xs font-bold text-[#D4AF37] hidden sm:inline">Tap to call</span>
          </a>

          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-200 hover:border-[#D4AF37]/50 hover:shadow-md transition group"
          >
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:bg-amber-100 transition">
              <Mail className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Email support</p>
              <p className="text-sm font-bold text-slate-900 truncate">{SUPPORT_EMAIL}</p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Bookings: {SUPPORT_EMAIL_BOOKING}</p>
            </div>
          </a>

          <div className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-slate-200">
            <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Registered office</p>
              <p className="text-sm font-bold text-slate-900 leading-snug mt-0.5">{OFFICE_ADDRESS}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={openHelp}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[#0A192F] text-white text-sm font-extrabold hover:bg-[#112240] transition shadow-lg shadow-slate-900/10"
          >
            <MessageCircle className="w-4 h-4 text-[#D4AF37]" />
            Help & FAQs
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </button>

          <p className="text-[11px] text-center text-slate-500 font-medium px-2">
            For urgent booking issues, call us directly for the fastest response.
          </p>
        </div>
      </div>
    </div>
  );
}
