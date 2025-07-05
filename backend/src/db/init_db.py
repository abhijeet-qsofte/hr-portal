from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session
from db.base import Base
from db.session import engine, SessionLocal
from utils.seed_data import seed_all

async def init_db():
    """
    Initialize the database by creating all tables if they don't exist
    """
    # Create all tables
    Base.metadata.create_all(bind=engine)

def seed_db():
    """
    Seed the database with initial data
    """
    db = SessionLocal()
    try:
        seed_all(db)
    finally:
        db.close()
        
if __name__ == "__main__":
    # This allows running the script directly to seed the database
    seed_db()
