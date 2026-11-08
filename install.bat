@echo off
title Install Document & News Management System
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 20 LTS or newer is required. Install it from https://nodejs.org/
  pause
  exit /b 1
)
echo Installing dependencies...
call npm install
if errorlevel 1 (echo Installation failed.&pause&exit /b 1)
echo.
echo Installation complete. Run start.bat to launch the website.
pause
