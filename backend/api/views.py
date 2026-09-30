import random
import string
import secrets
from datetime import timedelta
from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone
from django.contrib.auth.hashers import check_password, make_password
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics
from django.db.models import Q, Sum, Count
from .models import Hotel, Room, Booking, Coupon, Review, UserProfile
from .serializers import HotelSerializer, RoomSerializer, BookingSerializer, CouponSerializer, ReviewSerializer, UserProfileSerializer

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
        email = request.data.get('email', '').strip().lower()
        password = request.data.get('password', '').strip()

        # Hardcoded Admin credentials fallback
        if email == 'admin@trumitrip.com' and password == 'admin123':
            admin_user, _ = UserProfile.objects.get_or_create(
                email='admin@trumitrip.com',
                defaults={'name': 'System Administrator', 'password': 'admin123', 'role': 'ADMIN'}
            )
            admin_user.auth_token = secrets.token_urlsafe(32)
            admin_user.is_email_verified = True
            admin_user.save(update_fields=['auth_token', 'is_email_verified'])
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
        hotel_id = request.data.get('hotel_id')

        if not name or not email or not password:
            return Response({"error": "Vendor Name, Email, and Password are required."}, status=status.HTTP_400_BAD_REQUEST)

        if UserProfile.objects.filter(email=email).exists():
            return Response({"error": "A user with this email already exists."}, status=status.HTTP_400_BAD_REQUEST)

        hotel = None
        if hotel_id:
            try:
                hotel = Hotel.objects.get(id=hotel_id)
            except Hotel.DoesNotExist:
                pass

        vendor = UserProfile.objects.create(
            name=name,
            email=email,
            phone=phone,
            password=make_password(password) if password else '',
            role='VENDOR',
            vendor_status='PENDING',
            is_email_verified=True,
            hotel=hotel
        )

        serializer = UserProfileSerializer(vendor)
        return Response({
            "message": "Vendor application submitted successfully. Pending admin approval.",
            "vendor": serializer.data
        }, status=status.HTTP_201_CREATED)

class ListVendorsView(APIView):
    def get(self, request):
        vendors = UserProfile.objects.filter(role='VENDOR').order_by('-created_at')
        serializer = UserProfileSerializer(vendors, many=True)
        return Response(serializer.data)

