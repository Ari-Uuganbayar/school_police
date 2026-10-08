"""Тестийн өгөгдөл: админ, эцэг эх, гүйцэтгэгч, 2 сургууль, гарцууд."""

import asyncio

from sqlalchemy import select

from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models import Crossing, School, User, UserRole

USERS = [
    ("99000001", "Админ", "admin123", UserRole.admin),
    ("99000002", "Болд (эцэг эх)", "parent123", UserRole.parent),
    ("99000003", "Сараа (гүйцэтгэгч)", "worker123", UserRole.worker),
]
SCHOOLS = [
    {
        "name": "1-р сургууль",
        "district": "Сүхбаатар",
        "khoroo": "8",
        "address": "Сөүлийн гудамж",
        "lat": 47.9195,
        "lng": 106.9177,
        "crossings": [("Урд хаалганы гарц", 47.9193, 106.9180), ("Баруун талын гарц", 47.9198, 106.9165)],
    },
    {
        "name": "Шинэ Монгол сургууль",
        "district": "Баянзүрх",
        "khoroo": "26",
        "address": "Нарны зам",
        "lat": 47.9140,
        "lng": 106.9540,
        "crossings": [("Нарны замын гарц", 47.9142, 106.9545)],
    },
]


async def main() -> None:
    async with SessionLocal() as db:
        for phone, name, pw, role in USERS:
            if not await db.scalar(select(User).where(User.phone == phone)):
                db.add(User(phone=phone, full_name=name, hashed_password=hash_password(pw), role=role))
        for s in SCHOOLS:
            if await db.scalar(select(School).where(School.name == s["name"])):
                continue
            school = School(**{k: v for k, v in s.items() if k != "crossings"})
            school.crossings = [Crossing(name=n, lat=la, lng=ln) for n, la, ln in s["crossings"]]
            db.add(school)
        await db.commit()
    print("seed ok")


if __name__ == "__main__":
    asyncio.run(main())
