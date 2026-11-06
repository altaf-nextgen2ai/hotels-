import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'trumitrip_backend.settings')
django.setup()

from api.models import Hotel, Room, Booking, Coupon, Review, UserProfile

def seed_database():
    print("Clearing existing data...")
    UserProfile.objects.all().delete()
    Review.objects.all().delete()
    Booking.objects.all().delete()
    Room.objects.all().delete()
    Hotel.objects.all().delete()
    Coupon.objects.all().delete()

    print("Creating coupons...")
    Coupon.objects.create(code='TRUMI10', discount_percent=10, max_discount=1500, min_order=2000)
    Coupon.objects.create(code='LUXURY25', discount_percent=25, max_discount=4000, min_order=5000)
    Coupon.objects.create(code='WELCOME20', discount_percent=20, max_discount=2500, min_order=3000)
    Coupon.objects.create(code='SUMMER50', discount_percent=15, max_discount=3000, min_order=4000)

    hotels_data = [
        {
            "name": "Taj Exotica Resort & Spa, Benaulim",
            "city": "Goa",
            "destination": "Goa",
            "address": "Calwaddo, Benaulim Beach, South Goa 403716",
            "star_rating": 5,
            "rating_score": 4.9,
            "review_count": 1240,
            "price_per_night": 12999,
            "original_price": 18500,
            "main_image": "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
            "gallery_images": [
                "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80"
            ],
            "amenities": ["WiFi", "Pool", "Spa", "Breakfast", "AC", "Ocean View", "Gym", "Parking"],
            "description": "Embraced by 56 acres of lush gardens along the pristine Benaulim coast, Taj Exotica Resort & Spa offers Mediterranean-style luxury villas.",
            "is_featured": True,
            "rooms": [
                {
                    "room_type": "Deluxe Sea View Room",
                    "price_per_night": 12999,
                    "max_guests": 2,
                    "bed_type": "1 King Bed",
                    "inclusions": ["Free Breakfast", "Free Cancellation", "High Speed WiFi"],
                    "available_count": 8,
                    "image_url": "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=600&q=80"
                }
            ],
            "reviews": [
                {"guest_name": "Vikram Malhotra", "rating": 5.0, "comment": "Absolute paradise! Beautiful ocean views."}
            ]
        },
        {
            "name": "Atlantis, The Palm",
            "city": "Dubai",
            "destination": "Dubai",
            "address": "Crescent Road, Palm Jumeirah, Dubai, United Arab Emirates",
            "star_rating": 5,
            "rating_score": 4.9,
            "review_count": 3890,
            "price_per_night": 28500,
            "original_price": 36000,
            "main_image": "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80",
            "gallery_images": ["https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80"],
            "amenities": ["WiFi", "Pool", "Spa", "Breakfast", "AC", "Ocean View"],
            "description": "Situated on Dubai's iconic Palm Jumeirah island, Atlantis features underwater suites.",
            "is_featured": True,
            "rooms": [
                {
                    "room_type": "Ocean King Room",
                    "price_per_night": 28500,
                    "max_guests": 2,
                    "bed_type": "1 Extra-Large King Bed",
                    "inclusions": ["Unlimited Waterpark Pass", "Free Breakfast"],
                    "available_count": 12,
                    "image_url": "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80"
                }
            ],
            "reviews": [
                {"guest_name": "Rahul Verma", "rating": 5.0, "comment": "Unbelievable experience in Dubai!"}
            ]
        }
    ]

    created_hotels = []
    for item in hotels_data:
        rooms_data = item.pop("rooms")
        reviews_data = item.pop("reviews")
        hotel = Hotel.objects.create(**item)
        created_hotels.append(hotel)

        for r_data in rooms_data:
            Room.objects.create(hotel=hotel, **r_data)

        for rev in reviews_data:
            Review.objects.create(hotel=hotel, **rev)

    # Seed Admin and Vendors
    print("Creating default Admin & Hotel Partner (Vendor) user accounts...")
    if created_hotels:
        UserProfile.objects.create(
            name="Taj Exotica Manager",
            email="vendor@tajexotica.com",
            phone="+91 9888877777",
            password="vendor123",
            role="VENDOR",
            hotel=created_hotels[0]
        )
        if len(created_hotels) > 1:
            UserProfile.objects.create(
                name="Atlantis Palm Partner",
                email="vendor@atlantis.com",
                phone="+971 501234567",
                password="vendor123",
                role="VENDOR",
                hotel=created_hotels[1]
            )

    print(f"Database seeded with {Hotel.objects.count()} hotels and {UserProfile.objects.count()} user profiles!")

if __name__ == '__main__':
    seed_database()
