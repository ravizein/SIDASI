# BUKU PANDUAN PENGGUNAAN LENGKAP
# SIDASI MTs AL-FADLLIYAH
### Sistem Informasi Data Siswa Terpadu Mandiri Madrasah Tsanawiyah
**Bebas Server MySQL & Bebas Python (100% Mandiri Berbasis Node.js & Web LocalStorage)**  
**Copyright © 2026 by Ravi SQ. Moh. Zein Permana**

---

## 📑 DAFTAR ISI

1. [Tentang SIDASI MTs Al-Fadlliyah](#1-tentang-sidasi-mts-al-fadlliyah)
2. [Persyaratan Sistem & Lingkungan Kerja](#2-persyaratan-sistem--lingkungan-kerja)
3. [Cara Menjalankan Aplikasi](#3-cara-menjalankan-aplikasi)
   - [Metode 1: Mode Server Backend (Rekomendasi Utama - Port 9090)](#metode-1-mode-server-backend-rekomendasi-utama---port-9090)
   - [Metode 2: Mode Standalone / Langsung Buka File (100% Offline)](#metode-2-mode-standalone--langsung-buka-file-100-offline)
4. [Panduan Masuk Sistem (Login) & Manajemen Sesi](#4-panduan-masuk-sistem-login--manajemen-sesi)
   - [Daftar Akun Pengguna Default](#daftar-akun-pengguna-default)
   - [Langkah Login & Logout](#langkah-login--logout)
5. [Navigasi Utama & Kontrol Global](#5-navigasi-utama--kontrol-global)
   - [Bilah Samping (Sidebar) & Status Koneksi](#bilah-samping-sidebar--status-koneksi)
   - [Bilah Atas (Navbar) & Sinkronisasi Tahun Akademik](#bilah-atas-navbar--sinkronisasi-tahun-akademik)
6. [Panduan Operasional Tiap Modul](#6-panduan-operasional-tiap-modul)
   - [Modul 1: Data Umum (Dasbor Statistik)](#modul-1-data-umum-dasbor-statistik)
   - [Modul 2: Buku Induk Siswa Digital (34 Kolom EMIS)](#modul-2-buku-induk-siswa-digital-34-kolom-emis)
   - [Modul 3: Mutasi Siswa (Masuk & Keluar)](#modul-3-mutasi-siswa-masuk--keluar)
   - [Modul 4: Program Beasiswa (Program Bawaan & Kustom)](#modul-4-program-beasiswa-program-bawaan--kustom)
   - [Modul 5: Identitas Rapor (KMA No. 450/2024)](#modul-5-identitas-rapor-kma-no-4502024)
   - [Modul 6: Pengaturan Sistem](#modul-6-pengaturan-sistem)
7. [Fitur Kemudahan Pengisian & Interaktivitas Kalender](#7-fitur-kemudahan-pengisian--interaktivitas-kalender)
8. [Panduan Khusus: Ekspor & Impor Data Excel (.xlsx / .csv)](#8-panduan-khusus-ekspor--impor-data-excel-xlsx--csv)
9. [Panduan Khusus: Pencadangan & Pemulihan Database (Backup & Restore)](#9-panduan-khusus-pencadangan--pemulihan-database-backup--restore)
10. [Panduan Cetak Dokumen Presisi ISO A4](#10-panduan-cetak-dokumen-presisi-iso-a4)
11. [Tanya Jawab & Pemecahan Masalah (FAQ & Troubleshooting)](#11-tanya-jawab--pemecahan-masalah-faq--troubleshooting)

---

## 1. TENTANG SIDASI MTs AL-FADLLIYAH

**SIDASI (Sistem Informasi Data Siswa)** adalah aplikasi manajemen administrasi dan buku induk kesiswaan yang dikembangkan khusus untuk **MTs AL-FADLLIYAH** (NSM: 121232040018 / NPSN: 20278912).

**Sistem terpusat pengelolaan Buku Induk Digital, administrasi mutasi resmi, transparansi beasiswa, serta penerbitan sampul rapor terstandar KMA No. 450 Tahun 2024.**

### Keunggulan Utama SIDASI:
* **Bebas Instalasi MySQL / XAMPP**: Anda tidak perlu memasang atau mengelola server basis data SQL yang rumit.
* **Tanpa Python**: Seluruh mesin logika berjalan murni menggunakan JavaScript (*Node.js Express + Client-Side SPA*).
* **Penyimpanan Lokal Persisten**: Menggunakan berkas JSON mandiri (*Atomic Local File DB*) yang aman dari kerusakan data dan mudah dicadangkan.
* **Arsitektur Hybrid Cerdas**: Jika server backend aktif, data otomatis tersimpan ke `backend/data/sidasi_database.json` di port 9090. Jika backend tidak dijalankan, aplikasi tetap dapat beroperasi secara mandiri (*standalone*) menggunakan penyimpanan `LocalStorage` browser.
* **Kepatuhan Standar Kementerian**:
  - Standar Sampul & Identitas Rapor: **Keputusan Menteri Agama (KMA) No. 450 Tahun 2024** (Fase D Kurikulum Merdeka).
  - Standar Surat Keterangan Mutasi: Format Baku Kementerian Agama Kabupaten Tasikmalaya.
  - Standar Format Buku Induk: **34 Kolom Baku EMIS Kementerian Agama RI**.

---

## 2. PERSYARATAN SISTEM & LINGKUNGAN KERJA

Aplikasi SIDASI sangat ringan dan dapat berjalan lancar di segala spesifikasi laptop/komputer:
* **Sistem Operasi**: macOS (Apple Silicon / Intel), Windows 10/11, atau Linux.
* **Peramban Web (Browser)**: Google Chrome (sangat direkomendasikan untuk cetak presisi A4), Microsoft Edge, Mozilla Firefox, atau Safari.
* **Runtime Node.js (Untuk Mode Backend)**: Versi 18 LTS atau yang lebih baru (Gratis diunduh dari [nodejs.org](https://nodejs.org/)).

---

## 3. CARA MENJALANKAN APLIKASI

Tersedia 2 metode praktis untuk membuka aplikasi:

### METODE 1: Mode Server Backend (Rekomendasi Utama - Port 9090)
Mode ini mengaktifkan server REST API dan penyimpanan berkas JSON permanen.

#### 🍏 Pengguna macOS (MacBook / iMac):
1. Buka folder kerja **`WEB MTS AL-FADLLIYAH`**.
2. **Klik ganda (double-click)** pada berkas:
   ```bash
   Buka_SIDASI.command
   # atau
   Jalankan_Backend.command
   ```
3. Jendela Terminal akan terbuka, memeriksa kesiapan Node.js, memasang pustaka jika baru pertama kali, dan otomatis membuka peramban web ke:
   ```
   http://localhost:9090
   ```
4. Biarkan jendela terminal tetap terbuka selama Anda menggunakan aplikasi. Untuk menutup server, tekan tombol `Ctrl + C` pada terminal.

#### 🪟 Pengguna Windows (PC / Laptop):
1. Buka folder kerja **`WEB MTS AL-FADLLIYAH`**.
2. **Klik ganda (double-click)** pada berkas:
   ```cmd
   Buka_SIDASI.bat
   # atau
   Jalankan_Backend.bat
   ```
3. Command Prompt akan berjalan dan peramban web otomatis terbuka ke `http://localhost:9090`.

---

### METODE 2: Mode Standalone / Langsung Buka File (100% Offline)
Jika komputer Anda belum memiliki Node.js, aplikasi tetap dapat dibuka langsung:
1. Buka folder **`WEB MTS AL-FADLLIYAH`**.
2. Klik ganda langsung pada berkas:
   ```
   index.html
   ```
3. Aplikasi akan langsung terbuka di browser Anda menggunakan basis data mandiri `LocalStorage`. Indikator sidebar akan menampilkan status: `Basis Data Lokal Standalone (Offline)`.

---

## 4. PANDUAN MASUK SISTEM (LOGIN) & MANAJEMEN SESI

Untuk menjamin keamanan administrasi data kesiswaan madrasah, SIDASI dilengkapi sistem otentikasi peran staf.

### Daftar Akun Pengguna Default:

| Nama Pengguna | Username | Kata Sandi | Peran / Jabatan | Hak Akses Utama |
| :--- | :--- | :--- | :--- | :--- |
| **Administrator SIDASI** | `admin` | `admin` *(atau `123`)* | **Administrator Sistem (Super Admin)** | Akses Penuh Seluruh Sistem & Konfigurasi |

> 🔑 **Akses Login Utama**: Gunakan **Username: `admin`** dan **Kata Sandi: `admin`** *(atau `123`)*. Anda dapat menambahkan akun operator atau staf baru secara mandiri kapan saja melalui menu **Pengaturan Sistem** > **Pengguna & Hak Akses**.

> 💡 **Status Basis Data (Siap Entri Data Riil / Fresh State)**:  
> Seluruh data simulasi demonstrasi (siswa, mutasi, beasiswa) telah **dibersihkan secara total (0 data)**. Seluruh antarmuka (frontend) dan basis data (backend) telah tersinkronisasi 100% dalam kondisi bersih dan siap pakai (*fresh state*) untuk diisi data siswa riil madrasah baik lewat formulir input manual maupun fitur **Impor Berkas Excel (.xlsx / .csv)**.

### Langkah Login:
1. Buka aplikasi. Halaman formulir login berlatar belakang putih bersih akan tampil.
2. Masukkan **Username**: `admin`
3. Masukkan **Kata Sandi**: `admin` *(atau `123`)*
4. Centang *"Ingat akun ini pada peramban ini"* jika ingin tetap masuk saat browser ditutup.
5. Klik tombol hijau **`Masuk ke SIDASI`**.

### Langkah Logout & Berganti Pengguna:
* Untuk keluar atau berpindah akun, klik tombol **Keluar** (merah/abu-abu) atau ikon **Beralih Pengguna** di bilah atas (*navbar*).

---

## 5. NAVIGASI UTAMA & KONTROL GLOBAL

### Bilah Samping (Sidebar)
Bilah samping di sebelah kiri memuat:
1. **Identitas Lembaga**: Logo resmi madrasah, nama MTs Al-Fadlliyah, dan subjudul SIDASI.
2. **Indikator Status Basis Data**:
   - 🟢 **Hijau (*Server Backend Terhubung*)**: Data otomatis tersinkronisasi ke berkas backend `backend/data/sidasi_database.json` di **Port 9090**.
   - ⚪ **Abu-abu (*Basis Data Lokal Standalone*)**: Berjalan menggunakan penyimpanan peramban `LocalStorage`.
3. **Menu Modul 1 sampai 6 (Stay on Refresh)**: Klik menu untuk berpindah halaman secara instan tanpa memuat ulang (*zero reload*). Posisi menu modul dan sub-tab aktif otomatis tersimpan, sehingga saat Anda me-refresh peramban (F5 / Cmd+R), aplikasi tetap bertahan di menu yang sedang dibuka.
4. **Informasi Sistem & Hak Cipta**: Nomor registrasi NSM madrasah, status versi standalone, serta label hak cipta resmi: **Ravi SQ. Moh. Zein Permana**.

### Bilah Atas (Navbar)
Bilah atas memuat:
1. **Dropdown Tahun Akademik Aktif**:
   - Menampilkan tahun ajaran dan semester yang sedang dipilih (contoh: *TA 2024/2025 - Semester Ganjil*).
   - **Fitur Sinkronisasi**: Setiap kali Anda mengganti pilihan tahun akademik di navbar, seluruh angka statistik, data siswa, mutasi, dan beasiswa akan **otomatis tersinkronisasi** dan menampilkan data khusus tahun ajaran bersangkutan!
2. **Profil Pengguna Aktif**: Menampilkan avatar inisial, nama akun, peran/jabatan, serta tombol **Beralih Pengguna**.
3. **Tombol Keluar / Logout**: Tombol praktis untuk mengakhiri sesi kerja dengan aman.

---

## 6. PANDUAN OPERASIONAL TIAP MODUL

---

### MODUL 1: DATA UMUM (DASBOR STATISTIK)
Modul ini menyajikan ringkasan eksekutif kondisi kesiswaan madrasah secara menyeluruh:
* **Kartu Metrik Kunci**:
  - **Total Siswa Aktif**: Jumlah siswa terdaftar (awal 0 - siap diisi data riil atau diimpor dari Excel).
  - **Rasio Gender**: Sebaran jumlah & persentase siswa laki-laki vs perempuan.
  - **Santri Mukim vs Non-Mukim**: Jumlah siswa yang menetap di asrama/pondok pesantren vs siswa pulang-pergi.
  - **Validitas Berkas**: Persentase kelengkapan berkas persyaratan siswa (Akta, KK, Ijazah SD, Surat Perjanjian).
  - **Penerima Beasiswa**: Jumlah siswa penerima program bantuan pendidikan.
* **Grafik Kapasitas & Menu Rombel**: Visualisasi keterisian ruang kelas per jenjang (Kelas VII, Kelas VIII, dan Kelas IX) lengkap dengan tombol hapus rombel langsung, lencana interaktif, serta Menu Aksi Rombel.
* **Status Akreditasi**: Status resmi akreditasi madrasah (**Akreditasi A / Unggul - BAN-S/M Skor 96**).

---

### MODUL 2: BUKU INDUK SISWA DIGITAL (34 KOLOM EMIS)
Pusat pencatatan seluruh biodata lengkap santri/siswa madrasah sesuai regulasi EMIS Kemenag:
* **Pencarian & Multi-Filter Real-Time**:
  - Kolom teks pencarian: cari berdasarkan Nama Siswa, NISN, NIS, atau NIK.
  - Filter Tingkat: Semua, Kelas VII, Kelas VIII, Kelas IX.
  - Filter Rombel: Pilih kelas tertentu (misal: VII-A, VIII-B, IX-C).
  - Filter Domisili: Semua, Mukim (Asrama Pondok), Non-Mukim (Reguler).
  - Filter Status: Aktif, Mutasi Keluar, Lulus.
* **Menambah Siswa Baru Secara Manual**:
  1. Klik tombol hijau **`+ Tambah Siswa`** di pojok kanan atas tabel.
  2. Isi formulir modal: NISN (10 digit), NIS, NIK (16 digit), Nama Lengkap, Jenis Kelamin, Tingkat, Rombel, Tempat Lahir, **Tanggal Lahir (klik pemilih kalender interaktif)**, Agama, Hobi, Cita-cita, Anak ke-, Jumlah Saudara, Status Santri Mukim, Alamat Lengkap (RT/RW/Kelurahan/Kecamatan/Kabupaten/Provinsi/Kode Pos), Biodata Orang Tua/Wali (Nama & Pekerjaan Ayah, Ibu, Wali, Penghasilan, No. HP), dan Status Beasiswa.
  3. Klik **`Simpan Data Siswa`**. Modal otomatis menutup dan notifikasi konfirmasi langsung muncul. Data tersimpan seketika di sistem dan tersinkronisasi ke backend.
* **Melihat Detail & Mengedit Data Siswa (Drawer Interaktif)**:
  1. Klik nama siswa pada baris tabel mana pun.
  2. Panel laci samping (*drawer*) akan meluncur keluar dari kanan layar.
  3. Anda dapat memeriksa biodata lengkap siswa, riwayat catatan BK, serta **Checklist Kelengkapan Berkas Fisik** (Akta Lahir, Kartu Keluarga, Ijazah SD, Surat Perjanjian Santri).
  4. Untuk mengubah data, klik tombol **`Edit Data`**, lakukan pembaruan (dengan pemilih tanggal kalender), lalu klik **`Simpan Perubahan`**.
* **Menghapus Data Siswa**:
  - Buka detail siswa melalui drawer, lalu klik tombol merah **`Hapus Siswa`**. Konfirmasikan persetujuan Anda.
* **Mencetak Lembar Buku Induk A4**:
  - Pada panel detail siswa, klik tombol **`Cetak Lembar Induk (A4)`** untuk mencetak formulir biodata resmi sesuai format standar Departemen Agama.

---

### MODUL 3: MUTASI SISWA (MASUK & KELUAR)
Modul untuk mencatat dan menerbitkan dokumen hukum perpindahan siswa:
* **Merekam Mutasi Keluar**:
  1. Klik tombol **`+ Catat Mutasi Baru`**.
  2. Pilih jenis mutasi: **Mutasi Keluar**.
  3. **Pilih atau ketik Nama Siswa**: Sistem akan **secara otomatis mengisi kolom NISN dan Tingkat Kelas** sesuai data siswa di Buku Induk!
  4. Isi sekolah/madrasah tujuan, **Tanggal Surat (klik kalender interaktif)**, alasan mutasi (misal: *Mengikuti domisili orang tua*), dan pejabat penandatangan.
  5. Klik **`Simpan Mutasi`**. Notifikasi konfirmasi akan muncul dan status siswa di Buku Induk akan otomatis diperbarui menjadi *Mutasi Keluar*.
* **Merekam Mutasi Masuk**:
  1. Pilih jenis mutasi: **Mutasi Masuk**.
  2. Masukkan nama siswa pindahan, NISN, madrasah asal, rombel tujuan, tanggal mutasi (klik kalender interaktif), dan nomor surat rekomendasi Kemenag.
  3. Klik **`Simpan Mutasi`**.
* **Mencetak Surat Keterangan (SK) Mutasi Resmi A4**:
  1. Pada tabel riwayat mutasi, pilih mutasi yang diinginkan.
  2. Area pratinjau lembar A4 akan menampilkan surat resmi berkop Kementerian Agama Kabupaten Tasikmalaya lengkap dengan logo madrasah, nomor surat otomatis, tabel biodata siswa, dan titimangsa tanda tangan.
  3. Klik tombol hijau **`Cetak Surat Keterangan A4`**. Surat akan tercetak bersih dan presisi tanpa elemen antarmuka web.

---

### MODUL 4: PROGRAM BEASISWA (PROGRAM BAWAAN & KUSTOM)
Modul tata kelola dan penyaluran bantuan pendidikan madrasah secara fleksibel dan transparan:
* **Program Beasiswa Bawaan & Kustom**:
  1. **Prestasi KSM & Akademik**: Bantuan biaya pendidikan untuk santri berprestasi sains/akademik.
  2. **Afirmasi Dhuafa (Kerjasama BAZNAS)**: Subsidi santri yatim/piatu dan dhuafa bekerja sama dengan BAZNAS Kab. Tasikmalaya.
  3. **Program Indonesia Pintar (PIP APBN)**: Bantuan tunai kementerian untuk santri pemegang KIP/PKH.
  4. **Program Beasiswa Kustom**: Madrasah bebas menambahkan program beasiswa baru (misalnya: *Beasiswa Tahfidz Al-Qur'an*, *Beasiswa Mitra Industri/Alumni*, *Beasiswa Kader Ulama*, dsb.).
* **Kelola Program Beasiswa (Tambah, Edit, Hapus Kategori)**:
  - **Tambah Program Beasiswa Baru**: Klik tombol **`+ Tambah Program Beasiswa`** atau **`Kelola Kategori Beasiswa`**, masukkan Nama Program, Kode, Sumber Dana, dan Anggaran Pagu.
  - **Edit Program Beasiswa**: Klik tombol Edit pada kartu program beasiswa untuk memperbarui nama atau nominal pagu.
  - **Hapus Program Beasiswa**: Klik tombol Hapus pada program beasiswa kustom yang tidak lagi digunakan.
* **Menambah Penerima Beasiswa Baru**:
  1. Klik tombol hijau **`+ Tambah Penerima Beasiswa`**.
  2. **Pilih atau ketik Nama Siswa**: Sistem akan **secara otomatis mengisi kolom NISN** santri bersangkutan.
  3. Pilih Jenis Program Beasiswa (pilar bawaan atau program kustom yang telah dibuat).
  4. Tentukan Nominal Bantuan Finansial per semester.
  5. Isi **Tanggal SK / Tanggal Penetapan (klik kalender interaktif)** dan nomor rekening/rekomendasi.
  6. Klik **`Simpan Penerima Beasiswa`**. Modal otomatis tertutup dan notifikasi berhasil ditampilkan.
* **Mengedit & Menghapus Penerima Beasiswa**:
  - Pada tabel daftar penerima beasiswa, setiap baris dilengkapi tombol aksi:
    - Tombol Pensil **`Edit`**: Klik untuk membuka formulir edit penerima beasiswa (mengubah nominal, tanggal, status, atau nomor rekening).
    - Tombol Sampah **`Hapus`**: Klik untuk mencabut/menghapus data penerima beasiswa.
* **Mencetak Rekapitulasi Realisasi Finansial A4**:
  - Klik tombol **`Cetak Rekapitulasi A4`** untuk mencetak berkas laporan serapan dana beasiswa resmi untuk keperluan rapat yayasan atau audit BOS/Kemenag.

---

### MODUL 5: IDENTITAS RAPOR (KMA NO. 450/2024)
Generator sampul depan dan lembar identitas rapor Kurikulum Merdeka Fase D:
1. **Pilih Siswa**: Gunakan dropdown pencarian siswa untuk memilih santri yang akan dicetak rapornya.
2. **Kustomisasi Tampilan Sampul**:
   - *Margin Jilid 2.0 cm*: Aktifkan opsi ini untuk memberikan ruang jilid di sisi kiri kertas A4.
   - *Watermark Resmi Madrasah*: Opsi menampilkan lambang madrasah tipis di tengah halaman.
   - *Titimangsa & Pejabat*: Sesuaikan tanggal penyerahan rapor dengan **pemilih kalender interaktif**, serta nama Kepala Madrasah / Wali Kelas.
3. **Pratinjau Nyata (*Live Preview*)**:
   - Di sebelah kanan layar, lembar sampul A4 tampil persis seperti hasil cetak kertas.
4. **Cetak Sampul Rapor A4**:
   - Klik tombol hijau **`Cetak Sampul Depan (A4)`**. Dokumen dicetak dengan garis bingkai simetris, kotak identitas siswa, dan alamat lembaga yang rapi.

---

### MODUL 6: PENGATURAN SISTEM
Pusat konfigurasi parameter madrasah, tahun ajaran, pengguna, dan pencadangan:

#### 1. Profil Madrasah & Kop Surat Resmi
- Ubah Nama Lembaga, NSM, NPSN, Status Akreditasi, Alamat Lengkap, No. Telepon, Surel, Nama Kepala Madrasah, dan NIP.
- Klik **`Simpan Perubahan Profil`** untuk memperbarui seluruh kop surat di semua dokumen cetak.

#### 2. Konfigurasi Kalender Akademik Kustom
- **Menambah Tahun Akademik Baru**: Klik tombol **`+ Tambah Tahun Akademik`**, masukkan ID (misal: `2025-2026-1`), Nama Tahun Ajaran (misal: *TA 2025/2026*), Semester (Ganjil/Genap), **Tanggal Mulai dan Tanggal Selesai (menggunakan pemilih kalender interaktif)**.
- **Mengubah Status Kalender**: Tetapkan status sebagai **Aktif**, **Perencanaan**, atau **Arsip**.
- **Sinkronisasi ke Navbar**: Saat Anda menandai tahun ajaran sebagai "Aktif", pilihan di navbar atas otomatis berubah dan data kesiswaan menyesuaikan kalender akademik tersebut!
- **Hapus Tahun Ajaran**: Klik ikon tempat sampah untuk menghapus kalender tahun akademik yang tidak diperlukan lagi.

#### 3. Kelola Pengguna & Hak Akses
- Daftar staf yang berhak mengakses SIDASI.
- **Tambah Pengguna Baru**: Masukkan Nama Staf, Username, Password, dan Peran.
- **Aksi Edit Pengguna**: Klik tombol ikon pensil **`Edit`** untuk memperbarui nama, username, status keaktifan, atau peran staf.
- **Aksi Hapus Pengguna**: Klik tombol ikon tempat sampah **`Hapus`** untuk menghapus akun staf yang sudah tidak bertugas. *(Sistem secara aman mencegah penghapusan jika hanya tersisa 1 akun administrator)*.

#### 4. Manajemen & Hapus Rombongan Belajar (Rombel)
- **Hapus Rombel Langsung dari Dasbor (DU-03)**: Klik ikon tempat sampah `🗑️` pada lencana rombel.
- **Hapus Rombel dari Pengaturan Sistem**: Buka Pengaturan Sistem > Tab Tingkat & Rombel Belajar, klik tombol merah **`Hapus`** pada baris rombel.

---

## 7. FITUR KEMUDAHAN PENGISIAN & INTERAKTIVITAS KALENDER

Untuk meningkatkan efisiensi dan kenyamanan kerja operator madrasah, SIDASI dilengkapi sejumlah fitur otomatisasi modern:

1. **Pemilih Tanggal Kalender Visual (Tanpa Ketik Manual)**:
   - Di seluruh formulir aplikasi (Tambah Siswa, Edit Siswa, Ajukan Mutasi, Penerima Beasiswa, Titimangsa Rapor, dan Kalender Akademik), kolom tanggal menggunakan input kalender visual bawaan peramban (`type="date"`).
   - Operator cukup mengklik kolom tanggal untuk langsung menampilkan kalender pop-up, memilih bulan, tahun, dan hari dengan satu klik tanpa perlu mengetik garis miring atau strip secara manual.
2. **Pengisian Otomatis Data Siswa pada Formulir**:
   - **Formulir Ajukan Mutasi**: Saat operator memilih nama siswa pada kolom input/dropdown, sistem membaca data buku induk dan **otomatis mengisi kolom NISN serta Tingkat Kelas**.
   - **Formulir Tambah Penerima Beasiswa**: Saat nama siswa dipilih, kolom **NISN otomatis terisi** secara akurat.
3. **Notifikasi Cepat Pasca Penyimpanan**:
   - Setelah menekan tombol "Simpan", jendela modal langsung tertutup dan notifikasi berhasil berwarna hijau muncul di sudut layar, memastikan operator tidak terjebak menunggu di dalam formulir.

---

## 8. PANDUAN KHUSUS: EKSPOR & IMPOR DATA EXCEL (.xlsx / .csv)

Fitur ini sangat bermanfaat jika Anda ingin memindahkan data santri lama dari Microsoft Excel ke dalam SIDASI dengan format resmi EMIS Kemenag.

### Struktur 34 Kolom Standar EMIS Kemenag:
Berkas Excel ekspor/impor SIDASI mendukung 34 kolom data kesiswaan:
1. `id` (ID Sistem Siswa)
2. `nisn` (Nomor Induk Siswa Nasional - 10 Digit)
3. `nis` (Nomor Induk Siswa Madrasah)
4. `nik` (Nomor Induk Kependudukan - 16 Digit)
5. `nama` (Nama Lengkap Santri)
6. `jk` (Jenis Kelamin: L / P)
7. `tingkat` (Jenjang: 7 / 8 / 9)
8. `rombel` (Rombongan Belajar: VII-A, VIII-B, dsb.)
9. `tempatLahir` (Kota / Kabupaten Lahir)
10. `tanggalLahir` (Format: YYYY-MM-DD atau DD/MM/YYYY)
11. `agama` (Agama Siswa)
12. `hobi` (Kegemaran / Hobi)
13. `citaCita` (Cita-cita)
14. `anakKe` (Urutan Anak dalam Keluarga)
15. `jumlahSaudara` (Jumlah Saudara Kandung)
16. `statusSantri` (Mukim di Pondok / Non-Mukim)
17. `alamat` (Jalan / Dusun / Kampung)
18. `rt` (Rukun Tetangga)
19. `rw` (Rukun Warga)
20. `kelurahan` (Desa / Kelurahan)
21. `kecamatan` (Kecamatan)
22. `kabupaten` (Kabupaten / Kota)
23. `provinsi` (Provinsi)
24. `kodePos` (Kode Pos)
25. `namaAyah` (Nama Lengkap Ayah Kandung)
26. `pekerjaanAyah` (Pekerjaan Ayah)
27. `namaIbu` (Nama Lengkap Ibu Kandung)
28. `pekerjaanIbu` (Pekerjaan Ibu)
29. `penghasilanOrtu` (Rentang Penghasilan Orang Tua)
30. `namaWali` (Nama Wali Santri jika ada)
31. `pekerjaanWali` (Pekerjaan Wali)
32. `teleponOrtu` (Nomor WhatsApp / HP Orang Tua)
33. `statusSiswa` (Aktif / Mutasi / Lulus)
34. `beasiswa` (Status Penerima Bantuan Pendidikan)

### Cara Mengekspor Data Siswa ke Excel:
1. Buka modul **Buku Induk Siswa** atau modul **Pengaturan Sistem**.
2. Klik tombol **`Ekspor Data ke Excel`**.
3. Sistem akan menghasilkan berkas `.xlsx` resmi berisi 34 kolom standar di atas secara otomatis.

### Cara Mengimpor Data Lama dari Excel ke SIDASI:
1. Buka modul **Buku Induk Siswa** atau modul **Pengaturan Sistem**.
2. *(Disarankan)* Klik **`Unduh Template Format Excel`** untuk mendapatkan berkas template 34 kolom yang sudah diformat rapi.
3. Klik tombol **`Impor Data dari Excel`**. Jendela modal dialog impor akan muncul.
4. Klik area berkas atau tarik (*drag-and-drop*) berkas `.xlsx` / `.csv` Anda.
5. Sistem akan membaca berkas dan menampilkan **Tabel Pratinjau 5 Baris Pertama** sebagai sampel validasi.
6. Pilih **Mode Impor**:
   - **Tambahkan ke Data yang Ada (*Append*)**: Menambahkan siswa baru ke daftar buku induk tanpa menghapus siswa yang sudah ada. Rombel baru yang belum terdaftar akan otomatis dibuatkan.
   - **Ganti Seluruh Data Siswa (*Replace*)**: Mengosongkan data siswa saat ini dan menggantikannya secara total dengan data dari berkas Excel baru.
7. Klik tombol hijau **`Impor Sekarang`**. Seluruh data akan masuk dan statistik madrasah otomatis dikalkulasi ulang.

---

## 9. PANDUAN KHUSUS: PENCADANGAN & PEMULIHAN DATABASE (BACKUP & RESTORE)

Menjaga keamanan data madrasah adalah prioritas utama. SIDASI menyediakan 3 cara pencadangan:

### Cara 1: Backup & Restore via Antarmuka Web (UI)
1. Masuk ke modul **Pengaturan Sistem** > bagian **Pencadangan & Pemulihan Basis Data Mandiri**.
2. **Untuk Mencadangkan (Ekspor)**:
   - Klik tombol **`Unduh Cadangan Lengkap (.sql.gz)`**.
   - Berkas arsip snapshot utuh (berisi seluruh siswa, mutasi, beasiswa, rombel, dan profil) akan terunduh ke komputer Anda.
3. **Untuk Memulihkan (Impor)**:
   - Klik tombol **`Pilih Berkas Cadangan (.sql.gz / .json)`**.
   - Pilih berkas arsip yang pernah diunduh. Sistem akan langsung memulihkan seluruh data secara instan.

### Cara 2: Salin Berkas Backend Secara Manual (Sangat Praktis)
Jika Anda menggunakan mode server backend:
- Berkas basis data berada di:
  📁 `backend/data/sidasi_database.json`
- **Untuk Backup**: Cukup salin (*copy*) berkas `sidasi_database.json` ke flashdisk, Google Drive, atau harddisk eksternal Anda.
- **Untuk Restore**: Cukup timpa (*paste*) kembali berkas tersebut ke folder `backend/data/`.

### Cara 3: Unduh Langsung via Browser
Saat server backend berjalan di port 9090, Anda dapat membuka URL:
```text
http://localhost:9090/api/backup
```
Browser akan langsung mengunduh cadangan basis data terbaru.

### Panduan Pengosongan / Hapus Seluruh Basis Data (Dengan Pop-up Validasi Keamanan)

Jika pihak madrasah ingin membersihkan seluruh data operasional kesiswaan untuk memulai periode baru secara segar (*fresh state*), SIDASI menyediakan fitur penghapusan aman dengan sistem validasi konfirmasi ganda:

1. **Lokasi Tombol Hapus Basis Data**:
   - **Melalui Buku Induk Siswa**: Klik tombol merah **`Hapus Database`** di sudut kanan atas bilah filter (bersebelahan dengan tombol Import Excel dan Tambah Siswa).
   - **Melalui Pengaturan Sistem**: Buka menu **Pengaturan Sistem** > Tab **Cadangkan & Pulihkan (Backup)** > Kartu **`Hapus & Kosongkan Seluruh Basis Data`**.
2. **Jendela Pop-up Validasi Konfirmasi**:
   - Saat tombol diklik, sistem akan memunculkan jendela dialog pop-up konfirmasi keamanan.
   - Pop-up merinci data yang akan dikosongkan: buku induk siswa, riwayat mutasi, penerima beasiswa, rombongan belajar, dan data tahunan.
3. **Pilihan Aksi**:
   - **Tombol `Batal`**: Menutup jendela pop-up secara langsung. Seluruh data tetap utuh dan aman tanpa perubahan apa pun.
   - **Tombol `Ya, Hapus Semua Data`**: Menjalankan penghapusan dan pengosongan seluruh data kesiswaan secara permanen (baik di penyimpanan lokal peramban maupun di berkas backend `backend/data/sidasi_database.json`).
4. **Jaminan Keamanan Login**:
   - Akun login Administrator Sistem (**`admin` / `admin`**) **dijamin tetap aman dan aktif**, sehingga Anda tidak akan terkunci dan tetap dapat mengoperasikan sistem setelah pengosongan basis data selesai.

---

## 10. PANDUAN CETAK DOKUMEN PRESISI ISO A4

Seluruh dokumen resmi di SIDASI (Surat Keterangan Mutasi, Sampul Rapor KMA 450, Lembar Buku Induk, dan Rekapitulasi Beasiswa) telah dioptimalkan untuk kertas **ISO A4 (210 x 297 mm)**.

### Tips Pengaturan Dialog Cetak Browser:
Saat jendela cetak (*Print Dialog*) peramban muncul:
1. **Tujuan (*Destination*)**: Pilih printer fisik Anda, atau pilih **Save as PDF** jika ingin menyimpan sebagai dokumen digital.
2. **Ukuran Kertas (*Paper Size*)**: Pilih **A4**.
3. **Tata Letak (*Layout*)**: Pilih **Potret (*Portrait*)**.
4. **Margin**: Pilih **Default** atau **None** (Sistem SIDASI telah mengatur margin presisi sendiri).
5. **Pilihan (*Options*)**:
   - ✅ **Centang**: *Grafik Latar Belakang / Background Graphics* (agar warna badge, tabel kop, dan garis bingkai tercetak sempurna).
   - ❌ **Hapus Centangan**: *Header dan Footer browser* (agar URL website, tanggal browser, dan judul tab tidak mengotori dokumen resmi madrasah).

---

## 11. TANYA JAWAB & PEMECAHAN MASALAH (FAQ & TROUBLESHOOTING)

#### T: Apakah data saya akan hilang jika komputer dimatikan atau browser ditutup?
**J**: **Tidak**. Data Anda aman dan permanen. Pada mode backend, data tersimpan di berkas fisik `backend/data/sidasi_database.json`. Pada mode standalone, data tersimpan di `LocalStorage` peramban.

#### T: Muncul pesan error "Node.js belum terdeteksi" saat membuka Jalankan_Backend.command / .bat?
**J**: Berarti komputer Anda belum terpasang runtime Node.js.
- Solusi 1: Unduh dan pasang Node.js LTS (gratis dan aman) dari situs resminya: [nodejs.org](https://nodejs.org/). Setelah terpasang, klik ganda kembali berkas peluncur.
- Solusi 2: Anda tetap dapat langsung menggunakan aplikasi tanpa backend dengan membuka berkas `index.html`.

#### T: Mengapa peluncur backend menggunakan Port 9090?
**J**: Port 9090 dipilih karena merupakan port standar yang bebas dari konflik sistem bawaan Apple macOS (seperti AirPlay Receiver pada port 5000) dan aplikasi web lain. Jika Port 9090 sedang terpakai oleh aplikasi lain, SIDASI secara otomatis beralih ke port berikutnya (9091, 9092, dst.) berkat fitur *Auto-Port Fallback*.

#### T: Bagaimana cara memindahkan seluruh aplikasi dan datanya ke komputer/laptop lain?
**J**: Sangat mudah! Karena SIDASI bebas dari server database terpisah, cukup **salin seluruh folder `WEB MTS AL-FADLLIYAH`** ke flashdisk, lalu buka di laptop tujuan. Seluruh data di dalam `backend/data/sidasi_database.json` akan otomatis terbawa secara utuh!

---

**Hak Cipta © 2026 Madrasah Tsanawiyah Al-Fadlliyah Singaparna**  
*Dikembangkan oleh: **Ravi SQ. Moh. Zein Permana***
