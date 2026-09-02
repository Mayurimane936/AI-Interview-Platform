from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "AI Interview Platform"
    environment: str = "development"

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