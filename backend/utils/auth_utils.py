import hashlib
import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText


def hash_password(password: str) -> str:
    salt = os.urandom(16)
    derived = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100_000)
    return salt.hex() + ":" + derived.hex()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    if ":" not in hashed_password:
        return False
    salt_hex, derived_hex = hashed_password.split(":", 1)
    salt = bytes.fromhex(salt_hex)
    derived = hashlib.pbkdf2_hmac("sha256", plain_password.encode("utf-8"), salt, 100_000)
    return derived.hex() == derived_hex


SMTP_SERVER = os.getenv("EMAIL_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("EMAIL_PORT", "587"))
SENDER_EMAIL = os.getenv("EMAIL_HOST_USER")
SENDER_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD")

def send_reset_email(user_email: str, uidb64: str, token: str):
    reset_link = f"http://localhost:3000/reset-password?uidb64={uidb64}&token={token}"

    message = MIMEMultipart()
    message["From"] = SENDER_EMAIL
    message["To"] = user_email
    message["Subject"] = "SwipeX Password Reset"

    body = f"""Hi,

You requested a password reset for your SwipeX account.
Please use the link below to choose a new password:

{reset_link}

If you did not request this reset, you can safely ignore this email.

Thanks,
SwipeX Team
"""
    message.attach(MIMEText(body, "plain"))

    try:
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        server.sendmail(SENDER_EMAIL, user_email, message.as_string())
        server.quit()
        return True
    except Exception as exc:
        print(f"SMTP Mail Integration Error: {exc}")
        return False