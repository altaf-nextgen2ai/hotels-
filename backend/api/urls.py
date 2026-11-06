from django.urls import path
from .views import (
    HotelListView, HotelDetailView, BookingListCreateView, 
    BookingCancelView, ValidateCouponView, ActiveCouponListView, AdminAnalyticsView,
    AdminHotelManageView, AdminVendorManageView, AdminBookingManageView, AdminManualRefundView,
    AdminCouponManageView,     PartnerRatesView, PartnerRoomManageView,
    PartnerBookingStatusView, PartnerAnalyticsView, AdminPayoutsView, PartnerHotelRegisterView, PartnerHotelDetailView,
    SignupView, VerifySignupView, LoginView, CreateVendorView, ListVendorsView, AdminVendorStatusView,
    RazorpayCreateOrderView, RazorpayVerifyPaymentView, AdminCommissionSettingsView,
    GoogleAuthView, BookingVoucherView, AdminResendVoucherView,
)

urlpatterns = [
    # Auth
    path('auth/signup/', SignupView.as_view(), name='auth-signup'),
    path('auth/verify-signup/', VerifySignupView.as_view(), name='auth-verify-signup'),
    path('auth/login/', LoginView.as_view(), name='auth-login'),
    path('auth/google/', GoogleAuthView.as_view(), name='auth-google'),
    path('auth/create-vendor/', CreateVendorView.as_view(), name='auth-create-vendor'),
    path('auth/vendors/', ListVendorsView.as_view(), name='auth-vendors'),

    # Admin
    path('admin/vendors/<int:pk>/status/', AdminVendorStatusView.as_view(), name='admin-vendor-status'),
    path('admin/vendors/', AdminVendorManageView.as_view(), name='admin-vendor-list-create'),
    path('admin/vendors/<int:pk>/', AdminVendorManageView.as_view(), name='admin-vendor-update-delete'),
    path('admin/analytics/', AdminAnalyticsView.as_view(), name='admin-analytics'),
    path('admin/hotels/', AdminHotelManageView.as_view(), name='admin-hotel-create'),
    path('admin/hotels/<int:pk>/', AdminHotelManageView.as_view(), name='admin-hotel-update-delete'),
    path('admin/bookings/', AdminBookingManageView.as_view(), name='admin-booking-list'),
    path('admin/bookings/<str:booking_id>/', AdminBookingManageView.as_view(), name='admin-booking-update'),
    path('admin/bookings/<str:booking_id>/refund/', AdminManualRefundView.as_view(), name='admin-manual-refund'),
    path('admin/coupons/', AdminCouponManageView.as_view(), name='admin-coupon-list-create'),
    path('admin/coupons/<int:pk>/', AdminCouponManageView.as_view(), name='admin-coupon-update-delete'),
    path('admin/payouts/', AdminPayoutsView.as_view(), name='admin-payouts'),
    path('admin/commission/', AdminCommissionSettingsView.as_view(), name='admin-commission'),

    # Hotels & Bookings
    path('hotels/', HotelListView.as_view(), name='hotel-list'),
    path('hotels/<int:pk>/', HotelDetailView.as_view(), name='hotel-detail'),
    path('bookings/', BookingListCreateView.as_view(), name='booking-list-create'),
    path('bookings/<str:booking_id>/cancel/', BookingCancelView.as_view(), name='booking-cancel'),
    path('coupons/validate/', ValidateCouponView.as_view(), name='coupon-validate'),
    path('coupons/active/', ActiveCouponListView.as_view(), name='active-coupon-list'),

    # Partner
    path('partner/hotels/', PartnerHotelRegisterView.as_view(), name='partner-hotel-register'),
    path('partner/hotels/<int:pk>/', PartnerHotelDetailView.as_view(), name='partner-hotel-delete'),
    path('partner/update-rates/', PartnerRatesView.as_view(), name='partner-update-rates'),
    path('partner/rooms/', PartnerRoomManageView.as_view(), name='partner-room-create'),
    path('partner/rooms/<int:pk>/', PartnerRoomManageView.as_view(), name='partner-room-update'),
    path('partner/bookings/<str:booking_id>/status/', PartnerBookingStatusView.as_view(), name='partner-booking-status'),
    path('partner/analytics/', PartnerAnalyticsView.as_view(), name='partner-analytics'),

    # Razorpay Payment Gateway
    path('payments/create-order/', RazorpayCreateOrderView.as_view(), name='razorpay-create-order'),
    path('payments/verify/', RazorpayVerifyPaymentView.as_view(), name='razorpay-verify-payment'),

    # Booking Voucher PDF download (customer)
    path('bookings/voucher/<str:booking_id>/', BookingVoucherView.as_view(), name='booking-voucher'),

    # Admin: resend confirmation email
    path('admin/resend-voucher/<str:booking_id>/', AdminResendVoucherView.as_view(), name='admin-resend-voucher'),
]
