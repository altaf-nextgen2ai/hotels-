import React, { useCallback, useState, useEffect, useRef } from 'react';
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
import LansdowneSeoPage from './components/LansdowneSeoPage';
import PolicyPage from './components/PolicyPage';
import DestinationHotelsPage from './components/DestinationHotelsPage';
import { apiService } from './services/api';
import { getLansdowneSeoPage } from './data/lansdowneSeoPages';
import { getPolicyPage } from './data/policyPages';
import { getDestinationPage } from './data/destinationPages';
import { Building2, SlidersHorizontal, X } from 'lucide-react';

function getStoredUser() {
  if (!localStorage.getItem('trumitrip_token')) return null;
  try {
    return JSON.parse(localStorage.getItem('trumitrip_user'));
  } catch {
    return null;
  }
}

function isApprovedVendor(user) {
  return user?.role === 'VENDOR' && user?.vendor_status === 'APPROVED';
}

/** Map URL + session to SPA view and canonical path (role-aware). */
function resolveViewFromLocation(pathnameRaw, search, hash, user) {
  const pathname = String(pathnameRaw || '/').toLowerCase();
  const params = new URLSearchParams(search || '');
  const viewParam = params.get('view');
  const hashView = String(hash || '').replace('#', '').toLowerCase();

  if (pathname.includes('/vendor-login') || viewParam === 'vendor-login' || hashView === 'vendor-login') {
    return { view: 'vendor-login', canonicalPath: '/vendor-login' };
  }
  if (pathname.includes('/admin-login') || viewParam === 'admin-login' || hashView === 'admin-login') {
    return { view: 'admin-login', canonicalPath: '/admin-login' };
  }
  if (pathname.includes('/become-partner') || viewParam === 'become-partner' || hashView === 'become-partner') {
    return { view: 'become-partner', canonicalPath: '/become-partner' };
  }

  const policyPage = getPolicyPage(pathname);
  if (policyPage) return { view: 'policy', canonicalPath: null, policyPage };

  const destinationPage = getDestinationPage(pathname);
  if (destinationPage) return { view: 'destination', canonicalPath: null, destinationPage };

  const wantsPartner =
    pathname.includes('/partner') ||
    (pathname.includes('/vendor') && !pathname.includes('/vendor-login')) ||
    viewParam === 'partner' ||
    viewParam === 'vendor' ||
    hashView === 'partner' ||
    hashView === 'vendor';

  if (wantsPartner) {
    if (isApprovedVendor(user)) return { view: 'partner', canonicalPath: '/partner' };
    if (user?.role === 'ADMIN') return { view: 'admin', canonicalPath: '/admin' };
    return { view: 'vendor-login', canonicalPath: '/vendor-login' };
  }

  const wantsAdmin =
    (pathname === '/admin' || pathname.startsWith('/admin/')) ||
    viewParam === 'admin' ||
    hashView === 'admin';

  if (wantsAdmin) {
    if (user?.role === 'ADMIN') return { view: 'admin', canonicalPath: '/admin' };
    return { view: 'admin-login', canonicalPath: '/admin-login' };
  }

  if (getLansdowneSeoPage(pathname)) return { view: 'seo-landing', canonicalPath: null };

  return { view: 'customer', canonicalPath: '/' };
}

function normalizePathForCompare(path) {
  const p = String(path || '/').toLowerCase();
  if (p.length > 1 && p.endsWith('/')) return p.slice(0, -1);
  return p || '/';
}

