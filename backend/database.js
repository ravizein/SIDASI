/**
 * SIDASI MTs AL-FADLLIYAH - DATABASE ADAPTER
 * Mesin Penyimpanan Berkas Mandiri Berkecepatan Tinggi (JSON / Local File DB)
 * Bebas instalasi server MySQL & kompatibel penuh dengan Node.js.
 * Copyright © 2026 by Ravi SQ. Moh. Zein Permana
 */

const fs = require('fs');
const path = require('path');

// Lokasi berkas data lokal
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'sidasi_database.json');

// Muat data awal default dari js/data.js
let DEFAULT_DATA = null;
let initDefaultYearlyData = null;
try {
  const masterData = require('../js/data.js');
  DEFAULT_DATA = masterData.DEFAULT_DATA;
  initDefaultYearlyData = masterData.initDefaultYearlyData;
} catch (err) {
  console.warn('Peringatan: Gagal memuat js/data.js, menggunakan fallback data internal.');
}

/**
 * Inisialisasi Database
 */
function initDatabase() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    console.log('📦 Membuat basis data baru: sidasi_database.json...');
    const seed = DEFAULT_DATA ? JSON.parse(JSON.stringify(DEFAULT_DATA)) : {};
    seed.activeAcademicYearId = seed.activeAcademicYearId || '2024-2025-1';
    if (initDefaultYearlyData && typeof initDefaultYearlyData === 'function') {
      seed.yearlyData = initDefaultYearlyData(seed);
    }
    saveDatabase(seed);
    console.log('✅ Basis data awal MTs Al-Fadlliyah berhasil diinisialisasi.');
  }
}

/**
 * Membaca data lengkap dari berkas database
 */
function readDatabase() {
  try {
    initDatabase();
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('❌ Gagal membaca database:', err);
    return DEFAULT_DATA ? JSON.parse(JSON.stringify(DEFAULT_DATA)) : {};
  }
}

/**
 * Menyimpan data lengkap ke berkas database secara aman (atomic write)
 */
function saveDatabase(data) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
    return true;
  } catch (err) {
    console.error('❌ Gagal menulis database:', err);
    return false;
  }
}

/**
 * Rekalkulasi statistik kesiswaan otomatis
 */
function recalculateStats(db) {
  if (!db.stats) db.stats = {};
  const allStudents = db.students || [];
  const activeStudents = allStudents.filter(s => s.statusSiswa === 'Aktif');

  const total = activeStudents.length;
  const laki = activeStudents.filter(s => s.jk === 'L').length;
  const perempuan = activeStudents.filter(s => s.jk === 'P').length;
  const mukim = activeStudents.filter(s => s.domisili && s.domisili.includes('Mukim')).length;
  const nonMukim = total - mukim;

  const berkasKurang = activeStudents.filter(s => !s.berkas || !s.berkas.aktaKelahiran || !s.berkas.kartuKeluarga || !s.berkas.ijazahSD || !s.berkas.suratPerjanjian).length;
  const validNikNisnCount = activeStudents.filter(s => {
    const nikOk = s.nik && String(s.nik).trim().length === 16;
    const nisnOk = s.nisn && String(s.nisn).trim().length === 10;
    return nikOk && nisnOk;
  }).length;
  const persenValidasi = total > 0 ? Math.round((validNikNisnCount / total) * 100) : 0;
  const penerimaBeasiswa = Math.max(
    activeStudents.filter(s => s.beasiswa && s.beasiswa !== '-' && s.beasiswa !== 'Tidak Ada').length,
    (db.beasiswaList || []).length
  );
  const allMutations = db.mutations || [];
  const mutasiMasuk = allMutations.filter(m => m.jenis && m.jenis.includes('Masuk')).length;
  const mutasiKeluar = allMutations.filter(m => m.jenis && m.jenis.includes('Keluar')).length;
  const mutasiBulanIni = allMutations.length;

  db.stats.totalSiswa = total;
  db.stats.siswaLaki = laki;
  db.stats.siswaPerempuan = perempuan;
  db.stats.siswaMukim = mukim;
  db.stats.siswaNonMukim = nonMukim;
  db.stats.berkasKurang = berkasKurang;
  db.stats.persenValidasi = persenValidasi;
  db.stats.penerimaBeasiswa = penerimaBeasiswa;
  db.stats.mutasiMasuk = mutasiMasuk;
  db.stats.mutasiKeluar = mutasiKeluar;
  db.stats.mutasiBulanIni = mutasiBulanIni;

  // Sinkronkan ke yearlyData
  if (db.yearlyData && db.activeAcademicYearId) {
    if (!db.yearlyData[db.activeAcademicYearId]) {
      db.yearlyData[db.activeAcademicYearId] = {};
    }
    db.yearlyData[db.activeAcademicYearId].students = JSON.parse(JSON.stringify(db.students));
    db.yearlyData[db.activeAcademicYearId].stats = JSON.parse(JSON.stringify(db.stats));
    if (db.rombelList) {
      db.yearlyData[db.activeAcademicYearId].rombelList = JSON.parse(JSON.stringify(db.rombelList));
    }
  }
}

