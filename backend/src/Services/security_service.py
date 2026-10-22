import os
from pathlib import Path
from dotenv import load_dotenv
from pwdlib import PasswordHash
from cryptography.fernet import Fernet

BACKEND_DIRECTORY = Path(__file__).resolve().parents[2]
load_dotenv(BACKEND_DIRECTORY / ".env")

_password_hasher = PasswordHash.recommended()
_cipher = Fernet(
    os.environ["CARD_ENCRYPTION_KEY"].encode("ascii")
)




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