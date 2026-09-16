from uuid import UUID
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field

# User Schemas (Internal Staff: Coach, Admin)
class UserBase(BaseModel):
    rut: str
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    role: str = "coach"

class UserLogin(BaseModel):
    identifier: str # rut or email
    password: str

class UserOut(BaseModel):
    id: UUID
    rut: str
    email: Optional[str] = None
    name: Optional[str] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    role: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Student Schemas (Mottus Students / Alumnos)
class StudentBase(BaseModel):
    rut: str
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    weight: Optional[float] = None
    height: Optional[float] = None

class StudentCreateByCoach(BaseModel):
    rut: str

class StudentCompleteRegistration(BaseModel):
    token: str
    name: str
    gender: str
    phone: str
    password: str
    weight: float
    height: float
    email: Optional[EmailStr] = None

class StudentOut(BaseModel):
    id: UUID
    rut: str
    email: Optional[str] = None
    name: Optional[str] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    weight: Optional[float] = None
    height: Optional[float] = None
    role: str = "user"
    is_registered: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class StudentWithTokenOut(BaseModel):
    id: UUID
    rut: str
    role: str = "user"
    registration_token: Optional[str]
    registration_url: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict # Puede ser UserOut o StudentOut serializado como dict

# Category Schemas
class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None

class CategoryCreate(CategoryBase):
    pass

class CategoryOut(CategoryBase):
    id: UUID

    class Config:
        from_attributes = True

# Exercise Schemas
class ExerciseBase(BaseModel):
    category_id: UUID
    name: str
    description: Optional[str] = None
    youtube_url: str

class ExerciseCreate(ExerciseBase):
    pass

class ExerciseOut(ExerciseBase):
    id: UUID
    created_by: Optional[UUID] = None
    created_at: Optional[datetime] = None
    category: Optional[CategoryOut] = None

    class Config:
        from_attributes = True

# Routine Exercise Detail
class RoutineExerciseDetail(BaseModel):
    exercise_id: UUID
    series: int = 3
    repetitions: str = "12 reps"
    rest_seconds: int = 60

class RoutineExerciseOut(BaseModel):
    id: UUID
    exercise_id: UUID
    series: int
    repetitions: str
    rest_seconds: int
    exercise: Optional[ExerciseOut] = None

    class Config:
        from_attributes = True

# Routine Schemas
class RoutineCreate(BaseModel):
    student_id: Optional[UUID] = None
    user_id: Optional[UUID] = None # Compatibilidad frontend
    title: Optional[str] = "Rutina Mottus"
    scheduled_at: datetime
    notes: Optional[str] = None
    exercises: List[RoutineExerciseDetail]

    @property
    def target_student_id(self) -> UUID:
        return self.student_id or self.user_id

class RoutineOut(BaseModel):
    id: UUID
    student_id: UUID
    coach_id: UUID
    title: str
    scheduled_at: datetime
    is_executed: bool
    executed_at: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    student: Optional[StudentOut] = None
    user: Optional[StudentOut] = Field(default=None, alias="student") # Compatibilidad frontend
    coach: Optional[UserOut] = None
    routine_exercises: List[RoutineExerciseOut] = []

    class Config:
        from_attributes = True
        populate_by_name = True

class RoutineStatusUpdate(BaseModel):
    is_executed: bool

# Body Metrics Schemas
class BodyMetricBase(BaseModel):
    weight: float
    height: Optional[float] = None
    body_fat_percentage: Optional[float] = None
    muscle_mass: Optional[float] = None
    notes: Optional[str] = None
    measured_at: Optional[datetime] = None

class BodyMetricCreate(BodyMetricBase):
    pass

class BodyMetricOut(BodyMetricBase):
    id: UUID
    student_id: UUID
    user_id: Optional[UUID] = None # Compatibilidad frontend
    recorded_by: Optional[UUID] = None
    created_at: Optional[datetime] = None
    bmi: Optional[float] = None

    class Config:
        from_attributes = True

# Analytics & Compliance Schemas
class StudentComplianceSummary(BaseModel):
    student_id: UUID
    user_id: Optional[UUID] = None # Compatibilidad frontend
    name: Optional[str]
    rut: str
    total_routines: int
    executed_routines: int
    pending_routines: int
    compliance_rate: float
    last_executed_at: Optional[datetime] = None
    last_weight: Optional[float] = None

class ComplianceTimelinePoint(BaseModel):
    date: str
    scheduled: int
    executed: int

class CoachComplianceStats(BaseModel):
    total_routines: int
    executed_routines: int
    pending_routines: int
    overall_compliance_rate: float
    total_students: int
    active_students_with_routines: int
    students_summary: List[StudentComplianceSummary]
    timeline: List[ComplianceTimelinePoint]
