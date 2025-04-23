"""
Run once with:  python -m app.seed_exercises
Populates the Exercise table with ~20 research‑backed movements.
"""
from sqlalchemy.orm import Session
from .database import SessionLocal
from . import models

seed_data = [
    ("Barbell Back Squat", "Quadriceps/Glutes", "Intermediate",
     "Barbell & Rack", "Schoenfeld BJ 2016 JSCR"),
    ("Romanian Deadlift", "Hamstrings/Glutes", "Intermediate",
     "Barbell", "San Juan JF 2020 J Sports Sci"),
    ("Bench Press", "Pectorals", "Intermediate",
     "Barbell & Bench", "Sakamoto A 2022 Eur J App Physiol"),
    ("Push‑up", "Pectorals", "Beginner",
     "Body‑weight", "Calatayud J 2014 JSCR"),
    ("Plank", "Core", "Beginner",
     "Body‑weight", "Ekstrom RA 2017 Phys Ther"),
    # …add the rest of your curated list here
]

def main():
    db: Session = SessionLocal()
    for name, muscle, diff, equip, ref in seed_data:
        exists = db.query(models.Exercise).filter(models.Exercise.name == name).first()
        if not exists:
            ex = models.Exercise(
                name=name,
                target_muscle=muscle,
                difficulty=diff,
                equipment=equip,
                research_ref=ref,
            )
            db.add(ex)
    db.commit()
    db.close()
    print("🚀  Exercises seeded!")

if __name__ == "__main__":
    main()
