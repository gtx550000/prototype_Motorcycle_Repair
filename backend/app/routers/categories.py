from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from ..database import get_db
from ..schemas.category import CategoryCreate, CategoryUpdate, CategoryResponse, CategoryListResponse
from ..services.category_service import get_categories, get_category, create_category, update_category, delete_category
from ..middleware.auth import require_owner, get_current_user
from ..models.user import User

router = APIRouter(prefix="/api/categories", tags=["categories"])

@router.get("/", response_model=CategoryListResponse)
def read_categories(
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    search: str = "",
    is_active: Optional[bool] = None,
    category_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    skip = (page - 1) * per_page
    categories, total = get_categories(db, skip=skip, limit=per_page, search=search, is_active=is_active, category_type=category_type)
    return CategoryListResponse(categories=categories, total=total, page=page, per_page=per_page)

@router.get("/{category_id}", response_model=CategoryResponse)
def read_category(category_id: int, db: Session = Depends(get_db)):
    db_category = get_category(db, category_id=category_id)
    if db_category is None:
        raise HTTPException(status_code=404, detail="Category not found")
    return db_category

@router.post("/", response_model=CategoryResponse)
def create_category_route(category_in: CategoryCreate, db: Session = Depends(get_db), current_user: User = Depends(require_owner)):
    return create_category(db=db, category_data=category_in, user_id=current_user.id)

@router.put("/{category_id}", response_model=CategoryResponse)
def update_category_route(category_id: int, category_in: CategoryUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_owner)):
    db_category = update_category(db=db, category_id=category_id, category_data=category_in)
    if db_category is None:
        raise HTTPException(status_code=404, detail="Category not found")
    return db_category

@router.delete("/{category_id}")
def delete_category_route(category_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_owner)):
    success = delete_category(db=db, category_id=category_id)
    if not success:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"detail": "Category deleted"}
