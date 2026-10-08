# School Police

Сургуулийн замын гарцын ээлжийг хөлсөөр гүйцэтгүүлэх захиалгын систем.

| Хавтас | Технологи | Тайлбар |
|---|---|---|
| `backend/` | FastAPI + SQLAlchemy + PostgreSQL | REST API, JWT нэвтрэлт, QPay төлбөр |
| `web/` | Next.js 16 + Tailwind | Эцэг эх, гүйцэтгэгчийн web |
| `mobile/` | Expo 57 + Expo Router | iOS/Android апп, GPS check-in |

## Ажиллуулах

```bash
# 1. Backend  (http://localhost:8000/docs)
cd backend && .venv/bin/alembic upgrade head && .venv/bin/python seed.py
.venv/bin/uvicorn app.main:app --reload

# 2. Web  (http://localhost:3000)
cd web && npm run dev

# 3. Mobile  (Expo Go эсвэл симулятор)
cd mobile && npx expo start
```

Mobile-д `mobile/.env` дотор `EXPO_PUBLIC_API_URL`-ийг компьютерийнхаа LAN IP болгож солино (утас дээр `localhost` ажиллахгүй).

## Тестийн хэрэглэгчид

| Утас | Нууц үг | Эрх |
|---|---|---|
| 99000001 | admin123 | Админ |
| 99000002 | parent123 | Эцэг эх |
| 99000003 | worker123 | Гүйцэтгэгч |

## Ээлжийн урсгал

`open` (нээлттэй) → `accepted` (гүйцэтгэгч авсан) → `in_progress` (гарц дээр GPS check-in) → `completed` (check-out) → төлбөр (QPay) → үнэлгээ

QPay-ийн түлхүүр `backend/.env`-д тохируулаагүй бол mock горимд ажиллана (нэхэмжлэх үүсч, шалгахад шууд төлөгдсөн гэж үзнэ).
