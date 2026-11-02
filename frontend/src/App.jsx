import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import HeroSearch from './components/HeroSearch';
import WhyBookWithUs from './components/WhyBookWithUs';
import PopularDestinations from './components/PopularDestinations';
import SpecialOffers from './components/SpecialOffers';
import HotelFilterSidebar from './components/HotelFilterSidebar';
import HotelCard from './components/HotelCard';
import HotelDetailsModal from './components/HotelDetailsModal';
import BookingCheckoutModal from './components/BookingCheckoutModal';
import PaymentModal from './components/PaymentModal';
import UserAccountModal from './components/UserAccountModal';
import AuthModal from './components/AuthModal';
import AdminDashboard from './components/AdminDashboard';
import PartnerPortal from './components/PartnerPortal';
import BecomePartnerPage from './components/BecomePartnerPage';
import VendorLoginPage from './components/VendorLoginPage';
import AdminLoginPage from './components/AdminLoginPage';
import Footer from './components/Footer';
import { apiService } from './services/api';
import { Building2, SlidersHorizontal, X } from 'lucide-react';

export default function App() {
  // Current view: 'customer', 'admin', 'partner', 'become-partner', 'vendor-login', 'admin-login'
  const [currentView, setCurrentView] = useState(() => {
    const savedUser = (() => {
      try { return JSON.parse(localStorage.getItem('trumitrip_user')); } catch { return null; }
    })();

    const pathname = window.location.pathname.toLowerCase();
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    const hash = window.location.hash.replace('#', '').toLowerCase();

    const isAdmin  = savedUser?.role === 'ADMIN';
    const isVendor = savedUser?.role === 'VENDOR' && savedUser?.vendor_status === 'APPROVED';

    // Dedicated login portals — always accessible
    if (pathname.includes('/vendor-login') || viewParam === 'vendor-login' || hash === 'vendor-login') return 'vendor-login';
    if (pathname.includes('/admin-login')  || viewParam === 'admin-login'  || hash === 'admin-login')  return 'admin-login';

    if (pathname.includes('/become-partner') || viewParam === 'become-partner' || hash === 'become-partner') return 'become-partner';

    // Protected views — only if already logged in with correct role
    if (pathname.includes('/partner') || pathname.includes('/vendor') || viewParam === 'partner' || viewParam === 'vendor' || hash === 'partner' || hash === 'vendor') {
      if (isAdmin) return 'admin'; // Admin goes to admin panel, not partner
      return isVendor ? 'partner' : 'vendor-login';
    }
    if (pathname.includes('/admin') || viewParam === 'admin' || hash === 'admin') {
      return isAdmin ? 'admin' : 'admin-login';
    }

    return 'customer';
  });

  // Sync browser address bar URL cleanly when switching views
  const handleNavigateView = (viewName, userOverride = currentUser) => {
    const user = userOverride || currentUser;

    // ── Role-based access guard ──────────────────────────────────────────────
    if (viewName === 'admin') {
      if (user?.role !== 'ADMIN') {
        setCurrentView('admin-login');
        window.history.pushState({}, '', '/admin-login');
        return;
      }
    }
    if (viewName === 'partner') {
      const isVendor = user?.role === 'VENDOR' && user?.vendor_status === 'APPROVED';
      // Admin cannot access partner portal — they use admin panel
      if (!isVendor) {
        if (user?.role === 'ADMIN') {
          setCurrentView('admin');
          window.history.pushState({}, '', '/admin');
        } else {
          setCurrentView('vendor-login');
          window.history.pushState({}, '', '/vendor-login');
        }
        return;
      }
    }
    setCurrentView(viewName);
    const cleanPath = viewName === 'customer' ? '/' : `/${viewName}`;
    window.history.pushState({ view: viewName }, '', cleanPath);
  };

  // Auth User State
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('trumitrip_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [showAuthModal, setShowAuthModal] = useState(false);

  // Hotel data state
  const [hotels, setHotels] = useState([]);
  const [loadingHotels, setLoadingHotels] = useState(true);

  // Search & Filter state
  const [searchDetails, setSearchDetails] = useState({
    city: '',
    checkIn: '2026-08-20',
    checkOut: '2026-08-21',
    rooms: 1,
    guests: 2
  });

  const [filters, setFilters] = useState({
    starRating: 'all',
    maxPrice: 80000,
    amenities: [],
    sortBy: 'popular'
  });

  // Modal States
  const [selectedHotelForDetails, setSelectedHotelForDetails] = useState(null);
  const [checkoutHotel, setCheckoutHotel] = useState(null);
  const [checkoutRoom,  setCheckoutRoom]  = useState(null);
  const [bookingPayloadForPayment, setBookingPayloadForPayment] = useState(null);
  const [paymentHotel, setPaymentHotel] = useState(null);
  const [paymentRoom,  setPaymentRoom]  = useState(null);

  const [showBookingsModal, setShowBookingsModal] = useState(false);
  const [userBookings, setUserBookings] = useState([]);

  // Mobile filter panel
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  // Handle User Login & Automatic Dashboard Routing
  const handleLoginSuccess = (userObj) => {
    setCurrentUser(userObj);
    localStorage.setItem('trumitrip_user', JSON.stringify(userObj));
    setShowAuthModal(false);

    // Automatic role-based redirect
    if (userObj.role === 'ADMIN') {
      handleNavigateView('admin', userObj);
    } else if (userObj.role === 'VENDOR') {
      if (userObj.vendor_status === 'APPROVED') {
        handleNavigateView('partner', userObj);
      } else {
        handleNavigateView('become-partner', userObj);
      }
    } else {
      handleNavigateView('customer', userObj);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('trumitrip_user');
    localStorage.removeItem('trumitrip_token');
    setCurrentView('customer');
  };

  // Load hotels from Django API
  const loadHotelsData = async (params = {}) => {
    setLoadingHotels(true);
    const apiData = await apiService.getHotels(params);

    if (Array.isArray(apiData)) {
      setHotels(apiData);
    } else {
      setHotels([]);
    }
    setLoadingHotels(false);
  };

  useEffect(() => {
    loadHotelsData();
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setUserBookings([]);
      return;
    }
    apiService.getBookings().then((bookings) => {
      if (Array.isArray(bookings)) setUserBookings(bookings);
    });
  }, [currentUser]);

  // Handle Search Submission
  const handleSearch = (searchData) => {
    setSearchDetails(searchData);
    // Send search query to backend — searches city, destination, name AND address
    loadHotelsData({ city: searchData.city, search: searchData.city });
    const element = document.getElementById('hotel-results-section');
    if (element) element.scrollIntoView({ behavior: 'smooth' });
  };

  // Filtered & Sorted Hotels — also searches address for area/locality names
  const filteredHotels = hotels.filter(h => {
    if (searchDetails.city && searchDetails.city.trim() !== '') {
      const q = searchDetails.city.toLowerCase().trim();
      const matchesSearch =
        h.city?.toLowerCase().includes(q) ||
        h.destination?.toLowerCase().includes(q) ||
        h.name?.toLowerCase().includes(q) ||
        h.address?.toLowerCase().includes(q) ||        // area/locality match
        h.description?.toLowerCase().includes(q);      // description match
      if (!matchesSearch) return false;
    }
    if (filters.starRating !== 'all' && h.star_rating < Number(filters.starRating)) {
      return false;
    }
    if (filters.amenities && filters.amenities.length > 0) {
      const hasAll = filters.amenities.every(a => (h.amenities || []).includes(a));
      if (!hasAll) return false;
    }
    return true;
  }).sort((a, b) => {
    if (filters.sortBy === 'price_low_high') return a.price_per_night - b.price_per_night;
    if (filters.sortBy === 'price_high_low') return b.price_per_night - a.price_per_night;
    if (filters.sortBy === 'rating') return b.rating_score - a.rating_score;
    return b.review_count - a.review_count;
  });

  // Booking flow: Book Room Now → Checkout form → Payment
  const handleBookRoomStart = (hotel, room) => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    setSelectedHotelForDetails(null);
    setCheckoutHotel(hotel);
    setCheckoutRoom(room);
  };

  const handleProceedToPayment = (payload, hotel, room) => {
    setCheckoutHotel(null);
    setCheckoutRoom(null);
    setBookingPayloadForPayment(payload);
    setPaymentHotel(hotel);
    setPaymentRoom(room);
  };

  const handleBookingSuccess = (newBooking) => {
    setUserBookings([newBooking, ...userBookings]);
  };

  const handleCancelBooking = (bookingId) => {
    setUserBookings(userBookings.map(b => b.booking_id === bookingId ? { ...b, status: 'CANCELLED' } : b));
  };

  // Don't show Header/Footer on dedicated auth portals
  const isAuthPortal = ['vendor-login', 'admin-login'].includes(currentView);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans flex flex-col justify-between">

      {/* Header — hidden on login portals */}
      {!isAuthPortal && (
      <Header 
        currentUser={currentUser}
        onOpenAuth={() => setShowAuthModal(true)}
        onLogout={handleLogout}
        onNavigateView={handleNavigateView}
        bookingsCount={userBookings.filter(b => b.status !== 'CANCELLED').length}
        onOpenBookings={() => currentUser ? setShowBookingsModal(true) : setShowAuthModal(true)}
        onOpenOffers={() => {
          const el = document.getElementById('offers-section');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
        onOpenSupport={() => alert('TRUMITRIP 24/7 Support Desk:\nToll Free: 1800-270-0297\nWhatsApp: +91 8470009000')}
      />
      )}

      {/* VIEW 1: CUSTOMER PORTAL */}
      {currentView === 'customer' && (
        <main className="flex-grow">
          {/* Hero Banner with Search Bar */}
          <HeroSearch onSearch={handleSearch} hotels={hotels} />

          {/* Why Book With Us Section */}
          <WhyBookWithUs />

          {/* Popular Destinations Grid */}
          <PopularDestinations 
            onSelectDestination={(city) => {
              setSearchDetails({ ...searchDetails, city });
              loadHotelsData({ city });
              const el = document.getElementById('hotel-results-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
          />

          {/* Special Offers Banner */}
          <div id="offers-section">
            <SpecialOffers 
              onApplyOffer={(code) => alert(`Offer Code "${code}" copied! Enter at checkout.`)}
            />
          </div>

          {/* Hotel Listings & Filters Section */}
          <section id="hotel-results-section" className="py-12 max-w-7xl mx-auto px-4 md:px-8">
            <div className="flex justify-between items-end mb-6">
              <div>
                <span className="text-xs font-bold text-amber-600 uppercase tracking-widest">Available Accommodations</span>
                <h2 className="text-2xl font-extrabold text-slate-900">
                  {searchDetails.city ? `Hotels in ${searchDetails.city}` : 'Top Luxury & Budget Hotels'}
                </h2>
                <p className="text-xs text-slate-500 font-medium">Showing {filteredHotels.length} verified stays with best price guarantee</p>
              </div>
            </div>

            {/* Mobile Filters toggle button */}
            <div className="md:hidden mb-4">
              <button
                onClick={() => setShowMobileFilter(!showMobileFilter)}
                className="flex items-center gap-2 bg-white border border-slate-200 shadow-sm text-slate-700 font-bold text-sm px-4 py-3 rounded-xl w-full justify-between min-h-[44px]"
              >
                <span className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-[#D4AF37]" />
                  Filters &amp; Sort
                  {(filters.starRating !== 'all' || filters.amenities.length > 0) && (
                    <span className="bg-[#D4AF37] text-slate-950 text-[10px] font-black px-1.5 py-0.5 rounded-full">
                      {(filters.starRating !== 'all' ? 1 : 0) + filters.amenities.length}
                    </span>
                  )}
                </span>
                {showMobileFilter
                  ? <X className="w-4 h-4 text-slate-400" />
                  : <span className="text-xs text-slate-400">{showMobileFilter ? 'Hide' : 'Show'}</span>
                }
              </button>
            </div>

            {/* Mobile filter panel */}
            {showMobileFilter && (
              <div className="md:hidden mb-4">
                <HotelFilterSidebar 
                  filters={filters}
                  setFilters={setFilters}
                  onReset={() => { setFilters({ starRating: 'all', maxPrice: 80000, amenities: [], sortBy: 'popular' }); setShowMobileFilter(false); }}
                />
                <button
                  onClick={() => setShowMobileFilter(false)}
                  className="mt-3 w-full bg-[#0F172A] text-[#D4AF37] font-black text-sm py-3 rounded-xl min-h-[44px]"
                >
                  Apply Filters
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Filter Sidebar — desktop only */}
              <div className="hidden md:block lg:col-span-4">
                <HotelFilterSidebar 
                  filters={filters}
                  setFilters={setFilters}
                  onReset={() => setFilters({ starRating: 'all', maxPrice: 80000, amenities: [], sortBy: 'popular' })}
                />
              </div>

              {/* Hotel Cards List */}
              <div className="lg:col-span-8 space-y-4">
                {loadingHotels ? (
                  <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
                    <div className="w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-xs font-bold text-slate-600 mt-3">Searching TRUMITRIP Verified Hotels...</p>
                  </div>
                ) : filteredHotels.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
                    <Building2 className="w-12 h-12 mx-auto text-slate-400 mb-2" />
                    <p className="font-extrabold text-base text-slate-800">No Hotels Found</p>
                    <p className="text-xs text-slate-500">Try adjusting your filters or price range.</p>
                  </div>
                ) : (
                  filteredHotels.map((hotel) => (
                    <HotelCard 
                      key={hotel.id}
                      hotel={hotel}
                      onSelectHotel={(h) => setSelectedHotelForDetails(h)}
                    />
                  ))
                )}
              </div>

            </div>
          </section>
        </main>
      )}

      {/* VIEW 2: ADMIN PANEL */}
      {currentView === 'admin' && (
        <AdminDashboard 
          hotels={hotels}
          bookings={userBookings}
          onRefreshData={loadHotelsData}
        />
      )}

      {/* VIEW 3: PARTNER / VENDOR PORTAL */}
      {currentView === 'partner' && (
        <PartnerPortal 
          hotels={hotels} 
          currentUser={currentUser}
          onLogout={handleLogout}
          onRefreshHotels={loadHotelsData}
        />
      )}

      {/* VIEW 4: DEDICATED BECOME A PARTNER PAGE */}
      {currentView === 'become-partner' && (
        <BecomePartnerPage 
          currentUser={currentUser}
          onLoginSuccess={handleLoginSuccess}
          onNavigateView={handleNavigateView}
          onLogout={handleLogout}
        />
      )}

      {/* VIEW 5: VENDOR LOGIN PORTAL */}
      {currentView === 'vendor-login' && (
        <VendorLoginPage
          onLoginSuccess={handleLoginSuccess}
          onNavigateView={handleNavigateView}
        />
      )}

      {/* VIEW 6: ADMIN LOGIN PORTAL */}
      {currentView === 'admin-login' && (
        <AdminLoginPage
          onLoginSuccess={handleLoginSuccess}
          onNavigateView={handleNavigateView}
        />
      )}

      {/* AUTH MODAL (Login / Signup) */}
      {showAuthModal && (
        <AuthModal 
          onClose={() => setShowAuthModal(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      {/* MODALS */}
      {selectedHotelForDetails && (
        <HotelDetailsModal 
          hotel={selectedHotelForDetails}
          onClose={() => setSelectedHotelForDetails(null)}
          onBookRoom={handleBookRoomStart}
        />
      )}

      {checkoutHotel && checkoutRoom && (
        <BookingCheckoutModal
          hotel={checkoutHotel}
          room={checkoutRoom}
          currentUser={currentUser}
          searchDetails={searchDetails}
          onClose={() => { setCheckoutHotel(null); setCheckoutRoom(null); }}
          onProceedToPayment={handleProceedToPayment}
        />
      )}

      {bookingPayloadForPayment && paymentHotel && paymentRoom && (
        <PaymentModal 
          bookingPayload={bookingPayloadForPayment}
          hotel={paymentHotel}
          room={paymentRoom}
          onClose={() => setBookingPayloadForPayment(null)}
          onBookingSuccess={handleBookingSuccess}
        />
      )}

      {showBookingsModal && (
        <UserAccountModal 
          currentUser={currentUser}
          userBookings={userBookings}
          onClose={() => setShowBookingsModal(false)}
          onCancelBooking={handleCancelBooking}
        />
      )}

      {/* Footer — hidden on login portals */}
      {!isAuthPortal && <Footer onNavigateView={handleNavigateView} />}

    </div>
  );
}
