@echo off
title Document & News Management System
cd /d "%~dp0"
echo ===============================================
echo   Document ^& News Management System
echo ===============================================
where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js is not installed or not in PATH.
  echo Install Node.js 20 LTS or newer from https://nodejs.org/
  pause
  exit /b 1
)
if not exist node_modules (
  echo Installing project dependencies for first run...
  call npm install
  if errorlevel 1 (
    echo Dependency installation failed.
    pause
    exit /b 1
  )
)
echo.
echo Starting server...
echo Open http://localhost:3000 on this PC.
echo Other LAN users: http://YOUR-PC-LAN-IP:3000
echo Press Ctrl+C to stop the server.
echo.
call npm start
pause
