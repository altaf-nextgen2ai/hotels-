from datetime import date

from django.test import TestCase
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from django.core import mail
from django.test import override_settings
from unittest.mock import patch
from rest_framework.test import APIClient

from .models import Booking, Coupon, Hotel, Room, UserProfile
from .services import pdf_service


class AdminSuperuserLoginTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_superuser_can_log_in_to_admin_portal(self):
        User = get_user_model()
        User.objects.create_superuser(
            username='root-admin',
            email='root-admin@example.com',
            password='strong-test-password',
        )

        response = self.client.post('/api/auth/login/', {
            'username': 'root-admin',
            'password': 'strong-test-password',
        }, format='json')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['user']['role'], 'ADMIN')
        self.assertTrue(response.data['token'])
        self.assertTrue(UserProfile.objects.get(email='root-admin@example.com').is_email_verified)

    def test_superuser_without_email_cannot_log_in(self):
        User = get_user_model()
        User.objects.create_superuser(
            username='root-admin',
            email='',
            password='strong-test-password',
        )

        response = self.client.post('/api/auth/login/', {
            'username': 'root-admin',
            'password': 'strong-test-password',
        }, format='json')

        self.assertEqual(response.status_code, 400)
        self.assertIn('email address', response.data['error'])

    def test_customer_can_still_log_in_with_email(self):
        UserProfile.objects.create(
            name='Test Customer',
            email='customer@example.com',
            password=make_password('customer-password'),
            is_email_verified=True,
        )

        response = self.client.post('/api/auth/login/', {
            'email': 'customer@example.com',
            'password': 'customer-password',
        }, format='json')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['user']['role'], 'CUSTOMER')
        self.assertTrue(response.data['token'])
        self.assertEqual(
            UserProfile.objects.get(email='customer@example.com').auth_token,
            response.data['token'],
        )


class AdminUserProfilesViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = UserProfile.objects.create(
            name='Review Admin',
            email='users-admin@example.com',
            password=make_password('admin-password'),
            role='ADMIN',
            is_email_verified=True,
            auth_token='users-admin-token',
        )
        UserProfile.objects.create(
            name='Guest User',
            email='guest@example.com',
            phone='8447151225',
            password=make_password('guest-password'),
            role='CUSTOMER',
            is_email_verified=True,
        )

    def test_admin_can_list_platform_user_profiles(self):
        self.client.credentials(HTTP_AUTHORIZATION='Bearer users-admin-token')
        response = self.client.get('/api/admin/users/')
        self.assertEqual(response.status_code, 200)
        emails = [item['email'] for item in response.data]
        self.assertIn('guest@example.com', emails)
        guest = next(item for item in response.data if item['email'] == 'guest@example.com')
        self.assertEqual(guest['name'], 'Guest User')
        self.assertEqual(guest['phone'], '8447151225')
        self.assertEqual(guest['role'], 'CUSTOMER')
        self.assertEqual(guest['booking_count'], 0)
        self.assertNotIn('password', guest)
        self.assertNotIn('auth_token', guest)

    def test_customer_cannot_list_user_profiles(self):
        UserProfile.objects.create(
            name='No Access',
            email='no-access@example.com',
            password=make_password('x'),
            role='CUSTOMER',
            is_email_verified=True,
            auth_token='customer-token',
        )
        self.client.credentials(HTTP_AUTHORIZATION='Bearer customer-token')
        response = self.client.get('/api/admin/users/')
        self.assertEqual(response.status_code, 403)


class ActiveCouponListViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_public_list_only_includes_active_admin_created_coupons(self):
        Coupon.objects.create(
            code='SEEDED',
            discount_percent=10,
            is_active=True,
        )
        Coupon.objects.create(
            code='INACTIVE',
            discount_percent=15,
            is_active=False,
            is_admin_created=True,
        )
        Coupon.objects.create(
            code='ADMINACTIVE',
            discount_percent=20,
            is_active=True,
            is_admin_created=True,
        )

        response = self.client.get('/api/coupons/active/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual([coupon['code'] for coupon in response.data], ['ADMINACTIVE'])

    def test_admin_created_coupon_is_marked_for_public_display(self):
        admin = UserProfile.objects.create(
            name='Test Admin',
            email='admin-test@example.com',
            password='test-password',
            role='ADMIN',
            is_email_verified=True,
            auth_token='admin-test-token',
        )
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {admin.auth_token}')

        response = self.client.post('/api/admin/coupons/', {
            'code': 'NEWADMIN',
            'discount_percent': 15,
            'max_discount': 1000,
            'min_order': 5000,
            'is_active': True,
        }, format='json')

        self.assertEqual(response.status_code, 201)
        self.assertTrue(Coupon.objects.get(code='NEWADMIN').is_admin_created)


@override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
class VendorApplicationEmailTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_application_notifies_vendor_and_admin_and_approval_emails_vendor(self):
        User = get_user_model()
        User.objects.create_superuser(
            username='review-admin',
            email='review-admin@example.com',
            password='strong-test-password',
        )
        admin = UserProfile.objects.create(
            name='Review Admin',
            email='review-admin@example.com',
            password=make_password('unused-admin-password'),
            role='ADMIN',
            is_email_verified=True,
            auth_token='review-admin-token',
        )

        response = self.client.post('/api/auth/create-vendor/', {
            'name': 'Taylor Vendor',
            'email': 'taylor@example.com',
            'phone': '+1 555 0100',
            'password': 'vendor-private-password',
            'hotel_name': 'Pine View Hotel',
            'city': 'Lansdowne',
            'address': '12 Hill Road',
            'total_rooms': 24,
        }, format='json')

        self.assertEqual(response.status_code, 201)
        vendor = UserProfile.objects.get(email='taylor@example.com')
        self.assertEqual(vendor.application_total_rooms, 24)
        self.assertNotIn('password', response.data['vendor'])
        self.assertEqual(len(mail.outbox), 2)
        self.assertIn('received your application', mail.outbox[0].body)
        self.assertIn('review-admin@example.com', mail.outbox[1].to)
        for field in ('Taylor Vendor', 'taylor@example.com', 'Pine View Hotel', 'Lansdowne', '12 Hill Road', '24'):
            self.assertIn(field, mail.outbox[1].body)
        self.assertNotIn('vendor-private-password', mail.outbox[0].body + mail.outbox[1].body)

        self.client.credentials(HTTP_AUTHORIZATION='Bearer review-admin-token')
        vendor_list = self.client.get('/api/admin/vendors/')
        self.assertEqual(vendor_list.status_code, 200)
        applicant = next(item for item in vendor_list.data if item['email'] == 'taylor@example.com')
        self.assertEqual(applicant['application_hotel_name'], 'Pine View Hotel')
        self.assertEqual(applicant['application_total_rooms'], 24)
        self.assertNotIn('password', applicant)

        approval = self.client.post(
            f'/api/admin/vendors/{vendor.id}/status/',
            {'status': 'APPROVED'},
            format='json',
        )
        self.assertEqual(approval.status_code, 200)
        self.assertEqual(len(mail.outbox), 3)
        self.assertIn('approved', mail.outbox[2].subject.lower())
        self.assertIn('Login email: taylor@example.com', mail.outbox[2].body)
        self.assertIn('Partner Portal', mail.outbox[2].body)
        self.assertNotIn('vendor-private-password', mail.outbox[2].body)


@override_settings(
    EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend',
    ADMIN_NOTIFICATION_EMAIL='booking-admin@example.com',
)
class RazorpayBookingCreationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = UserProfile.objects.create(
            name='Booking Customer',
            email='booking-customer@example.com',
            password=make_password('customer-password'),
            is_email_verified=True,
            auth_token='booking-customer-token',
        )
        self.hotel = Hotel.objects.create(
            name='Test Hotel',
            city='Bangalore',
            destination='Bangalore',
            address='1 Test Street',
            price_per_night=1000,
            original_price=1200,
            main_image='https://example.com/hotel.jpg',
            description='Test property',
        )
        self.room = Room.objects.create(
            hotel=self.hotel,
            room_type='Deluxe Suite',
            price_per_night=1000,
        )
        self.client.credentials(HTTP_AUTHORIZATION='Bearer booking-customer-token')

    @patch('api.views.razorpay_client.utility.verify_payment_signature')
    def test_verified_payment_creates_booking_using_checkout_phone(self, verify_signature):
        UserProfile.objects.create(
            name='Hotel Partner',
            email='hotel-partner@example.com',
            password=make_password('vendor-password'),
            role='VENDOR',
            vendor_status='APPROVED',
            is_email_verified=True,
            application_hotel_name=self.hotel.name,
            application_city=self.hotel.city,
        )
        User = get_user_model()
        User.objects.create_superuser(
            username='booking-admin',
            email='booking-admin@example.com',
            password='strong-test-password',
        )
        UserProfile.objects.create(
            name='Booking Admin',
            email='booking-admin@example.com',
            password=make_password('admin-password'),
            role='ADMIN',
            is_email_verified=True,
        )

        response = self.client.post('/api/payments/verify/', {
            'razorpay_order_id': 'order_test',
            'razorpay_payment_id': 'pay_test',
            'razorpay_signature': 'valid-test-signature',
            'booking_payload': {
                'hotel': self.hotel.id,
                'room': self.room.id,
                'check_in': '2027-01-10',
                'check_out': '2027-01-11',
                'rooms_count': 1,
                'guests_count': 2,
                'total_price': 1180,
                'guest_name': 'Booking Customer',
                'guest_email': 'booking-customer@example.com',
                'guest_phone': '+1 555 0100',
            },
        }, format='json')

        self.assertEqual(response.status_code, 201, response.data)
        booking = Booking.objects.get(razorpay_payment_id='pay_test')
        self.assertEqual(booking.guest_phone, '+1 555 0100')
        self.assertEqual(booking.payment_mode, 'CARD')
        self.assertEqual(booking.payment_status, 'SUCCESS')
        self.assertEqual(response.data['email_notifications'], {
            'guest': True,
            'vendor_count': 1,
            'vendor_failed_count': 0,
            'admin_count': 1,
            'admin_failed_count': 0,
        })
        self.assertEqual(len(mail.outbox), 3)
        recipients = {message.to[0] for message in mail.outbox}
        self.assertEqual(recipients, {
            'booking-customer@example.com',
            'hotel-partner@example.com',
            'booking-admin@example.com',
        })
        guest_email = next(message for message in mail.outbox if message.to == ['booking-customer@example.com'])
        self.assertTrue(guest_email.attachments)
        voucher_pdf = guest_email.attachments[0][1]
        self.assertTrue(voucher_pdf.startswith(b'%PDF'))
        if pdf_service.CURRENCY_BOLD_FONT:
            self.assertIn(b'/FontFile2', voucher_pdf)
        self.assertIn('Your booking is confirmed.', guest_email.body)
        self.assertIn('Amount paid: ₹1,180', guest_email.body)
        self.assertIn('Call or WhatsApp us at 8447151225', guest_email.body)
        self.assertNotIn('1800-270-0297', guest_email.body)
        self.assertNotIn('8470009000', guest_email.body)
        verify_signature.assert_called_once()

    def test_direct_booking_creation_is_not_allowed_without_verified_payment(self):
        response = self.client.post('/api/bookings/', {}, format='json')

        self.assertEqual(response.status_code, 405)
        self.assertEqual(Booking.objects.count(), 0)

    def create_paid_booking(self, booking_id='TMT-CANCEL-1001', check_in='2027-01-10'):
        return Booking.objects.create(
            booking_id=booking_id,
            guest_name=self.user.name,
            guest_email=self.user.email,
            guest_phone='+1 555 0100',
            user=self.user,
            hotel=self.hotel,
            room=self.room,
            check_in=check_in,
            check_out='2027-01-11',
            total_price=1180,
            payment_mode='CARD',
            payment_status='SUCCESS',
            razorpay_payment_id='pay_cancel_test',
        )

    @patch('api.views.razorpay_client.payment.refund')
    def test_customer_cancellation_queues_manual_refund_and_notifies_all_parties(self, refund_payment):
        booking = self.create_paid_booking()
        UserProfile.objects.create(
            name='Hotel Partner',
            email='hotel-partner@example.com',
            password=make_password('vendor-password'),
            role='VENDOR',
            vendor_status='APPROVED',
            is_email_verified=True,
            auth_token='hotel-partner-token',
            hotel=self.hotel,
        )
        UserProfile.objects.create(
            name='Booking Admin',
            email='booking-admin@example.com',
            password=make_password('admin-password'),
            role='ADMIN',
            is_email_verified=True,
            auth_token='booking-admin-token',
        )
        quote = self.client.get(f'/api/bookings/{booking.booking_id}/cancel/')
        self.assertEqual(quote.status_code, 200)
        self.assertEqual(quote.data['refund_amount'], 1062)
        self.assertEqual(quote.data['cancellation_fee'], 118)

        response = self.client.post(f'/api/bookings/{booking.booking_id}/cancel/', {}, format='json')

        self.assertEqual(response.status_code, 200)
        refund_payment.assert_not_called()
        booking.refresh_from_db()
        self.assertEqual(booking.status, 'CUSTOMER_CANCELLED')
        self.assertEqual(booking.refund_amount, 1062)
        self.assertEqual(booking.cancellation_fee, 118)
        self.assertEqual(booking.refund_status, 'PENDING')
        self.assertEqual(booking.payment_status, 'REFUND_PENDING')
        self.assertEqual(booking.payout_status, 'VOIDED')
        self.assertEqual(response.data['refund_estimated_days'], '2 to 5 working days')
        self.assertEqual(response.data['email_notifications']['guest'], True)
        self.assertEqual(response.data['email_notifications']['vendor_count'], 1)
        self.assertEqual(response.data['email_notifications']['admin_count'], 1)
        self.assertEqual(len(mail.outbox), 3)
        guest_email = next(message for message in mail.outbox if message.to == [self.user.email])
        self.assertIn('Cancellation fee: ₹118', guest_email.body)
        self.assertIn('Refund of ₹1,062', guest_email.body)
        self.assertIn('10% cancellation fee', guest_email.body)
        self.assertIn('2 to 5 working days', guest_email.body)

        duplicate_response = self.client.post(f'/api/bookings/{booking.booking_id}/cancel/', {}, format='json')
        self.assertEqual(duplicate_response.status_code, 200)
        refund_payment.assert_not_called()

        self.client.credentials(HTTP_AUTHORIZATION='Bearer hotel-partner-token')
        vendor_bookings = self.client.get('/api/bookings/')
        self.assertEqual(vendor_bookings.status_code, 200)
        self.assertEqual(vendor_bookings.data[0]['status'], 'CUSTOMER_CANCELLED')
        self.assertEqual(vendor_bookings.data[0]['refund_amount'], 1062)
        self.client.credentials(HTTP_AUTHORIZATION='Bearer booking-admin-token')
        admin_bookings = self.client.get('/api/admin/bookings/')
        self.assertEqual(admin_bookings.status_code, 200)
        self.assertEqual(admin_bookings.data[0]['status'], 'CUSTOMER_CANCELLED')
        self.client.credentials(HTTP_AUTHORIZATION='Bearer booking-admin-token')
        processed = self.client.post(
            f'/api/admin/bookings/{booking.booking_id}/refund/',
            {'refund_reference': 'manual-rfnd-123'},
            format='json',
        )
        self.assertEqual(processed.status_code, 200)
        booking.refresh_from_db()
        self.assertEqual(booking.refund_status, 'PROCESSED')
        self.assertEqual(booking.payment_status, 'PARTIALLY_REFUNDED')
        self.assertEqual(booking.refund_reference, 'manual-rfnd-123')
        self.assertTrue(processed.data['email_sent'])
        self.assertEqual(len(mail.outbox), 4)
        self.assertIn('Refund processed', mail.outbox[-1].subject)
        duplicate_processed = self.client.post(
            f'/api/admin/bookings/{booking.booking_id}/refund/',
            {'refund_reference': 'manual-rfnd-456'},
            format='json',
        )
        self.assertEqual(duplicate_processed.status_code, 409)

    @patch('api.views.razorpay_client.payment.refund')
    @patch('api.views.timezone.localdate', return_value=date(2027, 1, 10))
    def test_same_day_cancellation_applies_ten_percent_fee_and_ninety_percent_refund(self, localdate, refund_payment):
        booking = self.create_paid_booking(booking_id='TMT-CANCEL-1002')

        response = self.client.post(f'/api/bookings/{booking.booking_id}/cancel/', {}, format='json')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['refund_amount'], 1062)
        self.assertEqual(response.data['cancellation_fee'], 118)
        self.assertEqual(response.data['refund_estimated_days'], '2 to 5 working days')
        refund_payment.assert_not_called()
        booking.refresh_from_db()
        self.assertEqual(booking.status, 'CUSTOMER_CANCELLED')
        self.assertEqual(booking.refund_status, 'PENDING')
        self.assertEqual(booking.payout_status, 'VOIDED')

    @patch('api.views.razorpay_client.payment.refund', side_effect=RuntimeError('must not call provider'))
    def test_refund_is_queued_for_manual_admin_processing_without_gateway_call(self, refund_payment):
        booking = self.create_paid_booking(booking_id='TMT-CANCEL-1003')

        response = self.client.post(f'/api/bookings/{booking.booking_id}/cancel/', {}, format='json')

        self.assertEqual(response.status_code, 200)
        booking.refresh_from_db()
        self.assertEqual(booking.status, 'CUSTOMER_CANCELLED')
        self.assertEqual(booking.refund_status, 'PENDING')
        retry = self.client.post(f'/api/bookings/{booking.booking_id}/cancel/', {}, format='json')
        self.assertEqual(retry.status_code, 200)
        refund_payment.assert_not_called()

    def test_cancellation_requires_authenticated_booking_owner(self):
        booking = self.create_paid_booking(booking_id='TMT-CANCEL-1004')
        self.client.credentials()

        response = self.client.post(f'/api/bookings/{booking.booking_id}/cancel/', {}, format='json')

        self.assertEqual(response.status_code, 401)
        booking.refresh_from_db()
        self.assertEqual(booking.status, 'CONFIRMED')

    @patch('api.views.razorpay_client.payment.refund')
    def test_partner_cancellation_queues_manual_full_refund_and_notifies_guest(self, refund_payment):
        booking = self.create_paid_booking(booking_id='TMT-CANCEL-1005')
        UserProfile.objects.create(
            name='Hotel Partner',
            email='hotel-partner@example.com',
            password=make_password('vendor-password'),
            role='VENDOR',
            vendor_status='APPROVED',
            is_email_verified=True,
            auth_token='hotel-partner-token',
            hotel=self.hotel,
        )
        self.client.credentials(HTTP_AUTHORIZATION='Bearer hotel-partner-token')

        response = self.client.post(
            f'/api/partner/bookings/{booking.booking_id}/status/',
            {'status': 'PARTNER_CANCELLED'},
            format='json',
        )

        self.assertEqual(response.status_code, 200, response.data)
        refund_payment.assert_not_called()
        booking.refresh_from_db()
        self.assertEqual(booking.status, 'PARTNER_CANCELLED')
        self.assertEqual(booking.refund_amount, 1180)
        self.assertEqual(booking.cancellation_fee, 0)
        self.assertEqual(booking.refund_status, 'PENDING')
        self.assertEqual(booking.payout_status, 'VOIDED')
        guest_email = next(message for message in mail.outbox if message.to == [self.user.email])
        self.assertIn('Full refund of ₹1,180', guest_email.body)


class PartnerHotelRegisterTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.vendor = UserProfile.objects.create(
            name='Approved Partner',
            email='approved-partner@example.com',
            password=make_password('vendor-password'),
            role='VENDOR',
            vendor_status='APPROVED',
            is_email_verified=True,
            auth_token='approved-partner-token',
        )
        self.client.credentials(HTTP_AUTHORIZATION='Bearer approved-partner-token')

    def test_approved_vendor_can_register_hotel_when_original_price_is_blank(self):
        response = self.client.post('/api/partner/hotels/', {
            'name': 'Sea View Inn',
            'city': 'Goa',
            'address': 'Calangute Beach Road',
            'price_per_night': '4500',
            'original_price': '',
            'star_rating': '4',
            'main_image': 'data:image/png;base64,aaa',
            'amenities': ['WiFi'],
        }, format='json')

        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(response.data['original_price'], 4500)
        self.assertEqual(response.data['owner'], self.vendor.id)
        self.assertTrue(Hotel.objects.filter(name='Sea View Inn', owner=self.vendor).exists())
