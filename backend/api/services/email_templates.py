"""HTML email layouts for TRUMITRIP (inline CSS for client compatibility)."""

from html import escape

BRAND_NAVY = '#0A192F'
BRAND_GOLD = '#D4AF37'
SUPPORT_PHONE = '+91 8447151225'
SUPPORT_EMAIL = 'support@trumitrip.com'


def _esc(value):
    return escape(str(value if value not in (None, '') else '—'))


def render_email(
    *,
    title,
    intro_paragraphs,
    detail_rows=None,
    highlight_html=None,
    cta_label=None,
    cta_url=None,
    footer_lines=None,
):
    """Build a branded HTML email body."""
    intro_html = ''.join(
        f'<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#334155;">{paragraph}</p>'
        for paragraph in intro_paragraphs
    )
    rows_html = ''
    if detail_rows:
        row_cells = []
        for label, value in detail_rows:
            row_cells.append(
                f'<tr>'
                f'<td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;background:#f8fafc;width:38%;'
                f'font-size:11px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:#64748b;">'
                f'{_esc(label)}</td>'
                f'<td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:14px;font-weight:600;color:#0f172a;">'
                f'{_esc(value)}</td>'
                f'</tr>'
            )
        rows_html = (
            f'<table role="presentation" width="100%" cellspacing="0" cellpadding="0" '
            f'style="margin:20px 0 0;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;border-collapse:separate;">'
            f'{"".join(row_cells)}'
            f'</table>'
        )
    highlight_block = ''
    if highlight_html:
        highlight_block = (
            f'<div style="margin-top:20px;padding:14px 16px;border-radius:12px;background:#fffbeb;'
            f'border:1px solid #fde68a;color:#92400e;font-size:13px;line-height:1.55;">{highlight_html}</div>'
        )
    cta_block = ''
    if cta_label and cta_url:
        cta_block = (
            f'<div style="margin-top:24px;text-align:center;">'
            f'<a href="{escape(cta_url, quote=True)}" style="display:inline-block;padding:14px 28px;'
            f'background:{BRAND_NAVY};color:{BRAND_GOLD};font-size:14px;font-weight:800;text-decoration:none;'
            f'border-radius:10px;">{_esc(cta_label)}</a></div>'
        )
    footer = footer_lines or [
        f'Need help? Call {SUPPORT_PHONE} or email {SUPPORT_EMAIL}.',
        'Deevika Tower, Chandan Nagar, Ghaziabad',
        '© TRUMITRIP — Explore More. Experience Beyond.',
    ]
    footer_html = ''.join(
        f'<p style="margin:0 0 8px;font-size:12px;line-height:1.5;color:#94a3b8;">{line}</p>'
        for line in footer
    )

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{_esc(title)}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f1f5f9;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 30px rgba(15,23,42,0.08);">
          <tr>
            <td style="background:{BRAND_NAVY};padding:22px 28px;">
              <p style="margin:0;font-size:11px;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:{BRAND_GOLD};">TRUMITRIP</p>
              <h1 style="margin:8px 0 0;font-size:22px;line-height:1.3;color:#ffffff;font-weight:800;">{_esc(title)}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              {intro_html}
              {rows_html}
              {highlight_block}
              {cta_block}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px;background:#f8fafc;border-top:1px solid #e2e8f0;">
              {footer_html}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""
