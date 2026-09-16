from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# Engine connected to dedicated user usr_mottus
# Schema search_path configured to bdmottus, public
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"options": f"-csearch_path={settings.DB_SCHEMA},public"},
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
