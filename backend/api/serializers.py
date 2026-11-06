from rest_framework import serializers
from .models import Hotel, Room, Booking, Coupon, Review, UserProfile

class UserProfileSerializer(serializers.ModelSerializer):
    hotel_name = serializers.SerializerMethodField()
    hotel_city = serializers.SerializerMethodField()
    hotel_address = serializers.SerializerMethodField()
    owned_hotels = serializers.SerializerMethodField()

    def _owned_hotels(self, user):
        hotels = list(user.owned_hotels.all())
        hotels.sort(key=lambda hotel: hotel.created_at, reverse=True)
        active = [hotel for hotel in hotels if hotel.is_active]
        return active or hotels

    def _listing_hotel(self, user):
        owned = self._owned_hotels(user)
        if owned:
            return owned[0]
        if user.hotel_id:
            try:
                return user.hotel
            except Hotel.DoesNotExist:
                return None
        return None

    def get_hotel_name(self, user):
        hotel = self._listing_hotel(user)
        return hotel.name if hotel else user.application_hotel_name

    def get_hotel_city(self, user):
        hotel = self._listing_hotel(user)
        return hotel.city if hotel else user.application_city

    def get_hotel_address(self, user):
        hotel = self._listing_hotel(user)
        return hotel.address if hotel else user.application_address

    def get_owned_hotels(self, user):
        return [
            {'id': hotel.id, 'name': hotel.name, 'city': hotel.city}
            for hotel in self._owned_hotels(user)
        ]

    class Meta:
        model = UserProfile
        fields = [
            'id', 'name', 'email', 'phone', 'role', 'vendor_status', 'hotel',
            'hotel_name', 'hotel_city', 'hotel_address', 'owned_hotels',
            'application_hotel_name',
            'application_city', 'application_address', 'application_total_rooms',
            'is_email_verified', 'created_at'
        ]


class AdminUserListSerializer(UserProfileSerializer):
    booking_count = serializers.IntegerField(read_only=True)

    class Meta(UserProfileSerializer.Meta):
        fields = UserProfileSerializer.Meta.fields + ['booking_count']

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


class PartnerHotelWriteSerializer(serializers.ModelSerializer):
    price_per_night = serializers.IntegerField(min_value=1)
    original_price = serializers.IntegerField(required=False, allow_null=True, min_value=0)

    class Meta:
        model = Hotel
        fields = [
            'name', 'city', 'destination', 'address', 'star_rating',
            'rating_score', 'review_count', 'price_per_night', 'original_price',
            'main_image', 'gallery_images', 'amenities', 'description',
            'is_featured', 'commission_percent',
        ]
        extra_kwargs = {
            'destination': {'required': False, 'allow_blank': True},
            'description': {'required': False, 'allow_blank': True},
            'main_image': {'required': True, 'allow_blank': False},
            'gallery_images': {'required': False},
            'amenities': {'required': False},
            'original_price': {'required': False},
            'rating_score': {'required': False},
            'review_count': {'required': False},
            'star_rating': {'required': False},
            'commission_percent': {'required': False},
            'is_featured': {'required': False},
        }

    def validate_original_price(self, value):
        if value in (None, ''):
            return 0
        return int(value)

    def validate(self, attrs):
        if not attrs.get('original_price'):
            attrs['original_price'] = int(attrs.get('price_per_night') or 0)
        if not attrs.get('destination'):
            attrs['destination'] = attrs.get('city') or ''
        if not (attrs.get('description') or '').strip():
            attrs['description'] = f"Welcome to {attrs.get('name', 'our property')}."
        return attrs

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
