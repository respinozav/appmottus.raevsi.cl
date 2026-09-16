from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import Category, User
from app.schemas.schemas import CategoryCreate, CategoryOut
from app.api.deps import require_coach

router = APIRouter()

@router.get("/", response_model=List[CategoryOut])
def get_categories(db: Session = Depends(get_db)):
    """
    Lista todas las categorías de ejercicios (público / autenticado).
    """
    return db.query(Category).order_by(Category.name.asc()).all()

@router.post("/", response_model=CategoryOut)
def create_category(
    data: CategoryCreate,
    db: Session = Depends(get_db),
    current_coach: User = Depends(require_coach)
):
    """
    Solo Coaches o Administradores pueden crear nuevas categorías.
    """
    existing = db.query(Category).filter(Category.name.ilike(data.name.strip())).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"La categoría '{data.name}' ya existe."
        )

    category = Category(
        name=data.name.strip(),
        description=data.description
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category

@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
    category_id: UUID,
    db: Session = Depends(get_db),
    current_coach: User = Depends(require_coach)
):
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Categoría no encontrada"
        )
    db.delete(category)
    db.commit()
    return None
