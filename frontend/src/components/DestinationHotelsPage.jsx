import React, { useEffect, useMemo } from 'react';
import { ArrowRight, MapPin } from 'lucide-react';
import HotelCard from './HotelCard';
import { OTHER_DESTINATION_LINKS } from '../data/destinationPages';

function hotelMatchesCity(hotel, city) {
  const query = city.toLowerCase();
  return [hotel.city, hotel.destination, hotel.name, hotel.address, hotel.description]
    .some((value) => String(value || '').toLowerCase().includes(query));
}

export default function DestinationHotelsPage({
  page,
  hotels,
  loading,
  onSelectHotel,
  onNavigatePath,
  onSearchCity,
}) {
  const pageHotels = useMemo(
    () => hotels.filter((hotel) => hotelMatchesCity(hotel, page.city)),
    [hotels, page.city],
  );

  useEffect(() => {
    document.title = `${page.title} | Book on TRUMITRIP`;
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [page.slug, page.title]);

  const handleSearch = () => {
    if (onSearchCity) onSearchCity(page.city);
  };

  return (
    <main className="flex-grow w-full bg-slate-50">
      <section className="relative overflow-hidden bg-[#0A192F] w-full px-4 py-10 text-white sm:px-6 md:px-10 lg:px-14 md:py-14">
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[46%] lg:block">
          <img src={page.heroImage} alt={page.title} className="h-full w-full object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A192F] via-[#0A192F]/40 to-transparent" />
        </div>
        <div className="pointer-events-none absolute inset-0 lg:hidden">
          <img src={page.heroImage} alt="" className="h-full w-full object-cover object-center opacity-25" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A192F] via-[#0A192F]/90 to-[#0A192F]/70" />
        </div>
        <div className="relative w-full">
          <nav aria-label="Breadcrumb" className="mb-5 text-sm text-slate-300">
            <button type="button" onClick={() => onNavigatePath && onNavigatePath('/')} className="hover:text-amber-300">
              Home
            </button>
            <span className="mx-2">/</span>
            <span>{page.title}</span>
          </nav>
          <div className="max-w-3xl lg:w-[58%]">
            <p className="mb-3 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-amber-300">
              <MapPin className="h-4 w-4" /> {page.city}, {page.region}
            </p>
            <h1 className="text-3xl font-black leading-tight md:text-5xl">{page.title}</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-200 md:text-lg">{page.intro}</p>
            <button
              type="button"
              onClick={handleSearch}
              className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-sm font-extrabold text-slate-950 transition hover:bg-amber-300"
            >
              Search {page.city} stays <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      <section id="available-stays" className="w-full px-4 py-10 sm:px-6 md:px-10 lg:px-14 md:py-14">
        <div className="mb-6 max-w-3xl">
          <h2 className="text-2xl font-black text-slate-900">Available stays in {page.city}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{page.highlight}</p>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center text-sm font-semibold text-slate-600">
            Loading available stays...
          </div>
        ) : pageHotels.length ? (
          <div className="grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {pageHotels.map((hotel) => (
              <HotelCard key={hotel.id} hotel={hotel} layout="grid" onSelectHotel={onSelectHotel} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-12 text-center">
            <p className="text-lg font-extrabold text-slate-900">No matching {page.city} stays are listed right now</p>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
              Try searching from the home page or check back later as new properties are added on TrumiTrip.
            </p>
            <button
              type="button"
              onClick={handleSearch}
              className="mt-5 rounded-xl bg-[#0F172A] px-5 py-3 text-sm font-bold text-[#D4AF37] hover:brightness-110"
            >
              Search all hotels
            </button>
          </div>
        )}

        <nav aria-label="More destinations" className="mt-10">
          <h2 className="mb-3 text-lg font-extrabold text-slate-900">Explore more destinations</h2>
          <div className="flex flex-wrap gap-2">
            {OTHER_DESTINATION_LINKS(page.slug).map((related) => (
              <button
                key={related.slug}
                type="button"
                onClick={() => onNavigatePath && onNavigatePath(`/${related.slug}/`)}
                className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-amber-400 hover:text-slate-950"
              >
                {related.title}
              </button>
            ))}
          </div>
        </nav>
      </section>
    </main>
  );
}
