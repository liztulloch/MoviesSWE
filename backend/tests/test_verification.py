import unittest

from src.Services.security_service import hash_password
from src.Services.verification_service import (
    create_verification_code,
    verify_verification_code,
)


class VerificationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.code = "0482"
        cls.code_hash = hash_password(cls.code)

    def test_generated_code_has_four_digits(self):
        code = create_verification_code()

        self.assertRegex(code, r"^[0-9]{4}$")

    def test_correct_code_is_accepted(self):
        self.assertTrue(
            verify_verification_code(
                self.code,
                self.code_hash,
            )
        )

    def test_wrong_code_is_rejected(self):
        self.assertFalse(
            verify_verification_code(
                "9999",
                self.code_hash,
            )
        )

    def test_invalid_format_is_rejected(self):
        for code in ["", "123", "12345", "abcd", "12 3"]:
            with self.subTest(code=code):
                self.assertFalse(
                    verify_verification_code(
                        code,
                        self.code_hash,
                    )
                )


if __name__ == "__main__":
    unittest.main()