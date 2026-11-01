import React, { useState } from 'react';
import { X, Star, MapPin, Check, Shield, Coffee, Users, Bed, Wifi, Clock, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

export default function HotelDetailsModal({ hotel, onClose, onBookRoom }) {
  if (!hotel) return null;

  // Build full gallery — main image first, then gallery images, deduplicated
  const allPhotos = [hotel.main_image, ...(hotel.gallery_images || [])]
    .filter(Boolean)
    .filter((img, idx, arr) => arr.indexOf(img) === idx);

  const [currentIdx,  setCurrentIdx]  = useState(0);
  const [activeTab,   setActiveTab]   = useState('rooms');

  const selectedPhoto = allPhotos[currentIdx] || hotel.main_image;

  const goPrev = () => setCurrentIdx(i => (i - 1 + allPhotos.length) % allPhotos.length);
  const goNext = () => setCurrentIdx(i => (i + 1) % allPhotos.length);

  const rooms = hotel.rooms || [
    {
      id: 101,
      room_type: "Deluxe Sea View Room",
      price_per_night: hotel.price_per_night,
      max_guests: 2,
      bed_type: "1 King Bed",
      inclusions: ["Free Breakfast", "Free Cancellation", "High Speed WiFi"],
      available_count: 5,
      image_url: hotel.main_image
    },
    {
      id: 102,
      room_type: "Executive Luxury Suite",
      price_per_night: Math.round(hotel.price_per_night * 1.6),
      max_guests: 4,
      bed_type: "1 King Bed + 1 Sofa Bed",
      inclusions: ["Free Breakfast & Dinner", "Free Cancellation", "Airport Transfer", "Private Balcony"],
      available_count: 2,
      image_url: hotel.gallery_images?.[1] || hotel.main_image
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
        
        {/* Top Header Bar */}
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-slate-900">{hotel.name}</h2>
              <div className="flex items-center gap-1 bg-amber-50 text-amber-700 text-xs font-bold px-2 py-0.5 rounded border border-amber-200">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span>{hotel.star_rating} Star</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-amber-600" />
              <span>{hotel.address}</span>
            </p>
          </div>

          <button 
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 flex items-center justify-center font-bold transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Photo Gallery Carousel ── */}
        <div className="relative bg-slate-900 border-b border-slate-200">
          {/* Main image */}
          <div className="relative h-64 md:h-96 overflow-hidden">
            {allPhotos.map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt={`${hotel.name} photo ${idx + 1}`}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-400 ${idx === currentIdx ? 'opacity-100' : 'opacity-0'}`}
              />
            ))}

            {/* Prev / Next arrows — only if more than 1 photo */}
            {allPhotos.length > 1 && (
              <>
                <button
                  onClick={goPrev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition z-10"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={goNext}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition z-10"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Counter badge */}
            <div className="absolute bottom-3 right-3 bg-black/60 text-white text-[11px] font-bold px-2.5 py-1 rounded-full z-10">
              {currentIdx + 1} / {allPhotos.length}
            </div>
          </div>

          {/* Thumbnail strip */}
          {allPhotos.length > 1 && (
            <div className="flex gap-2 p-3 overflow-x-auto bg-slate-800">
              {allPhotos.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIdx(idx)}
                  className={`shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition ${
                    idx === currentIdx
                      ? 'border-[#D4AF37] opacity-100'
                      : 'border-transparent opacity-50 hover:opacity-80'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-slate-200 bg-white">
          <div className="flex flex-wrap gap-2 px-4 sm:px-6 py-2 text-sm font-bold text-slate-600">
            <button 
              onClick={() => setActiveTab('rooms')}
              className={`py-2.5 px-2 sm:px-3 rounded-xl border-b-2 transition ${activeTab === 'rooms' ? 'border-[#D4AF37] text-slate-950 bg-amber-50/60' : 'border-transparent hover:text-slate-900 hover:bg-slate-50'}`}
            >
              Available Rooms ({rooms.length})
            </button>
            <button 
              onClick={() => setActiveTab('overview')}
              className={`py-2.5 px-2 sm:px-3 rounded-xl border-b-2 transition ${activeTab === 'overview' ? 'border-[#D4AF37] text-slate-950 bg-amber-50/60' : 'border-transparent hover:text-slate-900 hover:bg-slate-50'}`}
            >
              Overview & Amenities
            </button>
            <button 
              onClick={() => setActiveTab('reviews')}
              className={`py-2.5 px-2 sm:px-3 rounded-xl border-b-2 transition ${activeTab === 'reviews' ? 'border-[#D4AF37] text-slate-950 bg-amber-50/60' : 'border-transparent hover:text-slate-900 hover:bg-slate-50'}`}
            >
              Guest Reviews ({hotel.review_count})
            </button>
            <button 
              onClick={() => setActiveTab('rules')}
              className={`py-2.5 px-2 sm:px-3 rounded-xl border-b-2 transition ${activeTab === 'rules' ? 'border-[#D4AF37] text-slate-950 bg-amber-50/60' : 'border-transparent hover:text-slate-900 hover:bg-slate-50'}`}
            >
              House Rules
            </button>
          </div>
        </div>

        {/* Modal Tab Content */}
        <div className="p-6">
          {/* TAB 1: ROOMS */}
          {activeTab === 'rooms' && (
            <div className="space-y-4">
              {rooms.map((room, idx) => (
                <div key={idx} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-[#D4AF37] transition flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-2 max-w-md">
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                      INSTANT CONFIRMATION
                    </span>
                    <h3 className="text-lg font-extrabold text-slate-900">{room.room_type}</h3>
                    
                    <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-600">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-indigo-600" />
                        <span>Up to {room.max_guests} Guests</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Bed className="w-4 h-4 text-amber-600" />
                        <span>{room.bed_type}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {(room.inclusions || []).map((inc, i) => (
                        <span key={i} className="bg-slate-100 text-slate-700 text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>{inc}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="text-left md:text-right border-t md:border-t-0 pt-3 md:pt-0 w-full md:w-auto flex flex-row md:flex-col justify-between items-center md:items-end">
                    <div>
                      <p className="text-2xl font-black text-slate-900">₹{Number(room.price_per_night).toLocaleString('en-IN')}</p>
                      <p className="text-[11px] text-slate-400 font-medium">per night + taxes</p>
                    </div>
                    
                    <button 
                      onClick={() => onBookRoom(hotel, room)}
                      className="mt-2 bg-gradient-to-r from-[#D4AF37] via-[#E5C158] to-[#B8860B] text-slate-950 font-extrabold text-xs py-3 px-6 rounded-xl hover:brightness-110 shadow-md transition"
                    >
                      Book Room Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h4 className="font-extrabold text-slate-900 text-base mb-2">About {hotel.name}</h4>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">{hotel.description}</p>
              </div>

              <div>
                <h4 className="font-extrabold text-slate-900 text-base mb-3">Popular Property Amenities</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(hotel.amenities || []).map((item, idx) => (
                    <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-2 text-xs font-bold text-slate-800">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: REVIEWS */}
          {activeTab === 'reviews' && (
            <div className="space-y-4">
              {(hotel.reviews || [
                { guest_name: "Vikram Malhotra", rating: 5.0, comment: "Exceeded all expectations! Room service, ocean views, and breakfast buffet were top notch." },
                { guest_name: "Neha Kapoor", rating: 4.8, comment: "Super smooth check-in process with TRUMITRIP. Highly recommended!" }
              ]).map((rev, idx) => (
                <div key={idx} className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-slate-900 text-sm">{rev.guest_name}</span>
                    <div className="flex items-center gap-1 bg-emerald-100 text-emerald-800 font-bold text-xs px-2 py-0.5 rounded">
                      <span>{rev.rating}</span>
                      <Star className="w-3 h-3 fill-emerald-600" />
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 font-medium">{rev.comment}</p>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: HOUSE RULES */}
          {activeTab === 'rules' && (
            <div className="space-y-3 text-xs font-medium text-slate-700">
              <div className="flex items-center gap-2 bg-amber-50 p-3 rounded-xl border border-amber-200 text-amber-900 font-bold">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Check-in: 02:00 PM | Check-out: 11:00 AM</span>
              </div>
              <ul className="space-y-2 list-disc pl-5">
                <li>Valid Passport / Aadhar Card ID required at check-in.</li>
                <li>Free cancellation available up to 24 hours prior to check-in.</li>
                <li>Pets are not allowed in executive dining areas.</li>
                <li>Unmarried couples allowed with valid government ID.</li>
              </ul>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
