import json
import os
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Tuple, List, Optional
from ..models.category import Category
from ..schemas.category import CategoryCreate, CategoryUpdate

def get_categories(db: Session, skip: int, limit: int, search: str = "", is_active: Optional[bool] = None, category_type: Optional[str] = None) -> Tuple[List[Category], int]:
    query = db.query(Category)
    
    if category_type == "main":
        query = query.filter(Category.parent_id == None)
    elif category_type == "sub":
        query = query.filter(Category.description.ilike('%SUB%'))
    elif category_type == "product":
        query = query.filter(Category.description.ilike('%PT%'))
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Category.name.ilike(search_term),
                Category.name_en.ilike(search_term),
                Category.description.ilike(search_term)
            )
        )
        
    if is_active is not None:
        query = query.filter(Category.is_active == is_active)
        
    total = query.count()
    categories = query.order_by(Category.sort_order).offset(skip).limit(limit).all()
    
    return categories, total

def get_category(db: Session, category_id: int) -> Category | None:
    return db.query(Category).filter(Category.id == category_id).first()

def create_category(db: Session, category_data: CategoryCreate, user_id: int) -> Category:
    db_category = Category(**category_data.model_dump(), created_by=user_id)
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

def update_category(db: Session, category_id: int, category_data: CategoryUpdate) -> Category | None:
    db_category = get_category(db, category_id)
    if not db_category:
        return None
        
    update_data = category_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_category, key, value)
        
    db.commit()
    db.refresh(db_category)
    return db_category

def delete_category(db: Session, category_id: int) -> bool:
    db_category = get_category(db, category_id)
    if not db_category:
        return False
        
    db.delete(db_category)
    db.commit()
    return True

def seed_categories_from_json(db: Session, json_path: str) -> None:
    if db.query(Category).count() > 0:
        return
        
    if not os.path.exists(json_path):
        return
        
    with open(json_path, 'r', encoding='utf-8') as f:
        categories_data = json.load(f)
        
    for cat_data in categories_data:
        category = Category(**cat_data)
        db.add(category)
        
    db.commit()
