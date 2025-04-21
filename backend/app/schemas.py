from pydantic import BaseModel

class ExerciseBase(BaseModel):
    name: str
    target_muscle: str
    difficulty: str
    equipment: str | None = None
    research_ref: str | None = None

class ExerciseCreate(ExerciseBase):
    pass

class ExerciseOut(ExerciseBase):
    id: int

    class Config:
        orm_mode = True
