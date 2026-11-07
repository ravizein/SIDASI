# PRODUCT REQUIREMENT DOCUMENT (PRD) & PROJECT BRIEF
## SIM SISWA MTs AL-FADLLIYAH
**Sistem Informasi Manajemen Data Kesiswaan Terpadu Madrasah Tsanawiyah**

---

### 1. RINGKASAN EKSEKUTIF (PROJECT BRIEF)

* **Nama Produk**: SIM Siswa MTs AL-FADLLIYAH
* **Institusi**: Madrasah Tsanawiyah (MTs) Al-Fadlliyah
* **Platform**: Web Desktop Application (Responsive Dashboard)
* **Status Proyek**: High-Fidelity UI Design & Interactivity Specification Completed
* **Tema Visual**: Academic Emerald & Pure White (Hijau Zamrud `#16a34a` / `#059669` & Putih Bersih) dengan tipografi *Plus Jakarta Sans*.

#### 1.1 Latar Belakang & Masalah
MTs AL-FADLLIYAH mengelola lebih dari 1.200 siswa aktif yang terbagi dalam 3 jenjang (Fase D: Kelas VII, VIII, dan IX) serta 36 rombongan belajar. Pengelolaan data sebelumnya kerap menghadapi tantangan:
1. Terfragmentasinya data induk kependudukan siswa (NIK, NISN, status mukim di asrama pondok vs non-mukim).
2. Administrasi mutasi (siswa masuk dan keluar) yang lambat dalam penerbitan Surat Keterangan resmi.
3. Penyaluran program bantuan/beasiswa (KSM/Akademik, BAZNAS Dhuafa, PIP) yang membutuhkan rekapitulasi transparan.
4. Kebutuhan penyesuaian format lembar sampul dan identitas rapor Kurikulum Merdeka sesuai Standar KMA No. 450 Tahun 2024 yang siap cetak (A4).

#### 1.2 Tujuan Produk
1. Menyediakan repositori terpusat dan digital untuk Buku Induk Siswa.
2. Mempercepat otomasi penerbitan dokumen administrasi resmi madrasah (SK Mutasi dan Sampul Rapor KMA 450/2024).
3. Memberikan visibilitas langsung (*real-time dashboard*) mengenai demografi, gender rasio, rombel unggulan, dan status beasiswa.
4. Menjaga kemandirian data madrasah (*standalone local database*) dengan mekanisme pencadangan mandiri (*backup & restore*).

---

### 2. PENGGUNA TARGET & PERAN (USER PERSONAS)

| Peran (Role) | Tanggung Jawab Utama | Kebutuhan Antarmuka |
| :--- | :--- | :--- |
| **Kepala Madrasah** | Pengesahan kebijakan, pemantauan statistik makro, dan penandatanganan rapor/SK mutasi. | Pratinjau dokumen resmi berlegalitas, ringkasan grafik sebaran rombel, dan rekap beasiswa. |
| **Kepala Tata Usaha (TU)** | Verifikasi administratif, pengelolaan akun staf, dan penerbitan berkas resmi. | Ekspor data (Excel), penerbitan SK mutasi, pengaturan kalender akademik & sistem. |
| **Operator Siswa & Buku Induk** | Entri dan pembaruan data biodata siswa, validasi NIK/NISN, unggah berkas fisik. | Formulir input cepat (+ Tambah Siswa), filter komprehensif, checklist berkas fisik. |
| **Guru BK / Koordinator Beasiswa**| Seleksi dan pemantauan penyaluran beasiswa berprestasi dan afirmasi sosial. | Formulir penambahan penerima, tabel status pencairan, rekapitulasi berkas SKTM/rekomendasi. |

---

### 3. ARSITEKTUR INFORMASI & STRUKTUR MODUL

