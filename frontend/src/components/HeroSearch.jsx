import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Calendar, Users, Search, Building2, ChevronDown, Loader2, X } from 'lucide-react';

// ── Smart date helpers ─────────────────────────────────────────────────────────
const toDateStr = (d) => d.toISOString().split('T')[0];
const todayStr    = () => toDateStr(new Date());
const tomorrowStr = () => { const d = new Date(); d.setDate(d.getDate() + 1); return toDateStr(d); };

export default function HeroSearch({ onSearch, hotels = [] }) {
  const [destination,    setDestination]    = useState('');
  const [checkIn,        setCheckIn]        = useState(todayStr());
  const [checkOut,       setCheckOut]       = useState(tomorrowStr());
  const [rooms,          setRooms]          = useState(1);
  const [adults,         setAdults]         = useState(2);
  const [children,       setChildren]       = useState(0);
  const [showGuestModal, setShowGuestModal] = useState(false);

  // Autocomplete state
  const [suggestions,    setSuggestions]    = useState([]);
  const [showDropdown,   setShowDropdown]   = useState(false);
  const [loadingPlaces,  setLoadingPlaces]  = useState(false);
  const [selectedPlace,  setSelectedPlace]  = useState(null);

  const dropdownRef = useRef(null);
  const debounceRef = useRef(null);

  // ── Our own hotels from DB as quick suggestions ────────────────────────────
  const dbSuggestions = React.useMemo(() => {
    const seen = new Set();
    const items = [];
    (hotels || []).forEach(h => {
      if (h.city && !seen.has(h.city.toLowerCase())) {
        seen.add(h.city.toLowerCase());
        items.push({ name: h.city, subtitle: h.destination || h.city, type: 'db', icon: '🏨' });
      }
    });
    return items.slice(0, 4);
  }, [hotels]);

  // ── Nominatim geocoding (free, no API key) ─────────────────────────────────
  const fetchPlaces = useCallback(async (query) => {
    if (!query || query.trim().length < 2) {
      setSuggestions(dbSuggestions);
      return;
    }
    setLoadingPlaces(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=6&accept-language=en`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();

      const places = data.map(p => {
        const addr = p.address || {};
        const city = addr.city || addr.town || addr.village || addr.county || addr.state_district || '';
        const state = addr.state || '';
        const country = addr.country || '';
        const name = p.display_name.split(',')[0].trim();
        return {
          name,
          subtitle: [city, state, country].filter(Boolean).join(', '),
          fullName: p.display_name,
          type: 'place',
          icon: p.type === 'hotel' ? '🏨' : p.type === 'airport' ? '✈️' : '📍',
          searchQuery: city || name,
        };
      }).filter((p, idx, arr) => arr.findIndex(x => x.name === p.name) === idx);

      // Prepend DB hotels that match
      const dbMatches = dbSuggestions.filter(d =>
        d.name.toLowerCase().includes(query.toLowerCase())
      );

      setSuggestions([...dbMatches, ...places]);
    } catch {
      setSuggestions(dbSuggestions);
    }
    setLoadingPlaces(false);
  }, [dbSuggestions]);

  // Debounce input
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (destination.trim().length === 0) {
      setSuggestions(dbSuggestions);
      setShowDropdown(false);
      return;
    }
    setShowDropdown(true);
    debounceRef.current = setTimeout(() => fetchPlaces(destination), 350);
    return () => clearTimeout(debounceRef.current);
  }, [destination, fetchPlaces]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelectPlace = (place) => {
    const query = place.searchQuery || place.name;
    setDestination(query);
    setSelectedPlace(place);
    setShowDropdown(false);
  };

  const handleCheckInChange = (val) => {
    setCheckIn(val);
    if (val >= checkOut) {
      const d = new Date(val); d.setDate(d.getDate() + 1);
      setCheckOut(toDateStr(d));
    }
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setShowDropdown(false);
    onSearch({ city: destination, checkIn, checkOut, rooms, guests: adults + children });
  };

  const nights = (() => {
    try { return Math.max(1, Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000)); }
    catch { return 1; }
  })();

  return (
    <div className="relative bg-[#0A192F] text-white pt-10 pb-28 px-4 md:px-8 overflow-x-hidden min-h-[500px] flex flex-col justify-center">
      {/* Background */}
      <div className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-luminosity scale-105"
        style={{ backgroundImage: `url('https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=2000&q=80')` }} />

      {/* Gold arc */}
      <svg className="absolute right-10 top-12 w-96 h-48 opacity-40 pointer-events-none hidden md:block" viewBox="0 0 400 200" fill="none">
        <path d="M 20 180 Q 200 10 380 40" stroke="#D4AF37" strokeWidth="2.5" strokeDasharray="6 6" />
        <g transform="translate(370, 35) rotate(-10)">
          <path d="M0,0 L-14,6 L-8,0 L-14,-6 Z" fill="#D4AF37" />
        </g>
      </svg>

      <div className="max-w-6xl mx-auto w-full relative z-10">
        {/* Headline */}
        <div className="text-center md:text-left mb-8 max-w-2xl">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
            Find the Perfect Stay <br />
            <span className="text-[#D4AF37] underline decoration-[#D4AF37]/40 decoration-4 underline-offset-8">
              for Your Next Trip
            </span>
          </h1>
          <p className="text-slate-300 text-sm md:text-lg mt-3 font-medium">
            Book domestic and international hotels at best prices guaranteed!
          </p>
        </div>

        {/* Search card */}
        <div className="relative mt-6">
          <div className="inline-flex items-center gap-2 bg-[#0F172A] text-[#D4AF37] border border-[#D4AF37]/30 font-bold text-sm px-6 py-2 rounded-t-xl translate-y-1 shadow-lg">
            <Building2 className="w-4 h-4" />
            <span>Hotels</span>
          </div>

          <div className="bg-white text-slate-900 rounded-2xl rounded-tl-none p-4 md:p-5 shadow-2xl border border-slate-100">
            <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 items-end">

              {/* ── Destination ── */}
              <div className="sm:col-span-2 md:col-span-4 relative" ref={dropdownRef}>
                <label className="block text-[11px] font-bold tracking-wider uppercase text-slate-400 mb-1">Destination</label>
                <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl focus-within:border-[#D4AF37] transition">
                  <MapPin className="w-4 h-4 text-[#D4AF37] shrink-0" />
                  <input
                    type="text"
                    placeholder="City, area or hotel name"
                    value={destination}
                    onChange={e => { setDestination(e.target.value); setSelectedPlace(null); }}
                    onFocus={() => destination.length > 0 && setShowDropdown(true)}
                    className="w-full bg-transparent font-semibold text-slate-800 text-sm focus:outline-none placeholder:text-slate-400"
                  />
                  {destination && (
                    <button type="button" onClick={() => { setDestination(''); setSelectedPlace(null); setSuggestions(dbSuggestions); setShowDropdown(false); }}>
                      <X className="w-3.5 h-3.5 text-slate-400 hover:text-slate-700" />
                    </button>
                  )}
                  {loadingPlaces && <Loader2 className="w-3.5 h-3.5 text-slate-300 animate-spin shrink-0" />}
                </div>

                {/* Dropdown */}
                {showDropdown && (
                  <div className="absolute left-0 top-full mt-1.5 w-full bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in">
                    {suggestions.length === 0 && !loadingPlaces ? (
                      <div className="p-4 text-xs text-slate-400 text-center">No results found. Try a different name.</div>
                    ) : (
                      <ul className="max-h-64 overflow-y-auto">
                        {suggestions.length > 0 && (
                          <li className="px-3 pt-2.5 pb-1 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            {destination.length < 2 ? 'Popular Destinations' : 'Search Results'}
                          </li>
                        )}
                        {suggestions.map((s, i) => (
                          <li key={i}>
                            <button
                              type="button"
                              onClick={() => handleSelectPlace(s)}
                              className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 text-left transition ${s.type === 'db' ? 'bg-amber-50/40' : ''}`}
                            >
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-base shrink-0 ${s.type === 'db' ? 'bg-[#D4AF37]/10' : 'bg-slate-100'}`}>
                                {s.icon || '📍'}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-slate-900 truncate flex items-center gap-1.5">
                                  {s.name}
                                  {s.type === 'db' && (
                                    <span className="text-[8px] bg-emerald-600 text-white font-black px-1.5 py-0.5 rounded uppercase">Live</span>
                                  )}
                                </p>
                                <p className="text-[10px] text-slate-400 truncate">{s.subtitle}</p>
                              </div>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 flex items-center gap-1.5">
                      <img src="https://nominatim.openstreetmap.org/ui/mapicons/nominatim-logo-small.png" alt="" className="h-3 opacity-40" onError={e => e.target.style.display='none'} />
                      <p className="text-[9px] text-slate-400">Location data © OpenStreetMap contributors</p>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Check-In ── */}
              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold tracking-wider uppercase text-slate-400 mb-1">Check-In</label>
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 focus-within:border-[#D4AF37] transition">
                  <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                  <input
                    type="date"
                    value={checkIn}
                    min={todayStr()}
                    onChange={e => handleCheckInChange(e.target.value)}
                    className="w-full bg-transparent font-semibold text-slate-800 text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* ── Check-Out ── */}
              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold tracking-wider uppercase text-slate-400 mb-1">
                  Check-Out <span className="text-[#D4AF37] font-black">· {nights}N</span>
                </label>
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 focus-within:border-[#D4AF37] transition">
                  <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                  <input
                    type="date"
                    value={checkOut}
                    min={(() => { const d = new Date(checkIn); d.setDate(d.getDate()+1); return toDateStr(d); })()}
                    onChange={e => setCheckOut(e.target.value)}
                    className="w-full bg-transparent font-semibold text-slate-800 text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* ── Rooms & Guests ── */}
              <div className="md:col-span-2 relative">
                <label className="block text-[11px] font-bold tracking-wider uppercase text-slate-400 mb-1">Rooms & Guests</label>
                <div
                  onClick={() => setShowGuestModal(!showGuestModal)}
                  className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:border-[#D4AF37] transition"
                >
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span className="font-semibold text-slate-800 text-xs">{rooms}R, {adults + children}G</span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </div>

                {showGuestModal && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50">
                    <div className="space-y-4">
                      {[
                        { label: 'Rooms', sub: 'Max 5', val: rooms, set: setRooms, min: 1, max: 5 },
                        { label: 'Adults', sub: 'Age 12+', val: adults, set: setAdults, min: 1, max: 10 },
                        { label: 'Children', sub: 'Age 0–11', val: children, set: setChildren, min: 0, max: 6 },
                      ].map(({ label, sub, val, set, min, max }) => (
                        <div key={label} className={`flex justify-between items-center ${label !== 'Rooms' ? 'pt-3 border-t border-slate-100' : ''}`}>
                          <div>
                            <p className="text-xs font-bold text-slate-800">{label}</p>
                            <p className="text-[10px] text-slate-400">{sub}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <button type="button" onClick={() => set(Math.max(min, val - 1))} className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 transition">-</button>
                            <span className="font-bold text-sm w-4 text-center">{val}</span>
                            <button type="button" onClick={() => set(Math.min(max, val + 1))} className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 transition">+</button>
                          </div>
                        </div>
                      ))}
                      <button type="button" onClick={() => setShowGuestModal(false)}
                        className="w-full bg-[#0F172A] text-white text-xs font-bold py-2 rounded-lg hover:bg-slate-800 mt-2 transition">
                        Apply
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Search Button ── */}
              <div className="sm:col-span-2 md:col-span-2">
                <label className="hidden md:block text-[11px] font-bold tracking-wider uppercase text-transparent mb-1">Search</label>
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#D4AF37] via-[#E5C158] to-[#B8860B] text-slate-950 font-extrabold text-sm py-3 px-4 rounded-xl hover:brightness-110 transition shadow-lg flex items-center justify-center gap-2 group min-h-[44px]"
                >
                  <Search className="w-4 h-4 transition-transform group-hover:scale-110" />
                  Search Hotels
                </button>
              </div>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