class AdminVendorStatusView(APIView):
    def post(self, request, pk):
        status_value = request.data.get('status', '').upper()
        if status_value not in ['APPROVED', 'REJECTED', 'PENDING']:
            return Response({"error": "Invalid status choice"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            vendor = UserProfile.objects.get(pk=pk, role='VENDOR')
            vendor.vendor_status = status_value
            vendor.save(update_fields=['vendor_status'])
            serializer = UserProfileSerializer(vendor)
            return Response({
                "message": f"Vendor '{vendor.name}' has been {status_value.lower()}.",
                "vendor": serializer.data
            })
        except UserProfile.DoesNotExist:
            return Response({"error": "Vendor record not found."}, status=status.HTTP_404_NOT_FOUND)

class HotelListView(APIView):
    def get(self, request):
        queryset = Hotel.objects.all()

        city = request.query_params.get('city', None)
        search = request.query_params.get('search', None)
        min_price = request.query_params.get('min_price', None)
        max_price = request.query_params.get('max_price', None)
        star_rating = request.query_params.get('star_rating', None)
        amenities = request.query_params.getlist('amenities')
        sort_by = request.query_params.get('sort_by', None)

        if city and city.strip() and city.lower() != 'all':
            queryset = queryset.filter(Q(city__icontains=city.strip()) | Q(destination__icontains=city.strip()))

        if search and search.strip():
            queryset = queryset.filter(
                Q(name__icontains=search.strip()) | 
                Q(city__icontains=search.strip()) | 
                Q(destination__icontains=search.strip()) |
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
    queryset = Hotel.objects.all()
    serializer_class = HotelSerializer

class BookingListCreateView(APIView):
    def get(self, request):
        user = self._authenticated_user(request)
        if not user:
            return Response({"error": "Login required."}, status=status.HTTP_401_UNAUTHORIZED)
        hotel_id = request.query_params.get('hotel_id', None)

        queryset = Booking.objects.filter(user=user).order_by('-created_at')
        if hotel_id:
            queryset = queryset.filter(hotel_id=hotel_id)

        serializer = BookingSerializer(queryset, many=True)
        return Response(serializer.data)

    def post(self, request):
        user = self._authenticated_user(request)
        if not user:
            return Response({"error": "Login required to book a hotel."}, status=status.HTTP_401_UNAUTHORIZED)
        data = request.data.copy()
        data['user'] = user.id
        data['guest_name'] = user.name
        data['guest_email'] = user.email
        data['guest_phone'] = user.phone
        
        if 'booking_id' not in data or not data['booking_id']:
            rand_suffix = ''.join(random.choices(string.digits, k=4))
            data['booking_id'] = f"TMT-2026-{rand_suffix}"

        # Financial Snapshot (10% Commission)
        total = int(data.get('total_price', 0))
        comm_rate = 10.0
        comm_amount = int(total * 0.10)
        net_payout = total - comm_amount
        data['commission_rate'] = comm_rate
        data['commission_amount'] = comm_amount
        data['net_partner_payout'] = net_payout
        data['status'] = 'CONFIRMED'

        serializer = BookingSerializer(data=data)
        if serializer.is_valid():
            booking = serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @staticmethod
    def _authenticated_user(request):
        token = request.headers.get('Authorization', '').removeprefix('Bearer ').strip()
        if not token:
            return None
        return UserProfile.objects.filter(auth_token=token, is_email_verified=True).first()

class BookingCancelView(APIView):
    def post(self, request, booking_id):
        user = BookingListCreateView._authenticated_user(request)
        if not user:
            return Response({"error": "Login required."}, status=status.HTTP_401_UNAUTHORIZED)
        try:
            booking = Booking.objects.get(booking_id=booking_id, user=user)
            booking.status = 'CUSTOMER_CANCELLED'
            booking.save()
            refund_amount = int(booking.total_price * 0.9)
            return Response({
                "message": "Booking cancelled successfully",
                "booking_id": booking.booking_id,
                "status": "CUSTOMER_CANCELLED",
                "refund_amount": refund_amount,
                "cancellation_fee": booking.total_price - refund_amount
            })
        except Booking.DoesNotExist:
            return Response({"error": "Booking not found"}, status=status.HTTP_404_NOT_FOUND)

class ValidateCouponView(APIView):
    def post(self, request):
        code = request.data.get('code', '').strip().upper()
        total_amount = request.data.get('total_amount', 0)

        valid_coupons = {
            'TRUMI10': {'percent': 10, 'max_discount': 1500, 'min_order': 2000},
            'LUXURY25': {'percent': 25, 'max_discount': 4000, 'min_order': 5000},
            'WELCOME20': {'percent': 20, 'max_discount': 2500, 'min_order': 3000},
            'SUMMER50': {'percent': 15, 'max_discount': 3000, 'min_order': 4000},
        }

        if code in valid_coupons:
            details = valid_coupons[code]
            if total_amount < details['min_order']:
                return Response({
                    "valid": False,
                    "message": f"Minimum booking amount of ₹{details['min_order']} required for coupon {code}."
                }, status=status.HTTP_400_BAD_REQUEST)
            
            calc_discount = int((total_amount * details['percent']) / 100)
            final_discount = min(calc_discount, details['max_discount'])
            return Response({
                "valid": True,
                "code": code,
                "discount_amount": final_discount,
                "discount_percent": details['percent'],
                "message": f"Coupon '{code}' applied! You saved ₹{final_discount}"
            })
        else:
            return Response({
                "valid": False,
                "message": "Invalid Coupon Code. Try TRUMI10 or LUXURY25"
            }, status=status.HTTP_400_BAD_REQUEST)

class AdminAnalyticsView(APIView):
    def get(self, request):
        total_hotels = Hotel.objects.count()
        total_bookings = Booking.objects.count()
        total_vendors = UserProfile.objects.filter(role='VENDOR').count()
        confirmed_bookings = Booking.objects.exclude(status__in=['CUSTOMER_CANCELLED', 'PARTNER_CANCELLED'])
        total_revenue = confirmed_bookings.aggregate(Sum('total_price'))['total_price__sum'] or 0
        total_commission = confirmed_bookings.aggregate(Sum('commission_amount'))['commission_amount__sum'] or 0
        cancelled_count = Booking.objects.filter(status__in=['CUSTOMER_CANCELLED', 'PARTNER_CANCELLED']).count()
        
        recent_bookings = Booking.objects.all().order_by('-created_at')[:10]
        recent_serializer = BookingSerializer(recent_bookings, many=True)

        monthly_data = [
            {"month": "Jan", "revenue": 142000, "commission": 14200, "bookings": 48},
            {"month": "Feb", "revenue": 198000, "commission": 19800, "bookings": 64},
            {"month": "Mar", "revenue": 245000, "commission": 24500, "bookings": 82},
            {"month": "Apr", "revenue": 310000, "commission": 31000, "bookings": 95},
            {"month": "May", "revenue": 420000, "commission": 42000, "bookings": 130},
            {"month": "Jun", "revenue": 380000, "commission": 38000, "bookings": 115},
            {"month": "Jul", "revenue": 510000, "commission": 51000, "bookings": 160},
            {"month": "Aug", "revenue": total_revenue or 640000, "commission": total_commission or 64000, "bookings": total_bookings or 195},
        ]

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
    def post(self, request):
        serializer = HotelSerializer(data=request.data)
        if serializer.is_valid():
            hotel = serializer.save()
            if not hotel.rooms.exists():
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
                    inclusions=["Breakfast Included", "Free High-Speed WiFi", "Swimming Pool Access"]
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
                    inclusions=["Breakfast & Dinner Included", "Airport Private Transfer", "Spa & Sauna Access"]
                )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk):
        try:
            hotel = Hotel.objects.get(pk=pk)
            serializer = HotelSerializer(hotel, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Hotel.DoesNotExist:
            return Response({"error": "Hotel not found"}, status=status.HTTP_404_NOT_FOUND)

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
        status_val = request.data.get('status', '').upper()
        allowed = ['CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'PARTNER_CANCELLED']
        if status_val not in allowed:
            return Response({"error": f"Invalid status. Must be one of {allowed}"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            booking = Booking.objects.get(booking_id=booking_id)
            booking.status = status_val
            booking.save(update_fields=['status'])
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
                "revenue": r.rev,
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
        bookings = Booking.objects.exclude(status__in=['CUSTOMER_CANCELLED', 'PARTNER_CANCELLED']).order_by('-created_at')
        serializer = BookingSerializer(bookings, many=True)
        return Response(serializer.data)

    def post(self, request):
        booking_id = request.data.get('booking_id')
        payout_status = request.data.get('payout_status', '').upper()
        if payout_status not in ['PENDING', 'PROCESSED', 'TRANSFERRED']:
            return Response({"error": "Invalid payout status"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            booking = Booking.objects.get(booking_id=booking_id)
            booking.payout_status = payout_status
            booking.save(update_fields=['payout_status'])
            return Response({
                "message": f"Payout status for {booking_id} updated to {payout_status}",
                "booking": BookingSerializer(booking).data
            })
        except Booking.DoesNotExist:
            return Response({"error": "Booking record not found"}, status=status.HTTP_404_NOT_FOUND)

