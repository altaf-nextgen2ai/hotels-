import React, { useEffect, useMemo, useState } from 'react';
import { Star, MapPin, ArrowRight, ShieldCheck, Flame } from 'lucide-react';

export default function HotelCard({ hotel, onSelectHotel, layout = 'list' }) {
  const isGrid = layout === 'grid';
  const photos = useMemo(() => {
    const unique = [];
    [hotel.main_image, ...(hotel.gallery_images || [])].forEach((src) => {
      if (src && !unique.includes(src)) unique.push(src);
    });
    return unique;
  }, [hotel.main_image, hotel.gallery_images]);
  const [photoIndex, setPhotoIndex] = useState(0);

  useEffect(() => {
    setPhotoIndex(0);
  }, [hotel.id]);

  useEffect(() => {
    if (photos.length < 2) return undefined;
    const timer = window.setInterval(() => {
      setPhotoIndex((current) => (current + 1) % photos.length);
    }, 2000);
    return () => window.clearInterval(timer);
  }, [photos.length]);

  const activePhoto = photos[photoIndex] || hotel.main_image;

  // Helper for Agoda-style rating category text
  const getRatingLabel = (score) => {
    if (score >= 4.8) return 'Exceptional';
    if (score >= 4.5) return 'Superb';
    if (score >= 4.0) return 'Very Good';
    return 'Good';
  };

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex group relative ${isGrid ? 'h-full flex-col' : 'flex-col md:h-[280px] md:flex-row'}`}>
      
      {/* Image Banner Container */}
      <div className={`relative w-full h-48 overflow-hidden shrink-0 ${isGrid ? 'sm:h-52' : 'md:h-full md:w-2/5'}`}>
        {photos.map((src, idx) => (
          <img
            key={`${hotel.id}-${idx}`}
            src={src}
            alt={`${hotel.name} photo ${idx + 1}`}
            className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-700 ${
              idx === photoIndex ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ))}
        {!photos.length && (
          <img src={activePhoto} alt={hotel.name} className="h-full w-full object-cover object-center" />
        )}
        {photos.length > 1 && (
          <div className="absolute bottom-3 right-3 z-10 flex gap-1">
            {photos.map((_, idx) => (
              <span
                key={`dot-${idx}`}
                className={`h-1.5 rounded-full transition-all ${
                  idx === photoIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/50'
                }`}
              />
            ))}
          </div>
        )}

        {/* Star Rating Overlay */}
        <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-md text-white text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 border border-white/10">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span>{hotel.star_rating} Star Luxury</span>
        </div>
      </div>

      {/* Details Body */}
      <div className={`p-5 flex flex-1 flex-col justify-between bg-slate-50/40 ${isGrid ? '' : 'md:w-3/5'}`}>
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
