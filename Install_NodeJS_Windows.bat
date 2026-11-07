@echo off
TITLE SIDASI MTs AL-FADLLIYAH - PEMASANG OTOMATIS NODE.JS
COLOR 0A

:: Berpindah ke folder skrip berada
cd /d "%~dp0"

echo ==================================================================
echo     [SIDASI MTs AL-FADLLIYAH] PEMASANG OTOMATIS NODE.JS
echo     Pemasangan Runtime Bebas Ribet untuk Windows (64-bit / 32-bit)
echo ==================================================================
echo   Pengembang : Ravi SQ. Moh. Zein Permana
echo ------------------------------------------------------------------

:: 1. Periksa apakah Node.js sudah terpasang
where node >nul 2>nul
if %errorlevel% equ 0 (
    echo.
    echo [V] Node.js sudah terpasang di komputer Windows Anda!
    for /f "tokens=*" %%v in ('node -v 2^>nul') do echo    - Versi Node.js : %%v
    for /f "tokens=*" %%m in ('npm -v 2^>nul') do echo    - Versi npm     : %%m
    echo.
    echo Pilihan:
    echo   [1] Jalankan Aplikasi SIDASI Sekarang (Rekomendasi)
    echo   [2] Pasang Ulang / Perbarui Node.js LTS
    echo   [3] Keluar
    echo.
    set /p USER_CHOICE="Pilih opsi [1/2/3] (Default: 1): "
    if "%USER_CHOICE%"=="" set USER_CHOICE=1
    if "%USER_CHOICE%"=="1" goto launch_sidasi
    if "%USER_CHOICE%"=="3" exit /b
    echo.
    echo Melanjutkan pemasangan ulang Node.js...
)

:: 2. Deteksi Arsitektur Windows (64-bit vs 32-bit)
echo.
echo [*] Mendeteksi arsitektur komputer Windows...
set NODE_ARCH=x64
if "%PROCESSOR_ARCHITECTURE%"=="x86" (
    if not defined PROCESSOR_ARCHITEW6432 (
        set NODE_ARCH=x86
    )
)
echo    - Arsitektur terdeteksi: %NODE_ARCH%

:: 3. Metode A: Gunakan winget jika tersedia (Windows 10 / 11)
where winget >nul 2>nul
if %errorlevel% equ 0 (
    echo.
    echo [*] Windows Package Manager (winget) terdeteksi.
    echo [*] Memulai pemasangan Node.js LTS otomatis via winget...
    echo     (Harap tunggu beberapa saat hingga proses selesai)
    winget install OpenJS.NodeJS.LTS --silent --accept-source-agreements --accept-package-agreements
    if %errorlevel% equ 0 goto verify_install
    echo [!] Pemasangan via winget tidak berhasil, beralih ke pengunduhan resmi MSI...
)

:: 4. Metode B: Pengunduhan Resmi MSI via PowerShell
set NODE_VERSION=v22.14.0
set MSI_FILE=node-%NODE_VERSION%-%NODE_ARCH%.msi
set DOWNLOAD_URL=https://nodejs.org/dist/%NODE_VERSION%/%MSI_FILE%
set DEST_FILE=%TEMP%\%MSI_FILE%

echo.
echo [*] Mengunduh berkas installer resmi Node.js LTS (%NODE_VERSION%)...
echo     URL: %DOWNLOAD_URL%
echo.

powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Write-Host '⏳ Sedang mengunduh installer Node.js...'; (New-Object System.Net.WebClient).DownloadFile('%DOWNLOAD_URL%', '%DEST_FILE%')"

if not exist "%DEST_FILE%" (
    echo.
    echo [X] Gagal mengunduh berkas installer Node.js.
    echo [!] Pastikan koneksi internet Anda aktif, atau unduh manual dari: https://nodejs.org/
    echo.
    pause
    exit /b
)

echo [V] Berkas installer berhasil diunduh (%DEST_FILE%).
echo [*] Memulai proses instalasi Node.js ke sistem Windows...
echo     (Jendela instalasi Windows Installer akan muncul)
echo.

:: Jalankan MSI installer secara pasif
start /wait msiexec /i "%DEST_FILE%" /passive /norestart

:: Bersihkan installer sementara
del /f /q "%DEST_FILE%" 2>nul

:verify_install
:: 5. Muat ulang PATH ke sesi saat ini agar tidak perlu restart terminal
set "PATH=%ProgramFiles%\nodejs\;%ProgramFiles(x86)%\nodejs\;%APPDATA%\npm;%PATH%"

echo.
echo ==================================================================
echo     VERIFIKASI HASIL PEMASANGAN
echo ==================================================================

where node >nul 2>nul
if %errorlevel% equ 0 (
    echo [V] SELAMAT! Node.js berhasil terpasang di komputer Anda!
    for /f "tokens=*" %%v in ('node -v 2^>nul') do echo    - Versi Node.js : %%v
    for /f "tokens=*" %%m in ('npm -v 2^>nul') do echo    - Versi npm     : %%m
    echo.

    :: Pasang dependensi backend SIDASI
    if exist "backend\" (
        echo [*] Memeriksa paket pustaka backend SIDASI (express & cors)...
        cd backend
        if not exist "node_modules\" (
            echo     Mengunduh dependensi (npm install)...
            call npm install
        )
        echo [V] Paket pustaka backend SIDASI siap digunakan!
        cd ..
    )

    echo.
    echo [*] Membuka aplikasi SIDASI sekarang...
    timeout /t 2 >nul

:launch_sidasi
    if exist "Buka_SIDASI.bat" (
        call "Buka_SIDASI.bat"
    ) else (
        start "" "http://localhost:9090"
    )
    exit /b
) else (
    echo [!] Node.js telah dipasang namun sistem memerlukan penyegaran sesi.
    echo.
    echo Silakan:
    echo    1. Tutup jendela Command Prompt ini.
    echo    2. Klik ganda berkas 'Buka_SIDASI.bat'.
    echo.
    pause
    exit /b
)

