import React from 'react';
import { Filter, Star, SlidersHorizontal, RotateCcw } from 'lucide-react';

export default function HotelFilterSidebar({ filters, setFilters, onReset }) {
  const amenitiesList = ["WiFi", "Pool", "Spa", "Breakfast", "AC", "Ocean View", "Gym", "Parking"];

  const handleStarToggle = (star) => {
    if (filters.starRating === star) {
      setFilters({ ...filters, starRating: 'all' });
    } else {
      setFilters({ ...filters, starRating: star });
    }
  };

  const handleAmenityToggle = (amenity) => {
    const current = filters.amenities || [];
    if (current.includes(amenity)) {
      setFilters({ ...filters, amenities: current.filter(a => a !== amenity) });
    } else {
      setFilters({ ...filters, amenities: [...current, amenity] });
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-[#D4AF37]" />
          <h3 className="font-extrabold text-slate-900 text-base">Filter Hotels</h3>
        </div>
        <button 
          onClick={onReset}
          className="text-xs font-bold text-slate-500 hover:text-amber-600 flex items-center gap-1 transition"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* Sort By Dropdown */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
          Sort Results By
        </label>
        <select 
          value={filters.sortBy}
          onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
          className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold py-2.5 px-3 rounded-xl focus:outline-none focus:border-[#D4AF37]"
        >
          <option value="popular">Popularity (Most Reviewed)</option>
          <option value="price_low_high">Price: Low to High</option>
          <option value="price_high_low">Price: High to Low</option>
          <option value="rating">Guest Rating (High to Low)</option>
        </select>
      </div>

      {/* Price Range Slider */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Max Price Per Night
          </label>
          <span className="text-xs font-black text-[#D4AF37] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            ₹{filters.maxPrice ? Number(filters.maxPrice).toLocaleString('en-IN') : '50,000+'}
          </span>
        </div>
        <input 
          type="range"
          min="3000"
          max="80000"
          step="1000"
          value={filters.maxPrice || 80000}
          onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
          className="w-full accent-[#D4AF37] cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-1">
          <span>₹3,000</span>
          <span>₹80,000+</span>
        </div>
      </div>

      {/* Star Rating Filter */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
          Hotel Star Rating
        </label>
        <div className="flex gap-2">
          {[5, 4, 3].map((star) => {
            const active = filters.starRating == star;
            return (
              <button
                key={star}
                type="button"
                onClick={() => handleStarToggle(star)}
                className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl border text-xs font-bold transition ${
                  active 
                    ? 'bg-[#0F172A] border-[#0F172A] text-[#D4AF37] shadow-sm' 
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>{star}</span>
                <Star className={`w-3.5 h-3.5 ${active ? 'fill-[#D4AF37] text-[#D4AF37]' : 'text-amber-500 fill-amber-500'}`} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Amenities Checkboxes */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
          Popular Amenities
        </label>
        <div className="space-y-2">
          {amenitiesList.map((amenity, idx) => {
            const isChecked = (filters.amenities || []).includes(amenity);
            return (
              <label 
                key={idx} 
                className="flex items-center gap-2.5 text-xs text-slate-700 font-semibold cursor-pointer hover:text-slate-900"
              >
                <input 
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleAmenityToggle(amenity)}
                  className="w-4 h-4 rounded accent-[#D4AF37] border-slate-300"
                />
                <span>{amenity}</span>
              </label>
            );
          })}
        </div>
      </div>

    </div>
  );
}
