import enum
from datetime import date, datetime, time

from sqlalchemy import Boolean, Date, DateTime, Enum, Float, ForeignKey, Integer, String, Text, Time, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class UserRole(enum.StrEnum):
    parent = "parent"  # эцэг эх: ээлж захиалагч
    worker = "worker"  # гүйцэтгэгч: хөлсөөр зогсогч
    admin = "admin"


class ShiftStatus(enum.StrEnum):
    open = "open"  # нээлттэй, гүйцэтгэгч хүлээж байна
    accepted = "accepted"  # гүйцэтгэгч авсан
    in_progress = "in_progress"  # check-in хийсэн, явагдаж байна
    completed = "completed"  # check-out хийсэн
    cancelled = "cancelled"


class PaymentStatus(enum.StrEnum):
    pending = "pending"
    paid = "paid"
    failed = "failed"
    refunded = "refunded"


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class User(TimestampMixin, Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    phone: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(120))
    hashed_password: Mapped[str] = mapped_column(String(255))
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.parent)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    avatar_url: Mapped[str | None] = mapped_column(String(500))
    rating_avg: Mapped[float] = mapped_column(Float, default=0.0)
    rating_count: Mapped[int] = mapped_column(Integer, default=0)

    shifts_created: Mapped[list["Shift"]] = relationship(back_populates="parent", foreign_keys="Shift.parent_id")
    shifts_taken: Mapped[list["Shift"]] = relationship(back_populates="worker", foreign_keys="Shift.worker_id")


class School(TimestampMixin, Base):
    __tablename__ = "schools"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200), index=True)
    district: Mapped[str | None] = mapped_column(String(100))  # дүүрэг
    khoroo: Mapped[str | None] = mapped_column(String(50))  # хороо
    address: Mapped[str | None] = mapped_column(String(300))
    lat: Mapped[float | None] = mapped_column(Float)
    lng: Mapped[float | None] = mapped_column(Float)

    crossings: Mapped[list["Crossing"]] = relationship(back_populates="school", cascade="all, delete-orphan")


class Crossing(TimestampMixin, Base):
    """Замын гарц"""

    __tablename__ = "crossings"

    id: Mapped[int] = mapped_column(primary_key=True)
    school_id: Mapped[int] = mapped_column(ForeignKey("schools.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(200))
    description: Mapped[str | None] = mapped_column(Text)
    lat: Mapped[float] = mapped_column(Float)
    lng: Mapped[float] = mapped_column(Float)
    checkin_radius_m: Mapped[int] = mapped_column(Integer, default=100)

    school: Mapped["School"] = relationship(back_populates="crossings")
    shifts: Mapped[list["Shift"]] = relationship(back_populates="crossing")


class Shift(TimestampMixin, Base):
    """Ээлж: эцэг эхийн зогсох ёстой цаг, хөлсөөр гүйцэтгүүлэх захиалга"""

    __tablename__ = "shifts"

    id: Mapped[int] = mapped_column(primary_key=True)
    parent_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    worker_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), index=True)
    crossing_id: Mapped[int] = mapped_column(ForeignKey("crossings.id"), index=True)

    shift_date: Mapped[date] = mapped_column(Date, index=True)
    start_time: Mapped[time] = mapped_column(Time)
    duration_minutes: Mapped[int] = mapped_column(Integer)
    price: Mapped[int] = mapped_column(Integer)  # MNT, бүхэл тоо
    notes: Mapped[str | None] = mapped_column(Text)
    status: Mapped[ShiftStatus] = mapped_column(Enum(ShiftStatus), default=ShiftStatus.open, index=True)

    checked_in_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    checked_out_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    checkin_lat: Mapped[float | None] = mapped_column(Float)
    checkin_lng: Mapped[float | None] = mapped_column(Float)

    parent: Mapped["User"] = relationship(back_populates="shifts_created", foreign_keys=[parent_id])
    worker: Mapped["User | None"] = relationship(back_populates="shifts_taken", foreign_keys=[worker_id])
    crossing: Mapped["Crossing"] = relationship(back_populates="shifts")
    payment: Mapped["Payment | None"] = relationship(back_populates="shift", uselist=False)
    reviews: Mapped[list["Review"]] = relationship(back_populates="shift")


class Payment(TimestampMixin, Base):
    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(primary_key=True)
    shift_id: Mapped[int] = mapped_column(ForeignKey("shifts.id"), unique=True)
    payer_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    amount: Mapped[int] = mapped_column(Integer)
    platform_fee: Mapped[int] = mapped_column(Integer, default=0)
    provider: Mapped[str] = mapped_column(String(30), default="qpay")
    provider_invoice_id: Mapped[str | None] = mapped_column(String(100), index=True)
    qr_text: Mapped[str | None] = mapped_column(Text)
    qr_image: Mapped[str | None] = mapped_column(Text)
    deeplinks: Mapped[str | None] = mapped_column(Text)  # JSON string
    status: Mapped[PaymentStatus] = mapped_column(Enum(PaymentStatus), default=PaymentStatus.pending)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    shift: Mapped["Shift"] = relationship(back_populates="payment")


class Review(TimestampMixin, Base):
    __tablename__ = "reviews"

    id: Mapped[int] = mapped_column(primary_key=True)
    shift_id: Mapped[int] = mapped_column(ForeignKey("shifts.id"), index=True)
    from_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    to_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    rating: Mapped[int] = mapped_column(Integer)  # 1..5
    comment: Mapped[str | None] = mapped_column(Text)

    shift: Mapped["Shift"] = relationship(back_populates="reviews")
