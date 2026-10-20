import os
import smtplib
import ssl
from email.message import EmailMessage

from dotenv import load_dotenv


load_dotenv()


def send_verification_email(email: str, code: str) -> None:
    """Send a four-digit registration verification code."""

    if len(code) != 4 or any(char not in "0123456789" for char in code):
        raise ValueError("Verification code must contain exactly six digits.")

    message = EmailMessage()
    message["Subject"] = "Your Cinema verification code"
    message["From"] = os.environ["EMAIL_FROM"]
    message["To"] = email

    message.set_content(
        "Welcome to Cinema E Booking!\n\n"
        f"Your verification code is: {code}\n\n"
    )

    with smtplib.SMTP(
        os.environ["SMTP_HOST"],
        int(os.getenv("SMTP_PORT", "587")),
        timeout=15,
    ) as server:
        server.starttls(context=ssl.create_default_context())

        server.login(
            os.environ["SMTP_USERNAME"],
            os.environ["SMTP_PASSWORD"],
        )

        server.send_message(message)