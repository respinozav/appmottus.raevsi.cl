from uuid import UUID
from datetime import datetime, date
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
    plan_name: Optional[str] = "Plan Estándar"
    membership_expires_at: Optional[date] = None
    is_active: bool = True
    daily_kcal_target: Optional[int] = None
    daily_protein_target: Optional[int] = None
    daily_steps_target: Optional[int] = None
    daily_water_liters_target: Optional[float] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class StudentCoachSettingsUpdate(BaseModel):
    plan_name: Optional[str] = None
    membership_expires_at: Optional[date] = None
    is_active: Optional[bool] = None
    daily_kcal_target: Optional[int] = None
    daily_protein_target: Optional[int] = None
    daily_steps_target: Optional[int] = None
    daily_water_liters_target: Optional[float] = None

class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None

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

# Exercise Log Schemas (TrueCoach Workout Logging)
class ExerciseLogUpsert(BaseModel):
    routine_exercise_id: UUID
    set_number: int
    actual_weight: Optional[float] = None
    actual_reps: Optional[int] = None
    actual_rpe: Optional[float] = None
    is_completed: bool = False
    student_notes: Optional[str] = None

class ExerciseLogBatchUpsert(BaseModel):
    logs: List[ExerciseLogUpsert]

class ExerciseLogOut(BaseModel):
    id: UUID
    routine_exercise_id: UUID
    student_id: UUID
    set_number: int
    actual_weight: Optional[float] = None
    actual_reps: Optional[int] = None
    actual_rpe: Optional[float] = None
    is_completed: bool
    student_notes: Optional[str] = None
    logged_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Routine Comment Schemas (Feedback Coach <-> Alumno)
class RoutineCommentCreate(BaseModel):
    content: str

class RoutineCommentOut(BaseModel):
    id: UUID
    routine_id: UUID
    author_type: str
    author_id: UUID
    author_name: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True

# Routine Exercise Detail
class RoutineExerciseDetail(BaseModel):
    exercise_id: UUID
    series: int = 3
    repetitions: str = "12 reps"
    rest_seconds: int = 60
    order_index: Optional[int] = 1
    superset_group: Optional[str] = None
    target_weight: Optional[float] = None
    target_rpe: Optional[float] = None
    tempo: Optional[str] = None
    coach_notes: Optional[str] = None

class RoutineExerciseOut(BaseModel):
    id: UUID
    exercise_id: UUID
    series: int
    repetitions: str
    rest_seconds: int
    order_index: Optional[int] = 1
    superset_group: Optional[str] = None
    target_weight: Optional[float] = None
    target_rpe: Optional[float] = None
    tempo: Optional[str] = None
    coach_notes: Optional[str] = None
    exercise: Optional[ExerciseOut] = None
    exercise_logs: List[ExerciseLogOut] = []

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
    duplicate_to_dates: Optional[List[datetime]] = None # Programación periódica TrueCoach

    @property
    def target_student_id(self) -> UUID:
        return self.student_id or self.user_id

class RoutineUpdate(BaseModel):
    title: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    notes: Optional[str] = None
    exercises: Optional[List[RoutineExerciseDetail]] = None

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
    comments: List[RoutineCommentOut] = []

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

# Exercise History & 1RM Schemas (Epley: Weight * (1 + Reps/30))
class ExerciseHistoryPoint(BaseModel):
    logged_at: datetime
    routine_id: UUID
    routine_title: str
    set_number: int
    actual_weight: float
    actual_reps: int
    actual_rpe: Optional[float] = None
    estimated_1rm: float
    volume: float # actual_weight * actual_reps
    student_notes: Optional[str] = None

class ExerciseHistorySession(BaseModel):
    date: str
    routine_id: UUID
    routine_title: str
    max_weight: float
    max_estimated_1rm: float
    total_volume: float
    sets: List[ExerciseHistoryPoint]

class ExerciseStrengthAnalysis(BaseModel):
    student_id: UUID
    exercise_id: UUID
    exercise_name: str
    category_name: Optional[str] = None
    all_time_best_1rm: float
    all_time_max_weight: float
    total_volume_lifted: float
    total_sessions_count: int
    sessions: List[ExerciseHistorySession]

# Workout Templates (TrueCoach Phase 2)
class RoutineTemplateExerciseCreate(BaseModel):
    exercise_id: UUID
    order_index: Optional[int] = 1
    superset_group: Optional[str] = None
    series: Optional[int] = 3
    repetitions: Optional[str] = "12 reps"
    rest_seconds: Optional[int] = 60
    target_weight: Optional[float] = None
    target_rpe: Optional[float] = None
    tempo: Optional[str] = None
    coach_notes: Optional[str] = None

class RoutineTemplateExerciseOut(BaseModel):
    id: UUID
    template_id: UUID
    exercise_id: UUID
    exercise_name: Optional[str] = None
    order_index: int
    superset_group: Optional[str] = None
    series: int
    repetitions: str
    rest_seconds: int
    target_weight: Optional[float] = None
    target_rpe: Optional[float] = None
    tempo: Optional[str] = None
    coach_notes: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class RoutineTemplateCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category_tag: Optional[str] = "General"
    exercises: List[RoutineTemplateExerciseCreate] = []

class RoutineTemplateSaveFromExisting(BaseModel):
    title: str
    description: Optional[str] = None
    category_tag: Optional[str] = "General"

class RoutineTemplateOut(BaseModel):
    id: UUID
    coach_id: UUID
    coach_name: Optional[str] = None
    title: str
    description: Optional[str] = None
    category_tag: str
    created_at: Optional[datetime] = None
    template_exercises: List[RoutineTemplateExerciseOut] = []

    class Config:
        from_attributes = True

# Daily Habits & Nutrition (TrueCoach Phase 2)
class HabitLogCreate(BaseModel):
    log_date: Optional[date] = None
    kcal_consumed: Optional[int] = None
    protein_grams: Optional[int] = None
    water_liters: Optional[float] = None
    steps: Optional[int] = None
    sleep_hours: Optional[float] = None
    notes: Optional[str] = None

class HabitLogOut(BaseModel):
    id: UUID
    student_id: UUID
    log_date: date
    kcal_consumed: Optional[int] = None
    protein_grams: Optional[int] = None
    water_liters: Optional[float] = None
    steps: Optional[int] = None
    sleep_hours: Optional[float] = None
    notes: Optional[str] = None
    logged_at: Optional[datetime] = None

    class Config:
        from_attributes = True
