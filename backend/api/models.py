from django.db import models

class Hotel(models.Model):
    name = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    destination = models.CharField(max_length=100) # e.g. Goa, Dubai, Manali, Paris, Singapore
    address = models.TextField()
    star_rating = models.IntegerField(default=4)
    rating_score = models.FloatField(default=4.8)
    review_count = models.IntegerField(default=120)
    price_per_night = models.IntegerField()
    original_price = models.IntegerField()
    main_image = models.TextField()
    gallery_images = models.JSONField(default=list)
    amenities = models.JSONField(default=list) # e.g. ["WiFi", "Pool", "Spa", "Breakfast", "AC"]
    description = models.TextField()
    is_featured = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    commission_percent = models.FloatField(default=10.0)  # Platform commission % per hotel (editable)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.city}"

class Room(models.Model):
    STATUS_CHOICES = [
        ('ACTIVE', 'Active & Bookable'),
        ('INACTIVE', 'Inactive / Hidden'),
        ('BLOCKED', 'Blocked / Maintenance'),
    ]

    hotel = models.ForeignKey(Hotel, related_name='rooms', on_delete=models.CASCADE)
    room_type = models.CharField(max_length=100) # Standard, Deluxe, Executive Suite, Presidential Suite
    price_per_night = models.IntegerField()
    max_guests = models.IntegerField(default=2)
    bed_type = models.CharField(max_length=50, default="1 King Bed")
    inclusions = models.JSONField(default=list)
    available_count = models.IntegerField(default=5) # Real-time available count
    total_rooms = models.IntegerField(default=10) # Total room inventory capacity
    blocked_rooms = models.IntegerField(default=0) # Manually blocked count
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    image_url = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.hotel.name} - {self.room_type}"

class UserProfile(models.Model):
    ROLE_CHOICES = [
        ('CUSTOMER', 'Customer'),
        ('VENDOR', 'Hotel Partner / Vendor'),
        ('ADMIN', 'Admin'),
    ]

    VENDOR_STATUS_CHOICES = [
        ('PENDING', 'Pending Admin Approval'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    ]

    name = models.CharField(max_length=200)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=50, blank=True, default='')
    password = models.CharField(max_length=255)
    is_email_verified = models.BooleanField(default=False)
    email_otp_hash = models.CharField(max_length=128, blank=True, default='')
    email_otp_expires_at = models.DateTimeField(null=True, blank=True)
    auth_token = models.CharField(max_length=128, blank=True, default='')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='CUSTOMER')
    vendor_status = models.CharField(max_length=20, choices=VENDOR_STATUS_CHOICES, default='PENDING')
    hotel = models.ForeignKey(Hotel, on_delete=models.SET_NULL, null=True, blank=True, related_name='vendors')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.role}) - {self.email}"

class Booking(models.Model):
    PAYMENT_MODES = [
        ('UPI', 'UPI Payment'),
        ('CARD', 'Credit/Debit Card'),
        ('NETBANKING', 'Net Banking'),
        ('PAY_AT_HOTEL', 'Pay at Hotel'),
    ]

    STATUS_CHOICES = [
        ('PENDING', 'Pending Confirmation'),
        ('CONFIRMED', 'Confirmed'),
        ('CHECKED_IN', 'Checked In'),
        ('COMPLETED', 'Completed'),
        ('CUSTOMER_CANCELLED', 'Cancelled by Guest'),
        ('PARTNER_CANCELLED', 'Cancelled by Hotel Partner'),
    ]

    PAYOUT_STATUS_CHOICES = [
        ('PENDING', 'Pending Payout'),
        ('PROCESSED', 'Payout Processed'),
        ('TRANSFERRED', 'Transferred to Bank'),
    ]

    booking_id = models.CharField(max_length=50, unique=True)
    guest_name = models.CharField(max_length=200)
    guest_email = models.CharField(max_length=200)
    guest_phone = models.CharField(max_length=50)
    user = models.ForeignKey(UserProfile, on_delete=models.SET_NULL, null=True, blank=True, related_name='bookings')
    hotel = models.ForeignKey(Hotel, on_delete=models.CASCADE)
    room = models.ForeignKey(Room, on_delete=models.CASCADE)
    check_in = models.DateField()
    check_out = models.DateField()
    rooms_count = models.IntegerField(default=1)
    guests_count = models.IntegerField(default=2)
    total_price = models.IntegerField()
    discount_amount = models.IntegerField(default=0)
    coupon_code = models.CharField(max_length=50, blank=True, default='')
    payment_mode = models.CharField(max_length=50, choices=PAYMENT_MODES, default='UPI')
    payment_status = models.CharField(max_length=50, default='SUCCESS')
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='CONFIRMED')
    commission_rate = models.FloatField(default=10.0) # 10% platform commission snapshot
    commission_amount = models.IntegerField(default=0) # Rupee amount retained by TRUMITRIP
    net_partner_payout = models.IntegerField(default=0) # Rupee amount payable to hotel partner
    payout_status = models.CharField(max_length=30, choices=PAYOUT_STATUS_CHOICES, default='PENDING')
    razorpay_order_id = models.CharField(max_length=100, blank=True, default='')  # Razorpay order ID
    razorpay_payment_id = models.CharField(max_length=100, blank=True, default='')  # Razorpay payment ID
    razorpay_signature = models.CharField(max_length=256, blank=True, default='')  # Razorpay signature
    special_requests = models.TextField(blank=True, default='')
    # Email confirmation tracking
    email_sent = models.BooleanField(default=False)
    email_sent_at = models.DateTimeField(null=True, blank=True)
    email_attempts = models.IntegerField(default=0)
    # Price snapshot — nights fixed at booking time so later room price changes don't alter voucher
    nights = models.IntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.booking_id} - {self.guest_name} ({self.status})"

class Coupon(models.Model):
    code = models.CharField(max_length=50, unique=True)
    discount_percent = models.IntegerField()
    max_discount = models.IntegerField(default=2000)
    min_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.code} ({self.discount_percent}%)"

class Review(models.Model):
    hotel = models.ForeignKey(Hotel, related_name='reviews', on_delete=models.CASCADE)
    guest_name = models.CharField(max_length=100)
    rating = models.FloatField()
    comment = models.TextField()
    date = models.DateField(auto_now_add=True)

    def __str__(self):
        return f"{self.guest_name} - {self.hotel.name} ({self.rating} stars)"
