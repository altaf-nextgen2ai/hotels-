from rest_framework import serializers
from .models import Hotel, Room, Booking, Coupon, Review, UserProfile

class UserProfileSerializer(serializers.ModelSerializer):
    hotel_name = serializers.CharField(source='hotel.name', read_only=True)

    class Meta:
        model = UserProfile
        fields = ['id', 'name', 'email', 'phone', 'role', 'vendor_status', 'hotel', 'hotel_name', 'is_email_verified', 'created_at']

class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = '__all__'

class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = '__all__'

class HotelSerializer(serializers.ModelSerializer):
    rooms = RoomSerializer(many=True, read_only=True)
    reviews = ReviewSerializer(many=True, read_only=True)

    class Meta:
        model = Hotel
        fields = '__all__'

class BookingSerializer(serializers.ModelSerializer):
    hotel_name = serializers.CharField(source='hotel.name', read_only=True)
    hotel_city = serializers.CharField(source='hotel.city', read_only=True)
    hotel_image = serializers.CharField(source='hotel.main_image', read_only=True)
    room_name = serializers.CharField(source='room.room_type', read_only=True)

    class Meta:
        model = Booking
        fields = '__all__'

class CouponSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coupon
        fields = '__all__'
