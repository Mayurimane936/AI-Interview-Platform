from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "AI Interview Platform"
    environment: str = "development"
    api_url: str = "http://127.0.0.1:8000"

    database_url: str
    redis_url: str

    jwt_secret: str

    ai_provider: str = "gemini"
    ai_api_key: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )


settings = Settings()