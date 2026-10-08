# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Төслийн тухай

School Police: Монголд эцэг эхчүүд сургуулийн замын гарц дээр ээлжээр зогсдог. Ажилтай эцэг эх ээлжээ хөлсөөр гүйцэтгүүлэх захиалга (shift) үүсгэж, гүйцэтгэгч (worker) авч, гарц дээр GPS-ээр check-in хийж, QPay-ээр төлбөр төлөгдөж, хоёр тал бие биенээ үнэлнэ.

Хэрэглэгчтэй харилцах хэл болон бүх UI текст, алдааны мессеж, commit message **монгол хэлээр**. Кодын нэршил англиар.

## Бүтэц

Гурван бие даасан апп, нэг репо. Хоорондоо зөвхөн REST API-аар холбогдоно, хуваалцсан package байхгүй.

| Хавтас | Стек | Порт |
|---|---|---|
| `backend/` | FastAPI, SQLAlchemy 2 async (asyncpg), Alembic, PostgreSQL | 8000 |
| `web/` | Next.js 16 (App Router), React 19, Tailwind 4 | 3000 |
| `mobile/` | Expo 57, Expo Router, React Native | 8081 |

`web/src/lib/types.ts` болон `mobile/src/lib/types.ts` ижил агуулгатай, гараар синк хийнэ. Backend schema өөрчилбөл хоёуланг нь шинэчил.

## Командууд

Backend (venv нь `backend/.venv`, бүх командыг `backend/` дотроос):
```bash
.venv/bin/uvicorn app.main:app --reload --port 8000   # сервер, /docs дээр Swagger
.venv/bin/alembic revision --autogenerate -m "..."     # model өөрчилсний дараа
.venv/bin/alembic upgrade head
.venv/bin/python seed.py                               # тестийн хэрэглэгч, сургууль, гарц (idempotent)
.venv/bin/ruff check --fix . && .venv/bin/ruff format .  # lint + format (ruff.toml)
.venv/bin/pytest -q                                    # бүх тест
.venv/bin/pytest tests/test_schools.py -k cascade      # нэг тест
```
Local DB: `postgresql+asyncpg://uuganbayar@localhost:5432/schoolpolice` (`backend/.env`). Тестүүд `tests/conftest.py`-ийн sqlite in-memory DB дээр ажиллана (`get_db` override), Postgres хэрэггүй.

Web (`web/` дотроос):
```bash
npm run dev
npx tsc --noEmit && npx eslint src    # өөрчлөлт бүрийн дараа
npx next build                        # prerender алдааг зөвхөн build илрүүлнэ
```

Mobile (`mobile/` дотроос):
```bash
npx expo start
npx tsc --noEmit && npx expo lint
npx expo export --platform ios --output-dir /tmp/expo-out   # Metro bundle шалгалт
npx expo install <pkg>                # npm install биш; .npmrc-д legacy-peer-deps=true
```
Энэ Mac дээр Xcode, Android SDK байхгүй: симулятор ажиллахгүй, mobile-ийг tsc, lint, export-оор л шалгана. Утсан дээр туршихдаа `mobile/.env`-ийн `EXPO_PUBLIC_API_URL`-ийг LAN IP болгоно.

`.claude/launch.json`-д `web`, `api` preview тохиргоо байгаа. `.claude/hooks/lint.sh` нь Edit/Write бүрийн дараа тухайн аппын linter-ийг `--fix`-тэй ажиллуулна (web/mobile: eslint, backend: ruff check + format); үлдсэн алдаа exit 2-оор буцаж ирнэ.

## Тестийн хэрэглэгчид (seed.py)

| Утас | Нууц үг | Эрх |
|---|---|---|
| 99000001 | admin123 | admin |
| 99000002 | parent123 | parent |
| 99000003 | worker123 | worker |

## Backend архитектур

