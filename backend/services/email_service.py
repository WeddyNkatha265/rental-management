import resend
import os
from datetime import date
from dotenv import load_dotenv

load_dotenv()

resend.api_key = os.getenv("RESEND_API_KEY", "")


def _send_email(to_email: str, subject: str, html_body: str) -> bool:
    if not resend.api_key:
        print(f"[EMAIL] Skipped — RESEND_API_KEY not set. Would send to: {to_email}")
        return False
    try:
        params = {
            "from": f"{os.getenv('EMAIL_FROM_NAME', 'Kamau Rentals')} <onboarding@resend.dev>",
            "to": [to_email],
            "subject": subject,
            "html": html_body,
        }
        resend.Emails.send(params)
        print(f"[EMAIL] Sent '{subject}' → {to_email}")
        return True
    except Exception as e:
        print(f"[EMAIL] Failed to send to {to_email}: {e}")
        return False


def _base_template(content: str) -> str:
    return f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {{ font-family: Georgia, serif; background: #f5f0e8; margin: 0; padding: 0; }}
    .wrapper {{ max-width: 580px; margin: 40px auto; }}
    .header {{ background: linear-gradient(135deg, #1A1A24 0%, #22222F 100%); padding: 32px 40px; border-radius: 12px 12px 0 0; }}
    .header h1 {{ color: #C5A028; margin: 0; font-size: 24px; letter-spacing: 2px; font-weight: 400; }}
    .header p {{ color: #888; margin: 6px 0 0; font-size: 13px; letter-spacing: 1px; }}
    .body {{ background: #ffffff; padding: 36px 40px; border-left: 1px solid #e0d8c8; border-right: 1px solid #e0d8c8; }}
    .body h2 {{ color: #1A1A24; font-size: 20px; margin-top: 0; }}
    .body p {{ color: #444; line-height: 1.7; font-size: 15px; }}
    .amount-box {{ background: #f9f5ec; border-left: 4px solid #C5A028; padding: 16px 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }}
    .amount-box .label {{ color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }}
    .amount-box .value {{ color: #1A1A24; font-size: 28px; font-weight: 700; margin-top: 4px; }}
    .detail-row {{ display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f0e8d8; }}
    .detail-label {{ color: #888; font-size: 13px; }}
    .detail-value {{ color: #1A1A24; font-size: 13px; font-weight: 600; }}
    .footer {{ background: #1A1A24; padding: 20px 40px; border-radius: 0 0 12px 12px; text-align: center; }}
    .footer p {{ color: #555570; font-size: 12px; margin: 0; }}
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>MURITHI RENTALS</h1>
      <p>PROPERTY MANAGEMENT · KISUMU</p>
    </div>
    <div class="body">
      {content}
    </div>
    <div class="footer">
      <p>© {date.today().year} Murithi Family Rentals · Meru, Kenya</p>
      <p style="margin-top:6px;">This is an automated notification. Do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
"""


def send_payment_confirmation(
    tenant_email: str,
    tenant_name: str,
    amount: float,
    month_paid_for: str,
    house_name: str,
    payment_method: str,
    reference_code: str = None,
    payment_date=None,
) -> bool:
    subject = f"✅ Payment Received — {house_name} · {month_paid_for}"
    ref_row = f"""
      <div class="detail-row">
        <span class="detail-label">Reference</span>
        <span class="detail-value" style="font-family:monospace;">{reference_code}</span>
      </div>
    """ if reference_code else ""

    content = f"""
      <h2>Payment Confirmed ✅</h2>
      <p>Dear <strong>{tenant_name}</strong>,</p>
      <p>We have received your rent payment. Here are your payment details:</p>
      <div class="amount-box">
        <div class="label">Amount Received</div>
        <div class="value">KES {amount:,.0f}</div>
      </div>
      <div class="detail-row">
        <span class="detail-label">Unit</span>
        <span class="detail-value">{house_name}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Period</span>
        <span class="detail-value">{month_paid_for}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Method</span>
        <span class="detail-value">{payment_method.upper()}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Date</span>
        <span class="detail-value">{payment_date or date.today()}</span>
      </div>
      {ref_row}
      <p style="margin-top:24px;">Thank you for your prompt payment. Please keep this email as your receipt.</p>
      <p>Best regards,<br><strong>Murithi Rentals Management</strong></p>
    """
    return _send_email(tenant_email, subject, _base_template(content))


def send_payment_reminder(
    tenant_email: str,
    tenant_name: str,
    amount: float,
    month: str,
    house_name: str,
    days_overdue: int = 0,
) -> bool:
    urgency = "⚠️ Friendly Reminder" if days_overdue <= 7 else "🔴 Overdue Notice"
    subject = f"{urgency} — Rent Due · {house_name} · {month}"
    message = (
        "This is a friendly reminder that your rent payment is due."
        if days_overdue <= 7
        else f"Your rent payment is <strong>{days_overdue} days overdue</strong>. Please make payment as soon as possible."
    )
    content = f"""
      <h2>Rent Payment Due</h2>
      <p>Dear <strong>{tenant_name}</strong>,</p>
      <p>{message}</p>
      <div class="amount-box">
        <div class="label">Amount Due</div>
        <div class="value">KES {amount:,.0f}</div>
      </div>
      <div class="detail-row">
        <span class="detail-label">Unit</span>
        <span class="detail-value">{house_name}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Period</span>
        <span class="detail-value">{month}</span>
      </div>
      <p style="margin-top:24px;">If you have already paid, please disregard this notice.</p>
      <p>Thank you,<br><strong>Murithi Rentals Management</strong></p>
    """
    return _send_email(tenant_email, subject, _base_template(content))


def send_welcome_email(
    tenant_email: str,
    tenant_name: str,
    house_name: str,
    rent_amount: float,
    move_in_date,
) -> bool:
    subject = f"Welcome to Murithi Rentals — {house_name}"
    content = f"""
      <h2>Welcome to Your New Home 🏠</h2>
      <p>Dear <strong>{tenant_name}</strong>,</p>
      <p>We are pleased to welcome you to Murithi Rentals. Your tenancy has been set up successfully.</p>
      <div class="amount-box">
        <div class="label">Monthly Rent</div>
        <div class="value">KES {rent_amount:,.0f}</div>
      </div>
      <div class="detail-row">
        <span class="detail-label">Your Unit</span>
        <span class="detail-value">{house_name}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Move-in Date</span>
        <span class="detail-value">{move_in_date}</span>
      </div>
      <p style="margin-top:24px;">Rent is due on the <strong>1st of every month</strong>.</p>
      <p>Warm regards,<br><strong>Murithi Rentals Management</strong></p>
    """
    return _send_email(tenant_email, subject, _base_template(content))

