import React, { useState } from 'react';
import {
  Building2,
  ShieldCheck,
  Clock,
  Phone,
  Mail,
  User,
  Lock,
  MapPin,
  Hotel,
  BadgeCheck,
  Headset,
  Wallet,
  LayoutDashboard,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';
import { apiService } from '../services/api';
import Logo from './Logo';

const SUPPORT_PHONE = '+91 8447151225';
const OFFICE_ADDRESS = 'Deevika Tower, Chandan Nagar, Ghaziabad';

const STEPS = [
  { step: '01', title: 'Submit application', detail: 'Share property and owner details in under 5 minutes.' },
  { step: '02', title: 'Verification', detail: 'Our team reviews your listing and confirms commission terms.' },
  { step: '03', title: 'Go live', detail: 'Access the partner dashboard to manage rooms, rates, and bookings.' },
];

const BENEFITS = [
  {
    icon: Wallet,
    title: '90% direct payout',
    detail: 'Flat 10% platform fee on confirmed bookings — transparent and predictable.',
  },
  {
    icon: LayoutDashboard,
    title: 'Partner dashboard',
    detail: 'Control inventory, pricing, photos, and booking status from one portal.',
  },
  {
    icon: BadgeCheck,
    title: 'Verified demand',
    detail: 'Reach travellers searching on TRUMITRIP with secure payment collection.',
  },
  {
    icon: Headset,
    title: 'Dedicated support',
    detail: 'Partner onboarding and account help via phone and email.',
  },
];

function PartnerTopBar({ onNavigateView }) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0A192F]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-10">
        <button type="button" onClick={() => onNavigateView('customer')} className="text-left shrink-0">
          <Logo size="medium" />
        </button>
        <nav className="flex items-center gap-2 sm:gap-4">
          <button
            type="button"
            onClick={() => onNavigateView('customer')}
            className="hidden text-xs font-semibold text-slate-300 hover:text-white sm:inline"
          >
            Back to TRUMITRIP
          </button>
          <button
            type="button"
            onClick={() => onNavigateView('vendor-login')}
            className="rounded-lg border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-3 py-2 text-xs font-bold text-[#F3E5AB] transition hover:bg-[#D4AF37]/20 sm:px-4"
          >
            Partner login
          </button>
        </nav>
      </div>
    </header>
  );
}

