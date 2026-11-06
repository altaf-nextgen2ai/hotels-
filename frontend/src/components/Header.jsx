import React, { useState } from 'react';
import Logo from './Logo';
import { Phone, Building2, Tag, Calendar, Headset, User, HelpCircle, ChevronDown, LayoutDashboard, Store, LogOut, Menu, X } from 'lucide-react';

export default function Header({ currentUser, onOpenAuth, onLogout, onNavigateView, bookingsCount = 0, onOpenBookings, onOpenOffers, onOpenSupport }) {
  const [showUserMenu,   setShowUserMenu]   = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  return (
    <header className="w-full sticky top-0 z-40 bg-white shadow-md safe-area-top">
      {/* Top bar */}
      <div className="bg-[#0A192F] text-slate-200 text-xs py-2 px-4 md:px-8 flex justify-between items-center border-b border-slate-800">
        <div className="flex items-center gap-2 font-medium">
          <Phone className="w-3.5 h-3.5 text-[#D4AF37]" />
          <a href="tel:+918447151225" className="hidden sm:inline hover:text-[#D4AF37] transition">
            Support : <strong className="text-white">+91 8447151225</strong>
          </a>
          <a href="tel:+918447151225" className="sm:hidden text-white font-bold hover:text-[#D4AF37]">8447151225</a>
        </div>
        <div className="flex items-center gap-3">
          {(!currentUser || currentUser.role === 'CUSTOMER') && (
            <button onClick={() => onNavigateView('become-partner')}
              className="flex items-center gap-1.5 bg-[#D4AF37]/10 border border-[#D4AF37]/50 text-[#D4AF37] px-2.5 py-1 rounded-full font-bold text-[11px] transition">
              <Building2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Become a Partner</span>
              <span className="bg-[#D4AF37] text-slate-950 font-black text-[9px] px-1.5 rounded uppercase hidden sm:inline">Free</span>
            </button>
          )}
          {currentUser?.role === 'VENDOR' && (
            <button onClick={() => onNavigateView('partner')}
              className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 px-2.5 py-1 rounded-full font-bold text-[11px] transition">
              <Store className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">My Dashboard</span>
            </button>
          )}
          {currentUser?.role === 'ADMIN' && (
            <button onClick={() => onNavigateView('admin')}
              className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/40 text-amber-400 px-2.5 py-1 rounded-full font-bold text-[11px] transition">
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Admin Panel</span>
            </button>
          )}
        </div>
      </div>

      {/* Main navbar */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex justify-between items-center">
        <div onClick={() => onNavigateView('customer')} className="cursor-pointer">
          <Logo size="medium" />
        </div>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-2 lg:gap-4">
          {[
            { label: 'Hotels',      icon: Building2, fn: () => onNavigateView('customer'), color: 'text-amber-600' },
            { label: 'Offers',      icon: Tag,       fn: onOpenOffers,  color: 'text-amber-600' },
            { label: 'Support',     icon: Headset,   fn: onOpenSupport, color: 'text-indigo-600' },
          ].map(({ label, icon: Icon, fn, color }) => (
            <button key={label} onClick={fn}
              className="flex items-center gap-2 px-3 py-2 rounded-full font-semibold text-sm text-slate-700 hover:bg-slate-100 transition">
              <Icon className={`w-4 h-4 ${color}`} />
              <span>{label}</span>
            </button>
          ))}

          <button onClick={onOpenBookings}
            className="flex items-center gap-2 px-3 py-2 rounded-full font-semibold text-sm text-slate-700 hover:bg-slate-100 transition relative">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>My Bookings</span>
            {bookingsCount > 0 && <span className="bg-emerald-600 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">{bookingsCount}</span>}
          </button>

          <button onClick={onOpenSupport}
            className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-full font-semibold text-sm border-2 border-[#D4AF37] text-slate-900 hover:bg-[#D4AF37]/10 transition">
            <HelpCircle className="w-4 h-4 text-[#D4AF37]" />
            <span>Quick Enquiry</span>
          </button>

          {!currentUser ? (
            <button onClick={onOpenAuth}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-sm bg-gradient-to-r from-[#0F172A] to-[#1E293B] text-[#D4AF37] hover:brightness-110 shadow transition">
              <User className="w-4 h-4" />
              <span>Login</span>
            </button>
          ) : (
            <div className="relative">
              <button onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-3 py-2 rounded-full font-extrabold text-sm bg-[#0F172A] text-white hover:bg-slate-800 transition shadow border border-[#D4AF37]/40">
                <div className="w-6 h-6 rounded-full bg-[#D4AF37] text-slate-950 font-black text-xs flex items-center justify-center">
                  {currentUser.name.charAt(0)}
                </div>
                <span className="max-w-[100px] truncate hidden lg:block">{currentUser.name}</span>
                <span className="text-[10px] bg-[#D4AF37] text-slate-950 px-1.5 py-0.5 rounded font-black uppercase">{currentUser.role}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-300" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs text-slate-400">Logged in as</p>
                    <p className="text-sm font-bold text-slate-900 truncate">{currentUser.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                  </div>
                  {currentUser.role === 'CUSTOMER' && (
                    <button onClick={() => { onOpenBookings(); setShowUserMenu(false); }}
                      className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-600" /> My Bookings
                    </button>
                  )}
                  {currentUser.role === 'VENDOR' && (
                    <button onClick={() => { onNavigateView('partner'); setShowUserMenu(false); }}
                      className="w-full text-left px-4 py-2.5 text-xs font-bold text-emerald-700 hover:bg-emerald-50 flex items-center gap-2">
                      <Store className="w-4 h-4" /> Vendor Dashboard
                    </button>
                  )}
                  {currentUser.role === 'ADMIN' && (
                    <button onClick={() => { onNavigateView('admin'); setShowUserMenu(false); }}
                      className="w-full text-left px-4 py-2.5 text-xs font-bold text-amber-700 hover:bg-amber-50 flex items-center gap-2">
                      <LayoutDashboard className="w-4 h-4" /> Admin Panel
                    </button>
                  )}
                  <div className="border-t border-slate-100 mt-1 pt-1">
                    <button onClick={() => { onLogout(); setShowUserMenu(false); }}
                      className="w-full text-left px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2">
                      <LogOut className="w-3.5 h-3.5" /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile right — auth + hamburger */}
        <div className="flex md:hidden items-center gap-2">
          {!currentUser ? (
            <button onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full font-bold text-xs bg-[#0F172A] text-[#D4AF37] shadow">
              <User className="w-3.5 h-3.5" /> Login
            </button>
          ) : (
            <button onClick={onOpenBookings}
              className="relative flex items-center gap-1.5 px-3 py-2 rounded-full font-bold text-xs bg-[#0F172A] text-[#D4AF37]">
              <div className="w-5 h-5 rounded-full bg-[#D4AF37] text-slate-950 font-black text-xs flex items-center justify-center">
                {currentUser.name.charAt(0)}
              </div>
              {bookingsCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">{bookingsCount}</span>}
            </button>
          )}
          <button onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition">
            {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {showMobileMenu && (
        <div className="md:hidden bg-white border-t border-slate-200 shadow-lg">
          <div className="px-4 py-3 space-y-1">
            {[
              { label: 'Hotels',      fn: () => { onNavigateView('customer'); setShowMobileMenu(false); } },
              { label: 'Offers',      fn: () => { onOpenOffers(); setShowMobileMenu(false); } },
              { label: 'My Bookings', fn: () => { onOpenBookings(); setShowMobileMenu(false); } },
              { label: 'Support',     fn: () => { onOpenSupport(); setShowMobileMenu(false); } },
            ].map(({ label, fn }) => (
              <button key={label} onClick={fn}
                className="w-full text-left px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition min-h-[44px]">
                {label}
              </button>
            ))}
            {currentUser?.role === 'VENDOR' && (
              <button onClick={() => { onNavigateView('partner'); setShowMobileMenu(false); }}
                className="w-full text-left px-4 py-3 text-sm font-bold text-emerald-700 hover:bg-emerald-50 rounded-xl min-h-[44px]">
                Vendor Dashboard
              </button>
            )}
            {currentUser?.role === 'ADMIN' && (
              <button onClick={() => { onNavigateView('admin'); setShowMobileMenu(false); }}
                className="w-full text-left px-4 py-3 text-sm font-bold text-amber-700 hover:bg-amber-50 rounded-xl min-h-[44px]">
                Admin Panel
              </button>
            )}
            {(!currentUser || currentUser.role === 'CUSTOMER') && (
              <button onClick={() => { onNavigateView('become-partner'); setShowMobileMenu(false); }}
                className="w-full text-left px-4 py-3 text-sm font-bold text-[#967414] hover:bg-amber-50 rounded-xl min-h-[44px]">
                Become a Partner
              </button>
            )}
            {currentUser && (
              <button onClick={() => { onLogout(); setShowMobileMenu(false); }}
                className="w-full text-left px-4 py-3 text-sm font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition flex items-center gap-2">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
