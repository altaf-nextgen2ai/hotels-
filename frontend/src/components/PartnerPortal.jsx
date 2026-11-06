import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard, Hotel, BedDouble, IndianRupee, Calendar, LogOut,
  PlusCircle, TrendingUp, TrendingDown, Users, Star, MapPin,
  CheckCircle2, Clock, XCircle, AlertTriangle, RefreshCw, Bell,
  ChevronRight, ArrowUpRight, ArrowDownRight, Banknote, BarChart3,
  Package, Tag, HelpCircle, Wifi, Coffee, Car, Dumbbell, Waves,
  Utensils, ShieldCheck, Moon, Save, Building2, Eye, ChevronDown, Trash2
} from 'lucide-react';
import { apiService } from '../services/api';

const fmt = (n) => Number(n || 0).toLocaleString('en-IN');

const STATUS_META = {
  CONFIRMED:          { label: 'Confirmed',   bg: 'bg-emerald-50',  text: 'text-emerald-700',  border: 'border-emerald-200' },
  CHECKED_IN:         { label: 'Checked In',  bg: 'bg-blue-50',     text: 'text-blue-700',     border: 'border-blue-200'   },
  COMPLETED:          { label: 'Completed',   bg: 'bg-slate-100',   text: 'text-slate-600',    border: 'border-slate-200'  },
  PENDING:            { label: 'Pending',     bg: 'bg-amber-50',    text: 'text-amber-700',    border: 'border-amber-200'  },
  CUSTOMER_CANCELLED: { label: 'Cancelled',   bg: 'bg-red-50',      text: 'text-red-600',      border: 'border-red-200'    },
  PARTNER_CANCELLED:  { label: 'Cancelled',   bg: 'bg-red-50',      text: 'text-red-600',      border: 'border-red-200'    },
};

const NAV = [
  { id: 'dashboard', label: 'Dashboard',         icon: LayoutDashboard },
  { id: 'properties', label: 'My Hotels',        icon: Building2       },
  { id: 'bookings',  label: 'Bookings',           icon: Calendar        },
  { id: 'rooms',     label: 'Rooms & Rates',      icon: BedDouble       },
  { id: 'property',  label: 'Property Details',   icon: Hotel           },
  { id: 'revenue',   label: 'Revenue & Payouts',  icon: IndianRupee     },
  { id: 'register',  label: 'Add New Property',   icon: PlusCircle      },
];

const AMENITY_ICONS = { WiFi: Wifi, Breakfast: Coffee, Parking: Car, Gym: Dumbbell, Pool: Waves, Restaurant: Utensils, Spa: ShieldCheck };

// ── Pending screen ─────────────────────────────────────────────────────────────
function PendingScreen({ currentUser, onLogout }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-sm space-y-5">
        <div className="w-14 h-14 mx-auto rounded-full bg-amber-100 flex items-center justify-center">
          <Clock className="w-7 h-7 text-amber-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Application Under Review</h2>
          <p className="text-sm text-gray-500 mt-2">Hi <strong>{currentUser?.name?.split(' ')[0]}</strong>, your partner account is being reviewed by the Trumitrip team.</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 text-sm text-left space-y-2 text-gray-600">
          <div className="flex justify-between"><span>Email</span><span className="font-semibold text-gray-800">{currentUser?.email}</span></div>
          <div className="flex justify-between"><span>Role</span><span className="font-semibold text-gray-800">Hotel Partner</span></div>
          <div className="flex justify-between"><span>Status</span><span className="text-amber-600 font-bold">Pending Approval</span></div>
        </div>
        <button onClick={onLogout} className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm rounded-xl transition">Sign Out</button>
      </div>
    </div>
  );
}

