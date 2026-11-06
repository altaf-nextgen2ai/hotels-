"""
Email Confirmation Service
Sends a booking confirmation email with the PDF voucher attached.
Idempotent — if email_sent=True, does nothing (prevents duplicate sends).
Logs attempts and failures without exposing sensitive data.
"""

import logging
from django.contrib.auth import get_user_model
from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from django.db.models import Q
from django.utils.html import escape
from django.utils import timezone

from .pdf_service import generate_booking_pdf
from .email_templates import render_email, SUPPORT_EMAIL, SUPPORT_PHONE

logger = logging.getLogger(__name__)


def _site_url(path=''):
    base = getattr(settings, 'SITE_BASE_URL', 'https://www.trumitrip.com').rstrip('/')
    if not path:
        return base
    return f'{base}{path if path.startswith("/") else f"/{path}"}'


def send_branded_email(subject, plain_body, html_body, recipients):
    cleaned = [r.strip() for r in recipients if r and '@' in str(r)]
    if not cleaned:
        return False
    try:
        message = EmailMultiAlternatives(
            subject=subject,
            body=plain_body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=cleaned,
        )
        message.attach_alternative(html_body, 'text/html')
        sent = message.send(fail_silently=False)
        return bool(sent)
    except Exception as exc:
        logger.error('Branded email failed (%s): %s', subject, type(exc).__name__)
        return False