```
[ SIM SISWA MTs AL-FADLLIYAH ]
│
├── 0. Otentikasi & Navigasi Global
│   ├── Login Sederhana (Username / NPK / NIP / NISN & Password)
│   ├── Header Global (Filter Dropdown TA & Semester, Profil Staf)
│   └── Sidebar Persisten (Navigasi Modul 1-6 & Status Server)
│
├── 1. Data Umum (Dashboard Utama)
│   ├── Banner Sambutan & Aksi Cepat "Kelola Buku Induk"
│   ├── Kartu Statistik Utama (Siswa Aktif, Rasio Gender, Mutasi, Beasiswa)
│   ├── Grafik Progress Sebaran Jenjang (Kelas VII, VIII, IX)
│   └── Tabel Rombongan Belajar Unggulan & Status Akreditasi BAN-S/M
│
├── 2. Buku Induk Siswa Digital
│   ├── Panel Metrik Status Data (Siswa Mukim, Validasi, Berkas Kurang)
│   ├── Toolbar Pencarian & Multi-Filter (Tingkat, Rombel, Status, Domisili)
│   ├── Tombol Aksi Kunci: [+ Tambah Siswa Baru] & [Export Excel]
│   ├── Tabel Data Siswa Terpadu dengan Multi-Seleksi
│   └── Panel Samping (Drawer): Ringkasan Lembar Buku Induk Terpilih & Checklist Berkas
│
├── 3. Manajemen Mutasi Siswa
│   ├── Metrik Mutasi Semester Berjalan (Masuk, Keluar, Sisa Kuota Rombel)
│   ├── Tab Kategori: Semua Mutasi, Mutasi Masuk, Mutasi Keluar
│   ├── Tombol Aksi Kunci: [+ Ajukan Mutasi Baru]
│   ├── Tabel Riwayat Mutasi & Aksi Review Dokumen
│   └── Pratinjau Langsung (Live Preview) Surat Keterangan Pindah/Mutasi Resmi
│
├── 4. Program Beasiswa & Bantuan Pendidikan
│   ├── Metrik 3 Pilar: Prestasi KSM/Akademik, Afirmasi Dhuafa BAZNAS, Program Indonesia Pintar (PIP)
│   ├── Distribusi Realisasi Finansial & Progress Serapan Dana
│   ├── Tombol Aksi Kunci: [+ Tambah Penerima Baru] & [Cetak Rekap Beasiswa]
│   ├── Notifikasi Penyaluran & Rekomendasi Tindak Lanjut
│   └── Tabel Data Penerima Bantuan, Status Pencairan, dan Rincian Evaluasi
│
├── 5. Identitas Rapor & Format Dokumen (Standar KMA 450/2024)
│   ├── Formulir Pengaturan Nomenklatur Madrasah (NSM, NPSN, Alamat)
│   ├── Pengaturan Pejabat Penandatangan (Kepala Madrasah, NIP, Kepala TU, Wali Kelas)
│   ├── Titimangsa & Kalender Rapor (Tempat, Tanggal Terbit, Semester)
│   ├── Preferensi Tata Letak Dokumen (Tipografi, Watermark Lambang, Margin Standar)
│   ├── Aksi Dokumen: [Simpan Konfigurasi], [Reset Formulir], [Cetak Massal Sampul], [Pratinjau Layar A4]
│   └── Pratinjau Interaktif Dokumen A4 Lembar Sampul Rapor Siswa
│
└── 6. Pengaturan & Konfigurasi Sistem
    ├── Sub-Tab 1: Profil Lembaga (NPSN, NSM, Status Akreditasi, Kop & Stempel Resmi)
    ├── Sub-Tab 2: Tahun Akademik & Kalender (Batas Cut-off Nilai, Periode Aktif)
    ├── Sub-Tab 3: Pengguna & Hak Akses (Manajemen Akun Terdaftar & Tambah User)
    └── Sub-Tab 4: Cadangkan & Pulihkan (Backup Snapshot .sql.gz & Restore Arsip)
```

---

### 4. SPESIFIKASI FITUR & REQUIREMENT RINCI

