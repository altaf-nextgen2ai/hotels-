import React from 'react';
import { Star, MapPin, Sparkles, ArrowRight, ShieldCheck, Flame, Tag, CheckCircle2, Gift } from 'lucide-react';

export default function HotelCard({ hotel, onSelectHotel }) {
  const discountPercent = Math.round(((hotel.original_price - hotel.price_per_night) / hotel.original_price) * 100);

  // Helper for Agoda-style rating category text
  const getRatingLabel = (score) => {
    if (score >= 4.8) return 'Exceptional';
    if (score >= 4.5) return 'Superb';
    if (score >= 4.0) return 'Very Good';
    return 'Good';
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col md:flex-row group relative md:h-[280px]">
      
      {/* Image Banner Container */}
      <div className="relative w-full h-48 md:w-2/5 md:h-full overflow-hidden shrink-0">
        <img 
          src={hotel.main_image} 
          alt={hotel.name} 
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
        />

        {/* Agoda Style Badges Overlay */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {/* Bundle & Save Badge */}
          <span className="bg-gradient-to-r from-red-600 to-amber-500 text-white text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider flex items-center gap-1 shadow-md">
            <Gift className="w-3 h-3 text-yellow-200" />
            BUNDLE & SAVE UP TO 25%
          </span>

          {/* Member Special Deal */}
          {hotel.is_featured && (
            <span className="bg-slate-900/90 text-amber-300 border border-amber-500/40 text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider flex items-center gap-1 backdrop-blur-md shadow-md">
              <Sparkles className="w-3 h-3 text-amber-400" />
              AGODA VIP MEMBER DEAL
            </span>
          )}

          {discountPercent > 0 && (
            <span className="bg-emerald-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-md shadow-sm w-fit">
              {discountPercent}% CHEAPER TODAY
            </span>
          )}
        </div>

        {/* Star Rating Overlay */}
        <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-md text-white text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 border border-white/10">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span>{hotel.star_rating} Star Luxury</span>
        </div>
      </div>

      {/* Details Body */}
      <div className="p-5 md:w-3/5 flex flex-col justify-between bg-slate-50/40">
        <div>
          {/* Top Info & Agoda Rating Badge */}
          <div className="flex justify-between items-start gap-3">
            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-900 leading-tight group-hover:text-blue-600 transition duration-200">
                {hotel.name}
              </h3>
              <div className="flex items-center gap-1 text-slate-600 text-xs font-semibold">
                <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="truncate">{hotel.address}</span>
              </div>
            </div>

            {/* Agoda Signature Blue Rating Box */}
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl p-2 shrink-0">
              <div className="text-right">
                <p className="text-xs font-black text-blue-900 leading-none">{getRatingLabel(hotel.rating_score)}</p>
                <p className="text-[9px] font-bold text-slate-500 mt-0.5">{hotel.review_count} reviews</p>
              </div>
              <div className="bg-blue-600 text-white font-black text-sm px-2.5 py-1 rounded-lg shadow-sm">
                {hotel.rating_score}
              </div>
            </div>
          </div>

          {/* Agoda Urgency Message */}
          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-lg w-fit">
            <Flame className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
            <span>High demand! 4 travelers viewing this property right now</span>
          </div>

          {/* Key Selling Points / Features */}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-emerald-700 font-bold">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              FREE Cancellation
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Pay at Hotel Available
            </span>
          </div>

          {/* Amenities Badges */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {(hotel.amenities || []).slice(0, 4).map((amenity, idx) => (
              <span 
                key={idx} 
                className="bg-white border border-slate-200 text-slate-700 text-[10px] font-bold px-2.5 py-0.5 rounded-md shadow-2xs"
              >
                {amenity}
              </span>
            ))}
            {(hotel.amenities || []).length > 4 && (
              <span className="bg-slate-200/80 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-md">
                +{(hotel.amenities || []).length - 4} more
              </span>
            )}
          </div>
        </div>

        {/* Agoda Pricing & CTA Footer */}
        <div className="mt-5 pt-3 border-t border-slate-200/80 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-slate-400 text-xs line-through font-semibold">
              <span>Original Rack Rate:</span>
              <span>₹{Number(hotel.original_price).toLocaleString('en-IN')}</span>
            </div>
            
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xs font-bold text-slate-600">₹</span>
              <span className="text-2xl font-black text-rose-600 tracking-tight">
                {Number(hotel.price_per_night).toLocaleString('en-IN')}
              </span>
              <span className="text-[11px] text-slate-500 font-bold">/ night</span>
            </div>

            <p className="text-[10px] text-slate-500 font-medium mt-0.5">
              + ₹{Math.round(hotel.price_per_night * 0.12).toLocaleString('en-IN')} taxes & fees included
            </p>
          </div>

          <button 
            onClick={() => onSelectHotel(hotel)}
            className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-extrabold text-xs py-3 px-5 rounded-xl transition duration-200 shadow-md flex items-center gap-1.5 group-hover:scale-102"
          >
            <span>Select Room</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}

