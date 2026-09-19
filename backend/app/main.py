import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base, get_db
from .routers import auth, categories
from .schemas.user import UserCreate
from .services.auth_service import get_user_by_username, create_user
from .services.category_service import seed_categories_from_json
from .models.user import User

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    # Seed data
    db = next(get_db())
    try:
        # Seed users
        admin_user = get_user_by_username(db, "admin")
        if not admin_user:
            create_user(db, UserCreate(username="admin", full_name="เจ้าของร้าน", role="owner", password="admin123"))
            
        staff_user = get_user_by_username(db, "staff01")
        if not staff_user:
            create_user(db, UserCreate(username="staff01", full_name="พนักงาน ทดสอบ", role="employee", password="staff123"))
            
        # Seed categories
        json_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "categories.json")
        seed_categories_from_json(db, json_path)
    finally:
        db.close()
        
    yield

app = FastAPI(title="ระบบจัดการอะไหล่ร้านซ่อมมอเตอร์ไซค์ API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(categories.router)

@app.get("/")
def read_root():
    return {"message": "API is running"}
