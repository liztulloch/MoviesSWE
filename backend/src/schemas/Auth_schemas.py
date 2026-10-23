from pydantic import BaseModel, ConfigDict, EmailStr, SecretStr


class LoginRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: EmailStr
    password: SecretStr
    


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    first_name: str
    last_name: str
    role: str