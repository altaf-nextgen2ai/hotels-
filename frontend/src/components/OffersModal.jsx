import React, { useEffect } from 'react';
import { X, Tag, Sparkles, CalendarHeart, ShoppingBag } from 'lucide-react';
import { FESTIVAL_OFFERS_COPY } from '../data/offersContent';

export default function OffersModal({ onClose, onGoHotels }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const copy = FESTIVAL_OFFERS_COPY;

  return (
    <div
      className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="offers-modal-title"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[100dvh] sm:max-h-[calc(100dvh-2rem)] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-br from-[#0A192F] via-[#0F2744] to-[#0A192F] text-white px-5 sm:px-6 py-5 relative shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
            aria-label="Close offers"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-start gap-4 pr-10">
            <div className="w-12 h-12 rounded-2xl bg-[#D4AF37] text-[#0A192F] flex items-center justify-center shrink-0">
              <Tag className="w-6 h-6" strokeWidth={2.25} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37] mb-1">Coming soon</p>
              <h2 id="offers-modal-title" className="text-xl font-extrabold leading-tight">
                {copy.heading}
              </h2>
              <p className="text-sm text-slate-300 mt-1 font-medium">{copy.intro}</p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto overscroll-contain space-y-3 bg-slate-50/80">
          {copy.seasons.map((season) => (
            <div key={season.id} className="bg-white rounded-2xl border border-slate-200 p-4">
              <div className="flex items-center justify-between gap-2 mb-1">
                <h3 className="font-extrabold text-slate-900 text-sm">{season.name}</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
                  {season.when}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">{season.text}</p>
            </div>
          ))}

          <div className="rounded-2xl bg-amber-50 border border-amber-100 p-4 text-xs text-slate-700 font-medium leading-relaxed">
            <p className="flex items-center gap-2 font-extrabold text-slate-900 mb-1.5">
              <Sparkles className="w-4 h-4 text-[#D4AF37]" />
              No live coupon right now
            </p>
            {copy.note}
          </div>

          <p className="flex items-start gap-2 text-[11px] text-slate-500 font-medium px-1">
            <CalendarHeart className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            Follow TRUMITRIP around Diwali, Holi, summer break, and New Year — that is when we drop hotel offers.
          </p>

          <button
            type="button"
            onClick={() => {
              onClose?.();
              onGoHotels?.();
            }}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[#0A192F] text-white text-sm font-extrabold hover:bg-[#112240] transition"
          >
            <ShoppingBag className="w-4 h-4 text-[#D4AF37]" />
            Browse hotels anyway
          </button>
        </div>
      </div>
    </div>
  );
}
