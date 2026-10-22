import smtplib

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..Models.User_Model import User
from ..Models.Customer_Models import Customer, CreditCard
from ..schemas.Registration_schema import RegistrationRequest
from .email_service import send_verification_email
from .security_service import hash_password, encrypt_card_number

from .verification_service import (
    create_verification_code,
    verify_verification_code,
)



class RegistrationError(Exception):
    def __init__(self, message: str, status_code: int):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def register_user(
    db: Session,
    data: RegistrationRequest,
) -> dict:
    email = str(data.email).strip().lower()

    password_hash = hash_password(data.password.get_secret_value())

    code = create_verification_code()
    code_hash = hash_password(code)

    try:
        # Save User and Customer together.
        with db.begin():
            existing_user = db.scalar(select(User).where(User.email == email))

            if existing_user is not None:
                raise RegistrationError(
                    "An account with this email already exists.",
                    409,
                )

            user = User(
                first_name=data.first_name.strip(),
                last_name=data.last_name.strip(),
                email=email,
                phone=data.phone.strip(),
                password_hash=password_hash,
            )

            db.add(user)

            # Send the INSERT to MySQL to obtain the generated ID.
            # This does not commit the transaction yet.
            db.flush()

            customer = Customer(
                customer_id=user.user_id,
                mailing_address=data.mailing_address,
                status="Inactive",
                verification_code_hash=code_hash,
                password_reset_code_hash=None,
                receive_promotion=data.promotion_opt_in,
            )

            db.add(customer)
            db.flush()
            
            for card_data in data.cards:
                encrypted_number = encrypt_card_number(card_data.card_number.get_secret_value())
                card = CreditCard(
                    customer_id = customer.customer_id,
                    card_number = encrypted_number,
                    cardholder_name=card_data.cardholder_name.strip(),
                    billing_address = card_data.billing_address.strip(),
                    expiration_date = card_data.expiration_date
                )
                db.add(card)
            
           

        # Leaving db.begin() successfully commits both records.

    except IntegrityError as error:
        # MySQL error 1062 means a duplicate unique value.
        # This also catches simultaneous registrations for one email.
        error_args = getattr(error.orig, "args", ())

        if error_args and error_args[0] == 1062:
            raise RegistrationError(
                "An account with this email already exists.",
                409,
            ) from error

        raise

    # Send only after the database transaction succeeds.
    try:
        send_verification_email(email, code)
    except (smtplib.SMTPException, OSError) as error:
        raise RegistrationError(
            "Your account was created, but the verification email "
            "could not be sent. Please request another code.",
            503,
        ) from error

    return {
        "message": (
            "Your account was created. " "Check your email for the verification code."
        )
    }


def verify_email(
    db: Session,
    email: str,
    submitted_code: str,
) -> dict:
    email = email.strip().lower()

    with db.begin():
        # Lock this account while checking and consuming its code.
        user = db.scalar(select(User).where(User.email == email).with_for_update())

        if user is None:
            raise RegistrationError(
                "Invalid verification request. User does not exist for this email",
                400,
            )

        customer = db.get(
            Customer,
            user.user_id,
            with_for_update=True,
        )

        if customer is None:
            raise RegistrationError(
                "Invalid verification request. User is not a customer.",
                400,
            )

        if customer.status != "Inactive":
            raise RegistrationError(
                "Invalid verification request. Customer is already verified.",
                403,
            )

        if customer.verification_code_hash is None:
            raise RegistrationError(
                "No verification code is available. " "Please request another code.",
                404,
            )

        is_correct = verify_verification_code(
            submitted_code,
            customer.verification_code_hash,
        )

        if not is_correct:
            raise RegistrationError(
                "Incorrect verification code.",
                400,
            )

        # Save both changes together.
        customer.status = "Active"
        customer.verification_code_hash = None

    return {"message": "Email verified successfully."}


def resend_verification(db: Session, email: str) -> dict:
    email = email.strip().lower()
    code = None


    with db.begin():
        user = db.scalar(select(User).where(User.email == email).with_for_update())

        if user is None:
            raise RegistrationError(
                "Invalid verification request. User does not exist for this email",
                404,
            )

        customer = db.get(
            Customer,
            user.user_id,
            with_for_update=True,
        )

        if customer is None:
            raise RegistrationError(
                "Invalid verification request. User is not a customer.",
                404,
            )

        
        if customer.status == "Active":
            raise RegistrationError(
                "Invalid verification request. Customer is already verified.",
                403,
            )

        code = create_verification_code()
        customer.verification_code_hash = hash_password(code)


    # The replacement hash has committed before sending.
    if code is not None:
        try:
            send_verification_email(email, code)

        except (smtplib.SMTPException, OSError) as error:
            raise RegistrationError(
                "The verification email could not be sent. "
                "Please try requesting another code.",
                503,
            ) from error

    return {"message": "Check your email for the verification code."}