export default function App() {
  // Current view: 'customer', 'admin', 'partner', 'become-partner', 'vendor-login', 'admin-login'
  const [currentView, setCurrentView] = useState(() => {
    const savedUser = getStoredUser();
    return resolveViewFromLocation(
      window.location.pathname,
      window.location.search,
      window.location.hash,
      savedUser
    ).view;
  });
  const seoLandingPage = getLansdowneSeoPage(window.location.pathname);
  const [activePolicyPage, setActivePolicyPage] = useState(() => getPolicyPage(window.location.pathname));
  const [activeDestinationPage, setActiveDestinationPage] = useState(() => getDestinationPage(window.location.pathname));

  const handleNavigatePath = useCallback((path) => {
    const normalized = String(path || '/').trim();
    if (normalized === '/' || normalized === '') {
      setActivePolicyPage(null);
      setActiveDestinationPage(null);
      setCurrentView('customer');
      window.history.pushState({ view: 'customer' }, '', '/');
      window.scrollTo({ top: 0, behavior: 'auto' });
      return;
    }

    const policy = getPolicyPage(normalized);
    if (policy) {
      setActivePolicyPage(policy);
      setActiveDestinationPage(null);
      setCurrentView('policy');
      window.history.pushState({ view: 'policy', slug: policy.slug }, '', `/${policy.slug}/`);
      window.scrollTo({ top: 0, behavior: 'auto' });
      return;
    }

    const destination = getDestinationPage(normalized);
    if (destination) {
      setActiveDestinationPage(destination);
      setActivePolicyPage(null);
      setCurrentView('destination');
      window.history.pushState({ view: 'destination', slug: destination.slug }, '', `/${destination.slug}/`);
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, []);

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
    setActivePolicyPage(null);
    setActiveDestinationPage(null);
    setCurrentView(viewName);
    const cleanPath = viewName === 'customer' ? '/' : `/${viewName}`;
    window.history.pushState({ view: viewName }, '', cleanPath);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  // Auth User State
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('trumitrip_user');
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch {
      localStorage.removeItem('trumitrip_user');
      return null;
    }
  });

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authPurpose, setAuthPurpose] = useState('general');
  const [pendingBooking, setPendingBooking] = useState(null);
  const pendingBookingRef = useRef(null);

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
  const [showMobileFilter, setShowMobileFilter] = useState(
    () => window.matchMedia('(max-width: 767px)').matches
  );
  const [activeCoupons, setActiveCoupons] = useState([]);

  const openAuthForBooking = useCallback((hotel, room, purpose = 'booking') => {
    pendingBookingRef.current = { hotel, room };
    setPendingBooking({ hotel, room });
    setSelectedHotelForDetails(null);
    setCheckoutHotel(null);
    setCheckoutRoom(null);
    setAuthPurpose(purpose);
    setShowAuthModal(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setShowAuthModal(false);
    setAuthPurpose('general');
  }, []);

  const handleReauthPrompt = useCallback(() => {
    setAuthPurpose('general');
    setShowAuthModal(true);
  }, []);

  const isCustomerSession = (user) => user?.role === 'CUSTOMER';

  // Handle User Login & Automatic Dashboard Routing
  const handleLoginSuccess = (userObj, sessionToken) => {
    if (sessionToken) localStorage.setItem('trumitrip_token', sessionToken);
    setCurrentUser(userObj);
    localStorage.setItem('trumitrip_user', JSON.stringify(userObj));
    setShowAuthModal(false);
    setAuthPurpose('general');

    const pending = pendingBookingRef.current;
    if (pending && isCustomerSession(userObj)) {
      pendingBookingRef.current = null;
      setPendingBooking(null);
      setCheckoutHotel(pending.hotel);
      setCheckoutRoom(pending.room);
      handleNavigateView('customer', userObj);
      return;
    }
    if (pending && !isCustomerSession(userObj)) {
      pendingBookingRef.current = null;
      setPendingBooking(null);
    }

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

  const handleLogout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem('trumitrip_user');
    localStorage.removeItem('trumitrip_token');
    setCurrentView('customer');
  }, [setCurrentUser, setCurrentView]);

  const handleSessionExpired = useCallback(() => {
    handleLogout();
    setUserBookings([]);
    setShowBookingsModal(false);
    setAuthPurpose('general');
    setShowAuthModal(true);
  }, [handleLogout]);

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
    apiService.getActiveCoupons().then((coupons) => {
      if (Array.isArray(coupons)) setActiveCoupons(coupons);
    });
  }, []);

  useEffect(() => {
    if (currentView !== 'destination' || !activeDestinationPage) return;
    loadHotelsData({ city: activeDestinationPage.city, search: activeDestinationPage.city });
  }, [currentView, activeDestinationPage?.slug, activeDestinationPage?.city]);

  const applyRouteFromBrowser = useCallback((userOverride) => {
    const user = userOverride ?? currentUser ?? getStoredUser();
    const resolved = resolveViewFromLocation(
      window.location.pathname,
      window.location.search,
      window.location.hash,
      user
    );

    if (resolved.policyPage) {
      setActivePolicyPage(resolved.policyPage);
      setActiveDestinationPage(null);
    } else if (resolved.destinationPage) {
      setActiveDestinationPage(resolved.destinationPage);
      setActivePolicyPage(null);
    } else if (resolved.view === 'customer' || resolved.view === 'seo-landing') {
      setActivePolicyPage(null);
      setActiveDestinationPage(null);
    }

    setCurrentView(resolved.view);

    if (resolved.canonicalPath) {
      const current = normalizePathForCompare(window.location.pathname);
      const target = normalizePathForCompare(resolved.canonicalPath);
      if (current !== target) {
        window.history.replaceState({ view: resolved.view }, '', resolved.canonicalPath);
      }
    }
  }, [currentUser]);

  useEffect(() => {
    applyRouteFromBrowser();
  }, [applyRouteFromBrowser]);

  useEffect(() => {
    const syncRouteFromBrowser = () => applyRouteFromBrowser();
    window.addEventListener('popstate', syncRouteFromBrowser);
    return () => window.removeEventListener('popstate', syncRouteFromBrowser);
  }, [applyRouteFromBrowser]);

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

  const handleFooterCitySearch = (city) => {
    handleNavigateView('customer');
    const nextSearch = {
      ...searchDetails,
      city,
    };
    setSearchDetails(nextSearch);
    loadHotelsData({ city, search: city });
    window.setTimeout(() => {
      document.getElementById('hotel-results-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 150);
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
    if (!isCustomerSession(currentUser)) {
      openAuthForBooking(hotel, room, 'booking');
      return;
    }
    setSelectedHotelForDetails(null);
    setCheckoutHotel(hotel);
    setCheckoutRoom(room);
  };

  const handleProceedToPayment = (payload, hotel, room) => {
    if (!isCustomerSession(currentUser)) {
      openAuthForBooking(hotel, room, 'checkout');
      return;
    }
    setCheckoutHotel(null);
    setCheckoutRoom(null);
    setBookingPayloadForPayment(payload);
    setPaymentHotel(hotel);
    setPaymentRoom(room);
  };

  const handleCheckoutRequireLogin = () => {
    if (checkoutHotel && checkoutRoom) {
      openAuthForBooking(checkoutHotel, checkoutRoom, 'checkout');
    }
  };

  const handleBookingSuccess = useCallback((newBooking) => {
    setUserBookings((bookings) => [newBooking, ...bookings]);
  }, []);

  const handleCancelBooking = (cancellation) => {
    setUserBookings((bookings) => bookings.map((booking) => (
      booking.booking_id === cancellation.booking_id
        ? { ...booking, ...cancellation }
        : booking
    )));
  };

  // Don't show Header/Footer on dedicated auth portals
  const isAuthPortal = ['vendor-login', 'admin-login'].includes(currentView);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans flex flex-col justify-between">

      {/* Header — hidden on login portals */}
      {!isAuthPortal && (
      <Header 
        currentUser={currentUser}
        onOpenAuth={() => { setAuthPurpose('general'); setShowAuthModal(true); }}
        onLogout={handleLogout}
        onNavigateView={handleNavigateView}
        bookingsCount={userBookings.filter(b => !String(b.status || '').includes('CANCELLED')).length}
        onOpenBookings={() => {
          if (currentUser) setShowBookingsModal(true);
          else { setAuthPurpose('general'); setShowAuthModal(true); }
        }}
        onOpenOffers={() => {
          const el = document.getElementById('offers-section');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
        onOpenSupport={() => alert(`TRUMITRIP 24/7 Support Desk:\nPhone: +91 8447151225\nEmail: support@trumitrip.com\nAddress: Deevika Tower, Chandan Nagar, Ghaziabad`)}
      />
      )}

      {/* VIEW 1: CUSTOMER PORTAL */}
      {currentView === 'customer' && (
        <main className="flex-grow">
          {/* Hero Banner with Search Bar */}
          <HeroSearch
            onSearch={handleSearch}
            hotels={hotels}
            initialDestination={searchDetails.city}
          />

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
          {activeCoupons.length > 0 && (
            <div id="offers-section">
              <SpecialOffers
                coupons={activeCoupons}
                onApplyOffer={(code) => alert(`Offer Code "${code}" copied! Enter at checkout.`)}
              />
            </div>
          )}

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
                aria-expanded={showMobileFilter}
                aria-controls="mobile-hotel-filters"
                className="flex items-center gap-2 bg-white border border-slate-200 shadow-sm text-slate-700 font-bold text-sm px-4 py-3 rounded-xl w-full justify-between min-h-[44px]"
              >
                <span className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-[#D4AF37]" />
                  Hotel Filters &amp; Sort
                  {(filters.starRating !== 'all' || filters.amenities.length > 0) && (
                    <span className="bg-[#D4AF37] text-slate-950 text-[10px] font-black px-1.5 py-0.5 rounded-full">
                      {(filters.starRating !== 'all' ? 1 : 0) + filters.amenities.length}
                    </span>
                  )}
                </span>
                <span className="flex items-center gap-2 text-xs text-slate-500">
                  {showMobileFilter ? 'Hide filters' : 'Show filters'}
                  {showMobileFilter ? <X className="w-4 h-4" /> : <SlidersHorizontal className="w-4 h-4" />}
                </span>
              </button>
            </div>

            {/* Mobile filter panel */}
            {showMobileFilter && (
              <div id="mobile-hotel-filters" className="md:hidden mb-4">
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
              <div className="lg:col-span-8">
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
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {filteredHotels.map((hotel) => (
                      <HotelCard
                        key={hotel.id}
                        hotel={hotel}
                        layout="grid"
                        onSelectHotel={(h) => setSelectedHotelForDetails(h)}
                      />
                    ))}
                  </div>
                )}
              </div>

            </div>
          </section>
        </main>
      )}

      {currentView === 'policy' && activePolicyPage && (
        <PolicyPage page={activePolicyPage} onNavigatePath={handleNavigatePath} />
      )}

      {currentView === 'destination' && activeDestinationPage && (
        <DestinationHotelsPage
          page={activeDestinationPage}
          hotels={hotels}
          loading={loadingHotels}
          onSelectHotel={setSelectedHotelForDetails}
          onNavigatePath={handleNavigatePath}
          onSearchCity={handleFooterCitySearch}
        />
      )}

      {currentView === 'seo-landing' && seoLandingPage && (
        <LansdowneSeoPage
          page={seoLandingPage}
          hotels={hotels}
          loading={loadingHotels}
          onSelectHotel={setSelectedHotelForDetails}
          onSearch={() => {
            handleNavigateView('customer');
            setSearchDetails((current) => ({ ...current, city: 'Lansdowne' }));
            loadHotelsData({ city: 'Lansdowne', search: 'Lansdowne' });
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
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
          onRequireLogin={handleCheckoutRequireLogin}
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
          onRequireLogin={handleReauthPrompt}
        />
      )}

      {/* AUTH MODAL — rendered last so it always sits above hotel/checkout/payment layers */}
      {showAuthModal && (
        <AuthModal
          purpose={authPurpose}
          pendingHotelName={pendingBooking?.hotel?.name}
          pendingRoomType={pendingBooking?.room?.room_type}
          onClose={closeAuthModal}
          onLoginSuccess={handleLoginSuccess}
          onOpenTerms={() => {
            closeAuthModal();
            handleNavigatePath('/terms-and-conditions/');
          }}
        />
      )}

      {/* Footer — hidden on login portals */}
      {!isAuthPortal && (
        <Footer
          onNavigateView={handleNavigateView}
          onNavigatePath={handleNavigatePath}
        />
      )}

    </div>
  );
}
