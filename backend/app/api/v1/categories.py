from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import Category, User, Exercise
from app.schemas.schemas import CategoryCreate, CategoryUpdate, CategoryOut
from app.api.deps import require_coach

router = APIRouter()

@router.get("/", response_model=List[CategoryOut])
def get_categories(
    only_active: bool = Query(False, description="Filtrar solo categorías activas"),
    db: Session = Depends(get_db)
):
    """
    Lista las categorías de ejercicios.
    Permite filtrar solo activas para selectores de creación de ejercicios.
    """
    query = db.query(Category)
    if only_active:
        query = query.filter(Category.is_active.is_(True))
    return query.order_by(Category.name.asc()).all()

@router.post("/", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
def create_category(
    data: CategoryCreate,
    db: Session = Depends(get_db),
    current_coach: User = Depends(require_coach)
):
    """
    Solo Coaches o Administradores pueden crear nuevas categorías.
    """
    clean_name = data.name.strip()
    if not clean_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El nombre de la categoría no puede estar vacío."
        )

    existing = db.query(Category).filter(Category.name.ilike(clean_name)).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"La categoría '{clean_name}' ya existe."
        )

    category = Category(
        name=clean_name,
        description=data.description.strip() if data.description else None,
        is_active=True if data.is_active is None else data.is_active
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category

@router.put("/{category_id}", response_model=CategoryOut)
def update_category(
    category_id: UUID,
    data: CategoryUpdate,
    db: Session = Depends(get_db),
    current_coach: User = Depends(require_coach)
):
    """
    Actualiza nombre, descripción o estado de una categoría existente.
    """
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Categoría no encontrada."
        )

    if data.name is not None:
        clean_name = data.name.strip()
        if not clean_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El nombre de la categoría no puede estar vacío."
            )
        # Verificar duplicados con otro ID
        existing = db.query(Category).filter(
            Category.name.ilike(clean_name),
            Category.id != category_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Ya existe otra categoría con el nombre '{clean_name}'."
            )
        category.name = clean_name

    if data.description is not None:
        category.description = data.description.strip() if data.description else None

    if data.is_active is not None:
        category.is_active = data.is_active

    db.commit()
    db.refresh(category)
    return category

@router.patch("/{category_id}/toggle-status", response_model=CategoryOut)
def toggle_category_status(
    category_id: UUID,
    db: Session = Depends(get_db),
    current_coach: User = Depends(require_coach)
):
    """
    Alterna rápidamente el estado is_active (Habilitar / Deshabilitar).
    """
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Categoría no encontrada."
        )

    category.is_active = not category.is_active
    db.commit()
    db.refresh(category)
    return category

@router.delete("/{category_id}", status_code=status.HTTP_200_OK)
def delete_or_deactivate_category(
    category_id: UUID,
    db: Session = Depends(get_db),
    current_coach: User = Depends(require_coach)
):
    """
    Si la categoría tiene ejercicios vinculados, se deshabilita para proteger
    la integridad referencial. Si está vacía, se elimina físicamente.
    """
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Categoría no encontrada."
        )

    exercises_count = db.query(Exercise).filter(Exercise.category_id == category_id).count()
    if exercises_count > 0:
        category.is_active = False
        db.commit()
        db.refresh(category)
        return {
            "message": f"La categoría tiene {exercises_count} ejercicios asociados. Ha sido deshabilitada para proteger los registros históricos.",
            "deactivated": True,
            "category": {
                "id": str(category.id),
                "name": category.name,
                "is_active": category.is_active
            }
        }

    db.delete(category)
    db.commit()
    return {
        "message": "Categoría eliminada exitosamente.",
        "deactivated": False
    }
