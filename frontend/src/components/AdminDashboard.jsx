import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Archive, BadgeCheck, BarChart3, Building2, CalendarDays, Mail,
  CircleDollarSign, ClipboardList, Eye, Hotel, LoaderCircle, Pencil, Plus,
  RefreshCw, Search, ShieldCheck, Store, TicketPercent, Trash2, UserRound, Users, X
} from 'lucide-react';
import { apiService } from '../services/api';
import { compressImageFile, compressImageFiles } from '../utils/compressImage';

const TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'hotels', label: 'Hotels', icon: Hotel },
  { id: 'vendors', label: 'Vendors', icon: Store },
  { id: 'users', label: 'User profiles', icon: UserRound },
  { id: 'bookings', label: 'Bookings', icon: CalendarDays },
  { id: 'payouts', label: 'Payouts', icon: CircleDollarSign },
  { id: 'coupons', label: 'Coupons', icon: TicketPercent }
];

const HOTEL_IMAGE = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80';
const EMPTY_HOTEL = {
  name: '', city: '', destination: '', address: '', star_rating: 4, rating_score: 0,
  review_count: 0, price_per_night: 1000, original_price: 1000, main_image: HOTEL_IMAGE,
  gallery_images: [], amenities: ['WiFi'], description: '', is_featured: false,
  commission_percent: 10, is_active: true
};
const EMPTY_VENDOR = {
  name: '', email: '', phone: '', password: '', hotel: '', vendor_status: 'APPROVED'
};
const EMPTY_COUPON = {
  code: '', discount_percent: 10, max_discount: 1000, min_order: 0, is_active: true
};

const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;
const dateText = (value) => value ? new Date(value).toLocaleDateString('en-IN') : '—';

function Field({ label, value, onChange, type = 'text', required = false, min, max, step, placeholder }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-bold text-slate-400">{label}</span>
      <input
        type={type}
        required={required}
        min={min}
        max={max}
        step={step}
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400"
      />
    </label>
  );
}

function SelectField({ label, value, onChange, children }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-bold text-slate-400">{label}</span>
      <select
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400"
      >
        {children}
      </select>
    </label>
  );
}

