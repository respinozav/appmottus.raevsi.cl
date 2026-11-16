import os
import json
import re
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from app.core.database import get_db
from app.models.models import Exercise, Category, User
from app.schemas.schemas import ExerciseCreate, ExerciseUpdate, ExerciseOut
from app.api.deps import get_current_user, require_coach

router = APIRouter()

CATALOG_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "exercise_gifs_catalog.json")

def normalize_youtube_url(url: Optional[str]) -> Optional[str]:
    """
    Valida y normaliza la URL de YouTube a un formato estándar embed o watch.
    Acepta:
    - https://www.youtube.com/watch?v=VIDEO_ID
    - https://youtu.be/VIDEO_ID
    - https://www.youtube.com/embed/VIDEO_ID
    - https://www.youtube.com/shorts/VIDEO_ID
    """
    if not url or not url.strip():
        return None
    url = url.strip()
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
    include_inactive: bool = Query(False, description="Incluir ejercicios desactivados/archivados"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lista los ejercicios con sus categorías asociadas.
    Por defecto retorna solo ejercicios activos (is_active = True).
    """
    query = db.query(Exercise).options(joinedload(Exercise.category))
    if not include_inactive:
        query = query.filter(Exercise.is_active == True)
    if category_id:
        query = query.filter(Exercise.category_id == category_id)
    return query.order_by(Exercise.created_at.desc()).all()

@router.get("/library-gifs")
def get_library_gifs(
    search: Optional[str] = Query(None, description="Buscar por nombre o músculo"),
    category: Optional[str] = Query(None, description="Filtrar por grupo/zona corporal"),
    current_user: User = Depends(get_current_user)
):
    """
    Retorna el catálogo curado de GIFs animados de técnica de libre uso.
    """
    if not os.path.exists(CATALOG_PATH):
        return {"count": 0, "exercises": []}
    
    try:
        with open(CATALOG_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al leer el catálogo de GIFs: {str(e)}"
        )
    
    exercises = data.get("exercises", [])
    
    if category and category.lower() != "todos":
        cat_lower = category.lower()
        exercises = [e for e in exercises if cat_lower in e.get("bodyPart", "").lower()]
        
    if search:
        s_lower = search.lower().strip()
        exercises = [
            e for e in exercises 
            if s_lower in e.get("name", "").lower() 
            or s_lower in e.get("muscle", "").lower() 
            or s_lower in e.get("equipment", "").lower()
        ]
        
    return {"count": len(exercises), "exercises": exercises}

@router.post("/", response_model=ExerciseOut)
def create_exercise(
    data: ExerciseCreate,
    db: Session = Depends(get_db),
    current_coach: User = Depends(require_coach)
):
    """
    Solo Coaches y Administradores pueden registrar nuevos ejercicios con URL de YouTube y GIF opcional.
    """
    category = db.query(Category).filter(Category.id == data.category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="La categoría especificada no existe."
        )

    clean_url = normalize_youtube_url(data.youtube_url)
    clean_gif = data.gif_url.strip() if data.gif_url else None

    if not clean_url and not clean_gif:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El ejercicio debe incluir al menos una demostración visual: video de YouTube o GIF animado."
        )

    exercise = Exercise(
        category_id=data.category_id,
        name=data.name.strip(),
        description=data.description,
        youtube_url=clean_url,
        gif_url=clean_gif,
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

@router.put("/{exercise_id}", response_model=ExerciseOut)
def update_exercise(
    exercise_id: UUID,
    data: ExerciseUpdate,
    db: Session = Depends(get_db),
    current_coach: User = Depends(require_coach)
):
    """
    Permite a Coaches y Administradores actualizar un ejercicio (nombre, descripción, categoría, youtube_url, gif_url).
    """
    exercise = db.query(Exercise).filter(Exercise.id == exercise_id).first()
    if not exercise:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ejercicio no encontrado."
        )

    if data.category_id is not None:
        category = db.query(Category).filter(Category.id == data.category_id).first()
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="La categoría especificada no existe."
            )
        exercise.category_id = data.category_id

    if data.name is not None:
        exercise.name = data.name.strip()

    if data.description is not None:
        exercise.description = data.description

    if data.youtube_url is not None:
        clean_url = normalize_youtube_url(data.youtube_url)
        exercise.youtube_url = clean_url

    if data.gif_url is not None:
        exercise.gif_url = data.gif_url.strip() if data.gif_url else None

    if data.is_active is not None:
        exercise.is_active = data.is_active

    db.commit()
    db.refresh(exercise)
    return exercise

@router.delete("/{exercise_id}", response_model=ExerciseOut)
def delete_exercise(
    exercise_id: UUID,
    db: Session = Depends(get_db),
    current_coach: User = Depends(require_coach)
):
    """
    Desactivación lógica (Soft-Delete): Nunca elimina físicamente un ejercicio
    para proteger la integridad de historiales y métricas de alumnos.
    """
    exercise = db.query(Exercise).options(joinedload(Exercise.category)).filter(Exercise.id == exercise_id).first()
    if not exercise:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ejercicio no encontrado."
        )
    exercise.is_active = False
    db.commit()
    db.refresh(exercise)
    return exercise

@router.patch("/{exercise_id}/toggle-active", response_model=ExerciseOut)
def toggle_exercise_active(
    exercise_id: UUID,
    db: Session = Depends(get_db),
    current_coach: User = Depends(require_coach)
):
    """
    Alterna el estado activo/archivado de un ejercicio con un clic.
    """
    exercise = db.query(Exercise).options(joinedload(Exercise.category)).filter(Exercise.id == exercise_id).first()
    if not exercise:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ejercicio no encontrado."
        )
    exercise.is_active = not exercise.is_active
    db.commit()
    db.refresh(exercise)
    return exercise