#### 4.1 Global Header & Sidebar
* **G-01 Dropdown Tahun Ajaran & Semester**: Header menyediakan dropdown interaktif untuk memilih periode akademik aktif (misal: `TA 2024/2025 Ganjil`, `TA 2024/2025 Genap`).
* **G-02 Profil Staf**: Menampilkan nama akun aktif (misal: *Hj. Siti Rahmawati, S.Pd - Kepala Tata Usaha*) dan avatar resmi.
* **G-03 Desain Header Bersih**: Ikon lonceng notifikasi dinonaktifkan demi kebersihan tampilan antarmuka.
* **G-04 Sidebar Persisten**: Navigasi ke modul 1-6 dengan penanda modul aktif, indikator status koneksi basis data lokal, serta tombol simulasi login/keluar.

#### 4.2 Modul 1: Data Umum
* **DU-01 Banner Sambutan**: Sambutan resmi SIM Siswa MTs AL-FADLLIYAH dengan tombol langsung *Kelola Buku Induk* (bebas dari tombol sinkronisasi eksternal).
* **DU-02 Kartu Ringkasan Kunci**:
  - Total Siswa Aktif (1.248 siswa - 100% validitas NIK/NISN).
  - Siswa Laki-laki (612 siswa - 49.03%) & Siswa Perempuan (636 siswa - 50.97%).
  - Mutasi Bulan Berjalan (8 siswa: 6 Masuk, 2 Keluar).
  - Penerima Beasiswa Terdaftar (142 siswa).
* **DU-03 Sebaran Jenjang Rombel**: Visualisasi keterisian kapasitas rombel Kelas VII (100%), Kelas VIII (98.5%), dan Kelas IX (98.5%) dengan rasio gender per tingkatan.
* **DU-04 Rombel Unggulan**: Daftar sampel rombel terakreditasi (*VII-A Unggulan, VII-B Reguler, VIII-A Kitab Kuning, IX-A Sains & Robotik*) beserta wali kelas dan fokus capaian.

#### 4.3 Modul 2: Buku Induk Siswa Digital
* **BI-01 Tombol Aksi "+ Tambah Siswa"**: Membuka modal formulir lengkap untuk input data siswa baru (NISN, NIS, NIK, Nama Lengkap, Jenis Kelamin, Tingkat/Rombel, Wali Siswa, dan Status Mukim/Non-Mukim).
* **BI-02 Tombol Aksi "Export Excel"**: Menghasilkan unduhan berkas spreadsheet `.xlsx` dari filter data yang aktif.
* **BI-03 Filter Multi-Parameter**: Filter pencarian real-time berdasarkan Nama/NISN, Tingkat Kelas, Rombongan Belajar, Status Keaktifan, dan Domisili (Mukim Pondok vs Non-Mukim).
* **BI-04 Panel Ringkasan Siswa**: Menampilkan detail lengkap siswa yang dipilih, status kelengkapan berkas fisik (Akta Kelahiran, KK, Ijazah Asli, Surat Perjanjian Santri/Siswa), serta tautan *Histori Mutasi* dan *Cetak Lembar Induk*.

#### 4.4 Modul 3: Manajemen Mutasi Siswa
* **MS-01 Tombol "+ Ajukan Mutasi Baru"**: Formulir permohonan kepindahan siswa (Jenis: Mutasi Masuk dari sekolah asal atau Mutasi Keluar ke madrasah/sekolah tujuan).
* **MS-02 Alur Review & Cetak SK**: Setiap baris tabel dilengkapi tombol aksi peninjauan yang memuat pratinjau dokumen resmi.
* **MS-03 Pratinjau Dokumen Surat Keterangan Pindah**:
  - Format standar Kementerian Agama & Madrasah Tsanawiyah Al-Fadlliyah.
  - Memuat nomor registrasi resmi (contoh: `MTs.11/PP.00.5/082/VII/2024`).
  - Memuat data pemohon, alasan kepindahan, legalitas stempel validasi, tanda tangan Kepala Tata Usaha, dan tanda tangan Kepala Madrasah (Drs. H. Ahmad Fadlli, M.Pd.I).

