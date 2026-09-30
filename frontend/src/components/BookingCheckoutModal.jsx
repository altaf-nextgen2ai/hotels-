import React, { useState } from 'react';
import { X, Check, ShieldCheck, Tag, Sparkles, CreditCard, User, Mail, Phone, FileText } from 'lucide-react';
import { apiService } from '../services/api';

export default function BookingCheckoutModal({ hotel, room, searchDetails, currentUser, onClose, onProceedToPayment }) {
  if (!hotel || !room) return null;

  const [guestName, setGuestName] = useState(currentUser?.name || '');
  const [guestEmail, setGuestEmail] = useState(currentUser?.email || '');
  const [guestPhone, setGuestPhone] = useState(currentUser?.phone || '');
  const [specialRequests, setSpecialRequests] = useState('');
  const [needGst, setNeedGst] = useState(false);
  const [gstNumber, setGstNumber] = useState('');

  const [couponCode, setCouponCode] = useState('TRUMI10');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  // Nights calculation
  const nights = 1;
  const roomPrice = room.price_per_night;
  const baseTotal = roomPrice * nights;
  const taxAmount = Math.round(baseTotal * 0.18);
  const discountAmount = appliedCoupon ? appliedCoupon.discount_amount : 0;
  const finalTotal = Math.max(0, baseTotal + taxAmount - discountAmount);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setIsValidatingCoupon(true);
    setCouponError('');
    
    const result = await apiService.validateCoupon(couponCode, baseTotal);
    setIsValidatingCoupon(false);

    if (result.valid) {
      setAppliedCoupon(result);
      setCouponError('');
    } else {
      setAppliedCoupon(null);
      setCouponError(result.message || 'Invalid coupon code');
    }
  };

  const handleSubmitCheckout = (e) => {
    e.preventDefault();
    if (!guestName || !guestEmail || !guestPhone) {
      alert('Please fill all required guest details.');
      return;
    }

    const bookingPayload = {
      guest_name: guestName,
      guest_email: guestEmail,
      guest_phone: guestPhone,
      hotel_id: hotel.id,
      room_id: room.id,
      check_in: searchDetails?.checkIn || '2026-08-20',
      check_out: searchDetails?.checkOut || '2026-08-21',
      rooms_count: 1,
      guests_count: searchDetails?.guests || 2,
      total_price: finalTotal,
      discount_amount: discountAmount,
      coupon_code: appliedCoupon ? appliedCoupon.code : '',
      special_requests: specialRequests + (needGst ? ` [GST: ${gstNumber}]` : '')
    };

    onProceedToPayment(bookingPayload, hotel, room);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 my-8">
        
        {/* Header */}
        <div className="bg-[#0F172A] text-white px-6 py-4 flex justify-between items-center border-b border-slate-800">
          <div>
            <h2 className="text-lg font-extrabold text-[#D4AF37]">Guest Checkout & Booking Confirmation</h2>
            <p className="text-xs text-slate-300 font-medium">{hotel.name} • {room.room_type}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center font-bold text-slate-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmitCheckout} className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Left Column: Guest Info Form */}
          <div className="md:col-span-7 space-y-4">
            <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-[#D4AF37]" />
              <span>Enter Guest Details</span>
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name (Matching Govt ID) *</label>
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
                <User className="w-4 h-4 text-slate-400" />
                <input 
                  type="text"
                  required
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full bg-transparent text-xs font-bold text-slate-800 focus:outline-none"
                  placeholder="e.g. Altaf Fateh"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <input 
                    type="email"
                    required
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    className="w-full bg-transparent text-xs font-bold text-slate-800 focus:outline-none"
                    placeholder="name@domain.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Phone *</label>
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <input 
                    type="tel"
                    required
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    className="w-full bg-transparent text-xs font-bold text-slate-800 focus:outline-none"
                    placeholder="+91 9876543210"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Special Requests (Optional)</label>
              <textarea 
                rows="2"
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:outline-none"
                placeholder="e.g. High floor room, late check-in, honeymoon setup..."
              />
            </div>

            {/* GST Checkbox */}
            <div className="pt-2">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={needGst}
                  onChange={(e) => setNeedGst(e.target.checked)}
                  className="rounded accent-[#D4AF37]"
                />
                <span>I need a GST Invoice for business tax claim</span>
              </label>

              {needGst && (
                <input 
                  type="text"
                  placeholder="Enter 15-digit GSTIN (e.g. 27AAAAA0000A1Z5)"
                  value={gstNumber}
                  onChange={(e) => setGstNumber(e.target.value)}
                  className="w-full mt-2 bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-mono"
                />
              )}
            </div>

            {/* Promo Code Engine */}
            <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 mt-4">
              <label className="block text-xs font-extrabold text-amber-900 mb-1 flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-amber-600" />
                <span>Apply Promo Coupon</span>
              </label>
              
              <div className="flex gap-2">
                <input 
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Enter TRUMI10 or LUXURY25"
                  className="flex-1 bg-white border border-amber-300 text-xs font-bold text-slate-800 px-3 py-2 rounded-xl focus:outline-none uppercase"
                />
                <button 
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={isValidatingCoupon}
                  className="bg-[#0F172A] text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-slate-800 transition"
                >
                  {isValidatingCoupon ? 'Checking...' : 'Apply'}
                </button>
              </div>

              {appliedCoupon && (
                <div className="mt-2 text-xs font-bold text-emerald-700 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>{appliedCoupon.message}</span>
                </div>
              )}
              {couponError && (
                <p className="mt-2 text-xs font-bold text-rose-600">{couponError}</p>
              )}
            </div>

          </div>

          {/* Right Column: Order Summary */}
          <div className="md:col-span-5 bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col justify-between">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider mb-3">
                Fare Breakdown
              </h3>

              <div className="space-y-2 text-xs font-medium text-slate-700">
                <div className="flex justify-between">
                  <span>Room Charge ({nights} Night)</span>
                  <span className="font-bold">₹{baseTotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST & Hospitality Taxes (18%)</span>
                  <span className="font-bold">₹{taxAmount.toLocaleString('en-IN')}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Coupon Savings ({appliedCoupon.code})</span>
                    <span>-₹{discountAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="border-t border-slate-200 pt-3 mt-3 flex justify-between items-baseline text-slate-900">
                  <span className="font-extrabold text-sm">Total Payable</span>
                  <span className="font-black text-xl text-slate-900">₹{finalTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="mt-4 p-3 bg-emerald-100/60 text-emerald-900 text-[11px] font-bold rounded-xl flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
                <span>256-bit SSL Encrypted Secure Checkout</span>
              </div>
            </div>

            <button 
              type="submit"
              className="mt-6 w-full bg-gradient-to-r from-[#D4AF37] via-[#E5C158] to-[#B8860B] text-slate-950 font-extrabold text-sm py-3.5 px-4 rounded-xl hover:brightness-110 shadow-lg transition flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              <span>Proceed to Pay ₹{finalTotal.toLocaleString('en-IN')}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
