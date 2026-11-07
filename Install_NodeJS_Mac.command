#!/bin/bash
# ==============================================================================
# SIDASI MTs AL-FADLLIYAH - PEMASANG OTOMATIS NODE.JS (macOS)
# Mengunduh & memasang Node.js LTS secara otomatis untuk Apple Silicon & Intel
# Copyright © 2026 by Ravi SQ. Moh. Zein Permana
# ==============================================================================

# Berpindah ke direktori skrip ini berada
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

# Perbarui path untuk mendeteksi instalasi lama jika ada
export PATH="/usr/local/bin:/opt/homebrew/bin:$HOME/.nvm/versions/node/$(ls "$HOME/.nvm/versions/node" 2>/dev/null | tail -n 1)/bin:$PATH"

clear
echo "=================================================================="
echo "    🏛️  SIDASI MTs AL-FADLLIYAH - PEMASANG OTOMATIS NODE.JS      "
echo "    Pemasangan Runtime Bebas Ribet untuk macOS (Intel & M1/M2/M3) "
echo "=================================================================="
echo "  Pengembang : Ravi SQ. Moh. Zein Permana"
echo "------------------------------------------------------------------"

# 1. Periksa apakah Node.js sudah terpasang
if command -v node >/dev/null 2>&1; then
    NODE_VER=$(node -v)
    NPM_VER=$(npm -v 2>/dev/null || echo "terpasang")
    echo ""
    echo "🎉 Node.js sudah terpasang di Mac Anda!"
    echo "   • Versi Node.js : $NODE_VER"
    echo "   • Versi npm     : $NPM_VER"
    echo ""
    echo "Pilihan:"
    echo "  [1] Jalankan Aplikasi SIDASI Sekarang (Rekomendasi)"
    echo "  [2] Pasang Ulang / Perbarui Node.js"
    echo "  [3] Keluar"
    echo ""
    read -p "Masukkan pilihan Anda [1/2/3] (Default: 1): " CHOICE
    CHOICE=${CHOICE:-1}

    if [ "$CHOICE" = "1" ]; then
        if [ -f "$DIR/Buka_SIDASI.command" ]; then
            exec "$DIR/Buka_SIDASI.command"
        else
            open "http://localhost:9090"
            exit 0
        fi
    elif [ "$CHOICE" = "3" ]; then
        echo "Sampai jumpa!"
        exit 0
    fi
    echo ""
    echo "Melanjutkan pemasangan ulang Node.js..."
fi

# 2. Deteksi Arsitektur Mac (Apple Silicon vs Intel)
ARCH=$(uname -m)
echo ""
echo "🔍 Mendeteksi perangkat Mac Anda..."
if [ "$ARCH" = "arm64" ]; then
    echo "   • Arsitektur: Apple Silicon (M1 / M2 / M3 / M4)"
else
    echo "   • Arsitektur: Intel (x86_64)"
fi

# 3. Metode A: Jika Homebrew tersedia, gunakan Homebrew
if command -v brew >/dev/null 2>&1; then
    echo ""
    echo "📦 Homebrew terdeteksi di Mac Anda."
    echo "⏳ Memasang Node.js LTS via Homebrew..."
    brew install node
    if [ $? -eq 0 ]; then
        echo "✅ Node.js berhasil dipasang via Homebrew!"
    fi
fi

# 4. Metode B: Unduh Resmi Installer PKG dari nodejs.org jika belum terpasang
if ! command -v node >/dev/null 2>&1; then
    NODE_LTS_VERSION="v22.14.0"
    PKG_NAME="node-${NODE_LTS_VERSION}.pkg"
    PKG_URL="https://nodejs.org/dist/${NODE_LTS_VERSION}/${PKG_NAME}"
    TMP_PKG="/tmp/${PKG_NAME}"

    echo ""
    echo "📥 Mengunduh installer resmi Node.js LTS (${NODE_LTS_VERSION}) dari nodejs.org..."
    echo "   URL: $PKG_URL"
    echo ""

    # Unduh berkas installer .pkg dengan progress bar
    curl -# -L "$PKG_URL" -o "$TMP_PKG"

    if [ ! -f "$TMP_PKG" ] || [ ! -s "$TMP_PKG" ]; then
        echo ""
        echo "❌ Gagal mengunduh berkas installer Node.js."
        echo "💡 Silakan periksa koneksi internet Anda atau unduh manual dari: https://nodejs.org/"
        echo ""
        read -p "Tekan ENTER untuk keluar..."; exit 1
    fi

    echo ""
    echo "✅ Berkas installer berhasil diunduh!"
    echo "⚙️  Memulai proses instalasi ke sistem macOS..."
    echo "   (Sistem macOS mungkin akan meminta kata sandi Mac / Touch ID Anda)"
    echo ""

    # Coba instalasi command-line dengan sudo
    sudo installer -pkg "$TMP_PKG" -target / 2>/dev/null

    # Jika sudo gagal atau dibatalkan, buka wizard GUI resmi Apple
    if [ $? -ne 0 ]; then
        echo "⚠️  Membuka jendela wizard instalasi resmi Node.js..."
        open "$TMP_PKG"
        echo ""
        echo "👉 Silakan klik 'Continue' dan ikuti petunjuk di jendela yang muncul hingga selesai."
        echo "   Setelah selesai memasang, tekan ENTER di jendela Terminal ini..."
        read -r
    fi

    # Bersihkan file installer sementara
    rm -f "$TMP_PKG"
fi

# 5. Segarkan PATH dan verifikasi hasil instalasi
export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"

echo ""
echo "=================================================================="
echo "    VERIFIKASI HASIL INSTALASI                                   "
echo "=================================================================="

if command -v node >/dev/null 2>&1; then
    echo "🎉 SELAMAT! Node.js berhasil terpasang di Mac Anda!"
    echo "   • Node.js : $(node -v)"
    echo "   • npm     : $(npm -v)"
    echo ""

    # Menyiapkan dependensi backend SIDASI
    if [ -d "$DIR/backend" ]; then
        echo "📦 Memeriksa dependensi backend SIDASI (express & cors)..."
        cd "$DIR/backend"
        if [ ! -d "node_modules" ]; then
            echo "   Mengunduh modul backend (npm install)..."
            npm install --silent
        fi
        echo "✅ Dependensi backend SIDASI siap digunakan!"
        cd "$DIR"
    fi

    echo ""
    echo "🚀 Membuka aplikasi SIDASI sekarang..."
    sleep 1.5
    if [ -f "$DIR/Buka_SIDASI.command" ]; then
        exec "$DIR/Buka_SIDASI.command"
    else
        open "http://localhost:9090"
    fi
else
    echo "⚠️  Node.js belum terdeteksi di PATH aktif."
    echo "💡 Solusi mudah:"
    echo "   1. Tutup jendela Terminal ini."
    echo "   2. Buka kembali berkas 'Buka_SIDASI.command'."
    echo ""
    read -p "Tekan ENTER untuk keluar..."; exit 1
fi

