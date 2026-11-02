"""
PDF Booking Voucher Generator
Uses ReportLab (already installed) to generate a professional A4 booking
confirmation PDF entirely from saved database values.
"""

import io
import logging
from datetime import date

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    HRFlowable,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

logger = logging.getLogger(__name__)

# ── Brand colours ─────────────────────────────────────────────────────────────
GOLD   = colors.HexColor('#D4AF37')
NAVY   = colors.HexColor('#0A192F')
DARK   = colors.HexColor('#1E293B')
LIGHT  = colors.HexColor('#F8FAFC')
GREEN  = colors.HexColor('#059669')
RED    = colors.HexColor('#DC2626')
GREY   = colors.HexColor('#64748B')
WHITE  = colors.white
BLACK  = colors.black

PAGE_W, PAGE_H = A4
MARGIN = 18 * mm


def _styles():
    base = getSampleStyleSheet()

    def ps(name, **kw):
        return ParagraphStyle(name, parent=base['Normal'], **kw)

    return {
        'company':    ps('company',    fontSize=22, textColor=GOLD,  fontName='Helvetica-Bold',
                         alignment=TA_LEFT, spaceAfter=0),
        'tagline':    ps('tagline',    fontSize=8,  textColor=GREY,  fontName='Helvetica',
                         alignment=TA_LEFT, spaceAfter=2),
        'stamp':      ps('stamp',      fontSize=11, textColor=WHITE, fontName='Helvetica-Bold',
                         alignment=TA_CENTER),
        'section_hd': ps('section_hd', fontSize=8,  textColor=GREY,  fontName='Helvetica-Bold',
                         spaceBefore=6, spaceAfter=2),
        'value_lg':   ps('value_lg',   fontSize=14, textColor=NAVY,  fontName='Helvetica-Bold',
                         spaceAfter=1),
        'value_sm':   ps('value_sm',   fontSize=9,  textColor=DARK,  fontName='Helvetica',
                         spaceAfter=1),
        'value_sm_b': ps('value_sm_b', fontSize=9,  textColor=DARK,  fontName='Helvetica-Bold',
                         spaceAfter=1),
        'label':      ps('label',      fontSize=7,  textColor=GREY,  fontName='Helvetica-Bold',
                         spaceAfter=0),
        'footer':     ps('footer',     fontSize=7,  textColor=GREY,  fontName='Helvetica',
                         alignment=TA_CENTER),
        'policy':     ps('policy',     fontSize=7.5, textColor=DARK, fontName='Helvetica',
                         spaceAfter=3, leading=11),
        'amount':     ps('amount',     fontSize=16, textColor=GREEN, fontName='Helvetica-Bold',
                         alignment=TA_RIGHT),
    }


def _nights_label(n):
    return f"{n} Night{'s' if n != 1 else ''}"


def _star_str(n):
    return '★' * min(int(n), 5)


def _fmt_inr(amount):
    try:
        return f"₹{int(amount):,}"
    except Exception:
        return f"₹{amount}"


def _payment_status_color(status):
    status = (status or '').upper()
    if status in ('SUCCESS', 'PAID', 'COMPLETED'):
        return GREEN
    if status in ('PENDING',):
        return colors.HexColor('#D97706')
    return RED


