# 🏍️ ระบบจัดการอะไหล่ร้านซ่อมมอเตอร์ไซค์ (Motorcycle Parts Shop)

ระบบ Web Application สำหรับจัดการหมวดหมู่อะไหล่ร้านซ่อมมอเตอร์ไซค์ แยกสิทธิ์การใช้งานระหว่างเจ้าของร้านและพนักงาน

---

## 📋 สารบัญ

- [Tech Stack](#-tech-stack)
- [โครงสร้างโปรเจกต์](#-โครงสร้างโปรเจกต์)
- [ความต้องการของระบบ](#-ความต้องการของระบบ)
- [การติดตั้งครั้งแรก](#-การติดตั้งครั้งแรก)
- [การเปิดระบบ](#-การเปิดระบบ)
- [การปิดระบบ](#-การปิดระบบ)
- [ข้อมูล Login](#-ข้อมูล-login)
- [API Endpoints](#-api-endpoints)
- [การแก้ปัญหาเบื้องต้น](#-การแก้ปัญหาเบื้องต้น)
- [📝 Changelog](#-changelog)

---

## 📝 Changelog

### v1.1.0 — 2026-10-03

#### ✨ เพิ่มใหม่

| รายการ | รายละเอียด |
|---|---|
| **Field `price` ในตาราง `categories`** | เพิ่ม column `price NUMERIC(10,2) DEFAULT 0.00` ใน PostgreSQL |
| **ฟิลด์ราคาใน CategoryForm** | เจ้าของร้านสามารถกรอก/แก้ไขราคาสินค้าได้ผ่าน Dashboard → Categories → Edit |
| **แสดงราคาบนการ์ดสินค้า (Store)** | หน้า Store แสดงราคาแต่ละรายการ หากยังไม่ตั้งราคาจะแสดง "ยังไม่มีราคา" |
| **คำนวณยอดรวมอัตโนมัติ (Store)** | ตะกร้าสินค้าดึง `price` จาก API มาคำนวณ `price × qty` ได้จริง |
| **หน้า Store (`/dashboard/store`)** | หน้า POS หน้าร้าน ค้นหา/กรองสินค้า เพิ่มเข้าตะกร้า และชำระเงิน |
| **หน้า Payment (`/dashboard/payment`)** | หน้าสรุปการชำระเงิน (เปิดต่อจาก Store) |
| **Package `lucide-react`** | ติดตั้ง icon library สำหรับหน้า Store และ Payment |

#### 🔧 แก้ไข / ปรับปรุง

| ไฟล์ | สิ่งที่เปลี่ยน |
|---|---|
| `backend/app/models/category.py` | เพิ่ม `price = Column(Numeric(10, 2), default=0.00)` |
| `backend/app/schemas/category.py` | เพิ่ม `price: float` ใน `CategoryBase`, `CategoryUpdate`, `CategoryResponse` |
| `frontend/src/types/category.ts` | เพิ่ม `price: number` ใน `Category` และ `CategoryFormData` |
| `frontend/src/components/categories/CategoryForm.tsx` | เพิ่ม input ราคา (฿) + reset form เมื่อเปิด modal ใหม่ |
| `frontend/src/app/dashboard/store/page.tsx` | ดึง `cat.price` จาก API แทน hardcode `0` + แสดงราคาบนการ์ด |
| `README.md` | อัปเดต path ของโปรเจกต์จาก `New folder` → `work` |

#### 🗄️ Database Migration

```sql
-- รัน 1 ครั้งเมื่อ upgrade จาก v1.0 → v1.1
ALTER TABLE categories ADD COLUMN IF NOT EXISTS price NUMERIC(10,2) NOT NULL DEFAULT 0.00;
```

> **หมายเหตุ:** หากติดตั้งใหม่ตั้งแต่ต้น (`docker compose up -d` + `python -m uvicorn`) ระบบจะสร้าง column `price` ให้อัตโนมัติผ่าน SQLAlchemy `create_all()`

---

### v1.0.0 — เวอร์ชันเริ่มต้น

- ระบบจัดการหมวดหมู่อะไหล่ (Categories CRUD)
- ระบบ Login ด้วย JWT แยก role `owner` / `employee`
- Frontend: Next.js 14, Backend: FastAPI, Database: PostgreSQL (Docker)

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14, React 18, TypeScript, Tailwind CSS, Axios |
| **Backend** | Python FastAPI, SQLAlchemy 2.0, Alembic, JWT Auth |
| **Database** | PostgreSQL 16 (Docker) |
| **DB Admin** | pgAdmin 4 (Docker) |

---

## 📁 โครงสร้างโปรเจกต์

```
prototype_Motorcycle_Repair-main/
├── backend/                    # FastAPI Backend
│   ├── app/
│   │   ├── middleware/         # Auth middleware (JWT)
│   │   ├── models/             # SQLAlchemy ORM models
│   │   │   ├── user.py         # User model
│   │   │   └── category.py     # Category model (รองรับ parent-child)
│   │   ├── routers/            # API route handlers
│   │   │   ├── auth.py         # /api/auth/*
│   │   │   └── categories.py   # /api/categories/*
│   │   ├── schemas/            # Pydantic schemas
│   │   ├── services/           # Business logic
│   │   ├── config.py           # Settings จาก .env
│   │   ├── database.py         # DB connection
│   │   └── main.py             # FastAPI app entry point
│   ├── .env                    # Environment variables (ต้องสร้างเอง)
│   └── requirements.txt        # Python dependencies
├── frontend/                   # Next.js Frontend
│   └── src/
│       ├── app/                # Next.js App Router
│       │   ├── login/          # หน้า Login
│       │   └── dashboard/      # หน้า Dashboard + Categories
│       ├── components/         # UI Components
│       ├── context/            # Auth Context
│       ├── hooks/              # Custom hooks
│       ├── lib/                # API client
│       └── types/              # TypeScript types
├── data/
│   └── categories.json         # Seed data สำหรับหมวดหมู่
├── docker-compose.yml          # PostgreSQL + pgAdmin
└── README.md
```

---

## 💻 ความต้องการของระบบ

ก่อนเริ่มต้นต้องติดตั้งโปรแกรมเหล่านี้ให้ครบ:

| โปรแกรม | เวอร์ชันที่แนะนำ | ดาวน์โหลด |
|---|---|---|
| **Docker Desktop** | ล่าสุด | [docker.com](https://www.docker.com/products/docker-desktop/) |
| **Python** | 3.12+ | [python.org](https://www.python.org/downloads/) |
| **Node.js** | 18 LTS+ | [nodejs.org](https://nodejs.org/) |

> ⚠️ หลังติดตั้ง Python หรือ Node.js ใหม่ ให้ **ปิดแล้วเปิด Terminal ใหม่** เสมอ เพื่อให้ PATH อัปเดต

---

## 🚀 การติดตั้งครั้งแรก

> ทำเพียงครั้งเดียวเท่านั้น ครั้งถัดไปข้ามไปที่ [การเปิดระบบ](#-การเปิดระบบ) ได้เลย

### ขั้นตอนที่ 1 — สร้างไฟล์ .env สำหรับ Backend

สร้างไฟล์ `backend/.env` แล้วใส่ข้อมูลนี้:

```env
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/motorcycle_parts_db
SECRET_KEY=supersecretkey_motorcycle_shop_2024
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

### ขั้นตอนที่ 2 — ติดตั้ง Python packages

```powershell
cd backend
pip install bcrypt==4.0.1 -r requirements.txt
```

### ขั้นตอนที่ 3 — ติดตั้ง Node.js packages

```powershell
cd frontend
npm install
```

---

## ▶️ การเปิดระบบ

ต้องเปิดตามลำดับ **3 ขั้นตอน** ใน Terminal แยกกัน:

### ขั้นตอนที่ 1 — เปิด Docker Desktop

เปิดแอป **Docker Desktop** จาก Start Menu แล้วรอจนไอคอนที่ System Tray (มุมขวาล่าง) เป็น **สีเขียว**

### ขั้นตอนที่ 2 — เปิด Database (Terminal ที่ 1)

```powershell
cd "C:\Users\salan\Desktop\work\prototype_Motorcycle_Repair-main"
docker compose up -d
```

> ✅ สำเร็จ = ขึ้น `Container motorcycle-postgres Started`

### ขั้นตอนที่ 3 — เปิด Backend API (Terminal ที่ 2)

```powershell
cd "C:\Users\salan\Desktop\work\prototype_Motorcycle_Repair-main\backend"
python -m uvicorn app.main:app --reload
```

> ✅ สำเร็จ = ขึ้น `Application startup complete.`
> API ทำงานที่ **http://localhost:8000**

### ขั้นตอนที่ 4 — เปิด Frontend (Terminal ที่ 3)

```powershell
cd "C:\Users\salan\Desktop\work\prototype_Motorcycle_Repair-main\frontend"
npm run dev
```

> ✅ สำเร็จ = ขึ้น `Ready on http://localhost:3000`

### เปิดเว็บใช้งาน 🌐

| URL | คำอธิบาย |
|---|---|
| **http://localhost:3000** | หน้าเว็บหลัก (Frontend) |
| **http://localhost:8000/docs** | API Docs (Swagger UI) |
| **http://localhost:5050** | pgAdmin (จัดการ Database) |

---

## ⏹️ การปิดระบบ

| ส่วน | วิธีปิด |
|---|---|
| **Frontend** | กด `Ctrl + C` ใน Terminal ที่ 3 |
| **Backend** | กด `Ctrl + C` ใน Terminal ที่ 2 |
| **Database** | รันคำสั่ง `docker compose down` ใน Terminal ที่ 1 |

```powershell
# ปิด Database (รันใน root folder ของโปรเจกต์)
cd "C:\Users\salan\Desktop\work\prototype_Motorcycle_Repair-main"
docker compose down
```

---

## 🔐 ข้อมูล Login

| บทบาท | Username | Password | สิทธิ์การใช้งาน |
|---|---|---|---|
| 🔑 **เจ้าของร้าน** | `admin` | `admin123` | ดู + เพิ่ม / แก้ไข / ลบ หมวดหมู่ |
| 👷 **พนักงาน** | `staff01` | `staff123` | ดูข้อมูลอย่างเดียว |

> ระบบใช้ **JWT Token** ในการยืนยันตัวตน Token มีอายุ 60 นาที

---

## 📡 API Endpoints

### Auth

| Method | Endpoint | คำอธิบาย | สิทธิ์ |
|---|---|---|---|
| `POST` | `/api/auth/login` | เข้าสู่ระบบ | ทุกคน |
| `GET` | `/api/auth/me` | ดูข้อมูลตัวเอง | ต้อง Login |
| `POST` | `/api/auth/register` | สร้างผู้ใช้ใหม่ | เจ้าของร้านเท่านั้น |

### Categories (หมวดหมู่อะไหล่)

| Method | Endpoint | คำอธิบาย | สิทธิ์ |
|---|---|---|---|
| `GET` | `/api/categories/` | ดูรายการหมวดหมู่ทั้งหมด (รองรับ pagination + search + filter) | ทุกคน |
| `GET` | `/api/categories/{id}` | ดูหมวดหมู่ตาม ID | ทุกคน |
| `POST` | `/api/categories/` | เพิ่มหมวดหมู่ใหม่ | เจ้าของร้านเท่านั้น |
| `PUT` | `/api/categories/{id}` | แก้ไขหมวดหมู่ | เจ้าของร้านเท่านั้น |
| `DELETE` | `/api/categories/{id}` | ลบหมวดหมู่ | เจ้าของร้านเท่านั้น |

**Query Parameters สำหรับ GET /api/categories/:**
- `page` — หน้าที่ต้องการ (default: 1)
- `per_page` — จำนวนต่อหน้า (default: 10, max: 100)
- `search` — ค้นหาจากชื่อ
- `is_active` — กรองตามสถานะ (true/false)
- `category_type` — กรองตามประเภท

---

## 🗄️ โครงสร้าง Database

### ตาราง `users`
| Column | Type | คำอธิบาย |
|---|---|---|
| `id` | Integer | Primary Key |
| `username` | String | ชื่อผู้ใช้ (unique) |
| `full_name` | String | ชื่อ-นามสกุล |
| `role` | String | `owner` หรือ `employee` |
| `hashed_password` | String | รหัสผ่านที่เข้ารหัสด้วย bcrypt |

### ตาราง `categories`
| Column | Type | คำอธิบาย |
|---|---|---|
| `id` | Integer | Primary Key |
| `name` | String | ชื่อหมวดหมู่ (ภาษาไทย) |
| `name_en` | String | ชื่อหมวดหมู่ (ภาษาอังกฤษ) |
| `description` | Text | คำอธิบาย |
| `icon` | String | ไอคอน |
| `parent_id` | Integer | FK → categories.id (รองรับหมวดหมู่ย่อย) |
| `is_active` | Boolean | สถานะใช้งาน |
| `sort_order` | Integer | ลำดับการแสดงผล |
| `created_by` | Integer | FK → users.id |

---

## 🔧 การแก้ปัญหาเบื้องต้น

| ปัญหา | สาเหตุ | วิธีแก้ |
|---|---|---|
| `npm` หรือ `python` ไม่รู้จักคำสั่ง | ติดตั้งใหม่แต่ Terminal ยังเก่าอยู่ | ปิดแล้วเปิด Terminal ใหม่ |
| `-m : The term '-m' is not recognized` | ลืมพิมพ์ `python` นำหน้า | ต้องพิมพ์ `python -m uvicorn ...` |
| `Unable to connect to docker` | Docker Desktop ยังไม่เปิด | เปิด Docker Desktop รอจนไอคอนเป็นสีเขียว |
| `Connection refused :8000` | Backend ยังไม่ได้เปิด | รัน `python -m uvicorn app.main:app --reload` |
| `Application startup failed` (bcrypt) | bcrypt version ไม่เข้ากัน | รัน `pip install bcrypt==4.0.1` |
| `ENOENT package.json` | รัน npm ผิดโฟลเดอร์ | ต้องรันใน `frontend/` เท่านั้น |
| Login ไม่ผ่าน | Backend หรือ DB ยังไม่ได้เปิด | ตรวจสอบว่าเปิดครบทั้ง 3 ขั้นตอน |
| `npm run dev` ไม่ทำงาน (Execution Policy) | PowerShell บล็อก script | รัน `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser` |