def send_vendor_account_email(vendor, status=None) -> bool:
    """Send an email to a vendor after account creation or approval update."""
    recipient = (getattr(vendor, 'email', '') or '').strip()
    if not recipient or '@' not in recipient:
        logger.warning('Vendor account email not sent because no valid recipient was found.')
        return False

    name = getattr(vendor, 'name', 'Partner') or 'Partner'
    status_value = (status or getattr(vendor, 'vendor_status', 'PENDING') or 'PENDING').upper()
    partner_login = _site_url('/vendor-login')
    become_partner = _site_url('/become-partner')
    property_name = vendor.application_hotel_name or 'Link property in dashboard'
    if vendor.hotel_id and getattr(vendor, 'hotel', None):
        property_name = vendor.hotel.name
    property_city = vendor.application_city or (vendor.hotel.city if vendor.hotel_id and getattr(vendor, 'hotel', None) else '—')

    if status_value == 'APPROVED':
        subject = 'Your TRUMITRIP partner account is approved'
        plain = (
            f"Dear {name},\n\n"
            "Congratulations! Your TRUMITRIP hotel partner account has been approved.\n"
            "You can now sign in to the Partner Portal to manage your property, rooms, pricing, and bookings.\n\n"
            f"Sign in: {partner_login}\n"
            f"Login email: {recipient}\n"
            "Password: Use the password you created when you applied. We never send passwords by email.\n\n"
            f"Assigned property: {property_name}\n"
            "Platform commission: 10% · Partner payout: 90%\n\n"
            f"Support: {SUPPORT_PHONE} · {SUPPORT_EMAIL}\n\n"
            "Best regards,\nThe TRUMITRIP Team"
        )
        html = render_email(
            title='Partner account approved',
            intro_paragraphs=[
                f'Dear <strong>{escape(name)}</strong>,',
                'Congratulations — your hotel partner application on <strong>TRUMITRIP</strong> has been <strong>approved</strong>. '
                'You can now access the Partner Portal to complete your listing and manage bookings.',
            ],
            detail_rows=[
                ('Login email', recipient),
                ('Partner portal', partner_login),
                ('Property', property_name),
                ('City', property_city),
                ('Commission', '10% platform fee · 90% partner payout'),
            ],
            highlight_html=(
                'Use the password you set during registration. For security, TRUMITRIP never emails passwords.'
            ),
            cta_label='Open Partner Portal',
            cta_url=partner_login,
        )
    elif status_value == 'REJECTED':
        subject = 'Update on your TRUMITRIP partner application'
        plain = (
            f"Dear {name},\n\n"
            "Thank you for applying to join TRUMITRIP as a hotel partner.\n"
            "After review, we are unable to approve your application at this time.\n\n"
            f"For assistance, contact {SUPPORT_EMAIL} or call {SUPPORT_PHONE}.\n\n"
            "Best regards,\nThe TRUMITRIP Team"
        )
        html = render_email(
            title='Application update',
            intro_paragraphs=[
                f'Dear <strong>{escape(name)}</strong>,',
                'Thank you for your interest in partnering with TRUMITRIP.',
                'After reviewing your submission, we are unable to approve your application at this time.',
            ],
            detail_rows=[
                ('Property applied', vendor.application_hotel_name or '—'),
                ('City', vendor.application_city or '—'),
            ],
            highlight_html=f'Questions? Email <a href="mailto:{SUPPORT_EMAIL}" style="color:#92400e;font-weight:700;">{SUPPORT_EMAIL}</a> or call {SUPPORT_PHONE}.',
            cta_label='Contact support',
            cta_url=f'mailto:{SUPPORT_EMAIL}',
        )
    else:
        subject = 'TRUMITRIP partner application received'
        plain = (
            f"Dear {name},\n\n"
            "Thank you for applying to become a TRUMITRIP hotel partner. We have received your application and our team will review it shortly.\n\n"
            f"Property: {vendor.application_hotel_name or '—'}\n"
            f"City: {vendor.application_city or '—'}\n\n"
            "We will email you when a decision is made. The Partner Portal unlocks after approval.\n\n"
            "Best regards,\nThe TRUMITRIP Team"
        )
        html = render_email(
            title='Application received',
            intro_paragraphs=[
                f'Dear <strong>{escape(name)}</strong>,',
                'Thank you for registering as a TRUMITRIP hotel partner. Your application is now with our verification team.',
            ],
            detail_rows=[
                ('Property', vendor.application_hotel_name or '—'),
                ('City / region', vendor.application_city or '—'),
                ('Address', vendor.application_address or 'Not provided'),
                ('Room capacity', vendor.application_total_rooms or 'Not provided'),
                ('Status', 'Pending admin review'),
            ],
            highlight_html='You will receive another email once your application is approved or updated.',
            cta_label='View partner program',
            cta_url=become_partner,
        )

    try:
        sent = send_branded_email(subject, plain, html, [recipient])
        if sent:
            logger.info('Vendor confirmation email sent to %s', recipient)
        return sent
    except Exception as exc:
        logger.error('Failed to send vendor account email to %s: %s', recipient, type(exc).__name__)
        return False


