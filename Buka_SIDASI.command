#!/bin/bash
# ==============================================================================
# SIDASI MTs AL-FADLLIYAH - PELUNCUR APLIKASI (macOS)
# Menjalankan & Membuka SIDASI di Port 9090
# Copyright © 2026 by Ravi SQ. Moh. Zein Permana
# ==============================================================================

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

# Deteksi path node dari berbagai jalur instalasi macOS
export PATH="/usr/local/bin:/opt/homebrew/bin:$HOME/.nvm/versions/node/$(ls "$HOME/.nvm/versions/node" 2>/dev/null | tail -n 1)/bin:$PATH"
export PORT=9090

# 1. Hentikan instance server lama di port 9090 (jika ada) agar memuat kode terbaru secara bersih
if lsof -ti :9090 >/dev/null 2>&1; then
    kill -9 $(lsof -ti :9090) 2>/dev/null
    sleep 0.5
fi

# 2. Jika Node.js terpasang, jalankan server backend di port 9090 di latar belakang
if command -v node >/dev/null 2>&1 && [ -f "$DIR/backend/server.js" ]; then
    cd "$DIR/backend"
    if [ ! -d "node_modules" ]; then
        npm install --silent >/dev/null 2>&1
    fi
    # Jalankan server backend di background
    nohup node server.js >/dev/null 2>&1 &
    sleep 1.2
    open "http://localhost:9090"
    exit 0
fi

# 3. Fallback jika port sebelumnya masih berjalan
if lsof -ti :5050 >/dev/null 2>&1; then
    open "http://localhost:5050"
elif lsof -ti :5051 >/dev/null 2>&1; then
    open "http://localhost:5051"
else
    # 4. Fallback offline jika node belum terpasang
    open "$DIR/index.html"
fi
