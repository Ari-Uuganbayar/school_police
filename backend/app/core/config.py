from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    DATABASE_URL: str = "postgresql+asyncpg://localhost:5432/schoolpolice"
    SECRET_KEY: str = "dev-secret"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 30
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:8081"]

    QPAY_BASE_URL: str = "https://merchant-sandbox.qpay.mn/v2"
    QPAY_USERNAME: str = ""
    QPAY_PASSWORD: str = ""
    QPAY_INVOICE_CODE: str = ""
    QPAY_CALLBACK_URL: str = "http://localhost:8000/api/payments/qpay/callback"

    PLATFORM_FEE_PERCENT: int = 10


settings = Settings()