def send_vendor_application_admin_email(vendor) -> bool:
    """Notify active Django superusers about a new vendor application."""
    user_model = get_user_model()
    recipients = list(
        user_model.objects.filter(is_active=True, is_superuser=True)
        .exclude(email='')
        .values_list('email', flat=True)
    )
    if not recipients:
        logger.warning('Vendor application notification email not sent because no active superuser email is configured.')
        return False

    subject = f'New partner application · {vendor.application_hotel_name or vendor.name}'
    admin_panel = _site_url('/admin')
    plain = (
        "A new TRUMITRIP hotel partner application requires review.\n\n"
        f"Applicant: {vendor.name}\n"
        f"Email: {vendor.email}\n"
        f"Phone: {vendor.phone or 'Not provided'}\n"
        f"Property: {vendor.application_hotel_name}\n"
        f"City: {vendor.application_city}\n"
        f"Address: {vendor.application_address or 'Not provided'}\n"
        f"Rooms: {vendor.application_total_rooms or 'Not provided'}\n\n"
        f"Review in admin panel: {admin_panel}\n"
        "Passwords are never included in admin notifications.\n"
    )
    html = render_email(
        title='New partner application',
        intro_paragraphs=[
            'A new hotel partner application has been submitted on <strong>TRUMITRIP</strong> and is awaiting admin review.',
        ],
        detail_rows=[
            ('Applicant', vendor.name),
            ('Email', vendor.email),
            ('Phone', vendor.phone or 'Not provided'),
            ('Property', vendor.application_hotel_name),
            ('City / region', vendor.application_city),
            ('Address', vendor.application_address or 'Not provided'),
            ('Room capacity', vendor.application_total_rooms or 'Not provided'),
        ],
        highlight_html='Approve or reject the vendor from the TRUMITRIP admin panel. Do not share passwords by email.',
        cta_label='Open admin panel',
        cta_url=admin_panel,
    )

    try:
        sent = send_branded_email(subject, plain, html, recipients)
        if sent:
            logger.info('Vendor application notification sent to %d admin recipient(s).', len(recipients))
        return sent
    except Exception as exc:
        logger.error('Failed to send vendor application notification: %s', type(exc).__name__)
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
    subject = f"Booking confirmed | {booking.booking_id} | Trumitrip"

    hotel_name = booking.hotel.name if booking.hotel_id else "your hotel"
    check_in   = booking.check_in
    check_out  = booking.check_out
    nights     = booking.nights or 1

    body = f"""Dear {booking.guest_name},

Your booking is confirmed. Your voucher is attached.

Booking reference: {booking.booking_id}
Hotel: {hotel_name}
Check-in: {check_in}
Check-out: {check_out}
Stay: {nights} night{'s' if nights != 1 else ''}
Amount paid: ₹{booking.total_price:,}
Payment status: {booking.payment_status}

Please show the attached voucher and a valid photo ID at check-in.

Need help? Call or WhatsApp us at 8447151225, or email support@trumitrip.com.

Thank you for choosing Trumitrip.
The Trumitrip Team
"""

    filename = f"Trumitrip_Voucher_{booking.booking_id}.pdf"

    html = render_email(
        title='Booking confirmed',
        intro_paragraphs=[
            f'Dear <strong>{escape(booking.guest_name)}</strong>,',
            f'Your stay at <strong>{escape(hotel_name)}</strong> is confirmed. Your PDF voucher is attached to this email.',
        ],
        detail_rows=[
            ('Booking ID', booking.booking_id),
            ('Hotel', hotel_name),
            ('Check-in', check_in),
            ('Check-out', check_out),
            ('Nights', nights),
            ('Amount paid', f'₹{booking.total_price:,}'),
            ('Payment status', booking.payment_status),
        ],
        highlight_html='Please show the attached voucher and a valid photo ID at check-in.',
    )

    email_msg = EmailMultiAlternatives(
        subject=subject,
        body=body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[recipient],
    )
    email_msg.attach_alternative(html, 'text/html')
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

        logger.exception(
            "Failed to send confirmation email for booking %s (%s: %s)",
            booking.booking_id,
            type(exc).__name__,
            str(exc)[:240],
        )
        return False


