import smtplib

from sqlalchemy import select, delete
from sqlalchemy.orm import Session, joinedload


from ..Models.User_Model import User
from ..Models.Customer_Models import Customer
from ..Models.Session_Model import UserSession
from ..Models.Movie_Models import FavoriteMovie, Movie
from ..schemas.Profile_schema import ProfileSchema, ProfileUpdateRequest, FavoriteMovieRequest, ChangePasswordRequest, ForgotPasswordRequest, ResetPasswordRequest
from ..Services.security_service import hash_password, verify_password
from ..Services.email_service import send_generic_email
from .verification_service import create_verification_code, verify_verification_code


class ProfileError(Exception):
    def __init__(self, message: str, status_code: int):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def get_customer_profile(
    db: Session,
    authenticated_user_id: int,
) -> ProfileSchema:
    customer = db.scalar(
        select(Customer)
        .options(joinedload(Customer.user))
        .where(Customer.customer_id == authenticated_user_id)
    )

    if customer is None:
        raise ProfileError(
            "Customer profile not found.",
            404,
        )

    if customer.status != "Active":
        raise ProfileError(
            "This account cannot access its profile. It needs to be verified.",
            403,
        )

    return ProfileSchema.from_customer(customer)

def update_customer_profile(
    db: Session,
    authenticated_user_id: int,
    data: ProfileUpdateRequest,
) -> dict:
    try:
        # Lock the account while applying changes.
        user = db.scalar(
            select(User)
            .where(User.user_id == authenticated_user_id)
            .with_for_update()
        )

        if user is None:
            raise ProfileError(
                "Customer profile not found.",
                404,
            )

        customer = db.get(
            Customer,
            authenticated_user_id,
            with_for_update=True,
        )

        if customer is None:
            raise ProfileError(
                "Customer profile not found.",
                404,
            )

        if customer.status != "Active":
            raise ProfileError(
                "This account cannot edit its profile. It's needs to be verified.",
                403,
            )

        old_values = (
            user.first_name,
            user.last_name,
            user.phone,
            customer.mailing_address,
            customer.receive_promotion,
        )

        new_values = (
            data.first_name,
            data.last_name,
            data.phone,
            data.mailing_address,
            data.receive_promotion,
        )

        changed = old_values != new_values

        # Update fields belonging to User.
        user.first_name = data.first_name
        user.last_name = data.last_name
        user.phone = data.phone
       
        
        # Update fields belonging to Customer.
        customer.mailing_address = data.mailing_address
        customer.receive_promotion = data.receive_promotion

        # Build the response before commit expires ORM attributes.
        profile = ProfileSchema.from_customer(customer)
        
        email = user.email
        # Save both tables together.
        db.commit()

    except Exception:
        db.rollback()
        raise

    if not changed:
        return {
            "message": "No profile changes were needed.",
            "profile": profile,
        }
    
    try:
        send_generic_email("Your Cinema account was updated", "Your account was updated.", email)
    except (smtplib.SMTPException, OSError):
            return {
                "message": (
                    "Your profile was updated, but the notification "
                    "email could not be sent."
                ),
                "notification_sent": False,
            }

    return {
        "message": "Your profile was updated successfully.",
        "profile": profile
    }


def add_movie_to_favorite(
    db: Session,
    authenticated_user_id: int,
    data: FavoriteMovieRequest,
) -> dict:
    try:
        # Lock the account while applying changes.
        user = db.scalar(
            select(User)
            .where(User.user_id == authenticated_user_id)
            .with_for_update()
        )

        if user is None:
            raise ProfileError(
                "User account not found.",
                404,
            )

        customer = db.get(
            Customer,
            authenticated_user_id,
            with_for_update=True,
        )

        if customer is None:
            raise ProfileError(
                "Customer profile not found.",
                404,
            )

        if customer.status != "Active":
            raise ProfileError(
                "This account cannot add to favorites. It's needs to be verified.",
                403,
            )

        movie = db.get(
            Movie,
            data.movie_id
        )
        
        if movie is None:
            raise ProfileError(
                "Movie with id does not exist.",
                404
            )
        
        changed = True

        for favorite_movie in customer.favorite_movies:
            if favorite_movie.movie_id == data.movie_id:
                changed = False

        if changed:
            customer.favorite_movies.append(FavoriteMovie(movie_id=data.movie_id))

        # Save both tables together.
        db.commit()

    except Exception:
        db.rollback()
        raise

    if not changed:
        return {
            "message": "Movie already exists in customer favorites.",
        }

    return {
        "message": "Movie added to customer favorites.",
    }

