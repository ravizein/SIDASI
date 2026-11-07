# SIDASI MTs AL-FADLLIYAH
**Sistem Informasi Data Siswa Terpadu Mandiri Madrasah Tsanawiyah**  
*Bebas Server MySQL & Bebas Python (100% Mandiri Berbasis Node.js & Web LocalStorage)*  
**Copyright © 2026 by Ravi SQ. Moh. Zein Permana**

---

> 📖 **PANDUAN PENGGUNA LENGKAP TERSEDIA DI BERKAS TERPISAH:**  
> Untuk panduan pengoperasian langkah demi langkah yang sangat lengkap, silakan buka:  
> 👉 [**`PANDUAN_PENGGUNAAN_LENGKAP_SIDASI.md`**](PANDUAN_PENGGUNAAN_LENGKAP_SIDASI.md)

---

## 🌟 Ringkasan Aplikasi

Aplikasi **SIDASI (Sistem Informasi Data Siswa) MTs AL-FADLLIYAH** dibangun untuk memenuhi kebutuhan tata kelola data kesiswaan madrasah secara mandiri (*standalone*), cepat, aman, dan andal tanpa ketergantungan server luar atau API pihak ketiga.

**Sistem terpusat pengelolaan Buku Induk Digital, administrasi mutasi resmi, transparansi beasiswa, serta penerbitan sampul rapor terstandar KMA No. 450 Tahun 2024.**

Sistem dirancang dengan identitas visual **Academic Emerald (`#16a34a` / `#059669`)** dan tipografi modern **Plus Jakarta Sans**, serta kepatuhan penuh terhadap regulasi resmi:
- **Standar Format Dokumen Rapor**: Keputusan Menteri Agama (KMA) No. 450 Tahun 2024 (Fase D Kurikulum Merdeka).
- **Format SK Mutasi Resmi**: Standar Registrasi Kantor Kementerian Agama Kabupaten Tasikmalaya.
- **Standar Format Buku Induk**: 34 Kolom Baku EMIS Kementerian Agama RI.

---

## 🔑 Kredensial Masuk Sistem (Default Login)

Untuk menjaga keamanan tata kelola data madrasah, akses ke dalam sistem dilindungi akun administrator:

| Username | Kata Sandi (Password) | Peran / Jabatan | Hak Akses |
| :--- | :--- | :--- | :--- |
| **`admin`** | **`admin`** *(atau `123`)* | **Administrator Sistem (Super Admin)** | Akses Penuh ke Seluruh Fitur, Modul, & Konfigurasi |

> 💡 **Status Basis Data (Siap Pakai / Fresh State)**:  
> Seluruh data simulasi demonstrasi (siswa, mutasi, beasiswa) telah **dibersihkan total (0 data)**. Hanya akun administrator `admin` yang dipertahankan. Madrasah dapat langsung memulai entri data santri riil baik melalui formulir input manual maupun fitur **Impor Berkas Excel (.xlsx / .csv)**.

---

## 🚀 Cara Menjalankan Aplikasi

### Pilihan 1: Mode Server Backend (Rekomendasi Utama - Port 9090)
Server REST API lokal murni Node.js Express dengan basis data lokal persisten (`backend/data/sidasi_database.json`).
- **Pengguna Mac**: Klik ganda berkas [**`Buka_SIDASI.command`**](Buka_SIDASI.command) atau [**`Jalankan_Backend.command`**](Jalankan_Backend.command).
- **Pengguna Windows**: Klik ganda berkas [**`Buka_SIDASI.bat`**](Buka_SIDASI.bat) atau [**`Jalankan_Backend.bat`**](Jalankan_Backend.bat).
- Buka browser dan akses: `http://localhost:9090`

### Pilihan 2: Mode Standalone / Tanpa Server (100% Offline)
Bebas instalasi runtime apa pun:
- Cukup klik ganda berkas [**`index.html`**](index.html) menggunakan Google Chrome, Safari, atau Edge.
- Seluruh data otomatis tersimpan di `LocalStorage` peramban komputer Anda.

---

## 📋 Fitur & Modul Terintegrasi

