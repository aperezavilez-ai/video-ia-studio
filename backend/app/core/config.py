"""Application configuration"""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings"""
    
    # API
    API_V1_PREFIX: str = "/api/v1"
    PROJECT_NAME: str = "Video IA Studio"
    
    # Database
    DATABASE_URL: str = "postgresql://admin:changeme@localhost:5432/video_ia_studio"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Gafcore Gateway AI Service
    GAFCORE_GATEWAY_URL: str = "https://gafcore-gateway.vercel.app/api/openai/v1"
    GAFCORE_API_KEY: str = "sk-855baab0e2ffc3f093cd71e2ea2cc4ae6ec3527e1692200ee93bd566e29af6e2"
    GAFCORE_DEFAULT_MODEL: str = "gpt-5.6-luna"
    
    # CORS
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000"]
    
    # Storage
    STORAGE_PATH: str = "/storage"
    FILM_BIBLE_PATH: str = "/film-bible"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
