# School Police API

```bash
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
cp .env.example .env            # DATABASE_URL-ээ засна
.venv/bin/alembic upgrade head  # хүснэгтүүд үүсгэх
.venv/bin/python seed.py        # тестийн өгөгдөл
.venv/bin/fastapi dev app/main.py   # http://localhost:8000/docs
```

Тестийн хэрэглэгчид: 99000001/admin123 (админ), 99000002/parent123 (эцэг эх), 99000003/worker123 (гүйцэтгэгч).