| Modul | Deskripsi & Fungsionalitas Utama |
| :--- | :--- |
| **0. Otentikasi & Form Login** | Tampilan login bersih, akun administrator utama (`admin`/`admin`), seleksi Tahun Ajaran & Semester aktif dengan sinkronisasi otomatis, serta status koneksi basis data. |
| **1. Data Umum (Dashboard)** | Metrik siswa aktif, rasio gender, santri mukim vs non-mukim, sebaran kapasitas rombel Fase D (Kelas VII, VIII, IX) dengan tombol kelola/hapus rombel langsung, dan status Akreditasi A (Unggul - BAN-S/M Skor 96). |
| **2. Buku Induk Siswa Digital (34 Kolom EMIS)** | Standar baku 34 Kolom EMIS Kemenag RI, multi-filter real-time (Nama/NISN/NIK, Jenjang, Rombel, Status Keaktifan, Domisili Mukim Pondok vs Non-Mukim), modal tambah/edit siswa dengan kalender interaktif, **Export & Import Excel `.xlsx` asli via SheetJS**, drawer samping detail biodata & checklist interaktif berkas fisik (Akta, KK, Ijazah SD, Surat Perjanjian). |
| **3. Manajemen Mutasi Siswa** | Administrasi mutasi masuk & keluar, formulir pengajuan mutasi dengan **otomatisasi pengisian NISN & Tingkat Kelas saat nama siswa dipilih**, pemilih tanggal kalender interaktif, dan **Live Preview & Cetak SK Mutasi Resmi ISO A4** berkop Kemenag lengkap dengan nomor registrasi, tanda tangan pejabat & stempel madrasah. |
| **4. Program Beasiswa (Fleksibel & Kustom)** | Pengelolaan beasiswa komprehensif: mendukung program bawaan (*Prestasi KSM & Akademik*, *Afirmasi Dhuafa BAZNAS*, *PIP APBN*) serta **penambahan, pengeditan, dan penghapusan program beasiswa kustom baru**. Formulir penerima dilengkapi **otomatisasi pengisian NISN saat nama siswa dipilih**, aksi **Edit & Hapus Penerima**, serta cetak rekapitulasi realisasi finansial A4. |
| **5. Identitas Rapor (KMA 450/2024)** | Pengaturan nomenklatur madrasah (NSM, NPSN, titimangsa kalender interaktif, pejabat penandatangan), toggle watermark & margin jilid 2.0 cm, serta **Live Preview & Cetak Sampul Depan Rapor Kurikulum Merdeka Standar A4**. |
| **6. Pengaturan Sistem** | Konfigurasi profil lembaga & kop surat resmi, kalender akademik kustom dengan pemilih tanggal interaktif sinkron navbar, manajemen & hak akses pengguna (tambah, edit, hapus staf), **Export & Import Excel (.xlsx/.csv)**, **Pencadangan Mandiri (Backup Snapshot `.sql.gz` / JSON) & Pemulihan (Restore)**, serta **Tombol Pengosongan / Hapus Semua Basis Data dengan Pop-up Validasi Konfirmasi Keamanan**. |

---

## 📅 Fitur Kemudahan Pengisian Data Baru

1. **Pemilih Tanggal Kalender Interaktif (Tanpa Ketik Manual)**:
   - Seluruh kolom isian tanggal pada formulir Tambah Siswa, Edit Siswa, Ajukan Mutasi, Penerima Beasiswa, Titimangsa Rapor, dan Kalender Akademik telah dilengkapi **pemilih kalender visual bawaan peramban (`type="date"`)**.
   - Cukup klik kolom tanggal untuk langsung membuka kalender visual dan memilih hari/bulan/tahun dengan akurat tanpa takut salah format.
2. **Otomatisasi Cerdas pada Formulir Pengajuan**:
   - **Formulir Ajukan Mutasi**: Saat operator memilih/memasukkan nama siswa dari daftar, kolom **NISN** dan **Tingkat Kelas** akan **terisi otomatis** sesuai data di Buku Induk.
   - **Formulir Tambah Penerima Beasiswa**: Saat nama siswa dipilih/dimasukkan, kolom **NISN** otomatis terisi tanpa perlu mengetik ulang.
3. **Notifikasi Penyimpanan & Sinkronisasi Instan**:
   - Setelah menekan tombol simpan, modal otomatis ditutup dan sistem menampilkan notifikasi keberhasilan di pojok layar sehingga operator tidak perlu menunggu lama di dalam formulir.

---

## 📁 Struktur Berkas Proyek

```
WEB MTS AL-FADLLIYAH/
├── Buka_SIDASI.command                      # Peluncur utama 1-klik untuk macOS (Port 9090)
├── Buka_SIDASI.bat                          # Peluncur utama 1-klik untuk Windows (Port 9090)
├── Jalankan_Backend.command                 # Peluncur backend alternatif untuk macOS (Port 9090)
├── Jalankan_Backend.bat                     # Peluncur backend alternatif untuk Windows (Port 9090)
├── index.html                               # Antarmuka SPA utama SIDASI
├── PANDUAN_PENGGUNAAN_LENGKAP_SIDASI.md     # Buku panduan lengkap operasional
├── README.md                                # Ringkasan panduan cepat
├── css/
│   └── styles.css                           # Styling kustom & Print Engine ISO A4
├── js/
│   ├── data.js                              # Master dataset & local storage model
│   ├── api.js                               # Bridge REST API client & real-time sync
│   └── app.js                               # Controller antarmuka & controller modul
└── backend/
    ├── package.json                         # Dependensi express & cors
    ├── database.js                          # Mesin JSON database lokal atomic
    ├── server.js                            # REST API server & web server static
    ├── README.md                            # Dokumentasi teknis backend
    └── data/
        ├── sidasi_database.json             # Basis data fisik lokal persisten (Fresh State)
        └── .active_port                     # Catatan port aktif dinamis
```

---

*Hak Cipta © 2026 Madrasah Tsanawiyah Al-Fadlliyah Singaparna.*  
*Dikembangkan oleh: **Ravi SQ. Moh. Zein Permana***
