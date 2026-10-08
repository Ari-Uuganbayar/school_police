"""Тестийн орчин: sqlite in-memory DB, бодит FastAPI app, httpx client."""
import asyncio
from collections.abc import AsyncIterator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.core.security import hash_password
from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.models import User, UserRole


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture
async def db_sessionmaker() -> AsyncIterator[async_sessionmaker[AsyncSession]]:
    engine = create_async_engine("sqlite+aiosqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    await engine.dispose()


@pytest_asyncio.fixture
async def client(db_sessionmaker) -> AsyncIterator[AsyncClient]:
    async def _get_db():
        async with db_sessionmaker() as session:
            yield session

    app.dependency_overrides[get_db] = _get_db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()


USERS = {
    "admin": ("99000001", "admin123", UserRole.admin),
    "parent": ("99000002", "parent123", UserRole.parent),
    "worker": ("99000003", "worker123", UserRole.worker),
}


@pytest_asyncio.fixture
async def users(db_sessionmaker) -> dict[str, User]:
    async with db_sessionmaker() as s:
        out = {}
        for key, (phone, pw, role) in USERS.items():
            u = User(phone=phone, full_name=key, hashed_password=hash_password(pw), role=role)
            s.add(u)
            out[key] = u
        await s.commit()
        return out


@pytest_asyncio.fixture
async def auth(client, users):
    """auth("admin") -> {"Authorization": "Bearer ..."}"""
    cache: dict[str, dict[str, str]] = {}

    async def _auth(role: str) -> dict[str, str]:
        if role not in cache:
            phone, pw, _ = USERS[role]
            r = await client.post("/api/auth/login", json={"phone": phone, "password": pw})
            assert r.status_code == 200, r.text
            cache[role] = {"Authorization": f"Bearer {r.json()['access_token']}"}
        return cache[role]

    return _auth
