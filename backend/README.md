# Dokumentasi Backend SIDASI MTs Al-Fadlliyah
**Sistem Informasi Data Siswa Mandiri & Terpadu**  
*Bebas MySQL & Tanpa Python (100% JavaScript / Node.js Express)*  
**Copyright © 2026 by Ravi SQ. Moh. Zein Permana**

---

## 🌟 Gambaran Arsitektur Backend

Backend SIDASI dikembangkan menggunakan **Node.js** dan **Express.js** dengan mesin penyimpanan **Local File Database (JSON Atomic Engine)**.

### Mengapa Arsitektur Ini Dipilih?
1. **Bebas MySQL Server**: Tidak memerlukan konfigurasi database server terpisah seperti MySQL, PostgreSQL, XAMPP, Laragon, dsb.
2. **Tanpa Python**: Seluruh logika aplikasi (Frontend & Backend) berjalan murni dengan bahasa JavaScript.
3. **Penyimpanan Lokal Persisten**: Basis data disimpan dalam berkas `backend/data/sidasi_database.json` yang dapat dicadangkan, dipindahkan, dan disalin semudah menyalin sebuah berkas biasa.
4. **Keamanan Penulisan (Atomic Writes)**: Menggunakan pola *write-to-temporary & atomic rename* guna mencegah korupsi data jika laptop/komputer mati tiba-tiba.
5. **Mode Hybrid Terpadu**:
   - Jika Server Backend aktif: Aplikasi berjalan melalui `http://localhost:9090` dan otomatis menyinkronkan setiap perubahan data ke backend JSON file.
   - Jika Server Backend tidak dijalankan: Aplikasi tetap dapat dibuka langsung (`index.html`) menggunakan cache `LocalStorage` tanpa crash atau error.

---

## 🔑 Kredensial Default Masuk Sistem

| Username | Kata Sandi (Password) | Peran / Jabatan | Keterangan |
| :--- | :--- | :--- | :--- |
| **`admin`** | **`admin`** *(atau `123`)* | **Administrator Sistem (Super Admin)** | Akun utama dengan akses penuh |

> 💡 **Kondisi Basis Data Saat Ini (*Fresh Production State*)**:  
> Seluruh data operasional simulasi (siswa, mutasi, beasiswa) telah dikosongkan total (`0 data`). Struktur basis data siap digunakan untuk pengisian data santri riil madrasah baik lewat antarmuka web maupun impor file Excel.

---

## 🚀 Cara Menjalankan Backend

### Cara 1: Sekali Klik (Rekomendasi)
- **Pengguna macOS**:  
  Klik ganda pada berkas:
  ```bash
  Buka_SIDASI.command
  # atau
  Jalankan_Backend.command
  ```
- **Pengguna Windows**:  
  Klik ganda pada berkas:
  ```cmd
  Buka_SIDASI.bat
  # atau
  Jalankan_Backend.bat
  ```

Skrip peluncur otomatis akan:
1. Memeriksa ketersediaan runtime Node.js di komputer Anda.
2. Memasang paket pustaka yang diperlukan (`express`, `cors`) saat pertama kali dibuka.
3. Menjalankan server backend di `http://localhost:9090` (dilengkapi mekanisme *Auto-Port Fallback* jika port terpakai).
4. Membuka peramban web (browser) Anda secara otomatis.

---

### Cara 2: Melalui Terminal / Command Prompt

1. Buka Terminal pada komputer Anda dan arahkan ke direktori backend:
   ```bash
   cd "backend"
   ```

2. Pasang pustaka dependensi (hanya perlu sekali di awal):
   ```bash
   npm install
   ```

3. Jalankan server backend:
   ```bash
   npm start
   ```
   *(Atau jalankan: `node server.js`)*

4. Buka browser dan akses alamat:
   ```
   http://localhost:9090
   ```

---

## 🔌 Daftar Endpoint REST API

Semua endpoint API beralamat di basis URL: `http://localhost:9090/api`

