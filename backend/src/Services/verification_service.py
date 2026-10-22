import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from .security_service import verify_password

def create_verification_code() -> str:
    code = f"{secrets.randbelow(10_000):04d}"

    return code



def verify_verification_code(
    submitted_code: str,
    stored_code_hash: str,
) -> bool:
    # Reject incorrectly formatted codes.
    if len(submitted_code) != 4:
        return False

    if any(character not in "0123456789" for character in submitted_code):
        return False

    # Compare the submitted code with the stored hash.
    return verify_password(submitted_code, stored_code_hash)