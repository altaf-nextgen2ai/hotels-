import React from 'react';
import Logo from './Logo';
import { ShieldCheck, Phone, Mail, MapPin } from 'lucide-react';
import { LANSDOWNE_SEO_PAGES } from '../data/lansdowneSeoPages';
import { DESTINATION_PAGES } from '../data/destinationPages';
import { POLICY_PAGES } from '../data/policyPages';

const SUPPORT_PHONE = '8447151225';
const SUPPORT_PHONE_DISPLAY = '+91 8447151225';
const OFFICE_ADDRESS = 'Deevika Tower, Chandan Nagar, Ghaziabad';

const POLICY_BY_TITLE = {
  help: 'help-faqs',
  cancellation: 'cancellation-refund-policy',
  terms: 'terms-and-conditions',
  privacy: 'privacy-policy',
};

export default function Footer({ onNavigateView, onNavigatePath }) {
  const goPath = (path) => {
    if (onNavigatePath) {
      onNavigatePath(path);
      return;
    }
    window.location.href = path;
  };

  const goPolicy = (key) => {
    const slug = POLICY_BY_TITLE[key];
    if (slug) goPath(`/${slug}/`);
  };

  return (
    <footer className="bg-[#0A192F] text-white w-full">
      
      <div className="border-b border-slate-800 bg-[#0F172A] py-6 px-4 md:px-8 lg:px-14">
        <div className="w-full flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="font-extrabold text-sm text-white">Secure Payments</p>
              <p className="text-xs text-slate-400 font-medium">Your payment information is safe and encrypted</p>
            </div>
          </div>

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

      <div className="w-full px-4 md:px-8 lg:px-14 py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
        
        <div className="space-y-4">
          <button type="button" onClick={() => (onNavigatePath ? onNavigatePath('/') : onNavigateView?.('customer'))} className="text-left">
            <Logo size="medium" light={true} />
          </button>
          <p className="text-xs text-slate-300 leading-relaxed font-medium">
            TRUMITRIP is India’s premier luxury and budget hotel booking portal offering guaranteed lowest rates, instant confirmations, and 24/7 travel support.
          </p>
        </div>

        <div>
          <h4 className="font-extrabold text-sm text-[#D4AF37] uppercase tracking-wider mb-4">Top Destinations</h4>
          <ul className="space-y-2 text-xs font-medium text-slate-300">
            {DESTINATION_PAGES.map((destination) => (
              <li key={destination.slug}>
                <button
                  type="button"
                  onClick={() => goPath(`/${destination.slug}/`)}
                  className="hover:text-[#D4AF37] transition text-left"
                >
                  {destination.title}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-extrabold text-sm text-[#D4AF37] uppercase tracking-wider mb-4">Customer Support</h4>
          <ul className="space-y-2 text-xs font-medium text-slate-300">
            <li>
              <button type="button" onClick={() => goPolicy('help')} className="hover:text-[#D4AF37] transition text-left">
                24/7 Help & FAQs
              </button>
            </li>
            <li>
              <button type="button" onClick={() => goPolicy('cancellation')} className="hover:text-[#D4AF37] transition text-left">
                Cancellation & Refund Policy
              </button>
            </li>
            <li>
              <button type="button" onClick={() => goPolicy('terms')} className="hover:text-[#D4AF37] transition text-left">
                Terms & Conditions
              </button>
            </li>
            <li>
              <button type="button" onClick={() => goPolicy('privacy')} className="hover:text-[#D4AF37] transition text-left">
                Privacy Policy
              </button>
            </li>
            <li>
              <button 
                type="button"
                onClick={() => onNavigateView && onNavigateView('become-partner')}
                className="hover:text-[#D4AF37] text-emerald-400 font-bold transition text-left"
              >
                Hotel Partner Portal (Register Hotel)
              </button>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-extrabold text-sm text-[#D4AF37] uppercase tracking-wider mb-4">Contact TRUMITRIP</h4>
          <div className="space-y-3 text-xs font-medium text-slate-300">
            <p className="flex items-start gap-2">
              <Phone className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
              <a href={`tel:+91${SUPPORT_PHONE}`} className="hover:text-[#D4AF37] transition">
                {SUPPORT_PHONE_DISPLAY}
              </a>
            </p>
            <p className="flex items-start gap-2">
              <Mail className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
              <span className="leading-relaxed">
                <a href="mailto:support@trumitrip.com" className="hover:text-[#D4AF37] block">support@trumitrip.com</a>
                <a href="mailto:info@trumitrip.com" className="hover:text-[#D4AF37] block">info@trumitrip.com</a>
                <a href="mailto:booking@trumitrip.com" className="hover:text-[#D4AF37] block">booking@trumitrip.com</a>
              </span>
            </p>
            <p className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
              <span>{OFFICE_ADDRESS}</span>
            </p>
          </div>
        </div>

      </div>

      <section className="border-t border-slate-800 w-full">
        <div className="w-full px-4 md:px-8 lg:px-14 py-8">
          <h4 className="font-extrabold text-sm text-[#D4AF37] uppercase tracking-wider mb-5">
            Lansdowne Hotel Guides
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-2">
            {Array.from({ length: 3 }, (_, columnIndex) => (
              <ul key={columnIndex} className="space-y-2 text-xs font-medium text-slate-300">
                {LANSDOWNE_SEO_PAGES.slice(columnIndex * 6, (columnIndex + 1) * 6).map((page) => (
                  <li key={page.slug}>
                    <a href={`/${page.slug}/`} className="hover:text-[#D4AF37] transition">
                      {page.title.split('|')[0].trim()}
                    </a>
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
      </section>

      <div className="border-t border-slate-800 text-center py-4 text-xs text-slate-500 font-semibold w-full">
        © {new Date().getFullYear()} TRUMITRIP. All rights reserved.
        {' '}
        {POLICY_PAGES.map((page, index) => (
          <span key={page.slug}>
            {index > 0 && ' · '}
            <button type="button" onClick={() => goPath(`/${page.slug}/`)} className="hover:text-[#D4AF37]">
              {page.title}
            </button>
          </span>
        ))}
      </div>

    </footer>
  );
}
