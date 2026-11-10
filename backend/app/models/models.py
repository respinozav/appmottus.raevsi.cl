import uuid
from sqlalchemy import Column, String, Boolean, Numeric, DateTime, Date, ForeignKey, Text, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Role(Base):
    __tablename__ = "roles"
    __table_args__ = {"schema": "bdmottus"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(50), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user_mappings = relationship("UserRole", back_populates="role")

class UserRole(Base):
    __tablename__ = "user_roles"
    __table_args__ = {"schema": "bdmottus"}

    user_id = Column(UUID(as_uuid=True), ForeignKey("bdmottus.users.id", ondelete="CASCADE"), primary_key=True)
    role_id = Column(UUID(as_uuid=True), ForeignKey("bdmottus.roles.id", ondelete="RESTRICT"), nullable=False)
    assigned_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="user_role")
    role = relationship("Role", back_populates="user_mappings")

class User(Base):
    """
    Personal Interno: Roles 'admin' y 'coach'.
    Aislado de atributos antropométricos de alumnos.
    """
    __tablename__ = "users"
    __table_args__ = {"schema": "bdmottus"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    rut = Column(String(20), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=True)
    name = Column(String(255), nullable=True)
    gender = Column(String(20), nullable=True)
    phone = Column(String(50), nullable=True)
    password_hash = Column(String(255), nullable=True)
    role = Column(String(20), nullable=False, default="coach") # 'admin', 'coach'
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user_role = relationship("UserRole", back_populates="user", uselist=False, cascade="all, delete-orphan")

    @property
    def role_id(self):
        return self.user_role.role_id if self.user_role else None

    @property
    def role_info(self):
        return self.user_role.role if self.user_role else None

    created_exercises = relationship("Exercise", back_populates="creator")
    coached_routines = relationship("Routine", back_populates="coach", foreign_keys="Routine.coach_id")
    routine_templates = relationship("RoutineTemplate", back_populates="coach", cascade="all, delete-orphan")
    direct_messages = relationship("DirectMessage", back_populates="coach", cascade="all, delete-orphan", order_by="DirectMessage.created_at.asc()")

class Student(Base):
    """
    Alumnos / Estudiantes del gimnasio.
    Contiene atributos antropométricos y activación por RUT.
    """
    __tablename__ = "students"
    __table_args__ = {"schema": "bdmottus"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    rut = Column(String(20), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=True)
    name = Column(String(255), nullable=True)
    last_name = Column(String(100), nullable=True)
    gender = Column(String(20), nullable=True)
    phone = Column(String(50), nullable=True)
    birth_date = Column(Date, nullable=True)
    location = Column(String(150), nullable=True)
    unit_preference = Column(String(20), default="metric", nullable=False)
    password_hash = Column(String(255), nullable=True)
    weight = Column(Numeric(5, 2), nullable=True)
    height = Column(Numeric(5, 2), nullable=True)
    registration_token = Column(String(255), unique=True, nullable=True, index=True)
    is_registered = Column(Boolean, default=False, nullable=False)
    
    # Membresía y Objetivos Diarios (TrueCoach Phase 2)
    plan_name = Column(String(100), default="Plan Estándar", nullable=True)
    membership_expires_at = Column(Date, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    daily_kcal_target = Column(Integer, nullable=True)
    daily_protein_target = Column(Integer, nullable=True)
    daily_steps_target = Column(Integer, nullable=True)
    daily_water_liters_target = Column(Numeric(3, 1), nullable=True)

    # Ficha Clínica del Atleta (TrueCoach Phase 3)
    injuries_notes = Column(Text, nullable=True)
    fitness_goals = Column(Text, nullable=True)
    equipment_available = Column(Text, nullable=True)
    private_coach_notes = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    @property
    def role(self):
        return "user"

    routines = relationship("Routine", back_populates="student", foreign_keys="Routine.student_id", cascade="all, delete-orphan")
    body_metrics = relationship("BodyMetric", back_populates="student", foreign_keys="BodyMetric.student_id", cascade="all, delete-orphan", order_by="BodyMetric.measured_at.desc()")
    habits = relationship("HabitLog", back_populates="student", foreign_keys="HabitLog.student_id", cascade="all, delete-orphan", order_by="HabitLog.log_date.desc()")
    direct_messages = relationship("DirectMessage", back_populates="student", cascade="all, delete-orphan", order_by="DirectMessage.created_at.asc()")

class Category(Base):
    __tablename__ = "categories"
    __table_args__ = {"schema": "bdmottus"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)

    exercises = relationship("Exercise", back_populates="category", cascade="all, delete-orphan")

class Exercise(Base):
    __tablename__ = "exercises"
    __table_args__ = {"schema": "bdmottus"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    category_id = Column(UUID(as_uuid=True), ForeignKey("bdmottus.categories.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    youtube_url = Column(String(500), nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("bdmottus.users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    category = relationship("Category", back_populates="exercises")
    creator = relationship("User", back_populates="created_exercises")
    routine_associations = relationship("RoutineExercise", back_populates="exercise", cascade="all, delete-orphan")
    template_associations = relationship("RoutineTemplateExercise", back_populates="exercise", cascade="all, delete-orphan")

class Routine(Base):
    __tablename__ = "routines"
    __table_args__ = {"schema": "bdmottus"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("bdmottus.students.id", ondelete="CASCADE"), nullable=False)
    coach_id = Column(UUID(as_uuid=True), ForeignKey("bdmottus.users.id", ondelete="RESTRICT"), nullable=False)
    title = Column(String(200), default="Rutina Mottus")
    scheduled_at = Column(DateTime(timezone=True), nullable=False)
    is_executed = Column(Boolean, default=False, nullable=False)
    executed_at = Column(DateTime(timezone=True), nullable=True)
    notes = Column(Text, nullable=True)
    
    # Estructura en 3 Bloques y Revisión (TrueCoach Phase 3)
    warmup_notes = Column(Text, nullable=True)
    cooldown_notes = Column(Text, nullable=True)
    is_reviewed_by_coach = Column(Boolean, default=False, nullable=False)
    coach_reviewed_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    student = relationship("Student", foreign_keys=[student_id], back_populates="routines")
    coach = relationship("User", foreign_keys=[coach_id], back_populates="coached_routines")
    routine_exercises = relationship("RoutineExercise", back_populates="routine", cascade="all, delete-orphan", order_by="RoutineExercise.order_index, RoutineExercise.created_at")
    comments = relationship("RoutineComment", back_populates="routine", cascade="all, delete-orphan", order_by="RoutineComment.created_at.asc()")

class RoutineExercise(Base):
    __tablename__ = "routine_exercises"
    __table_args__ = {"schema": "bdmottus"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    routine_id = Column(UUID(as_uuid=True), ForeignKey("bdmottus.routines.id", ondelete="CASCADE"), nullable=False)
    exercise_id = Column(UUID(as_uuid=True), ForeignKey("bdmottus.exercises.id", ondelete="CASCADE"), nullable=False)
    series = Column(Integer, default=3)
    repetitions = Column(String(50), default="12 reps")
    rest_seconds = Column(Integer, default=60)
    order_index = Column(Integer, default=1)
    superset_group = Column(String(10), nullable=True) # e.g. 'A1', 'A2', 'B1'
    target_weight = Column(Numeric(6, 2), nullable=True) # e.g. 80.00 kg
    target_rpe = Column(Numeric(3, 1), nullable=True) # e.g. 8.5
    tempo = Column(String(20), nullable=True) # e.g. '3-1-1-0'
    coach_notes = Column(Text, nullable=True)
    
    # Bloques y Formato de Entrenamiento (TrueCoach Phase 3)
    block_section = Column(String(20), default="main", nullable=False) # 'warmup', 'main', 'cooldown'
    workout_format = Column(String(30), default="regular", nullable=False) # 'regular', 'superset', 'circuit', 'amrap', 'emom'

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    routine = relationship("Routine", back_populates="routine_exercises")
    exercise = relationship("Exercise", back_populates="routine_associations")
    exercise_logs = relationship("ExerciseLog", back_populates="routine_exercise", cascade="all, delete-orphan", order_by="ExerciseLog.set_number.asc()")

class ExerciseLog(Base):
    """
    Registro real serie por serie completado por el alumno o coach (Workout Logging TrueCoach).
    """
    __tablename__ = "exercise_logs"
    __table_args__ = {"schema": "bdmottus"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    routine_exercise_id = Column(UUID(as_uuid=True), ForeignKey("bdmottus.routine_exercises.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(UUID(as_uuid=True), ForeignKey("bdmottus.students.id", ondelete="CASCADE"), nullable=False)
    set_number = Column(Integer, nullable=False)
    actual_weight = Column(Numeric(6, 2), nullable=True)
    actual_reps = Column(Integer, nullable=True)
    actual_rpe = Column(Numeric(3, 1), nullable=True)
    is_completed = Column(Boolean, default=False, nullable=False)
    student_notes = Column(Text, nullable=True)
    logged_at = Column(DateTime(timezone=True), server_default=func.now())

    routine_exercise = relationship("RoutineExercise", back_populates="exercise_logs")
    student = relationship("Student", foreign_keys=[student_id])

class RoutineComment(Base):
    """
    Comentarios y feedback bidireccional entre Coach y Alumno por sesión de entrenamiento.
    """
    __tablename__ = "routine_comments"
    __table_args__ = {"schema": "bdmottus"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    routine_id = Column(UUID(as_uuid=True), ForeignKey("bdmottus.routines.id", ondelete="CASCADE"), nullable=False)
    author_type = Column(String(20), nullable=False) # 'coach', 'student'
    author_id = Column(UUID(as_uuid=True), nullable=False)
    author_name = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    routine = relationship("Routine", back_populates="comments")

class BodyMetric(Base):
    __tablename__ = "body_metrics"
    __table_args__ = {"schema": "bdmottus"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("bdmottus.students.id", ondelete="CASCADE"), nullable=False)
    recorded_by = Column(UUID(as_uuid=True), ForeignKey("bdmottus.users.id", ondelete="SET NULL"), nullable=True)
    weight = Column(Numeric(5, 2), nullable=False)
    height = Column(Numeric(5, 2), nullable=True)
    body_fat_percentage = Column(Numeric(4, 1), nullable=True)
    muscle_mass = Column(Numeric(5, 2), nullable=True)
    notes = Column(Text, nullable=True)

    # Perímetros Anatómicos y Fotos de Progreso (TrueCoach Phase 3)
    waist_cm = Column(Numeric(5, 2), nullable=True)
    hip_cm = Column(Numeric(5, 2), nullable=True)
    chest_cm = Column(Numeric(5, 2), nullable=True)
    arm_cm = Column(Numeric(5, 2), nullable=True)
    thigh_cm = Column(Numeric(5, 2), nullable=True)
    photo_front_url = Column(Text, nullable=True)
    photo_side_url = Column(Text, nullable=True)
    photo_back_url = Column(Text, nullable=True)

    measured_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    student = relationship("Student", foreign_keys=[student_id], back_populates="body_metrics")
    recorder = relationship("User", foreign_keys=[recorded_by])

class RoutineTemplate(Base):
    """
    Plantillas maestras de entrenamiento reutilizables creadas por los coaches (TrueCoach Workout Templates).
    """
    __tablename__ = "routine_templates"
    __table_args__ = {"schema": "bdmottus"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    coach_id = Column(UUID(as_uuid=True), ForeignKey("bdmottus.users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    category_tag = Column(String(50), default="General", nullable=False)

    # Bloques y Programación Multi-Semana (TrueCoach Phase 3)
    warmup_notes = Column(Text, nullable=True)
    cooldown_notes = Column(Text, nullable=True)
    week_number = Column(Integer, default=1, nullable=False)
    day_of_week = Column(Integer, default=1, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    coach = relationship("User", back_populates="routine_templates")
    template_exercises = relationship("RoutineTemplateExercise", back_populates="template", cascade="all, delete-orphan", order_by="RoutineTemplateExercise.order_index, RoutineTemplateExercise.created_at")

class RoutineTemplateExercise(Base):
    """
    Prescripción de ejercicio dentro de una plantilla de entrenamiento.
    """
    __tablename__ = "routine_template_exercises"
    __table_args__ = {"schema": "bdmottus"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    template_id = Column(UUID(as_uuid=True), ForeignKey("bdmottus.routine_templates.id", ondelete="CASCADE"), nullable=False)
    exercise_id = Column(UUID(as_uuid=True), ForeignKey("bdmottus.exercises.id", ondelete="CASCADE"), nullable=False)
    order_index = Column(Integer, default=1)
    superset_group = Column(String(10), nullable=True)
    series = Column(Integer, default=3)
    repetitions = Column(String(50), default="12 reps")
    rest_seconds = Column(Integer, default=60)
    target_weight = Column(Numeric(6, 2), nullable=True)
    target_rpe = Column(Numeric(3, 1), nullable=True)
    tempo = Column(String(20), nullable=True)
    coach_notes = Column(Text, nullable=True)

    # Bloques y Formato de Entrenamiento (TrueCoach Phase 3)
    block_section = Column(String(20), default="main", nullable=False) # 'warmup', 'main', 'cooldown'
    workout_format = Column(String(30), default="regular", nullable=False) # 'regular', 'superset', 'circuit', 'amrap', 'emom'

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    template = relationship("RoutineTemplate", back_populates="template_exercises")
    exercise = relationship("Exercise", back_populates="template_associations")

class HabitLog(Base):
    """
    Registro diario de hábitos del alumno (Nutrición, Hidratación, Pasos, Sueño).
    """
    __tablename__ = "habit_logs"
    __table_args__ = {"schema": "bdmottus"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("bdmottus.students.id", ondelete="CASCADE"), nullable=False)
    log_date = Column(Date, nullable=False, default=func.current_date())
    kcal_consumed = Column(Integer, nullable=True)
    protein_grams = Column(Integer, nullable=True)
    water_liters = Column(Numeric(3, 1), nullable=True)
    steps = Column(Integer, nullable=True)
    sleep_hours = Column(Numeric(3, 1), nullable=True)
    notes = Column(Text, nullable=True)
    logged_at = Column(DateTime(timezone=True), server_default=func.now())

    student = relationship("Student", foreign_keys=[student_id], back_populates="habits")

class DirectMessage(Base):
    """
    Mensajería Directa 1 a 1 entre Alumno y Coach (TrueCoach Direct Inbox).
    """
    __tablename__ = "direct_messages"
    __table_args__ = {"schema": "bdmottus"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("bdmottus.students.id", ondelete="CASCADE"), nullable=False)
    coach_id = Column(UUID(as_uuid=True), ForeignKey("bdmottus.users.id", ondelete="CASCADE"), nullable=False)
    sender_role = Column(String(20), nullable=False) # 'coach', 'student'
    content = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    student = relationship("Student", foreign_keys=[student_id], back_populates="direct_messages")
    coach = relationship("User", foreign_keys=[coach_id], back_populates="direct_messages")
