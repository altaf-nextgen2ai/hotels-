from rest_framework import serializers
from .models import Hotel, Room, Booking, Coupon, Review, UserProfile

class UserProfileSerializer(serializers.ModelSerializer):
    hotel_name = serializers.SerializerMethodField()
    hotel_city = serializers.SerializerMethodField()
    hotel_address = serializers.SerializerMethodField()

    def get_hotel_name(self, user):
        return user.hotel.name if user.hotel_id else user.application_hotel_name

    def get_hotel_city(self, user):
        return user.hotel.city if user.hotel_id else user.application_city

    def get_hotel_address(self, user):
        return user.hotel.address if user.hotel_id else user.application_address

    class Meta:
        model = UserProfile
        fields = [
            'id', 'name', 'email', 'phone', 'role', 'vendor_status', 'hotel',
            'hotel_name', 'hotel_city', 'hotel_address', 'application_hotel_name',
            'application_city', 'application_address', 'application_total_rooms',
            'is_email_verified', 'created_at'
        ]

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
        read_only_fields = ['email_sent', 'email_sent_at', 'email_attempts']

class CouponSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coupon
        fields = '__all__'
