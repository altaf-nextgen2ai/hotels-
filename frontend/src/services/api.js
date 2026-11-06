const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

const authHeaders = (extra = {}) => ({
  Authorization: `Bearer ${localStorage.getItem('trumitrip_token') || ''}`,
  ...extra,
});

const adminRequest = async (path, { method = 'GET', body } = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${localStorage.getItem('trumitrip_token') || ''}`,
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {})
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {})
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return { error: data.error || `Request failed (${response.status})` };
    return data;
  } catch (error) {
    console.warn(`Admin API Error (${path}):`, error);
    return { error: 'Backend unavailable. Please start the Django server and try again.' };
  }
};

export const apiService = {
  // Authentication APIs
  async login(identifier, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: identifier, username: identifier, password })
      });
      const data = await response.json();
      if (!response.ok) return { error: data.error || 'Login failed' };
      if (!data.token) return { error: 'Login succeeded but no session token was returned. Please try again.' };
      localStorage.setItem('trumitrip_token', data.token);
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
      return { error: 'Backend unavailable. Please try submitting your application again.' };
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

      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to fetch hotels');
      return await response.json();
    } catch (error) {
      console.warn('API Error (getHotels), falling back:', error);
      return null;
    }
  },

  async getActiveCoupons() {
    try {
      const response = await fetch(`${API_BASE_URL}/coupons/active/`);
      if (!response.ok) throw new Error('Failed to fetch active coupons');
      return await response.json();
    } catch (error) {
      console.warn('API Error (getActiveCoupons):', error);
      return [];
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

  // Fetch user bookings
  async getBookings(email = '') {
    try {
      const response = await fetch(`${API_BASE_URL}/bookings/`, {
        headers: authHeaders(),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        return { error: data.error || `Failed to fetch bookings (${response.status}).`, status: response.status };
      }
      return await response.json();
    } catch (error) {
      console.warn('API Error (getBookings):', error);
      return null;
    }
  },

  // Cancel booking
  async cancelBooking(bookingId) {
    try {
      const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/cancel/`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) return { error: data.error || `Cancellation failed (${response.status}).`, status: response.status };
      return data;
    } catch (error) {
      console.warn('API Error (cancelBooking):', error);
      return { error: 'Could not reach the server. Your booking has not been cancelled.' };
    }
  },

  async getCancellationQuote(bookingId) {
    try {
      const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/cancel/`, {
        headers: authHeaders(),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) return { error: data.error || `Could not calculate cancellation (${response.status}).`, status: response.status };
      return data;
    } catch (error) {
      console.warn('API Error (getCancellationQuote):', error);
      return { error: 'Could not reach the server to calculate your cancellation refund.' };
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
    return adminRequest('/admin/analytics/');
  },

  async getAdminVendors() {
    return adminRequest('/admin/vendors/');
  },

  async getAdminUsers() {
    return adminRequest('/admin/users/');
  },

  async getAdminHotels() {
    return adminRequest('/admin/hotels/');
  },

  async getAdminBookings() {
    return adminRequest('/admin/bookings/');
  },

  async updateAdminBookingStatus(bookingId, status) {
    return adminRequest(`/admin/bookings/${encodeURIComponent(bookingId)}/`, {
      method: 'PATCH',
      body: { status }
    });
  },

  async markAdminRefundProcessed(bookingId, refundReference) {
    return adminRequest(`/admin/bookings/${encodeURIComponent(bookingId)}/refund/`, {
      method: 'POST',
      body: { refund_reference: refundReference }
    });
  },

  async retryAdminBookingEmails(bookingId) {
    return adminRequest(`/admin/resend-voucher/${encodeURIComponent(bookingId)}/`, {
      method: 'POST'
    });
  },

  async createAdminVendor(vendorData) {
    return adminRequest('/admin/vendors/', { method: 'POST', body: vendorData });
  },

  async updateAdminVendor(vendorId, vendorData) {
    return adminRequest(`/admin/vendors/${vendorId}/`, { method: 'PATCH', body: vendorData });
  },

  async removeAdminVendor(vendorId) {
    return adminRequest(`/admin/vendors/${vendorId}/`, { method: 'DELETE' });
  },

  async createAdminHotel(hotelData) {
    return adminRequest('/admin/hotels/', { method: 'POST', body: hotelData });
  },

  async updateAdminHotel(hotelId, hotelData) {
    return adminRequest(`/admin/hotels/${hotelId}/`, { method: 'PUT', body: hotelData });
  },

  async archiveAdminHotel(hotelId) {
    return adminRequest(`/admin/hotels/${hotelId}/`, { method: 'DELETE' });
  },

  async getAdminPayoutsSecure() {
    return adminRequest('/admin/payouts/');
  },

  async updateAdminPayoutSecure(bookingId, payoutStatus) {
    return adminRequest('/admin/payouts/', {
      method: 'POST',
      body: { booking_id: bookingId, payout_status: payoutStatus }
    });
  },

  async getAdminCouponsSecure() {
    return adminRequest('/admin/coupons/');
  },

  async getAdminCommissionsSecure() {
    return adminRequest('/admin/commission/');
  },

  async updateAdminCommissionSecure(hotelId, commissionPercent) {
    return adminRequest('/admin/commission/', {
      method: 'POST',
      body: { hotel_id: hotelId, commission_percent: commissionPercent }
    });
  },

  async createAdminCouponSecure(couponData) {
    return adminRequest('/admin/coupons/', { method: 'POST', body: couponData });
  },

  async updateAdminCouponSecure(couponId, couponData) {
    return adminRequest(`/admin/coupons/${couponId}/`, { method: 'PUT', body: couponData });
  },

  async removeAdminCoupon(couponId) {
    return adminRequest(`/admin/coupons/${couponId}/`, { method: 'DELETE' });
  },

  async updateAdminVendorStatus(vendorId, status) {
    return adminRequest(`/admin/vendors/${vendorId}/status/`, { method: 'POST', body: { status } });
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
  async getPartnerHotels() {
    try {
      const response = await fetch(`${API_BASE_URL}/partner/hotels/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('trumitrip_token') || ''}`,
        },
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        return { error: data?.error || `Could not load your properties (${response.status})` };
      }
      return data;
    } catch (error) {
      console.warn('API Error (getPartnerHotels):', error);
      return { error: 'Backend unavailable.' };
    }
  },

  async deletePartnerHotel(hotelId) {
    try {
      const response = await fetch(`${API_BASE_URL}/partner/hotels/${hotelId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('trumitrip_token') || ''}`,
        },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        return { error: data.error || `Remove failed (${response.status})` };
      }
      return data;
    } catch (error) {
      console.warn('API Error (deletePartnerHotel):', error);
      return { error: 'Backend unavailable.' };
    }
  },

  async createHotel(hotelData) {
    try {
      const response = await fetch(`${API_BASE_URL}/partner/hotels/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('trumitrip_token') || ''}`
        },
        body: JSON.stringify(hotelData)
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const details = data.details && typeof data.details === 'object'
          ? Object.entries(data.details)
              .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages[0] : messages}`)
              .join('; ')
          : '';
        return { error: data.error || details || `Registration failed (${response.status})` };
      }
      return data;
    } catch (error) {
      console.warn('API Error (createHotel):', error);
      return { error: 'Backend unavailable. Please start the Django server and try again.' };
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
        headers: authHeaders({ 'Content-Type': 'application/json' }),
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
  },

  // ── Razorpay Payment Gateway ──────────────────────────────────────────────

  // Step 1: Create a Razorpay order on the backend
  async createRazorpayOrder(totalPrice) {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/create-order/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('trumitrip_token') || ''}`
        },
        body: JSON.stringify({ total_price: totalPrice })
      });
      const data = await response.json();
      if (!response.ok) return { error: data.error || 'Failed to create Razorpay order' };
      return data; // { razorpay_order_id, amount, currency, key_id }
    } catch (error) {
      console.warn('API Error (createRazorpayOrder):', error);
      return { error: 'Backend unavailable. Please start the Django server and try again.' };
    }
  },

  // Step 2: Verify Razorpay payment signature and create booking
  async verifyRazorpayPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature, bookingPayload) {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/verify/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('trumitrip_token') || ''}`
        },
        body: JSON.stringify({
          razorpay_order_id: razorpayOrderId,
          razorpay_payment_id: razorpayPaymentId,
          razorpay_signature: razorpaySignature,
          booking_payload: bookingPayload,
        })
      });
      const data = await response.json();
      console.log('Verify API response status:', response.status, data);
      if (!response.ok) return { error: data.error || 'Payment verification failed', details: data.details || data };
      return data;
    } catch (error) {
      console.warn('API Error (verifyRazorpayPayment):', error);
      return { error: 'Backend unavailable. Please start the Django server and try again.' };
    }
  },

  // Get / update commission settings per hotel (Admin)
  async getCommissionSettings() {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/commission/`);
      if (!response.ok) throw new Error('Failed to fetch commission settings');
      return await response.json();
    } catch (error) {
      console.warn('API Error (getCommissionSettings):', error);
      return [];
    }
  },

  async updateCommission(hotelId, commissionPercent) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/commission/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotel_id: hotelId, commission_percent: commissionPercent })
      });
      return await response.json();
    } catch (error) {
      console.warn('API Error (updateCommission):', error);
      return null;
    }
  },

  // Google Sign-In — send the Google ID token, get back user + session token
  async googleLogin(credential) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/google/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential })
      });
      const data = await response.json();
      if (!response.ok) return { error: data.error || 'Google Sign-In failed' };
      if (!data.token) return { error: 'Google Sign-In succeeded but no session token was returned. Please try again.' };
      localStorage.setItem('trumitrip_token', data.token);
      return data; // { token, user: { id, name, email, role, ... } }
    } catch (error) {
      return { error: 'Backend unavailable. Please start the Django server and try again.' };
    }
  },

  // Download booking voucher PDF — triggers browser file download
  async downloadVoucher(bookingId) {
    try {
      const response = await fetch(`${API_BASE_URL}/bookings/voucher/${bookingId}/`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('trumitrip_token') || ''}` }
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        return { error: err.error || 'Could not download voucher.' };
      }
      // Convert response to blob and trigger download
      const blob = await response.blob();
      const url  = window.URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `Trumitrip_Voucher_${bookingId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      return { success: true };
    } catch (error) {
      console.warn('API Error (downloadVoucher):', error);
      return { error: 'Backend unavailable. Please start the Django server and try again.' };
    }
  }
};