- `app/models/__init__.py`: бүх SQLAlchemy model нэг файлд. `User.role` (parent/worker/admin), `Shift.status`, `Payment.status` нь Python Enum.
- `app/schemas/__init__.py`: бүх Pydantic schema нэг файлд. `*Create`, `*Update` (бүх талбар optional, `exclude_unset`; NOT NULL баганад `_reject_null` validator-оор `null` хориглоно), `*Out` (ORM). `SchoolListOut` нь `crossing_count`-тэй, зөвхөн `/schools` endpoint-ууд буцаана; nested `school`-д байхгүй.
- `app/api/*.py`: router бүр `app/main.py`-д `/api` prefix-тэй бүртгэгдэнэ. `deps.py`-д `DB`, `CurrentUser`, `require_role(...)`.
- **Ээлжийн төлөв**: `open → accepted → in_progress → completed`, аль ч үед `cancelled`. Шилжилт бүр `shifts.py`-д тусдаа endpoint (`/accept`, `/checkin`, `/checkout`, `/cancel`) ба эрх шалгалттай. Гүйцэтгэгч татгалзвал ээлж `open` руу буцна, эцэг эх цуцалбал `cancelled`.
- **GPS check-in**: `shifts.py`-ийн `distance_m` (haversine) гарцын `checkin_radius_m`-тэй харьцуулна.
- **Session-ий анхаарах зүйл**: `expire_on_commit=False` тул commit-ийн дараа relationship хуучирна. Дахин уншихдаа `execution_options(populate_existing=True)` ашигла (`load_shift`, `_get_crossing` жишээ).
- **QPay**: `app/services/qpay.py`. `.env`-д түлхүүр байхгүй бол mock горим: invoice үүсэх, `check_paid` үргэлж true. Callback нь GET `/api/payments/qpay/callback`.
- **Устгах дүрэм**: ээлж бүртгэлтэй гарц, сургуулийг устгахад 409.
- Үнэлгээ өгөхөд `User.rating_avg/rating_count` шууд шинэчлэгдэнэ (reviews.py).

## Web архитектур

- Бүх page `"use client"`. Server component нь root `layout.tsx` болон `admin/layout.tsx` л байна; сүүлийнх нь `export const instant = false` шаардлагатай (нэвтрэлтээс хамаарч child-аа нуудаг).
- `src/lib/api.ts`: нэг `request()` wrapper, token `localStorage`-д (`sp_token`), 204-д `undefined` буцаана. Шинэ endpoint-ийг энд `api.<resource>.<verb>` хэлбэрээр нэм.
- `src/lib/auth.tsx`: `AuthProvider` + `useAuth()`. Хуудас бүр `loading` дууссаны дараа `user`-гүй бол `/login` руу redirect хийнэ.
- `src/components/ui.tsx`: `inputCls`, `btnCls`, `StatusBadge`, `Alert`, `Field`. Шинэ UI-д эдгээрийг дахин ашигла.
- Admin хэсэг `src/app/admin/*`, shell нь `components/AdminShell.tsx`.

### Next.js 16 дүрэм (lint болон build унагана)
- `useParams`, `useSearchParams`, `usePathname` ашигласан client component-ийг `<Suspense>`-д боо (`shifts/[id]/page.tsx` загвар).
- `react-hooks/set-state-in-effect`: effect дотор шууд `setState` хийхгүй. Өгөгдлийг `api.x().then(setX)` хэлбэрээр ачаал, анхны утгыг `useState(() => ...)`-ээр тооцоол.
- Scaffold-ын анхааруулга `web/AGENTS.md`-д байгаа; Next API санахаас биш `node_modules/next/dist/docs/`-оос шалга.

## Mobile архитектур

- Expo Router, route-ууд `src/app/`. `(auth)` ба `(app)` групп; `_layout.tsx`-ийн `Gate` нэвтрэлтээр redirect хийнэ. Route биш код `src/lib/`-д.
- `src/lib/api.ts` web-тэй ижил бүтэцтэй, token AsyncStorage-д.
- `src/lib/ui.tsx`: `Button`, `Input`, `Card`, `StatusBadge`, `colors`. `src/lib/DateTimeField.tsx`: огноо/цаг picker (iOS modal spinner, Android dialog).
- Check-in `expo-location` ашиглана, зөвшөөрлийн текст `app.json`-ийн plugin тохиргоонд.
- Платформ зөвхөн ios, android (`app.json`), web-ийг Next.js хариуцна.
- Scaffold-ын анхааруулга `mobile/AGENTS.md`-д: Expo API-г санахаас биш `https://docs.expo.dev/versions/v57.0.0/`-оос шалга.
