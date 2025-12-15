@echo off
chcp 65001 >nul
title Morning Reading Zoo Server

echo ==========================================
echo      Morning Reading Zoo - Server
echo ==========================================
echo.

REM Switch to script directory
cd /d "%~dp0"

REM Check Python installation
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found!
    echo.
    echo Please install Python: https://www.python.org/downloads/
    echo Check "Add Python to PATH" during installation
    echo.
    pause
    exit /b 1
)

echo [SUCCESS] Python detected
python --version
echo.

REM Try different ports
set PORTS=8080 3000 8000 8888 9000

for %%p in (%PORTS%) do (
    netstat -ano | findstr :%%p >nul 2>&1
    if errorlevel 1 (
        echo ========================================
        echo Server started successfully!
        echo.
        echo Access URL: http://localhost:%%p
        echo ========================================
        echo.
        echo Open the URL in your browser
        echo Press Ctrl+C to stop the server
        echo.
        python -m http.server %%p
        goto :end
    ) else (
        echo Port %%p is occupied, trying next...
    )
)

echo [ERROR] All ports are occupied!
:end
pause