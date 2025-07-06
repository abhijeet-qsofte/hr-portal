"""
Script to check database connection and schema.
"""
import os
import sys
from sqlalchemy import inspect, text
from dotenv import load_dotenv

# Add the project root to the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.db.session import engine

def check_database_connection():
    """Check if we can connect to the database."""
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("✅ Database connection successful!")
            return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

def list_tables():
    """List all tables in the database."""
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    
    print("\n📋 Tables in database:")
    if tables:
        for table in tables:
            print(f"  - {table}")
    else:
        print("  No tables found!")
    
    # Check for specific tables we need
    required_tables = ["users", "roles", "permissions", "user_roles"]
    missing_tables = [table for table in required_tables if table not in tables]
    
    if missing_tables:
        print("\n❌ Missing required tables:")
        for table in missing_tables:
            print(f"  - {table}")
    else:
        print("\n✅ All required tables exist!")
    
    return tables

def check_table_columns(table_name):
    """Check columns in a specific table."""
    inspector = inspect(engine)
    
    if table_name not in inspector.get_table_names():
        print(f"\n❌ Table '{table_name}' does not exist!")
        return
    
    columns = inspector.get_columns(table_name)
    print(f"\n📋 Columns in '{table_name}':")
    for column in columns:
        print(f"  - {column['name']} ({column['type']})")

if __name__ == "__main__":
    if check_database_connection():
        tables = list_tables()
        
        # Check columns for auth tables if they exist
        for table in ["users", "roles", "permissions"]:
            if table in tables:
                check_table_columns(table)
