#!/bin/bash
# ==============================================================================
# SIDASI MTs AL-FADLLIYAH - PELUNCUR BACKEND OTOMATIS (macOS)
# Klik ganda (double click) berkas ini untuk menjalankan Server Backend & Database
# Port Default: 9090 (Bebas Bentrok & Kompatibel Penuh)
# Copyright © 2026 by Ravi SQ. Moh. Zein Permana
# ==============================================================================

# Berpindah ke direktori skrip ini berada
cd "$(dirname "$0")"

# Deteksi direktori node dari berbagai jalur instalasi macOS (Homebrew, NVM, Installer Resmi)
export PATH="/usr/local/bin:/opt/homebrew/bin:$HOME/.nvm/versions/node/$(ls "$HOME/.nvm/versions/node" 2>/dev/null | tail -n 1)/bin:$PATH"

clear
echo "=================================================================="
echo "    🏛️  SIDASI MTs AL-FADLLIYAH - SERVER BACKEND MANDIRI        "
echo "    Bebas MySQL & Python | Node.js Express + Local File DB       "
echo "=================================================================="
echo "  Penulis  : Ravi SQ. Moh. Zein Permana"
echo "  Status   : Memeriksa lingkungan sistem..."
echo "------------------------------------------------------------------"

# Periksa apakah Node.js terpasang di sistem
if ! command -v node >/dev/null 2>&1; then
    echo ""
    echo "❌ Node.js belum terdeteksi di komputer Mac Anda!"
    echo ""
    echo "Pilihan Tindakan:"
    echo "  [1] Pasang Node.js Otomatis Sekarang (Rekomendasi - Cepat & Resmi)"
    echo "  [2] Buka SIDASI Mode Offline (Tanpa Node.js)"
    echo "  [3] Keluar"
    echo ""
    read -p "Masukkan pilihan Anda [1/2/3] (Default: 1): " INSTALL_CHOICE
    INSTALL_CHOICE=${INSTALL_CHOICE:-1}

    if [ "$INSTALL_CHOICE" = "1" ]; then
        if [ -f "$DIR/Install_NodeJS_Mac.command" ]; then
            exec "$DIR/Install_NodeJS_Mac.command"
        else
            echo "Mengunduh installer resmi..."
            curl -# -L "https://nodejs.org/dist/v22.14.0/node-v22.14.0.pkg" -o "/tmp/node.pkg" && sudo installer -pkg "/tmp/node.pkg" -target /
        fi
    elif [ "$INSTALL_CHOICE" = "2" ]; then
        open "$DIR/index.html"
        exit 0
    fi
    exit 1
fi

echo "✅ Node.js terdeteksi: $(node -v)"
echo "✅ npm terdeteksi    : $(npm -v)"
echo ""

cd backend

# Periksa apakah dependensi express & cors sudah terpasang
if [ ! -d "node_modules" ]; then
    echo "📦 Menyiapkan pustaka backend pertama kali (npm install)..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Terjadi kendala saat mengunduh pustaka. Pastikan koneksi internet aktif saat setup pertama."
        echo "Tekan ENTER untuk keluar..."; read -r
        exit 1
    fi
    echo "✅ Pustaka berhasil disiapkan!"
    echo ""
fi

# Port target default 9090
export PORT=9090

# Bersihkan proses lama jika sebelumnya server pernah berjalan di port 9090, 5050, atau 5051
for p in 9090 5050 5051; do
    OLD_PID=$(lsof -ti :$p 2>/dev/null)
    if [ -n "$OLD_PID" ]; then
        echo "🧹 Menutup proses server lama di port $p (PID: $OLD_PID)..."
        kill -9 $OLD_PID 2>/dev/null || true
    fi
done
sleep 0.5

# Buka antarmuka aplikasi di browser default dalam 1.5 detik
(sleep 1.5 && open "http://localhost:$PORT") &

echo "🚀 Memulai Server Backend di Port $PORT..."
echo "👉 Tekan tombol [Ctrl + C] pada keyboard jika ingin menghentikan server."
echo "=================================================================="
echo ""

# Jalankan server
node server.js
