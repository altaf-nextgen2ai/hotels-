import React from 'react';
import { MapPin, ArrowRight, ChevronRight } from 'lucide-react';

export default function PopularDestinations({ onSelectDestination }) {
  const destinations = [
    {
      name: 'Goa',
      hotels: '1,234 Hotels',
      image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=600&q=80'
    },
    {
      name: 'Dubai',
      hotels: '856 Hotels',
      image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=600&q=80'
    },
    {
      name: 'Manali',
      hotels: '732 Hotels',
      image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=600&q=80'
    },
    {
      name: 'Paris',
      hotels: '1,120 Hotels',
      image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=600&q=80'
    },
    {
      name: 'Singapore',
      hotels: '947 Hotels',
      image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=600&q=80'
    }
  ];

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Popular Destinations</h2>
            <p className="text-sm text-slate-500 font-medium">Explore top rated locations recommended by TRUMITRIP</p>
          </div>
          <button 
            onClick={() => onSelectDestination('')}
            className="flex items-center gap-1.5 border border-[#D4AF37] text-slate-900 hover:bg-[#D4AF37] hover:text-slate-950 font-bold text-xs px-4 py-2 rounded-full transition"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Destination Cards Grid */}
        <div className="relative">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {destinations.map((d, index) => (
              <div 
                key={index}
                onClick={() => onSelectDestination(d.name)}
                className="group relative h-64 rounded-2xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                {/* Background Photo */}
                <img 
                  src={d.image} 
                  alt={d.name} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                
                {/* Dark Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />

                {/* Card Content */}
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <div className="flex items-center gap-1.5 text-xs font-bold mb-0.5 text-[#D4AF37]">
                    <MapPin className="w-3.5 h-3.5 fill-[#D4AF37] text-slate-950" />
                    <span className="text-white font-extrabold text-base tracking-wide">{d.name}</span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-medium pl-5">{d.hotels}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Right Navigation Arrow Button */}
          <button 
            onClick={() => onSelectDestination('Goa')}
            className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#0F172A] text-white shadow-xl items-center justify-center hover:bg-slate-800 transition"
          >
            <ChevronRight className="w-5 h-5 text-[#D4AF37]" />
          </button>
        </div>
      </div>
    </section>
  );
}
