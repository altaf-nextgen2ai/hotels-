import React, { useState, useMemo } from 'react';
import { X, Check, ShieldCheck, CreditCard, User, Mail, Phone, Calendar, Moon, BedDouble, Users } from 'lucide-react';

export default function BookingCheckoutModal({ hotel, room, searchDetails, currentUser, onClose, onProceedToPayment, onRequireLogin }) {
  if (!hotel || !room) return null;

  const loggedInCustomer = currentUser?.role === 'CUSTOMER';

  const getToday = () => new Date().toISOString().split('T')[0];
  const getTomorrow = () => {
    const d = new Date(); d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const initCheckIn  = (searchDetails?.checkIn  && searchDetails.checkIn  >= getToday()) ? searchDetails.checkIn  : getToday();
  const initCheckOut = (searchDetails?.checkOut && searchDetails.checkOut > initCheckIn) ? searchDetails.checkOut : getTomorrow();

  const [checkIn,     setCheckIn]     = useState(initCheckIn);
  const [checkOut,    setCheckOut]    = useState(initCheckOut);
  const [roomsCount,  setRoomsCount]  = useState(searchDetails?.rooms  || 1);
  const [guestsCount, setGuestsCount] = useState(searchDetails?.guests || 2);

  const [guestName,       setGuestName]       = useState(currentUser?.name  || '');
  const [guestEmail,      setGuestEmail]       = useState(currentUser?.email || '');
  const [guestPhone,      setGuestPhone]       = useState(currentUser?.phone || '');
  const [specialRequests, setSpecialRequests]  = useState('');

  // ── Live calculations ──────────────────────────────────────────────────────
  const nights = useMemo(() => {
    try {
      const n = Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000);
      return n >= 1 ? n : 1;
    } catch { return 1; }
  }, [checkIn, checkOut]);

  const pricePerNight = room.price_per_night;
  const baseTotal     = pricePerNight * nights * roomsCount;
  const taxAmount     = Math.round(baseTotal * 0.18);
  const finalTotal    = baseTotal + taxAmount;

  const handleCheckInChange = (val) => {
    setCheckIn(val);
    if (val >= checkOut) {
      const d = new Date(val); d.setDate(d.getDate() + 1);
      setCheckOut(d.toISOString().split('T')[0]);
    }
  };

  const prettyDate = (d) => {
    try { return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', weekday: 'short' }); }
    catch { return d; }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!loggedInCustomer) {
      onRequireLogin?.();
      return;
    }
    if (!guestName.trim() || !guestEmail.trim() || !guestPhone.trim()) {
      alert('Please fill all required guest details.');
      return;
    }
    onProceedToPayment({
      hotel:            hotel.id,
      room:             room.id,
      check_in:         checkIn,
      check_out:        checkOut,
      rooms_count:      roomsCount,
      guests_count:     guestsCount,
      total_price:      finalTotal,
      discount_amount:  0,
      coupon_code:      '',
      special_requests: specialRequests.trim(),
      guest_name:       guestName,
      guest_email:      guestEmail,
      guest_phone:      guestPhone,
    }, hotel, room);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-none sm:rounded-3xl max-w-full sm:max-w-2xl md:max-w-3xl w-full shadow-2xl border-0 sm:border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 min-h-screen sm:min-h-0 sm:my-8">

        {/* Header */}
        <div className="bg-[#0F172A] text-white px-4 sm:px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-[#D4AF37]">Complete Your Booking</h2>
            <p className="text-xs text-slate-300 mt-0.5">{hotel.name} &nbsp;·&nbsp; {hotel.city} &nbsp;·&nbsp; {room.room_type}</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 transition min-w-[44px] min-h-[44px]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 flex flex-col md:grid md:grid-cols-12 gap-6">

          {!loggedInCustomer && (
            <div className="md:col-span-12 bg-amber-50 border border-amber-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold text-amber-900">
                You need to sign in before you can pay and confirm this booking.
              </p>
              <button
                type="button"
                onClick={() => onRequireLogin?.()}
                className="text-xs font-bold bg-[#0F172A] text-[#D4AF37] px-3 py-2 rounded-lg hover:brightness-110 transition"
              >
                Sign in now
              </button>
            </div>
          )}

          {/* ── LEFT: Form ── */}
          <div className="md:col-span-7 space-y-4">

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" /> Check-In <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date" required
                  value={checkIn}
                  min={getToday()}
                  onChange={(e) => handleCheckInChange(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-200 hover:border-[#D4AF37] focus:border-[#D4AF37] rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none transition cursor-pointer min-h-[44px]"
                />
                <p className="text-[10px] text-slate-400 mt-1">{prettyDate(checkIn)}</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" /> Check-Out <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date" required
                  value={checkOut}
                  min={(() => { const d = new Date(checkIn); d.setDate(d.getDate()+1); return d.toISOString().split('T')[0]; })()}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-200 hover:border-[#D4AF37] focus:border-[#D4AF37] rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none transition cursor-pointer min-h-[44px]"
                />
                <p className="text-[10px] text-slate-400 mt-1">{prettyDate(checkOut)}</p>
              </div>
            </div>

            {/* Duration pill */}
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-2 bg-[#0F172A] text-[#D4AF37] text-xs font-black px-4 py-1.5 rounded-full">
                <Moon className="w-3.5 h-3.5" />
                {nights} Night{nights !== 1 ? 's' : ''} Stay
              </div>
            </div>

            {/* Rooms & Guests */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                  <BedDouble className="w-3.5 h-3.5 text-slate-400" /> Rooms
                </label>
                <select
                  value={roomsCount}
                  onChange={(e) => setRoomsCount(Number(e.target.value))}
                  className="w-full bg-slate-50 border-2 border-slate-200 hover:border-[#D4AF37] rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none transition min-h-[44px]"
                >
                  {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} Room{n>1?'s':''}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-slate-400" /> Guests
                </label>
                <select
                  value={guestsCount}
                  onChange={(e) => setGuestsCount(Number(e.target.value))}
                  className="w-full bg-slate-50 border-2 border-slate-200 hover:border-[#D4AF37] rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none transition min-h-[44px]"
                >
                  {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n} Guest{n>1?'s':''}</option>)}
                </select>
              </div>
            </div>

            {/* Divider */}
            <hr className="border-slate-200" />

            {/* Guest details */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Full Name (as on Govt ID) <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl focus-within:border-[#D4AF37] transition">
                <User className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text" required
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="e.g. Altaf Mansoori"
                  className="w-full bg-transparent text-xs font-bold text-slate-800 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl focus-within:border-[#D4AF37] transition">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="email" required
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="name@email.com"
                    className="w-full bg-transparent text-xs font-bold text-slate-800 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Mobile Number <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl focus-within:border-[#D4AF37] transition">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="tel" required
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-transparent text-xs font-bold text-slate-800 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Special Requests <span className="text-slate-400 font-normal text-[11px]">(Optional)</span>
              </label>
              <textarea
                rows="2"
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                placeholder="e.g. High floor, late check-in, honeymoon setup..."
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#D4AF37] transition resize-none"
              />
            </div>
          </div>

          {/* ── RIGHT: Fare Summary ── */}
          <div className="md:col-span-5 flex flex-col gap-4">

            {/* Room snapshot */}
            <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Your Selection</p>
              <p className="text-base font-extrabold text-[#D4AF37]">{hotel.name}</p>
              <p className="text-xs text-slate-300">{hotel.city} · {hotel.star_rating}★</p>
              <div className="border-t border-slate-700 pt-2 space-y-1.5 text-xs">
                {[
                  ['Room',      room.room_type],
                  ['Bed',       room.bed_type],
                  ['Check-In',  prettyDate(checkIn)],
                  ['Check-Out', prettyDate(checkOut)],
                  ['Duration',  `${nights} Night${nights !== 1 ? 's' : ''}`],
                  ['Rooms × Guests', `${roomsCount} × ${guestsCount}`],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-slate-400">{label}</span>
                    <span className={`font-bold ${label === 'Duration' ? 'text-[#D4AF37]' : 'text-white'}`}>{val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Fare */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex-1 space-y-2">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">Fare Breakdown</p>
              <div className="space-y-2 text-xs text-slate-700">
                <div className="flex justify-between">
                  <span>₹{pricePerNight.toLocaleString('en-IN')} × {nights}N × {roomsCount}R</span>
                  <span className="font-bold">₹{baseTotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>GST + Tax (18%)</span>
                  <span>+₹{taxAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>
              <div className="border-t-2 border-[#D4AF37] pt-3 flex justify-between items-center">
                <span className="text-sm font-extrabold text-slate-900">Total Payable</span>
                <span className="text-2xl font-black text-slate-900">₹{finalTotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl p-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-[10px] font-bold text-emerald-800">256-bit SSL · Secure Checkout</span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-[#D4AF37] via-[#E5C158] to-[#B8860B] text-slate-950 font-black text-sm py-4 rounded-xl hover:brightness-110 shadow-xl transition flex items-center justify-center gap-2 min-h-[44px]"
            >
              <CreditCard className="w-4 h-4" />
              Proceed to Pay ₹{finalTotal.toLocaleString('en-IN')}
            </button>

            <p className="text-center text-[10px] text-slate-400">
              By continuing you agree to Trumitrip's booking &amp; refund policy.
            </p>
          </div>

        </form>
      </div>
    </div>
  );
}