def remove_movie_from_favorite(
    db: Session,
    authenticated_user_id: int,
    data: FavoriteMovieRequest,
) -> dict:
    try:
        # Lock the account while applying changes.
        user = db.scalar(
            select(User)
            .where(User.user_id == authenticated_user_id)
            .with_for_update()
        )

        if user is None:
            raise ProfileError(
                "User account not found.",
                404,
            )

        customer = db.get(
            Customer,
            authenticated_user_id,
            with_for_update=True,
        )

        if customer is None:
            raise ProfileError(
                "Customer profile not found.",
                404,
            )

        if customer.status != "Active":
            raise ProfileError(
                "This account cannot remove from favorites. It's needs to be verified.",
                403,
            )

        movie = db.get(
            Movie,
            data.movie_id
        )

        if movie is None:
            raise ProfileError(
                "Movie with id does not exist.",
                404
            )

        favorite = db.get(
            FavoriteMovie,
            (customer.customer_id, data.movie_id),
        )
        
        if favorite is None:
            raise ProfileError(
                "Movie is not in your favorites",
                404
            )

        db.delete(favorite)
        
        # Save both tables together.
        db.commit()

    except Exception:
        db.rollback()
        raise

    return {
        "message": "Movie removed from Customer favorites.",
    }


def change_password(
    db: Session,
    authenticated_user_id: int,
    data: ChangePasswordRequest,
) -> dict:
    try:
        user = db.get(
            User,
            authenticated_user_id,
            with_for_update=True,
        )

        if user is None:
            raise ProfileError(
                "Account not found.",
                404,
            )

        customer = db.get(
            Customer,
            authenticated_user_id,
            with_for_update=True,
        )

        if customer is None:
            raise ProfileError(
                "No Customer Exists for this Account",
                403,
            )

        if customer.status != "Active":
            raise ProfileError(
                "Customer is not Verified and thus cannot change password",
                403,
            )

        current_password = data.current_password.get_secret_value()
        new_password = data.new_password.get_secret_value()

        if not verify_password(current_password, user.password_hash):
            raise ProfileError(
                "Current password is incorrect.",
                400,
            )

        user.password_hash = hash_password(new_password)

        # Invalidate any outstanding forgot-password code.
        customer.password_reset_code_hash = None

        db.execute(
            delete(UserSession).where(UserSession.user_id == user.user_id)
        )

        email = user.email

        db.commit()

    except Exception:
        db.rollback()
        raise

    # Notify only after saving succeeds.
    try:
        send_generic_email("Your Cinema password was changed", "Your Cinema account password was changed.\n\n"
                "If you made this change, no further action is needed.\n\n"
                "If you did not make this change, please reset your "
                "password and contact support.", email)

    except (smtplib.SMTPException, OSError):
        return {
            "message": (
                "Your password was changed, but the notification "
                "email could not be sent."
            ),
            "notification_sent": False,
        }

    return {
        "message": "Your password was changed successfully.",
        "notification_sent": True,
    }


def forgot_password(
    db: Session,
    data: ForgotPasswordRequest,
) -> dict:
    email = str(data.email).strip().lower()
    code = None

    with db.begin():
        user = db.scalar(
            select(User)
            .where(User.email == email)
            .with_for_update()
        )

        if user is not None:
            customer = db.get(
                Customer,
                user.user_id,
                with_for_update=True,
            )

            if customer is not None and customer.status == "Active":
                code = create_verification_code()

                customer.password_reset_code_hash = hash_password(code)

    # Send after the reset-code hash is saved.
    if code is not None:
        try:
            send_generic_email(
                "Your Cinema password reset code",
                (
                    f"Your password-reset code is: {code}"
                ),
                email,
            )

        except (smtplib.SMTPException, OSError) as error:
            raise ProfileError(
                "The password-reset email could not be sent. Please try again.",
                503,
            ) from error

    return {
        "message": (
            "If you have a verfied account, you will receive a password-reset email."
        )
    }


def reset_password(
    db: Session,
    data: ResetPasswordRequest,
) -> dict:
    email = str(data.email).strip().lower()

    with db.begin():
        user = db.scalar(
            select(User)
            .where(User.email == email)
            .with_for_update()
        )

        if user is None:
            raise ProfileError(
                "Invalid password-reset request.",
                400,
            )

        customer = db.get(
            Customer,
            user.user_id,
            with_for_update=True,
        )

        if customer is None or customer.status != "Active":
            raise ProfileError(
                "Invalid password-reset request.",
                400,
            )

        if customer.password_reset_code_hash is None:
            raise ProfileError(
                "Please request a password-reset code first.",
                400,
            )

        is_correct = verify_verification_code(
            data.code,
            customer.password_reset_code_hash,
        )

        if not is_correct:
            raise ProfileError(
                "Incorrect password-reset code.",
                400,
            )

        user.password_hash = hash_password(
            data.new_password.get_secret_value()
        )

        # Prevent reuse of the reset code.
        customer.password_reset_code_hash = None

        db.execute(
            delete(UserSession).where(UserSession.user_id == user.user_id)
        )

    # Notify after the password change is committed.
    try:
        send_generic_email(
            "Your Cinema password was reset",
            (
                "Your Cinema account password was reset.\n\n"
            ),
            email,
        )

    except (smtplib.SMTPException, OSError):
        return {
            "message": (
                "Your password was reset, but the notification "
                "email could not be sent."
            ),
            "notification_sent": False,
        }

    return {
        "message": "Your password was reset successfully.",
        "notification_sent": True,
    }
