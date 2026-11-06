import random
import string
import secrets
import hmac
import hashlib
import logging
from datetime import timedelta, date as date_type
from django.conf import settings
from django.contrib.auth import authenticate
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.core.validators import validate_email
from django.http import HttpResponse
from django.utils import timezone
from django.contrib.auth.hashers import check_password, make_password
from django.db import transaction
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics
from django.db.models import Q, Sum, Count, Prefetch
from django.db.models.functions import TruncMonth
from .models import Hotel, Room, Booking, Coupon, Review, UserProfile
from .serializers import (
    AdminUserListSerializer,
    HotelSerializer,
    PartnerHotelWriteSerializer,
    RoomSerializer,
    BookingSerializer,
    CouponSerializer,
    ReviewSerializer,
    UserProfileSerializer,
)
from .services.email_service import (
    send_booking_cancellation_notifications,
    send_booking_notifications,
    send_refund_processed_email,
    send_vendor_account_email,
    send_vendor_application_admin_email,
)
from .services.pdf_service import generate_booking_pdf

import razorpay
razorpay_client = razorpay.Client(
    auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
)
logger = logging.getLogger(__name__)

CUSTOMER_REFUND_ETA = '2 to 5 working days'
CUSTOMER_CANCELLATION_POLICY = (
    '10% cancellation fee applies; the remaining 90% is refunded to your original payment method '
    f'within {CUSTOMER_REFUND_ETA}.'
)


def _customer_cancellation_amounts(booking):
    """10% platform cancellation fee; 90% refund for paid bookings not yet checked in."""
    total = int(booking.total_price or 0)
    if booking.status in ('CHECKED_IN', 'COMPLETED'):
        return 0, total
    if booking.payment_status != 'SUCCESS':
        return 0, 0
    cancellation_fee = int(round(total * 0.10))
    refund_amount = max(total - cancellation_fee, 0)
    return refund_amount, cancellation_fee


def admin_access_error(request):
    token = request.headers.get('Authorization', '').removeprefix('Bearer ').strip()
    user = UserProfile.objects.filter(
        auth_token=token,
        is_email_verified=True
    ).first() if token else None
    if not user:
        return Response({"error": "Admin login required."}, status=status.HTTP_401_UNAUTHORIZED)
    if user.role != 'ADMIN':
        return Response({"error": "Administrator access required."}, status=status.HTTP_403_FORBIDDEN)
    return None


def partner_access_user(request):
    token = request.headers.get('Authorization', '').removeprefix('Bearer ').strip()
    user = UserProfile.objects.filter(
        auth_token=token,
        is_email_verified=True,
    ).first() if token else None
    if not user:
        return None, Response({"error": "Partner login required."}, status=status.HTTP_401_UNAUTHORIZED)
    if user.role != 'VENDOR':
        return None, Response({"error": "Hotel partner access required."}, status=status.HTTP_403_FORBIDDEN)
    if user.vendor_status != 'APPROVED':
        return None, Response({"error": "Your partner account is not approved yet."}, status=status.HTTP_403_FORBIDDEN)
    return user, None


def _seed_default_rooms(hotel):
    if hotel.rooms.exists():
        return
    Room.objects.create(
        hotel=hotel,
        room_type="Deluxe Suite",
        price_per_night=hotel.price_per_night,
        max_guests=2,
        bed_type="1 King Bed",
        available_count=8,
        total_rooms=10,
        blocked_rooms=0,
        status='ACTIVE',
        inclusions=["Breakfast Included", "Free High-Speed WiFi", "Swimming Pool Access"],
    )
    Room.objects.create(
        hotel=hotel,
        room_type="Executive Ocean Suite",
        price_per_night=int(hotel.price_per_night * 1.35),
        max_guests=3,
        bed_type="1 King Bed + Lounge",
        available_count=4,
        total_rooms=5,
        blocked_rooms=0,
        status='ACTIVE',
        inclusions=["Breakfast & Dinner Included", "Airport Private Transfer", "Spa & Sauna Access"],
    )


def _vendor_hotels_for_user(user):
    if user.role != 'VENDOR' or user.vendor_status != 'APPROVED':
        return Hotel.objects.none()
    owned = Hotel.objects.filter(owner=user)
    if owned.exists():
        return owned
    if user.hotel_id:
        return Hotel.objects.filter(pk=user.hotel_id)
    if user.application_hotel_name and user.application_city:
        return Hotel.objects.filter(
            name__iexact=user.application_hotel_name,
            city__iexact=user.application_city,
        )
    return Hotel.objects.none()