function Modal({ title, onClose, children, wide = false }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <section className={`max-h-[92vh] w-full overflow-y-auto rounded-3xl border border-slate-700 bg-slate-800 p-5 text-white shadow-2xl sm:p-7 ${wide ? 'max-w-4xl' : 'max-w-2xl'}`}>
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-lg font-black">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close dialog" className="rounded-lg p-2 text-slate-400 hover:bg-slate-700 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

function StatusPill({ children, positive = false }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${positive ? 'border-emerald-400/30 bg-emerald-500/15 text-emerald-200' : 'border-amber-400/30 bg-amber-500/15 text-amber-200'}`}>
      {children}
    </span>
  );
}

export default function AdminDashboard({ onRefreshData }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [analytics, setAnalytics] = useState(null);
  const [hotels, setHotels] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [hotelForm, setHotelForm] = useState(null);
  const [vendorForm, setVendorForm] = useState(null);
  const [couponForm, setCouponForm] = useState(null);
  const [vendorProfile, setVendorProfile] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  const reloadAll = useCallback(async () => {
    setLoading(true);
    setError('');
    const [analyticsResult, hotelsResult, vendorsResult, usersResult, bookingsResult, payoutsResult, couponsResult, commissionsResult] = await Promise.all([
      apiService.getAdminAnalytics(),
      apiService.getAdminHotels(),
      apiService.getAdminVendors(),
      apiService.getAdminUsers(),
      apiService.getAdminBookings(),
      apiService.getAdminPayoutsSecure(),
      apiService.getAdminCouponsSecure(),
      apiService.getAdminCommissionsSecure()
    ]);

    const results = [analyticsResult, hotelsResult, vendorsResult, usersResult, bookingsResult, payoutsResult, couponsResult, commissionsResult];
    const firstError = results.find((result) => result?.error)?.error;
    if (firstError) setError(firstError);
    if (analyticsResult && !analyticsResult.error) setAnalytics(analyticsResult);
    if (Array.isArray(hotelsResult)) setHotels(hotelsResult);
    if (Array.isArray(vendorsResult)) setVendors(vendorsResult);
    if (Array.isArray(usersResult)) setUsers(usersResult);
    if (Array.isArray(bookingsResult)) setBookings(bookingsResult);
    if (Array.isArray(payoutsResult)) setPayouts(payoutsResult);
    if (Array.isArray(couponsResult)) setCoupons(couponsResult);
    if (Array.isArray(commissionsResult)) setCommissions(commissionsResult);
    setLoading(false);
  }, []);

  useEffect(() => {
    reloadAll();
  }, [reloadAll]);

  const showMutationResult = async (result, message) => {
    if (result?.error) {
      setError(result.error);
      setNotice('');
      return false;
    }
    setError('');
    setNotice(message);
    await reloadAll();
    if (onRefreshData) onRefreshData();
    return true;
  };

  const filteredVendors = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return vendors;
    return vendors.filter((vendor) =>
      [vendor.name, vendor.email, vendor.phone, vendor.hotel_name, vendor.hotel_city]
        .some((value) => String(value || '').toLowerCase().includes(term))
    );
  }, [search, vendors]);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users;
    return users.filter((user) =>
      [user.name, user.email, user.phone, user.role, user.vendor_status, user.hotel_name]
        .some((value) => String(value || '').toLowerCase().includes(term))
    );
  }, [search, users]);

  const filteredHotels = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return hotels;
    return hotels.filter((hotel) =>
      [hotel.name, hotel.city, hotel.destination, hotel.address]
        .some((value) => String(value || '').toLowerCase().includes(term))
    );
  }, [hotels, search]);

  const saveHotel = async (event) => {
    event.preventDefault();
    setSaving(true);
    const payload = {
      ...hotelForm,
      city: hotelForm.city.trim(),
      destination: (hotelForm.destination || hotelForm.city).trim(),
      name: hotelForm.name.trim(),
      address: hotelForm.address.trim(),
      price_per_night: Number(hotelForm.price_per_night),
      original_price: Number(hotelForm.original_price || hotelForm.price_per_night),
      star_rating: Number(hotelForm.star_rating),
      rating_score: Number(hotelForm.rating_score || 0),
      review_count: Number(hotelForm.review_count || 0),
      commission_percent: Number(hotelForm.commission_percent || 0)
    };
    const result = hotelForm.id
      ? await apiService.updateAdminHotel(hotelForm.id, payload)
      : await apiService.createAdminHotel(payload);
    const success = await showMutationResult(result, hotelForm.id ? 'Hotel details updated.' : 'Hotel added.');
    if (success) setHotelForm(null);
    setSaving(false);
  };

  const toggleHotel = async (hotel) => {
    const result = await apiService.updateAdminHotel(hotel.id, { is_active: !hotel.is_active });
    await showMutationResult(result, hotel.is_active ? 'Hotel archived; booking history is preserved.' : 'Hotel listing restored.');
  };

  const saveVendor = async (event) => {
    event.preventDefault();
    setSaving(true);
    const payload = {
      name: vendorForm.name.trim(),
      email: vendorForm.email.trim(),
      phone: vendorForm.phone.trim(),
      hotel: vendorForm.hotel || null,
      vendor_status: vendorForm.vendor_status
    };
    if (!vendorForm.id) payload.password = vendorForm.password;
    const result = vendorForm.id
      ? await apiService.updateAdminVendor(vendorForm.id, payload)
      : await apiService.createAdminVendor(payload);
    const success = await showMutationResult(result, vendorForm.id ? 'Vendor profile updated.' : 'Vendor account created.');
    if (success) {
      setVendorForm(null);
      setVendorProfile(null);
    }
    setSaving(false);
  };

  const updateVendorStatus = async (vendor, vendor_status) => {
    const result = await apiService.updateAdminVendorStatus(vendor.id, vendor_status);
    await showMutationResult(result, `Vendor ${vendor_status.toLowerCase()}.`);
  };

  const removeVendor = async (vendor) => {
    if (!window.confirm(`Permanently remove ${vendor.name}'s vendor account? Booking history will be retained.`)) return;
    await showMutationResult(await apiService.removeAdminVendor(vendor.id), 'Vendor account removed.');
  };

  const updateBooking = async (booking, status) => {
    const result = await apiService.updateAdminBookingStatus(booking.booking_id, status);
    await showMutationResult(result, `Booking ${booking.booking_id} updated.`);
  };

  const markRefundProcessed = async (booking) => {
    const refundReference = window.prompt(
      `After completing the refund manually, enter its payment/reference ID for ${booking.booking_id}.`
    )?.trim();
    if (!refundReference) return;
    if (!window.confirm(`Confirm that ₹${Number(booking.refund_amount).toLocaleString('en-IN')} was refunded for ${booking.booking_id}?`)) return;
    const result = await apiService.markAdminRefundProcessed(booking.booking_id, refundReference);
    await showMutationResult(result, result?.message || `Refund for ${booking.booking_id} marked as processed.`);
  };

  const retryBookingEmails = async (booking) => {
    const result = await apiService.retryAdminBookingEmails(booking.booking_id);
    await showMutationResult(result, result?.message || 'Booking email retry completed.');
  };

  const updatePayout = async (booking, payout_status) => {
    const result = await apiService.updateAdminPayoutSecure(booking.booking_id, payout_status);
    await showMutationResult(result, `Payout for ${booking.booking_id} updated.`);
  };

  const saveCoupon = async (event) => {
    event.preventDefault();
    setSaving(true);
    const payload = {
      code: couponForm.code.trim().toUpperCase(),
      discount_percent: Number(couponForm.discount_percent),
      max_discount: Number(couponForm.max_discount),
      min_order: Number(couponForm.min_order),
      is_active: Boolean(couponForm.is_active)
    };
    const result = couponForm.id
      ? await apiService.updateAdminCouponSecure(couponForm.id, payload)
      : await apiService.createAdminCouponSecure(payload);
    const success = await showMutationResult(result, couponForm.id ? 'Coupon updated.' : 'Coupon created.');
    if (success) setCouponForm(null);
    setSaving(false);
  };

  const removeCoupon = async (coupon) => {
    if (!window.confirm(`Remove coupon ${coupon.code}?`)) return;
    await showMutationResult(await apiService.removeAdminCoupon(coupon.id), 'Coupon removed.');
  };

  const saveCommission = async (hotelId, value) => {
    const result = await apiService.updateAdminCommissionSecure(hotelId, Number(value));
    await showMutationResult(result, 'Commission rate updated.');
  };

  const metrics = analytics?.metrics || {};
  const monthlyTrends = analytics?.monthly_trends || [];
  const maximumRevenue = Math.max(1, ...monthlyTrends.map((month) => Number(month.revenue || 0)));

  return (
    <main className="admin-dashboard min-h-screen bg-[#f4f6fb] p-0 text-slate-100">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="admin-brand-icon"><ShieldCheck className="h-6 w-6" /></div>
          <div>
            <p className="admin-brand-name">TRUMITRIP</p>
            <p className="admin-brand-caption">ADMIN CONSOLE</p>
          </div>
        </div>
        <p className="admin-nav-heading">WORKSPACE</p>
        <nav className="admin-nav" aria-label="Admin sections">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => { setActiveTab(id); setSearch(''); }}
              aria-current={activeTab === id ? 'page' : undefined}
              className={`admin-nav-item ${activeTab === id ? 'is-active' : ''}`}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <span className="admin-sidebar-status" />
          <span>Management portal</span>
        </div>
      </aside>

      <div className="admin-main">
        <div className="admin-content">
          <header className="admin-topbar">
            <div>
              <p className="admin-eyebrow">TRUMITRIP ADMIN</p>
              <h1>{TABS.find((tab) => tab.id === activeTab)?.label}</h1>
              <p className="admin-topbar-description">Manage inventory, partners, reservations and payouts</p>
            </div>
            <button type="button" onClick={reloadAll} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-600 disabled:opacity-60">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh data
            </button>
          </header>

          {(error || notice) && (
            <div role="status" className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${error ? 'border-rose-500/30 bg-rose-500/10 text-rose-200' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'}`}>
              <span>{error || notice}</span>
              <button type="button" onClick={() => { setError(''); setNotice(''); }} aria-label="Dismiss message"><X className="h-4 w-4" /></button>
            </div>
          )}

        {loading && !analytics && (
          <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-700 bg-slate-800 p-12 text-slate-300">
            <LoaderCircle className="h-5 w-5 animate-spin" /> Loading admin data…
          </div>
        )}

        {activeTab === 'overview' && (
          <section className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: 'Gross booking revenue', value: money(metrics.total_revenue), icon: CircleDollarSign, color: 'text-emerald-300' },
                { label: 'Platform commission', value: money(metrics.total_commission), icon: BarChart3, color: 'text-amber-300' },
                { label: 'Active properties', value: hotels.filter((hotel) => hotel.is_active).length, icon: Building2, color: 'text-sky-300' },
                { label: 'Bookings / partners', value: `${bookings.length} / ${vendors.length}`, icon: Users, color: 'text-indigo-300' }
              ].map(({ label, value, icon: Icon, color }) => (
                <article key={label} className="rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-5 shadow-lg shadow-slate-950/25 ring-1 ring-slate-700/80">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                    <span>{label}</span><Icon className={`h-5 w-5 ${color}`} />
                  </div>
                  <p className={`mt-3 text-2xl font-black ${color}`}>{value}</p>
                </article>
              ))}
            </div>
            <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
              <section className="rounded-3xl border border-slate-700 bg-slate-800 p-5">
                <h2 className="mb-5 flex items-center gap-2 font-black text-white"><BarChart3 className="h-5 w-5 text-amber-300" /> Monthly revenue</h2>
                {monthlyTrends.length ? (
                  <div className="flex h-56 items-end gap-3 overflow-x-auto border-b border-slate-700 pb-2">
                    {monthlyTrends.map((month) => (
                      <div key={month.month} className="flex h-full min-w-12 flex-1 flex-col items-center justify-end gap-2">
                        <span className="text-[10px] text-slate-400">{money(month.revenue)}</span>
                        <div className="w-full max-w-12 rounded-t-lg bg-gradient-to-t from-amber-700 to-amber-300" style={{ height: `${Math.max(3, (Number(month.revenue || 0) / maximumRevenue) * 100)}%` }} />
                        <span className="text-[10px] text-slate-400">{month.month}</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="rounded-xl bg-slate-900/70 p-6 text-sm text-slate-400">No booking revenue recorded yet.</p>}
              </section>
              <section className="rounded-3xl border border-slate-700 bg-slate-800 p-5">
                <h2 className="mb-4 flex items-center gap-2 font-black text-white"><ClipboardList className="h-5 w-5 text-sky-300" /> Latest reservations</h2>
                <div className="space-y-3">
                  {(analytics?.recent_bookings || []).slice(0, 5).map((booking) => (
                    <div key={booking.booking_id} className="flex items-center justify-between gap-3 border-b border-slate-700 pb-3 last:border-0">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-white">{booking.guest_name}</p>
                        <p className="truncate text-xs text-slate-400">{booking.booking_id} · {booking.hotel_name}</p>
                      </div>
                      <span className="shrink-0 text-sm font-black text-emerald-300">{money(booking.total_price)}</span>
                    </div>
                  ))}
                  {!analytics?.recent_bookings?.length && <p className="text-sm text-slate-400">No reservations recorded yet.</p>}
                </div>
              </section>
            </div>
          </section>
        )}

        {activeTab === 'hotels' && (
          <section className="space-y-4">
            <div className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-700 bg-slate-800 p-4 sm:flex-row sm:items-center">
              <div><h2 className="font-black text-white">Property inventory</h2><p className="mt-1 text-xs text-slate-400">Add, edit, archive and restore hotel listings.</p></div>
              <div className="flex flex-wrap gap-2">
                <SearchBox value={search} onChange={setSearch} />
                <button type="button" onClick={() => setHotelForm({ ...EMPTY_HOTEL })} className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-black text-slate-950"><Plus className="h-4 w-4" /> Add hotel</button>
              </div>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {filteredHotels.map((hotel) => (
                <article key={hotel.id} className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-800">
                  <div className="flex gap-4 p-4">
                    <img src={hotel.main_image || HOTEL_IMAGE} alt="" className="h-24 w-28 shrink-0 rounded-xl object-cover" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate font-black text-white">{hotel.name}</h3>
                        <StatusPill positive={hotel.is_active}>{hotel.is_active ? 'Live' : 'Archived'}</StatusPill>
                      </div>
                      <p className="mt-1 truncate text-xs text-slate-400">{hotel.city} · {hotel.star_rating} stars</p>
                      <p className="mt-2 text-sm font-black text-amber-300">{money(hotel.price_per_night)} <span className="font-medium text-slate-400">/ night</span></p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-700 px-4 py-3">
                    <label className="flex items-center gap-2 text-[11px] font-semibold text-slate-400">
                      Commission
                      <input
                        key={`${hotel.id}-${hotel.commission_percent}`}
                        type="number" min="0" max="100" step="0.1" defaultValue={hotel.commission_percent}
                        onBlur={(event) => {
                          const oldValue = Number(hotel.commission_percent);
                          if (Number(event.target.value) !== oldValue) saveCommission(hotel.id, event.target.value);
                        }}
                        className="w-20 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-white"
                      /> %
                    </label>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setHotelForm({ ...EMPTY_HOTEL, ...hotel })} className="rounded-lg bg-slate-700 px-3 py-2 text-xs font-bold text-white hover:bg-slate-600"><Pencil className="mr-1 inline h-3.5 w-3.5" /> Edit</button>
                      <button type="button" onClick={() => toggleHotel(hotel)} className="rounded-lg bg-slate-700 px-3 py-2 text-xs font-bold text-amber-200 hover:bg-slate-600"><Archive className="mr-1 inline h-3.5 w-3.5" /> {hotel.is_active ? 'Archive' : 'Restore'}</button>
                    </div>
                  </div>
                </article>
              ))}
              {!filteredHotels.length && <EmptyState text="No matching properties." />}
            </div>
          </section>
        )}

        {activeTab === 'vendors' && (
          <section className="space-y-4">
            <div className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-700 bg-slate-800 p-4 sm:flex-row sm:items-center">
              <div><h2 className="font-black text-white">Vendor accounts</h2><p className="mt-1 text-xs text-slate-400">Inspect complete partner profiles, assign properties and manage access.</p></div>
              <div className="flex flex-wrap gap-2">
                <SearchBox value={search} onChange={setSearch} />
                <button type="button" onClick={() => setVendorForm({ ...EMPTY_VENDOR, hotel: hotels.find((hotel) => hotel.is_active)?.id || '' })} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-2.5 text-xs font-black text-slate-950"><Plus className="h-4 w-4" /> Add vendor</button>
              </div>
            </div>
            <div className="overflow-x-auto rounded-2xl border border-slate-700 bg-slate-800">
              <table className="w-full min-w-[780px] text-left text-xs">
                <thead className="bg-slate-900 text-[10px] uppercase tracking-wider text-slate-400"><tr>
                  <th className="p-4">Partner</th><th className="p-4">Contact</th><th className="p-4">Assigned property</th><th className="p-4">Status</th><th className="p-4">Profile</th><th className="p-4">Actions</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-700">
                  {filteredVendors.map((vendor) => (
                    <tr key={vendor.id} className="hover:bg-slate-700/30">
                      <td className="p-4 font-bold text-white">{vendor.name}<p className="mt-1 font-normal text-slate-400">Joined {dateText(vendor.created_at)}</p></td>
                      <td className="p-4 text-slate-300">{vendor.email}<p className="mt-1 text-slate-400">{vendor.phone || 'No phone provided'}</p></td>
                      <td className="p-4 text-slate-300">{vendor.hotel_name || 'Not assigned'}{vendor.hotel_city ? <p className="mt-1 text-slate-400">{vendor.hotel_city}</p> : null}</td>
                      <td className="p-4"><StatusPill positive={vendor.vendor_status === 'APPROVED'}>{vendor.vendor_status || 'PENDING'}</StatusPill></td>
                      <td className="p-4"><button type="button" onClick={() => setVendorProfile(vendor)} className="inline-flex items-center gap-1 rounded-lg bg-slate-700 px-3 py-2 font-bold text-sky-200"><Eye className="h-3.5 w-3.5" /> View</button></td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <button type="button" title="Edit vendor" onClick={() => setVendorForm({ ...EMPTY_VENDOR, ...vendor, password: '', hotel: vendor.hotel || '' })} className="rounded-lg p-2 text-slate-300 hover:bg-slate-700"><Pencil className="h-4 w-4" /></button>
                          {vendor.vendor_status !== 'APPROVED' && <button type="button" title="Approve vendor" onClick={() => updateVendorStatus(vendor, 'APPROVED')} className="rounded-lg p-2 text-emerald-300 hover:bg-slate-700"><BadgeCheck className="h-4 w-4" /></button>}
                          <button type="button" title="Remove vendor" onClick={() => removeVendor(vendor)} className="rounded-lg p-2 text-rose-300 hover:bg-slate-700"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!filteredVendors.length && <EmptyState text="No vendor accounts found." />}
            </div>
          </section>
        )}

        {activeTab === 'users' && (
          <section className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-black text-white">User profiles</h2>
                <p className="mt-1 text-xs text-slate-400">Everyone who signed up or logged in — customers, partners, and admins.</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">{filteredUsers.length} of {users.length} users</span>
                <SearchBox value={search} onChange={setSearch} />
              </div>
            </div>
            <div className="overflow-x-auto rounded-2xl border border-slate-700 bg-slate-800">
              <table className="w-full min-w-[860px] text-left text-xs">
                <thead className="bg-slate-900 text-[10px] uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="p-4">Name</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Phone</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Property</th>
                    <th className="p-4">Verified</th>
                    <th className="p-4">Bookings</th>
                    <th className="p-4">Joined</th>
                    <th className="p-4">Profile</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-700/30">
                      <td className="p-4 font-bold text-white">{user.name}</td>
                      <td className="p-4 text-slate-300">{user.email}</td>
                      <td className="p-4 text-slate-400">{user.phone || '—'}</td>
                      <td className="p-4">
                        <StatusPill positive={user.role === 'CUSTOMER'}>{user.role}</StatusPill>
                      </td>
                      <td className="p-4 text-slate-300">
                        {user.hotel_name || (user.role === 'VENDOR' ? 'Not assigned' : '—')}
                        {user.hotel_city ? <p className="mt-1 text-slate-400">{user.hotel_city}</p> : null}
                      </td>
                      <td className="p-4 text-slate-300">{user.is_email_verified ? 'Yes' : 'No'}</td>
                      <td className="p-4 font-bold text-amber-200">{user.booking_count ?? 0}</td>
                      <td className="p-4 text-slate-400">{dateText(user.created_at)}</td>
                      <td className="p-4">
                        <button type="button" onClick={() => setUserProfile(user)} className="inline-flex items-center gap-1 rounded-lg bg-slate-700 px-3 py-2 font-bold text-sky-200">
                          <Eye className="h-3.5 w-3.5" /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!filteredUsers.length && <EmptyState text="No user profiles yet. Accounts appear here after signup or login." />}
            </div>
          </section>
        )}

        {activeTab === 'bookings' && (
          <section className="overflow-x-auto rounded-2xl border border-slate-700 bg-slate-800">
            <div className="flex items-center justify-between gap-3 border-b border-slate-700 p-4"><div><h2 className="font-black text-white">Reservation management</h2><p className="mt-1 text-xs text-slate-400">Review guest, stay, payment and booking status.</p></div><span className="text-xs text-slate-400">{bookings.length} bookings</span></div>
            <table className="w-full min-w-[1000px] text-left text-xs">
              <thead className="bg-slate-900 text-[10px] uppercase tracking-wider text-slate-400"><tr>
                <th className="p-4">Reservation</th><th className="p-4">Guest</th><th className="p-4">Property / room</th><th className="p-4">Stay</th><th className="p-4">Payment</th><th className="p-4">Cancellation / refund</th><th className="p-4">Emails</th><th className="p-4">Status</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-700">
                {bookings.map((booking) => (
                  <tr key={booking.booking_id} className="hover:bg-slate-700/30">
                    <td className="p-4 font-black text-amber-300">{booking.booking_id}<p className="mt-1 font-normal text-slate-400">{dateText(booking.created_at)}</p></td>
                    <td className="p-4 font-bold text-white">{booking.guest_name}<p className="mt-1 font-normal text-slate-400">{booking.guest_email}<br />{booking.guest_phone}</p></td>
                    <td className="p-4 text-slate-200">{booking.hotel_name}<p className="mt-1 text-slate-400">{booking.room_name}</p></td>
                    <td className="p-4 text-slate-300">{booking.check_in} → {booking.check_out}<p className="mt-1 text-slate-400">{booking.rooms_count} room(s), {booking.guests_count} guest(s)</p></td>
                    <td className="p-4 font-bold text-emerald-300">{money(booking.total_price)}<p className="mt-1 font-normal text-slate-400">{booking.payment_mode} · {booking.payment_status}</p></td>
                    <td className="p-4 text-slate-300">{booking.status.includes('CANCELLED') ? (
                      <>
                        Fee: {money(booking.cancellation_fee)}
                        <p className="mt-1">Refund: {money(booking.refund_amount)} · {booking.refund_status?.replaceAll('_', ' ')}</p>
                        {['PENDING', 'REVIEW_REQUIRED'].includes(booking.refund_status) && booking.refund_amount > 0 && (
                          <button type="button" onClick={() => markRefundProcessed(booking)} className="mt-2 rounded-lg bg-emerald-500 px-2.5 py-1.5 font-bold text-slate-950">
                            Mark manually refunded
                          </button>
                        )}
                        {booking.refund_reference && <p className="mt-1 text-slate-400">Ref: {booking.refund_reference}</p>}
                      </>
                    ) : booking.refund_status === 'REVIEW_REQUIRED' ? (
                      <span className="font-bold text-rose-300">Refund requires review</span>
                    ) : '—'}</td>
                    <td className="p-4">
                      {booking.status.includes('CANCELLED') ? (
                        <span className="font-bold text-slate-400">Cancellation recorded</span>
                      ) : booking.email_sent ? (
                        <span className="font-bold text-emerald-300">Confirmation sent</span>
                      ) : (
                        <button type="button" onClick={() => retryBookingEmails(booking)} className="inline-flex items-center gap-1.5 rounded-lg bg-amber-400 px-3 py-2 font-bold text-slate-950">
                          <Mail className="h-3.5 w-3.5" /> Retry email
                        </button>
                      )}
                    </td>
                    <td className="p-4">
                      <select value={booking.status} disabled={booking.status.includes('CANCELLED')} onChange={(event) => updateBooking(booking, event.target.value)} className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 text-xs font-bold text-white disabled:opacity-60">
                        {['PENDING', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED', ...(booking.status.includes('CANCELLED') ? [booking.status] : [])].map((status) => <option key={status} value={status}>{status.replaceAll('_', ' ')}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!bookings.length && <EmptyState text="No bookings have been recorded." />}
          </section>
        )}

        {activeTab === 'payouts' && (
          <section className="overflow-x-auto rounded-2xl border border-slate-700 bg-slate-800">
            <div className="border-b border-slate-700 p-4"><h2 className="font-black text-white">Partner payouts</h2><p className="mt-1 text-xs text-slate-400">Track platform commission and vendor settlement for each booking.</p></div>
            <table className="w-full min-w-[800px] text-left text-xs">
              <thead className="bg-slate-900 text-[10px] uppercase tracking-wider text-slate-400"><tr>
                <th className="p-4">Booking</th><th className="p-4">Hotel</th><th className="p-4">Gross total</th><th className="p-4">Commission</th><th className="p-4">Vendor due</th><th className="p-4">Payout status</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-700">
                {payouts.map((booking) => (
                  <tr key={booking.booking_id}>
                    <td className="p-4 font-black text-amber-300">{booking.booking_id}</td>
                    <td className="p-4 text-slate-200">{booking.hotel_name}</td>
                    <td className="p-4 font-bold text-white">{money(booking.total_price)}</td>
                    <td className="p-4 text-slate-300">{money(booking.commission_amount)} <span className="text-slate-500">({booking.commission_rate}%)</span></td>
                    <td className="p-4 font-bold text-emerald-300">{money(booking.net_partner_payout)}</td>
                    <td className="p-4"><select value={booking.payout_status} onChange={(event) => updatePayout(booking, event.target.value)} className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 text-xs font-bold text-white">{['PENDING', 'PROCESSED', 'TRANSFERRED'].map((status) => <option key={status} value={status}>{status}</option>)}</select></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!payouts.length && <EmptyState text="No payout records yet." />}
          </section>
        )}

        {activeTab === 'coupons' && (
          <section className="space-y-4">
            <div className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-700 bg-slate-800 p-4 sm:flex-row sm:items-center">
              <div><h2 className="font-black text-white">Promotions and coupons</h2><p className="mt-1 text-xs text-slate-400">Control discount, cap, minimum order and availability.</p></div>
              <button type="button" onClick={() => setCouponForm({ ...EMPTY_COUPON })} className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-black text-slate-950"><Plus className="h-4 w-4" /> Add coupon</button>
            </div>
            <div className="overflow-x-auto rounded-2xl border border-slate-700 bg-slate-800">
              <table className="w-full min-w-[700px] text-left text-xs">
                <thead className="bg-slate-900 text-[10px] uppercase tracking-wider text-slate-400"><tr><th className="p-4">Code</th><th className="p-4">Discount</th><th className="p-4">Maximum savings</th><th className="p-4">Minimum booking</th><th className="p-4">Status</th><th className="p-4">Actions</th></tr></thead>
                <tbody className="divide-y divide-slate-700">
                  {coupons.map((coupon) => (
                    <tr key={coupon.id}>
                      <td className="p-4 font-black tracking-wider text-amber-300">{coupon.code}</td><td className="p-4 text-white">{coupon.discount_percent}%</td><td className="p-4 text-slate-300">{money(coupon.max_discount)}</td><td className="p-4 text-slate-300">{money(coupon.min_order)}</td><td className="p-4"><StatusPill positive={coupon.is_active}>{coupon.is_active ? 'Active' : 'Inactive'}</StatusPill></td>
                      <td className="p-4"><button type="button" onClick={() => setCouponForm({ ...coupon })} className="mr-2 rounded-lg bg-slate-700 p-2 text-slate-200"><Pencil className="h-4 w-4" /></button><button type="button" onClick={() => removeCoupon(coupon)} className="rounded-lg bg-slate-700 p-2 text-rose-300"><Trash2 className="h-4 w-4" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!coupons.length && <EmptyState text="No coupons configured." />}
            </div>
          </section>
        )}
        </div>
      </div>

      {hotelForm && (
        <Modal title={hotelForm.id ? 'Edit hotel listing' : 'Add hotel listing'} onClose={() => setHotelForm(null)}>
          <form onSubmit={saveHotel} className="grid gap-4 sm:grid-cols-2">
            <Field label="Property name" required value={hotelForm.name} onChange={(value) => setHotelForm({ ...hotelForm, name: value })} />
            <Field label="City" required value={hotelForm.city} onChange={(value) => setHotelForm({ ...hotelForm, city: value, destination: hotelForm.destination || value })} />
            <Field label="Destination" value={hotelForm.destination} onChange={(value) => setHotelForm({ ...hotelForm, destination: value })} />
            <Field label="Street address" required value={hotelForm.address} onChange={(value) => setHotelForm({ ...hotelForm, address: value })} />
            <Field label="Price per night (₹)" type="number" min="1" required value={hotelForm.price_per_night} onChange={(value) => setHotelForm({ ...hotelForm, price_per_night: value })} />
            <Field label="Original price (₹)" type="number" min="1" value={hotelForm.original_price} onChange={(value) => setHotelForm({ ...hotelForm, original_price: value })} />
            <Field label="Star rating" type="number" min="1" max="5" required value={hotelForm.star_rating} onChange={(value) => setHotelForm({ ...hotelForm, star_rating: value })} />
            <Field label="Commission (%)" type="number" min="0" max="100" step="0.1" value={hotelForm.commission_percent} onChange={(value) => setHotelForm({ ...hotelForm, commission_percent: value })} />
            <label className="block space-y-1.5 sm:col-span-2">
              <span className="text-xs font-bold text-slate-400">Main photo (auto-compressed)</span>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                {hotelForm.main_image ? (
                  <img src={hotelForm.main_image} alt="" className="h-20 w-28 rounded-xl object-cover ring-1 ring-slate-600" />
                ) : null}
                <input
                  type="file"
                  accept="image/*"
                  className="text-xs text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-amber-400 file:px-3 file:py-2 file:text-xs file:font-black file:text-slate-950"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    event.target.value = '';
                    if (!file) return;
                    try {
                      const image = await compressImageFile(file);
                      setHotelForm({ ...hotelForm, main_image: image });
                    } catch (err) {
                      setError(err.message);
                    }
                  }}
                />
              </div>
            </label>
            <label className="block space-y-1.5 sm:col-span-2">
              <span className="text-xs font-bold text-slate-400">Gallery photos (auto-compressed, up to 5)</span>
              <div className="flex flex-wrap gap-2">
                {(hotelForm.gallery_images || []).map((img, idx) => (
                  <button
                    key={`${img.slice(-24)}-${idx}`}
                    type="button"
                    onClick={() => setHotelForm({
                      ...hotelForm,
                      gallery_images: hotelForm.gallery_images.filter((_, i) => i !== idx),
                    })}
                    className="relative h-16 w-20 overflow-hidden rounded-lg ring-1 ring-slate-600"
                    title="Remove"
                  >
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
                {(hotelForm.gallery_images || []).length < 5 && (
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="text-xs text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-700 file:px-3 file:py-2 file:text-xs file:font-bold file:text-white"
                    onChange={async (event) => {
                      const files = Array.from(event.target.files || []);
                      event.target.value = '';
                      const remaining = 5 - (hotelForm.gallery_images || []).length;
                      if (!files.length) return;
                      try {
                        const images = await compressImageFiles(files.slice(0, remaining));
                        setHotelForm({
                          ...hotelForm,
                          gallery_images: [...(hotelForm.gallery_images || []), ...images],
                        });
                      } catch (err) {
                        setError(err.message);
                      }
                    }}
                  />
                )}
              </div>
            </label>
            <Field label="Amenities (comma separated)" value={(hotelForm.amenities || []).join(', ')} onChange={(value) => setHotelForm({ ...hotelForm, amenities: value.split(',').map((item) => item.trim()).filter(Boolean) })} />
            <label className="space-y-1.5 sm:col-span-2"><span className="text-xs font-bold text-slate-400">Description</span><textarea rows="3" value={hotelForm.description} onChange={(event) => setHotelForm({ ...hotelForm, description: event.target.value })} className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400" /></label>
            <label className="flex items-center gap-2 text-sm text-slate-300 sm:col-span-2"><input type="checkbox" checked={Boolean(hotelForm.is_featured)} onChange={(event) => setHotelForm({ ...hotelForm, is_featured: event.target.checked })} /> Feature this property</label>
            <div className="flex justify-end gap-2 pt-2 sm:col-span-2"><button type="button" onClick={() => setHotelForm(null)} className="rounded-xl bg-slate-700 px-4 py-2.5 text-xs font-bold">Cancel</button><button disabled={saving} className="rounded-xl bg-amber-400 px-5 py-2.5 text-xs font-black text-slate-950 disabled:opacity-60">{saving ? 'Saving…' : 'Save hotel'}</button></div>
          </form>
        </Modal>
      )}

      {vendorForm && (
        <Modal title={vendorForm.id ? 'Edit vendor profile' : 'Create vendor account'} onClose={() => setVendorForm(null)}>
          <form onSubmit={saveVendor} className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" required value={vendorForm.name} onChange={(value) => setVendorForm({ ...vendorForm, name: value })} />
            <Field label="Email address" type="email" required value={vendorForm.email} onChange={(value) => setVendorForm({ ...vendorForm, email: value })} />
            <Field label="Phone number" value={vendorForm.phone} onChange={(value) => setVendorForm({ ...vendorForm, phone: value })} />
            {!vendorForm.id && <Field label="Temporary password" type="password" required value={vendorForm.password} onChange={(value) => setVendorForm({ ...vendorForm, password: value })} />}
            <SelectField label="Assigned property" value={vendorForm.hotel} onChange={(value) => setVendorForm({ ...vendorForm, hotel: value })}>
              <option value="">Not assigned</option>{hotels.filter((hotel) => hotel.is_active).map((hotel) => <option key={hotel.id} value={hotel.id}>{hotel.name} — {hotel.city}</option>)}
            </SelectField>
            <SelectField label="Account status" value={vendorForm.vendor_status} onChange={(value) => setVendorForm({ ...vendorForm, vendor_status: value })}>
              <option value="PENDING">Pending</option><option value="APPROVED">Approved</option><option value="REJECTED">Rejected</option>
            </SelectField>
            <div className="flex justify-end gap-2 pt-2 sm:col-span-2"><button type="button" onClick={() => setVendorForm(null)} className="rounded-xl bg-slate-700 px-4 py-2.5 text-xs font-bold">Cancel</button><button disabled={saving} className="rounded-xl bg-emerald-400 px-5 py-2.5 text-xs font-black text-slate-950 disabled:opacity-60">{saving ? 'Saving…' : 'Save vendor'}</button></div>
          </form>
        </Modal>
      )}

      {vendorProfile && (
        <Modal title="Vendor profile" wide onClose={() => setVendorProfile(null)}>
          <div className="space-y-6">
            <div className="flex flex-col gap-4 rounded-2xl border border-slate-700 bg-slate-900/80 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="rounded-2xl bg-emerald-400/10 p-3 text-emerald-300 ring-1 ring-emerald-400/20">
                  <Store className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">{vendorProfile.name}</h3>
                  <p className="mt-1 text-sm text-slate-400">{vendorProfile.email}</p>
                </div>
              </div>
              <StatusPill positive={vendorProfile.vendor_status === 'APPROVED'}>{vendorProfile.vendor_status}</StatusPill>
            </div>

            <ProfileSection title="Account">
              <div className="grid gap-3 sm:grid-cols-2">
                <ProfileValue label="Phone" value={vendorProfile.phone || 'Not provided'} />
                <ProfileValue label="Role" value={vendorProfile.role} />
                <ProfileValue label="Email verified" value={vendorProfile.is_email_verified ? 'Verified' : 'Not verified'} />
                <ProfileValue label="Joined on" value={dateText(vendorProfile.created_at)} />
              </div>
            </ProfileSection>

            <ProfileSection title="Assigned property">
              <div className="grid gap-3 sm:grid-cols-2">
                <ProfileValue label="Hotel name" value={vendorProfile.hotel_name || 'Not assigned'} />
                <ProfileValue label="City" value={vendorProfile.hotel_city || '—'} />
                <ProfileValue label="Address" className="sm:col-span-2" value={vendorProfile.hotel_address || '—'} />
              </div>
            </ProfileSection>

            <ProfileSection title="Partner application">
              <div className="grid gap-3 sm:grid-cols-2">
                <ProfileValue label="Applied property" value={vendorProfile.application_hotel_name || 'Not provided'} />
                <ProfileValue label="Applied city" value={vendorProfile.application_city || 'Not provided'} />
                <ProfileValue label="Room capacity" value={vendorProfile.application_total_rooms || 'Not provided'} />
                <ProfileValue label="Applied address" className="sm:col-span-2" value={vendorProfile.application_address || 'Not provided'} />
              </div>
            </ProfileSection>

            <div className="flex flex-col gap-3 border-t border-slate-700 pt-4 sm:flex-row sm:justify-end">
              {vendorProfile.vendor_status !== 'APPROVED' && (
                <button
                  type="button"
                  onClick={() => { updateVendorStatus(vendorProfile, 'APPROVED'); setVendorProfile(null); }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-black text-slate-950"
                >
                  <BadgeCheck className="h-4 w-4" /> Approve &amp; email partner
                </button>
              )}
              <button
                type="button"
                onClick={() => { setVendorForm({ ...EMPTY_VENDOR, ...vendorProfile, password: '', hotel: vendorProfile.hotel || '' }); setVendorProfile(null); }}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-black text-slate-950"
              >
                <Pencil className="h-4 w-4" /> Edit profile
              </button>
            </div>
          </div>
        </Modal>
      )}

      {userProfile && (
        <Modal title="User profile" onClose={() => setUserProfile(null)} wide>
          <div className="space-y-6">
            <div className="flex flex-col gap-3 border-b border-slate-700 pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-300">Registered account</p>
                <h3 className="mt-1 text-xl font-black text-white">{userProfile.name}</h3>
                <p className="mt-1 text-sm text-slate-400">{userProfile.email}</p>
              </div>
              <StatusPill positive={userProfile.role === 'CUSTOMER'}>{userProfile.role}</StatusPill>
            </div>

            <ProfileSection title="Contact">
              <div className="grid gap-3 sm:grid-cols-2">
                <ProfileValue label="Full name" value={userProfile.name} />
                <ProfileValue label="Email" value={userProfile.email} />
                <ProfileValue label="Phone" value={userProfile.phone || 'Not provided'} />
                <ProfileValue label="Email verified" value={userProfile.is_email_verified ? 'Verified' : 'Not verified'} />
              </div>
            </ProfileSection>

            <ProfileSection title="Account">
              <div className="grid gap-3 sm:grid-cols-2">
                <ProfileValue label="Role" value={userProfile.role} />
                <ProfileValue label="Bookings on platform" value={userProfile.booking_count ?? 0} />
                <ProfileValue label="Joined on" value={dateText(userProfile.created_at)} />
                {userProfile.role === 'VENDOR' && (
                  <ProfileValue label="Vendor status" value={userProfile.vendor_status || 'PENDING'} />
                )}
              </div>
            </ProfileSection>

            {userProfile.role === 'VENDOR' && (
              <ProfileSection title="Partner details">
                <div className="grid gap-3 sm:grid-cols-2">
                  <ProfileValue label="Hotel name" value={userProfile.hotel_name || 'Not assigned'} />
                  <ProfileValue label="City" value={userProfile.hotel_city || '—'} />
                  <ProfileValue label="Address" className="sm:col-span-2" value={userProfile.hotel_address || '—'} />
                  <div className="sm:col-span-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Registered properties</p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {(userProfile.owned_hotels || []).length
                        ? userProfile.owned_hotels.map((hotel) => `${hotel.name} (${hotel.city})`).join(', ')
                        : (userProfile.hotel_name || 'None yet')}
                    </p>
                  </div>
                </div>
              </ProfileSection>
            )}
          </div>
        </Modal>
      )}

      {couponForm && (
        <Modal title={couponForm.id ? 'Edit coupon' : 'Create coupon'} onClose={() => setCouponForm(null)}>
          <form onSubmit={saveCoupon} className="grid gap-4 sm:grid-cols-2">
            <Field label="Coupon code" required value={couponForm.code} onChange={(value) => setCouponForm({ ...couponForm, code: value.toUpperCase() })} />
            <Field label="Discount (%)" type="number" min="1" max="100" required value={couponForm.discount_percent} onChange={(value) => setCouponForm({ ...couponForm, discount_percent: value })} />
            <Field label="Maximum discount (₹)" type="number" min="0" required value={couponForm.max_discount} onChange={(value) => setCouponForm({ ...couponForm, max_discount: value })} />
            <Field label="Minimum booking (₹)" type="number" min="0" required value={couponForm.min_order} onChange={(value) => setCouponForm({ ...couponForm, min_order: value })} />
            <label className="flex items-center gap-2 text-sm text-slate-300 sm:col-span-2"><input type="checkbox" checked={Boolean(couponForm.is_active)} onChange={(event) => setCouponForm({ ...couponForm, is_active: event.target.checked })} /> Coupon is active</label>
            <div className="flex justify-end gap-2 pt-2 sm:col-span-2"><button type="button" onClick={() => setCouponForm(null)} className="rounded-xl bg-slate-700 px-4 py-2.5 text-xs font-bold">Cancel</button><button disabled={saving} className="rounded-xl bg-amber-400 px-5 py-2.5 text-xs font-black text-slate-950 disabled:opacity-60">{saving ? 'Saving…' : 'Save coupon'}</button></div>
          </form>
        </Modal>
      )}
    </main>
  );
}

function SearchBox({ value, onChange }) {
  return (
    <label className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-slate-400">
      <Search className="h-4 w-4" />
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder="Search..." className="w-32 bg-transparent text-xs text-white outline-none sm:w-44" />
    </label>
  );
}

function EmptyState({ text }) {
  return <p className="p-8 text-center text-sm text-slate-400">{text}</p>;
}

function ProfileSection({ title, children }) {
  return (
    <section>
      <h4 className="mb-3 text-[11px] font-black uppercase tracking-wider text-amber-300/90">{title}</h4>
      {children}
    </section>
  );
}

function ProfileValue({ label, value, className = '' }) {
  return (
    <div className={`rounded-xl border border-slate-700/80 bg-slate-950/40 px-4 py-3 ${className}`}>
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1.5 break-words text-sm font-semibold leading-relaxed text-slate-100">{value}</p>
    </div>
  );
}