def send_booking_notifications(booking) -> dict:
    """Send booking confirmation and independent notifications to its vendor and admins."""
    from django.contrib.auth import get_user_model

    from ..models import UserProfile

    delivery = {
        'guest': send_booking_confirmation(booking),
        'vendor_count': 0,
        'vendor_failed_count': 0,
        'admin_count': 0,
        'admin_failed_count': 0,
    }
    hotel = booking.hotel
    nights = booking.nights or 1
    subject = f"New Booking Received — {booking.booking_id} | Trumitrip"
    body = f"""A new booking has been confirmed on Trumitrip.

Booking ID: {booking.booking_id}
Hotel: {hotel.name}, {hotel.city}
Guest: {booking.guest_name}
Guest email: {booking.guest_email}
Guest phone: {booking.guest_phone}
Check-in: {booking.check_in}
Check-out: {booking.check_out}
Nights: {nights}
Rooms: {booking.rooms_count}
Guests: {booking.guests_count}
Total paid: ₹{booking.total_price:,}
Partner payout: ₹{booking.net_partner_payout:,}
Payment mode: {booking.payment_mode}

Please sign in to your Trumitrip dashboard to manage this booking.

Best regards,
Trumitrip Platform
"""

    vendor_emails = set(
        UserProfile.objects.filter(role='VENDOR')
        .filter(
            Q(hotel=hotel) |
            Q(
                hotel__isnull=True,
                vendor_status='APPROVED',
                application_hotel_name__iexact=hotel.name,
                application_city__iexact=hotel.city,
            )
        )
        .exclude(email='')
        .values_list('email', flat=True)
    )
    admin_emails = set(
        UserProfile.objects.filter(role='ADMIN')
        .exclude(email='')
        .values_list('email', flat=True)
    )
    admin_emails.update(
        get_user_model().objects.filter(is_active=True, is_superuser=True)
        .exclude(email='')
        .values_list('email', flat=True)
    )
    if settings.ADMIN_NOTIFICATION_EMAIL:
        admin_emails.add(settings.ADMIN_NOTIFICATION_EMAIL)
    admin_emails.difference_update(vendor_emails)

    for recipient_type, recipients in (('vendor', vendor_emails), ('admin', admin_emails)):
        ops_html = render_email(
            title='New booking received',
            intro_paragraphs=[
                'A new booking has been confirmed on <strong>TRUMITRIP</strong>.',
            ],
            detail_rows=[
                ('Booking ID', booking.booking_id),
                ('Hotel', f'{hotel.name}, {hotel.city}'),
                ('Guest', booking.guest_name),
                ('Guest email', booking.guest_email),
                ('Guest phone', booking.guest_phone),
                ('Check-in', booking.check_in),
                ('Check-out', booking.check_out),
                ('Total paid', f'₹{booking.total_price:,}'),
                ('Partner payout', f'₹{booking.net_partner_payout:,}'),
            ],
            cta_label='Open dashboard',
            cta_url=_site_url('/partner' if recipient_type == 'vendor' else '/admin'),
        )
        for recipient in recipients:
            try:
                sent = send_branded_email(subject, body, ops_html, [recipient])
                if sent:
                    delivery[f'{recipient_type}_count'] += 1
                    logger.info(
                        'Booking notification sent for booking %s to %s recipient (domain: %s).',
                        booking.booking_id,
                        recipient_type,
                        recipient.rsplit('@', 1)[-1],
                    )
                else:
                    delivery[f'{recipient_type}_failed_count'] += 1
                    logger.error(
                        'Booking notification was not accepted for booking %s (%s recipient, domain: %s).',
                        booking.booking_id,
                        recipient_type,
                        recipient.rsplit('@', 1)[-1],
                    )
            except Exception as exc:
                delivery[f'{recipient_type}_failed_count'] += 1
                logger.exception(
                    'Failed to send booking notification for booking %s (%s recipient, domain: %s; %s: %s)',
                    booking.booking_id,
                    recipient_type,
                    recipient.rsplit('@', 1)[-1],
                    type(exc).__name__,
                    str(exc)[:240],
                )

    if not vendor_emails:
        logger.warning(
            'No vendor notification sent for booking %s; no vendor account is assigned to hotel %s.',
            booking.booking_id,
            hotel.id,
        )
    if not admin_emails:
        logger.warning(
            'No admin notification sent for booking %s; configure an admin profile or an active Django superuser email.',
            booking.booking_id,
        )

    return delivery


