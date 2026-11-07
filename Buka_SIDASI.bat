@echo off
TITLE SIDASI MTs AL-FADLLIYAH - Port 9090
cd /d "%~dp0"

set PORT=9090

:: 1. Periksa apakah port 9090 sudah aktif
netstat -ano | findstr /R /C:":9090 .*LISTENING" >nul 2>nul
if %errorlevel% equ 0 (
    start "" "http://localhost:9090"
    exit /b
)

:: 2. Jika belum aktif dan Node.js terpasang, jalankan server di port 9090
where node >nul 2>nul
if %errorlevel% equ 0 (
    if exist "backend\server.js" (
        cd backend
        if not exist "node_modules\" (
            call npm install
        )
        start "SIDASI Backend Server (Port 9090)" /min cmd /c "set PORT=9090 && node server.js"
        timeout /t 2 /nobreak >nul
        start "" "http://localhost:9090"
        exit /b
    )
)

:: 3. Fallback jika port 5050 aktif
netstat -ano | findstr /R /C:":5050 .*LISTENING" >nul 2>nul
if %errorlevel% equ 0 (
    start "" "http://localhost:5050"
    exit /b
)

:: 4. Fallback mode offline membuka berkas index.html
start "" "%~dp0index.html"
