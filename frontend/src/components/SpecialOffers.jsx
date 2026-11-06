import React, { useState } from 'react';
import { Copy, Check, Sparkles } from 'lucide-react';

export default function SpecialOffers({ coupons = [], onApplyOffer }) {
  const [copiedCode, setCopiedCode] = useState(null);

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    if (onApplyOffer) onApplyOffer(code);
    setTimeout(() => setCopiedCode(null), 3000);
  };

  if (!coupons.length) return null;

  return (
    <div className="bg-amber-50/50 py-10 border-y border-amber-100">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="w-5 h-5 text-amber-600" />
          <h2 className="text-xl font-bold text-slate-900">Exclusive TRUMITRIP Offers & Deals</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {coupons.map((coupon) => (
            <div 
              key={coupon.id}
              className="bg-white rounded-2xl p-5 border border-amber-200 shadow-sm hover:shadow-md transition relative flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                    TRUMITRIP OFFER
                  </span>
                </div>
                <h3 className="font-extrabold text-slate-900 text-base mb-1">{coupon.discount_percent}% OFF on your booking</h3>
                <p className="text-xs text-slate-500 font-medium mb-3">
                  Save up to ₹{Number(coupon.max_discount || 0).toLocaleString('en-IN')}
                  {Number(coupon.min_order) > 0 && ` on bookings of ₹${Number(coupon.min_order).toLocaleString('en-IN')} or more`}.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">USE CODE</p>
                  <p className="text-sm font-black text-amber-600 tracking-wider">{coupon.code}</p>
                </div>
                <button 
                  onClick={() => handleCopy(coupon.code)}
                  className="flex items-center gap-1.5 bg-[#0F172A] text-white hover:bg-slate-800 text-xs font-bold px-3 py-1.5 rounded-lg transition"
                >
                  {copiedCode === coupon.code ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
