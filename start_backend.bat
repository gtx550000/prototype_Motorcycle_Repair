@echo off
chcp 65001 >nul
echo ==============================================
echo 🚀 Motorcycle Parts Shop - Backend Starter
echo ==============================================

echo [1/3] กำลังตรวจสอบและเคลียร์พอร์ต 8000 (ถ้ามีค้าง)...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":8000" ^| find "LISTENING"') do (
    echo พบโปรเซสค้าง PID: %%a - กำลังบังคับปิด...
    taskkill /f /pid %%a 2>nul
)

echo [2/3] กำลังเปิดระบบฐานข้อมูล (Docker)...
cd /d "%~dp0"
docker compose up -d

echo [3/3] กำลังเปิดเซิร์ฟเวอร์ FastAPI...
cd backend
call ..\.venv\Scripts\activate
python -m uvicorn app.main:app --reload

