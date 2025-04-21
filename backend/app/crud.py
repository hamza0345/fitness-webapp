from sqlalchemy.orm import Session
from . import models, schemas

# ---------- Exercise ----------
def create_exercise(db: Session, ex: schemas.ExerciseCreate):
    db_ex = models.Exercise(**ex.dict())
    db.add(db_ex)
    db.commit()
    db.refresh(db_ex)
    return db_ex

def get_exercises(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Exercise).offset(skip).limit(limit).all()
