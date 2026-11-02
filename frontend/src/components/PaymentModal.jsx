import React, { useState, useEffect } from 'react';
import { X, Check, ShieldCheck, AlertCircle, Loader2, Printer, Moon } from 'lucide-react';
import confetti from 'canvas-confetti';
import { apiService } from '../services/api';

export default function PaymentModal({ bookingPayload, hotel, room, onClose, onBookingSuccess }) {
  if (!bookingPayload) return null;

  const [isProcessing,     setIsProcessing]     = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [errorMsg,         setErrorMsg]         = useState('');

  const nights = (() => {
    try {
      const n = Math.round((new Date(bookingPayload.check_out) - new Date(bookingPayload.check_in)) / 86400000);
      return n >= 1 ? n : 1;
    } catch { return 1; }
  })();

  const prettyDate = (d) => {
    try { return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch { return d; }
  };

  const loadRazorpayScript = () =>
    new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const s = document.createElement('script');
      s.src = 'https://checkout.razorpay.com/v1/checkout.js';
      s.onload  = () => resolve(true);
      s.onerror = () => resolve(false);
      document.body.appendChild(s);
    });

  // Auto-open Razorpay when modal mounts
  useEffect(() => { openRazorpay(); }, []);

  const openRazorpay = async () => {
    setIsProcessing(true);
    setErrorMsg('');

    const loaded = await loadRazorpayScript();
    if (!loaded) {
      setErrorMsg('Razorpay SDK load failed. Check your internet connection.');
      setIsProcessing(false);
      return;
    }

    const orderData = await apiService.createRazorpayOrder(bookingPayload.total_price);
    if (orderData?.error) {
      setErrorMsg(orderData.error);
      setIsProcessing(false);
      return;
    }

    const options = {
      key:         orderData.key_id,
      amount:      orderData.amount,
      currency:    orderData.currency,
      name:        'Trumitrip',
      description: `${hotel.name} — ${room.room_type}`,
      order_id:    orderData.razorpay_order_id,
      prefill: {
        name:    bookingPayload.guest_name  || '',
        email:   bookingPayload.guest_email || '',
        contact: bookingPayload.guest_phone || '',
      },
      theme: { color: '#D4AF37' },

      handler: async (response) => {
        setIsProcessing(true);
        const result = await apiService.verifyRazorpayPayment(
          response.razorpay_order_id,
          response.razorpay_payment_id,
          response.razorpay_signature,
          bookingPayload,
        );
        setIsProcessing(false);
        if (result?.error) { setErrorMsg(result.error); return; }

        const booking = result.booking || {
          booking_id:          `TMT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          guest_name:          bookingPayload.guest_name,
          guest_email:         bookingPayload.guest_email,
          total_price:         bookingPayload.total_price,
          payment_mode:        'RAZORPAY',
          payment_status:      'SUCCESS',
          status:              'CONFIRMED',
          check_in:            bookingPayload.check_in,
          check_out:           bookingPayload.check_out,
          hotel_name:          hotel.name,
          room_name:           room.room_type,
          razorpay_payment_id: response.razorpay_payment_id,
        };
        setConfirmedBooking(booking);
        onBookingSuccess(booking);
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      },

      modal: { ondismiss: () => setIsProcessing(false) },
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', (r) => {
      setIsProcessing(false);
      setErrorMsg(`Payment failed: ${r.error?.description || 'Unknown error'}`);
    });
    setIsProcessing(false);
    rzp.open();
  };

  const handlePayAtHotel = async () => {
    setIsProcessing(true);
    setErrorMsg('');
    const result = await apiService.createBooking({
      ...bookingPayload,
      payment_mode:   'PAY_AT_HOTEL',
      payment_status: 'PENDING',
    });
    setIsProcessing(false);

    const booking = result || {
      booking_id:     `TMT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      guest_name:     bookingPayload.guest_name,
      guest_email:    bookingPayload.guest_email,
      total_price:    bookingPayload.total_price,
      payment_mode:   'PAY_AT_HOTEL',
      payment_status: 'PENDING',
      status:         'CONFIRMED',
      check_in:       bookingPayload.check_in,
      check_out:      bookingPayload.check_out,
      hotel_name:     hotel.name,
      room_name:      room.room_type,
    };
    setConfirmedBooking(booking);
    onBookingSuccess(booking);
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-full sm:max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">

        {/* Header */}
        <div className="bg-[#0A192F] px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-[#D4AF37]" />
            <div>
              <p className="text-sm font-extrabold text-[#D4AF37]">TRUMITRIP Secure Checkout</p>
              <p className="text-[11px] text-slate-300">₹{bookingPayload.total_price?.toLocaleString('en-IN')} · Powered by Razorpay</p>
            </div>
          </div>
          {!confirmedBooking && (
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {!confirmedBooking ? (
          <div className="p-3 sm:p-6 space-y-4">

            {/* Booking summary */}
            <div className="bg-[#0F172A] rounded-2xl p-4 text-white space-y-2.5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-extrabold text-[#D4AF37]">{hotel.name}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{hotel.city} · {room.room_type}</p>
                </div>
                <span className="bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">CONFIRMED</span>
              </div>
              <div className="border-t border-slate-700 pt-2.5 grid grid-cols-2 gap-y-2 text-xs">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Check-In</p>
                  <p className="font-bold text-white">{prettyDate(bookingPayload.check_in)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Check-Out</p>
                  <p className="font-bold text-white">{prettyDate(bookingPayload.check_out)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Duration</p>
                  <p className="font-bold text-[#D4AF37] flex items-center gap-1">
                    <Moon className="w-3 h-3" />{nights} Night{nights !== 1 ? 's' : ''}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Rooms · Guests</p>
                  <p className="font-bold text-white">{bookingPayload.rooms_count}R · {bookingPayload.guests_count}G</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Guest</p>
                  <p className="font-bold text-white">{bookingPayload.guest_name}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Total</p>
                  <p className="text-base font-black text-[#D4AF37]">₹{bookingPayload.total_price?.toLocaleString('en-IN')}</p>
                </div>
              </div>
            </div>

            {/* Loading */}
            {isProcessing && (
              <div className="flex items-center justify-center gap-2 py-3 text-sm font-bold text-slate-500">
                <Loader2 className="w-5 h-5 animate-spin text-[#D4AF37]" />
                Opening Razorpay secure payment...
              </div>
            )}

            {/* Error */}
            {errorMsg && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 font-semibold flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                {errorMsg}
              </div>
            )}

            {/* Buttons — shown after loading or on error */}
            {!isProcessing && (
              <div className="space-y-2">
                <button
                  onClick={openRazorpay}
                  className="w-full bg-gradient-to-r from-[#D4AF37] via-[#E5C158] to-[#B8860B] text-slate-950 font-black text-sm py-4 rounded-xl hover:brightness-110 shadow-lg transition flex items-center justify-center gap-2 min-h-[44px]"
                >
                  <Check className="w-4 h-4" />
                  Pay ₹{bookingPayload.total_price?.toLocaleString('en-IN')} via Razorpay
                </button>
                <button
                  onClick={handlePayAtHotel}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs py-2.5 rounded-xl transition min-h-[44px]"
                >
                  Pay at Hotel instead
                </button>
              </div>
            )}

            <p className="text-center text-[10px] text-slate-400">
              By continuing you agree to Trumitrip's booking &amp; cancellation policy.
            </p>
          </div>

        ) : (
          /* Confirmation */
          <div className="p-4 sm:p-6 text-center space-y-5">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-9 h-9 text-emerald-600 stroke-[3]" />
            </div>
            <div>
              <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-3 py-1 rounded-full uppercase">Booking Confirmed</span>
              <h3 className="text-xl font-black text-slate-900 mt-3">Thank You, {confirmedBooking.guest_name?.split(' ')[0]}!</h3>
              <p className="text-xs text-slate-500 mt-1">Voucher PDF sent to <strong>{confirmedBooking.guest_email}</strong></p>
            </div>
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 text-left space-y-3">
              <div className="flex justify-between pb-3 border-b border-slate-200">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Booking ID</p>
                  <p className="text-xl font-black text-[#D4AF37]">{confirmedBooking.booking_id}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Status</p>
                  <p className="text-xs font-bold text-emerald-600">CONFIRMED</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><p className="text-[10px] text-slate-400 font-bold">HOTEL</p><p className="font-bold">{confirmedBooking.hotel_name || hotel.name}</p></div>
                <div><p className="text-[10px] text-slate-400 font-bold">ROOM</p><p className="font-bold">{confirmedBooking.room_name || room.room_type}</p></div>
                <div><p className="text-[10px] text-slate-400 font-bold">CHECK-IN</p><p className="font-bold">{prettyDate(confirmedBooking.check_in)}</p></div>
                <div><p className="text-[10px] text-slate-400 font-bold">CHECK-OUT</p><p className="font-bold">{prettyDate(confirmedBooking.check_out)}</p></div>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between">
                <span className="text-xs font-extrabold">Total Paid</span>
                <span className="text-lg font-black text-emerald-600">₹{confirmedBooking.total_price?.toLocaleString('en-IN')}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => window.print()} className="flex-1 bg-slate-900 text-white font-bold text-xs py-3 rounded-xl hover:bg-slate-800 flex items-center justify-center gap-2">
                <Printer className="w-4 h-4 text-[#D4AF37]" /> Download PDF
              </button>
              <button onClick={onClose} className="bg-[#D4AF37] text-slate-950 font-black text-xs px-6 py-3 rounded-xl hover:brightness-105">Done</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
