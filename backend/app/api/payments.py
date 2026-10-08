import json
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.api.deps import DB, CurrentUser
from app.api.shifts import load_shift
from app.core.config import settings
from app.models import Payment, PaymentStatus
from app.schemas import PaymentOut
from app.services.qpay import qpay

router = APIRouter(prefix="/payments", tags=["payments"])


@router.post("/shifts/{shift_id}/invoice", response_model=PaymentOut)
async def create_invoice(shift_id: int, db: DB, user: CurrentUser):
    """Эцэг эх ээлжийн төлбөрийн QPay нэхэмжлэх үүсгэнэ."""
    shift = await load_shift(db, shift_id)
    if shift.parent_id != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Зөвхөн захиалагч төлнө")
    payment = await db.scalar(select(Payment).where(Payment.shift_id == shift_id))
    if payment and payment.status == PaymentStatus.paid:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Төлбөр аль хэдийн төлөгдсөн")
    if payment is None:
        payment = Payment(
            shift_id=shift_id,
            payer_id=user.id,
            amount=shift.price,
            platform_fee=shift.price * settings.PLATFORM_FEE_PERCENT // 100,
        )
        db.add(payment)
        await db.flush()
    inv = await qpay.create_invoice(
        sender_invoice_no=f"SP-{shift_id}-{payment.id}",
        amount=payment.amount,
        description=f"School Police ээлж #{shift_id}",
        receiver_code=user.phone,
    )
    payment.provider_invoice_id = inv["invoice_id"]
    payment.qr_text = inv.get("qr_text")
    payment.qr_image = inv.get("qr_image")
    payment.deeplinks = json.dumps(inv.get("urls", []), ensure_ascii=False)
    await db.commit()
    await db.refresh(payment)
    return payment


@router.get("/shifts/{shift_id}", response_model=PaymentOut)
async def get_payment(shift_id: int, db: DB, user: CurrentUser):
    payment = await db.scalar(select(Payment).where(Payment.shift_id == shift_id))
    if not payment:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Төлбөр олдсонгүй")
    return payment


@router.post("/shifts/{shift_id}/check", response_model=PaymentOut)
async def check_payment(shift_id: int, db: DB, user: CurrentUser):
    """QPay-ээс төлбөрийн төлөвийг шалгана."""
    payment = await get_payment(shift_id, db, user)
    if payment.status != PaymentStatus.paid and payment.provider_invoice_id:
        if await qpay.check_paid(payment.provider_invoice_id):
            payment.status = PaymentStatus.paid
            payment.paid_at = datetime.now(timezone.utc)
            await db.commit()
            await db.refresh(payment)
    return payment


@router.get("/qpay/callback")
async def qpay_callback(db: DB, payment_id: int | None = None, qpay_payment_id: str | None = None):
    """QPay төлбөр амжилттай болоход дуудна (GET callback)."""
    if payment_id is None:
        return {"ok": False}
    payment = await db.get(Payment, payment_id)
    if payment and payment.status != PaymentStatus.paid:
        if await qpay.check_paid(payment.provider_invoice_id or ""):
            payment.status = PaymentStatus.paid
            payment.paid_at = datetime.now(timezone.utc)
            await db.commit()
    return {"ok": True}
