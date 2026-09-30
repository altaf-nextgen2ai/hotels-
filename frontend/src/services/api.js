const API_BASE_URL = 'http://127.0.0.1:8000/api';

export const apiService = {
  // Authentication APIs
  async login(email, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (!response.ok) return { error: data.error || 'Login failed' };
      if (data.token) localStorage.setItem('trumitrip_token', data.token);
      return data;
    } catch (error) {
      return { error: 'Backend unavailable. Please start the Django server and try again.' };
    }
  },

  async signup(name, email, phone, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/signup/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, password })
      });
      const data = await response.json();
      if (!response.ok) return { error: data.error || 'Registration failed' };
      return data;
    } catch (error) {
      return { error: 'Backend unavailable. Please start the Django server and try again.' };
    }
  },

  async verifySignup(email, otp) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-signup/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      const data = await response.json();
      return response.ok ? data : { error: data.error || 'Verification failed' };
    } catch (error) {
      return { error: 'Backend unavailable. Please start the Django server and try again.' };
    }
  },

  async createVendor(vendorData) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/create-vendor/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vendorData)
      });
      const data = await response.json();
      if (!response.ok) return { error: data.error || 'Failed to create vendor account' };
      return data;
    } catch (error) {
      console.warn('API Error (createVendor):', error);
      return { vendor: { id: Date.now(), ...vendorData, role: 'VENDOR' } };
    }
  },

  async getVendors() {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/vendors/`);
      if (!response.ok) throw new Error('Failed to fetch vendors');
      return await response.json();
    } catch (error) {
      console.warn('API Error (getVendors):', error);
      return [];
    }
  },

  // Fetch hotels with filters
  async getHotels(params = {}) {
    try {
      const url = new URL(`${API_BASE_URL}/hotels/`);
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          if (Array.isArray(params[key])) {
            params[key].forEach(val => url.searchParams.append(key, val));
          } else {
            url.searchParams.append(key, params[key]);
          }
        }
      });

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch hotels');
      return await response.json();
    } catch (error) {
      console.warn('API Error (getHotels), falling back:', error);
      return null;
    }
  },

  // Fetch single hotel detail
  async getHotelDetail(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/hotels/${id}/`);
      if (!response.ok) throw new Error('Failed to fetch hotel details');
      return await response.json();
    } catch (error) {
      console.warn('API Error (getHotelDetail):', error);
      return null;
    }
  },

  // Create booking
  async createBooking(bookingData) {
    try {
      const response = await fetch(`${API_BASE_URL}/bookings/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('trumitrip_token') || ''}` },
        body: JSON.stringify(bookingData)
      });
      if (!response.ok) throw new Error('Failed to create booking');
      return await response.json();
    } catch (error) {
      return null;
    }
  },

  // Fetch user bookings
  async getBookings(email = '') {
    try {
      const response = await fetch(`${API_BASE_URL}/bookings/`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('trumitrip_token') || ''}` }
      });
      if (!response.ok) throw new Error('Failed to fetch bookings');
      return await response.json();
    } catch (error) {
      return null;
    }
  },

  // Cancel booking
  async cancelBooking(bookingId) {
    try {
      const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/cancel/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to cancel booking');
      return await response.json();
    } catch (error) {
      console.warn('API Error (cancelBooking):', error);
      return null;
    }
  },

  // Validate coupon
  async validateCoupon(code, totalAmount) {
    try {
      const response = await fetch(`${API_BASE_URL}/coupons/validate/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, total_amount: totalAmount })
      });
      const data = await response.json();
      if (!response.ok) return { valid: false, message: data.message || 'Invalid coupon' };
      return data;
    } catch (error) {
      console.warn('API Error (validateCoupon):', error);
      const validCodes = {
        'TRUMI10': { percent: 10, max: 1500 },
        'LUXURY25': { percent: 25, max: 4000 },
        'WELCOME20': { percent: 20, max: 2500 }
      };
      const upper = code.toUpperCase();
      if (validCodes[upper]) {
        const disc = Math.min(Math.round(totalAmount * (validCodes[upper].percent / 100)), validCodes[upper].max);
        return { valid: true, code: upper, discount_amount: disc, message: `Coupon ${upper} applied! Saved ₹${disc}` };
      }
      return { valid: false, message: 'Invalid coupon code. Try TRUMI10 or LUXURY25' };
    }
  },

  // Admin analytics
  async getAdminAnalytics() {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/analytics/`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return await response.json();
    } catch (error) {
      console.warn('API Error (getAdminAnalytics):', error);
      return null;
    }
  },

  // Partner rate update
  async updatePartnerRates(updateData) {
    try {
      const response = await fetch(`${API_BASE_URL}/partner/update-rates/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      return await response.json();
    } catch (error) {
      console.warn('API Error (updatePartnerRates):', error);
      return null;
    }
  },

  // Create Hotel Property
  async createHotel(hotelData) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/hotels/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(hotelData)
      });
      return await response.json();
    } catch (error) {
      console.warn('API Error (createHotel):', error);
      return null;
    }
  },

  // Update Hotel Property
  async updateHotel(id, hotelData) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/hotels/${id}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(hotelData)
      });
      return await response.json();
    } catch (error) {
      console.warn('API Error (updateHotel):', error);
      return null;
    }
  },

  // Admin Vendor Status Approval
  async updateVendorStatus(vendorId, status) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/vendors/${vendorId}/status/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      return await response.json();
    } catch (error) {
      console.warn('API Error (updateVendorStatus):', error);
      return null;
    }
  },

  // Add Room for Partner Hotel
  async addRoom(roomData) {
    try {
      const response = await fetch(`${API_BASE_URL}/partner/rooms/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roomData)
      });
      return await response.json();
    } catch (error) {
      console.warn('API Error (addRoom):', error);
      return null;
    }
  },

  // Update Room Details for Partner Hotel
  async updateRoom(roomId, roomData) {
    try {
      const response = await fetch(`${API_BASE_URL}/partner/rooms/${roomId}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roomData)
      });
      return await response.json();
    } catch (error) {
      console.warn('API Error (updateRoom):', error);
      return null;
    }
  },

  // Update Booking Lifecycle Status (Partner)
  async updatePartnerBookingStatus(bookingId, status) {
    try {
      const response = await fetch(`${API_BASE_URL}/partner/bookings/${bookingId}/status/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      return await response.json();
    } catch (error) {
      console.warn('API Error (updatePartnerBookingStatus):', error);
      return null;
    }
  },

  // Fetch Partner Analytics & Commission Breakdown
  async getPartnerAnalytics(hotelId) {
    try {
      const url = hotelId ? `${API_BASE_URL}/partner/analytics/?hotel_id=${hotelId}` : `${API_BASE_URL}/partner/analytics/`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return await response.json();
    } catch (error) {
      console.warn('API Error (getPartnerAnalytics):', error);
      return null;
    }
  },

  // Fetch Admin Payouts List
  async getAdminPayouts() {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/payouts/`);
      if (!response.ok) throw new Error('Failed to fetch payouts');
      return await response.json();
    } catch (error) {
      console.warn('API Error (getAdminPayouts):', error);
      return [];
    }
  },

  // Update Payout Status (Admin)
  async updateAdminPayoutStatus(bookingId, payoutStatus) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/payouts/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: bookingId, payout_status: payoutStatus })
      });
      return await response.json();
    } catch (error) {
      console.warn('API Error (updateAdminPayoutStatus):', error);
      return null;
    }
  }
};

