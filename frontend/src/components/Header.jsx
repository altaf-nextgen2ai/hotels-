import React, { useState } from 'react';
import Logo from './Logo';
import { Phone, MessageSquare, Building2, Tag, Calendar, Headset, User, HelpCircle, ChevronDown, LayoutDashboard, Store, LogOut } from 'lucide-react';

export default function Header({ currentUser, onOpenAuth, onLogout, onNavigateView, bookingsCount = 0, onOpenBookings, onOpenOffers, onOpenSupport }) {
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="w-full sticky top-0 z-50 bg-white shadow-md">
      {/* Top Contact Bar (Clean without public mode switcher) */}
      <div className="bg-[#0A192F] text-slate-200 text-xs py-2 px-4 md:px-8 flex justify-between items-center border-b border-slate-800">
        <div className="flex items-center gap-2 font-medium">
          <Phone className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>Toll Free : <strong className="text-white hover:text-[#D4AF37] cursor-pointer">1800-270-0297</strong></span>
        </div>
        <div className="flex items-center gap-6">
          <button 
            onClick={() => {
              if (currentUser?.role === 'VENDOR') {
                onNavigateView('partner');
              } else {
                onNavigateView('become-partner');
              }
            }}
            className="flex items-center gap-2 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-[#D4AF37] px-3 py-1 rounded-full font-bold text-[11px] transition shadow-xs cursor-pointer group"
          >
            <Building2 className="w-3.5 h-3.5 text-[#D4AF37] group-hover:scale-110 transition-transform" />
            <span>Become a Partner</span>
            <span className="bg-[#D4AF37] text-slate-950 font-black text-[9px] px-1.5 py-0.2 rounded uppercase">Join Free</span>
          </button>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex justify-between items-center">
        {/* Brand Logo */}
        <div onClick={() => onNavigateView('customer')} className="cursor-pointer">
          <Logo size="medium" />
        </div>

        {/* Center & Right Navigation Menu */}
        <div className="flex items-center gap-2 md:gap-4">
          <button 
            onClick={() => onNavigateView('customer')}
            className="flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm text-slate-700 hover:bg-slate-100 transition"
          >
            <Building2 className="w-4 h-4 text-amber-600" />
            <span>Hotels</span>
          </button>

          <button 
            onClick={onOpenOffers}
            className="flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm text-slate-700 hover:bg-slate-100 transition"
          >
            <Tag className="w-4 h-4 text-amber-600" />
            <span>Offers</span>
          </button>

          <button 
            onClick={onOpenBookings}
            className="flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm text-slate-700 hover:bg-slate-100 transition relative"
          >
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>My Bookings</span>
            {bookingsCount > 0 && (
              <span className="bg-emerald-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                {bookingsCount}
              </span>
            )}
          </button>

          <button 
            onClick={onOpenSupport}
            className="flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm text-slate-700 hover:bg-slate-100 transition"
          >
            <Headset className="w-4 h-4 text-indigo-600" />
            <span>Support</span>
          </button>

          {/* Quick Enquiry Button */}
          <button 
            onClick={onOpenSupport}
            className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm border-2 border-[#D4AF37] text-slate-900 hover:bg-[#D4AF37]/10 transition"
          >
            <HelpCircle className="w-4 h-4 text-[#D4AF37]" />
            <span>Quick Enquiry</span>
          </button>

          {/* Role-based User Auth Header Component */}
          {!currentUser ? (
            <button 
              onClick={onOpenAuth}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm bg-gradient-to-r from-[#0F172A] to-[#1E293B] text-[#D4AF37] hover:brightness-110 shadow transition"
            >
              <User className="w-4 h-4 text-[#D4AF37]" />
              <span>Login / Signup</span>
            </button>
          ) : (
            <div className="relative">
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-4 py-2 rounded-full font-extrabold text-sm bg-[#0F172A] text-white hover:bg-slate-800 transition shadow border border-[#D4AF37]/40"
              >
                <div className="w-6 h-6 rounded-full bg-[#D4AF37] text-slate-950 font-black text-xs flex items-center justify-center">
                  {currentUser.name.charAt(0)}
                </div>
                <span className="max-w-[120px] truncate">{currentUser.name}</span>
                <span className="text-[10px] bg-[#D4AF37] text-slate-950 px-1.5 py-0.5 rounded font-black uppercase">
                  {currentUser.role}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-300" />
              </button>

              {/* User Menu Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-in fade-in">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs text-slate-400 font-medium">Logged in as</p>
                    <p className="text-sm font-bold text-slate-900 truncate">{currentUser.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                  </div>

                  {currentUser.role === 'CUSTOMER' && (
                    <button 
                      onClick={() => { onOpenBookings(); setShowUserMenu(false); }}
                      className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span>My Active Bookings</span>
                    </button>
                  )}

                  {currentUser.role === 'VENDOR' && (
                    <button 
                      onClick={() => { onNavigateView('partner'); setShowUserMenu(false); }}
                      className="w-full text-left px-4 py-2.5 text-xs font-bold text-emerald-700 hover:bg-emerald-50 flex items-center gap-2"
                    >
                      <Store className="w-4 h-4 text-emerald-600" />
                      <span>My Vendor Dashboard ({currentUser.hotel_name || 'Property'})</span>
                    </button>
                  )}

                  {currentUser.role === 'ADMIN' && (
                    <button 
                      onClick={() => { onNavigateView('admin'); setShowUserMenu(false); }}
                      className="w-full text-left px-4 py-2.5 text-xs font-bold text-amber-700 hover:bg-amber-50 flex items-center gap-2"
                    >
                      <LayoutDashboard className="w-4 h-4 text-amber-600" />
                      <span>Admin Executive Control</span>
                    </button>
                  )}

                  <div className="border-t border-slate-100 mt-1 pt-1">
                    <button 
                      onClick={() => { onLogout(); setShowUserMenu(false); }}
                      className="w-full text-left px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out Account</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