def send_booking_cancellation_notifications(booking) -> dict:
    """Notify the guest, assigned vendor, and admins after cancellation is recorded."""
    from ..models import UserProfile

    if booking.refund_amount and booking.refund_status == 'PENDING':
        if booking.cancellation_fee:
            refund_line = (
                f"Refund of ₹{booking.refund_amount:,} will be processed after a 10% cancellation fee "
                f"(₹{booking.cancellation_fee:,}). You should receive it within 2 to 5 working days on your "
                "original payment method."
            )
        else:
            refund_line = (
                f"Full refund of ₹{booking.refund_amount:,} will be credited within 2 to 5 working days on your "
                "original payment method."
            )
    elif booking.refund_amount and booking.refund_status == 'PROCESSED':
        refund_line = f"Refund of ₹{booking.refund_amount:,} has been processed."
    else:
        refund_line = "No refund is due for this booking."
    guest_subject = f"Booking cancelled | {booking.booking_id} | Trumitrip"
    refund_timing = (
        'Refund timeline: 2 to 5 working days after cancellation (bank/UPI processing may take extra time).'
        if booking.refund_amount and booking.refund_status == 'PENDING'
        else "Please allow your bank or payment provider time to reflect the refund."
        if booking.refund_amount and booking.refund_status == 'PROCESSED'
        else ""
    )
    guest_html = render_email(
        title='Booking cancelled',
        intro_paragraphs=[
            f'Dear <strong>{escape(booking.guest_name)}</strong>,',
            f'Your booking at <strong>{escape(booking.hotel.name)}</strong> has been cancelled.',
        ],
        detail_rows=[
            ('Booking ID', booking.booking_id),
            ('Check-in', booking.check_in),
            ('Amount paid', f'₹{booking.total_price:,}'),
            ('Cancellation fee', f'₹{booking.cancellation_fee:,}'),
            ('Refund (after 10% fee)', f'₹{booking.refund_amount:,}' if booking.refund_amount else 'Not applicable'),
        ],
        highlight_html=escape(refund_timing) if refund_timing else None,
    )
    guest_body = f"""Dear {booking.guest_name},

Your booking at {booking.hotel.name} has been cancelled.

Booking reference: {booking.booking_id}
Check-in: {booking.check_in}
Amount paid: ₹{booking.total_price:,}
Cancellation fee: ₹{booking.cancellation_fee:,}
{refund_line}

{refund_timing}
For help, call or WhatsApp 8447151225, or email {SUPPORT_EMAIL}.

The Trumitrip Team
"""
    delivery = {
        'guest': False,
        'vendor_count': 0,
        'vendor_failed_count': 0,
        'admin_count': 0,
        'admin_failed_count': 0,
    }

    recipients = []
    guest_email = (booking.guest_email or '').strip()
    if guest_email and '@' in guest_email:
        recipients.append(('guest', guest_email, guest_subject, guest_body, guest_html))
    else:
        logger.warning('Cancellation email not sent for booking %s: guest email is invalid.', booking.booking_id)

    vendor_emails = set(
        UserProfile.objects.filter(role='VENDOR', vendor_status='APPROVED')
        .filter(
            Q(hotel=booking.hotel) |
            Q(
                hotel__isnull=True,
                application_hotel_name__iexact=booking.hotel.name,
                application_city__iexact=booking.hotel.city,
            )
        )
        .exclude(email='')
        .values_list('email', flat=True)
    )
    admin_emails = set(
        UserProfile.objects.filter(role='ADMIN')
        .exclude(email='')
        .values_list('email', flat=True)
    )
    admin_emails.update(
        get_user_model().objects.filter(is_active=True, is_superuser=True)
        .exclude(email='')
        .values_list('email', flat=True)
    )
    if settings.ADMIN_NOTIFICATION_EMAIL:
        admin_emails.add(settings.ADMIN_NOTIFICATION_EMAIL)
    admin_emails.difference_update(vendor_emails)

    cancelled_by = 'Hotel partner' if booking.status == 'PARTNER_CANCELLED' else 'Customer'
    operations_body = f"""A booking was cancelled on TRUMITRIP.

Booking reference: {booking.booking_id}
Cancelled by: {cancelled_by}
Hotel: {booking.hotel.name}, {booking.hotel.city}
Guest: {booking.guest_name} ({booking.guest_email})
Check-in: {booking.check_in}
Amount paid: ₹{booking.total_price:,}
Cancellation fee: ₹{booking.cancellation_fee:,}
Refund amount: ₹{booking.refund_amount:,}
Refund status: {booking.refund_status}
Manual refund reference: {booking.refund_reference or 'Not yet processed'}

Review the booking in your TRUMITRIP dashboard.
"""
    operations_html = render_email(
        title='Booking cancelled',
        intro_paragraphs=[
            'A booking on <strong>TRUMITRIP</strong> has been cancelled.',
        ],
        detail_rows=[
            ('Booking ID', booking.booking_id),
            ('Cancelled by', cancelled_by),
            ('Hotel', f'{booking.hotel.name}, {booking.hotel.city}'),
            ('Guest', f'{booking.guest_name} ({booking.guest_email})'),
            ('Refund amount', f'₹{booking.refund_amount:,}'),
            ('Refund status', booking.refund_status),
        ],
    )
    recipients.extend(
        ('vendor', recipient, f"Booking cancelled | {booking.booking_id} | Trumitrip", operations_body, operations_html)
        for recipient in vendor_emails
    )
    recipients.extend(
        ('admin', recipient, f"Customer cancellation | {booking.booking_id} | Trumitrip", operations_body, operations_html)
        for recipient in admin_emails
    )

    for recipient_type, recipient, subject, body, html in recipients:
        try:
            sent = send_branded_email(subject, body, html, [recipient])
            if sent:
                if recipient_type == 'guest':
                    delivery['guest'] = True
                else:
                    delivery[f'{recipient_type}_count'] += 1
            else:
                if recipient_type != 'guest':
                    delivery[f'{recipient_type}_failed_count'] += 1
                logger.error(
                    'Cancellation email not accepted for booking %s (%s recipient).',
                    booking.booking_id,
                    recipient_type,
                )
        except Exception as exc:
            if recipient_type != 'guest':
                delivery[f'{recipient_type}_failed_count'] += 1
            logger.exception(
                'Cancellation email failed for booking %s (%s recipient, %s).',
                booking.booking_id,
                recipient_type,
                type(exc).__name__,
            )

    return delivery


