export const DESTINATION_PAGES = [
  {
    slug: 'hotels-in-goa',
    city: 'Goa',
    region: 'India',
    title: 'Hotels in Goa',
    description: 'Compare hotels in Goa on TrumiTrip. Browse verified stays, amenities, and prices before you book online.',
    intro: 'Planning a beach holiday? Explore hotels in Goa, compare room details and nightly rates, and book a stay that fits your travel dates.',
    highlight: 'Check location, cancellation terms, and final checkout price for each property before confirming your Goa booking.',
    heroImage: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1600&q=85',
  },
  {
    slug: 'hotels-in-dubai',
    city: 'Dubai',
    region: 'UAE',
    title: 'Hotels in Dubai',
    description: 'Find hotels in Dubai on TrumiTrip. Compare luxury and budget stays with instant booking support.',
    intro: 'Visiting Dubai? Browse available hotel listings, compare amenities and guest ratings, and choose a stay for your trip.',
    highlight: 'Confirm property location, room occupancy, and cancellation policy with the hotel before you travel.',
    heroImage: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1600&q=85',
  },
  {
    slug: 'hotels-in-manali',
    city: 'Manali',
    region: 'India',
    title: 'Hotels in Manali',
    description: 'Book hotels in Manali with TrumiTrip. Compare hill stays, room features, and prices online.',
    intro: 'Heading to the mountains? Explore hotels in Manali and compare properties for your preferred dates and budget.',
    highlight: 'Winter and peak-season availability can change quickly — confirm rates for your exact check-in and check-out dates.',
    heroImage: 'https://images.unsplash.com/photo-1626621341517-bbf3c7a2fa6a?auto=format&fit=crop&w=1600&q=85',
  },
  {
    slug: 'hotels-in-paris',
    city: 'Paris',
    region: 'France',
    title: 'Hotels in Paris',
    description: 'Discover hotels in Paris on TrumiTrip. Compare central stays and book with secure online payment.',
    intro: 'Planning a Paris getaway? Compare hotel listings by location, amenities, and price to find a stay that suits your itinerary.',
    highlight: 'Review the property address and access details before booking, especially for late-night arrivals.',
    heroImage: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1600&q=85',
  },
  {
    slug: 'hotels-in-singapore',
    city: 'Singapore',
    region: 'Singapore',
    title: 'Hotels in Singapore',
    description: 'Search hotels in Singapore on TrumiTrip. Compare city hotels and confirm your booking online.',
    intro: 'Traveling to Singapore? Browse available hotels, compare facilities and prices, and plan your stay in one place.',
    highlight: 'Check guest capacity, ID requirements, and cancellation rules on each listing before checkout.',
    heroImage: 'https://images.unsplash.com/photo-1525621485617-8432222a1a2d?auto=format&fit=crop&w=1600&q=85',
  },
];

export const getDestinationPage = (pathname) => {
  const slug = pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
  return DESTINATION_PAGES.find((page) => page.slug === slug) || null;
};

export const OTHER_DESTINATION_LINKS = (currentSlug) =>
  DESTINATION_PAGES.filter((page) => page.slug !== currentSlug);
