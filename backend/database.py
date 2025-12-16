from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# This creates a file named 'climax.db' in your backend folder
SQLALCHEMY_DATABASE_URL = "sqlite:///./climax.db"

# The engine is the "motor" that drives the connection
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# A "Session" is a temporary workspace for your database operations
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# The Base class for our models
Base = declarative_base()
