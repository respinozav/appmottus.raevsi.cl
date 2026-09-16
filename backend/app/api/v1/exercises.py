import re
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from app.core.database import get_db
from app.models.models import Exercise, Category, User
from app.schemas.schemas import ExerciseCreate, ExerciseOut
from app.api.deps import get_current_user, require_coach

router = APIRouter()

def normalize_youtube_url(url: str) -> str:
    """
    Valida y normaliza la URL de YouTube a un formato estándar embed o watch.
    Acepta:
    - https://www.youtube.com/watch?v=VIDEO_ID
    - https://youtu.be/VIDEO_ID
    - https://www.youtube.com/embed/VIDEO_ID
    - https://www.youtube.com/shorts/VIDEO_ID
    """
    url = url.strip()
    # Extraer ID
    regex = r'(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})'
    match = re.search(regex, url)
    if not match:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La URL ingresada no corresponde a un video válido de YouTube."
        )
    video_id = match.group(1)
    return f"https://www.youtube.com/watch?v={video_id}"

@router.get("/", response_model=List[ExerciseOut])
def list_exercises(
    category_id: Optional[UUID] = Query(None, description="Filtrar por categoría"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lista todos los ejercicios con sus categorías asociadas.
    Permite filtrar por categoría.
    """
    query = db.query(Exercise).options(joinedload(Exercise.category))
    if category_id:
        query = query.filter(Exercise.category_id == category_id)
    return query.order_by(Exercise.created_at.desc()).all()

@router.post("/", response_model=ExerciseOut)
def create_exercise(
    data: ExerciseCreate,
    db: Session = Depends(get_db),
    current_coach: User = Depends(require_coach)
):
    """
    Solo Coaches y Administradores pueden registrar nuevos ejercicios con URL de YouTube.
    """
    # Verificar que exista la categoría
    category = db.query(Category).filter(Category.id == data.category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="La categoría especificada no existe."
        )

    # Validar formato YouTube
    clean_url = normalize_youtube_url(data.youtube_url)

    exercise = Exercise(
        category_id=data.category_id,
        name=data.name.strip(),
        description=data.description,
        youtube_url=clean_url,
        created_by=current_coach.id
    )
    db.add(exercise)
    db.commit()
    db.refresh(exercise)
    return exercise

@router.get("/{exercise_id}", response_model=ExerciseOut)
def get_exercise_by_id(
    exercise_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    exercise = db.query(Exercise).options(joinedload(Exercise.category)).filter(Exercise.id == exercise_id).first()
    if not exercise:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ejercicio no encontrado."
        )
    return exercise

@router.delete("/{exercise_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_exercise(
    exercise_id: UUID,
    db: Session = Depends(get_db),
    current_coach: User = Depends(require_coach)
):
    exercise = db.query(Exercise).filter(Exercise.id == exercise_id).first()
    if not exercise:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ejercicio no encontrado."
        )
    db.delete(exercise)
    db.commit()
    return None
