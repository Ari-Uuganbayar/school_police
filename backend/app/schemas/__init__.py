from datetime import date, datetime, time

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models import PaymentStatus, ShiftStatus, UserRole


class ORM(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ---------- Auth / Users ----------
class UserCreate(BaseModel):
    phone: str = Field(min_length=8, max_length=20)
    full_name: str = Field(min_length=2, max_length=120)
    password: str = Field(min_length=6)
    role: UserRole = UserRole.parent

    @field_validator("role")
    @classmethod
    def no_admin_signup(cls, v: UserRole) -> UserRole:
        if v == UserRole.admin:
            raise ValueError("admin эрхээр бүртгүүлэх боломжгүй")
        return v


class UserLogin(BaseModel):
    phone: str
    password: str


class UserOut(ORM):
    id: int
    phone: str
    full_name: str
    role: UserRole
    avatar_url: str | None = None
    rating_avg: float
    rating_count: int
    created_at: datetime


class UserPublic(ORM):
    id: int
    full_name: str
    avatar_url: str | None = None
    rating_avg: float
    rating_count: int


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---------- Schools / Crossings ----------
class SchoolCreate(BaseModel):
    name: str
    district: str | None = None
    khoroo: str | None = None
    address: str | None = None
    lat: float | None = None
    lng: float | None = None


class SchoolOut(ORM, SchoolCreate):
    id: int


class CrossingCreate(BaseModel):
    school_id: int
    name: str
    description: str | None = None
    lat: float
    lng: float
    checkin_radius_m: int = 100


class CrossingOut(ORM, CrossingCreate):
    id: int
    school: SchoolOut | None = None


# ---------- Shifts ----------
class ShiftCreate(BaseModel):
    crossing_id: int
    shift_date: date
    start_time: time
    duration_minutes: int = Field(ge=15, le=480)
    price: int = Field(ge=1000, description="MNT")
    notes: str | None = None


class ShiftUpdate(BaseModel):
    shift_date: date | None = None
    start_time: time | None = None
    duration_minutes: int | None = Field(default=None, ge=15, le=480)
    price: int | None = Field(default=None, ge=1000)
    notes: str | None = None


class ShiftOut(ORM):
    id: int
    parent_id: int
    worker_id: int | None
    crossing_id: int
    shift_date: date
    start_time: time
    duration_minutes: int
    price: int
    notes: str | None
    status: ShiftStatus
    checked_in_at: datetime | None
    checked_out_at: datetime | None
    created_at: datetime
    crossing: CrossingOut | None = None
    parent: UserPublic | None = None
    worker: UserPublic | None = None


class CheckIn(BaseModel):
    lat: float
    lng: float


# ---------- Payments ----------
class PaymentOut(ORM):
    id: int
    shift_id: int
    amount: int
    platform_fee: int
    provider: str
    provider_invoice_id: str | None
    qr_text: str | None
    qr_image: str | None
    deeplinks: str | None
    status: PaymentStatus
    paid_at: datetime | None
    created_at: datetime


# ---------- Reviews ----------
class ReviewCreate(BaseModel):
    shift_id: int
    rating: int = Field(ge=1, le=5)
    comment: str | None = None


class ReviewOut(ORM):
    id: int
    shift_id: int
    from_user_id: int
    to_user_id: int
    rating: int
    comment: str | None
    created_at: datetime
