"""
Base class for SQLAlchemy models.
This file is used to define the Base class that all models inherit from.
Implements a singleton pattern to ensure only one instance of Base exists.
"""
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import MetaData

# Singleton class to ensure only one Base instance exists
class BaseSingleton:
    _instance = None
    
    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            # Configure metadata with table options
            metadata = MetaData()
            # Create Base class with extend_existing=True
            cls._instance = declarative_base(metadata=metadata)
            
            # Base configuration is complete
        
        return cls._instance

# Export the Base instance
Base = BaseSingleton.get_instance()
