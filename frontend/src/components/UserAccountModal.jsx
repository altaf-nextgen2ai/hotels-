import React, { useState, useEffect } from 'react';
import { X, Calendar, Download, AlertTriangle, CheckCircle, RefreshCw, Bookmark, User, Phone, Mail, Loader2 } from 'lucide-react';
import { apiService } from '../services/api';

export default function UserAccountModal({ onClose, currentUser, userBookings, onCancelBooking, onRequireLogin }) {
  const [activeTab, setActiveTab] = useState('bookings');
  const [cancellingId, setCancellingId] = useState(null);
  const [cancellationResult, setCancellationResult] = useState(null);
  const [cancellationError, setCancellationError] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);
  const [downloadError, setDownloadError] = useState('');

  const normalizeStatus = (status) => {
    const value = String(status || '').toUpperCase();
    if (value === 'CUSTOMER_CANCELLED' || value === 'PARTNER_CANCELLED' || value === 'CANCELLED') return 'CANCELLED';
    return value || 'CONFIRMED';
  };

  const isCancelled = (status) => normalizeStatus(status) === 'CANCELLED';

  const getStatusClasses = (status) => {
    const normalized = normalizeStatus(status);
    if (normalized === 'CANCELLED') return 'bg-rose-100 text-rose-700 border border-rose-200';
    if (normalized === 'CONFIRMED') return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
    if (normalized === 'PENDING') return 'bg-amber-100 text-amber-800 border border-amber-200';
    return 'bg-sky-100 text-sky-800 border border-sky-200';
  };

  const formatRefundSummary = (quote) => {
    const fee = Number(quote.cancellation_fee || 0);
    const refund = Number(quote.refund_amount || 0);
    const paid = Number(quote.amount_paid || 0);
    if (refund > 0) {
      return (
        `Amount paid: ₹${paid.toLocaleString('en-IN')}\n` +
        `Cancellation fee (10%): ₹${fee.toLocaleString('en-IN')}\n` +
        `Refund to you (90%): ₹${refund.toLocaleString('en-IN')}\n` +
        `Expected in your account within 2 to 5 working days.`
      );
    }
    return (
      `Amount paid: ₹${paid.toLocaleString('en-IN')}\n` +
      `Cancellation fee: ₹${fee.toLocaleString('en-IN')}\n` +
      'No refund is due for this booking.'
    );
  };

  const handleCancelRequest = async (bookingId) => {
    setCancellationError('');
    const quote = await apiService.getCancellationQuote(bookingId);
    if (quote?.error) {
      if (quote.status === 401) {
        setCancellationError('Your session expired. Please sign in again from the header, then retry cancellation.');
        onRequireLogin?.();
        return;
      }
      setCancellationError(quote.error);
      return;
    }
    if (quote.already_cancelled) {
      setCancellationResult(quote);
      onCancelBooking(quote);
      return;
    }

    const refundMessage = formatRefundSummary(quote);
    if (!window.confirm(`Cancel booking ${bookingId}?\n\n${refundMessage}`)) return;

    setCancellingId(bookingId);
    const res = await apiService.cancelBooking(bookingId);
    setCancellingId(null);

    if (res?.error) {
      if (res.status === 401) {
        setCancellationError('Your session expired. Please sign in again from the header, then retry cancellation.');
        onRequireLogin?.();
        return;
      }
      setCancellationError(res.error);
      return;
    }

    setCancellationResult(res);
    onCancelBooking(res);
  };

  const handleDownloadVoucher = async (bookingId) => {
    setDownloadingId(bookingId);
    setDownloadError('');
    const result = await apiService.downloadVoucher(bookingId);
    setDownloadingId(null);
    if (result?.error) {
      setDownloadError(`Could not download voucher for ${bookingId}: ${result.error}`);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-0 sm:p-4 overflow-hidden">
      <div className="bg-white rounded-none sm:rounded-3xl max-w-full sm:max-w-3xl w-full h-[100dvh] sm:h-auto max-h-[100dvh] sm:max-h-[calc(100dvh-2rem)] shadow-2xl border-0 sm:border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 flex flex-col">
        
        {/* Header */}
        <div className="bg-[#0A192F] text-white px-4 sm:px-6 py-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-[#D4AF37] text-slate-950 font-black text-lg flex items-center justify-center">
              {(currentUser?.name || 'U').split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-extrabold text-white">Guest Profile & My Bookings</h2>
              <p className="text-xs text-slate-300 truncate">{currentUser?.name} • {currentUser?.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center font-bold text-slate-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-4 sm:px-6 bg-slate-50 border-b border-slate-200 flex gap-6 text-xs font-bold text-slate-600 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('bookings')}
            className={`py-3 border-b-2 transition ${activeTab === 'bookings' ? 'border-[#D4AF37] text-slate-950' : 'border-transparent hover:text-slate-900'}`}
          >
            Active Bookings ({userBookings.filter((b) => !isCancelled(b.status)).length})
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`py-3 border-b-2 transition ${activeTab === 'history' ? 'border-[#D4AF37] text-slate-950' : 'border-transparent hover:text-slate-900'}`}
          >
            Cancelled / History ({userBookings.filter((b) => isCancelled(b.status)).length})
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 flex-1 min-h-0 overflow-y-auto overscroll-contain">
          
          {cancellationResult && (
            <div className="mb-6 bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-xs text-emerald-900 font-medium flex justify-between items-center">
              <div>
                <p className="font-extrabold text-sm">Booking {cancellationResult.booking_id} cancelled</p>
                <p className="mt-1">Cancellation fee (10%): <strong>₹{Number(cancellationResult.cancellation_fee || 0).toLocaleString('en-IN')}</strong></p>
                {Number(cancellationResult.refund_amount || 0) > 0 ? (
                  <>
                    <p>Refund to you (90%): <strong>₹{Number(cancellationResult.refund_amount).toLocaleString('en-IN')}</strong></p>
                    <p className="mt-1 text-emerald-800">
                      Your refund will be credited within <strong>2 to 5 working days</strong> on your original payment method.
                    </p>
                  </>
                ) : (
                  <p className="mt-1">No refund is due for this booking.</p>
                )}
                <p className="mt-1">Refund status: <strong>{cancellationResult.refund_status === 'PENDING' ? 'REFUND IN PROGRESS' : cancellationResult.refund_status?.replaceAll('_', ' ')}</strong></p>
                {cancellationResult.email_notifications?.guest
                  ? <p className="mt-1">A cancellation confirmation was emailed to you.</p>
                  : cancellationResult.email_notifications
                    ? <p className="mt-1 text-amber-800">Cancellation confirmed, but the email could not be sent. Please contact support if needed.</p>
                    : <p className="mt-1">This cancellation is already recorded.</p>}
              </div>
              <button onClick={() => setCancellationResult(null)} className="text-emerald-700 font-bold underline">Dismiss</button>
            </div>
          )}

          {cancellationError && (
            <div role="alert" className="mb-4 bg-rose-50 border border-rose-200 p-3 rounded-xl text-xs text-rose-800 font-semibold">
              {cancellationError}
            </div>
          )}

          {downloadError && (
            <div className="mb-4 bg-amber-50 border border-amber-200 p-3 rounded-2xl text-xs text-amber-900 font-medium flex justify-between items-center">
              <span>{downloadError}</span>
              <button onClick={() => setDownloadError('')} className="text-amber-700 font-bold underline ml-3">Dismiss</button>
            </div>
          )}
          {/* ACTIVE BOOKINGS */}
          {activeTab === 'bookings' && (
            <div className="space-y-4">
              {userBookings.filter((b) => !isCancelled(b.status)).length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="font-bold text-sm text-slate-600">No Active Bookings Found</p>
                  <p className="text-xs">Search hotels and book your dream vacation today!</p>
                </div>
              ) : (
                userBookings.filter((b) => !isCancelled(b.status)).map((b, idx) => (
                  <div key={idx} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${getStatusClasses(b.status)}`}>
                          {normalizeStatus(b.status)}
                        </span>
                        <h3 className="text-base font-extrabold text-slate-900 mt-1">{b.hotel_name || b.hotel?.name || 'Taj Exotica Resort'}</h3>
                        <p className="text-xs text-slate-500 font-medium">{b.room_name || b.room?.room_type || 'Deluxe Sea View Room'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-400 font-bold uppercase">BOOKING ID</p>
                        <p className="text-sm font-black text-[#D4AF37]">{b.booking_id}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl text-xs font-semibold text-slate-700">
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold">CHECK-IN</p>
                        <p className="font-bold text-slate-900">{b.check_in}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold">CHECK-OUT</p>
                        <p className="font-bold text-slate-900">{b.check_out}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold">AMOUNT PAID</p>
                        <p className="font-extrabold text-emerald-600">₹{Number(b.total_price).toLocaleString('en-IN')}</p>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                      <button 
                        onClick={() => handleDownloadVoucher(b.booking_id)}
                        disabled={downloadingId === b.booking_id}
                        className="bg-slate-100 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-slate-200 transition flex items-center gap-1"
                      >
                        {downloadingId === b.booking_id ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                            <span>Generating PDF...</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-3.5 h-3.5 text-blue-600" />
                            <span>Download Voucher PDF</span>
                          </>
                        )}
                      </button>
                      {['PENDING', 'CONFIRMED'].includes(b.status) && (
                        <button
                          onClick={() => handleCancelRequest(b.booking_id)}
                          disabled={cancellingId === b.booking_id}
                          className="bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-bold px-3 py-1.5 rounded-lg transition disabled:opacity-60"
                        >
                          {cancellingId === b.booking_id ? 'Cancelling...' : 'Cancel Booking'}
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              {userBookings.filter((b) => isCancelled(b.status)).length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-8">No cancelled bookings in history.</p>
              ) : (
                userBookings.filter((b) => isCancelled(b.status)).map((b, idx) => (
                  <div key={idx} className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs flex justify-between items-center opacity-80">
                    <div>
                      <p className="font-bold text-slate-900">{b.hotel_name || 'Taj Exotica'}</p>
                      <p className="text-[11px] text-slate-500">ID: {b.booking_id} • Refund: ₹{Number(b.refund_amount || 0).toLocaleString('en-IN')} · {b.refund_status?.replaceAll('_', ' ') || 'NOT APPLICABLE'}</p>
                      <p className="text-[11px] text-slate-500">Cancellation fee: ₹{Number(b.cancellation_fee || 0).toLocaleString('en-IN')}</p>
                    </div>
                    <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded">CANCELLED</span>
                  </div>
                ))
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
