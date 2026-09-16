import uuid
from sqlalchemy import Column, String, Boolean, Numeric, DateTime, ForeignKey, Text, Integer
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
    gender = Column(String(20), nullable=True)
    phone = Column(String(50), nullable=True)
    password_hash = Column(String(255), nullable=True)
    weight = Column(Numeric(5, 2), nullable=True)
    height = Column(Numeric(5, 2), nullable=True)
    registration_token = Column(String(255), unique=True, nullable=True, index=True)
    is_registered = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    @property
    def role(self):
        return "user"

    routines = relationship("Routine", back_populates="student", foreign_keys="Routine.student_id", cascade="all, delete-orphan")
    body_metrics = relationship("BodyMetric", back_populates="student", foreign_keys="BodyMetric.student_id", cascade="all, delete-orphan", order_by="BodyMetric.measured_at.desc()")

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
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    student = relationship("Student", foreign_keys=[student_id], back_populates="routines")
    coach = relationship("User", foreign_keys=[coach_id], back_populates="coached_routines")
    routine_exercises = relationship("RoutineExercise", back_populates="routine", cascade="all, delete-orphan", order_by="RoutineExercise.created_at")

class RoutineExercise(Base):
    __tablename__ = "routine_exercises"
    __table_args__ = {"schema": "bdmottus"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    routine_id = Column(UUID(as_uuid=True), ForeignKey("bdmottus.routines.id", ondelete="CASCADE"), nullable=False)
    exercise_id = Column(UUID(as_uuid=True), ForeignKey("bdmottus.exercises.id", ondelete="CASCADE"), nullable=False)
    series = Column(Integer, default=3)
    repetitions = Column(String(50), default="12 reps")
    rest_seconds = Column(Integer, default=60)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    routine = relationship("Routine", back_populates="routine_exercises")
    exercise = relationship("Exercise", back_populates="routine_associations")

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
    measured_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    student = relationship("Student", foreign_keys=[student_id], back_populates="body_metrics")
    recorder = relationship("User", foreign_keys=[recorded_by])
