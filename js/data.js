/**
 * SIDASI (SISTEM INFORMASI DATA SISWA) MTs AL-FADLLIYAH
 * Master Initial Dataset
 * Basis Data Siap Pakai (Bersih / Siap Entri & Impor Excel)
 * Copyright © 2026 by Ravi SQ. Moh. Zein Permana
 */

const DEFAULT_DATA = {
  institution: {
    name: "Madrasah Tsanawiyah Al-Fadlliyah",
    nsm: "121232040018",
    npsn: "69948210",
    statusAkreditasi: "A (Unggul) - BAN-S/M 2023 Nilai 96",
    skOperasional: "Kd.10.06/4/PP.00.4/098/2012",
    alamat: "Jl. Raya Cikunten No. 45, Desa Cikunten, Kec. Singaparna",
    kota: "Kabupaten Tasikmalaya",
    provinsi: "Jawa Barat",
    kodePos: "46414",
    telepon: "(0265) 543890",
    email: "mts.alfadlliyah.tsm@gmail.com",
    website: "https://mts-alfadlliyah.sch.id",
    logo: "",
    kepalaMadrasah: "Drs. H. Ahmad Fadlli, M.Pd.I",
    nipKepala: "196908151994031002",
    kepalaTU: "Hj. Siti Rahmawati, S.Pd",
    nipTU: "197804122005012004",
    operatorData: "Ahmad Fauzi, S.Kom",
    titimangsaKota: "Tasikmalaya",
    tanggalRapor: "21 Desember 2024",
    semesterAktif: "Ganjil",
    tahunAjaranAktif: "2024/2025",
    watermark: true,
    marginBorder: true,
    fontFamily: "Plus Jakarta Sans"
  },

  academicYears: [
    {
      id: "2024-2025-1",
      tahun: "2024/2025",
      semester: "Ganjil",
      label: "TA 2024/2025 Ganjil",
      active: true,
      tglMulai: "15 Juli 2024",
      tglSelesai: "21 Desember 2024",
      tglKunciNilai: "18 Desember 2024 (23:59 WIB)",
      tglBagiRapor: "21 Desember 2024",
      status: "Aktif"
    },
    {
      id: "2024-2025-2",
      tahun: "2024/2025",
      semester: "Genap",
      label: "TA 2024/2025 Genap",
      active: false,
      tglMulai: "06 Januari 2025",
      tglSelesai: "21 Juni 2025",
      tglKunciNilai: "18 Juni 2025 (23:59 WIB)",
      tglBagiRapor: "21 Juni 2025",
      status: "Mendatang"
    },
    {
      id: "2023-2024-2",
      tahun: "2023/2024",
      semester: "Genap",
      label: "TA 2023/2024 Genap",
      active: false,
      tglMulai: "08 Januari 2024",
      tglSelesai: "22 Juni 2024",
      tglKunciNilai: "19 Juni 2024 (23:59 WIB)",
      tglBagiRapor: "22 Juni 2024",
      status: "Arsip"
    }
  ],

  stats: {
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
  },

  rombelSummary: [],

  // Kustomisasi Tingkat Kelas & Rombel Belajar
  tingkatList: [
    { id: "TKT-VII", kode: "VII", nama: "Kelas VII", fase: "Fase D", deskripsi: "Tingkat pertama Madrasah Tsanawiyah" },
    { id: "TKT-VIII", kode: "VIII", nama: "Kelas VIII", fase: "Fase D", deskripsi: "Tingkat menengah Madrasah Tsanawiyah" },
    { id: "TKT-IX", kode: "IX", nama: "Kelas IX", fase: "Fase D", deskripsi: "Tingkat akhir Madrasah Tsanawiyah" }
  ],

  rombelList: [],

  rombelUnggulan: [],

  // 3 Pilar Beasiswa (Sesuai BS-01 PRD, Bebas Tahfidz)
  beasiswaPillars: [
    {
      id: "ksm",
      title: "Prestasi KSM & Akademik",
      badgeColor: "emerald",
      icon: "award",
      penerima: 0,
      totalAlokasi: 0,
      realisasi: 0,
      persenSerapan: 0,
      deskripsi: "Bantuan pembebasan iuran/SPP & pembinaan intensif kompetisi sains madrasah."
    },
    {
      id: "baznas",
      title: "Afirmasi Dhuafa (Kerjasama BAZNAS)",
      badgeColor: "blue",
      icon: "heart-handshake",
      penerima: 0,
      totalAlokasi: 0,
      realisasi: 0,
      persenSerapan: 0,
      deskripsi: "Paket perlengkapan kitab, seragam madrasah, dan subsidi operasional santri dhuafa."
    },
    {
      id: "pip",
      title: "Program Indonesia Pintar (PIP)",
      badgeColor: "amber",
      icon: "wallet",
      penerima: 0,
      totalAlokasi: 0,
      realisasi: 0,
      persenSerapan: 0,
      deskripsi: "Penyaluran dana tunai bantuan pendidikan bersumber dari APBN bantuan pendidikan."
    }
  ],

  students: [],

  mutations: [],

  beasiswaList: [],

  users: [
    {
      id: "USR-ADMIN",
      nama: "Administrator SIDASI",
      username: "admin",
      password: "admin",
      peran: "Administrator Sistem",
      nip: "198501012010011001",
      status: "Aktif",
      akses: "Akses Penuh Seluruh Sistem & Konfigurasi"
    }
  ]
};

