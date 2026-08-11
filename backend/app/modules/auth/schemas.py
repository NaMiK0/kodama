from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.modules.auth.enums import AvatarId

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    created_at: datetime
    offer_pronunciation: bool
    new_cards_daily_limit: int
    avatar_id: AvatarId


class UserSettingsUpdate(BaseModel):
    offer_pronunciation: bool | None = None
    new_cards_daily_limit: int | None = Field(default=None, ge=1, le=50)
    avatar_id: AvatarId | None = None


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8, max_length=128)