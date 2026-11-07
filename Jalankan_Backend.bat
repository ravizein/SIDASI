@echo off
TITLE SIDASI MTs AL-FADLLIYAH - SERVER BACKEND
COLOR 0A

:: Berpindah ke direktori skrip ini berada
cd /d "%~dp0"

echo ==================================================================
echo     [SIDASI MTs AL-FADLLIYAH] SERVER BACKEND MANDIRI
echo     Bebas MySQL ^& Python ^| Node.js Express + Local File DB
echo ==================================================================
echo   Penulis  : Ravi SQ. Moh. Zein Permana
echo   Status   : Memeriksa lingkungan sistem...
echo ------------------------------------------------------------------

:: Periksa apakah Node.js terpasang di sistem
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo [X] Node.js belum terdeteksi di komputer Windows Anda!
    echo.
    echo Pilihan Tindakan:
    echo   [1] Pasang Node.js Otomatis Sekarang (Rekomendasi - Cepat ^& Resmi)
    echo   [2] Buka SIDASI Mode Offline (Tanpa Node.js)
    echo   [3] Keluar
    echo.
    set /p INST_CHOICE="Pilih opsi [1/2/3] (Default: 1): "
    if "%INST_CHOICE%"=="" set INST_CHOICE=1
    if "%INST_CHOICE%"=="1" (
        if exist "Install_NodeJS_Windows.bat" (
            call "Install_NodeJS_Windows.bat"
            exit /b
        )
    )
    if "%INST_CHOICE%"=="2" (
        start "" "%~dp0index.html"
        exit /b
    )
    exit /b
)

echo [V] Node.js terdeteksi.
cd backend

:: Periksa apakah dependensi express & cors sudah terpasang
if not exist "node_modules\" (
    echo [*] Mengunduh dependensi awal (npm install)...
    call npm install
    if %errorlevel% neq 0 (
        echo [X] Gagal memasang dependensi. Periksa koneksi internet Anda.
        pause
        exit /b
    )
)

:: Tetapkan Port 9090
set PORT=9090

:: Buka browser secara otomatis
start "" "http://localhost:9090"

echo [*] Memulai Server Backend di Port 9090...
echo [!] Tekan [Ctrl + C] untuk menghentikan server.
echo ==================================================================
echo.

node server.js
pause