// Inisialisasi awal saat dimuat
initDatabase();

module.exports = {
  // Global Data
  getAllData: () => readDatabase(),
  saveAllData: (data) => saveDatabase(data),

  // Autentikasi Pengguna
  authenticate: (username, password) => {
    const db = readDatabase();
    const user = (db.users || []).find(u => u.username.toLowerCase() === String(username).toLowerCase().trim());
    if (!user) return { success: false, message: 'Username tidak ditemukan!' };
    if (user.status !== 'Aktif') return { success: false, message: 'Akun berstatus Non-Aktif. Hubungi Administrator.' };

    const validPass = user.password || 'admin';
    if (password !== validPass) {
      return { success: false, message: 'Kata sandi salah! Silakan coba lagi.' };
    }

    const { password: _, ...userSafe } = user;
    return { success: true, user: userSafe };
  },

  // Siswa (Buku Induk)
  getStudents: (filter = {}) => {
    const db = readDatabase();
    let list = db.students || [];

    if (filter.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(s => 
        (s.nama && s.nama.toLowerCase().includes(q)) ||
        (s.nisn && s.nisn.includes(q)) ||
        (s.nis && s.nis.includes(q)) ||
        (s.nik && s.nik.includes(q))
      );
    }
    if (filter.tingkat && filter.tingkat !== 'ALL') {
      list = list.filter(s => s.tingkat === filter.tingkat);
    }
    if (filter.rombel && filter.rombel !== 'ALL') {
      list = list.filter(s => s.rombel === filter.rombel);
    }
    if (filter.domisili && filter.domisili !== 'ALL') {
      list = list.filter(s => s.domisili === filter.domisili);
    }
    if (filter.status && filter.status !== 'ALL') {
      list = list.filter(s => s.statusSiswa === filter.status);
    }

    return list;
  },

  getStudentById: (id) => {
    const db = readDatabase();
    return (db.students || []).find(s => s.id === id) || null;
  },

  createStudent: (studentData) => {
    const db = readDatabase();
    if (!db.students) db.students = [];

    const newId = studentData.id || `SIS-${Date.now().toString().slice(-4)}-${String(db.students.length + 1).padStart(3, '0')}`;
    const newStudent = { ...studentData, id: newId };

    db.students.unshift(newStudent);
    recalculateStats(db);
    saveDatabase(db);
    return newStudent;
  },

  updateStudent: (id, updateData) => {
    const db = readDatabase();
    const idx = (db.students || []).findIndex(s => s.id === id);
    if (idx === -1) return null;

    db.students[idx] = { ...db.students[idx], ...updateData, id };
    recalculateStats(db);
    saveDatabase(db);
    return db.students[idx];
  },

  deleteStudent: (id) => {
    const db = readDatabase();
    const idx = (db.students || []).findIndex(s => s.id === id);
    if (idx === -1) return false;

    db.students.splice(idx, 1);
    recalculateStats(db);
    saveDatabase(db);
    return true;
  },

  importStudents: (studentsList, mode = 'append') => {
    const db = readDatabase();
    if (!db.students) db.students = [];

    // Pastikan setiap siswa memiliki ID yang valid
    studentsList.forEach((s, idx) => {
      if (!s.id) {
        s.id = `SIS-IMP-${Date.now().toString().slice(-4)}-${String(idx + 1).padStart(3, '0')}`;
      }
    });

    if (mode === 'replace') {
      db.students = [...studentsList];
    } else {
      // Append mode: hindari duplikasi ID jika ada
      const existingIds = new Set(db.students.map(s => s.id));
      const newItems = studentsList.filter(s => !existingIds.has(s.id));
      db.students = [...newItems, ...db.students];
    }

    // Auto daftar rombel baru jika ada
    if (!db.rombelList) db.rombelList = [];
    studentsList.forEach(s => {
      if (s.rombel && !db.rombelList.some(r => r.kode === s.rombel || r.nama === s.rombel)) {
        db.rombelList.push({
          id: `RMB-AUTO-${Date.now().toString().slice(-4)}-${db.rombelList.length + 1}`,
          tingkat: s.tingkat || 'VII',
          kode: s.rombel,
          nama: s.rombel,
          wali: 'Wali Kelas Terpilih',
          kapasitas: 36,
          terisi: 1,
          fokus: 'Reguler'
        });
      }
    });

    recalculateStats(db);
    saveDatabase(db);
    return {
      count: studentsList.length,
      total: db.students.length,
      students: db.students,
      stats: db.stats,
      rombelList: db.rombelList
    };
  },

  exportStudents: () => {
    const db = readDatabase();
    const list = db.students || [];
    return list.map((s, idx) => ({
      "NO": idx + 1,
      "NISN": s.nisn || "-",
      "NIS": s.nis || "-",
      "NIK SISWA": s.nik || "-",
      "NAMA SISWA": s.nama || "-",
      "TEMPAT LAHIR": s.tempatLahir || "-",
      "TANGGAL LAHIR": s.tanggalLahir || "-",
      "JK": s.jk || "L",
      "KELAS": s.rombel || "-",
      "TINGKAT KELAS": s.tingkat || "-",
      "AGAMA": s.agama || "Islam",
      "JML SAUDARA": s.jmlSaudara !== undefined && s.jmlSaudara !== "" ? s.jmlSaudara : 0,
      "NIK IBU": s.nikIbu || "-",
      "NAMA AYAH": s.namaAyah || "-",
      "NIK AYAH": s.nikAyah || "-",
      "PEKERJAAN AYAH": s.pekerjaanAyah || s.pekerjaanOrtu || "-",
      "PENDIDIKAN AYAH": s.pendidikanAyah || "-",
      "PENGHASILAN AYAH": s.penghasilanAyah || "-",
      "NAMA IBU": s.namaIbu || "-",
      "PEKERJAAN IBU": s.pekerjaanIbu || "-",
      "PENGHASILAN IBU": s.penghasilanIbu || "-",
      "ALAMAT": s.alamat || "-",
      "RT/RW": s.rtRw || "-",
      "KELURAHAN": s.kelurahan || "-",
      "KECAMATAN": s.kecamatan || "-",
      "KABUPATEN": s.kabupaten || "-",
      "NAMA SEKOLAH ASAL": s.sekolahAsal || "-",
      "NPSN": s.npsnAsal || "-",
      "KELOMPOK": s.kelompok || "Reguler",
      "KEBUTUHAN": s.kebutuhan || "Tidak Ada",
      "NO. PESERTA UJIAN": s.noUjian || "-",
      "NO. IJAZAH": s.noIjazah || "-",
      "KETERANGAN": s.keterangan || s.catatanBK || "-",
      "TANGGAL MASUK MADRASAH": s.tanggalMasuk || "-"
    }));
  },

  // Mutasi Siswa
  getMutations: () => {
    const db = readDatabase();
    return db.mutations || [];
  },

  createMutation: (mutationData) => {
    const db = readDatabase();
    if (!db.mutations) db.mutations = [];

    const newMutation = {
      id: `MUT-${Date.now().toString().slice(-4)}`,
      tanggal: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }),
      ...mutationData
    };

    db.mutations.unshift(newMutation);

    // Update status siswa jika mutasi keluar
    if (newMutation.jenis === 'Mutasi Keluar' && newMutation.namaSiswa) {
      const student = (db.students || []).find(s => s.nama.toLowerCase() === newMutation.namaSiswa.toLowerCase() || s.nisn === newMutation.nisn);
      if (student) {
        student.statusSiswa = 'Mutasi Keluar';
      }
    }

    recalculateStats(db);
    saveDatabase(db);
    return newMutation;
  },

  deleteMutation: (id) => {
    const db = readDatabase();
    const idx = (db.mutations || []).findIndex(m => m.id === id);
    if (idx === -1) return false;

    db.mutations.splice(idx, 1);
    recalculateStats(db);
    saveDatabase(db);
    return true;
  },

  // Beasiswa
  getBeasiswaList: () => {
    const db = readDatabase();
    return db.beasiswaList || [];
  },

  createBeasiswa: (beasiswaData) => {
    const db = readDatabase();
    if (!db.beasiswaList) db.beasiswaList = [];

    const newBeasiswa = {
      id: `BSW-${Date.now().toString().slice(-4)}`,
      ...beasiswaData
    };

    db.beasiswaList.unshift(newBeasiswa);
    recalculateStats(db);
    saveDatabase(db);
    return newBeasiswa;
  },

  updateBeasiswa: (id, beasiswaData) => {
    const db = readDatabase();
    if (!db.beasiswaList) db.beasiswaList = [];
    const idx = db.beasiswaList.findIndex(b => b.id === id);
    if (idx === -1) return null;

    db.beasiswaList[idx] = { ...db.beasiswaList[idx], ...beasiswaData, id };
    recalculateStats(db);
    saveDatabase(db);
    return db.beasiswaList[idx];
  },

  deleteBeasiswa: (id) => {
    const db = readDatabase();
    const idx = (db.beasiswaList || []).findIndex(b => b.id === id);
    if (idx === -1) return false;

    db.beasiswaList.splice(idx, 1);
    recalculateStats(db);
    saveDatabase(db);
    return true;
  },

  // Program / Pilar Beasiswa (Custom & Default)
  getBeasiswaPillars: () => {
    const db = readDatabase();
    return db.beasiswaPillars || [];
  },

  createBeasiswaPillar: (pillarData) => {
    const db = readDatabase();
    if (!db.beasiswaPillars) db.beasiswaPillars = [];

    const newPillar = {
      id: pillarData.id || `PILAR-${Date.now().toString().slice(-4)}`,
      title: pillarData.title || "Program Beasiswa",
      badgeColor: pillarData.badgeColor || "emerald",
      icon: pillarData.icon || "award",
      penerima: 0,
      totalAlokasi: Number(pillarData.totalAlokasi) || 0,
      realisasi: 0,
      persenSerapan: 0,
      deskripsi: pillarData.deskripsi || ""
    };

    db.beasiswaPillars.push(newPillar);
    saveDatabase(db);
    return newPillar;
  },

  updateBeasiswaPillar: (id, pillarData) => {
    const db = readDatabase();
    if (!db.beasiswaPillars) db.beasiswaPillars = [];
    const idx = db.beasiswaPillars.findIndex(p => p.id === id);
    if (idx === -1) return null;

    const oldTitle = db.beasiswaPillars[idx].title;
    db.beasiswaPillars[idx] = {
      ...db.beasiswaPillars[idx],
      ...pillarData,
      id
    };

    // Sinkronkan nama kategori di data siswa penerima jika nama pilar berubah
    if (pillarData.title && oldTitle !== pillarData.title && db.beasiswaList) {
      db.beasiswaList.forEach(b => {
        if (b.kategori === oldTitle) {
          b.kategori = pillarData.title;
        }
      });
    }

    saveDatabase(db);
    return db.beasiswaPillars[idx];
  },

  deleteBeasiswaPillar: (id) => {
    const db = readDatabase();
    if (!db.beasiswaPillars) return false;
    const idx = db.beasiswaPillars.findIndex(p => p.id === id);
    if (idx === -1) return false;

    db.beasiswaPillars.splice(idx, 1);
    saveDatabase(db);
    return true;
  },

  // Rombel & Tingkat
  getRombelList: () => {
    const db = readDatabase();
    return db.rombelList || [];
  },

  createRombel: (rombelData) => {
    const db = readDatabase();
    if (!db.rombelList) db.rombelList = [];
    const newRombel = {
      id: `RMB-${Date.now().toString().slice(-4)}`,
      ...rombelData
    };
    db.rombelList.push(newRombel);
    saveDatabase(db);
    return newRombel;
  },

  updateRombel: (id, updateData) => {
    const db = readDatabase();
    const idx = (db.rombelList || []).findIndex(r => r.id === id);
    if (idx === -1) return null;
    db.rombelList[idx] = { ...db.rombelList[idx], ...updateData, id };
    saveDatabase(db);
    return db.rombelList[idx];
  },

  deleteRombel: (id) => {
    const db = readDatabase();
    const idx = (db.rombelList || []).findIndex(r => r.id === id);
    if (idx === -1) return false;
    db.rombelList.splice(idx, 1);
    saveDatabase(db);
    return true;
  },

  // Kalender / Tahun Pelajaran
  getAcademicYears: () => {
    const db = readDatabase();
    return {
      activeAcademicYearId: db.activeAcademicYearId,
      academicYears: db.academicYears || []
    };
  },

  createAcademicYear: (ayData) => {
    const db = readDatabase();
    if (!db.academicYears) db.academicYears = [];
    const newAY = { ...ayData };
    db.academicYears.push(newAY);
    saveDatabase(db);
    return newAY;
  },

  updateAcademicYear: (id, updateData) => {
    const db = readDatabase();
    const idx = (db.academicYears || []).findIndex(a => a.id === id);
    if (idx === -1) return null;
    db.academicYears[idx] = { ...db.academicYears[idx], ...updateData, id };
    saveDatabase(db);
    return db.academicYears[idx];
  },

  deleteAcademicYear: (id) => {
    const db = readDatabase();
    if (db.activeAcademicYearId === id) return false;
    const idx = (db.academicYears || []).findIndex(a => a.id === id);
    if (idx === -1) return false;
    db.academicYears.splice(idx, 1);
    if (db.yearlyData && db.yearlyData[id]) delete db.yearlyData[id];
    saveDatabase(db);
    return true;
  },

  switchAcademicYear: (targetYearId) => {
    const db = readDatabase();
    const target = (db.academicYears || []).find(a => a.id === targetYearId);
    if (!target) return null;

    // Simpan dataset aktif saat ini ke yearlyData
    const currentId = db.activeAcademicYearId || '2024-2025-1';
    if (!db.yearlyData) db.yearlyData = {};
    db.yearlyData[currentId] = {
      students: JSON.parse(JSON.stringify(db.students || [])),
      stats: JSON.parse(JSON.stringify(db.stats || {})),
      mutations: JSON.parse(JSON.stringify(db.mutations || [])),
      beasiswaList: JSON.parse(JSON.stringify(db.beasiswaList || [])),
      rombelList: JSON.parse(JSON.stringify(db.rombelList || []))
    };

    // Muat data target tahun ajaran
    if (db.yearlyData[targetYearId]) {
      const saved = db.yearlyData[targetYearId];
      if (saved.students) db.students = JSON.parse(JSON.stringify(saved.students));
      if (saved.stats) db.stats = JSON.parse(JSON.stringify(saved.stats));
      if (saved.mutations) db.mutations = JSON.parse(JSON.stringify(saved.mutations));
      if (saved.beasiswaList) db.beasiswaList = JSON.parse(JSON.stringify(saved.beasiswaList));
      if (saved.rombelList) db.rombelList = JSON.parse(JSON.stringify(saved.rombelList));
    }

    db.activeAcademicYearId = targetYearId;
    (db.academicYears || []).forEach(a => {
      a.active = (a.id === targetYearId);
      if (a.id === targetYearId) a.status = 'Aktif';
    });

    recalculateStats(db);
    saveDatabase(db);
    return target;
  },

  // Profil Lembaga & Pengguna
  updateInstitution: (institutionData) => {
    const db = readDatabase();
    db.institution = { ...db.institution, ...institutionData };
    saveDatabase(db);
    return db.institution;
  },

  getUsers: () => {
    const db = readDatabase();
    return (db.users || []).map(({ password, ...u }) => u);
  },

  createUser: (userData) => {
    const db = readDatabase();
    if (!db.users) db.users = [];
    const newUser = {
      id: `USR-${Date.now().toString().slice(-4)}`,
      password: '123',
      ...userData
    };
    db.users.push(newUser);
    saveDatabase(db);
    const { password, ...userSafe } = newUser;
    return userSafe;
  },

  updateUser: (id, userData) => {
    const db = readDatabase();
    const idx = (db.users || []).findIndex(u => u.id === id);
    if (idx === -1) return null;
    db.users[idx] = { ...db.users[idx], ...userData, id };
    saveDatabase(db);
    const { password, ...userSafe } = db.users[idx];
    return userSafe;
  },

  deleteUser: (id) => {
    const db = readDatabase();
    if (db.users.length <= 1) return false;
    const idx = (db.users || []).findIndex(u => u.id === id);
    if (idx === -1) return false;
    db.users.splice(idx, 1);
    saveDatabase(db);
    return true;
  },

  // Reset Data Default
  resetToDefault: () => {
    const seed = DEFAULT_DATA ? JSON.parse(JSON.stringify(DEFAULT_DATA)) : {};
    seed.activeAcademicYearId = '2024-2025-1';
    seed.students = [];
    seed.mutations = [];
    seed.beasiswaList = [];
    seed.rombelList = [];
    seed.rombelSummary = [];
    seed.rombelUnggulan = [];
    seed.stats = {
      totalSiswa: 0,
      siswaLaki: 0,
      siswaPerempuan: 0,
      mutasiBulanIni: 0,
      mutasiMasuk: 0,
      mutasiKeluar: 0,
      penerimaBeasiswa: 0,
      siswaMukim: 0,
      siswaNonMukim: 0,
      berkasKurang: 0,
      persenValidasi: 0
    };
    if (initDefaultYearlyData && typeof initDefaultYearlyData === 'function') {
      seed.yearlyData = initDefaultYearlyData(seed);
    }
    saveDatabase(seed);
    return seed;
  }
};

