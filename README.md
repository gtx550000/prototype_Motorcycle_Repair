# 🏍️ Motorcycle Parts Shop — ระบบจัดการร้านอะไหล่มอเตอร์ไซค์

> ระบบ POS (Point of Sale) และจัดการหมวดหมู่อะไหล่มอเตอร์ไซค์ สำหรับพนักงานใช้งานภายในร้าน

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104-009688?logo=fastapi)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)
![Docker](https://img.shields.io/badge/Docker-required-2496ED?logo=docker)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)

---

## 📋 สารบัญ

- [ภาพรวมระบบ](#ภาพรวมระบบ)
- [ระบบทำงานอย่างไร](#ระบบทำงานอย่างไร)
- [โครงสร้างโปรเจค](#โครงสร้างโปรเจค)
- [ความต้องการของระบบ](#ความต้องการของระบบ)
- [วิธีติดตั้ง](#วิธีติดตั้ง)
- [วิธีเริ่มใช้งาน](#วิธีเริ่มใช้งาน)
- [บัญชีผู้ใช้เริ่มต้น](#บัญชีผู้ใช้เริ่มต้น)
- [หน้าต่างๆ ในระบบ](#หน้าต่างๆ-ในระบบ)
- [API Endpoints](#api-endpoints)
- [การแก้ปัญหาที่พบบ่อย](#การแก้ปัญหาที่พบบ่อย)
- [Tech Stack](#tech-stack)

---

## ภาพรวมระบบ

ระบบนี้ถูกพัฒนาขึ้นเพื่อใช้ภายในร้านซ่อมและขายอะไหล่มอเตอร์ไซค์ ประกอบด้วย:

| ฟีเจอร์ | รายละเอียด |
|---|---|
| 🔐 **ระบบล็อกอิน** | JWT Authentication พร้อมแยก Role (เจ้าของ / พนักงาน) |
| 🗂️ **จัดการหมวดหมู่** | สร้าง/แก้ไข/ลบหมวดหมู่อะไหล่ 3 ระดับ (หลัก → ย่อย → ประเภท) พร้อมราคาสินค้า |
| 🛒 **หน้าร้าน POS** | เลือกสินค้าเข้าตะกร้า ค้นหา กรองประเภท ดูราคา |
| 💳 **ชำระเงิน Multi-step** | ตรวจสอบรายการ → ข้อมูลรถ/ลูกค้า → เลือกพนักงานผู้ออกบิล → ช่องทางชำระ → ยืนยัน |
| 👥 **จัดการลูกจ้าง & ค่าแรง** | จัดการข้อมูลพนักงาน กำหนดค่าแรงรายวัน ดูสถิติยอดขายและประวัติการขาย (เฉพาะเจ้าของร้าน) |
| 🧾 **ประวัติการขาย** | บันทึกประวัติการขายผูกกับพนักงานผู้ออกบิล ดูรายงานย้อนหลังตามช่วงวันที่ |
| 🖨️ **ใบเสร็จ** | สร้างใบเสร็จจากรายการขายที่บันทึกสำเร็จ และพิมพ์หรือบันทึกเป็น PDF ผ่านเบราว์เซอร์ |

## ระบบทำงานอย่างไร

ระบบแบ่งเป็น 3 ส่วนหลัก:

1. **Frontend (`frontend/`)** — Next.js App Router แสดงหน้าเว็บและจัดการสถานะหน้าจอ ใช้ `AuthContext` เก็บข้อมูลผู้ใช้ที่ล็อกอิน และ Axios ใน `src/lib/api.ts` เรียก Backend โดยแนบ JWT
2. **Backend (`backend/`)** — FastAPI ให้ REST API; Routers ตรวจสิทธิ์และรับส่งข้อมูล, Schemas ตรวจรูปแบบข้อมูล, Services จัดการ business logic และ SQLAlchemy Models กำหนดตาราง
3. **Database (`docker-compose.yml`)** — PostgreSQL เก็บผู้ใช้ หมวดหมู่อะไหล่ ค่าแรง และประวัติการขาย; pgAdmin ใช้ตรวจสอบฐานข้อมูลผ่านเว็บ

### วงจรการทำงานหลัก

```text
เปิดระบบ
  └─ FastAPI สร้างตารางที่ยังไม่มี และ seed บัญชีเริ่มต้น/หมวดหมู่จาก data/categories.json

เข้าสู่ระบบ
  └─ Frontend ขอ JWT → เก็บ token ใน localStorage → แนบ token ไปกับ API request

ขายสินค้า
  └─ เลือกสินค้า → เก็บตะกร้าใน localStorage (pos_cart)
      ├─ ใบเสนอราคา: คำนวณและพิมพ์จาก Frontend; ไม่สร้างประวัติการขาย
      └─ ชำระเงินจริง: ส่งรายการและข้อมูลบิลไป POST /api/employees/sales
          └─ Backend บันทึก SaleRecord ใน PostgreSQL → Frontend แสดงใบเสร็จ
              └─ หน้ารายงาน/จัดการลูกจ้างอ่านประวัติจาก API
```

### สิทธิ์และขอบเขตข้อมูล

- เจ้าของร้าน (`owner`) จัดการหมวดหมู่และบัญชีลูกจ้าง กำหนดค่าแรง และดูรายงานการขายทั้งหมดได้
- พนักงาน (`employee`) ใช้หน้าร้านและบันทึกการขายได้; API ประวัติการขายจำกัดให้พนักงานดูเฉพาะรายการของตน
- หน้า Dashboard ฝั่ง Frontend ต้องล็อกอินก่อนใช้งาน แต่ API อ่านหมวดหมู่ (`GET /api/categories`) เปิดให้อ่านได้โดยไม่ต้องมี JWT; การเพิ่ม แก้ไข และลบหมวดหมู่ต้องเป็นเจ้าของร้าน
- ใบเสนอราคาเป็นเอกสารประเมินราคา ไม่ใช่รายการขายจริง; ระบบปัจจุบันยังไม่มีการเคลื่อนไหว/ตัดสต็อกสินค้า
- ใบเสร็จหลังชำระเงินใช้ข้อมูลการขายที่บันทึกสำเร็จ ส่วนการพิมพ์ใช้ print stylesheet และคำสั่งพิมพ์/PDF ของเบราว์เซอร์

> ตอนเริ่ม Backend ใช้ `Base.metadata.create_all()` เพื่อสร้างตารางที่ยังไม่มี ไม่ได้ปรับโครงสร้างตารางเดิมโดยอัตโนมัติเมื่อมีการเปลี่ยน Model; การเปลี่ยน Schema ฐานข้อมูลต้องวางแผน migration หรือปรับฐานข้อมูลตามขั้นตอนของทีม

---

## โครงสร้างโปรเจค

```
motorcycle-parts-shop/
│
├── 📁 backend/                    # FastAPI Backend
│   ├── app/
│   │   ├── main.py                # สร้างตาราง, seed ข้อมูล, รวม routers
│   │   ├── config.py              # อ่าน settings จาก environment / .env
│   │   ├── database.py            # SQLAlchemy engine, Base และ DB session
│   │   ├── models/
│   │   │   ├── category.py        # หมวดหมู่แบบ parent/child และราคา
│   │   │   ├── employee.py        # ค่าแรงและประวัติการขาย
│   │   │   └── user.py            # บัญชีผู้ใช้และ role
│   │   ├── schemas/
│   │   │   ├── category.py        # ตรวจข้อมูลหมวดหมู่
│   │   │   ├── employee.py        # ตรวจข้อมูลค่าแรง/การขาย/รายงาน
│   │   │   └── user.py            # ตรวจข้อมูลบัญชีและ token
│   │   ├── services/
│   │   │   ├── auth_service.py    # ตรวจรหัสผ่านและสร้างผู้ใช้
│   │   │   ├── category_service.py # CRUD, ค้นหา และ seed หมวดหมู่
│   │   │   └── employee_service.py # ค่าแรง ประวัติขาย และสรุปรายงาน
│   │   ├── routers/
│   │   │   ├── auth.py            # Login, current user, owner register
│   │   │   ├── categories.py      # CRUD /api/categories
│   │   │   └── employees.py       # พนักงาน ค่าแรง การขาย และรายงาน
│   │   └── middleware/
│   │       └── auth.py            # JWT verify, role guard
│   ├── requirements.txt
│   └── .env                       # ตั้งค่าท้องถิ่น (ไม่ควร commit)
│
├── 📁 frontend/                   # Next.js 14 Frontend
│   └── src/
│       ├── app/
│       │   ├── page.tsx           # หน้าเริ่มต้น
│       │   ├── login/page.tsx     # หน้าล็อกอิน
│       │   ├── globals.css        # Tailwind และ print styles
│       │   └── dashboard/
│       │       ├── layout.tsx     # Layout พร้อม Sidebar + Header
│       │       ├── page.tsx       # หน้า Dashboard หลัก
│       │       ├── categories/    # จัดการหมวดหมู่
│       │       ├── store/         # หน้าร้าน POS และตะกร้า
│       │       ├── quotation/     # ใบเสนอราคาและพิมพ์/PDF
│       │       ├── payment/       # ชำระเงินและใบเสร็จ
│       │       ├── Employee/      # จัดการลูกจ้าง (Owner)
│       │       └── reports/       # รายงานและรายละเอียดบิล (Owner)
│       ├── components/
│       │   ├── auth/              # LoginForm, ProtectedRoute
│       │   ├── categories/        # CategoryList, CategoryForm, etc.
│       │   ├── layout/            # Sidebar, Header
│       │   └── ui/                # Button, Modal, Table, Badge, Input
│       ├── context/               # AuthContext: ผู้ใช้และสถานะล็อกอิน
│       ├── hooks/                 # useAuth, useCategories
│       ├── lib/                   # Axios API client และ token helpers
│       └── types/                 # TypeScript types ของ auth, categories, employees
│
├── 📁 data/                       # Seed Data (JSON)
│   ├── categories.json            # หมวดหมู่ที่ Backend seed ตอนเริ่มระบบ
│   ├── users_seed.json            # ข้อมูลผู้ใช้ประกอบ (ไม่ได้อ่านโดย startup ปัจจุบัน)
│   └── parts_*.json               # ข้อมูลอะไหล่แยกประเภทสำหรับข้อมูลประกอบ
│
├── docker-compose.yml             # PostgreSQL + pgAdmin
├── start_backend.bat              # 🚀 สคริปต์เริ่ม backend (Windows)
├── update_data.py                 # สคริปต์จัดการข้อมูลหมวดหมู่
└── .gitignore
```

---

## ความต้องการของระบบ

| เครื่องมือ | เวอร์ชันขั้นต่ำ | หมายเหตุ |
|---|---|---|
| **Node.js** | 18.x ขึ้นไป | ใช้สำหรับ Next.js frontend |
| **Python** | 3.11 ขึ้นไป | ใช้สำหรับ FastAPI backend |
| **Docker Desktop** | ล่าสุด | ใช้รัน PostgreSQL database |
| **Git** | ล่าสุด | สำหรับ clone โปรเจค |

> ✅ **ทดสอบบน Windows 10/11** — ใช้ PowerShell หรือ Command Prompt

---

## วิธีติดตั้ง

### ขั้นที่ 1 — Clone โปรเจค

```bash
git clone https://github.com/gtx550000/prototype_Motorcycle_Repair.git
cd prototype_Motorcycle_Repair
```

---

### ขั้นที่ 2 — ติดตั้ง Python Virtual Environment (Backend)

```powershell
# สร้าง virtual environment ที่ root ของโปรเจค
python -m venv .venv

# เปิดใช้งาน
.venv\Scripts\activate

# ติดตั้ง dependencies
pip install -r backend\requirements.txt

# ⚠️ สำคัญ: ต้องใช้ bcrypt เวอร์ชัน 4.0.1 เท่านั้น
pip install bcrypt==4.0.1
```

---

### ขั้นที่ 3 — ติดตั้ง Node.js Dependencies (Frontend)

```powershell
cd frontend
npm install
cd ..
```

---

### ขั้นที่ 4 — ตั้งค่า Environment Variables

สร้างไฟล์ `backend/.env` สำหรับเครื่องพัฒนา โดยใช้ URL ฐานข้อมูลที่ตรงกับ PostgreSQL ใน `docker-compose.yml`:

```env
DATABASE_URL=postgresql://<user>:<password>@localhost:5432/motorcycle_parts_db
SECRET_KEY=<random-long-secret>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480
```

> 🔒 ห้ามนำ `.env` หรือ secret จริงขึ้น Git; สำหรับ Production ให้กำหนด `SECRET_KEY` แบบสุ่มและเก็บใน environment/secret manager ของระบบ

---

## วิธีเริ่มใช้งาน

### 🚀 วิธีเร็ว (แนะนำสำหรับ Windows)

ดับเบิ้ลคลิกที่ไฟล์ **`start_backend.bat`** ที่ root ของโปรเจค — มันจะทำทุกอย่างให้อัตโนมัติ:
1. ปิด process เก่าที่ port 8000
2. เริ่ม Docker (PostgreSQL)
3. รัน Backend server

จากนั้นรัน Frontend แยก:

```powershell
cd frontend
npm run dev
```

---

### 🛠️ วิธีทีละขั้น (Manual)

**Terminal 1 — เริ่ม Database (Docker)**

```powershell
docker compose up -d
```

รอจนกว่า PostgreSQL พร้อม (ประมาณ 10-15 วินาที):

```powershell
# ตรวจสอบสถานะ
docker compose ps
```

---

**Terminal 2 — เริ่ม Backend (FastAPI)**

```powershell
# เปิด virtual environment
.venv\Scripts\activate

# เข้าโฟลเดอร์ backend
cd backend

# รัน server (port 8000)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

เมื่อ backend พร้อมจะเห็น:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

> 🌱 ระบบจะ **seed ข้อมูล 96 หมวดหมู่** และ **2 บัญชีผู้ใช้** โดยอัตโนมัติเมื่อเริ่มครั้งแรก

---

**Terminal 3 — เริ่ม Frontend (Next.js)**

```powershell
cd frontend
npm run dev
```

เมื่อ frontend พร้อมจะเห็น:
```
▲ Next.js 14.2.3
- Local: http://localhost:3000
```

---

### ✅ ตรวจสอบว่าทุกอย่างทำงานได้

| บริการ | URL | ผลที่ควรเห็น |
|---|---|---|
| **Frontend** | http://localhost:3000 | หน้าล็อกอิน |
| **Backend API** | http://localhost:8000/docs | Swagger UI |
| **pgAdmin** (DB GUI) | http://localhost:5050 | หน้า pgAdmin |

---

## บัญชีผู้ใช้เริ่มต้น

| บทบาท | Username | Password | สิทธิ์ |
|---|---|---|---|
| 🔑 **เจ้าของร้าน** | `admin` | `admin123` | จัดการทุกอย่าง, สร้างพนักงาน |
| 👤 **พนักงาน** | `staff01` | `staff123` | ใช้หน้าร้าน POS, ชำระเงิน |

---

## หน้าต่างๆ ในระบบ

### 🔐 หน้าล็อกอิน — `/login`
- กรอก username / password แล้วกด **"เข้าสู่ระบบ"**
- ระบบจะ redirect ไปหน้า Dashboard อัตโนมัติ

---

### 📊 หน้า Dashboard — `/dashboard`
- แสดงข้อมูลสรุปภาพรวมร้านค้า
- แสดงชื่อผู้ใช้ที่ล็อกอินอยู่

---

### 🗂️ หน้าจัดการหมวดหมู่ — `/dashboard/categories`
- ดูรายการหมวดหมู่ทั้งหมด 96 รายการ
- **กรองตามประเภท:** ทั้งหมด / หมวดหมู่หลัก / หมวดหมู่ย่อย / ประเภทอะไหล่
- **ค้นหา:** ค้นได้ทั้งภาษาไทย ภาษาอังกฤษ และรหัสอ้างอิง
- **เพิ่ม/แก้ไข/ลบ** หมวดหมู่ (เฉพาะ role = owner)

**โครงสร้างหมวดหมู่ 3 ระดับ:**
```
หมวดหมู่หลัก (CAT001-CAT005)
  └── หมวดหมู่ย่อย (SUB001-SUB019)
        └── ประเภทอะไหล่ (PT001-PT073)
```

---

### 🛒 หน้าร้าน POS — `/dashboard/store`
- ค้นหาและเลือกอะไหล่จากรายการ
- กรองประเภทสินค้า (ทั้งหมด / หมวดหลัก / หมวดย่อย / ประเภท)
- **เพิ่ม/ลด/ลบ** สินค้าในตะกร้า
- แสดงราคาสินค้าและยอดรวม
- ✅ **ตะกร้าถูกบันทึกไว้** แม้เปลี่ยนหน้าหรือกดย้อนกลับจากหน้าชำระเงิน
- กด **"ชำระเงิน"** เพื่อไปหน้า Multi-step Checkout
- กด **"📄 ใบเสนอราคา"** เพื่อเปิดหน้าประเมินราคาก่อนตัดสินใจซื้อ (ไม่ตัดสต็อก)

---

### 📄 หน้าใบเสนอราคา — `/dashboard/quotation`
- **ประเมินราคาล่วงหน้า**: ให้ลูกค้าทราบราคาก่อนตัดสินใจซ่อม/ซื้อจริง โดยยังไม่ต้องออกบิลขายจริงและ**ไม่ตัดสต็อก**
- **ตัวเลือกคำนวณราคา**:
  - 🔘 **ราคารวม ปกติ**: คำนวณเฉพาะค่าอะไหล่ตามตะกร้า
  - 🔘 **ราคารวมค่าช่าง**: กรอกค่าแรงช่าง/ค่าบริการ พร้อมระบุรายละเอียดงานช่าง เพื่อรวมในยอดสุทธิอย่างชัดเจน
  - 🏷️ **ส่วนลดพิเศษ**: กำหนดส่วนลดเพิ่มเติมได้
- **ข้อมูลลูกค้า & รถ**: กรอกชื่อลูกค้า, เบอร์โทร, ทะเบียนรถ, รุ่นรถ, กำหนดอายุใบเสนอราคา
- **ออกไฟล์ PDF & สั่งพิมพ์**: มีปุ่มสั่งพิมพ์หรือบันทึกเป็นไฟล์ PDF ตามมาตรฐานกระดาษ A4 สวยงาม พร้อมช่องลงนามผู้เสนอราคาและลูกค้ายินยอม
- **เชื่อมต่อกับระบบขาย**: หากลูกค้าตกลง สามารถกดปุ่ม **"ไปหน้าชำระเงิน"** เพื่อดำเนินการออกบิลจริงได้ทันที

---

### 💳 หน้าชำระเงิน — `/dashboard/payment`

มี 4 ขั้นตอน:

| ขั้นที่ | หัวข้อ | รายละเอียด |
|---|---|---|
| 1️⃣ | สรุปรายการ | ตรวจสอบอะไหล่และยอดรวม |
| 2️⃣ | ข้อมูลรถ/ลูกค้า | ทะเบียน, รุ่นรถ, ชื่อลูกค้า (ไม่บังคับ) |
| 3️⃣ | ชำระเงิน | เงินสด (คำนวณทอน) / โอน-QR / บัตรเครดิต |
| 4️⃣ | เสร็จสิ้น | ใบเสร็จแสดงเลขที่บิล วันที่ เวลา ลูกค้า/รถ พนักงาน รายการสินค้า ช่องทางชำระเงิน และยอดเงิน; พิมพ์หรือบันทึกเป็น PDF ได้ |

> ตะกร้าจะถูกล้างเฉพาะเมื่อกด **"ยืนยันการชำระเงิน"** เท่านั้น

---

### 👥 หน้าจัดการลูกจ้าง — `/dashboard/Employee` (เฉพาะเจ้าของร้าน)
- **จัดการข้อมูลลูกจ้าง**: เพิ่มบัญชีลูกจ้างใหม่, แก้ไขข้อมูล (ชื่อ, username, รหัสผ่าน, สถานะการใช้งาน) และลบลูกจ้าง
- **กำหนดค่าแรงรายวัน**: ตั้งค่าและแก้ไขค่าแรงรายวันของพนักงานแต่ละคน พร้อมบันทึกหมายเหตุ
- **สถิติรายวัน**: แสดงยอดขายรวมและจำนวนบิลที่ลูกจ้างแต่ละคนทำได้ในวันที่เลือก
- **ดูประวัติการขายย้อนหลัง**: มี Modal ดูรายละเอียดบิลย้อนหลังของลูกจ้าง พร้อมตัวกรองช่วงวันที่ (วันเริ่มต้น - วันสิ้นสุด)

---

### 📈 หน้าระบบรายงานการขาย — `/dashboard/reports` (เฉพาะเจ้าของร้าน)
- **ตัวเลือกช่วงเวลา**: ดูยอดขายแบบรายวัน (วันนี้ / เมื่อวาน), รายสัปดาห์ (สัปดาห์นี้ / สัปดาห์ก่อน), รายเดือน หรือกำหนดช่วงวันเอง
- **สรุปตามพนักงาน**: ดูว่าพนักงานแต่ละคนขายไปแล้วกี่บิล, **ขายไปแล้วกี่ชิ้น**, และยอดขายรวมกี่บาท
- **สินค้าที่ขายไป (Breakdown)**: กดดูได้ว่าพนักงานคนนั้น **ขายอะไรไปบ้างและขายไปกี่ชิ้น**
- **จัดอันดับสินค้าขายดี**: ตารางสรุปสินค้าที่ขายได้ทั้งหมดในช่วงเวลาที่เลือก เรียงลำดับตามจำนวนชิ้น
- **ประวัติบิลละเอียด**: ตารางดูประวัติบิลทุกใบ พร้อมเปิดดูใบเสร็จและรายการอะไหล่ในบิล

---

## API Endpoints

เปิด Swagger UI ได้ที่ http://localhost:8000/docs

### Auth

| Method | Endpoint | คำอธิบาย | Auth |
|---|---|---|---|
| POST | `/api/auth/login` | ล็อกอิน (รับ JWT token) | ❌ |
| GET | `/api/auth/me` | ดูข้อมูลผู้ใช้ปัจจุบัน | ✅ |
| POST | `/api/auth/register` | สร้างบัญชีพนักงาน | ✅ Owner only |

### Categories

| Method | Endpoint | คำอธิบาย | Auth |
|---|---|---|---|
| GET | `/api/categories` | ดูรายการหมวดหมู่ (รองรับ search, filter, pagination) | ❌ |
| POST | `/api/categories` | สร้างหมวดหมู่ใหม่ | ✅ Owner only |
| GET | `/api/categories/{id}` | ดูหมวดหมู่รายการเดียว | ❌ |
| PUT | `/api/categories/{id}` | แก้ไขหมวดหมู่ | ✅ Owner only |
| DELETE | `/api/categories/{id}` | ลบหมวดหมู่ (ลบลูกด้วย) | ✅ Owner only |

**Query Parameters สำหรับ GET /api/categories:**
```
?page=1&per_page=20&search=น้ำมัน&category_type=product
```

| Parameter | ค่าที่ใช้ได้ | คำอธิบาย |
|---|---|---|
| `search` | ข้อความใดก็ได้ | ค้นหาชื่อไทย/อังกฤษ/รหัส |
| `category_type` | `main`, `sub`, `product` | กรองประเภท |
| `page` | ตัวเลข | หน้าที่ต้องการ |
| `per_page` | ตัวเลข | จำนวนต่อหน้า |

### Employees & Sales Reports

| Method | Endpoint | คำอธิบาย | Auth |
|---|---|---|---|
| GET | `/api/employees/` | รายชื่อลูกจ้าง + ค่าแรง + สถิติยอดขายตามวันที่ | ✅ Owner only |
| GET | `/api/employees/list` | รายชื่อพนักงานแบบย่อสำหรับ Dropdown ในหน้าชำระเงิน | ✅ ทุกคน |
| PUT | `/api/employees/{user_id}/wage` | ตั้งค่า/แก้ไขค่าแรงรายวัน | ✅ Owner only |
| PUT | `/api/employees/{user_id}` | แก้ไขข้อมูลลูกจ้าง (ชื่อ, username, password, สถานะ, ค่าแรง) | ✅ Owner only |
| DELETE | `/api/employees/{user_id}` | ลบบัญชีลูกจ้าง | ✅ Owner only |
| POST | `/api/employees/sales` | บันทึกประวัติการขายเมื่อชำระเงินเสร็จสิ้น | ✅ ทุกคน |
| GET | `/api/employees/sales` | ดูประวัติการขายย้อนหลัง (กรอง employee, ช่วงวันที่, pagination) | ✅ |
| GET | `/api/employees/reports/sales` | สรุปรายงานการขาย (รายวัน/สัปดาห์, สินค้าที่ขาย, แยกตามพนักงาน) | ✅ Owner only |

---

## การแก้ปัญหาที่พบบ่อย

### ❌ Login ไม่ได้ — Error 500

**สาเหตุ:** bcrypt เวอร์ชัน 5.x ไม่เข้ากัน

```powershell
.venv\Scripts\activate
pip install bcrypt==4.0.1
```

---

### ❌ Port 8000 ถูกใช้งานอยู่แล้ว

```powershell
# หา process ที่ใช้ port 8000
Get-NetTCPConnection -LocalPort 8000

# Kill ด้วย PID ที่ได้
Stop-Process -Id <PID> -Force
```

หรือใช้ `start_backend.bat` ซึ่งทำให้อัตโนมัติ

---

### ❌ Docker ไม่ได้เปิด

```powershell
# เปิด Docker Desktop ก่อน แล้วรอ
Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
Start-Sleep -Seconds 15
docker compose up -d
```

---

### ❌ ต้องการ reset ข้อมูลใหม่ทั้งหมด

```powershell
# หยุด Docker
docker compose down -v

# เริ่มใหม่
docker compose up -d

# รัน backend ใหม่ (จะ seed ข้อมูลให้อัตโนมัติ)
```

---

### ❌ `npm run dev` ไม่ทำงาน

```powershell
cd frontend
npm install   # ติดตั้ง dependencies ใหม่
npm run dev
```

---

## Tech Stack

### Backend
| เทคโนโลยี | เวอร์ชัน | บทบาท |
|---|---|---|
| **FastAPI** | 0.104+ | API Framework |
| **SQLAlchemy** | 2.0+ | ORM |
| **PostgreSQL** | 16 | Database |
| **Pydantic** | 2.5+ | Data Validation |
| **python-jose** | 3.3+ | JWT Token |
| **passlib + bcrypt** | 1.7.4 + **4.0.1** | Password Hashing |
| **Docker** | latest | Container สำหรับ DB |

### Frontend
| เทคโนโลยี | เวอร์ชัน | บทบาท |
|---|---|---|
| **Next.js** | 14.2.3 | React Framework (App Router) |
| **TypeScript** | 5 | Type Safety |
| **Tailwind CSS** | 3.4+ | Styling |
| **Axios** | 1.6+ | HTTP Client |
| **lucide-react** | latest | Icon Library |

---

## 🤝 สำหรับทีมพัฒนา

### Git Workflow

```bash
# ดึงโค้ดล่าสุดก่อนทำงานเสมอ
git pull origin main

# สร้าง branch สำหรับฟีเจอร์ใหม่
git checkout -b feature/ชื่อฟีเจอร์

# Commit และ push
git add -A
git commit -m "feat: คำอธิบายการเปลี่ยนแปลง"
git push origin feature/ชื่อฟีเจอร์
```

### ข้อควรระวัง

> ⚠️ **ห้าม commit ไฟล์ต่อไปนี้:**
> - `.venv/` — Python virtual environment
> - `node_modules/` — Node packages
> - `.env` — Secret keys (ถ้าเปลี่ยนค่าจาก default)
> - `.next/` — Next.js build cache

### เพิ่ม Column ใหม่ใน Database

หากมีการเพิ่มฟิลด์ใน Model เช่น `price` ต้องแจ้งทีมให้ทำ:

```powershell
# Reset database ก่อน (ข้อมูลจะหาย แต่ seed ใหม่ให้อัตโนมัติ)
docker compose down -v
docker compose up -d
# รัน backend ใหม่
```

---


*อัพเดตล่าสุด: ตุลาคม 2026*
