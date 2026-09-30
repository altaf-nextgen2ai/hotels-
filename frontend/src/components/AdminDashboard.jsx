import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Building2, Calendar, DollarSign, Users, TrendingUp, Plus, Edit, Trash2, CheckCircle, XCircle, Search, UserCheck, Store } from 'lucide-react';
import { apiService } from '../services/api';

export default function AdminDashboard({ hotels, bookings, onRefreshData }) {
  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics', 'hotels', 'vendors', 'bookings'
  const [showAddHotelModal, setShowAddHotelModal] = useState(false);
  const [showAddVendorModal, setShowAddVendorModal] = useState(false);
  
  const [analytics, setAnalytics] = useState(null);
  const [vendorsList, setVendorsList] = useState([]);

  // New Hotel Form State
  const [newHotelName, setNewHotelName] = useState('');
  const [newHotelCity, setNewHotelCity] = useState('Goa');
  const [newHotelPrice, setNewHotelPrice] = useState(9999);
  const [newHotelStars, setNewHotelStars] = useState(5);

  // New Vendor Account Form State (Admin Creates Vendor)
  const [vendorName, setVendorName] = useState('');
  const [vendorEmail, setVendorEmail] = useState('');
  const [vendorPhone, setVendorPhone] = useState('');
  const [vendorPassword, setVendorPassword] = useState('vendor123');
  const [vendorHotelId, setVendorHotelId] = useState(hotels[0]?.id || 1);
  const [isCreatingVendor, setIsCreatingVendor] = useState(false);

  const fetchVendors = async () => {
    const data = await apiService.getVendors();
    if (data) setVendorsList(data);
  };

  useEffect(() => {
    const fetchAnalytics = async () => {
      const data = await apiService.getAdminAnalytics();
      if (data) setAnalytics(data);
    };
    fetchAnalytics();
    fetchVendors();
  }, []);

  const handleAddHotelSubmit = async (e) => {
    e.preventDefault();
    if (!newHotelName) return;

    const payload = {
      name: newHotelName,
      city: newHotelCity,
      destination: newHotelCity,
      address: `${newHotelCity} Beach Road, ${newHotelCity}`,
      star_rating: Number(newHotelStars),
      rating_score: 4.8,
      review_count: 10,
      price_per_night: Number(newHotelPrice),
      original_price: Math.round(newHotelPrice * 1.3),
      main_image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
      gallery_images: ["https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80"],
      amenities: ["WiFi", "Pool", "Spa", "Breakfast", "AC"],
      description: "Brand new luxury hotel listing added via TRUMITRIP Admin Portal.",
      is_featured: true
    };

    await apiService.updatePartnerRates(payload);
    alert(`Hotel "${newHotelName}" added successfully!`);
    setShowAddHotelModal(false);
    if (onRefreshData) onRefreshData();
  };

  const handleCreateVendorSubmit = async (e) => {
    e.preventDefault();
    if (!vendorName || !vendorEmail || !vendorPassword || !vendorHotelId) {
      alert('Please fill all required fields for vendor account creation.');
      return;
    }

    setIsCreatingVendor(true);
    const res = await apiService.createVendor({
      name: vendorName,
      email: vendorEmail,
      phone: vendorPhone,
      password: vendorPassword,
      hotel_id: vendorHotelId
    });
    setIsCreatingVendor(false);

    if (res.error) {
      alert(res.error);
    } else {
      alert(`Vendor Account created for "${vendorName}" successfully!`);
      setShowAddVendorModal(false);
      setVendorName('');
      setVendorEmail('');
      setVendorPhone('');
      fetchVendors();
    }
  };

  const metrics = analytics?.metrics || {
    total_hotels: hotels.length || 8,
    total_bookings: bookings.length || 24,
    total_vendors: vendorsList.length || 2,
    total_revenue: 640000,
    occupancy_rate: "84.5%",
    active_users: 14850
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-xl gap-4">
          <div>
            <div className="flex items-center gap-2">
              <LayoutDashboard className="w-6 h-6 text-[#D4AF37]" />
              <h1 className="text-2xl font-black text-white">TRUMITRIP Executive Admin Panel</h1>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-1">Platform Analytics, Property Listing & Hotel Partner Management</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${activeTab === 'analytics' ? 'bg-[#D4AF37] text-slate-950' : 'bg-slate-700 text-slate-300'}`}
            >
              Dashboard Overview
            </button>
            <button 
              onClick={() => setActiveTab('hotels')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${activeTab === 'hotels' ? 'bg-[#D4AF37] text-slate-950' : 'bg-slate-700 text-slate-300'}`}
            >
              Hotels ({hotels.length})
            </button>
            <button 
              onClick={() => setActiveTab('vendors')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${activeTab === 'vendors' ? 'bg-[#D4AF37] text-slate-950' : 'bg-slate-700 text-slate-300'}`}
            >
              Hotel Partners / Vendors ({vendorsList.length || 2})
            </button>
            <button 
              onClick={() => setActiveTab('bookings')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${activeTab === 'bookings' ? 'bg-[#D4AF37] text-slate-950' : 'bg-slate-700 text-slate-300'}`}
            >
              Bookings Ledger ({bookings.length})
            </button>
          </div>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-800/90 p-5 rounded-2xl border border-slate-700 shadow">
                <p className="text-xs text-slate-400 font-bold uppercase">TOTAL REVENUE</p>
                <p className="text-2xl font-black text-emerald-400 mt-1">₹{Number(metrics.total_revenue).toLocaleString('en-IN')}</p>
                <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 mt-2">
                  <TrendingUp className="w-3 h-3" /> +18.4% this month
                </span>
              </div>

              <div className="bg-slate-800/90 p-5 rounded-2xl border border-slate-700 shadow">
                <p className="text-xs text-slate-400 font-bold uppercase">HOTEL PARTNERS / VENDORS</p>
                <p className="text-2xl font-black text-indigo-400 mt-1">{vendorsList.length || 2}</p>
                <span className="text-[10px] text-indigo-300 font-semibold mt-2 block">Admin Created Accounts</span>
              </div>

              <div className="bg-slate-800/90 p-5 rounded-2xl border border-slate-700 shadow">
                <p className="text-xs text-slate-400 font-bold uppercase">ACTIVE HOTELS</p>
                <p className="text-2xl font-black text-[#D4AF37] mt-1">{metrics.total_hotels}</p>
                <span className="text-[10px] text-amber-400 font-semibold mt-2 block">Verified Properties</span>
              </div>

              <div className="bg-slate-800/90 p-5 rounded-2xl border border-slate-700 shadow">
                <p className="text-xs text-slate-400 font-bold uppercase">TOTAL BOOKINGS</p>
                <p className="text-2xl font-black text-white mt-1">{metrics.total_bookings}</p>
                <span className="text-[10px] text-slate-400 font-semibold mt-2 block">100% Verified</span>
              </div>
            </div>

            {/* Monthly Trend */}
            <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 space-y-4">
              <h3 className="font-bold text-slate-200 text-sm">Monthly Revenue Trend (2026)</h3>
              <div className="grid grid-cols-8 gap-2 items-end h-40 pt-6">
                {[
                  { month: 'Jan', val: 40 },
                  { month: 'Feb', val: 55 },
                  { month: 'Mar', val: 70 },
                  { month: 'Apr', val: 85 },
                  { month: 'May', val: 95 },
                  { month: 'Jun', val: 75 },
                  { month: 'Jul', val: 90 },
                  { month: 'Aug', val: 100 },
                ].map((item, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end">
                    <div 
                      className="w-full bg-gradient-to-t from-[#B8860B] to-[#D4AF37] rounded-t-lg transition-all duration-500"
                      style={{ height: `${item.val}%` }}
                    />
                    <span className="text-[10px] text-slate-400 font-bold">{item.month}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: VENDOR / HOTEL PARTNER CREATION (ADMIN ONLY) */}
        {activeTab === 'vendors' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-slate-800 p-4 rounded-2xl border border-slate-700">
              <div>
                <h3 className="font-bold text-white text-sm">Hotel Partner / Vendor Accounts</h3>
                <p className="text-xs text-slate-400">Admin creates vendor login credentials and assigns hotel properties</p>
              </div>
              <button 
                onClick={() => setShowAddVendorModal(true)}
                className="bg-emerald-500 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 hover:bg-emerald-400 transition shadow"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Vendor Account</span>
              </button>
            </div>

            {/* Vendor List Table */}
            <div className="bg-slate-800 rounded-3xl border border-slate-700 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Vendor Partner</th>
                    <th className="p-4">Login Email</th>
                    <th className="p-4">Assigned Hotel Property</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700 font-medium">
                  {(vendorsList.length > 0 ? vendorsList : [
                    { id: 1, name: "Taj Exotica Manager", email: "vendor@tajexotica.com", hotel_name: "Taj Exotica Resort & Spa, Benaulim", role: "VENDOR" },
                    { id: 2, name: "Atlantis Palm Partner", email: "vendor@atlantis.com", hotel_name: "Atlantis, The Palm", role: "VENDOR" }
                  ]).map((v, i) => (
                    <tr key={i} className="hover:bg-slate-700/40 transition">
                      <td className="p-4 font-bold text-white flex items-center gap-2">
                        <Store className="w-4 h-4 text-emerald-400" />
                        <span>{v.name}</span>
                      </td>
                      <td className="p-4 text-slate-300 font-mono">{v.email}</td>
                      <td className="p-4 text-[#D4AF37] font-bold">{v.hotel_name || 'Assigned Hotel'}</td>
                      <td className="p-4">
                        <span className="bg-indigo-900/60 text-indigo-300 text-[10px] font-black px-2 py-0.5 rounded">
                          HOTEL PARTNER
                        </span>
                      </td>
                      <td className="p-4">
                        {v.vendor_status === 'APPROVED' ? (
                          <span className="bg-emerald-500/20 text-emerald-400 text-xs font-bold px-2.5 py-1 rounded-lg border border-emerald-500/30 flex items-center gap-1 w-fit">
                            <CheckCircle className="w-3.5 h-3.5" /> Approved
                          </span>
                        ) : v.vendor_status === 'REJECTED' ? (
                          <span className="bg-rose-500/20 text-rose-400 text-xs font-bold px-2.5 py-1 rounded-lg border border-rose-500/30 flex items-center gap-1 w-fit">
                            <XCircle className="w-3.5 h-3.5" /> Rejected
                          </span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={async () => {
                                await apiService.updateVendorStatus(v.id, 'APPROVED');
                                fetchVendors();
                              }}
                              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-3 py-1.5 rounded-lg shadow transition flex items-center gap-1"
                            >
                              <CheckCircle className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button
                              onClick={async () => {
                                await apiService.updateVendorStatus(v.id, 'REJECTED');
                                fetchVendors();
                              }}
                              className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-xs px-3 py-1.5 rounded-lg border border-rose-500/40 transition flex items-center gap-1"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: HOTEL LISTINGS */}
        {activeTab === 'hotels' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-slate-800 p-4 rounded-2xl border border-slate-700">
              <h3 className="font-bold text-white text-sm">Configured Hotel Listings</h3>
              <button 
                onClick={() => setShowAddHotelModal(true)}
                className="bg-[#D4AF37] text-slate-950 font-black text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 hover:brightness-110 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Hotel Listing</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {hotels.map((h, i) => (
                <div key={i} className="bg-slate-800 p-4 rounded-2xl border border-slate-700 flex gap-4 items-center">
                  <img src={h.main_image} alt={h.name} className="w-20 h-20 rounded-xl object-cover shrink-0" />
                  <div className="flex-1 truncate">
                    <h4 className="font-bold text-white text-sm truncate">{h.name}</h4>
                    <p className="text-xs text-slate-400">{h.city} • {h.star_rating} Stars</p>
                    <p className="text-sm font-extrabold text-[#D4AF37] mt-1">₹{Number(h.price_per_night).toLocaleString('en-IN')} / night</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: BOOKINGS LEDGER */}
        {activeTab === 'bookings' && (
          <div className="bg-slate-800 rounded-3xl border border-slate-700 overflow-hidden">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center">
              <h3 className="font-bold text-white text-sm">Customer Bookings Audit Trail</h3>
              <span className="text-xs font-bold bg-slate-700 px-3 py-1 rounded-full text-slate-300">
                {bookings.length} Total Bookings
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Booking ID</th>
                    <th className="p-4">Guest Info</th>
                    <th className="p-4">Hotel Property</th>
                    <th className="p-4">Check-in / Out</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60 font-medium">
                  {bookings.map((b, idx) => (
                    <tr key={idx} className="hover:bg-slate-700/40 transition">
                      <td className="p-4 font-black text-[#D4AF37]">{b.booking_id}</td>
                      <td className="p-4">
                        <p className="font-bold text-white">{b.guest_name}</p>
                        <p className="text-[10px] text-slate-400">{b.guest_email}</p>
                      </td>
                      <td className="p-4 font-semibold text-slate-200">{b.hotel_name || 'Taj Exotica Resort'}</td>
                      <td className="p-4 text-slate-400">{b.check_in} to {b.check_out}</td>
                      <td className="p-4 font-black text-emerald-400">₹{Number(b.total_price).toLocaleString('en-IN')}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                          b.status === 'CANCELLED' ? 'bg-rose-900/60 text-rose-300' : 'bg-emerald-900/60 text-emerald-300'
                        }`}>
                          {b.status || 'CONFIRMED'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MODAL: ADMIN CREATES VENDOR ACCOUNT */}
        {showAddVendorModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-800 text-white rounded-3xl max-w-md w-full p-6 border border-slate-700 shadow-2xl">
              <h3 className="text-lg font-black text-emerald-400 mb-1">Create Hotel Partner / Vendor Account</h3>
              <p className="text-xs text-slate-400 mb-4">Set up login credentials for property owners to manage inventory</p>

              <form onSubmit={handleCreateVendorSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Vendor Manager Name *</label>
                  <input 
                    type="text"
                    required
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                    placeholder="e.g. Ramesh Shah"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs font-bold text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Vendor Login Email *</label>
                  <input 
                    type="email"
                    required
                    value={vendorEmail}
                    onChange={(e) => setVendorEmail(e.target.value)}
                    placeholder="vendor@hoteldomain.com"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs font-bold text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Vendor Contact Phone</label>
                  <input 
                    type="tel"
                    value={vendorPhone}
                    onChange={(e) => setVendorPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs font-bold text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Assign Hotel Property *</label>
                  <select 
                    value={vendorHotelId}
                    onChange={(e) => setVendorHotelId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs font-bold text-white"
                  >
                    {hotels.map(h => (
                      <option key={h.id} value={h.id}>{h.name} ({h.city})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Set Account Password *</label>
                  <input 
                    type="text"
                    required
                    value={vendorPassword}
                    onChange={(e) => setVendorPassword(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs font-mono font-bold text-white"
                  />
                </div>

                <div className="flex gap-2 pt-3">
                  <button 
                    type="button"
                    onClick={() => setShowAddVendorModal(false)}
                    className="flex-1 bg-slate-700 text-slate-300 font-bold text-xs py-3 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isCreatingVendor}
                    className="flex-1 bg-emerald-500 text-slate-950 font-black text-xs py-3 rounded-xl hover:bg-emerald-400"
                  >
                    {isCreatingVendor ? 'Creating...' : 'Create Vendor Account'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
