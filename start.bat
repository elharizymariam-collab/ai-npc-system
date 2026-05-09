@echo off
title Deskora - Eilik System

echo ========================================
echo    بدء تشغيل نظام Eilik + Deskora
echo ========================================

:: Terminal 1 - Backend (AI)
start cmd /k "cd /d C:\Users\HP\ai-npc-system\backend && node server.js"

:: Terminal 2 - TTS (الصوت)
start cmd /k "cd /d C:\Users\HP\ai-npc-system\frontend && python server.py"

:: Terminal 3 - Frontend (الصفحة)
start cmd /k "cd /d C:\Users\HP\ai-npc-system\frontend && python -m http.server 5500"

:: Terminal 4 - Ngrok (رابط ثابت للموبايل)
start cmd /k "ngrok http 5500"

echo.
echo ✅ تم فتح كل السيرفرات
echo.
echo افتح: http://localhost:5500
echo.
echo 📱 الرابط الثابت: https://squad-underwear-clinking.ngrok-free.dev
echo.
pause