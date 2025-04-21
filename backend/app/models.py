from sqlalchemy import Column, Integer, String
from .database import Base

class Exercise(Base):
    __tablename__ = "exercises"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    target_muscle = Column(String, index=True)
    difficulty = Column(String)
    equipment = Column(String, default="Body‑weight")
    research_ref = Column(String)  # journal / DOI / PubMed link