function PartnerSupportStrip() {
  return (
    <section className="border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-3 lg:px-10">
        <div>
          <p className="text-[11px] font-black uppercase tracking-wider text-[#B8860B]">Partner support</p>
          <p className="mt-2 text-sm font-bold text-slate-900">Questions before you apply?</p>
          <p className="mt-1 text-sm text-slate-600">Our team helps with onboarding, pricing, and listing setup.</p>
        </div>
        <a
          href="tel:+918447151225"
          className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-[#D4AF37]/50"
        >
          <Phone className="mt-0.5 h-5 w-5 shrink-0 text-[#B8860B]" />
          <div>
            <p className="text-xs font-bold text-slate-500">Call us</p>
            <p className="text-sm font-extrabold text-slate-900">{SUPPORT_PHONE}</p>
          </div>
        </a>
        <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#B8860B]" />
          <div>
            <p className="text-xs font-bold text-slate-500">Registered office</p>
            <p className="text-sm font-semibold leading-relaxed text-slate-800">{OFFICE_ADDRESS}</p>
            <a href="mailto:info@trumitrip.com" className="mt-1 inline-block text-xs font-bold text-[#0A192F] underline">
              info@trumitrip.com
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function BecomePartnerPage({ currentUser, onLoginSuccess, onNavigateView, onLogout }) {
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    password: '',
    hotel_name: '',
    city: 'Goa',
    address: '',
    total_rooms: '15',
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [submittedVendor, setSubmittedVendor] = useState(null);
  const [agreedTerms, setAgreedTerms] = useState(false);

  const isPendingVendor = currentUser?.role === 'VENDOR' && currentUser?.vendor_status === 'PENDING';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreedTerms) {
      setErrorMsg('Please accept the partner terms to continue.');
      return;
    }
    if (!formData.name || !formData.email || !formData.password || !formData.hotel_name) {
      setErrorMsg('Full Name, Email, Password, and Hotel Name are required.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    const res = await apiService.createVendor({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
      hotel_name: formData.hotel_name,
      city: formData.city,
      address: formData.address,
      total_rooms: formData.total_rooms,
    });

    setLoading(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      const vendorObj = res.vendor || {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: 'VENDOR',
        vendor_status: 'PENDING',
        hotel_name: formData.hotel_name,
      };
      setSubmittedVendor(vendorObj);
      if (onLoginSuccess && res.vendor) {
        onLoginSuccess({ ...res.vendor, role: 'VENDOR', vendor_status: 'PENDING' }, res.token);
      }
    }
  };

  if (isPendingVendor || submittedVendor) {
    const activeUser = submittedVendor || currentUser;
    return (
      <div className="flex min-h-screen flex-col bg-slate-100">
        <PartnerTopBar onNavigateView={onNavigateView} />
        <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60">
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 ring-1 ring-amber-200">
                <Clock className="h-7 w-7" />
              </div>
              <p className="mt-4 text-[11px] font-black uppercase tracking-wider text-amber-700">Under review</p>
              <h1 className="mt-2 text-2xl font-black text-slate-900">Application received</h1>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                We are reviewing{' '}
                <strong className="text-slate-900">{activeUser?.hotel_name || formData.hotel_name || 'your property'}</strong>.
                You will get dashboard access once an administrator approves your partner account.
              </p>
            </div>

            <dl className="mt-8 space-y-3 rounded-2xl bg-slate-50 p-5 text-sm">
              {[
                ['Applicant', activeUser?.name],
                ['Email', activeUser?.email],
                ['Property', activeUser?.hotel_name || formData.hotel_name],
                ['Commission', '10% platform fee · 90% payout'],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 border-b border-slate-200/80 pb-3 last:border-0 last:pb-0">
                  <dt className="font-medium text-slate-500">{label}</dt>
                  <dd className="text-right font-bold text-slate-900">{value}</dd>
                </div>
              ))}
              <div className="flex justify-between gap-4 pt-1">
                <dt className="font-medium text-slate-500">Status</dt>
                <dd>
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-black uppercase text-amber-800">
                    Pending approval
                  </span>
                </dd>
              </div>
            </dl>

            <div className="mt-6 flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-xs leading-relaxed text-slate-600">
              <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600" />
              After approval, sign in with your partner credentials to open the Hotel Partner Dashboard.
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => onNavigateView('customer')}
                className="flex-1 rounded-xl bg-[#0A192F] py-3.5 text-xs font-black text-[#D4AF37] transition hover:brightness-110"
              >
                Return to TRUMITRIP
              </button>
              <button
                type="button"
                onClick={onLogout}
                className="rounded-xl border border-slate-300 px-5 py-3.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Sign out
              </button>
            </div>
          </div>
        </main>
        <PartnerSupportStrip />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <PartnerTopBar onNavigateView={onNavigateView} />

      {/* Hero */}
      <section className="relative overflow-hidden bg-[#0A192F] text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div className="pointer-events-none absolute -right-32 top-0 h-96 w-96 rounded-full bg-[#D4AF37]/10 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:flex lg:items-center lg:gap-16 lg:px-10 lg:py-20">
          <div className="lg:flex-1">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#D4AF37]">Hotel partner program</p>
            <h1 className="mt-3 text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-[2.75rem]">
              List your property on TRUMITRIP and grow direct bookings
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base">
              A professional onboarding flow for hotels and resorts — transparent commission, secure payouts, and a
              dedicated partner dashboard after approval.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#partner-application"
                className="inline-flex items-center gap-2 rounded-xl bg-[#D4AF37] px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-[#E5C158]"
              >
                Start application <ArrowRight className="h-4 w-4" />
              </a>
              <button
                type="button"
                onClick={() => onNavigateView('vendor-login')}
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
              >
                Already registered? Sign in
              </button>
            </div>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:mt-0 lg:w-[340px] lg:shrink-0">
            {[
              { value: '90%', label: 'Partner payout on each booking' },
              { value: '10%', label: 'Flat platform commission' },
              { value: '24/7', label: 'Listing & booking support' },
              { value: 'Free', label: 'Partner registration' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
              >
                <p className="text-2xl font-black text-[#F3E5AB]">{stat.value}</p>
                <p className="mt-1 text-[11px] font-medium leading-snug text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-10">
          <h2 className="text-center text-lg font-black text-slate-900 sm:text-xl">How onboarding works</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {STEPS.map((item, index) => (
              <div key={item.step} className="relative rounded-2xl border border-slate-200 bg-slate-50 p-6">
                {index < STEPS.length - 1 && (
                  <ChevronRight className="absolute -right-3 top-1/2 hidden h-5 w-5 -translate-y-1/2 text-slate-300 md:block" />
                )}
                <p className="text-xs font-black text-[#B8860B]">{item.step}</p>
                <h3 className="mt-2 font-extrabold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits + Form */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-5">
            <h2 className="text-xl font-black text-slate-900">Why partner with us</h2>
            <p className="mt-2 text-sm text-slate-600">
              Built for property owners who want clarity on fees, control over inventory, and reliable traveller demand.
            </p>
            <ul className="mt-8 space-y-4">
              {BENEFITS.map(({ icon: Icon, title, detail }) => (
                <li key={title} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0A192F] text-[#D4AF37]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">{title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">{detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div id="partner-application" className="lg:col-span-7 scroll-mt-24">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-8">
              <div className="border-b border-slate-100 pb-5">
                <div className="flex items-center gap-2">
                  <Hotel className="h-5 w-5 text-[#B8860B]" />
                  <h2 className="text-xl font-black text-slate-900">Partner application</h2>
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  Complete both sections below. Fields marked with * are required.
                </p>
              </div>

              {errorMsg && (
                <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-6 space-y-8">
                <fieldset className="space-y-4">
                  <legend className="text-[11px] font-black uppercase tracking-wider text-[#B8860B]">
                    Account holder
                  </legend>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-bold text-slate-700">Full name *</span>
                      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-[#D4AF37] focus-within:ring-2 focus-within:ring-[#D4AF37]/20">
                        <User className="h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Owner or manager name"
                          className="w-full bg-transparent text-sm font-medium text-slate-900 outline-none"
                        />
                      </div>
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-bold text-slate-700">Work email *</span>
                      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-[#D4AF37] focus-within:ring-2 focus-within:ring-[#D4AF37]/20">
                        <Mail className="h-4 w-4 text-slate-400" />
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="owner@property.com"
                          className="w-full bg-transparent text-sm font-medium text-slate-900 outline-none"
                        />
                      </div>
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-bold text-slate-700">Mobile *</span>
                      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-[#D4AF37] focus-within:ring-2 focus-within:ring-[#D4AF37]/20">
                        <Phone className="h-4 w-4 text-slate-400" />
                        <input
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+91 8447151225"
                          className="w-full bg-transparent text-sm font-medium text-slate-900 outline-none"
                        />
                      </div>
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-bold text-slate-700">Password *</span>
                      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-[#D4AF37] focus-within:ring-2 focus-within:ring-[#D4AF37]/20">
                        <Lock className="h-4 w-4 text-slate-400" />
                        <input
                          type="password"
                          required
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          placeholder="Minimum 8 characters"
                          className="w-full bg-transparent text-sm font-medium text-slate-900 outline-none"
                        />
                      </div>
                    </label>
                  </div>
                </fieldset>

                <fieldset className="space-y-4 border-t border-slate-100 pt-6">
                  <legend className="text-[11px] font-black uppercase tracking-wider text-[#B8860B]">
                    Property details
                  </legend>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-bold text-slate-700">Hotel / property name *</span>
                    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-[#D4AF37] focus-within:ring-2 focus-within:ring-[#D4AF37]/20">
                      <Building2 className="h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={formData.hotel_name}
                        onChange={(e) => setFormData({ ...formData, hotel_name: e.target.value })}
                        placeholder="Registered property name"
                        className="w-full bg-transparent text-sm font-medium text-slate-900 outline-none"
                      />
                    </div>
                  </label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-bold text-slate-700">City / region *</span>
                      <input
                        type="text"
                        required
                        list="partner-city-suggestions"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="City"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
                      />
                      <datalist id="partner-city-suggestions">
                        {['Goa', 'Mumbai', 'Delhi', 'Manali', 'Jaipur', 'Dubai', 'Paris', 'Singapore', 'Lansdowne', 'Ghaziabad'].map(
                          (c) => (
                            <option key={c} value={c} />
                          ),
                        )}
                      </datalist>
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-bold text-slate-700">Room count *</span>
                      <input
                        type="number"
                        min="1"
                        required
                        value={formData.total_rooms}
                        onChange={(e) => setFormData({ ...formData, total_rooms: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
                      />
                    </label>
                  </div>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-bold text-slate-700">Full address</span>
                    <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-[#D4AF37] focus-within:ring-2 focus-within:ring-[#D4AF37]/20">
                      <MapPin className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
                      <textarea
                        rows={3}
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="Street, area, PIN code"
                        className="w-full resize-none bg-transparent text-sm font-medium text-slate-900 outline-none"
                      />
                    </div>
                  </label>
                </fieldset>

                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <input
                    type="checkbox"
                    checked={agreedTerms}
                    onChange={(e) => setAgreedTerms(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-[#0A192F] focus:ring-[#D4AF37]"
                  />
                  <span className="text-xs leading-relaxed text-slate-600">
                    I confirm the information is accurate and agree to TRUMITRIP partner terms, including the{' '}
                    <strong className="text-slate-900">10% platform fee</strong> and admin verification before listing goes live.
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0A192F] py-4 text-sm font-black text-[#D4AF37] transition hover:brightness-110 disabled:opacity-60"
                >
                  {loading ? 'Submitting…' : 'Submit partner application'}
                  {!loading && <ArrowRight className="h-4 w-4" />}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <PartnerSupportStrip />

      <footer className="border-t border-slate-200 bg-slate-50 py-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} TRUMITRIP · Hotel Partner Program
      </footer>
    </div>
  );
}