class SignupView(APIView):
    def post(self, request):
        name = request.data.get('name', '').strip()
        email = request.data.get('email', '').strip().lower()
        phone = request.data.get('phone', '').strip()
        password = request.data.get('password', '').strip()

        if not name or not email or not password:
            return Response({"error": "Name, email, and password are required."}, status=status.HTTP_400_BAD_REQUEST)

        otp = f'{random.randint(0, 999999):06d}'

        existing_user = UserProfile.objects.filter(email=email).first()
        if existing_user:
            if existing_user.is_email_verified:
                return Response({"error": "An account with this email already exists."}, status=status.HTTP_400_BAD_REQUEST)
            else:
                user = existing_user
                user.name = name
                user.phone = phone
                user.password = make_password(password)
                user.email_otp_hash = make_password(otp)
                user.email_otp_expires_at = timezone.now() + timedelta(minutes=10)
                user.save()
        else:
            user = UserProfile.objects.create(
                name=name,
                email=email,
                phone=phone,
                password=make_password(password),
                email_otp_hash=make_password(otp),
                email_otp_expires_at=timezone.now() + timedelta(minutes=10),
                role='CUSTOMER'
            )

        try:
            send_mail(
                'TRUMITRIP email verification code',
                f'Your TRUMITRIP verification code is {otp}. It expires in 10 minutes.',
                settings.DEFAULT_FROM_EMAIL,
                [email],
                fail_silently=False,
            )
        except Exception as e:
            print(f"Failed to send email to {email}: {e}")
            return Response({
                "error": f"Failed to send verification email: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        print(f"[SIGNUP OTP for {email}]: {otp}")

        return Response({
            "message": "Verification code sent to your email.",
            "email": email
        }, status=status.HTTP_201_CREATED)

class VerifySignupView(APIView):
    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        otp = request.data.get('otp', '').strip()
        try:
            user = UserProfile.objects.get(email=email)
        except UserProfile.DoesNotExist:
            return Response({"error": "Account not found."}, status=status.HTTP_404_NOT_FOUND)

        if user.is_email_verified:
            return Response({"error": "Email is already verified. Please login."}, status=status.HTTP_400_BAD_REQUEST)
        if not user.email_otp_expires_at or user.email_otp_expires_at < timezone.now():
            return Response({"error": "Verification code expired. Please sign up again."}, status=status.HTTP_400_BAD_REQUEST)
        if not check_password(otp, user.email_otp_hash):
            return Response({"error": "Invalid verification code."}, status=status.HTTP_400_BAD_REQUEST)

        user.is_email_verified = True
        user.email_otp_hash = ''
        user.email_otp_expires_at = None
        user.save(update_fields=['is_email_verified', 'email_otp_hash', 'email_otp_expires_at'])
        return Response({"message": "Email verified. You can now login."})

class LoginView(APIView):
    def post(self, request):
        username = request.data.get('username', request.data.get('email', '')).strip()
        email = request.data.get('email', username).strip().lower()
        password = request.data.get('password', '').strip()

        django_user = authenticate(request, username=username, password=password)
        if django_user and django_user.is_superuser:
            admin_email = django_user.email.strip().lower()
            if not admin_email:
                return Response(
                    {"error": "Set an email address on the Django superuser before logging in."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            admin_name = django_user.get_full_name().strip() or django_user.username
            admin_user, _ = UserProfile.objects.get_or_create(
                email=admin_email,
                defaults={
                    'name': admin_name,
                    'password': make_password(secrets.token_urlsafe(32)),
                    'role': 'ADMIN',
                    'is_email_verified': True,
                }
            )
            admin_user.name = admin_name
            admin_user.role = 'ADMIN'
            admin_user.auth_token = secrets.token_urlsafe(32)
            admin_user.is_email_verified = True
            admin_user.save(update_fields=['name', 'role', 'auth_token', 'is_email_verified'])
            serializer = UserProfileSerializer(admin_user)
            return Response({"user": serializer.data, "token": admin_user.auth_token, "message": "Admin Login Successful"})

        try:
            user = UserProfile.objects.get(email=email)
            if user.is_email_verified and check_password(password, user.password):
                user.auth_token = secrets.token_urlsafe(32)
                user.save(update_fields=['auth_token'])
                serializer = UserProfileSerializer(user)
                return Response({
                    "user": serializer.data,
                    "token": user.auth_token,
                    "message": f"Welcome back, {user.name}!"
                })
            elif not user.is_email_verified:
                return Response({"error": "Please verify your email before logging in."}, status=status.HTTP_403_FORBIDDEN)
            else:
                return Response({"error": "Invalid email or password."}, status=status.HTTP_400_BAD_REQUEST)
        except UserProfile.DoesNotExist:
            return Response({"error": "User profile not found. Please sign up first."}, status=status.HTTP_404_NOT_FOUND)

class CreateVendorView(APIView):
    def post(self, request):
        name = request.data.get('name', '').strip()
        email = request.data.get('email', '').strip().lower()
        phone = request.data.get('phone', '').strip()
        password = request.data.get('password', '').strip()
        hotel_name = request.data.get('hotel_name', '').strip()
        city = request.data.get('city', '').strip()
        address = request.data.get('address', '').strip()
        try:
            total_rooms = int(request.data.get('total_rooms') or 0)
        except (TypeError, ValueError):
            return Response({"error": "Total room capacity must be a whole number."}, status=status.HTTP_400_BAD_REQUEST)

        if not name or not email or not password or not hotel_name or not city:
            return Response({"error": "Name, email, password, hotel name, and city are required."}, status=status.HTTP_400_BAD_REQUEST)
        if total_rooms < 1:
            return Response({"error": "Total room capacity must be at least one."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            validate_email(email)
        except ValidationError:
            return Response({"error": "Enter a valid email address."}, status=status.HTTP_400_BAD_REQUEST)

        if UserProfile.objects.filter(email=email).exists():
            return Response({"error": "A user with this email already exists."}, status=status.HTTP_400_BAD_REQUEST)

        vendor = UserProfile.objects.create(
            name=name,
            email=email,
            phone=phone,
            password=make_password(password) if password else '',
            role='VENDOR',
            vendor_status='PENDING',
            is_email_verified=True,
            auth_token=secrets.token_hex(32),
            application_hotel_name=hotel_name,
            application_city=city,
            application_address=address,
            application_total_rooms=total_rooms,
        )

        serializer = UserProfileSerializer(vendor)
        send_vendor_account_email(vendor, 'PENDING')
        send_vendor_application_admin_email(vendor)
        return Response({
            "message": "Vendor application submitted successfully. Pending admin approval.",
            "token": vendor.auth_token,
            "vendor": serializer.data
        }, status=status.HTTP_201_CREATED)

class AdminUserProfilesView(APIView):
    def get(self, request):
        access_error = admin_access_error(request)
        if access_error:
            return access_error
        users = (
            UserProfile.objects.select_related('hotel')
            .prefetch_related(
                Prefetch(
                    'owned_hotels',
                    queryset=Hotel.objects.filter(is_active=True).order_by('-created_at'),
                )
            )
            .annotate(booking_count=Count('bookings'))
            .order_by('-created_at')
        )
        return Response(AdminUserListSerializer(users, many=True).data)


class ListVendorsView(APIView):
    def get(self, request):
        access_error = admin_access_error(request)
        if access_error:
            return access_error
        vendors = UserProfile.objects.filter(role='VENDOR').select_related('hotel').order_by('-created_at')
        serializer = UserProfileSerializer(vendors, many=True)
        return Response(serializer.data)

class AdminVendorStatusView(APIView):
    def post(self, request, pk):
        access_error = admin_access_error(request)
        if access_error:
            return access_error
        status_value = request.data.get('status', '').upper()
        if status_value not in ['APPROVED', 'REJECTED', 'PENDING']:
            return Response({"error": "Invalid status choice"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            vendor = UserProfile.objects.get(pk=pk, role='VENDOR')
            vendor.vendor_status = status_value
            vendor.save(update_fields=['vendor_status'])
            send_vendor_account_email(vendor, status_value)
            serializer = UserProfileSerializer(vendor)
            return Response({
                "message": f"Vendor '{vendor.name}' has been {status_value.lower()}.",
                "vendor": serializer.data
            })
        except UserProfile.DoesNotExist:
            return Response({"error": "Vendor record not found."}, status=status.HTTP_404_NOT_FOUND)

class AdminVendorManageView(APIView):
    def get(self, request):
        access_error = admin_access_error(request)
        if access_error:
            return access_error
        vendors = UserProfile.objects.filter(role='VENDOR').select_related('hotel').order_by('-created_at')
        return Response(UserProfileSerializer(vendors, many=True).data)

    def post(self, request):
        access_error = admin_access_error(request)
        if access_error:
            return access_error
        name = request.data.get('name', '').strip()
        email = request.data.get('email', '').strip().lower()
        phone = request.data.get('phone', '').strip()
        password = request.data.get('password', '')
        hotel_id = request.data.get('hotel') or request.data.get('hotel_id')
        vendor_status = request.data.get('vendor_status', 'APPROVED').upper()

        if not name or not email or not password:
            return Response({"error": "Name, email, and a temporary password are required."}, status=status.HTTP_400_BAD_REQUEST)
        if UserProfile.objects.filter(email=email).exists():
            return Response({"error": "An account with this email already exists."}, status=status.HTTP_400_BAD_REQUEST)
        if vendor_status not in ['PENDING', 'APPROVED', 'REJECTED']:
            return Response({"error": "Invalid vendor status."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            validate_email(email)
        except ValidationError:
            return Response({"error": "Enter a valid email address."}, status=status.HTTP_400_BAD_REQUEST)

        hotel = None
        if hotel_id not in (None, ''):
            try:
                hotel = Hotel.objects.get(pk=hotel_id)
            except (Hotel.DoesNotExist, ValueError, TypeError):
                return Response({"error": "Selected hotel was not found."}, status=status.HTTP_400_BAD_REQUEST)

        vendor = UserProfile.objects.create(
            name=name,
            email=email,
            phone=phone,
            password=make_password(password),
            role='VENDOR',
            vendor_status=vendor_status,
            is_email_verified=True,
            hotel=hotel,
        )
        send_vendor_account_email(vendor, vendor_status)
        return Response(UserProfileSerializer(vendor).data, status=status.HTTP_201_CREATED)

    def patch(self, request, pk):
        access_error = admin_access_error(request)
        if access_error:
            return access_error
        try:
            vendor = UserProfile.objects.select_related('hotel').get(pk=pk, role='VENDOR')
        except UserProfile.DoesNotExist:
            return Response({"error": "Vendor record not found."}, status=status.HTTP_404_NOT_FOUND)

        updates = {}
        previous_status = vendor.vendor_status
        for field in ('name', 'phone'):
            if field in request.data:
                value = request.data[field].strip()
                if field == 'name' and not value:
                    return Response({"error": "Vendor name cannot be empty."}, status=status.HTTP_400_BAD_REQUEST)
                updates[field] = value
        if 'email' in request.data:
            email = request.data['email'].strip().lower()
            if UserProfile.objects.filter(email=email).exclude(pk=vendor.pk).exists():
                return Response({"error": "An account with this email already exists."}, status=status.HTTP_400_BAD_REQUEST)
            try:
                validate_email(email)
            except ValidationError:
                return Response({"error": "Enter a valid email address."}, status=status.HTTP_400_BAD_REQUEST)
            updates['email'] = email
        if 'vendor_status' in request.data:
            vendor_status = request.data['vendor_status'].upper()
            if vendor_status not in ['PENDING', 'APPROVED', 'REJECTED']:
                return Response({"error": "Invalid vendor status."}, status=status.HTTP_400_BAD_REQUEST)
            updates['vendor_status'] = vendor_status
        if 'hotel' in request.data or 'hotel_id' in request.data:
            hotel_id = request.data.get('hotel', request.data.get('hotel_id'))
            if hotel_id in (None, ''):
                updates['hotel'] = None
            else:
                try:
                    updates['hotel'] = Hotel.objects.get(pk=hotel_id)
                except (Hotel.DoesNotExist, ValueError, TypeError):
                    return Response({"error": "Selected hotel was not found."}, status=status.HTTP_400_BAD_REQUEST)

        for field, value in updates.items():
            setattr(vendor, field, value)
        if updates:
            vendor.save(update_fields=list(updates))
            if 'vendor_status' in updates and updates['vendor_status'] != previous_status:
                send_vendor_account_email(vendor, vendor.vendor_status)
        return Response(UserProfileSerializer(vendor).data)

    def delete(self, request, pk):
        access_error = admin_access_error(request)
        if access_error:
            return access_error
        try:
            vendor = UserProfile.objects.get(pk=pk, role='VENDOR')
        except UserProfile.DoesNotExist:
            return Response({"error": "Vendor record not found."}, status=status.HTTP_404_NOT_FOUND)
        vendor.delete()
        return Response({"message": "Vendor account removed. Booking records have been retained."})

class AdminBookingManageView(APIView):
    def get(self, request):
        access_error = admin_access_error(request)
        if access_error:
            return access_error
        bookings = Booking.objects.select_related('hotel', 'room', 'user').order_by('-created_at')
        return Response(BookingSerializer(bookings, many=True).data)

    def patch(self, request, booking_id):
        access_error = admin_access_error(request)
        if access_error:
            return access_error
        status_value = request.data.get('status', '').upper()
        valid_statuses = {choice[0] for choice in Booking.STATUS_CHOICES}
        if status_value not in valid_statuses:
            return Response({"error": "Invalid booking status."}, status=status.HTTP_400_BAD_REQUEST)
        if status_value in ('CUSTOMER_CANCELLED', 'PARTNER_CANCELLED'):
            return Response({"error": "Use the booking cancellation workflow so refunds and notifications are handled safely."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            booking = Booking.objects.select_related('hotel', 'room', 'user').get(booking_id=booking_id)
        except Booking.DoesNotExist:
            return Response({"error": "Booking not found."}, status=status.HTTP_404_NOT_FOUND)
        if booking.status in ('CUSTOMER_CANCELLED', 'PARTNER_CANCELLED'):
            return Response({"error": "A cancelled booking cannot be reactivated from this screen."}, status=status.HTTP_409_CONFLICT)
        booking.status = status_value
        booking.save(update_fields=['status'])
        return Response(BookingSerializer(booking).data)


class AdminManualRefundView(APIView):
    def post(self, request, booking_id):
        access_error = admin_access_error(request)
        if access_error:
            return access_error

        refund_reference = str(request.data.get('refund_reference', '')).strip()
        if not refund_reference:
            return Response(
                {"error": "Enter the manual refund transaction/reference ID."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            try:
                booking = Booking.objects.select_for_update().select_related('hotel', 'room', 'user').get(
                    booking_id=booking_id
                )
            except Booking.DoesNotExist:
                return Response({"error": "Booking not found."}, status=status.HTTP_404_NOT_FOUND)

            if booking.status not in ('CUSTOMER_CANCELLED', 'PARTNER_CANCELLED') or booking.refund_amount <= 0:
                return Response({"error": "This booking has no refundable cancellation amount."}, status=status.HTTP_409_CONFLICT)
            if booking.refund_status == 'PROCESSED':
                return Response({"error": "This refund has already been marked as processed."}, status=status.HTTP_409_CONFLICT)
            if booking.refund_status not in ('PENDING', 'REVIEW_REQUIRED'):
                return Response({"error": "This refund is not awaiting manual processing."}, status=status.HTTP_409_CONFLICT)

            booking.refund_status = 'PROCESSED'
            booking.refund_reference = refund_reference
            booking.payment_status = (
                'REFUNDED' if booking.refund_amount == booking.total_price else 'PARTIALLY_REFUNDED'
            )
            booking.save(update_fields=['refund_status', 'refund_reference', 'payment_status'])

        email_sent = send_refund_processed_email(booking)
        return Response({
            "message": f"Manual refund for {booking_id} recorded as processed.",
            "booking": BookingSerializer(booking).data,
            "email_sent": email_sent,
        })


class AdminCouponManageView(APIView):
    def get(self, request):
        access_error = admin_access_error(request)
        if access_error:
            return access_error
        return Response(CouponSerializer(Coupon.objects.all().order_by('code'), many=True).data)

    def post(self, request):
        access_error = admin_access_error(request)
        if access_error:
            return access_error
        serializer = CouponSerializer(data=request.data)
        if serializer.is_valid():
            coupon = serializer.save(
                code=serializer.validated_data['code'].strip().upper(),
                is_admin_created=True,
            )
            return Response(CouponSerializer(coupon).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk):
        access_error = admin_access_error(request)
        if access_error:
            return access_error
        try:
            coupon = Coupon.objects.get(pk=pk)
        except Coupon.DoesNotExist:
            return Response({"error": "Coupon not found."}, status=status.HTTP_404_NOT_FOUND)
        data = request.data.copy()
        if 'code' in data:
            data['code'] = data['code'].strip().upper()
        serializer = CouponSerializer(coupon, data=data, partial=True)
        if serializer.is_valid():
            serializer.save(is_admin_created=True)
            return Response(CouponSerializer(coupon).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        access_error = admin_access_error(request)
        if access_error:
            return access_error
        try:
            Coupon.objects.get(pk=pk).delete()
        except Coupon.DoesNotExist:
            return Response({"error": "Coupon not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response({"message": "Coupon removed."})

class HotelListView(APIView):
    def get(self, request):
        queryset = Hotel.objects.filter(is_active=True)

        city = request.query_params.get('city', None)
        search = request.query_params.get('search', None)
        min_price = request.query_params.get('min_price', None)
        max_price = request.query_params.get('max_price', None)
        star_rating = request.query_params.get('star_rating', None)
        amenities = request.query_params.getlist('amenities')
        sort_by = request.query_params.get('sort_by', None)

        if city and city.strip() and city.lower() != 'all':
            queryset = queryset.filter(
                Q(city__icontains=city.strip()) |
                Q(destination__icontains=city.strip()) |
                Q(address__icontains=city.strip()) |
                Q(name__icontains=city.strip())
            )

        if search and search.strip():
            queryset = queryset.filter(
                Q(name__icontains=search.strip()) | 
                Q(city__icontains=search.strip()) | 
                Q(destination__icontains=search.strip()) |
                Q(address__icontains=search.strip()) |
                Q(description__icontains=search.strip())
            )

        if min_price:
            try:
                queryset = queryset.filter(price_per_night__gte=int(min_price))
            except ValueError:
                pass

        if max_price:
            try:
                queryset = queryset.filter(price_per_night__lte=int(max_price))
            except ValueError:
                pass

        if star_rating and star_rating != 'all':
            try:
                queryset = queryset.filter(star_rating__gte=int(star_rating))
            except ValueError:
                pass

        if amenities:
            for item in amenities:
                queryset = [h for h in queryset if item in h.amenities]
                queryset = Hotel.objects.filter(id__in=[h.id for h in queryset])

        if sort_by == 'price_low_high':
            queryset = queryset.order_by('price_per_night')
        elif sort_by == 'price_high_low':
            queryset = queryset.order_by('-price_per_night')
        elif sort_by == 'rating':
            queryset = queryset.order_by('-rating_score')
        elif sort_by == 'popular':
            queryset = queryset.order_by('-review_count')
        else:
            queryset = queryset.order_by('-is_featured', '-rating_score')

        serializer = HotelSerializer(queryset, many=True)
        return Response(serializer.data)

class HotelDetailView(generics.RetrieveAPIView):
    queryset = Hotel.objects.filter(is_active=True)
    serializer_class = HotelSerializer

class BookingListCreateView(APIView):
    def get(self, request):
        user = self._authenticated_user(request)
        if not user:
            return Response({"error": "Login required."}, status=status.HTTP_401_UNAUTHORIZED)
        hotel_id = request.query_params.get('hotel_id', None)

        if user.role == 'VENDOR':
            if user.vendor_status != 'APPROVED':
                return Response({"error": "An approved vendor account is required."}, status=status.HTTP_403_FORBIDDEN)
            queryset = Booking.objects.filter(hotel__in=_vendor_hotels_for_user(user))
            if hotel_id:
                queryset = queryset.filter(hotel_id=hotel_id)
        elif user.role == 'CUSTOMER':
            queryset = Booking.objects.filter(user=user)
            if hotel_id:
                queryset = queryset.filter(hotel_id=hotel_id)
        else:
            return Response({"error": "This account cannot view customer bookings."}, status=status.HTTP_403_FORBIDDEN)
        queryset = queryset.order_by('-created_at')

        serializer = BookingSerializer(queryset, many=True)
        return Response(serializer.data)

    def post(self, request):
        if not self._authenticated_user(request):
            return Response({"error": "Login required."}, status=status.HTTP_401_UNAUTHORIZED)
        return Response(
            {"error": "Bookings must be created through verified online checkout."},
            status=status.HTTP_405_METHOD_NOT_ALLOWED
        )

    @staticmethod
    def _authenticated_user(request):
        token = request.headers.get('Authorization', '').removeprefix('Bearer ').strip()
        if not token:
            return None
        return UserProfile.objects.filter(auth_token=token, is_email_verified=True).first()

class BookingCancelView(APIView):
    @staticmethod
    def _customer_and_booking(request, booking_id, lock=False):
        user = BookingListCreateView._authenticated_user(request)
        if not user:
            return None, None, Response({"error": "Login required."}, status=status.HTTP_401_UNAUTHORIZED)
        if user.role != 'CUSTOMER':
            return None, None, Response({"error": "Only the booking owner can cancel this booking."}, status=status.HTTP_403_FORBIDDEN)

        bookings = Booking.objects.select_related('hotel', 'room').filter(booking_id=booking_id, user=user)
        if lock:
            bookings = bookings.select_for_update()
        try:
            return user, bookings.get(), None
        except Booking.DoesNotExist:
            return None, None, Response({"error": "Booking not found."}, status=status.HTTP_404_NOT_FOUND)

    @staticmethod
    def _cancellation_quote(booking):
        if booking.status in ('CUSTOMER_CANCELLED', 'PARTNER_CANCELLED'):
            return {
                "booking_id": booking.booking_id,
                "status": booking.status,
                "amount_paid": booking.total_price,
                "refund_amount": booking.refund_amount,
                "cancellation_fee": booking.cancellation_fee,
                "refund_status": booking.refund_status,
                "refund_estimated_days": CUSTOMER_REFUND_ETA if booking.refund_amount else None,
                "already_cancelled": True,
            }
        if booking.status not in ('PENDING', 'CONFIRMED'):
            return None
        if booking.payment_status != 'SUCCESS':
            return None

        refund_amount, cancellation_fee = _customer_cancellation_amounts(booking)
        return {
            "booking_id": booking.booking_id,
            "status": booking.status,
            "amount_paid": booking.total_price,
            "refund_amount": refund_amount,
            "cancellation_fee": cancellation_fee,
            "refund_status": booking.refund_status,
            "refund_estimated_days": CUSTOMER_REFUND_ETA if refund_amount else None,
            "policy": CUSTOMER_CANCELLATION_POLICY,
            "already_cancelled": False,
        }

    def get(self, request, booking_id):
        _, booking, error_response = self._customer_and_booking(request, booking_id)
        if error_response:
            return error_response
        if booking.status in ('CUSTOMER_CANCELLED', 'PARTNER_CANCELLED'):
            return Response(self._cancellation_quote(booking))
        if booking.refund_status != 'NOT_APPLICABLE':
            return Response(
                {"error": "A refund request for this booking is already being reviewed. Please contact support."},
                status=status.HTTP_409_CONFLICT,
            )
        quote = self._cancellation_quote(booking)
        if quote is None:
            return Response(
                {"error": "This booking cannot be cancelled because it is not confirmed or the payment is not complete."},
                status=status.HTTP_409_CONFLICT,
            )
        return Response(quote)

    def post(self, request, booking_id):
        with transaction.atomic():
            _, booking, error_response = self._customer_and_booking(request, booking_id, lock=True)
            if error_response:
                return error_response
            if booking.status in ('CUSTOMER_CANCELLED', 'PARTNER_CANCELLED'):
                return Response(self._cancellation_quote(booking))
            if booking.refund_status != 'NOT_APPLICABLE':
                return Response(
                    {"error": "A refund request for this booking is already being reviewed. Please contact support."},
                    status=status.HTTP_409_CONFLICT,
                )
            quote = self._cancellation_quote(booking)
            if quote is None:
                return Response(
                    {"error": "This booking cannot be cancelled because it is not confirmed or the payment is not complete."},
                    status=status.HTTP_409_CONFLICT,
                )

            booking.status = 'CUSTOMER_CANCELLED'
            booking.cancellation_fee = quote['cancellation_fee']
            booking.refund_amount = quote['refund_amount']
            if quote['refund_amount']:
                booking.refund_status = 'PENDING'
                booking.payment_status = 'REFUND_PENDING'
            else:
                booking.refund_status = 'NOT_APPLICABLE'
            booking.payout_status = 'VOIDED'
            booking.cancelled_at = timezone.now()
            booking.save(update_fields=[
                'status', 'cancellation_fee', 'refund_amount', 'refund_status',
                'payment_status', 'payout_status', 'cancelled_at',
            ])

        booking.refresh_from_db()
        email_notifications = send_booking_cancellation_notifications(booking)
        result = self._cancellation_quote(booking)
        result.update({
            "message": "Booking cancelled successfully.",
            "refund_estimated_days": CUSTOMER_REFUND_ETA if booking.refund_amount else None,
            "email_notifications": email_notifications,
        })
        return Response(result)

class ValidateCouponView(APIView):
    def post(self, request):
        code = request.data.get('code', '').strip().upper()
        try:
            total_amount = int(request.data.get('total_amount', 0))
        except (TypeError, ValueError):
            return Response({"valid": False, "message": "Invalid booking amount."}, status=status.HTTP_400_BAD_REQUEST)

        coupon = Coupon.objects.filter(code=code, is_active=True).first()
        if not coupon:
            return Response({
                "valid": False,
                "message": "Invalid or inactive coupon code."
            }, status=status.HTTP_400_BAD_REQUEST)
        if total_amount < 0:
            return Response({"valid": False, "message": "Invalid booking amount."}, status=status.HTTP_400_BAD_REQUEST)
        if total_amount < coupon.min_order:
            return Response({
                "valid": False,
                "message": f"Minimum booking amount of ₹{coupon.min_order} required for coupon {coupon.code}."
            }, status=status.HTTP_400_BAD_REQUEST)

        calc_discount = int(total_amount * coupon.discount_percent / 100)
        final_discount = min(calc_discount, coupon.max_discount)
        return Response({
            "valid": True,
            "code": coupon.code,
            "discount_amount": final_discount,
            "discount_percent": coupon.discount_percent,
            "message": f"Coupon '{coupon.code}' applied! You saved ₹{final_discount}"
        })

class ActiveCouponListView(APIView):
    def get(self, request):
        coupons = Coupon.objects.filter(is_active=True, is_admin_created=True).order_by('code')
        return Response(CouponSerializer(coupons, many=True).data)

class AdminAnalyticsView(APIView):
    def get(self, request):
        access_error = admin_access_error(request)
        if access_error:
            return access_error
        total_hotels = Hotel.objects.count()
        total_bookings = Booking.objects.count()
        total_vendors = UserProfile.objects.filter(role='VENDOR').count()
        confirmed_bookings = Booking.objects.exclude(status__in=['CUSTOMER_CANCELLED', 'PARTNER_CANCELLED'])
        total_revenue = confirmed_bookings.aggregate(Sum('total_price'))['total_price__sum'] or 0
        total_commission = confirmed_bookings.aggregate(Sum('commission_amount'))['commission_amount__sum'] or 0
        cancelled_count = Booking.objects.filter(status__in=['CUSTOMER_CANCELLED', 'PARTNER_CANCELLED']).count()
        
        recent_bookings = Booking.objects.all().order_by('-created_at')[:10]
        recent_serializer = BookingSerializer(recent_bookings, many=True)

        monthly_data = list(
            confirmed_bookings.annotate(month=TruncMonth('created_at'))
            .values('month')
            .annotate(
                revenue=Sum('total_price'),
                commission=Sum('commission_amount'),
                bookings=Count('id')
            )
            .order_by('month')
        )
        for item in monthly_data:
            item['month'] = item['month'].strftime('%b %Y')

        return Response({
            "metrics": {
                "total_hotels": total_hotels,
                "total_bookings": total_bookings,
                "total_vendors": total_vendors,
                "total_revenue": total_revenue,
                "total_commission": total_commission,
                "cancelled_bookings": cancelled_count,
                "occupancy_rate": "84.5%",
                "active_users": 14850
            },
            "recent_bookings": recent_serializer.data,
            "monthly_trends": monthly_data
        })

class AdminHotelManageView(APIView):
    def get(self, request):
        access_error = admin_access_error(request)
        if access_error:
            return access_error
        hotels = Hotel.objects.all().order_by('name')
        return Response(HotelSerializer(hotels, many=True).data)

    def post(self, request):
        access_error = admin_access_error(request)
        if access_error:
            return access_error
        serializer = HotelSerializer(data=request.data)
        if serializer.is_valid():
            hotel = serializer.save()
            _seed_default_rooms(hotel)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk):
        access_error = admin_access_error(request)
        if access_error:
            return access_error
        try:
            hotel = Hotel.objects.get(pk=pk)
            serializer = HotelSerializer(hotel, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Hotel.DoesNotExist:
            return Response({"error": "Hotel not found"}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, pk):
        access_error = admin_access_error(request)
        if access_error:
            return access_error
        try:
            hotel = Hotel.objects.get(pk=pk)
        except Hotel.DoesNotExist:
            return Response({"error": "Hotel not found"}, status=status.HTTP_404_NOT_FOUND)
        hotel.is_active = False
        hotel.save(update_fields=['is_active'])
        return Response({"message": "Hotel listing archived. Booking history has been retained."})


class PartnerHotelRegisterView(APIView):
    """List or register properties owned by the logged-in vendor."""

    def get(self, request):
        vendor, access_error = partner_access_user(request)
        if access_error:
            return access_error
        hotels = _vendor_hotels_for_user(vendor).filter(is_active=True).order_by('-created_at')
        return Response(HotelSerializer(hotels, many=True).data)

    def post(self, request):
        vendor, access_error = partner_access_user(request)
        if access_error:
            return access_error

        payload = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
        for key in ('price_per_night', 'original_price', 'star_rating', 'review_count'):
            value = payload.get(key)
            if value in ('', None):
                payload.pop(key, None)
            else:
                try:
                    payload[key] = int(float(value))
                except (TypeError, ValueError):
                    payload.pop(key, None)
        if payload.get('rating_score') not in ('', None):
            try:
                payload['rating_score'] = float(payload['rating_score'])
            except (TypeError, ValueError):
                payload.pop('rating_score', None)

        serializer = PartnerHotelWriteSerializer(data=payload)
        if not serializer.is_valid():
            first_error = 'Invalid hotel details.'
            for field, messages in serializer.errors.items():
                if isinstance(messages, (list, tuple)) and messages:
                    first_error = f"{field}: {messages[0]}"
                    break
                if messages:
                    first_error = f"{field}: {messages}"
                    break
            return Response({"error": str(first_error), "details": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        hotel = serializer.save(is_active=True, owner=vendor)
        _seed_default_rooms(hotel)

        vendor.hotel = hotel
        vendor.save(update_fields=['hotel'])

        data = HotelSerializer(hotel).data
        data['vendor'] = UserProfileSerializer(vendor).data
        return Response(data, status=status.HTTP_201_CREATED)


class PartnerHotelDetailView(APIView):
    """Remove (archive) a vendor-owned property listing."""

    def delete(self, request, pk):
        vendor, access_error = partner_access_user(request)
        if access_error:
            return access_error

        try:
            hotel = _vendor_hotels_for_user(vendor).get(pk=pk)
        except Hotel.DoesNotExist:
            return Response({"error": "Property not found or access denied."}, status=status.HTTP_404_NOT_FOUND)

        has_active_bookings = Booking.objects.filter(
            hotel=hotel,
            status__in=['PENDING', 'CONFIRMED', 'CHECKED_IN'],
        ).exists()
        if has_active_bookings:
            return Response(
                {"error": "This property has active bookings. Complete or cancel them before removing the listing."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        hotel.is_active = False
        hotel.save(update_fields=['is_active'])

        if vendor.hotel_id == hotel.id:
            replacement = (
                _vendor_hotels_for_user(vendor)
                .filter(is_active=True)
                .exclude(pk=hotel.id)
                .order_by('-created_at')
                .first()
            )
            vendor.hotel = replacement
            vendor.save(update_fields=['hotel'])

        return Response({"message": "Property removed from Trumitrip listings. Past booking records are retained."})


class PartnerRatesView(APIView):
    def post(self, request):
        hotel_id = request.data.get('hotel_id')
        room_id = request.data.get('room_id')
        new_price = request.data.get('new_price')
        inventory = request.data.get('inventory')

        try:
            room = Room.objects.get(id=room_id, hotel_id=hotel_id)
            if new_price:
                room.price_per_night = int(new_price)
            if inventory is not None:
                room.available_count = int(inventory)
            room.save()

            hotel = room.hotel
            min_room_price = Room.objects.filter(hotel=hotel).order_by('price_per_night').first()
            if min_room_price:
                hotel.price_per_night = min_room_price.price_per_night
                hotel.save()

            return Response({
                "message": "Room rate & availability updated successfully",
                "room_id": room.id,
                "new_price": room.price_per_night,
                "available_count": room.available_count
            })
        except Room.DoesNotExist:
            return Response({"error": "Room record not found"}, status=status.HTTP_404_NOT_FOUND)

class PartnerRoomManageView(APIView):
    def post(self, request):
        hotel_id = request.data.get('hotel_id')
        if not hotel_id:
            return Response({"error": "hotel_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            hotel = Hotel.objects.get(pk=hotel_id)
        except Hotel.DoesNotExist:
            return Response({"error": "Hotel not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = RoomSerializer(data=request.data)
        if serializer.is_valid():
            room = serializer.save(hotel=hotel)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk):
        try:
            room = Room.objects.get(pk=pk)
            serializer = RoomSerializer(room, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Room.DoesNotExist:
            return Response({"error": "Room not found"}, status=status.HTTP_404_NOT_FOUND)

class PartnerBookingStatusView(APIView):
    def post(self, request, booking_id):
        user = BookingListCreateView._authenticated_user(request)
        if not user:
            return Response({"error": "Login required."}, status=status.HTTP_401_UNAUTHORIZED)
        if user.role != 'VENDOR' or user.vendor_status != 'APPROVED':
            return Response({"error": "Approved vendor access is required."}, status=status.HTTP_403_FORBIDDEN)

        status_val = request.data.get('status', '').upper()
        allowed = ['CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'PARTNER_CANCELLED']
        if status_val not in allowed:
            return Response({"error": f"Invalid status. Must be one of {allowed}"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            with transaction.atomic():
                booking = Booking.objects.select_for_update().select_related('hotel', 'room', 'user').get(
                    booking_id=booking_id,
                    hotel__in=_vendor_hotels_for_user(user),
                )
                if booking.status in ('CUSTOMER_CANCELLED', 'PARTNER_CANCELLED', 'COMPLETED'):
                    return Response({"error": "This booking can no longer be updated."}, status=status.HTTP_409_CONFLICT)
                if status_val == 'PARTNER_CANCELLED':
                    booking.status = 'PARTNER_CANCELLED'
                    booking.cancellation_fee = 0
                    booking.refund_amount = booking.total_price if booking.payment_status == 'SUCCESS' else 0
                    booking.refund_status = 'PENDING' if booking.refund_amount else 'NOT_APPLICABLE'
                    if booking.refund_amount:
                        booking.payment_status = 'REFUND_PENDING'
                    booking.payout_status = 'VOIDED'
                    booking.cancelled_at = timezone.now()
                    booking.save(update_fields=[
                        'status', 'cancellation_fee', 'refund_amount', 'refund_status',
                        'payment_status', 'payout_status', 'cancelled_at',
                    ])
                else:
                    booking.status = status_val
                    booking.save(update_fields=['status'])
        except Booking.DoesNotExist:
            return Response({"error": "Booking record not found"}, status=status.HTTP_404_NOT_FOUND)

        if status_val == 'PARTNER_CANCELLED':
            email_notifications = send_booking_cancellation_notifications(booking)
            return Response({
                "message": f"Booking {booking_id} cancelled. Any refund is pending admin processing.",
                "booking": BookingSerializer(booking).data,
                "email_notifications": email_notifications,
            })

        try:
            booking = Booking.objects.select_related('hotel', 'room', 'user').get(booking_id=booking_id)
            return Response({
                "message": f"Booking {booking_id} status updated to {status_val}",
                "booking": BookingSerializer(booking).data
            })
        except Booking.DoesNotExist:
            return Response({"error": "Booking record not found"}, status=status.HTTP_404_NOT_FOUND)

class PartnerAnalyticsView(APIView):
    def get(self, request):
        hotel_id = request.query_params.get('hotel_id')
        bookings = Booking.objects.all()
        if hotel_id:
            bookings = bookings.filter(hotel_id=hotel_id)

        valid_bookings = bookings.exclude(status__in=['CUSTOMER_CANCELLED', 'PARTNER_CANCELLED'])
        completed_bookings = bookings.filter(status='COMPLETED')

        gross_revenue = valid_bookings.aggregate(Sum('total_price'))['total_price__sum'] or 0
        total_commission = valid_bookings.aggregate(Sum('commission_amount'))['commission_amount__sum'] or 0
        net_partner_payout = valid_bookings.aggregate(Sum('net_partner_payout'))['net_partner_payout__sum'] or 0

        pending_bookings = bookings.filter(status__in=['PENDING', 'CONFIRMED'])
        pending_revenue = pending_bookings.aggregate(Sum('total_price'))['total_price__sum'] or 0

        total_bookings_count = valid_bookings.count()
        abv = int(gross_revenue / total_bookings_count) if total_bookings_count > 0 else 0

        # Room-wise breakdown
        room_breakdown = []
        rooms = Room.objects.filter(hotel_id=hotel_id) if hotel_id else Room.objects.all()
        for r in rooms:
            r_bookings = valid_bookings.filter(room=r)
            r_rev = r_bookings.aggregate(Sum('total_price'))['total_price__sum'] or 0
            room_breakdown.append({
                "room_id": r.id,
                "room_type": r.room_type,
                "total_rooms": r.total_rooms,
                "blocked_rooms": r.blocked_rooms,
                "available_count": r.available_count,
                "status": r.status,
                "revenue": r_rev,
                "bookings_count": r_bookings.count()
            })

        return Response({
            "metrics": {
                "gross_revenue": gross_revenue,
                "platform_commission": total_commission,
                "net_partner_payout": net_partner_payout,
                "pending_revenue": pending_revenue,
                "total_bookings_count": total_bookings_count,
                "completed_count": completed_bookings.count(),
                "average_booking_value": abv,
                "occupancy_rate": "82.4%"
            },
            "room_breakdown": room_breakdown
        })

class AdminPayoutsView(APIView):
    def get(self, request):
        access_error = admin_access_error(request)
        if access_error:
            return access_error
        bookings = Booking.objects.exclude(status__in=['CUSTOMER_CANCELLED', 'PARTNER_CANCELLED']).order_by('-created_at')
        serializer = BookingSerializer(bookings, many=True)
        return Response(serializer.data)

    def post(self, request):
        access_error = admin_access_error(request)
        if access_error:
            return access_error
        booking_id = request.data.get('booking_id')
        payout_status = request.data.get('payout_status', '').upper()
        if payout_status not in ['PENDING', 'PROCESSED', 'TRANSFERRED', 'VOIDED']:
            return Response({"error": "Invalid payout status"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            booking = Booking.objects.get(booking_id=booking_id)
            if booking.status in ('CUSTOMER_CANCELLED', 'PARTNER_CANCELLED') and payout_status != 'VOIDED':
                return Response({"error": "Cancelled bookings cannot be paid to a partner."}, status=status.HTTP_409_CONFLICT)
            if booking.status not in ('CUSTOMER_CANCELLED', 'PARTNER_CANCELLED') and payout_status == 'VOIDED':
                return Response({"error": "Only cancelled bookings can have a voided payout."}, status=status.HTTP_400_BAD_REQUEST)
            booking.payout_status = payout_status
            booking.save(update_fields=['payout_status'])
            return Response({
                "message": f"Payout status for {booking_id} updated to {payout_status}",
                "booking": BookingSerializer(booking).data
            })
        except Booking.DoesNotExist:
            return Response({"error": "Booking record not found"}, status=status.HTTP_404_NOT_FOUND)



# ─────────────────────────────────────────────────────────────────────────────
# Razorpay Payment Gateway Views
# ─────────────────────────────────────────────────────────────────────────────

class RazorpayCreateOrderView(APIView):
    """
    Step 1 of Razorpay checkout.
    Frontend sends the total_price; we create a Razorpay order and return
    the order_id + key_id so the frontend can open the Razorpay checkout popup.
    """
    def post(self, request):
        user = BookingListCreateView._authenticated_user(request)
        if not user:
            return Response({"error": "Login required."}, status=status.HTTP_401_UNAUTHORIZED)

        total_price = request.data.get('total_price')
        if not total_price:
            return Response({"error": "total_price is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            amount_paise = int(float(total_price)) * 100  # Razorpay expects amount in paise
            order_data = {
                "amount": amount_paise,
                "currency": "INR",
                "payment_capture": 1,  # auto-capture
            }
            razorpay_order = razorpay_client.order.create(data=order_data)
            return Response({
                "razorpay_order_id": razorpay_order["id"],
                "amount": amount_paise,
                "currency": "INR",
                "key_id": settings.RAZORPAY_KEY_ID,
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": f"Razorpay order creation failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class RazorpayVerifyPaymentView(APIView):
    """
    Step 2 of Razorpay checkout.
    After the user completes payment, Razorpay returns:
      razorpay_order_id, razorpay_payment_id, razorpay_signature
    We verify the HMAC signature and then create the booking record.
    """
    def post(self, request):
        user = BookingListCreateView._authenticated_user(request)
        if not user:
            return Response({"error": "Login required."}, status=status.HTTP_401_UNAUTHORIZED)

        razorpay_order_id  = request.data.get('razorpay_order_id', '')
        razorpay_payment_id = request.data.get('razorpay_payment_id', '')
        razorpay_signature  = request.data.get('razorpay_signature', '')
        booking_payload     = request.data.get('booking_payload', {})

        # ── Signature Verification — use Razorpay's own utility ──────────────
        try:
            razorpay_client.utility.verify_payment_signature({
                'razorpay_order_id':   razorpay_order_id,
                'razorpay_payment_id': razorpay_payment_id,
                'razorpay_signature':  razorpay_signature,
            })
        except Exception:
            return Response(
                {"error": "Payment verification failed. Invalid signature."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ── Create Booking ────────────────────────────────────────────────────
        data = booking_payload.copy()
        data['user'] = user.id
        data['guest_name'] = user.name
        data['guest_email'] = user.email
        data['guest_phone'] = user.phone or str(data.get('guest_phone') or '').strip()
        data['payment_mode'] = 'CARD'   # Razorpay online = CARD
        data['payment_status'] = 'SUCCESS'
        data['razorpay_order_id'] = razorpay_order_id
        data['razorpay_payment_id'] = razorpay_payment_id
        data['razorpay_signature'] = razorpay_signature

        # Ensure hotel/room are integers
        if 'hotel' in data:
            try: data['hotel'] = int(data['hotel'])
            except (ValueError, TypeError): pass
        if 'room' in data:
            try: data['room'] = int(data['room'])
            except (ValueError, TypeError): pass

        if 'booking_id' not in data or not data['booking_id']:
            rand_suffix = ''.join(random.choices(string.digits, k=4))
            data['booking_id'] = f"TMT-2026-{rand_suffix}"

        # Commission calculation using hotel's rate
        total = int(data.get('total_price', 0))
        try:
            hotel_obj = Hotel.objects.get(pk=data.get('hotel'))
            comm_rate = hotel_obj.commission_percent
        except Hotel.DoesNotExist:
            comm_rate = 10.0
        comm_amount = int(total * comm_rate / 100)
        data['commission_rate'] = comm_rate
        data['commission_amount'] = comm_amount
        data['net_partner_payout'] = total - comm_amount
        data['status'] = 'CONFIRMED'

        # Nights snapshot
        try:
            from datetime import date as _date
            ci = data.get('check_in')
            co = data.get('check_out')
            if isinstance(ci, str):
                ci = _date.fromisoformat(ci)
            if isinstance(co, str):
                co = _date.fromisoformat(co)
            data['nights'] = max(1, (co - ci).days)
        except Exception:
            data['nights'] = 1

        serializer = BookingSerializer(data=data)
        if serializer.is_valid():
            booking = serializer.save()
            email_notifications = send_booking_notifications(booking)
            return Response({
                "message": "Payment verified and booking confirmed!",
                "booking": serializer.data,
                "email_notifications": email_notifications,
            }, status=status.HTTP_201_CREATED)
        return Response({"error": "Booking creation failed.", "details": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


class AdminCommissionSettingsView(APIView):
    """
    Admin endpoint to view and update commission_percent per hotel.
    GET  /api/admin/commission/          → list all hotels with their commission %
    POST /api/admin/commission/          → update commission % for a hotel
         body: { hotel_id, commission_percent }
    """
    def get(self, request):
        access_error = admin_access_error(request)
        if access_error:
            return access_error
        hotels = Hotel.objects.all().values('id', 'name', 'city', 'commission_percent')
        return Response(list(hotels))

    def post(self, request):
        access_error = admin_access_error(request)
        if access_error:
            return access_error
        hotel_id = request.data.get('hotel_id')
        commission_percent = request.data.get('commission_percent')

        if hotel_id is None or commission_percent is None:
            return Response({"error": "hotel_id and commission_percent are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            commission_percent = float(commission_percent)
            if not (0 <= commission_percent <= 100):
                raise ValueError("Out of range")
        except (ValueError, TypeError):
            return Response({"error": "commission_percent must be a number between 0 and 100."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            hotel = Hotel.objects.get(pk=hotel_id)
            hotel.commission_percent = commission_percent
            hotel.save(update_fields=['commission_percent'])
            return Response({
                "message": f"Commission for '{hotel.name}' updated to {commission_percent}%",
                "hotel_id": hotel.id,
                "hotel_name": hotel.name,
                "commission_percent": hotel.commission_percent,
            })
        except Hotel.DoesNotExist:
            return Response({"error": "Hotel not found."}, status=status.HTTP_404_NOT_FOUND)


# ─────────────────────────────────────────────────────────────────────────────
# Google OAuth Sign-In View
# ─────────────────────────────────────────────────────────────────────────────

class GoogleAuthView(APIView):
    """
    POST /api/auth/google/
    Body: { credential: "<Google ID token JWT>" }

    Verifies the Google ID token, then:
    - If the email exists → logs in and returns the user + session token
    - If new email      → auto-creates a UserProfile (CUSTOMER role) and returns it
    """
    def post(self, request):
        credential = request.data.get('credential', '').strip()
        if not credential:
            return Response({"error": "Google credential token is required."}, status=status.HTTP_400_BAD_REQUEST)

        google_client_id = settings.GOOGLE_CLIENT_ID
        if not google_client_id:
            return Response({"error": "Google Sign-In is not configured on the server."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        # ── Verify the Google ID token ────────────────────────────────────────
        try:
            from google.oauth2 import id_token
            from google.auth.transport import requests as google_requests
            idinfo = id_token.verify_oauth2_token(
                credential,
                google_requests.Request(),
                google_client_id,
                clock_skew_in_seconds=10,
            )
        except ValueError as e:
            return Response({"error": f"Invalid Google token: {str(e)}"}, status=status.HTTP_401_UNAUTHORIZED)

        email = idinfo.get('email', '').lower()
        name  = idinfo.get('name', email.split('@')[0])
        picture = idinfo.get('picture', '')

        if not email:
            return Response({"error": "Google account has no email address."}, status=status.HTTP_400_BAD_REQUEST)

        # ── Get or create user ────────────────────────────────────────────────
        user = UserProfile.objects.filter(email=email).first()

        if not user:
            # Auto-register new Google user — no password needed
            user = UserProfile.objects.create(
                name=name,
                email=email,
                phone='',
                password=make_password(secrets.token_urlsafe(24)),
                role='CUSTOMER',
                vendor_status='PENDING',
            )

        # ── Issue / refresh session token ─────────────────────────────────────
        auth_token = secrets.token_urlsafe(48)
        user.auth_token = auth_token
        user.is_email_verified = True   # ensure it's always true for Google users
        user.save(update_fields=['auth_token', 'is_email_verified'])

        return Response({
            "message": "Google Sign-In successful.",
            "token": auth_token,
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "phone": user.phone,
                "role": user.role,
                "vendor_status": user.vendor_status,
                "picture": picture,
                "hotel": user.hotel_id,
            }
        }, status=status.HTTP_200_OK)


# ─────────────────────────────────────────────────────────────────────────────
# Booking Voucher PDF Download (Customer)
# ─────────────────────────────────────────────────────────────────────────────

class BookingVoucherView(APIView):
    """
    GET /api/bookings/voucher/<booking_id>/
    Returns the PDF voucher as a file download.
    Only the booking owner (or an admin) can download.
    """
    def get(self, request, booking_id):
        user = BookingListCreateView._authenticated_user(request)
        if not user:
            return Response({"error": "Login required."}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            if user.role == 'ADMIN':
                booking = Booking.objects.get(booking_id=booking_id)
            else:
                booking = Booking.objects.get(booking_id=booking_id, user=user)
        except Booking.DoesNotExist:
            return Response({"error": "Booking not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            pdf_bytes = generate_booking_pdf(booking)
        except Exception as exc:
            import logging
            logging.getLogger(__name__).error(
                "Voucher PDF generation failed for %s: %s", booking_id, type(exc).__name__
            )
            return Response({"error": "Could not generate voucher. Please try again."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        filename = f"Trumitrip_Voucher_{booking.booking_id}.pdf"
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        response['Content-Length'] = len(pdf_bytes)
        return response


# ─────────────────────────────────────────────────────────────────────────────
# Admin: Re-send Voucher Email
# ─────────────────────────────────────────────────────────────────────────────

class AdminResendVoucherView(APIView):
    """
    POST /api/admin/resend-voucher/<booking_id>/
    Resets email_sent=False and retries sending the confirmation email.
    Admin-only. Safe to call multiple times.
    """
    def post(self, request, booking_id):
        user = BookingListCreateView._authenticated_user(request)
        if not user or user.role != 'ADMIN':
            return Response({"error": "Admin access required."}, status=status.HTTP_403_FORBIDDEN)

        try:
            booking = Booking.objects.get(booking_id=booking_id)
        except Booking.DoesNotExist:
            return Response({"error": "Booking not found."}, status=status.HTTP_404_NOT_FOUND)

        # Reset the sent flag so the idempotency guard allows a retry
        booking.email_sent = False
        booking.save(update_fields=['email_sent'])

        delivery = send_booking_notifications(booking)

        if delivery['guest']:
            return Response({
                "message": f"Booking notifications retried for booking {booking_id}.",
                "email_sent": True,
                "email_notifications": delivery,
                "email_attempts": booking.email_attempts,
            })
        else:
            return Response({
                "error": "Guest confirmation email delivery failed. Check the email server logs and SMTP configuration.",
                "email_sent": False,
                "email_notifications": delivery,
                "email_attempts": booking.email_attempts,
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