def send_refund_processed_email(booking) -> bool:
    """Confirm to the guest that an administrator recorded the manual refund."""
    recipient = (booking.guest_email or '').strip()
    if not recipient or '@' not in recipient:
        logger.warning('Refund completion email not sent for booking %s: guest email is invalid.', booking.booking_id)
        return False
    body = f"""Dear {booking.guest_name},

The refund for your cancelled booking has been processed manually by our team.

Booking reference: {booking.booking_id}
Refund amount: ₹{booking.refund_amount:,}
Refund reference: {booking.refund_reference}

Please allow your bank or payment provider time to reflect the amount.
For help, call or WhatsApp 8447151225, or email support@trumitrip.com.

The Trumitrip Team
"""
    subject = f"Refund processed | {booking.booking_id} | Trumitrip"
    html = render_email(
        title='Refund processed',
        intro_paragraphs=[
            f'Dear <strong>{escape(booking.guest_name)}</strong>,',
            'The refund for your cancelled booking has been processed by our team.',
        ],
        detail_rows=[
            ('Booking ID', booking.booking_id),
            ('Refund amount', f'₹{booking.refund_amount:,}'),
            ('Refund reference', booking.refund_reference or '—'),
        ],
        highlight_html='Please allow your bank or payment provider time to reflect the amount.',
    )
    try:
        sent = send_branded_email(subject, body, html, [recipient])
        if not sent:
            logger.error('Refund completion email was not accepted for booking %s.', booking.booking_id)
            return False
        return True
    except Exception as exc:
        logger.exception(
            'Refund completion email failed for booking %s (%s).',
            booking.booking_id,
            type(exc).__name__,
        )
        return False
