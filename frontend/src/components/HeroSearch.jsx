import React, { useState } from 'react';
import { MapPin, Calendar, Users, Search, Building2, ChevronDown, Check } from 'lucide-react';

export default function HeroSearch({ onSearch, hotels = [] }) {
  const [destination, setDestination] = useState('');
  const [checkIn, setCheckIn] = useState('2026-08-20');
  const [checkOut, setCheckOut] = useState('2026-08-21');
  const [rooms, setRooms] = useState(1);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);

  const [showDestDropdown, setShowDestDropdown] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(false);

  // Derive unique cities & hotels from real database + popular travel destinations
  const allDestinationsList = React.useMemo(() => {
    const dbCities = new Set();
    const suggestions = [];

    // Add real database hotels first
    if (hotels && Array.isArray(hotels)) {
      hotels.forEach(h => {
        if (h.city && !dbCities.has(h.city.toLowerCase())) {
          dbCities.add(h.city.toLowerCase());
          const count = hotels.filter(item => item.city?.toLowerCase() === h.city?.toLowerCase()).length;
          suggestions.push({
            name: h.city,
            subtitle: `${h.destination || h.city} • Live Registered City`,
            count: `${count} Hotel${count > 1 ? 's' : ''}`,
            type: 'city',
            isLiveRegistered: true
          });
        }
        if (h.name) {
          suggestions.push({
            name: h.name,
            subtitle: `${h.city}, ${h.destination} • Property`,
            count: `★ ${h.star_rating || 5} Star`,
            type: 'hotel',
            isLiveRegistered: true
          });
        }
      });
    }

    // Default major destinations pool
    const defaultCities = [
      { name: 'Goa', subtitle: 'India • Beach & Party Capital', count: '1,234 Hotels' },
      { name: 'Mumbai', subtitle: 'India • Commercial Hub & Seafront', count: '1,450 Hotels' },
      { name: 'Delhi', subtitle: 'India • Capital & Heritage Monuments', count: '1,820 Hotels' },
      { name: 'Manali', subtitle: 'India • Snow & Mountain Retreat', count: '732 Hotels' },
      { name: 'Jaipur', subtitle: 'India • Pink City & Forts', count: '620 Hotels' },
      { name: 'Dubai', subtitle: 'UAE • Shopping & Luxury Skyscraper', count: '856 Hotels' },
      { name: 'Paris', subtitle: 'France • Romance & Eiffel Views', count: '1,120 Hotels' },
      { name: 'Singapore', subtitle: 'Singapore • Marina Bay & Skypark', count: '947 Hotels' },
      { name: 'Bengaluru', subtitle: 'India • Silicon Valley & Parks', count: '980 Hotels' },
      { name: 'Udaipur', subtitle: 'India • Lake City & Palaces', count: '540 Hotels' },
      { name: 'Shimla', subtitle: 'India • Hill Station & Valleys', count: '480 Hotels' },
      { name: 'Agra', subtitle: 'India • Taj Mahal & Mughal Heritage', count: '390 Hotels' },
      { name: 'London', subtitle: 'UK • Big Ben & Royal Palaces', count: '1,350 Hotels' },
      { name: 'Maldives', subtitle: 'Maldives • Overwater Luxury Villas', count: '640 Hotels' },
      { name: 'Bali', subtitle: 'Indonesia • Tropical Resorts & Spas', count: '820 Hotels' },
    ];

    defaultCities.forEach(c => {
      if (!dbCities.has(c.name.toLowerCase())) {
        suggestions.push({ ...c, type: 'city' });
      }
    });

    return suggestions;
  }, [hotels]);

  // Filter suggestions dynamically based on user input
  const filteredSuggestions = React.useMemo(() => {
    if (!destination || destination.trim() === '') {
      return allDestinationsList.slice(0, 8);
    }
    const q = destination.toLowerCase().trim();
    return allDestinationsList.filter(item => 
      item.name.toLowerCase().includes(q) || 
      item.subtitle.toLowerCase().includes(q)
    ).slice(0, 10);
  }, [destination, allDestinationsList]);

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    onSearch({
      city: destination,
      checkIn,
      checkOut,
      rooms,
      guests: adults + children
    });
  };

  return (
    <div className="relative bg-[#0A192F] text-white pt-10 pb-28 px-4 md:px-8 overflow-hidden min-h-[500px] flex flex-col justify-center">
      {/* Background Image with Dark Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-luminosity scale-105 transition-transform duration-1000"
        style={{ backgroundImage: `url('https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=2000&q=80')` }}
      />

      {/* Gold Flight Arc Vector Background Graphic */}
      <svg className="absolute right-10 top-12 w-96 h-48 opacity-40 pointer-events-none hidden md:block" viewBox="0 0 400 200" fill="none">
        <path d="M 20 180 Q 200 10 380 40" stroke="#D4AF37" strokeWidth="2.5" strokeDasharray="6 6" />
        <g transform="translate(370, 35) rotate(-10)">
          <path d="M0,0 L-14,6 L-8,0 L-14,-6 Z" fill="#D4AF37" />
        </g>
      </svg>

      <div className="max-w-6xl mx-auto w-full relative z-10">
        {/* Main Headline */}
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

        {/* Floating Search Container */}
        <div className="relative mt-6">
          {/* Top Badge Tab matching reference image */}
          <div className="inline-flex items-center gap-2 bg-[#0F172A] text-[#D4AF37] border border-[#D4AF37]/30 font-bold text-sm px-6 py-2 rounded-t-xl translate-y-1 shadow-lg">
            <Building2 className="w-4 h-4" />
            <span>Hotels</span>
          </div>

          {/* Search Form Card */}
          <div className="bg-white text-slate-900 rounded-2xl rounded-tl-none p-4 md:p-6 shadow-2xl border border-slate-100">
            <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              
              {/* Destination Input */}
              <div className="md:col-span-4 relative">
                <label className="block text-[11px] font-bold tracking-wider uppercase text-slate-400 mb-1">
                  DESTINATION
                </label>
                <div 
                  onClick={() => setShowDestDropdown(!showDestDropdown)}
                  className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 cursor-pointer transition"
                >
                  <MapPin className="w-5 h-5 text-[#D4AF37] shrink-0" />
                  <div className="flex-1 truncate">
                    <input 
                      type="text" 
                      placeholder="Enter City or Hotel"
                      value={destination}
                      onChange={(e) => { setDestination(e.target.value); setShowDestDropdown(true); }}
                      className="w-full bg-transparent font-bold text-slate-800 focus:outline-none placeholder:text-slate-400 text-sm"
                    />
                    <p className="text-[11px] text-slate-400 font-medium truncate">Where are you going?</p>
                  </div>
                </div>

                {/* Dynamic Destination Autocomplete Dropdown */}
                {showDestDropdown && (
                  <div className="absolute left-0 top-full mt-2 w-full bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 z-50 animate-in fade-in max-h-80 overflow-y-auto">
                    <div className="px-3 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-wider flex justify-between items-center">
                      <span>{destination ? `Matching Suggestions (${filteredSuggestions.length})` : 'Popular Destinations'}</span>
                      {destination && <span className="text-amber-600 lowercase font-bold">Press enter to search</span>}
                    </div>

                    {filteredSuggestions.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-500 font-medium">
                        No exact match found. Type any city name to search!
                      </div>
                    ) : (
                      filteredSuggestions.map((c, i) => (
                        <div 
                          key={i}
                          onClick={() => { setDestination(c.name); setShowDestDropdown(false); }}
                          className={`flex justify-between items-center px-3 py-2.5 rounded-xl cursor-pointer transition group ${
                            c.isLiveRegistered ? 'bg-amber-50/60 hover:bg-amber-100/80 border border-amber-200/60 my-0.5' : 'hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition ${
                              c.isLiveRegistered ? 'bg-[#D4AF37] text-slate-950 font-black' : 'bg-amber-100 text-amber-800 group-hover:bg-amber-500 group-hover:text-white'
                            }`}>
                              <MapPin className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-xs font-extrabold text-slate-900 leading-tight">{c.name}</p>
                                {c.isLiveRegistered && (
                                  <span className="bg-emerald-600 text-white font-black text-[9px] px-1.5 py-0.2 rounded uppercase tracking-wider">
                                    LIVE PARTNER
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-500 font-medium mt-0.5">{c.subtitle}</p>
                            </div>
                          </div>
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ${
                            c.isLiveRegistered ? 'bg-emerald-100 text-emerald-800 font-black' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {c.count}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Check-In */}
              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold tracking-wider uppercase text-slate-400 mb-1">
                  CHECK-IN
                </label>
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <Calendar className="w-5 h-5 text-blue-600 shrink-0" />
                  <input 
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="w-full bg-transparent font-bold text-slate-800 focus:outline-none text-xs"
                  />
                </div>
              </div>

              {/* Check-Out */}
              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold tracking-wider uppercase text-slate-400 mb-1">
                  CHECK-OUT
                </label>
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <Calendar className="w-5 h-5 text-blue-600 shrink-0" />
                  <input 
                    type="date"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="w-full bg-transparent font-bold text-slate-800 focus:outline-none text-xs"
                  />
                </div>
              </div>

              {/* Rooms & Guests Selector */}
              <div className="md:col-span-2 relative">
                <label className="block text-[11px] font-bold tracking-wider uppercase text-slate-400 mb-1">
                  ROOMS & GUESTS
                </label>
                <div 
                  onClick={() => setShowGuestModal(!showGuestModal)}
                  className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 cursor-pointer"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Users className="w-5 h-5 text-indigo-600 shrink-0" />
                    <span className="font-bold text-slate-800 text-xs truncate">
                      {rooms} Room, {adults + children} Guests
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </div>

                {/* Rooms Modal */}
                {showGuestModal && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 p-4 z-50">
                    <div className="space-y-4">
                      {/* Rooms */}
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-xs font-bold text-slate-800">Rooms</p>
                          <p className="text-[11px] text-slate-400">Max 5 rooms</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button 
                            type="button"
                            onClick={() => setRooms(Math.max(1, rooms - 1))}
                            className="w-7 h-7 rounded-full bg-slate-100 font-bold text-slate-700 hover:bg-slate-200"
                          >
                            -
                          </button>
                          <span className="font-bold text-sm">{rooms}</span>
                          <button 
                            type="button"
                            onClick={() => setRooms(Math.min(5, rooms + 1))}
                            className="w-7 h-7 rounded-full bg-slate-100 font-bold text-slate-700 hover:bg-slate-200"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Adults */}
                      <div className="flex justify-between items-center pt-2 border-t">
                        <div>
                          <p className="text-xs font-bold text-slate-800">Adults</p>
                          <p className="text-[11px] text-slate-400">Age 12+ yrs</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button 
                            type="button"
                            onClick={() => setAdults(Math.max(1, adults - 1))}
                            className="w-7 h-7 rounded-full bg-slate-100 font-bold text-slate-700 hover:bg-slate-200"
                          >
                            -
                          </button>
                          <span className="font-bold text-sm">{adults}</span>
                          <button 
                            type="button"
                            onClick={() => setAdults(Math.min(10, adults + 1))}
                            className="w-7 h-7 rounded-full bg-slate-100 font-bold text-slate-700 hover:bg-slate-200"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Children */}
                      <div className="flex justify-between items-center pt-2 border-t">
                        <div>
                          <p className="text-xs font-bold text-slate-800">Children</p>
                          <p className="text-[11px] text-slate-400">Age 0-11 yrs</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button 
                            type="button"
                            onClick={() => setChildren(Math.max(0, children - 1))}
                            className="w-7 h-7 rounded-full bg-slate-100 font-bold text-slate-700 hover:bg-slate-200"
                          >
                            -
                          </button>
                          <span className="font-bold text-sm">{children}</span>
                          <button 
                            type="button"
                            onClick={() => setChildren(Math.min(6, children + 1))}
                            className="w-7 h-7 rounded-full bg-slate-100 font-bold text-slate-700 hover:bg-slate-200"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <button 
                        type="button"
                        onClick={() => setShowGuestModal(false)}
                        className="w-full bg-[#0F172A] text-white text-xs font-bold py-2 rounded-lg hover:bg-slate-800"
                      >
                        Apply Selection
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Search Button */}
              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold tracking-wider uppercase text-transparent mb-1 hidden md:block">
                  ACTION
                </label>
                <button 
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#D4AF37] via-[#E5C158] to-[#B8860B] text-slate-950 font-extrabold text-sm py-3 px-4 rounded-xl hover:brightness-110 transition shadow-lg flex items-center justify-center gap-2 group"
                >
                  <Search className="w-4 h-4 transition-transform group-hover:scale-110" />
                  <span>Search Hotels</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
