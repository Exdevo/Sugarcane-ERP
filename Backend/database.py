from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# You can later switch to PostgreSQL without changing code
DATABASE_URL = "sqlite:///./sugarcane_erp.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}  # SQLite only
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()