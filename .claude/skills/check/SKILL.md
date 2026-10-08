---
name: check
description: Гурван аппын (backend, web, mobile) бүх статик шалгалт, тест, build-ийг нэг дор ажиллуулж, алдааг нэгтгэн тайлагнана. Код засаж дууссаны дараа, commit хийхийн өмнө ашиглана.
argument-hint: "[backend|web|mobile] (хоосон бол бүгд)"
allowed-tools: Bash(.venv/bin/pytest *), Bash(npx tsc *), Bash(npx eslint *), Bash(npx next build *), Bash(npx expo lint *), Bash(npx expo export *), Bash(git status *)
---

# /check — төслийн бүх шалгалт

`$ARGUMENTS` хоосон бол гурвууланг нь, аль нэг нэрийг өгвөл зөвхөн түүнийг шалга.
Хавтас бүрийн командыг тухайн хавтсаас нь абсолют замаар ажиллуул. Бие даасан шалгалтуудыг зэрэг (нэг мессежид олон Bash) ажиллуулж хугацаа хэмнэ.

## Backend (`backend/`)
```bash
.venv/bin/pytest -q
```
Postgres хэрэггүй, тест sqlite дээр ажиллана. Хэрэв `alembic` migration-тай холбоотой өөрчлөлт байвал нэмээд:
```bash
.venv/bin/alembic check
```

## Web (`web/`)
```bash
npx tsc --noEmit && npx eslint src
```
```bash
npx next build
```
`next build` заавал: `useParams`/`useSearchParams`/`usePathname` Suspense-гүй, dropped segment зэрэг prerender алдааг зөвхөн build илрүүлнэ.

## Mobile (`mobile/`)
```bash
npx tsc --noEmit && npx expo lint
```
```bash
npx expo export --platform ios --output-dir /tmp/sp-expo-check
```
Export нь Metro bundle-ийг бүрэн хийж, import, native module холболтыг шалгана. Симулятор энэ Mac дээр байхгүй.

## Нэмэлт шалгалт
- `web/src/lib/types.ts` ба `mobile/src/lib/types.ts` ижил байх ёстой. Backend schema өөрчлөгдсөн бол:
  ```bash
  diff web/src/lib/types.ts mobile/src/lib/types.ts
  ```

## Тайлан
Хавтас бүрээр нэг мөр: ✅ эсвэл ❌ + алдааны тоо. Алдаа байвал файл:мөр, мессежийг нь жагсаа, засах саналыг нэг мөрөөр хэл. Алдаагүй бол `git status --short`-оор commit хийгдээгүй файлуудыг харуул.