// ── Status badge ───────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.PENDING;
  return <span className={`inline-flex items-center text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${m.bg} ${m.text} ${m.border}`}>{m.label}</span>;
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function PartnerPortal({ hotels = [], currentUser, onLogout, onRefreshHotels }) {
  const [activeTab,  setActiveTab]  = useState('dashboard');
  const [analytics,  setAnalytics]  = useState(null);
  const [bookings,   setBookings]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [savingId,   setSavingId]   = useState(null);
  const [toast,      setToast]      = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [partnerHotels, setPartnerHotels] = useState([]);
  const [hotelsLoading, setHotelsLoading] = useState(true);
  const [deletingHotelId, setDeletingHotelId] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Get latest user from localStorage (may have been updated after hotel registration)
  const latestUser = (() => {
    try { return JSON.parse(localStorage.getItem('trumitrip_user')) || currentUser; }
    catch { return currentUser; }
  })();

  const loadPartnerHotels = useCallback(async () => {
    if (latestUser?.role === 'VENDOR' && latestUser?.vendor_status === 'APPROVED') {
      setHotelsLoading(true);
      const data = await apiService.getPartnerHotels();
      if (Array.isArray(data)) {
        setPartnerHotels(data);
      } else if (data?.error) {
        showToast(data.error, 'error');
      }
      setHotelsLoading(false);
      return;
    }
    if (latestUser?.role === 'ADMIN') {
      setPartnerHotels(hotels);
      setHotelsLoading(false);
      return;
    }
    setPartnerHotels([]);
    setHotelsLoading(false);
  }, [latestUser?.role, latestUser?.vendor_status, hotels]);

  useEffect(() => {
    loadPartnerHotels();
  }, [loadPartnerHotels]);

  const vendorHotels = partnerHotels.length > 0
    ? partnerHotels
    : (latestUser?.role === 'ADMIN'
      ? hotels
      : hotels.filter(h => String(h.id) === String(latestUser?.hotel)));

  const [selectedHotelId, setSelectedHotelId] = useState(null);

  useEffect(() => {
    if (!vendorHotels.length) {
      setSelectedHotelId(null);
      return;
    }
    const stillValid = vendorHotels.some(h => String(h.id) === String(selectedHotelId));
    if (!stillValid) {
      setSelectedHotelId(vendorHotels[0]?.id ?? null);
    }
  }, [vendorHotels, selectedHotelId]);
  const hotel = vendorHotels.find(h => String(h.id) === String(selectedHotelId)) || vendorHotels[0] || null;
  const [rooms, setRooms] = useState(hotel?.rooms || []);

  // New hotel form
  const [newHotel, setNewHotel] = useState({
    name: '', city: 'Goa', address: '', description: '',
    price_per_night: 8500, original_price: 12500, star_rating: 5,
    main_image: '',
    gallery_images: [],
    amenities: ['WiFi', 'Pool', 'Breakfast', 'AC'], is_featured: true,
  });
  const [registering, setRegistering] = useState(false);

  // ── Image file helpers ────────────────────────────────────────────────────
  const readFileAsBase64 = (file) =>
    new Promise((resolve, reject) => {
      if (file.size > 3 * 1024 * 1024) { reject(new Error(`${file.name} is too large (max 3MB)`)); return; }
      const reader = new FileReader();
      reader.onload  = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });

  const handleMainImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const b64 = await readFileAsBase64(file);
      setNewHotel(p => ({ ...p, main_image: b64 }));
    } catch (err) { showToast(err.message, 'error'); }
  };

  const handleGalleryUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    const remaining = 5 - (newHotel.gallery_images?.length || 0);
    if (remaining <= 0) { showToast('Max 5 gallery images allowed', 'error'); return; }
    for (const file of files.slice(0, remaining)) {
      try {
        const b64 = await readFileAsBase64(file);
        setNewHotel(p => ({ ...p, gallery_images: [...(p.gallery_images || []), b64] }));
      } catch (err) { showToast(err.message, 'error'); }
    }
  };

  const removeGalleryImage = (idx) => {
    setNewHotel(p => ({ ...p, gallery_images: (p.gallery_images || []).filter((_, i) => i !== idx) }));
  };

  const loadData = useCallback(async () => {
    if (!hotel?.id) { setLoading(false); return; }
    setLoading(true);
    const [analyticsData, bookingsData] = await Promise.all([
      apiService.getPartnerAnalytics(hotel.id),
      apiService.getBookings(),
    ]);
    if (analyticsData) setAnalytics(analyticsData);
    if (Array.isArray(bookingsData)) {
      setBookings(bookingsData.filter(b => String(b.hotel) === String(hotel.id) || String(b.hotel_id) === String(hotel.id)));
    }
    setRooms(hotel.rooms || []);
    setLoading(false);
  }, [hotel?.id]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleDeleteHotel = async (hotelId, hotelName) => {
    if (!window.confirm(`Remove "${hotelName}" from Trumitrip? Past bookings stay in history; active bookings must be cleared first.`)) {
      return;
    }
    setDeletingHotelId(hotelId);
    const res = await apiService.deletePartnerHotel(hotelId);
    setDeletingHotelId(null);
    if (res?.error) {
      showToast(res.error, 'error');
      return;
    }
    showToast(res.message || 'Property removed');
    const remaining = partnerHotels.filter(h => String(h.id) !== String(hotelId));
    setPartnerHotels(remaining);
    if (String(selectedHotelId) === String(hotelId)) {
      setSelectedHotelId(remaining[0]?.id ?? null);
    }
    if (onRefreshHotels) await onRefreshHotels();
    await loadPartnerHotels();
    const savedUser = JSON.parse(localStorage.getItem('trumitrip_user') || '{}');
    if (savedUser?.role === 'VENDOR' && String(savedUser.hotel) === String(hotelId)) {
      const next = remaining[0];
      if (next) {
        savedUser.hotel = next.id;
        savedUser.hotel_name = next.name;
        savedUser.hotel_city = next.city;
        savedUser.hotel_address = next.address;
      } else {
        delete savedUser.hotel;
        delete savedUser.hotel_name;
        delete savedUser.hotel_city;
        delete savedUser.hotel_address;
      }
      localStorage.setItem('trumitrip_user', JSON.stringify(savedUser));
    }
  };

  const handleUpdateStatus = async (bookingId, newStatus) => {
    const booking = bookings.find((item) => item.booking_id === bookingId);
    if (newStatus === 'PARTNER_CANCELLED' && !window.confirm(
      `Cancel booking ${bookingId}? The guest will receive a full refund of ₹${fmt(booking?.total_price)}.`
    )) return;

    setSavingId(bookingId);
    const res = await apiService.updatePartnerBookingStatus(bookingId, newStatus);
    if (res?.booking) {
      setBookings(prev => prev.map(b => b.booking_id === bookingId ? { ...b, ...res.booking } : b));
      showToast(res.message || `Booking updated to ${newStatus}`);
    } else showToast(res?.error || 'Update failed', 'error');
    setSavingId(null);
  };

  const handleSaveRoom = async (room) => {
    setSavingId(room.id);
    await apiService.updatePartnerRates({ hotel_id: hotel.id, room_id: room.id, new_price: room.price_per_night, inventory: room.available_count });
    if (onRefreshHotels) await onRefreshHotels();
    showToast(`"${room.room_type}" updated`);
    setSavingId(null);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!newHotel.main_image) { showToast('Please upload a main image', 'error'); return; }
    setRegistering(true);
    const res = await apiService.createHotel({
      ...newHotel,
      destination: newHotel.city,
      rating_score: 4.8,
      review_count: 0,
      gallery_images: newHotel.gallery_images || [],
    });
    setRegistering(false);
    if (res?.id && !res.error) {
      const savedUser = JSON.parse(localStorage.getItem('trumitrip_user') || '{}');
      if (savedUser && savedUser.role === 'VENDOR') {
        const updatedVendor = res.vendor || savedUser;
        savedUser.hotel = res.id;
        savedUser.hotel_name = res.name;
        savedUser.hotel_city = res.city;
        savedUser.hotel_address = res.address;
        if (res.vendor) {
          Object.assign(savedUser, res.vendor);
        }
        localStorage.setItem('trumitrip_user', JSON.stringify(savedUser));
      }
      if (onRefreshHotels) await onRefreshHotels();
      await loadPartnerHotels();
      setSelectedHotelId(res.id);
      showToast(`${res.name} registered successfully!`);
      setActiveTab('dashboard');
    } else {
      showToast(res?.error || 'Registration failed. Check all fields and try again.', 'error');
    }
  };

  // Metrics
  const m           = analytics?.metrics || {};
  const grossRev    = m.gross_revenue       || 0;
  const commission  = m.platform_commission || 0;
  const netPayout   = m.net_partner_payout  || 0;
  const totalBkgs   = m.total_bookings_count || bookings.length;
  const completedCt = m.completed_count     || bookings.filter(b => b.status === 'COMPLETED').length;
  const pendingCI   = bookings.filter(b => b.status === 'CONFIRMED').length;
  const confirmedBkgs = bookings.filter(b => !['CUSTOMER_CANCELLED','PARTNER_CANCELLED'].includes(b.status));

  if (currentUser?.role === 'VENDOR' && currentUser?.vendor_status !== 'APPROVED') {
    return <PendingScreen currentUser={currentUser} onLogout={onLogout} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans">

      {/* ── SIDEBAR ─────────────────────────────────────────────────────────── */}
      <aside className={`${sidebarOpen ? 'w-56' : 'w-16'} bg-white border-r border-gray-200 flex flex-col transition-all duration-200 shrink-0 hidden md:flex`}>
        {/* Logo */}
        <div className="h-14 border-b border-gray-100 flex items-center gap-3 px-4">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center font-black text-white text-sm shrink-0">T</div>
          {sidebarOpen && (
            <div>
              <p className="font-black text-gray-900 text-sm leading-none">Trumitrip</p>
              <p className="text-[9px] text-blue-600 font-semibold uppercase tracking-wider">Partner</p>
            </div>
          )}
        </div>

        {/* Hotel selector */}
        {sidebarOpen && vendorHotels.length > 0 && (
          <div className="px-3 pt-3 pb-2">
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              Property · {vendorHotels.length} registered
            </p>
            <select
              value={selectedHotelId || ''}
              onChange={e => setSelectedHotelId(Number(e.target.value))}
              className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-400"
            >
              {vendorHotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          </div>
        )}

        {/* Nav links */}
        <nav className="px-2 py-2 flex-1 space-y-0.5">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              title={label}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === id
                  ? 'bg-blue-50 text-blue-700 font-bold'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${activeTab === id ? 'text-blue-600' : 'text-gray-400'}`} />
              {sidebarOpen && <span className="truncate">{label}</span>}
              {sidebarOpen && id === 'bookings' && bookings.length > 0 && (
                <span className="ml-auto bg-blue-100 text-blue-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full">{bookings.length}</span>
              )}
              {sidebarOpen && id === 'properties' && vendorHotels.length > 0 && (
                <span className="ml-auto bg-emerald-100 text-emerald-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full">{vendorHotels.length}</span>
              )}
            </button>
          ))}
        </nav>

        {/* User footer */}
        <div className="px-3 py-3 border-t border-gray-100 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700 text-sm shrink-0">
            {(currentUser?.name || 'V')[0].toUpperCase()}
          </div>
          {sidebarOpen && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-800 truncate">{currentUser?.name}</p>
                <p className="text-[9px] text-gray-400 font-medium">Hotel Partner</p>
              </div>
              <button onClick={onLogout} title="Sign Out" className="text-gray-400 hover:text-red-500 transition">
                <LogOut className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </aside>

      {/* ── MAIN ────────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Topbar */}
        <header className="h-14 bg-white border-b border-gray-200 px-3 sm:px-5 flex items-center justify-between sticky top-0 z-20 safe-area-top">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-400 hover:text-gray-600 hidden md:block shrink-0">
              <BarChart3 className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-gray-900 truncate">{NAV.find(n => n.id === activeTab)?.label}</h1>
              {hotel && <p className="text-[10px] text-gray-400 truncate">{hotel.name} · {hotel.city}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={loadData} className={`p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition ${loading ? 'animate-spin' : ''}`}>
              <RefreshCw className="w-4 h-4" />
            </button>
            <button className="relative p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
              <Bell className="w-4 h-4" />
              {pendingCI > 0 && <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full" />}
            </button>
            <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
              <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700 text-xs">
                {(currentUser?.name || 'V')[0].toUpperCase()}
              </div>
              <span className="text-xs font-semibold text-gray-700 hidden sm:block">{currentUser?.name?.split(' ')[0]}</span>
            </div>
          </div>
        </header>

        {/* Mobile tab navigation */}
        <nav className="partner-mobile-nav md:hidden sticky top-14 z-10 bg-white border-b border-gray-200 flex gap-1 px-2 py-2 overflow-x-auto shrink-0">
          {vendorHotels.length > 0 && (
            <select
              value={selectedHotelId || ''}
              onChange={(e) => setSelectedHotelId(Number(e.target.value))}
              className="shrink-0 max-w-[140px] bg-gray-50 border border-gray-200 text-gray-800 text-[10px] font-semibold rounded-lg px-2 py-2 mr-1"
            >
              {vendorHotels.map(h => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          )}
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold whitespace-nowrap min-h-[40px] transition ${
                activeTab === id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label.split(' ')[0]}
            </button>
          ))}
        </nav>

        {/* Toast */}
        {toast && (
          <div className={`fixed top-16 sm:top-4 left-3 right-3 sm:left-auto sm:right-4 z-[110] flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg text-sm font-semibold ${
            toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'
          }`}>
            {toast.type === 'error' ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            {toast.msg}
          </div>
        )}

        <main className="flex-1 p-3 sm:p-5 space-y-5 overflow-y-auto overflow-x-hidden safe-area-bottom pb-8">

          {/* No hotel warning */}
          {!hotel && activeTab !== 'register' && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-gray-800">No property assigned yet</p>
                <p className="text-xs text-gray-500 mt-0.5">Register your hotel to start receiving bookings.</p>
                <button onClick={() => setActiveTab('register')} className="mt-2 text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                  Register Hotel <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════ DASHBOARD ══════════════════════ */}
          {activeTab === 'dashboard' && hotel && (
            <div className="space-y-5">

              <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Your portfolio</p>
                  <p className="text-lg font-black text-gray-900 mt-0.5">
                    {vendorHotels.length} hotel{vendorHotels.length !== 1 ? 's' : ''} registered on Trumitrip
                  </p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setActiveTab('properties')}
                    className="text-xs font-bold text-blue-600 border border-blue-200 bg-blue-50 px-3 py-2 rounded-lg hover:bg-blue-100 transition">
                    View all properties
                  </button>
                  <button type="button" onClick={() => setActiveTab('register')}
                    className="text-xs font-bold text-white bg-blue-600 px-3 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-1">
                    <PlusCircle className="w-3.5 h-3.5" /> Add new
                  </button>
                </div>
              </div>

              {/* KPI cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Gross Revenue',  value: `₹${fmt(grossRev)}`,  sub: 'All confirmed bookings',   icon: IndianRupee, color: 'blue',   trend: '+12.4%', up: true  },
                  { label: 'Net Payout',      value: `₹${fmt(netPayout)}`, sub: 'After commission',          icon: Banknote,    color: 'emerald',trend: '+8.1%',  up: true  },
                  { label: 'Bookings',        value: totalBkgs,            sub: `${completedCt} completed`,  icon: Calendar,    color: 'violet', trend: `${pendingCI} pending`, up: pendingCI > 0 },
                  { label: 'Occupancy',       value: m.occupancy_rate || '—', sub: 'Current period',         icon: BarChart3,   color: 'orange', trend: 'Live',   up: true  },
                ].map(({ label, value, sub, icon: Icon, color, trend, up }) => {
                  const colorMap = {
                    blue:   { bg: 'bg-blue-50',   icon: 'text-blue-600',   badge: 'text-blue-600' },
                    emerald:{ bg: 'bg-emerald-50', icon: 'text-emerald-600',badge: 'text-emerald-600' },
                    violet: { bg: 'bg-violet-50',  icon: 'text-violet-600', badge: 'text-violet-600' },
                    orange: { bg: 'bg-orange-50',  icon: 'text-orange-600', badge: 'text-orange-600' },
                  };
                  const c = colorMap[color];
                  return (
                    <div key={label} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition">
                      <div className="flex items-center justify-between mb-3">
                        <div className={`w-8 h-8 rounded-lg ${c.bg} flex items-center justify-center`}>
                          <Icon className={`w-4 h-4 ${c.icon}`} />
                        </div>
                        <span className={`text-[10px] font-bold flex items-center gap-0.5 ${up ? 'text-emerald-600' : 'text-red-500'}`}>
                          {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {trend}
                        </span>
                      </div>
                      <p className="text-xl font-black text-gray-900">{value}</p>
                      <p className="text-xs font-semibold text-gray-500 mt-0.5">{label}</p>
                      <p className="text-[10px] text-gray-400">{sub}</p>
                    </div>
                  );
                })}
              </div>

              {/* Commission summary */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="text-sm font-bold text-gray-900 mb-4">Commission & Payout Split</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  {[
                    { label: 'Gross Revenue',      value: grossRev,   bg: 'bg-gray-50',    text: 'text-gray-900' },
                    { label: 'Platform Commission', value: commission, bg: 'bg-red-50',     text: 'text-red-600'  },
                    { label: 'Your Net Payout',     value: netPayout,  bg: 'bg-emerald-50', text: 'text-emerald-700' },
                  ].map(({ label, value, bg, text }) => (
                    <div key={label} className={`${bg} rounded-xl p-4 border border-gray-100`}>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{label}</p>
                      <p className={`text-2xl font-black mt-1 ${text}`}>₹{fmt(value)}</p>
                    </div>
                  ))}
                </div>
                {hotel.commission_percent && (
                  <p className="text-xs text-gray-400 mt-3">Commission rate: <strong className="text-gray-600">{hotel.commission_percent}%</strong> per booking</p>
                )}
              </div>

              {/* Recent bookings */}
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-5 py-3.5 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="text-sm font-bold text-gray-900">Recent Bookings</h3>
                  <button onClick={() => setActiveTab('bookings')} className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1">
                    View all <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        {['Booking ID', 'Guest', 'Room', 'Check-In', 'Nights', 'Amount', 'Status'].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {bookings.length === 0 ? (
                        <tr><td colSpan={7} className="text-center py-10 text-sm text-gray-400">No bookings yet</td></tr>
                      ) : bookings.slice(0, 6).map(b => {
                        const nights = Math.max(1, Math.round((new Date(b.check_out) - new Date(b.check_in)) / 86400000));
                        return (
                          <tr key={b.booking_id} className="hover:bg-gray-50 transition">
                            <td className="px-4 py-3 text-xs font-bold text-blue-600">{b.booking_id}</td>
                            <td className="px-4 py-3">
                              <p className="text-xs font-semibold text-gray-800">{b.guest_name}</p>
                              <p className="text-[10px] text-gray-400">{b.guest_email}</p>
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-600">{b.room_name || '—'}</td>
                            <td className="px-4 py-3 text-xs text-gray-600">{b.check_in}</td>
                            <td className="px-4 py-3 text-xs font-semibold text-gray-700">{nights}N</td>
                            <td className="px-4 py-3 text-xs font-bold text-gray-900">₹{fmt(b.total_price)}</td>
                            <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Room performance */}
              {analytics?.room_breakdown?.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-gray-100">
                    <h3 className="text-sm font-bold text-gray-900">Room Performance</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-100">
                          {['Room Type','Total','Available','Bookings','Revenue','Status'].map(h => (
                            <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {analytics.room_breakdown.map(r => (
                          <tr key={r.room_id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-xs font-semibold text-gray-800">{r.room_type}</td>
                            <td className="px-4 py-3 text-xs text-gray-600">{r.total_rooms}</td>
                            <td className="px-4 py-3 text-xs font-bold text-emerald-600">{r.available_count}</td>
                            <td className="px-4 py-3 text-xs text-gray-600">{r.bookings_count}</td>
                            <td className="px-4 py-3 text-xs font-bold text-gray-900">₹{fmt(r.revenue)}</td>
                            <td className="px-4 py-3">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${r.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                                {r.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════ MY HOTELS (PORTFOLIO) ══════════════════════ */}
          {activeTab === 'properties' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-gray-900">Registered properties</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {hotelsLoading ? 'Loading…' : `${vendorHotels.length} active listing${vendorHotels.length !== 1 ? 's' : ''} on your account`}
                  </p>
                </div>
                <button type="button" onClick={() => setActiveTab('register')}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition">
                  <PlusCircle className="w-4 h-4" /> Add new property
                </button>
              </div>

              {hotelsLoading ? (
                <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-sm text-gray-400">
                  <RefreshCw className="w-6 h-6 mx-auto animate-spin mb-2" /> Loading your hotels…
                </div>
              ) : vendorHotels.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
                  <Building2 className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                  <p className="font-semibold text-gray-700 text-sm">No hotels registered yet</p>
                  <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">Add your first property to appear in search and receive bookings.</p>
                  <button type="button" onClick={() => setActiveTab('register')}
                    className="mt-4 text-xs font-bold text-blue-600 hover:underline inline-flex items-center gap-1">
                    Register your first hotel <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {vendorHotels.map((h) => {
                    const isSelected = String(h.id) === String(selectedHotelId);
                    const roomCount = (h.rooms || []).length;
                    return (
                      <div key={h.id}
                        className={`bg-white border rounded-xl overflow-hidden hover:shadow-md transition ${isSelected ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-200'}`}>
                        <div className="h-36 relative">
                          <img src={h.main_image} alt={h.name} className="w-full h-full object-cover" />
                          {isSelected && (
                            <span className="absolute top-2 left-2 text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full">
                              Active workspace
                            </span>
                          )}
                        </div>
                        <div className="p-4 space-y-3">
                          <div>
                            <h3 className="text-sm font-bold text-gray-900 line-clamp-1">{h.name}</h3>
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 shrink-0" /> {h.city}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2 text-[10px] font-semibold text-gray-600">
                            <span className="bg-gray-100 px-2 py-1 rounded-full">{h.star_rating}★</span>
                            <span className="bg-gray-100 px-2 py-1 rounded-full">{roomCount} room type{roomCount !== 1 ? 's' : ''}</span>
                            <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full">₹{fmt(h.price_per_night)}/night</span>
                          </div>
                          <div className="flex gap-2 pt-1">
                            <button type="button"
                              onClick={() => { setSelectedHotelId(h.id); setActiveTab('dashboard'); }}
                              className="flex-1 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition">
                              Manage
                            </button>
                            <button type="button"
                              onClick={() => { setSelectedHotelId(h.id); setActiveTab('property'); }}
                              className="text-xs font-bold border border-gray-200 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 transition"
                              title="View details">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button type="button"
                              onClick={() => handleDeleteHotel(h.id, h.name)}
                              disabled={deletingHotelId === h.id}
                              className="text-xs font-bold border border-red-200 text-red-600 px-3 py-2 rounded-lg hover:bg-red-50 transition disabled:opacity-50"
                              title="Remove listing">
                              {deletingHotelId === h.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════ BOOKINGS ══════════════════════ */}
          {activeTab === 'bookings' && (
            <div className="space-y-3">
              {/* Summary strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                {[
                  { label: 'Total',      count: bookings.length,                                                          color: 'bg-gray-100 text-gray-700'    },
                  { label: 'Confirmed',  count: bookings.filter(b => b.status === 'CONFIRMED').length,                   color: 'bg-emerald-100 text-emerald-700' },
                  { label: 'Checked In', count: bookings.filter(b => b.status === 'CHECKED_IN').length,                  color: 'bg-blue-100 text-blue-700'    },
                  { label: 'Cancelled',  count: bookings.filter(b => b.status.includes('CANCELLED')).length,             color: 'bg-red-100 text-red-600'      },
                ].map(({ label, count, color }) => (
                  <div key={label} className={`${color} rounded-xl px-4 py-3 text-center`}>
                    <p className="text-xl font-black">{count}</p>
                    <p className="text-xs font-semibold mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              {bookings.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
                  <Calendar className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                  <p className="font-semibold text-gray-500 text-sm">No bookings for this property yet</p>
                </div>
              ) : bookings.map(b => {
                const nights = Math.max(1, Math.round((new Date(b.check_out) - new Date(b.check_in)) / 86400000));
                return (
                  <div key={b.booking_id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-sm transition">
                    <div className="p-5">
                      {/* Top row */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700 text-sm shrink-0">
                            {b.guest_name?.[0]?.toUpperCase() || 'G'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-gray-900">{b.guest_name}</p>
                              <StatusBadge status={b.status} />
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">{b.guest_email} · {b.guest_phone}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-blue-600">{b.booking_id}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">Booked {new Date(b.created_at).toLocaleDateString('en-IN')}</p>
                        </div>
                      </div>

                      {/* Details grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {[
                          ['Room',         b.room_name || '—'],
                          ['Check-In',     b.check_in],
                          ['Check-Out',    b.check_out],
                          ['Duration',     `${nights} Night${nights > 1 ? 's' : ''}`],
                          ['Rooms · Guests', `${b.rooms_count || 1}R · ${b.guests_count || 1}G`],
                          ['Payment',      b.payment_mode?.replace('_', ' ') || '—'],
                          ['Total Paid',   `₹${fmt(b.total_price)}`],
                          ['Your Payout',  b.status.includes('CANCELLED') ? 'Voided' : `₹${fmt(b.net_partner_payout)}`],
                          ...(b.status.includes('CANCELLED') ? [
                            ['Cancellation Fee', `₹${fmt(b.cancellation_fee)}`],
                            ['Refund · Status', `₹${fmt(b.refund_amount)} · ${b.refund_status?.replaceAll('_', ' ') || 'NOT APPLICABLE'}`],
                          ] : b.refund_status === 'REVIEW_REQUIRED' ? [
                            ['Refund review', 'Contact TRUMITRIP support'],
                          ] : []),
                        ].map(([label, val]) => (
                          <div key={label} className="bg-gray-50 rounded-lg p-2.5">
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
                            <p className="text-xs font-semibold text-gray-800 mt-0.5">{val}</p>
                          </div>
                        ))}
                      </div>

                      {b.special_requests && (
                        <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800">
                          <span className="font-bold">Request: </span>{b.special_requests}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    {!['COMPLETED','CUSTOMER_CANCELLED','PARTNER_CANCELLED'].includes(b.status) && (
                      <div className="bg-gray-50 border-t border-gray-100 px-5 py-2.5 flex gap-2 flex-wrap">
                        {b.status === 'CONFIRMED' && (
                          <button onClick={() => handleUpdateStatus(b.booking_id, 'CHECKED_IN')} disabled={savingId === b.booking_id}
                            className="text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition disabled:opacity-60 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {savingId === b.booking_id ? 'Updating...' : 'Mark Checked-In'}
                          </button>
                        )}
                        {b.status === 'CHECKED_IN' && (
                          <button onClick={() => handleUpdateStatus(b.booking_id, 'COMPLETED')} disabled={savingId === b.booking_id}
                            className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg transition disabled:opacity-60 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {savingId === b.booking_id ? 'Updating...' : 'Mark Completed'}
                          </button>
                        )}
                        <button onClick={() => handleUpdateStatus(b.booking_id, 'PARTNER_CANCELLED')} disabled={savingId === b.booking_id}
                          className="text-xs font-semibold bg-white hover:bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg transition flex items-center gap-1.5">
                          <XCircle className="w-3.5 h-3.5" /> Cancel Booking
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ══════════════════════ ROOMS & RATES ══════════════════════ */}
          {activeTab === 'rooms' && hotel && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2 text-xs text-amber-700">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                Rate changes apply to all future bookings. Existing bookings are unaffected.
              </div>
              {(hotel.rooms || []).length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-xl p-10 text-center text-gray-400 text-sm">No rooms added yet.</div>
              ) : (hotel.rooms || []).map(r => {
                const lr = rooms.find(x => x.id === r.id) || r;
                return (
                  <div key={r.id} className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 hover:shadow-sm transition">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-bold text-gray-900">{r.room_type}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{r.bed_type} · Max {r.max_guests} guests</p>
                        <div className="flex gap-1.5 mt-2 flex-wrap">
                          {(r.inclusions || []).map(inc => (
                            <span key={inc} className="text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full">{inc}</span>
                          ))}
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${r.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                        {r.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Price / Night (₹)</label>
                        <input type="number" value={lr.price_per_night}
                          onChange={e => setRooms(prev => {
                            const exists = prev.find(x => x.id === r.id);
                            return exists ? prev.map(x => x.id === r.id ? { ...x, price_per_night: Number(e.target.value) } : x) : [...prev, { ...r, price_per_night: Number(e.target.value) }];
                          })}
                          className="w-full bg-gray-50 border-2 border-gray-200 focus:border-blue-400 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none transition"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Available Rooms</label>
                        <input type="number" min={0} max={r.total_rooms} value={lr.available_count}
                          onChange={e => setRooms(prev => {
                            const exists = prev.find(x => x.id === r.id);
                            return exists ? prev.map(x => x.id === r.id ? { ...x, available_count: Number(e.target.value) } : x) : [...prev, { ...r, available_count: Number(e.target.value) }];
                          })}
                          className="w-full bg-gray-50 border-2 border-gray-200 focus:border-blue-400 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none transition"
                        />
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Total Rooms</p>
                        <p className="text-lg font-black text-gray-800 mt-0.5">{r.total_rooms}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Blocked</p>
                        <p className="text-lg font-black text-red-500 mt-0.5">{r.blocked_rooms}</p>
                      </div>
                    </div>
                    <button onClick={() => handleSaveRoom(lr)} disabled={savingId === r.id}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2 rounded-lg transition disabled:opacity-60">
                      <Save className="w-3.5 h-3.5" />
                      {savingId === r.id ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* ══════════════════════ MY PROPERTY ══════════════════════ */}
          {activeTab === 'property' && hotel && (
            <div className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="h-52 relative">
                  <img src={hotel.main_image} alt={hotel.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-5">
                    <div>
                      <div className="flex gap-0.5 mb-1">
                        {Array.from({ length: hotel.star_rating }).map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />)}
                      </div>
                      <h2 className="text-xl font-black text-white">{hotel.name}</h2>
                      <p className="text-xs text-gray-300 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{hotel.address}, {hotel.city}</p>
                    </div>
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      ['Rating', `${hotel.rating_score} ⭐`],
                      ['Reviews', hotel.review_count],
                      ['Base Price', `₹${fmt(hotel.price_per_night)}/night`],
                      ['Commission', `${hotel.commission_percent || 10}%`],
                    ].map(([label, val]) => (
                      <div key={label} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
                        <p className="text-sm font-black text-gray-800 mt-0.5">{val}</p>
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">About This Property</p>
                    <p className="text-sm text-gray-600 leading-relaxed">{hotel.description}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Amenities</p>
                    <div className="flex flex-wrap gap-2">
                      {(hotel.amenities || []).map(a => {
                        const Icon = AMENITY_ICONS[a];
                        return (
                          <span key={a} className="flex items-center gap-1.5 text-xs font-semibold bg-white border border-gray-200 text-gray-700 px-3 py-1 rounded-full">
                            {Icon && <Icon className="w-3 h-3 text-blue-500" />} {a}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  {hotel.gallery_images?.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Gallery</p>
                      <div className="grid grid-cols-4 gap-2">
                        {hotel.gallery_images.slice(0, 4).map((img, i) => (
                          <img key={i} src={img} alt="" className="h-20 w-full object-cover rounded-xl border border-gray-200" />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════ REVENUE ══════════════════════ */}
          {activeTab === 'revenue' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                {[
                  { label: 'Gross Revenue',      value: grossRev,   bg: 'bg-gray-50',    vColor: 'text-gray-900',    desc: 'Customer total payments' },
                  { label: 'Platform Commission', value: commission, bg: 'bg-red-50',     vColor: 'text-red-600',     desc: `${hotel?.commission_percent || 10}% Trumitrip fee` },
                  { label: 'Your Net Payout',     value: netPayout,  bg: 'bg-emerald-50', vColor: 'text-emerald-700', desc: 'To be settled to your account' },
                ].map(({ label, value, bg, vColor, desc }) => (
                  <div key={label} className={`${bg} border border-gray-200 rounded-xl p-5`}>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{label}</p>
                    <p className={`text-3xl font-black mt-2 ${vColor}`}>₹{fmt(value)}</p>
                    <p className="text-xs text-gray-400 mt-1">{desc}</p>
                  </div>
                ))}
              </div>
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h3 className="text-sm font-bold text-gray-900">Booking-wise Payout Ledger</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        {['Booking ID','Guest','Total Paid','Commission','Your Payout','Payout Status','Mode'].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {confirmedBkgs.length === 0 ? (
                        <tr><td colSpan={7} className="text-center py-10 text-sm text-gray-400">No confirmed bookings yet.</td></tr>
                      ) : confirmedBkgs.map(b => (
                        <tr key={b.booking_id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-xs font-bold text-blue-600">{b.booking_id}</td>
                          <td className="px-4 py-3 text-xs text-gray-700 font-semibold">{b.guest_name}</td>
                          <td className="px-4 py-3 text-xs font-bold text-gray-900">₹{fmt(b.total_price)}</td>
                          <td className="px-4 py-3 text-xs font-semibold text-red-500">-₹{fmt(b.commission_amount)}</td>
                          <td className="px-4 py-3 text-xs font-bold text-emerald-600">₹{fmt(b.net_partner_payout)}</td>
                          <td className="px-4 py-3">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${b.payout_status === 'TRANSFERRED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                              {b.payout_status || 'PENDING'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500">{b.payment_mode?.replace('_',' ')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════ REGISTER ══════════════════════ */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="max-w-2xl">
              <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Register New Property</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Fill in the details below to list your hotel on Trumitrip</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: 'Hotel Name *', key: 'name', type: 'text', placeholder: 'e.g. Taj Exotica Resort' },
                    { label: 'City *', key: 'city', type: 'text', placeholder: 'e.g. Goa' },
                    { label: 'Full Address *', key: 'address', type: 'text', placeholder: 'Street, Area, City' },
                    { label: 'Price / Night (₹) *', key: 'price_per_night', type: 'number', placeholder: '8500' },
                    { label: 'Original Price (₹)', key: 'original_price', type: 'number', placeholder: '12500' },
                    { label: 'Star Rating (1-5)', key: 'star_rating', type: 'number', placeholder: '5' },
                  ].map(({ label, key, type, placeholder }) => (
                    <div key={key}>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
                      <input type={type} required={label.includes('*')} value={newHotel[key]}
                        onChange={e => setNewHotel(p => ({ ...p, [key]: e.target.value }))}
                        placeholder={placeholder}
                        className="w-full bg-gray-50 border-2 border-gray-200 focus:border-blue-400 rounded-lg px-3 py-2.5 text-sm focus:outline-none transition"
                      />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Description</label>
                  <textarea rows={3} value={newHotel.description} onChange={e => setNewHotel(p => ({ ...p, description: e.target.value }))}
                    placeholder="Describe your property — location, unique features, guest experience..."
                    className="w-full bg-gray-50 border-2 border-gray-200 focus:border-blue-400 rounded-lg px-3 py-2.5 text-sm focus:outline-none resize-none transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Main Cover Photo <span className="text-red-500">*</span>
                  </label>
                  <label className="flex flex-col items-center justify-center w-full h-32 bg-gray-50 border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-xl cursor-pointer transition group">
                    {newHotel.main_image ? (
                      <img src={newHotel.main_image} alt="main" className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <div className="text-center">
                        <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-blue-100 flex items-center justify-center">
                          <PlusCircle className="w-4 h-4 text-blue-600" />
                        </div>
                        <p className="text-xs font-semibold text-gray-500">Click to upload main photo</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">JPG, PNG · Max 3MB</p>
                      </div>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={handleMainImageUpload} />
                  </label>
                  {newHotel.main_image && (
                    <button type="button" onClick={() => setNewHotel(p => ({ ...p, main_image: '' }))}
                      className="mt-1.5 text-[11px] text-red-500 hover:underline font-semibold">
                      Remove main photo
                    </button>
                  )}
                </div>

                {/* Gallery photos */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Gallery Photos <span className="text-gray-400 font-normal">(Up to 5 photos)</span>
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {(newHotel.gallery_images || []).map((img, idx) => (
                      <div key={idx} className="relative w-20 h-16 rounded-lg overflow-hidden border border-gray-200 group">
                        <img src={img} alt={`gallery ${idx}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeGalleryImage(idx)}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition"
                        >
                          <XCircle className="w-5 h-5 text-white" />
                        </button>
                      </div>
                    ))}
                    {(newHotel.gallery_images || []).length < 5 && (
                      <label className="w-20 h-16 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 flex flex-col items-center justify-center cursor-pointer transition">
                        <PlusCircle className="w-4 h-4 text-gray-400" />
                        <p className="text-[9px] text-gray-400 mt-0.5 font-semibold">Add</p>
                        <input type="file" accept="image/*" multiple className="hidden" onChange={handleGalleryUpload} />
                      </label>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1.5">
                    {(newHotel.gallery_images || []).length}/5 photos added · These show in the hotel details slideshow
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2">Amenities</label>
                  <div className="flex flex-wrap gap-2">
                    {['WiFi','Pool','Spa','Breakfast','AC','Gym','Beachfront','Bar','Parking','Valet','Restaurant','Room Service','FREE Cancellation'].map(a => (
                      <button key={a} type="button"
                        onClick={() => setNewHotel(p => ({ ...p, amenities: p.amenities.includes(a) ? p.amenities.filter(x => x !== a) : [...p.amenities, a] }))}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition ${newHotel.amenities.includes(a) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'}`}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                </div>
                <button type="submit" disabled={registering}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-3 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-60">
                  {registering ? <><RefreshCw className="w-4 h-4 animate-spin" /> Registering...</> : <><PlusCircle className="w-4 h-4" /> Register Property</>}
                </button>
              </div>
            </form>
          )}

        </main>
      </div>
    </div>
  );
}
