from pydantic import BaseModel, ConfigDict, EmailStr, Field, SecretStr


class RegistrationRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    first_name: str = Field(
        min_length=1,
        max_length=100,
        pattern=r"\S",
    )
    last_name: str = Field(
        min_length=1,
        max_length=100,
        pattern=r"\S",
    )
    email: EmailStr
    phone: str = Field(
        min_length=1,
        max_length=30,
        pattern=r"\S",
    )
    password: SecretStr = Field(min_length=8, max_length=128)
    promotion_opt_in: bool = False
    
    
class VerificationRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: EmailStr
    code: str = Field(pattern=r"^[0-9]{4}$")
    
class ResendVerificationRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: EmailStr