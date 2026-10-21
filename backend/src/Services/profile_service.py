from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from ..Models.User_Models import Customer, User
from ..schemas.Customer_schema import CustomerSchema, CustomerUpdateRequest


class ProfileError(Exception):
    def __init__(self, message: str, status_code: int):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def get_customer_profile(
    db: Session,
    authenticated_user_id: int,
) -> CustomerSchema:
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

    return CustomerSchema.from_customer(customer)

def update_customer_profile(
    db: Session,
    authenticated_user_id: int,
    data: CustomerUpdateRequest,
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
        profile = CustomerSchema.from_customer(customer)
        

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

    return {
        "message": "Your profile was updated successfully.",
        "profile": profile
    }