// Storage keys
const STORAGE_KEY = "SIDASI_MTS_ALFADLLIYAH_DATA";
const LEGACY_STORAGE_KEY = "SIM_SISWA_MTS_ALFADLLIYAH_DATA";
const CLEAN_FLAG = "SIDASI_CLEAN_INIT_2026_V6_ADMIN_ONLY";

function getAppData() {
  // Bersihkan seluruh data lama / cache demonstrasi saat versi bersih diaktifkan
  if (typeof localStorage !== "undefined" && !localStorage.getItem(CLEAN_FLAG)) {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      localStorage.setItem(CLEAN_FLAG, "true");
    } catch (e) {}
  }

  let stored = typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
  if (!stored) {
    const fresh = JSON.parse(JSON.stringify(DEFAULT_DATA));
    fresh.activeAcademicYearId = "2024-2025-1";
    fresh.yearlyData = initDefaultYearlyData(fresh);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    }
    return fresh;
  }
  try {
    const parsed = JSON.parse(stored);
    if (!parsed.tingkatList || !Array.isArray(parsed.tingkatList)) {
      parsed.tingkatList = JSON.parse(JSON.stringify(DEFAULT_DATA.tingkatList));
    }
    if (!parsed.rombelList || !Array.isArray(parsed.rombelList)) {
      parsed.rombelList = [];
    }
    if (!parsed.rombelUnggulan || !Array.isArray(parsed.rombelUnggulan)) {
      parsed.rombelUnggulan = [];
    }
    if (!parsed.students || !Array.isArray(parsed.students)) {
      parsed.students = [];
    }
    if (!parsed.mutations || !Array.isArray(parsed.mutations)) {
      parsed.mutations = [];
    }
    if (!parsed.beasiswaList || !Array.isArray(parsed.beasiswaList)) {
      parsed.beasiswaList = [];
    }
    if (!parsed.academicYears || !Array.isArray(parsed.academicYears) || parsed.academicYears.length === 0) {
      parsed.academicYears = JSON.parse(JSON.stringify(DEFAULT_DATA.academicYears));
    }
    if (!parsed.users || !Array.isArray(parsed.users) || parsed.users.length === 0) {
      parsed.users = JSON.parse(JSON.stringify(DEFAULT_DATA.users));
    }
    if (!parsed.activeAcademicYearId) {
      const activeObj = parsed.academicYears.find(a => a.active) || parsed.academicYears[0];
      parsed.activeAcademicYearId = activeObj ? activeObj.id : "2024-2025-1";
    }
    if (!parsed.yearlyData) {
      parsed.yearlyData = initDefaultYearlyData(parsed);
    }
    return parsed;
  } catch (e) {
    console.error("Gagal membaca local storage, memuat default:", e);
    const fresh = JSON.parse(JSON.stringify(DEFAULT_DATA));
    fresh.activeAcademicYearId = "2024-2025-1";
    fresh.yearlyData = initDefaultYearlyData(fresh);
    return fresh;
  }
}

function initDefaultYearlyData(parsed) {
  const baseStudents = (parsed && parsed.students) || [];
  const baseStats = (parsed && parsed.stats) || DEFAULT_DATA.stats;
  const baseMutations = (parsed && parsed.mutations) || [];
  const baseBeasiswa = (parsed && parsed.beasiswaList) || [];
  const baseRombel = (parsed && parsed.rombelSummary) || DEFAULT_DATA.rombelSummary;

  return {
    "2024-2025-1": {
      students: JSON.parse(JSON.stringify(baseStudents)),
      stats: JSON.parse(JSON.stringify(baseStats)),
      mutations: JSON.parse(JSON.stringify(baseMutations)),
      beasiswaList: JSON.parse(JSON.stringify(baseBeasiswa)),
      rombelSummary: JSON.parse(JSON.stringify(baseRombel))
    },
    "2024-2025-2": {
      students: JSON.parse(JSON.stringify(baseStudents)),
      stats: JSON.parse(JSON.stringify(baseStats)),
      mutations: JSON.parse(JSON.stringify(baseMutations)),
      beasiswaList: JSON.parse(JSON.stringify(baseBeasiswa)),
      rombelSummary: JSON.parse(JSON.stringify(baseRombel))
    },
    "2023-2024-2": {
      students: JSON.parse(JSON.stringify(baseStudents)),
      stats: JSON.parse(JSON.stringify(baseStats)),
      mutations: JSON.parse(JSON.stringify(baseMutations)),
      beasiswaList: JSON.parse(JSON.stringify(baseBeasiswa)),
      rombelSummary: JSON.parse(JSON.stringify(baseRombel))
    }
  };
}

function saveAppData(data, immediate = true) {
  let localSuccess = false;
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      localSuccess = true;
    }
  } catch (e) {
    console.error("Gagal menyimpan ke local storage:", e);
  }

  // Sinkronkan ke server backend secara otomatis dan langsung jika service API tersedia
  if (typeof window !== "undefined" && window.SIDASI_API && typeof window.SIDASI_API.syncData === "function") {
    try {
      window.SIDASI_API.syncData(data, immediate);
    } catch (err) {
      console.warn("Sinkronisasi background backend tertunda:", err);
    }
  }

  return localSuccess;
}

// Export untuk lingkungan Node.js Backend jika ada
if (typeof module !== "undefined" && module.exports) {
  module.exports = { DEFAULT_DATA, initDefaultYearlyData };
}
