from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Configure engine with SQLite-specific settings if using SQLite
engine_args = {}
if "sqlite" in settings.database_url:
    # Disable insertmanyvalues for SQLite to avoid UUID issues
    engine_args["use_insertmanyvalues"] = False

engine = create_engine(settings.database_url, **engine_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
