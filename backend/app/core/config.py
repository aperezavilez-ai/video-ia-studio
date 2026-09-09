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

    # Supabase GafCore (dedicated instance)
    SUPABASE_URL: str = "https://supabase.gafcore.com/video-ia-studio"
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Gafcore Gateway AI Service
    GAFCORE_GATEWAY_URL: str = "https://gafcore-gateway.vercel.app/api/openai/v1"
    GAFCORE_API_KEY: str = ""
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
