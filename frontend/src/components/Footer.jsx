import React from 'react';
import Logo from './Logo';
import { ShieldCheck, Phone, Mail, MapPin, Heart } from 'lucide-react';

export default function Footer({ onNavigateView }) {
  return (
    <footer className="bg-[#0A192F] text-white">
      
      {/* Footer Payment Banner matching Image 1 */}
      <div className="border-b border-slate-800 bg-[#0F172A] py-6 px-4 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          
          {/* Security Badge */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="font-extrabold text-sm text-white">Secure Payments</p>
              <p className="text-xs text-slate-400 font-medium">Your payment information is safe and encrypted</p>
            </div>
          </div>

          {/* Payment Method Badges */}
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-black tracking-widest text-slate-300">
            <span className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 font-serif italic text-blue-400">VISA</span>
            <span className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-rose-400">mastercard</span>
            <span className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-emerald-400">UPI</span>
            <span className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-orange-400">RuPay</span>
            <span className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-sky-400">AMERICAN EXPRESS</span>
            <span className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-cyan-400">Paytm</span>
          </div>

        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
        
        {/* Col 1: Brand & Bio */}
        <div className="space-y-4">
          <Logo size="medium" light={true} />
          <p className="text-xs text-slate-300 leading-relaxed font-medium">
            TRUMITRIP is India’s premier luxury and budget hotel booking portal offering guaranteed lowest rates, instant confirmations, and 24/7 travel support.
          </p>
        </div>

        {/* Col 2: Quick Links */}
        <div>
          <h4 className="font-extrabold text-sm text-[#D4AF37] uppercase tracking-wider mb-4">Top Destinations</h4>
          <ul className="space-y-2 text-xs font-medium text-slate-300">
            <li><a href="#goa" className="hover:text-[#D4AF37] transition">Hotels in Goa</a></li>
            <li><a href="#dubai" className="hover:text-[#D4AF37] transition">Hotels in Dubai</a></li>
            <li><a href="#manali" className="hover:text-[#D4AF37] transition">Hotels in Manali</a></li>
            <li><a href="#paris" className="hover:text-[#D4AF37] transition">Hotels in Paris</a></li>
            <li><a href="#singapore" className="hover:text-[#D4AF37] transition">Hotels in Singapore</a></li>
          </ul>
        </div>

        {/* Col 3: Company */}
        <div>
          <h4 className="font-extrabold text-sm text-[#D4AF37] uppercase tracking-wider mb-4">Customer Support</h4>
          <ul className="space-y-2 text-xs font-medium text-slate-300">
            <li><a href="#help" className="hover:text-[#D4AF37] transition">24/7 Help & FAQs</a></li>
            <li><a href="#cancellation" className="hover:text-[#D4AF37] transition">Cancellation & Refund Policy</a></li>
            <li><a href="#terms" className="hover:text-[#D4AF37] transition">Terms & Conditions</a></li>
            <li><a href="#privacy" className="hover:text-[#D4AF37] transition">Privacy Policy</a></li>
            <li>
              <button 
                onClick={() => onNavigateView && onNavigateView('partner')}
                className="hover:text-[#D4AF37] text-emerald-400 font-bold transition text-left"
              >
                Hotel Partner Portal (Register Hotel)
              </button>
            </li>
          </ul>
        </div>

        {/* Col 4: Contact Info */}
        <div>
          <h4 className="font-extrabold text-sm text-[#D4AF37] uppercase tracking-wider mb-4">Contact TRUMITRIP</h4>
          <div className="space-y-3 text-xs font-medium text-slate-300">
            <p className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#D4AF37]" />
              <span>1800-270-0297 (Toll Free)</span>
            </p>
            <p className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#D4AF37]" />
              <span>support@trumitrip.com</span>
            </p>
            <p className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#D4AF37]" />
              <span>TRUMITRIP Towers, Corporate Hub, India</span>
            </p>
          </div>
        </div>

      </div>

      {/* Copyright */}
      <div className="border-t border-slate-800 text-center py-4 text-xs text-slate-500 font-semibold">
        © {new Date().getFullYear()} TRUMITRIP. All rights reserved. Designed for Online Hotel Booking Platform.
      </div>

    </footer>
  );
}
