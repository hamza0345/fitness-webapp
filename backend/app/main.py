from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from .database import SessionLocal, engine
from . import models, schemas, crud

# Create tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="FitTrack API")

# ── Allow frontend to talk to backend ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace with your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Dependency for DB session ──
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ── Routes ──
@app.get("/")
def root():
    return {"status": "FitTrack backend is running"}

@app.post("/exercises/", response_model=schemas.ExerciseOut)
def add_exercise(exercise: schemas.ExerciseCreate, db: Session = Depends(get_db)):
    return crud.create_exercise(db, exercise)

@app.get("/exercises/", response_model=list[schemas.ExerciseOut])
def list_exercises(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_exercises(db, skip, limit)
