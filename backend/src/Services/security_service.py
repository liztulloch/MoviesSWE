import os
import jwt
from pathlib import Path
from dotenv import load_dotenv
from pwdlib import PasswordHash
from cryptography.fernet import Fernet
from datetime import datetime, timedelta, timezone

BACKEND_DIRECTORY = Path(__file__).resolve().parents[2]
load_dotenv(BACKEND_DIRECTORY / ".env")

_password_hasher = PasswordHash.recommended()
_cipher = Fernet(
    os.environ["CARD_ENCRYPTION_KEY"].encode("ascii")
)

JWT_SECRET_KEY = os.environ["JWT_SECRET"]
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_MINUTES = 60



def hash_password(password: str) -> str:
    return _password_hasher.hash(password)

def verify_password(password: str, password_hash: str) -> bool:
    return _password_hasher.verify(password, password_hash)

def encrypt_card_number(card_number: str) -> str:
    encrypted = _cipher.encrypt(card_number.encode("utf-8"))
    return encrypted.decode("ascii")


def decrypt_card_number(encrypted_card_number: str) -> str:
    decrypted = _cipher.decrypt(
        encrypted_card_number.encode("ascii")
    )
    return decrypted.decode("utf-8")



def create_access_token(
    user_id: int,
    session_id: int,
    expiration: datetime,
) -> str:
    payload = {
        "sub": str(user_id),
        "sid": session_id,
        "exp": expiration
    }

    return jwt.encode(
        payload,
        JWT_SECRET_KEY,
        algorithm=JWT_ALGORITHM
    )


def decode_access_token(token: str) -> dict:
    return jwt.decode(
        token,
        JWT_SECRET_KEY,
        algorithms=[JWT_ALGORITHM],
        options={"require": ["sub", "sid", "exp"]},
    )
