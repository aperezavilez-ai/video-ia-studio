"""Database connection and session management"""
from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import settings

# Dedicated Supabase schema for this project
DB_SCHEMA = "video_ia_studio"

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    connect_args={"options": f"-csearch_path={DB_SCHEMA},public"},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


@event.listens_for(engine, "connect")
def _set_search_path(dbapi_connection, _connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute(f"SET search_path TO {DB_SCHEMA}, public")
    cursor.close()


def get_db():
    """Database session dependency"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
