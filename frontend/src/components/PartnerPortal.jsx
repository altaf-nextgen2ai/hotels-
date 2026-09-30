import React, { useState, useEffect } from 'react';
import { 
  Store, Building, DollarSign, Calendar, Save, Check, Users, Shield, 
  LogOut, PlusCircle, Hotel, Star, MapPin, Sparkles, TrendingUp, Clock, 
  Search, Bell, ChevronDown, Eye, MoreVertical, Filter, ArrowUpRight, 
  ArrowDownRight, HelpCircle, Settings, Layers, ShoppingBag, FileText, 
  CheckCircle2, Flame, Gift, RefreshCw, Image, Upload, Tag
} from 'lucide-react';
import { apiService } from '../services/api';

const PRESET_HOTEL_IMAGES = [
  { label: 'Luxury Beach Resort', url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Royal Palace & Heritage', url: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Modern Mountain Villa', url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Boutique City Hotel', url: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80' },
];

const AVAILABLE_AMENITIES = [
  "WiFi", "Pool", "Spa", "Breakfast", "AC", "Gym", "Beachfront", "Bar", "Parking", "Valet", "Restaurant", "Room Service", "FREE Cancellation", "Pay at Hotel"
];

export default function PartnerPortal({ hotels = [], currentUser, onLogout, onRefreshHotels }) {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'inventory', 'register', 'bookings'
  const [searchQuery, setSearchQuery] = useState('');

  // Smooth Tab Switcher with Auto Scroll to Top
  const switchTab = (tabName) => {
    setActiveTab(tabName);
    setTimeout(() => {
      const mainEl = document.getElementById('vendor-portal-main-content');
      if (mainEl) mainEl.scrollTop = 0;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);
  };

  // Track hotels created by this vendor in local state & localStorage
  const [userCreatedHotelIds, setUserCreatedHotelIds] = useState(() => {
    const saved = localStorage.getItem(`vendor_hotels_${currentUser?.id || 'guest'}`);
    return saved ? JSON.parse(saved) : [];
  });

  // Filter vendor's owned/assigned hotels only
  const vendorHotels = currentUser?.role === 'ADMIN' 
    ? hotels 
    : hotels.filter(h => h.id == currentUser?.hotel || userCreatedHotelIds.includes(h.id));

  const defaultHotel = vendorHotels[0] || null;
  const [selectedHotelId, setSelectedHotelId] = useState(defaultHotel?.id || null);

  // Current Active Hotel Object
  const selectedHotel = vendorHotels.find(h => h.id == selectedHotelId) || defaultHotel || null;

  // Rate & Inventory Form
  const [roomPrice, setRoomPrice] = useState(selectedHotel?.price_per_night || 8500);
  const [inventoryCount, setInventoryCount] = useState(selectedHotel?.rooms?.[0]?.available_count || 8);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Hotel Bookings List
  const [hotelBookings, setHotelBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  // New Hotel Registration Form State
  const [newHotel, setNewHotel] = useState({
    name: '',
    city: 'Goa',
    destination: 'Goa',
    address: '',
    price_per_night: 8500,
    original_price: 12500,
    star_rating: 5,
    rating_score: 4.8,
    main_image: PRESET_HOTEL_IMAGES[0].url,
    amenities: ["WiFi", "Pool", "Breakfast", "AC", "Spa", "FREE Cancellation", "Pay at Hotel"],
    description: '',
    is_featured: true
  });

  const [registeringHotel, setRegisteringHotel] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [registerError, setRegisterError] = useState('');

  // Sync selected hotel state when switching
  useEffect(() => {
    if (selectedHotel) {
      setRoomPrice(selectedHotel.price_per_night || 8500);
      setInventoryCount(selectedHotel.rooms?.[0]?.available_count || 8);
    }
  }, [selectedHotelId, hotels, selectedHotel]);

  // Fetch Bookings for Selected Hotel
  const fetchHotelBookings = async () => {
    if (!selectedHotelId) {
      setHotelBookings([]);
      return;
    }
    setLoadingBookings(true);
    const bData = await apiService.getBookings();
    if (bData && Array.isArray(bData)) {
      setHotelBookings(bData.filter(b => b.hotel == selectedHotelId || b.hotel_id == selectedHotelId));
    } else {
      setHotelBookings([]);
    }
    setLoadingBookings(false);
  };

  useEffect(() => {
    fetchHotelBookings();
  }, [selectedHotelId]);

  // Handle Rate Update
  const handleUpdateRates = async (e) => {
    e.preventDefault();
    if (!selectedHotelId) return;
    setIsSaving(true);

    await apiService.updatePartnerRates({
      hotel_id: selectedHotelId,
      room_id: selectedHotel?.rooms?.[0]?.id || 1,
      new_price: roomPrice,
      inventory: inventoryCount
    });

    if (onRefreshHotels) await onRefreshHotels();
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Handle New Hotel Registration
  const handleRegisterHotel = async (e) => {
    e.preventDefault();
    if (!newHotel.name || !newHotel.address || !newHotel.city) {
      setRegisterError("Hotel property name, city, and address are required.");
      return;
    }

    setRegisteringHotel(true);
    setRegisterError('');

    const payload = {
      name: newHotel.name,
      city: newHotel.city,
      destination: newHotel.city || newHotel.destination || 'Goa',
      address: newHotel.address,
      price_per_night: Number(newHotel.price_per_night) || 8500,
      original_price: Number(newHotel.original_price) || 12500,
      star_rating: Number(newHotel.star_rating) || 5,
      rating_score: Number(newHotel.rating_score) || 4.8,
      review_count: 1,
      main_image: newHotel.main_image || PRESET_HOTEL_IMAGES[0].url,
      gallery_images: [newHotel.main_image || PRESET_HOTEL_IMAGES[0].url],
      amenities: newHotel.amenities.length > 0 ? newHotel.amenities : ["WiFi", "Pool", "Breakfast", "AC"],
      description: newHotel.description?.trim() || `${newHotel.name} is a premier luxury stay located in ${newHotel.city}. Offers world-class hospitality and premium amenities.`,
      is_featured: Boolean(newHotel.is_featured)
    };

    const res = await apiService.createHotel(payload);
    setRegisteringHotel(false);

    if (res && res.id) {
      setRegisterSuccess(true);
      const updatedIds = [...userCreatedHotelIds, res.id];
      setUserCreatedHotelIds(updatedIds);
      localStorage.setItem(`vendor_hotels_${currentUser?.id || 'guest'}`, JSON.stringify(updatedIds));

      if (onRefreshHotels) await onRefreshHotels();
      setSelectedHotelId(res.id);
      
      // Reset Form
      setNewHotel({
        name: '',
        city: 'Goa',
        destination: 'Goa',
        address: '',
        price_per_night: 8500,
        original_price: 12500,
        star_rating: 5,
        rating_score: 4.8,
        main_image: PRESET_HOTEL_IMAGES[0].url,
        amenities: ["WiFi", "Pool", "Breakfast", "AC", "Spa", "FREE Cancellation", "Pay at Hotel"],
        description: '',
        is_featured: true
      });

      setTimeout(() => {
        setRegisterSuccess(false);
        setActiveTab('dashboard');
      }, 1500);
    } else {
      console.error("Hotel Registration API Error:", res);
      let errorMsg = "Failed to register hotel. Please check required fields.";
      if (typeof res === 'object' && res !== null) {
        const errKeys = Object.keys(res);
        if (errKeys.length > 0) {
          errorMsg = errKeys.map(k => `${k}: ${Array.isArray(res[k]) ? res[k].join(', ') : res[k]}`).join(' | ');
        }
      }
      setRegisterError(errorMsg);
    }
  };

  // Toggle Amenity Selection
  const toggleAmenity = (item) => {
    if (newHotel.amenities.includes(item)) {
      setNewHotel({ ...newHotel, amenities: newHotel.amenities.filter(a => a !== item) });
    } else {
      setNewHotel({ ...newHotel, amenities: [...newHotel.amenities, item] });
    }
  };

  // Handle Local Device Image File Upload
  const handleImageFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Image file size should be less than 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewHotel(prev => ({ ...prev, main_image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Calculate Metrics
  const totalRevenue = hotelBookings.reduce((sum, b) => sum + Number(b.total_price || 0), 0);
  const confirmedCount = hotelBookings.filter(b => b.status !== 'CANCELLED').length;

  // Approval Pending Guard for Vendors
  if (currentUser?.role === 'VENDOR' && currentUser?.vendor_status !== 'APPROVED' && currentUser?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-12 flex items-center justify-center">
        <div className="max-w-xl w-full bg-slate-800 border border-slate-700 rounded-3xl p-8 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-3xl flex items-center justify-center mx-auto shadow-lg">
            <Clock className="w-8 h-8 animate-pulse" />
          </div>

          <div className="space-y-2">
            <span className="bg-amber-500/20 text-amber-300 text-xs font-black px-3 py-1 rounded-full uppercase border border-amber-500/30">
              Application Under Review
            </span>
            <h2 className="text-2xl font-black text-white">Vendor Approval Pending</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Welcome <span className="text-amber-400 font-bold">{currentUser?.name}</span>! Your partner vendor account has been submitted to the TRUMITRIP Administration team.
            </p>
          </div>

          <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-700/80 text-left text-xs space-y-2">
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400 font-medium">Applicant Email:</span>
              <span className="font-bold text-white">{currentUser?.email}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400 font-medium">Role:</span>
              <span className="font-bold text-amber-400 uppercase">Hotel Partner / Vendor</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-medium">Approval Status:</span>
              <span className="bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded text-[10px] uppercase">
                PENDING ADMIN APPROVAL
              </span>
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-3">
            <button 
              onClick={onLogout}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs py-3 rounded-xl transition"
            >
              Sign Out & Check Later
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans flex overflow-x-hidden">
      
      {/* ================= LEFT SIDEBAR NAVIGATION ================= */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between shrink-0 shadow-2xl z-20 hidden md:flex">
        <div>
          {/* Brand Header */}
          <div className="p-6 border-b border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-slate-950 flex items-center justify-center font-black text-xl shadow-lg">
              T
            </div>
            <div>
              <h2 className="font-black text-white text-lg tracking-tight leading-none">TRUMITRIP</h2>
              <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mt-1">Vendor Portal</p>
            </div>
          </div>

          {/* Navigation Menu Links */}
          <nav className="p-4 space-y-1">
            <div className="px-3 py-2 text-[10px] font-black text-slate-500 uppercase tracking-wider">Hotel Partner App</div>

            <button 
              onClick={() => switchTab('dashboard')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-extrabold transition-all duration-200 ${
                activeTab === 'dashboard' 
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-lg' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Layers className="w-4 h-4" />
                <span>Overview & KPI</span>
              </div>
            </button>

            <button 
              onClick={() => switchTab('register')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-extrabold transition-all duration-200 ${
                activeTab === 'register' 
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-lg' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Hotel className="w-4 h-4" />
                <span>🏨 Register Hotel</span>
              </div>
              <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
            </button>

            <button 
              onClick={() => switchTab('add-rooms')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-extrabold transition-all duration-200 ${
                activeTab === 'add-rooms' 
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-lg' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Building className="w-4 h-4" />
                <span>🛏️ Add Rooms</span>
              </div>
            </button>

            <button 
              onClick={() => switchTab('set-price')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-extrabold transition-all duration-200 ${
                activeTab === 'set-price' 
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-lg' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Tag className="w-4 h-4" />
                <span>💰 Set Price</span>
              </div>
            </button>

            <button 
              onClick={() => switchTab('inventory')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-extrabold transition-all duration-200 ${
                activeTab === 'inventory' 
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-lg' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Store className="w-4 h-4" />
                <span>📅 Availability</span>
              </div>
            </button>

            <button 
              onClick={() => switchTab('bookings')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-extrabold transition-all duration-200 ${
                activeTab === 'bookings' 
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-lg' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4" />
                <span>📋 Manage Bookings</span>
              </div>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/30">
                {hotelBookings.length}
              </span>
            </button>

            <button 
              onClick={() => switchTab('revenue')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-extrabold transition-all duration-200 ${
                activeTab === 'revenue' 
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-lg' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <DollarSign className="w-4 h-4" />
                <span>💵 Revenue & Payouts</span>
              </div>
            </button>

            <div className="px-3 pt-6 pb-2 text-[10px] font-black text-slate-500 uppercase tracking-wider">Account & Help</div>

            <button 
              onClick={() => switchTab('inventory')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>

            <button 
              onClick={() => alert("TRUMITRIP Vendor Support: support@trumitrip.com")}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Help & Support</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer User Profile */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-emerald-400 text-sm">
                {currentUser?.name ? currentUser.name[0].toUpperCase() : 'V'}
              </div>
              <div className="max-w-[110px] truncate">
                <p className="text-xs font-extrabold text-white truncate">{currentUser?.name || 'Vendor Partner'}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Hotel Vendor</p>
              </div>
            </div>

            <button 
              onClick={onLogout}
              title="Sign Out"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ================= MAIN CONTENT CONTAINER ================= */}
      <div id="vendor-portal-main-content" className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Top Header Bar */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-xs">
          <div className="flex items-center gap-4">
            {/* Mobile Tab Switcher */}
            <div className="md:hidden flex items-center gap-2">
              <span className="font-black text-slate-900 text-base">TRUMITRIP</span>
            </div>

            <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight hidden sm:block">
              Good morning, <span className="text-emerald-600">{currentUser?.name?.split(' ')[0] || 'Partner'}!</span>
            </h1>
          </div>

          {/* Search Bar & User Actions */}
          <div className="flex items-center gap-4">
            
            {/* Search Input */}
            <div className="relative hidden lg:block w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input 
                type="text"
                placeholder="Search bookings, guests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100 text-slate-800 text-xs font-bold pl-9 pr-4 py-2.5 rounded-xl border border-transparent focus:border-emerald-500 focus:bg-white focus:outline-none transition"
              />
            </div>

            {/* Notification Bell */}
            <button className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl relative transition">
              <Bell className="w-4 h-4" />
              <span className="w-2 h-2 bg-emerald-500 rounded-full absolute top-2 right-2 border-2 border-white"></span>
            </button>

            {/* Vendor Profile Pill */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <img 
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80" 
                alt="Profile" 
                className="w-9 h-9 rounded-full object-cover border border-emerald-500 shadow-xs"
              />
              <div className="hidden sm:block text-left">
                <p className="text-xs font-extrabold text-slate-900 leading-tight">{currentUser?.name || 'Vendor Admin'}</p>
                <p className="text-[9px] font-bold text-slate-500 uppercase">Hotel Partner</p>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Body Content */}
        <main className="p-4 md:p-8 space-y-6">
          
          {/* Active Property Selector Header Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl">
                <Building className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Active Managing Property</span>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <span>{selectedHotel ? selectedHotel.name : 'No Property Listed Yet'}</span>
                  {selectedHotel && (
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                      ★ {selectedHotel.star_rating} Star Luxury
                    </span>
                  )}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              {vendorHotels.length > 1 && (
                <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 px-3 py-2 rounded-xl">
                  <span className="text-xs font-bold text-slate-600">Property:</span>
                  <select 
                    value={selectedHotelId || ''}
                    onChange={(e) => setSelectedHotelId(e.target.value)}
                    className="bg-transparent font-black text-xs text-slate-900 focus:outline-none"
                  >
                    {vendorHotels.map(h => (
                      <option key={h.id} value={h.id}>{h.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <button 
                onClick={() => switchTab('register')}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl shadow transition flex items-center gap-1.5 ml-auto"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Add Property</span>
              </button>
            </div>
          </div>

          {/* ================= TAB 1: OVERVIEW DASHBOARD VIEW ================= */}
          {activeTab === 'dashboard' && (
            <>
              {/* 4 TOP KPI METRIC CARDS ROW */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                
                {/* KPI 1: Vendor Hotels */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-2xl font-black text-slate-900">{vendorHotels.length}</h4>
                      <p className="text-xs font-bold text-slate-500 mt-0.5">Properties Listed</p>
                    </div>
                    <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-2xl">
                      <Hotel className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 w-fit px-2 py-0.5 rounded-md">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{vendorHotels.length > 0 ? 'Active & Live' : 'Registration Pending'}</span>
                  </div>
                </div>

                {/* KPI 2: Total Confirmed Reservations */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-2xl font-black text-slate-900">{confirmedCount}</h4>
                      <p className="text-xs font-bold text-slate-500 mt-0.5">Total Reservations</p>
                    </div>
                    <div className="p-3 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-2xl">
                      <ShoppingBag className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-1 text-[11px] font-bold text-indigo-600 bg-indigo-50 w-fit px-2 py-0.5 rounded-md">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Live Bookings</span>
                  </div>
                </div>

                {/* KPI 3: Available Room Stock */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-2xl font-black text-slate-900">
                        {selectedHotel ? (selectedHotel?.rooms?.[0]?.available_count || inventoryCount || 0) : 0} Rooms
                      </h4>
                      <p className="text-xs font-bold text-slate-500 mt-0.5">Available Stock</p>
                    </div>
                    <div className="p-3 bg-amber-50 border border-amber-100 text-amber-600 rounded-2xl">
                      <Store className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 w-fit px-2 py-0.5 rounded-md">
                    <Building className="w-3.5 h-3.5" />
                    <span>Inventory Control</span>
                  </div>
                </div>

                {/* KPI 4: Total Revenue */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-2xl font-black text-slate-900">
                        ₹{totalRevenue.toLocaleString('en-IN')}
                      </h4>
                      <p className="text-xs font-bold text-slate-500 mt-0.5">Total Earnings</p>
                    </div>
                    <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl">
                      <DollarSign className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 w-fit px-2 py-0.5 rounded-md">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Real Revenue</span>
                  </div>
                </div>

              </div>

              {/* MIDDLE ROW: REVENUE REPORT CHART & RECENT ACTIVITY FEED */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Revenue Report Multi-Curve Chart (2 Cols) */}
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                      <div>
                        <h3 className="text-lg font-black text-slate-900">Revenue Report</h3>
                        <p className="text-xs text-slate-400 font-medium">Real live earnings calculated from customer bookings</p>
                      </div>

                      {/* Legend & Month Dropdown */}
                      <div className="flex items-center gap-4">
                        <div className="hidden sm:flex items-center gap-4 text-xs font-bold">
                          <span className="flex items-center gap-1.5 text-indigo-600">
                            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                            Real Revenue: ₹{totalRevenue.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* SVG Multi-Curve Chart Visualization */}
                    <div className="relative h-64 w-full pt-4">
                      
                      {/* Tooltip Badge on Peak */}
                      <div className="absolute left-[40%] top-[15%] bg-slate-900 text-white text-[11px] font-black px-3 py-1.5 rounded-xl shadow-lg flex flex-col items-center z-10">
                        <span>₹{totalRevenue.toLocaleString('en-IN')}</span>
                        <span className="text-[9px] text-emerald-400 font-bold">Total Sales</span>
                        <div className="w-2 h-2 bg-slate-900 rotate-45 -mb-1"></div>
                      </div>

                      <svg className="w-full h-full overflow-visible" viewBox="0 0 600 200" preserveAspectRatio="none">
                        {/* Background Grid Lines */}
                        <line x1="0" y1="40" x2="600" y2="40" stroke="#f1f5f9" strokeDasharray="4 4" />
                        <line x1="0" y1="90" x2="600" y2="90" stroke="#f1f5f9" strokeDasharray="4 4" />
                        <line x1="0" y1="140" x2="600" y2="140" stroke="#f1f5f9" strokeDasharray="4 4" />

                        {/* Curve: Earnings (Indigo) */}
                        <path 
                          d={totalRevenue > 0 
                            ? "M 0 150 Q 150 180 250 50 T 450 80 T 600 120" 
                            : "M 0 160 Q 200 160 400 160 T 600 160"
                          } 
                          fill="none" 
                          stroke="#6366f1" 
                          strokeWidth="3.5" 
                        />

                        {/* Curve 2: Bookings (Teal) */}
                        <path 
                          d={confirmedCount > 0 
                            ? "M 0 170 Q 120 120 230 90 T 420 110 T 600 140" 
                            : "M 0 175 Q 200 175 400 175 T 600 175"
                          } 
                          fill="none" 
                          stroke="#14b8a6" 
                          strokeWidth="3" 
                        />

                        {/* Data Points */}
                        {totalRevenue > 0 && (
                          <circle cx="250" cy="50" r="5" fill="#6366f1" stroke="#ffffff" strokeWidth="2" />
                        )}
                      </svg>

                      {/* Month Labels */}
                      <div className="flex justify-between text-xs font-bold text-slate-400 mt-2 px-2">
                        <span>Jan</span>
                        <span>Feb</span>
                        <span>Mar</span>
                        <span>Apr</span>
                        <span>May</span>
                        <span>Jun</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Activity Feed Column (1 Col) */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                      <h3 className="text-lg font-black text-slate-900">Recent Activity</h3>
                      <MoreVertical className="w-4 h-4 text-slate-400 cursor-pointer" />
                    </div>

                    {hotelBookings.length === 0 ? (
                      <div className="py-8 text-center space-y-2">
                        <Clock className="w-8 h-8 text-slate-300 mx-auto" />
                        <p className="text-xs font-bold text-slate-500">No guest activity yet</p>
                        <p className="text-[10px] text-slate-400">Customer reservations will appear here live when booked.</p>
                      </div>
                    ) : (
                      <div className="space-y-4 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                        {hotelBookings.slice(0, 4).map((b, idx) => (
                          <div key={b.id || idx} className="relative pl-6">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 absolute left-[3px] top-1 border-2 border-white"></span>
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-extrabold text-slate-900">{b.guest_name}</span>
                              <span className="text-[10px] text-emerald-600 font-bold uppercase">{b.status || 'CONFIRMED'}</span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Booking <span className="font-mono text-indigo-600 font-bold">{b.booking_id}</span> ({b.check_in} - {b.check_out})
                            </p>
                            <p className="text-[11px] font-black text-slate-900 mt-1">
                              ₹{Number(b.total_price).toLocaleString('en-IN')}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* BOTTOM SECTION: BEST SELLING ROOMS & PROPERTY INVENTORY TABLE */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                
                {/* Table Header Controls */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <h3 className="text-lg font-black text-slate-900">Registered Property & Room Inventory</h3>

                  <div className="flex items-center gap-3 flex-wrap w-full sm:w-auto">
                    {/* Search inside table */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input 
                        type="text"
                        placeholder="Search properties..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-slate-100 text-xs font-bold text-slate-800 pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Data Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                        <th className="py-3 px-3">PROPERTY ID</th>
                        <th className="py-3 px-3">HOTEL / PROPERTY NAME</th>
                        <th className="py-3 px-3">CATEGORY</th>
                        <th className="py-3 px-3">LOCATION</th>
                        <th className="py-3 px-3">NIGHTLY PRICE</th>
                        <th className="py-3 px-3">ROOM STOCK</th>
                        <th className="py-3 px-3">RATING</th>
                        <th className="py-3 px-3">RESERVATIONS</th>
                        <th className="py-3 px-3">TOTAL REVENUE</th>
                        <th className="py-3 px-3 text-right">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
                      
                      {vendorHotels.length === 0 ? (
                        <tr>
                          <td colSpan="10" className="py-8 text-center text-slate-400">
                            No hotel property registered yet. Click <span className="text-emerald-600 font-extrabold cursor-pointer" onClick={() => setActiveTab('register')}>"Register Hotel"</span> to list your property.
                          </td>
                        </tr>
                      ) : (
                        vendorHotels.map((h, idx) => {
                          const hBookings = hotelBookings.filter(b => b.hotel == h.id || b.hotel_id == h.id);
                          const hRev = hBookings.reduce((sum, b) => sum + Number(b.total_price || 0), 0);

                          return (
                            <tr key={h.id} className="hover:bg-slate-50/80 transition">
                              <td className="py-3.5 px-3 text-slate-400 font-mono">#P-{h.id}</td>
                              <td className="py-3.5 px-3 font-extrabold text-slate-900 flex items-center gap-2">
                                <img src={h.main_image} alt={h.name} className="w-8 h-8 rounded-lg object-cover" />
                                <span>{h.name}</span>
                              </td>
                              <td className="py-3.5 px-3 text-slate-500 font-medium">{h.star_rating} Star Luxury</td>
                              <td className="py-3.5 px-3">{h.city}, {h.destination}</td>
                              <td className="py-3.5 px-3 font-black text-slate-900">₹{Number(h.price_per_night).toLocaleString('en-IN')}</td>
                              <td className="py-3.5 px-3 text-slate-600">{h.rooms?.[0]?.available_count || inventoryCount || 8} Rooms</td>
                              <td className="py-3.5 px-3 text-emerald-600 font-black">{h.rating_score} ★</td>
                              <td className="py-3.5 px-3">{hBookings.length} Bookings</td>
                              <td className="py-3.5 px-3 font-black text-emerald-600">₹{hRev.toLocaleString('en-IN')}</td>
                              <td className="py-3.5 px-3 text-right">
                                <button 
                                  onClick={() => { setSelectedHotelId(h.id); setActiveTab('inventory'); }}
                                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-black rounded-lg transition"
                                >
                                  Update Rates
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}

                    </tbody>
                  </table>
                </div>

                {/* Table Footer Pagination */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs font-bold text-slate-500">
                  <span>Showing {vendorHotels.length} Properties</span>
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-1 bg-emerald-600 text-white font-black rounded-lg">01</button>
                  </div>
                </div>

              </div>
            </>
          )}

          {/* ================= TAB 2: ROOM RATES & INVENTORY ================= */}
          {activeTab === 'inventory' && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
              <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-slate-900">Manage Room Rates & Daily Inventory</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Set nightly prices and available room count for live publishing on TRUMITRIP.
                  </p>
                </div>
                <button 
                  onClick={() => setActiveTab('register')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Register New Hotel Property</span>
                </button>
              </div>

              {!selectedHotel ? (
                <div className="p-8 text-center space-y-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <Hotel className="w-12 h-12 text-slate-400 mx-auto" />
                  <h4 className="text-base font-black text-slate-800">No Active Property Assigned</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    You haven't listed a hotel property yet. Click below to register your hotel manually.
                  </p>
                  <button 
                    onClick={() => setActiveTab('register')}
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-black text-xs px-5 py-3 rounded-xl shadow"
                  >
                    Register Your Hotel Property Now
                  </button>
                </div>
              ) : (
                <form onSubmit={handleUpdateRates} className="space-y-6 max-w-2xl">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">Nightly Rate for Deluxe Room (₹) *</label>
                      <input 
                        type="number"
                        required
                        value={roomPrice}
                        onChange={(e) => setRoomPrice(e.target.value)}
                        className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-black text-slate-900 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">Available Daily Room Stock *</label>
                      <input 
                        type="number"
                        required
                        value={inventoryCount}
                        onChange={(e) => setInventoryCount(e.target.value)}
                        className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-black text-slate-900 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={isSaving}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-black text-sm py-4 rounded-xl hover:brightness-105 shadow-md transition flex items-center justify-center gap-2"
                  >
                    {isSaving ? (
                      <span>Publishing Changes...</span>
                    ) : saveSuccess ? (
                      <>
                        <Check className="w-5 h-5" />
                        <span>Published Live to TRUMITRIP!</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        <span>Publish Updated Rates & Inventory</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ================= TAB 3: REGISTER NEW HOTEL PROPERTY ================= */}
          {activeTab === 'register' && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-xl font-black text-slate-900">Register New Hotel Property</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Fill out complete property details for instant listing on TRUMITRIP.
                </p>
              </div>

              {registerError && (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 font-bold text-xs rounded-xl">
                  {registerError}
                </div>
              )}

              {registerSuccess && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Hotel property registered successfully! Redirecting...</span>
                </div>
              )}

              <form onSubmit={handleRegisterHotel} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Hotel Property Name *</label>
                    <input 
                      type="text"
                      required
                      value={newHotel.name}
                      onChange={(e) => setNewHotel({ ...newHotel, name: e.target.value })}
                      placeholder="e.g. Taj Exotica Resort & Spa"
                      className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">City / Location *</label>
                    <input 
                      type="text"
                      required
                      list="portal-city-list"
                      value={newHotel.city}
                      onChange={(e) => setNewHotel({ ...newHotel, city: e.target.value, destination: e.target.value })}
                      placeholder="e.g. Udaipur, Shimla, Goa, Dubai"
                      className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:border-emerald-500 focus:outline-none"
                    />
                    <datalist id="portal-city-list">
                      {["Goa", "Mumbai", "Delhi", "Manali", "Jaipur", "Dubai", "Paris", "Singapore", "Bengaluru", "Udaipur", "Shimla", "Agra", "Kolkata", "Kochi", "Varanasi"].map(c => (
                        <option key={c} value={c} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Star Rating</label>
                    <select 
                      value={newHotel.star_rating}
                      onChange={(e) => setNewHotel({ ...newHotel, star_rating: Number(e.target.value) })}
                      className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:border-emerald-500 focus:outline-none"
                    >
                      <option value={5}>5 Star Luxury</option>
                      <option value={4}>4 Star Deluxe</option>
                      <option value={3}>3 Star Premium</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Property Address *</label>
                  <input 
                    type="text"
                    required
                    value={newHotel.address}
                    onChange={(e) => setNewHotel({ ...newHotel, address: e.target.value })}
                    placeholder="e.g. Benaulim Beach, South Goa, Goa 403716"
                    className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Base Price per Night (₹) *</label>
                    <input 
                      type="number"
                      required
                      value={newHotel.price_per_night}
                      onChange={(e) => setNewHotel({ ...newHotel, price_per_night: Number(e.target.value) })}
                      placeholder="8500"
                      className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Original Price (₹ - for Strike Discount)</label>
                    <input 
                      type="number"
                      value={newHotel.original_price}
                      onChange={(e) => setNewHotel({ ...newHotel, original_price: Number(e.target.value) })}
                      placeholder="12500"
                      className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">Property Main Photo *</label>
                  
                  <div className="space-y-4">
                    
                    {/* Option 1: File Upload Box */}
                    <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-5 text-center bg-slate-50 hover:bg-emerald-50/30 transition relative group cursor-pointer">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleImageFileUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-20"
                      />
                      <div className="flex flex-col items-center justify-center space-y-1.5 pointer-events-none">
                        <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl group-hover:scale-110 transition shadow-xs">
                          <Image className="w-6 h-6" />
                        </div>
                        <p className="text-xs font-black text-slate-900">
                          📸 Click or Drag to Upload Hotel Photo from Computer/Mobile
                        </p>
                        <p className="text-[10px] font-bold text-slate-500">
                          PNG, JPG, WEBP formats supported (Max size 5MB)
                        </p>
                      </div>
                    </div>

                    {/* Live Image Preview Badge */}
                    {newHotel.main_image && (
                      <div className="relative rounded-2xl overflow-hidden h-44 border-2 border-emerald-500 shadow-md group">
                        <img src={newHotel.main_image} alt="Hotel Preview" className="w-full h-full object-cover" />
                        <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md text-emerald-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>Selected Photo Preview</span>
                        </div>
                      </div>
                    )}

                    {/* Option 2: Choose Presets */}
                    <div>
                      <p className="text-[11px] font-bold text-slate-500 mb-2">Or Choose from Preset Luxury Hotel Photos:</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {PRESET_HOTEL_IMAGES.map((img, idx) => (
                          <div 
                            key={idx}
                            onClick={() => setNewHotel({ ...newHotel, main_image: img.url })}
                            className={`relative rounded-xl overflow-hidden cursor-pointer border-2 transition ${
                              newHotel.main_image === img.url ? 'border-emerald-600 scale-105 shadow-md' : 'border-slate-200 opacity-70 hover:opacity-100'
                            }`}
                          >
                            <img src={img.url} alt={img.label} className="w-full h-20 object-cover" />
                            <span className="absolute bottom-0 inset-x-0 bg-slate-900/80 text-[9px] font-bold text-white text-center p-1 truncate">
                              {img.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Option 3: Custom URL Input */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Or Enter Direct Image Web URL Link:</label>
                      <input 
                        type="text"
                        value={newHotel.main_image}
                        onChange={(e) => setNewHotel({ ...newHotel, main_image: e.target.value })}
                        placeholder="https://images.unsplash.com/photo-..."
                        className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">Select Hotel Amenities & Badges</label>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_AMENITIES.map(item => (
                      <button
                        type="button"
                        key={item}
                        onClick={() => toggleAmenity(item)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                          newHotel.amenities.includes(item)
                            ? 'bg-emerald-600 text-white shadow'
                            : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        <Check className={`w-3.5 h-3.5 ${newHotel.amenities.includes(item) ? 'opacity-100' : 'opacity-0'}`} />
                        <span>{item}</span>
                      </button>
                    ))}
                  </div>

                  <label className="flex items-center gap-2 text-xs font-bold text-emerald-800 cursor-pointer mt-3 bg-emerald-50 p-3 rounded-xl border border-emerald-200 w-fit">
                    <input 
                      type="checkbox"
                      checked={newHotel.is_featured}
                      onChange={(e) => setNewHotel({ ...newHotel, is_featured: e.target.checked })}
                      className="w-4 h-4 accent-emerald-600 rounded"
                    />
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>Enable AGODA VIP MEMBER DEAL Badge on Customer Listing</span>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Hotel Overview & Description *</label>
                  <textarea 
                    rows="3"
                    required
                    value={newHotel.description}
                    onChange={(e) => setNewHotel({ ...newHotel, description: e.target.value })}
                    placeholder="Describe your luxury hotel property, rooms, dining, and unique features..."
                    className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:border-emerald-500 focus:outline-none"
                  ></textarea>
                </div>

                <button 
                  type="submit"
                  disabled={registeringHotel}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-black text-sm py-4 rounded-xl hover:brightness-105 shadow-md transition flex items-center justify-center gap-2"
                >
                  {registeringHotel ? (
                    <span>Registering Hotel Property...</span>
                  ) : (
                    <>
                      <PlusCircle className="w-5 h-5" />
                      <span>Register Property to TRUMITRIP</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* ================= TAB 4: GUEST BOOKINGS LEDGER ================= */}
          {activeTab === 'bookings' && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
              <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-slate-900">Guest Reservations Ledger</h3>
                  <p className="text-xs text-slate-500 mt-1">Live customer bookings for {selectedHotel?.name || 'your property'}</p>
                </div>
                <button 
                  onClick={fetchHotelBookings}
                  className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition flex items-center gap-1 text-xs font-bold"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Refresh</span>
                </button>
              </div>

              {loadingBookings ? (
                <div className="py-12 text-center text-xs font-bold text-slate-400">Loading guest bookings...</div>
              ) : hotelBookings.length === 0 ? (
                <div className="py-12 text-center text-xs font-bold text-slate-400">
                  No reservations received for this hotel yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                        <th className="py-3 px-3">Booking ID</th>
                        <th className="py-3 px-3">Guest Name</th>
                        <th className="py-3 px-3">Contact</th>
                        <th className="py-3 px-3">Dates</th>
                        <th className="py-3 px-3">Amount</th>
                        <th className="py-3 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
                      {hotelBookings.map(b => (
                        <tr key={b.id} className="hover:bg-slate-50 transition">
                          <td className="py-3.5 px-3 font-mono font-black text-indigo-600">{b.booking_id}</td>
                          <td className="py-3.5 px-3 font-extrabold text-slate-900">{b.guest_name}</td>
                          <td className="py-3.5 px-3 text-slate-500">{b.guest_email}</td>
                          <td className="py-3.5 px-3">{b.check_in} to {b.check_out}</td>
                          <td className="py-3.5 px-3 font-black text-slate-900">₹{Number(b.total_price).toLocaleString('en-IN')}</td>
                          <td className="py-3.5 px-3">
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-1 rounded-full uppercase">
                              {b.status || 'CONFIRMED'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </main>
      </div>

    </div>
  );
}