def generate_booking_pdf(booking) -> bytes:
    """
    Accept a Booking model instance (with .hotel and .room pre-fetched or
    accessible via FK), return the PDF as bytes.
    """
    hotel = booking.hotel
    room  = booking.room

    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=MARGIN,
        rightMargin=MARGIN,
        topMargin=12 * mm,
        bottomMargin=12 * mm,
        title=f"Booking Voucher {booking.booking_id}",
        author="Trumitrip",
    )

    S = _styles()
    story = []

    # ── HEADER BAR ──────────────────────────────────────────────────────────
    # Company name left, "BOOKING CONFIRMED" stamp right
    header_data = [[
        Paragraph('TRUMITRIP', S['company']),
        Paragraph('BOOKING CONFIRMED', S['stamp']),
    ]]
    header_table = Table(
        header_data,
        colWidths=[PAGE_W - 2 * MARGIN - 52 * mm, 52 * mm],
        rowHeights=[14 * mm],
    )
    header_table.setStyle(TableStyle([
        ('BACKGROUND', (1, 0), (1, 0), GREEN),
        ('VALIGN',     (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING',  (0, 0), (0, 0), 0),
        ('RIGHTPADDING', (1, 0), (1, 0), 4),
        ('TOPPADDING',   (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING',(0, 0), (-1, -1), 0),
        ('ROUNDEDCORNERS', (1, 0), (1, 0), [4]),
    ]))
    story.append(header_table)
    story.append(Paragraph('Luxury & Budget Hotel Booking Platform', S['tagline']))
    story.append(Spacer(1, 3 * mm))
    story.append(HRFlowable(width='100%', thickness=1.5, color=GOLD, spaceAfter=4 * mm))

    # ── BOOKING REFERENCE BOX ───────────────────────────────────────────────
    ref_data = [[
        [Paragraph('BOOKING REFERENCE', S['label']),
         Paragraph(booking.booking_id, S['value_lg'])],
        [Paragraph('BOOKING DATE', S['label']),
         Paragraph(booking.created_at.strftime('%d %b %Y') if booking.created_at else '—', S['value_sm_b'])],
        [Paragraph('STATUS', S['label']),
         Paragraph(booking.status.replace('_', ' '), S['value_sm_b'])],
    ]]
    ref_table = Table(ref_data, colWidths=[
        (PAGE_W - 2 * MARGIN) * 0.40,
        (PAGE_W - 2 * MARGIN) * 0.30,
        (PAGE_W - 2 * MARGIN) * 0.30,
    ])
    ref_table.setStyle(TableStyle([
        ('BACKGROUND',    (0, 0), (-1, -1), LIGHT),
        ('BOX',           (0, 0), (-1, -1), 0.5, GOLD),
        ('INNERGRID',     (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ('VALIGN',        (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING',    (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING',   (0, 0), (-1, -1), 8),
        ('RIGHTPADDING',  (0, 0), (-1, -1), 8),
    ]))
    story.append(ref_table)
    story.append(Spacer(1, 4 * mm))

    # ── HOTEL DETAILS ────────────────────────────────────────────────────────
    story.append(Paragraph('HOTEL DETAILS', S['section_hd']))
    story.append(HRFlowable(width='100%', thickness=0.5, color=colors.HexColor('#E2E8F0'), spaceAfter=3 * mm))

    stars = _star_str(hotel.star_rating)
    hotel_data = [[
        [Paragraph('HOTEL NAME', S['label']),
         Paragraph(f"{hotel.name}", S['value_sm_b']),
         Paragraph(f"{stars}  {hotel.star_rating}-Star Property", S['value_sm'])],
        [Paragraph('LOCATION', S['label']),
         Paragraph(hotel.city, S['value_sm_b']),
         Paragraph(hotel.address or hotel.destination or '', S['value_sm'])],
    ]]
    hotel_table = Table(hotel_data, colWidths=[
        (PAGE_W - 2 * MARGIN) * 0.5,
        (PAGE_W - 2 * MARGIN) * 0.5,
    ])
    hotel_table.setStyle(TableStyle([
        ('VALIGN',        (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING',    (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING',   (0, 0), (-1, -1), 0),
        ('RIGHTPADDING',  (0, 0), (-1, -1), 8),
    ]))
    story.append(hotel_table)
    story.append(Spacer(1, 3 * mm))

    # ── GUEST & STAY DETAILS ─────────────────────────────────────────────────
    story.append(Paragraph('GUEST & STAY DETAILS', S['section_hd']))
    story.append(HRFlowable(width='100%', thickness=0.5, color=colors.HexColor('#E2E8F0'), spaceAfter=3 * mm))

    nights_count = booking.nights or 1
    try:
        ci = booking.check_in.strftime('%d %b %Y') if isinstance(booking.check_in, date) else str(booking.check_in)
        co = booking.check_out.strftime('%d %b %Y') if isinstance(booking.check_out, date) else str(booking.check_out)
    except Exception:
        ci = str(booking.check_in)
        co = str(booking.check_out)

    stay_rows = [
        ['Lead Guest Name',  booking.guest_name or '—'],
        ['Email Address',    booking.guest_email or '—'],
        ['Mobile Number',    booking.guest_phone or '—'],
        ['Room Type',        room.room_type or '—'],
        ['Bed Configuration',room.bed_type or '—'],
        ['Check-In Date',    f"{ci}  (after 2:00 PM)"],
        ['Check-Out Date',   f"{co}  (before 12:00 PM)"],
        ['Duration',         _nights_label(nights_count)],
        ['Rooms Booked',     str(booking.rooms_count or 1)],
        ['Total Guests',     str(booking.guests_count or 1)],
    ]

    # Inclusions
    inclusions = room.inclusions or []
    if inclusions:
        stay_rows.append(['Inclusions', ' · '.join(inclusions) if isinstance(inclusions, list) else str(inclusions)])

    if booking.coupon_code:
        stay_rows.append(['Promo Code Applied', booking.coupon_code])

    if booking.special_requests and booking.special_requests.strip():
        stay_rows.append(['Special Requests', booking.special_requests.strip()])

    stay_table_data = []
    col_w = [(PAGE_W - 2 * MARGIN) * 0.35, (PAGE_W - 2 * MARGIN) * 0.65]
    for label, val in stay_rows:
        stay_table_data.append([
            Paragraph(label, S['label']),
            Paragraph(str(val), S['value_sm']),
        ])

    stay_table = Table(stay_table_data, colWidths=col_w)
    ts = TableStyle([
        ('BACKGROUND',    (0, 0), (-1, -1), WHITE),
        ('ROWBACKGROUNDS',(0, 0), (-1, -1), [LIGHT, WHITE]),
        ('VALIGN',        (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING',    (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING',   (0, 0), (-1, -1), 6),
        ('RIGHTPADDING',  (0, 0), (-1, -1), 6),
        ('BOX',           (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ('INNERGRID',     (0, 0), (-1, -1), 0.3, colors.HexColor('#F1F5F9')),
    ])
    stay_table.setStyle(ts)
    story.append(stay_table)
    story.append(Spacer(1, 4 * mm))

    # ── FARE BREAKDOWN ───────────────────────────────────────────────────────
    story.append(Paragraph('FARE BREAKDOWN', S['section_hd']))
    story.append(HRFlowable(width='100%', thickness=0.5, color=colors.HexColor('#E2E8F0'), spaceAfter=3 * mm))

    room_charge  = booking.total_price + booking.discount_amount
    # Back-calculate base and tax from the stored total
    # total = base_room + 18% tax - discount
    # We store total_price (after discount+tax). For display, split it out.
    try:
        discount = int(booking.discount_amount or 0)
        # room rate × nights × rooms (use snapshot)
        rate_snapshot = room.price_per_night * nights_count * (booking.rooms_count or 1)
        tax_amount    = round(rate_snapshot * 0.18)
        displayed_total = rate_snapshot + tax_amount - discount
        # If it doesn't match stored total, just show stored total as-is
        if displayed_total != booking.total_price:
            rate_snapshot = booking.total_price  # fallback
            tax_amount    = 0
            discount      = booking.discount_amount or 0
    except Exception:
        rate_snapshot = booking.total_price
        tax_amount    = 0
        discount      = 0

    fare_rows = [
        ['Room Charge', f'{booking.rooms_count or 1} Room × {_nights_label(nights_count)}',
         _fmt_inr(rate_snapshot)],
        ['GST & Hospitality Tax (18%)', '', _fmt_inr(tax_amount)],
    ]
    if discount:
        fare_rows.append(['Coupon Discount', f'({booking.coupon_code})', f'-{_fmt_inr(discount)}'])

    fare_rows.append(['TOTAL CHARGED', '', _fmt_inr(booking.total_price)])

    fare_col_w = [
        (PAGE_W - 2 * MARGIN) * 0.45,
        (PAGE_W - 2 * MARGIN) * 0.30,
        (PAGE_W - 2 * MARGIN) * 0.25,
    ]
    fare_table_data = []
    for i, (desc, sub, amt) in enumerate(fare_rows):
        is_total = i == len(fare_rows) - 1
        style_d = S['value_sm_b'] if is_total else S['value_sm']
        style_a = ParagraphStyle('fa', parent=S['value_sm_b'] if is_total else S['value_sm'],
                                 alignment=TA_RIGHT,
                                 textColor=GREEN if is_total else DARK)
        fare_table_data.append([
            Paragraph(desc, style_d),
            Paragraph(sub,  S['value_sm']),
            Paragraph(amt,  style_a),
        ])

    fare_table = Table(fare_table_data, colWidths=fare_col_w)
    fare_table.setStyle(TableStyle([
        ('BACKGROUND',    (0, 0), (-1, -2), WHITE),
        ('BACKGROUND',    (0, -1), (-1, -1), LIGHT),
        ('ROWBACKGROUNDS',(0, 0), (-1, -2), [LIGHT, WHITE]),
        ('TOPPADDING',    (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING',   (0, 0), (-1, -1), 6),
        ('RIGHTPADDING',  (0, 0), (-1, -1), 6),
        ('BOX',           (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ('INNERGRID',     (0, 0), (-1, -1), 0.3, colors.HexColor('#F1F5F9')),
        ('LINEABOVE',     (0, -1), (-1, -1), 1.5, GOLD),
    ]))
    story.append(fare_table)
    story.append(Spacer(1, 4 * mm))

    # ── PAYMENT DETAILS ──────────────────────────────────────────────────────
    story.append(Paragraph('PAYMENT DETAILS', S['section_hd']))
    story.append(HRFlowable(width='100%', thickness=0.5, color=colors.HexColor('#E2E8F0'), spaceAfter=3 * mm))

    pay_rows = [
        ['Payment Mode', booking.payment_mode.replace('_', ' ')],
        ['Payment Status', booking.payment_status],
    ]
    if booking.razorpay_payment_id:
        pay_rows.append(['Transaction Reference', booking.razorpay_payment_id])
    if booking.razorpay_order_id:
        pay_rows.append(['Razorpay Order ID', booking.razorpay_order_id])

    pay_table_data = []
    for label, val in pay_rows:
        is_status = label == 'Payment Status'
        val_style = ParagraphStyle(
            'pv',
            parent=S['value_sm'],
            textColor=_payment_status_color(val) if is_status else DARK,
            fontName='Helvetica-Bold' if is_status else 'Helvetica',
        )
        pay_table_data.append([
            Paragraph(label, S['label']),
            Paragraph(val,   val_style),
        ])

    pay_table = Table(pay_table_data, colWidths=col_w)
    pay_table.setStyle(ts)  # reuse stay_table style
    story.append(pay_table)
    story.append(Spacer(1, 4 * mm))

    # ── CANCELLATION POLICY ──────────────────────────────────────────────────
    story.append(Paragraph('CANCELLATION & REFUND POLICY', S['section_hd']))
    story.append(HRFlowable(width='100%', thickness=0.5, color=colors.HexColor('#E2E8F0'), spaceAfter=2 * mm))
    story.append(Paragraph(
        '• Cancellation before check-in: 10% cancellation fee applies; 90% refunded within 5–7 business days.\n'
        '• No-show or cancellation on the day of check-in: full charge applies.\n'
        '• For Pay-at-Hotel bookings, cancellation is free if done 24 hours before check-in.\n'
        '• Trumitrip reserves the right to modify this policy at its discretion.',
        S['policy'],
    ))
    story.append(Spacer(1, 3 * mm))

    # ── CHECK-IN INSTRUCTIONS ────────────────────────────────────────────────
    story.append(Paragraph('CHECK-IN INSTRUCTIONS', S['section_hd']))
    story.append(HRFlowable(width='100%', thickness=0.5, color=colors.HexColor('#E2E8F0'), spaceAfter=2 * mm))
    story.append(Paragraph(
        f'• Present this voucher (printed or digital) at {hotel.name} reception.\n'
        '• Carry a valid government-issued photo ID matching the guest name above.\n'
        f'• Standard check-in: 2:00 PM  |  Standard check-out: 12:00 PM.\n'
        '• Early check-in / late check-out subject to hotel availability.',
        S['policy'],
    ))
    story.append(Spacer(1, 3 * mm))

    # ── FOOTER ───────────────────────────────────────────────────────────────
    story.append(HRFlowable(width='100%', thickness=1, color=GOLD, spaceAfter=3 * mm))
    story.append(Paragraph(
        '24/7 Customer Support  ·  Toll Free: 1800-270-0297  ·  WhatsApp: +91 8470009000  ·  '
        'support@trumitrip.com  ·  www.trumitrip.com',
        S['footer'],
    ))
    story.append(Spacer(1, 2 * mm))
    story.append(Paragraph(
        'This is a computer-generated booking voucher and does not require a physical signature. '
        f'Generated by Trumitrip for booking {booking.booking_id}.',
        S['footer'],
    ))

    # ── BUILD ────────────────────────────────────────────────────────────────
    doc.build(story)
    pdf_bytes = buf.getvalue()
    buf.close()
    return pdf_bytes
