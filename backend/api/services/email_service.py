"""
Email Confirmation Service
Sends a booking confirmation email with the PDF voucher attached.
Idempotent — if email_sent=True, does nothing (prevents duplicate sends).
Logs attempts and failures without exposing sensitive data.
"""

import logging
from django.core.mail import EmailMessage, send_mail
from django.conf import settings
from django.utils import timezone

from .pdf_service import generate_booking_pdf

logger = logging.getLogger(__name__)


def send_vendor_account_email(vendor, status=None) -> bool:
    """Send an email to a vendor after account creation or approval update."""
    recipient = (getattr(vendor, 'email', '') or '').strip()
    if not recipient or '@' not in recipient:
        logger.warning('Vendor account email not sent because no valid recipient was found.')
        return False

    status_value = (status or getattr(vendor, 'vendor_status', 'PENDING') or 'PENDING').upper()
    if status_value == 'APPROVED':
        subject = 'Your TRUMITRIP vendor account has been approved'
        body = (
            f"Dear {getattr(vendor, 'name', 'Vendor')},\n\n"
            "Congratulations! Your TRUMITRIP vendor account has been approved.\n"
            "You can now log in to your hotel partner dashboard and manage rooms, pricing, and bookings.\n\n"
            f"Login email: {recipient}\n\n"
            "Thank you for partnering with TRUMITRIP.\n\n"
            "Best regards,\n"
            "The TRUMITRIP Team"
        )
    elif status_value == 'REJECTED':
        subject = 'Your TRUMITRIP vendor application update'
        body = (
            f"Dear {getattr(vendor, 'name', 'Vendor')},\n\n"
            "Thank you for applying to join TRUMITRIP as a hotel partner.\n"
            "After review, we have not approved your application at this time.\n\n"
            "Please contact our partner support team if you need assistance with re-submission.\n\n"
            "Best regards,\n"
            "The TRUMITRIP Team"
        )
    else:
        subject = 'TRUMITRIP vendor registration received'
        body = (
            f"Dear {getattr(vendor, 'name', 'Vendor')},\n\n"
            "Thank you for registering as a TRUMITRIP hotel partner.\n"
            "Your application has been received and is currently under review by our team.\n\n"
            "We will reach out once your account is approved.\n\n"
            f"Login email: {recipient}\n\n"
            "Best regards,\n"
            "The TRUMITRIP Team"
        )

    try:
        send_mail(subject, body, settings.DEFAULT_FROM_EMAIL, [recipient], fail_silently=False)
        logger.info('Vendor confirmation email sent to %s', recipient)
        return True
    except Exception as exc:
        logger.error('Failed to send vendor account email to %s: %s', recipient, type(exc).__name__)
        return False


def send_booking_confirmation(booking) -> bool:
    """
    Generate the PDF voucher and email it to the guest.

    Returns True if email was sent (or already sent), False if it failed.
    The booking status is NEVER changed here — this is purely a notification.
    """

    # ── Idempotency guard ─────────────────────────────────────────────────────
    if booking.email_sent:
        logger.info(
            "Confirmation email already sent for booking %s — skipping.",
            booking.booking_id,
        )
        return True

    # ── Validate recipient ────────────────────────────────────────────────────
    recipient = (booking.guest_email or '').strip()
    if not recipient or '@' not in recipient:
        logger.warning(
            "Booking %s has no valid guest email — cannot send confirmation.",
            booking.booking_id,
        )
        return False

    # ── Generate PDF ──────────────────────────────────────────────────────────
    try:
        pdf_bytes = generate_booking_pdf(booking)
    except Exception as exc:
        logger.error(
            "PDF generation failed for booking %s: %s",
            booking.booking_id, type(exc).__name__,
        )
        # Increment attempt counter even on PDF failure
        booking.email_attempts = (booking.email_attempts or 0) + 1
        booking.save(update_fields=['email_attempts'])
        return False

    # ── Build email ───────────────────────────────────────────────────────────
    subject = f"Booking Confirmed — {booking.booking_id} | Trumitrip"

    hotel_name = booking.hotel.name if booking.hotel_id else "your hotel"
    check_in   = booking.check_in
    check_out  = booking.check_out
    nights     = booking.nights or 1

    body = f"""Dear {booking.guest_name},

Your hotel booking has been confirmed. Please find your booking voucher attached to this email.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  BOOKING REFERENCE : {booking.booking_id}
  HOTEL             : {hotel_name}
  CHECK-IN          : {check_in}
  CHECK-OUT         : {check_out}
  DURATION          : {nights} Night{'s' if nights != 1 else ''}
  TOTAL PAID        : ₹{booking.total_price:,}
  PAYMENT STATUS    : {booking.payment_status}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Please carry this voucher (printed or on your phone) and a valid photo ID at check-in.

For any assistance, contact us:
• Toll Free : 1800-270-0297
• WhatsApp  : +91 8470009000
• Email     : support@trumitrip.com

Thank you for choosing Trumitrip!

Best regards,
The Trumitrip Team
www.trumitrip.com
"""

    filename = f"Trumitrip_Voucher_{booking.booking_id}.pdf"

    email_msg = EmailMessage(
        subject=subject,
        body=body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[recipient],
    )
    email_msg.attach(filename, pdf_bytes, 'application/pdf')

    # ── Send ──────────────────────────────────────────────────────────────────
    try:
        email_msg.send(fail_silently=False)

        # Mark as sent — only after a successful send()
        booking.email_sent       = True
        booking.email_sent_at    = timezone.now()
        booking.email_attempts   = (booking.email_attempts or 0) + 1
        booking.save(update_fields=['email_sent', 'email_sent_at', 'email_attempts'])

        logger.info(
            "Confirmation email sent for booking %s to ***@%s",
            booking.booking_id,
            recipient.split('@')[-1],
        )
        return True

    except Exception as exc:
        booking.email_attempts = (booking.email_attempts or 0) + 1
        booking.save(update_fields=['email_attempts'])

        logger.error(
            "Failed to send confirmation email for booking %s: %s",
            booking.booking_id, type(exc).__name__,
        )
        return False
