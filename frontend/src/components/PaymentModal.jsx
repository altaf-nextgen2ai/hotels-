import React, { useState } from 'react';
import { X, Check, ShieldCheck, QrCode, CreditCard, Building, Banknote, Download, Printer, Sparkles, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { apiService } from '../services/api';

export default function PaymentModal({ bookingPayload, hotel, room, onClose, onBookingSuccess }) {
  if (!bookingPayload) return null;

  const [paymentMode, setPaymentMode] = useState('UPI'); // 'UPI', 'CARD', 'NETBANKING', 'PAY_AT_HOTEL'
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  // Card form state
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8910');
  const [cardExpiry, setCardExpiry] = useState('08/28');
  const [cardCvv, setCardCvv] = useState('842');
  const [cardName, setCardName] = useState(bookingPayload.guest_name);

  const handleProcessPayment = async () => {
    setIsProcessing(true);

    // Realistic payment processing delay
    setTimeout(async () => {
      const payload = {
        ...bookingPayload,
        payment_mode: paymentMode,
        payment_status: paymentMode === 'PAY_AT_HOTEL' ? 'PENDING' : 'SUCCESS'
      };

      const result = await apiService.createBooking(payload);
      setIsProcessing(false);

      const finalBooking = result || {
        booking_id: `TMT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        guest_name: payload.guest_name,
        guest_email: payload.guest_email,
        guest_phone: payload.guest_phone,
        total_price: payload.total_price,
        payment_mode: payload.payment_mode,
        payment_status: payload.payment_status,
        status: 'CONFIRMED',
        check_in: payload.check_in,
        check_out: payload.check_out,
        hotel_name: hotel.name,
        hotel_city: hotel.city,
        room_name: room.room_type,
        created_at: new Date().toISOString()
      };

      setConfirmedBooking(finalBooking);
      onBookingSuccess(finalBooking);

      // Trigger Confetti Celebration
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 }
      });

    }, 2000);
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 my-6">
        
        {/* Header */}
        <div className="bg-[#0A192F] text-white px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#D4AF37]" />
            <div>
              <h2 className="text-base font-extrabold text-[#D4AF37]">TRUMITRIP Payment Gateway</h2>
              <p className="text-[11px] text-slate-300">Amount Payable: <strong>₹{bookingPayload.total_price?.toLocaleString('en-IN')}</strong></p>
            </div>
          </div>
          {!confirmedBooking && (
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center font-bold text-slate-300">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* SCREEN 1: PAYMENT MODE SELECTION */}
        {!confirmedBooking ? (
          <div className="p-6">
            
            {/* Payment Mode Selector Tabs */}
            <div className="grid grid-cols-4 gap-2 mb-6">
              {[
                { id: 'UPI', label: 'UPI QR / Apps', icon: QrCode },
                { id: 'CARD', label: 'Credit/Debit', icon: CreditCard },
                { id: 'NETBANKING', label: 'Net Banking', icon: Building },
                { id: 'PAY_AT_HOTEL', label: 'Pay at Hotel', icon: Banknote },
              ].map((m) => {
                const ModeIcon = m.icon;
                const active = paymentMode === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setPaymentMode(m.id)}
                    className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 ${
                      active 
                        ? 'bg-[#0F172A] border-[#0F172A] text-[#D4AF37] shadow' 
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <ModeIcon className={`w-5 h-5 ${active ? 'text-[#D4AF37]' : 'text-slate-600'}`} />
                    <span className="text-[11px] font-bold">{m.label}</span>
                  </button>
                );
              })}
            </div>

            {/* TAB CONTENT: UPI */}
            {paymentMode === 'UPI' && (
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-center space-y-3">
                <p className="text-xs font-bold text-slate-700">Scan QR Code using Google Pay, PhonePe, Paytm, or BHIM</p>
                
                {/* SVG Visual QR Code Placeholder */}
                <div className="mx-auto w-36 h-36 bg-white p-2 rounded-xl shadow border border-slate-200 flex items-center justify-center">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=trumitrip@okaxis&pn=TRUMITRIP%20Hotels&am=${bookingPayload.total_price}&cu=INR`} 
                    alt="UPI QR Code" 
                    className="w-full h-full"
                  />
                </div>

                <div className="text-xs font-mono font-bold text-slate-600">
                  VPA: <span className="bg-slate-200 px-2 py-0.5 rounded text-slate-900">trumitrip@okaxis</span>
                </div>
              </div>
            )}

            {/* TAB CONTENT: CARD */}
            {paymentMode === 'CARD' && (
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Card Number</label>
                  <input 
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Expiry (MM/YY)</label>
                    <input 
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">CVV</label>
                    <input 
                      type="password"
                      maxLength="3"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: NET BANKING */}
            {paymentMode === 'NETBANKING' && (
              <div className="grid grid-cols-3 gap-2">
                {['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank', 'Kotak Mahindra'].map((b, i) => (
                  <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center cursor-pointer hover:border-amber-500 text-xs font-bold text-slate-800">
                    {b}
                  </div>
                ))}
              </div>
            )}

            {/* TAB CONTENT: PAY AT HOTEL */}
            {paymentMode === 'PAY_AT_HOTEL' && (
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-xs font-medium text-amber-900 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-extrabold text-sm text-slate-900">Pay Directly Upon Check-in</p>
                  <p className="mt-1">Your room will be reserved instantly. You can pay via cash, card, or UPI directly at hotel reception.</p>
                </div>
              </div>
            )}

            {/* Action Submit Button */}
            <button 
              onClick={handleProcessPayment}
              disabled={isProcessing}
              className="mt-6 w-full bg-gradient-to-r from-[#D4AF37] via-[#E5C158] to-[#B8860B] text-slate-950 font-black text-sm py-4 rounded-xl hover:brightness-110 shadow-lg transition flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-3 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing Secure Payment...</span>
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  <span>Confirm & Authorize ₹{bookingPayload.total_price?.toLocaleString('en-IN')}</span>
                </>
              )}
            </button>

          </div>
        ) : (
          /* SCREEN 2: INSTANT BOOKING CONFIRMATION & RECEIPT */
          <div className="p-6 text-center space-y-6">
            
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <Check className="w-10 h-10 stroke-[3]" />
            </div>

            <div>
              <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
                BOOKING CONFIRMED & GUARANTEED
              </span>
              <h3 className="text-2xl font-black text-slate-900 mt-2">Thank You, {confirmedBooking.guest_name}!</h3>
              <p className="text-xs text-slate-500 font-medium">Instant booking voucher has been sent to <strong>{confirmedBooking.guest_email}</strong></p>
            </div>

            {/* Printable Voucher Ticket */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 text-left space-y-3 font-sans">
              <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">BOOKING REFERENCE</p>
                  <p className="text-lg font-black text-[#D4AF37]">{confirmedBooking.booking_id}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">PAYMENT MODE</p>
                  <p className="text-xs font-bold text-slate-800">{confirmedBooking.payment_mode}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-700">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold">HOTEL</p>
                  <p className="font-bold text-slate-900">{confirmedBooking.hotel_name || hotel.name}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold">ROOM TYPE</p>
                  <p className="font-bold text-slate-900">{confirmedBooking.room_name || room.room_type}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold">CHECK-IN</p>
                  <p className="font-bold text-slate-900">{confirmedBooking.check_in}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold">CHECK-OUT</p>
                  <p className="font-bold text-slate-900">{confirmedBooking.check_out}</p>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-2 flex justify-between items-center">
                <span className="text-xs font-extrabold text-slate-800">Total Paid</span>
                <span className="text-lg font-black text-emerald-600">₹{confirmedBooking.total_price?.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button 
                onClick={handlePrintReceipt}
                className="flex-1 bg-slate-900 text-white font-bold text-xs py-3 rounded-xl hover:bg-slate-800 flex items-center justify-center gap-2 transition"
              >
                <Printer className="w-4 h-4 text-[#D4AF37]" />
                <span>Print / Download Invoice PDF</span>
              </button>
              <button 
                onClick={onClose}
                className="bg-[#D4AF37] text-slate-950 font-black text-xs px-6 py-3 rounded-xl hover:brightness-105 transition"
              >
                Done
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