#### 4.5 Modul 4: Program Beasiswa & Bantuan Pendidikan
* **BS-01 3 Pilar Bantuan**:
  1. *Prestasi KSM & Akademik*: Bantuan pembebasan iuran/SPP & pembinaan lomba.
  2. *Afirmasi Dhuafa (Kerjasama BAZNAS)*: Bantuan paket seragam, perlengkapan kitab, dan operasional.
  3. *Program Indonesia Pintar (PIP)*: Penyaluran tunai APBN Kemenag/Kemendikbudristek.
  *(Catatan: Kategori Tahfidz telah dihapus sesuai arahan pengelola).*
* **BS-02 Aksi "+ Tambah Penerima Baru"**: Modal input penerima bantuan baru beserta nominal per semester dan berkas pendukung.
* **BS-03 Aksi "Cetak Rekap Beasiswa"**: Fungsi pencetakan rekapitulasi serapan dana beasiswa semester berjalan untuk laporan pertanggungjawaban.
* **BS-04 Tabel Status & Rincian**: Tabel pemantauan status pencairan (*Tersalurkan* vs *Proses Verifikasi*) dengan rincian evaluasi prestasi.

#### 4.6 Modul 5: Identitas Rapor & Format Dokumen (KMA 450/2024)
* **IR-01 Konfigurasi Nomenklatur Lembaga**: NSM (`121232040018`), NPSN (`69948210`), Nama Madrasah, Alamat Cikunten Singaparna Tasikmalaya.
* **IR-02 Legitimasi Pejabat**: Pengaturan Kepala Madrasah (Drs. H. Ahmad Fadlli, M.Pd.I / NIP `196908151994031002`) dan Kepala TU (Hj. Siti Rahmawati, S.Pd).
* **IR-03 Titimangsa & Kalender Rapor**: Penetapan tempat titimangsa (Tasikmalaya) dan tanggal terbit rapor (misal: 21 Desember 2024).
* **IR-04 Pengaturan Format Cetak**: Pilihan tipografi, toggle watermark lambang madrasah pudar 5%, toggle garis margin standar jilid (2.0 cm).
* **IR-05 Pratinjau Kertas A4 Standar**: Menampilkan lembar dokumen sampul depan rapor peserta didik Kurikulum Merdeka yang presisi dengan rasio cetak A4.
* **IR-06 Fungsionalitas Tombol**:
  - *Reset Formulir*: Mengembalikan pengaturan ke data default KMA.
  - *Simpan Konfigurasi*: Menyimpan perubahan data titimangsa/pejabat.
  - *Pratinjau Layar A4*: Membuka pratinjau dokumen satu layar penuh.
  - *Cetak Massal Sampul Rapor*: Menjalankan dialog cetak batch per tingkatan atau seluruh siswa.

#### 4.7 Modul 6: Pengaturan & Konfigurasi Sistem
* **PG-01 Profil Lembaga**: Informasi legalitas izin operasional madrasah, status Akreditasi A (Unggul) BAN-S/M, serta unggah berkas logo dan stempel resmi.
* **PG-02 Tahun Akademik & Kalender**: Pengaturan semester aktif, tanggal cut-off penguncian nilai, dan kalender agenda madrasah.
* **PG-03 Pengguna & Hak Akses**: Manajemen daftar operator/staf SIM Siswa terdaftar beserta penetapan tingkat wewenang.
* **PG-04 Cadangkan & Pulihkan (Backup & Restore)**:
  - Pembuatan arsip data lengkap secara mandiri format `.sql.gz`.
  - Pemulihan sistem dari riwayat cadangan arsip tersimpan.
  *(Bebas dari modul API pihak ketiga / eksternal).*

#### 4.8 Modul 0: Otentikasi (Login Sederhana)
* **LG-01 Antarmuka Minimalis & Cepat**: Formulir login terpusat dengan input *Username / NPK / NIP / NISN* dan *Password*.
* **LG-02 Keamanan & Bantuan**: Opsi *Ingat Saya*, tautan bantuan reset kata sandi, serta informasi kontak Administrator Madrasah Tsanawiyah Al-Fadlliyah.

---

### 5. SISTEM DESAIN & PANDUAN ANTARMUKA (DESIGN SYSTEM)

