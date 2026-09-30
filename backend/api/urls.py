from django.urls import path
from .views import (
    HotelListView, HotelDetailView, BookingListCreateView, 
    BookingCancelView, ValidateCouponView, AdminAnalyticsView, 
    AdminHotelManageView, PartnerRatesView, PartnerRoomManageView,
    PartnerBookingStatusView, PartnerAnalyticsView, AdminPayoutsView,
    SignupView, VerifySignupView, LoginView, CreateVendorView, ListVendorsView, AdminVendorStatusView
)

urlpatterns = [
    path('auth/signup/', SignupView.as_view(), name='auth-signup'),
    path('auth/verify-signup/', VerifySignupView.as_view(), name='auth-verify-signup'),
    path('auth/login/', LoginView.as_view(), name='auth-login'),
    path('auth/create-vendor/', CreateVendorView.as_view(), name='auth-create-vendor'),
    path('auth/vendors/', ListVendorsView.as_view(), name='auth-vendors'),
    path('admin/vendors/<int:pk>/status/', AdminVendorStatusView.as_view(), name='admin-vendor-status'),
    path('hotels/', HotelListView.as_view(), name='hotel-list'),
    path('hotels/<int:pk>/', HotelDetailView.as_view(), name='hotel-detail'),
    path('bookings/', BookingListCreateView.as_view(), name='booking-list-create'),
    path('bookings/<str:booking_id>/cancel/', BookingCancelView.as_view(), name='booking-cancel'),
    path('coupons/validate/', ValidateCouponView.as_view(), name='coupon-validate'),
    path('admin/analytics/', AdminAnalyticsView.as_view(), name='admin-analytics'),
    path('admin/hotels/', AdminHotelManageView.as_view(), name='admin-hotel-create'),
    path('admin/hotels/<int:pk>/', AdminHotelManageView.as_view(), name='admin-hotel-update'),
    path('admin/payouts/', AdminPayoutsView.as_view(), name='admin-payouts'),
    path('partner/update-rates/', PartnerRatesView.as_view(), name='partner-update-rates'),
    path('partner/rooms/', PartnerRoomManageView.as_view(), name='partner-room-create'),
    path('partner/rooms/<int:pk>/', PartnerRoomManageView.as_view(), name='partner-room-update'),
    path('partner/bookings/<str:booking_id>/status/', PartnerBookingStatusView.as_view(), name='partner-booking-status'),
    path('partner/analytics/', PartnerAnalyticsView.as_view(), name='partner-analytics'),
]

