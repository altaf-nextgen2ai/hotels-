import React, { useEffect, useMemo } from 'react';
import { ArrowRight, MapPin } from 'lucide-react';
import HotelCard from './HotelCard';
import { LANSDOWNE_HERO_IMAGE, LANSDOWNE_SEO_BASE_URL, LANSDOWNE_SEO_PAGES } from '../data/lansdowneSeoPages';

const getSearchableText = (hotel) =>
  [hotel.name, hotel.address, hotel.description, ...(hotel.amenities || [])]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

function matchesPage(hotel, category) {
  const text = getSearchableText(hotel);
  if (category === 'resort') return text.includes('resort');
  if (category === 'three-star') return Number(hotel.star_rating) === 3;
  if (category === 'near-mall-road') return text.includes('mall road');
  if (category === 'near-city-centre') return /city cent(re|er)|town cent(re|er)/.test(text);
  if (category === 'near-market') return text.includes('market');
  if (category === 'views') return /mountain view|valley view|hill view|mountain-facing|valley-facing/.test(text);
  return true;
}

export default function LansdowneSeoPage({ page, hotels, loading, onSelectHotel, onSearch }) {
  const pageHotels = useMemo(() => {
    let results = hotels.filter((hotel) =>
      [hotel.city, hotel.destination, hotel.address]
        .some((value) => String(value || '').toLowerCase().includes('lansdowne'))
    );
    results = results.filter((hotel) => matchesPage(hotel, page.category));

    if (page.category === 'budget') {
      return [...results].sort((a, b) => Number(a.price_per_night) - Number(b.price_per_night));
    }
    if (page.category === 'luxury') {
      return [...results].sort((a, b) => Number(b.rating_score) - Number(a.rating_score));
    }
    return results;
  }, [hotels, page.category]);
  const lansdowneHotels = hotels.filter((hotel) =>
    [hotel.city, hotel.destination, hotel.address]
      .some((value) => String(value || '').toLowerCase().includes('lansdowne'))
  );
  const heroHotel = pageHotels[0] || lansdowneHotels[0];
  const heroImage = heroHotel?.main_image || LANSDOWNE_HERO_IMAGE;
  const heroImageAlt = heroHotel?.name
    ? `${heroHotel.name} in Lansdowne`
    : 'Illustrative hill resort scenery';

  useEffect(() => {
    const previousTitle = document.title;
    const descriptionTag = document.querySelector('meta[name="description"]');
    const previousDescription = descriptionTag?.content;
    const canonicalTag = document.querySelector('link[rel="canonical"]');
    const previousCanonical = canonicalTag?.getAttribute('href');
    const description = page.description;
    const canonical = `${LANSDOWNE_SEO_BASE_URL}/${page.slug}/`;

    document.title = page.title;
    if (descriptionTag) descriptionTag.content = description;
    if (canonicalTag) {
      canonicalTag.href = canonical;
    } else {
      const link = document.createElement('link');
      link.rel = 'canonical';
      link.href = canonical;
      link.dataset.seoLandingCanonical = 'true';
      document.head.appendChild(link);
    }

    return () => {
      document.title = previousTitle;
      if (descriptionTag && previousDescription !== undefined) descriptionTag.content = previousDescription;
      if (canonicalTag && previousCanonical) canonicalTag.href = previousCanonical;
      document.querySelector('link[data-seo-landing-canonical="true"]')?.remove();
    };
  }, [page]);

  return (
    <main className="flex-grow bg-slate-50">
      <section className="relative overflow-hidden bg-[#0A192F] px-4 py-10 text-white md:px-8 md:py-14">
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[48%] md:block">
          <img src={heroImage} alt={heroImageAlt} className="h-full w-full object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A192F] via-[#0A192F]/35 to-transparent" />
          <div className="absolute inset-0 bg-[#0A192F]/10" />
        </div>
        <div className="pointer-events-none absolute inset-0 md:hidden">
          <img src={heroImage} alt="" className="h-full w-full object-cover object-center opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A192F] via-[#0A192F]/90 to-[#0A192F]/65" />
        </div>
        <div className="relative mx-auto max-w-7xl">
          <nav aria-label="Breadcrumb" className="mb-5 text-sm text-slate-300">
            <a href="/" className="hover:text-amber-300">Home</a>
            <span className="mx-2">/</span>
            <span>Lansdowne</span>
          </nav>
          <div className="max-w-3xl md:w-[58%]">
            <p className="mb-3 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-amber-300">
              <MapPin className="h-4 w-4" /> Lansdowne, Uttarakhand
            </p>
            <h1 className="text-3xl font-black leading-tight md:text-5xl">{page.title.split('|')[0].trim()}</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-200 md:text-lg">{page.intro}</p>
            <button
              type="button"
              onClick={onSearch}
              className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-sm font-extrabold text-slate-950 transition hover:bg-amber-300"
            >
              Search Lansdowne stays <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      <section id="available-stays" className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-14">
        <div className="mb-6 max-w-3xl">
          <h2 className="text-2xl font-black text-slate-900">Available stays in Lansdowne</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{page.highlight}</p>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center text-sm font-semibold text-slate-600">
            Loading available stays...
          </div>
        ) : pageHotels.length ? (
          <div className="grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {pageHotels.map((hotel) => (
              <HotelCard key={hotel.id} hotel={hotel} layout="grid" onSelectHotel={onSelectHotel} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-12 text-center">
            <p className="text-lg font-extrabold text-slate-900">No matching Lansdowne stays are listed right now</p>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
              Listings depend on current availability and the details supplied by each property. Try again later or search another destination.
            </p>
            <button
              type="button"
              onClick={onSearch}
              className="mt-5 rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white hover:bg-blue-800"
            >
              Search hotels
            </button>
          </div>
        )}

        <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-5 md:p-7">
          <h2 className="text-xl font-black text-slate-900">Plan your Lansdowne stay</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">{page.intro} {page.highlight}</p>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Before booking, confirm the exact location, room occupancy, included amenities, cancellation policy and final price for your travel dates. Property details and availability can change.
          </p>
        </div>

        <nav aria-label="More Lansdowne hotel searches" className="mt-8">
          <h2 className="mb-3 text-lg font-extrabold text-slate-900">Explore more Lansdowne hotel searches</h2>
          <div className="flex flex-wrap gap-2">
            {LANSDOWNE_SEO_PAGES.filter((relatedPage) => relatedPage.slug !== page.slug).map((relatedPage) => (
              <a
                key={relatedPage.slug}
                href={`/${relatedPage.slug}/`}
                className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-amber-400 hover:text-slate-950"
              >
                {relatedPage.title.split('|')[0].trim()}
              </a>
            ))}
          </div>
        </nav>
      </section>
    </main>
  );
}
