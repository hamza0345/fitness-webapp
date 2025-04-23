# app/create_tables.py
from .database import engine
from . import models

print("🔧 Creating all tables...")
models.Base.metadata.create_all(bind=engine)
print("✅ Tables created.")