| Metode | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Pengecekan status ketersediaan dan versi server |
| `POST` | `/api/auth/login` | Autentikasi dan verifikasi kredensial akun pengguna |
| `GET` | `/api/data` | Mengambil seluruh basis data aplikasi secara terpusat |
| `PUT` | `/api/data` | Menyimpan dan menyinkronkan seluruh basis data |
| `GET` | `/api/students` | Mendapatkan daftar siswa (filter: search, rombel, tingkat, status) |
| `GET` | `/api/students/:id` | Mendapatkan detail data lengkap seorang siswa |
| `POST` | `/api/students` | Menambahkan data siswa baru ke Buku Induk (34 Kolom EMIS) |
| `PUT` | `/api/students/:id` | Memperbarui data siswa berdasarkan ID |
| `DELETE`| `/api/students/:id` | Menghapus data siswa dari sistem |
| `POST` | `/api/students/import`| Mengimpor data siswa massal (Excel / Array JSON) |
| `GET` | `/api/students/export`| Mengekspor data buku induk ke format Excel |
| `GET` | `/api/mutations` | Mengambil daftar riwayat mutasi siswa (masuk / keluar) |
| `POST` | `/api/mutations` | Merekam transaksi mutasi siswa baru |
| `DELETE`| `/api/mutations/:id`| Menghapus riwayat mutasi |
| `GET` | `/api/beasiswa` | Mengambil daftar penerima beasiswa madrasah |
| `POST` | `/api/beasiswa` | Menambahkan santri penerima beasiswa baru |
| `PUT` | `/api/beasiswa/:id` | Memperbarui data penerima beasiswa berdasarkan ID |
| `DELETE`| `/api/beasiswa/:id` | Menghapus data santri penerima beasiswa |
| `GET` | `/api/beasiswa-pillars` | Mengambil daftar pilar / program beasiswa madrasah |
| `POST` | `/api/beasiswa-pillars` | Menambahkan program beasiswa kustom baru |
| `PUT` | `/api/beasiswa-pillars/:id` | Memperbarui nama / deskripsi program beasiswa |
| `DELETE`| `/api/beasiswa-pillars/:id` | Menghapus program beasiswa kustom |
| `GET` | `/api/rombel` | Mengambil data rombongan belajar (rombel) |
| `POST` | `/api/rombel` | Menambah rombel baru |
| `PUT` | `/api/rombel/:id` | Memperbarui wali kelas / kapasitas rombel |
| `DELETE`| `/api/rombel/:id` | Menghapus rombel |
| `GET` | `/api/academic-years` | Mengambil daftar tahun akademik & kalender aktif |
| `POST` | `/api/academic-years` | Menambah konfigurasi tahun akademik baru |
| `PUT` | `/api/academic-years/:id`| Mengubah status/konfigurasi kalender tahun akademik |
| `DELETE`| `/api/academic-years/:id`| Menghapus tahun akademik |
| `POST` | `/api/academic-years/switch`| Beralih tahun akademik aktif (sinkron navbar) |
| `GET` | `/api/institution` | Mengambil profil madrasah (NSM, NPSN, Akreditasi, Kamad) |
| `PUT` | `/api/institution` | Memperbarui profil madrasah & kop surat resmi |
| `GET` | `/api/users` | Mengambil daftar operator & hak akses (kata sandi disembunyikan) |
| `POST` | `/api/users` | Menambahkan akun operator baru |
| `PUT` | `/api/users/:id` | Memperbarui data akun pengguna / ganti peran |
| `DELETE`| `/api/users/:id` | Menghapus akun operator |
| `GET` | `/api/backup` | Mengunduh berkas arsip snapshot basis data JSON |
| `POST` | `/api/restore` | Memulihkan basis data dari berkas cadangan JSON |
| `POST` | `/api/reset` | Mereset basis data kembali ke data setelan pabrik default |

---

## 📁 Struktur Berkas Backend

```
WEB MTS AL-FADLLIYAH/
├── Buka_SIDASI.command        <-- Peluncur 1-klik untuk Mac (Port 9090)
├── Buka_SIDASI.bat            <-- Peluncur 1-klik untuk Windows (Port 9090)
├── Jalankan_Backend.command   <-- Peluncur backend alternatif untuk Mac
├── Jalankan_Backend.bat       <-- Peluncur backend alternatif untuk Windows
├── index.html                 <-- Tampilan Antarmuka Web SIDASI
├── js/
│   ├── data.js                <-- Data Awal Master & LocalStorage Model
│   ├── api.js                 <-- Bridge Penghubung Frontend ke REST API Backend
│   └── app.js                 <-- Logika Antarmuka & Controller SIDASI
└── backend/
    ├── package.json           <-- Konfigurasi Node.js & Dependensi (express, cors)
    ├── database.js            <-- Mesin Basis Data Berkas Mandiri (JSON CRUD Engine)
    ├── server.js              <-- Server REST API & Static File Server Express
    ├── README.md              <-- Dokumentasi Lengkap Backend
    └── data/
        ├── sidasi_database.json  <-- Basis data lokal persisten (Fresh State)
        └── .active_port          <-- Penanda port aktif dinamis
```

---

## 💡 Informasi Tambahan & Dukungan
Aplikasi SIDASI dan arsitektur backend ini dirancang khusus untuk kemudahan operasional madrasah, aman dari ketergantungan server luar, dan dapat berjalan lancar di segala spesifikasi komputer tanpa instalasi database rumit.

**Hak Cipta © 2026 by Ravi SQ. Moh. Zein Permana**