* **Design System Reference**: `{{DATA:DESIGN_SYSTEM:DESIGN_SYSTEM_1}}` (Academic Emerald Portal)
* **Tipografi**: `Plus Jakarta Sans` (Sans-Serif modern berkarakter ramah, jelas, dan keterbacaan tinggi pada tabel data padat).
* **Palet Warna Utama**:
  - Primary / Brand Emerald: `#16a34a` (Tailwind green-600) & `#059669` (emerald-600)
  - Surface Background: `#faf8ff` / `#f8fafc`
  - Container / Card Background: `#ffffff`
  - Neutral Text & Heading: `#0f172a` (slate-900) & `#334155` (slate-700)
  - Border Subtil: `#e2e8f0` (slate-200) / `#e5e7eb`
  - Badges Status:
    - Sukses / Aktif: Hijau Lembut (`#dcfce7`, text `#15803d`)
    - Menunggu / Verifikasi: Biru/Kuning Lembut (`#dbeafe`, text `#1d4ed8` / `#fef9c3`, text `#a16207`)
    - Perhatian: Merah Lembut (`#fee2e2`, text `#b91c1c`)
* **Layout Geometry**: Border radius terstandarisasi (`rounded-xl` / `rounded-2xl` 12px-16px), drop shadow lembut (`shadow-sm` hingga `shadow-md`), serta tata letak 2 kolom adaptif (60:40 atau 70:30) untuk tampilan master-detail.

---

### 6. PETA ARTEFAK DESAIN & STATUS KANVAS

| Modul Layar | Tautan Layar Canvas | Deskripsi Tampilan |
| :--- | :--- | :--- |
| **Data Umum** | `{{DATA:SCREEN:SCREEN_12}}` | Dashboard eksekutif metrik kesiswaan, rombel unggulan, dan rasio gender. |
| **Buku Induk Siswa** | `{{DATA:SCREEN:SCREEN_8}}` | Repositori digital data siswa, filter multi-kriteria, tombol tambah & ekspor Excel. |
| **Mutasi Siswa** | `{{DATA:SCREEN:SCREEN_10}}` | Administrasi perpindahan siswa masuk/keluar & live preview SK Mutasi resmi. |
| **Program Beasiswa** | `{{DATA:SCREEN:SCREEN_6}}` | Pemantauan 3 pilar beasiswa, tombol tambah penerima, dan cetak rekapitulasi. |
| **Identitas Rapor** | `{{DATA:SCREEN:SCREEN_2}}` | Parameter dokumen resmi madrasah & pratinjau lembar sampul A4 KMA 450/2024. |
| **Pengaturan Sistem** | `{{DATA:SCREEN:SCREEN_4}}` | Konfigurasi profil madrasah, tahun akademik, hak akses, dan backup/restore. |
| **Prototype Interaktif**| `{{DATA:SCREEN:SCREEN_14}}` | Prototype navigasi terhubung utuh untuk simulasi operasional lengkap. |
| **Form Login** | `{{DATA:SCREEN:SCREEN_24}}` | Layar masuk sederhana berbasis kredensial mandiri staf/siswa. |

---

### 7. BATASAN & KETENTUAN KHUSUS (NON-FUNCTIONAL & CONSTRAINTS)
1. **Peniadaan API EMIS**: Seluruh alur data beroperasi secara mandiri (*standalone*) berbasis basis data lokal madrasah tanpa ketergantungan koneksi real-time API EMIS Kemenag.
2. **Standardisasi Istilah**: Istilah "santri" dibakukan menjadi **"siswa"** pada antarmuka umum, dengan opsi status tempat tinggal berupa **"Mukim (Pondok)"** dan **"Non-Mukim"**.
3. **Kepatuhan Cetak Fisik**: Komponen pratinjau dokumen (SK Mutasi dan Sampul Rapor) dirancang presisi terhadap standar kertas ISO A4 (210 x 297 mm) untuk hasil cetak tajam tanpa pemotongan margin.
4. **Data Protection**: Kredensial, NIK, dan data keluarga dilindungi dengan hak akses berbasis peran (*Role-Based Access Control*).