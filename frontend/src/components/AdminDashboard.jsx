import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Archive, BadgeCheck, BarChart3, Building2, CalendarDays,
  CircleDollarSign, ClipboardList, Eye, Hotel, LoaderCircle, Pencil, Plus,
  RefreshCw, Search, ShieldCheck, Store, TicketPercent, Trash2, Users, X
} from 'lucide-react';
import { apiService } from '../services/api';

const TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'hotels', label: 'Hotels', icon: Hotel },
  { id: 'vendors', label: 'Vendors', icon: Store },
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

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <section className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-700 bg-slate-800 p-5 text-white shadow-2xl sm:p-7">
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

  const reloadAll = useCallback(async () => {
    setLoading(true);
    setError('');
    const [analyticsResult, hotelsResult, vendorsResult, bookingsResult, payoutsResult, couponsResult, commissionsResult] = await Promise.all([
      apiService.getAdminAnalytics(),
      apiService.getAdminHotels(),
      apiService.getAdminVendors(),
      apiService.getAdminBookings(),
      apiService.getAdminPayoutsSecure(),
      apiService.getAdminCouponsSecure(),
      apiService.getAdminCommissionsSecure()
    ]);

    const results = [analyticsResult, hotelsResult, vendorsResult, bookingsResult, payoutsResult, couponsResult, commissionsResult];
    const firstError = results.find((result) => result?.error)?.error;
    if (firstError) setError(firstError);
    if (analyticsResult && !analyticsResult.error) setAnalytics(analyticsResult);
    if (Array.isArray(hotelsResult)) setHotels(hotelsResult);
    if (Array.isArray(vendorsResult)) setVendors(vendorsResult);
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
    <main className="admin-dashboard min-h-screen bg-[#f4f6fb] p-4 text-slate-100 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-700 bg-slate-800 p-5 shadow-xl md:flex-row md:items-center md:p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-amber-400/10 p-3 text-amber-300"><ShieldCheck className="h-6 w-6" /></div>
            <div>
              <h1 className="text-xl font-black text-white md:text-2xl">TRUMITRIP Admin</h1>
              <p className="mt-1 text-xs text-slate-400">Manage inventory, partners, reservations and payouts</p>
            </div>
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

        <nav className="flex gap-2 overflow-x-auto rounded-2xl border border-slate-700 bg-slate-800 p-2">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => { setActiveTab(id); setSearch(''); }}
              className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold transition md:px-4 ${activeTab === id ? 'bg-gradient-to-r from-amber-300 to-yellow-400 text-slate-950 shadow-lg shadow-amber-500/20 ring-1 ring-amber-200' : 'text-slate-300 hover:bg-slate-700/90 hover:text-white'}`}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </nav>

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

        {activeTab === 'bookings' && (
          <section className="overflow-x-auto rounded-2xl border border-slate-700 bg-slate-800">
            <div className="flex items-center justify-between gap-3 border-b border-slate-700 p-4"><div><h2 className="font-black text-white">Reservation management</h2><p className="mt-1 text-xs text-slate-400">Review guest, stay, payment and booking status.</p></div><span className="text-xs text-slate-400">{bookings.length} bookings</span></div>
            <table className="w-full min-w-[1000px] text-left text-xs">
              <thead className="bg-slate-900 text-[10px] uppercase tracking-wider text-slate-400"><tr>
                <th className="p-4">Reservation</th><th className="p-4">Guest</th><th className="p-4">Property / room</th><th className="p-4">Stay</th><th className="p-4">Payment</th><th className="p-4">Status</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-700">
                {bookings.map((booking) => (
                  <tr key={booking.booking_id} className="hover:bg-slate-700/30">
                    <td className="p-4 font-black text-amber-300">{booking.booking_id}<p className="mt-1 font-normal text-slate-400">{dateText(booking.created_at)}</p></td>
                    <td className="p-4 font-bold text-white">{booking.guest_name}<p className="mt-1 font-normal text-slate-400">{booking.guest_email}<br />{booking.guest_phone}</p></td>
                    <td className="p-4 text-slate-200">{booking.hotel_name}<p className="mt-1 text-slate-400">{booking.room_name}</p></td>
                    <td className="p-4 text-slate-300">{booking.check_in} → {booking.check_out}<p className="mt-1 text-slate-400">{booking.rooms_count} room(s), {booking.guests_count} guest(s)</p></td>
                    <td className="p-4 font-bold text-emerald-300">{money(booking.total_price)}<p className="mt-1 font-normal text-slate-400">{booking.payment_mode} · {booking.payment_status}</p></td>
                    <td className="p-4">
                      <select value={booking.status} onChange={(event) => updateBooking(booking, event.target.value)} className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 text-xs font-bold text-white">
                        {['PENDING', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'CUSTOMER_CANCELLED', 'PARTNER_CANCELLED'].map((status) => <option key={status} value={status}>{status.replaceAll('_', ' ')}</option>)}
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
            <Field label="Main image URL" value={hotelForm.main_image} onChange={(value) => setHotelForm({ ...hotelForm, main_image: value })} />
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
        <Modal title="Vendor profile" onClose={() => setVendorProfile(null)}>
          <div className="space-y-5">
            <div className="flex items-center gap-3 rounded-2xl bg-slate-900 p-4"><div className="rounded-xl bg-emerald-400/10 p-3 text-emerald-300"><Store className="h-5 w-5" /></div><div><h3 className="font-black">{vendorProfile.name}</h3><StatusPill positive={vendorProfile.vendor_status === 'APPROVED'}>{vendorProfile.vendor_status}</StatusPill></div></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <ProfileValue label="Email" value={vendorProfile.email} />
              <ProfileValue label="Phone" value={vendorProfile.phone || 'Not provided'} />
              <ProfileValue label="Account role" value={vendorProfile.role} />
              <ProfileValue label="Email verified" value={vendorProfile.is_email_verified ? 'Verified' : 'Not verified'} />
              <ProfileValue label="Joined on" value={dateText(vendorProfile.created_at)} />
              <ProfileValue label="Assigned hotel" value={vendorProfile.hotel_name || 'Not assigned'} />
              <ProfileValue label="Hotel city" value={vendorProfile.hotel_city || '—'} />
              <ProfileValue label="Hotel address" value={vendorProfile.hotel_address || '—'} />
            </div>
            <div className="flex justify-end"><button type="button" onClick={() => { setVendorForm({ ...EMPTY_VENDOR, ...vendorProfile, password: '', hotel: vendorProfile.hotel || '' }); setVendorProfile(null); }} className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-black text-slate-950"><Pencil className="h-4 w-4" /> Edit profile</button></div>
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

function ProfileValue({ label, value }) {
  return <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-3"><p className="text-[10px] font-bold uppercase text-slate-500">{label}</p><p className="mt-1 break-words text-sm font-semibold text-slate-200">{value}</p></div>;
}
