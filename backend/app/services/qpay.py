"""QPay v2 интеграци. Түлхүүр тохируулаагүй бол mock горимд ажиллана."""

import base64
import uuid
from typing import Any

import httpx

from app.core.config import settings


class QPayClient:
    def __init__(self) -> None:
        self._token: str | None = None

    @property
    def enabled(self) -> bool:
        return bool(settings.QPAY_USERNAME and settings.QPAY_PASSWORD and settings.QPAY_INVOICE_CODE)

    async def _auth(self) -> str:
        if self._token:
            return self._token
        async with httpx.AsyncClient(base_url=settings.QPAY_BASE_URL, timeout=15) as c:
            r = await c.post("/auth/token", auth=(settings.QPAY_USERNAME, settings.QPAY_PASSWORD))
            r.raise_for_status()
            self._token = r.json()["access_token"]
            return self._token

    async def _request(self, method: str, path: str, **kw: Any) -> dict:
        token = await self._auth()
        async with httpx.AsyncClient(base_url=settings.QPAY_BASE_URL, timeout=15) as c:
            r = await c.request(method, path, headers={"Authorization": f"Bearer {token}"}, **kw)
            if r.status_code == 401:
                self._token = None
                token = await self._auth()
                r = await c.request(method, path, headers={"Authorization": f"Bearer {token}"}, **kw)
            r.raise_for_status()
            return r.json()

    async def create_invoice(
        self, *, sender_invoice_no: str, amount: int, description: str, receiver_code: str
    ) -> dict:
        if not self.enabled:
            fake_id = f"mock-{uuid.uuid4().hex[:12]}"
            qr = f"MOCKQPAY|{sender_invoice_no}|{amount}"
            return {
                "invoice_id": fake_id,
                "qr_text": qr,
                "qr_image": base64.b64encode(qr.encode()).decode(),
                "urls": [{"name": "Mock bank", "description": "Тест", "link": f"mock://pay/{fake_id}"}],
            }
        return await self._request(
            "POST",
            "/invoice",
            json={
                "invoice_code": settings.QPAY_INVOICE_CODE,
                "sender_invoice_no": sender_invoice_no,
                "invoice_receiver_code": receiver_code,
                "invoice_description": description,
                "amount": amount,
                "callback_url": settings.QPAY_CALLBACK_URL,
            },
        )

    async def check_paid(self, invoice_id: str) -> bool:
        if not self.enabled:
            return invoice_id.startswith("mock-")  # mock горимд шалгахад шууд төлөгдсөн гэж үзнэ
        data = await self._request(
            "POST",
            "/payment/check",
            json={"object_type": "INVOICE", "object_id": invoice_id, "offset": {"page_number": 1, "page_limit": 10}},
        )
        return any(row.get("payment_status") == "PAID" for row in data.get("rows", []))


qpay = QPayClient()
