/**
 * SIDASI (SISTEM INFORMASI DATA SISWA) MTs AL-FADLLIYAH
 * Application Controller & Interactive Logic
 * Copyright © 2026 by Ravi SQ. Moh. Zein Permana
 */

// Helper Sanitasi & Proteksi XSS untuk Seluruh Rendering Teks Dinamis
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .split('&').join('&amp;')
    .split('<').join('&lt;')
    .split('>').join('&gt;')
    .split('"').join('&quot;')
    .split("'").join('&#039;');
}
window.escapeHtml = escapeHtml;

// Helper Konversi Format Tanggal: ISO (YYYY-MM-DD) <-> Format Teks Indonesia (DD MMMM YYYY)
const INDO_MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

function dateToIso(val) {
  if (!val || val === "-" || val === "") return "";
  const s = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  const dmyMatch = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }

  const parts = s.split(/\s+/);
  if (parts.length >= 3) {
    const day = parseInt(parts[0], 10);
    const mStr = parts[1].toLowerCase();
    const year = parseInt(parts[2], 10);
    const mIdx = INDO_MONTH_NAMES.findIndex(m => m.toLowerCase() === mStr);
    if (!isNaN(day) && mIdx !== -1 && !isNaN(year)) {
      return `${year}-${String(mIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  return "";
}
window.dateToIso = dateToIso;

function isoToIndoDate(val) {
  if (!val || val === "-") return "-";
  const s = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split("-");
    const mIdx = parseInt(m, 10) - 1;
    const mName = INDO_MONTH_NAMES[mIdx] || m;
    return `${parseInt(d, 10)} ${mName} ${y}`;
  }
  return s;
}
window.isoToIndoDate = isoToIndoDate;

// Otomatis membuka popup kalender interaktif saat input tanggal diklik
document.addEventListener("click", (e) => {
  if (e.target && e.target.tagName === "INPUT" && e.target.type === "date") {
    if (typeof e.target.showPicker === "function") {
      try {
        e.target.showPicker();
      } catch (err) {}
    }
  }
});

// Application State
let appData = getAppData();
window.appData = appData;
let currentTab = "tab-dashboard";
let currentUser = (appData.users && appData.users[0]) || { id: "USR-01", nama: "Administrator SIDASI", username: "admin", role: "Super Admin", status: "Aktif" };
let selectedStudentForDrawer = null;
let isDrawerEditMode = false;
let currentMutationFilter = "ALL";
let activeMutationForPreview = (appData.mutations && appData.mutations[0]) || null;

// Bridge Sinkronisasi Global dengan Backend API
window.updateAppDataFromBackend = function(serverData) {
  if (!serverData) return;
  appData = serverData;
  window.appData = appData;
  if (serverData.users && serverData.users.length > 0) {
    currentUser = serverData.users[0];
  }
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
    }
  } catch (e) {}
  updateCurrentUserUI();
  populateAcademicYearDropdown();
  populateRaporStudentSelect();
  applyInstitutionDataToAllViews();
  renderAllModules();
  // Pertahankan menu tab aktif agar tidak berpindah
  restoreActiveTab();
};

window.getAppDataRef = function() {
  return appData;
};

// DOM Content Loaded Handler
document.addEventListener("DOMContentLoaded", () => {
  initApp();
  setupEventListeners();
  renderAllModules();
  checkAuthSession();
  restoreActiveTab();
  lucide.createIcons();
});

// Listener navigasi Back/Forward browser
window.addEventListener("hashchange", () => {
  restoreActiveTab();
});

/**
 * Initialize application state and UI
 */
function initApp() {
  // Set current user
  updateCurrentUserUI();

  // Populate Academic Year dropdown
  populateAcademicYearDropdown();

  // Populate student select for Rapor Cover
  populateRaporStudentSelect();

  // Terapkan logo resmi lembaga & profil ke seluruh antarmuka
  applyInstitutionDataToAllViews();
}

/**
 * Setup Event Listeners
 */
function setupEventListeners() {
  // Navigation tabs
  document.querySelectorAll(".nav-item").forEach(button => {
    button.addEventListener("click", (e) => {
      const tabId = button.getAttribute("data-tab");
      if (tabId) switchTab(tabId);
    });
  });

  // Mobile sidebar resize & keyboard controls
  window.addEventListener("resize", () => {
    if (window.innerWidth >= 1024) {
      closeMobileSidebar();
    }
  });

  // Tutup sidebar saat tekan tombol Esc
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeMobileSidebar();
    }
  });

  // Academic Year change in navbar
  const selectTA = document.getElementById("select-academic-year");
  if (selectTA) {
    selectTA.addEventListener("change", (e) => {
      switchAcademicYear(e.target.value);
    });
  }

  // Form Academic Year
  const formAcademicYear = document.getElementById("form-academic-year");
  if (formAcademicYear) formAcademicYear.addEventListener("submit", handleAcademicYearSubmit);

  // Form User (Pengguna SIDASI)
  const formUser = document.getElementById("form-user");
  if (formUser) formUser.addEventListener("submit", handleUserSubmit);

  // Quick backup button
  const btnQuickBackup = document.getElementById("btn-quick-backup");
  if (btnQuickBackup) {
    btnQuickBackup.addEventListener("click", doBackupData);
  }

  const btnDoBackup = document.getElementById("btn-do-backup");
  if (btnDoBackup) {
    btnDoBackup.addEventListener("click", doBackupData);
  }

  // User auth modal trigger
  const btnSwitchUser = document.getElementById("btn-switch-user");
  if (btnSwitchUser) btnSwitchUser.addEventListener("click", openAuthModal);

  const btnOpenUserModal = document.getElementById("btn-open-user-modal");
  if (btnOpenUserModal) btnOpenUserModal.addEventListener("click", openAuthModal);

  // Student Filters
  const searchInput = document.getElementById("filter-search-student");
  if (searchInput) searchInput.addEventListener("input", filterAndRenderStudents);

  const filterTingkat = document.getElementById("filter-tingkat");
  if (filterTingkat) {
    filterTingkat.addEventListener("change", () => {
      populateRombelDropdowns();
      filterAndRenderStudents();
    });
  }

  const filterRombel = document.getElementById("filter-rombel");
  if (filterRombel) filterRombel.addEventListener("change", filterAndRenderStudents);

  const filterDomisili = document.getElementById("filter-domisili");
  if (filterDomisili) filterDomisili.addEventListener("change", filterAndRenderStudents);

  const filterStatus = document.getElementById("filter-status-siswa");
  if (filterStatus) filterStatus.addEventListener("change", filterAndRenderStudents);

  // Form for Tingkat Custom
  const formNewTingkat = document.getElementById("form-new-tingkat");
  if (formNewTingkat) formNewTingkat.addEventListener("submit", handleAddTingkatSubmit);

  // Form for Rombel Custom
  const formNewRombel = document.getElementById("form-new-rombel");
  if (formNewRombel) formNewRombel.addEventListener("submit", handleAddRombelSubmit);

  // Modal Tambah Siswa - Tingkat change trigger
  const addTingkat = document.getElementById("add-tingkat");
  if (addTingkat) addTingkat.addEventListener("change", updateAddStudentRombelOptions);

  // Export & Import Excel
  const btnExportExcel = document.getElementById("btn-export-excel");
  if (btnExportExcel) btnExportExcel.addEventListener("click", exportStudentsToExcel);

  const btnOpenImportExcel = document.getElementById("btn-open-import-excel");
  if (btnOpenImportExcel) btnOpenImportExcel.addEventListener("click", openImportExcelModal);

  // Dropzone drag & drop for Excel import
  const dropzoneExcel = document.getElementById("dropzone-excel");
  if (dropzoneExcel) {
    dropzoneExcel.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropzoneExcel.classList.add("border-emerald-500", "bg-emerald-50/50");
    });
    dropzoneExcel.addEventListener("dragleave", (e) => {
      e.preventDefault();
      dropzoneExcel.classList.remove("border-emerald-500", "bg-emerald-50/50");
    });
    dropzoneExcel.addEventListener("drop", (e) => {
      e.preventDefault();
      dropzoneExcel.classList.remove("border-emerald-500", "bg-emerald-50/50");
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const fileInput = document.getElementById("input-excel-file");
        if (fileInput) {
          fileInput.files = e.dataTransfer.files;
          handleExcelFileSelect({ target: fileInput });
        }
      }
    });
  }

  // Add Student Modal triggers
  const btnOpenAddStudent = document.getElementById("btn-open-add-student");
  if (btnOpenAddStudent) btnOpenAddStudent.addEventListener("click", openAddStudentModal);

  const formNewStudent = document.getElementById("form-new-student");
  if (formNewStudent) formNewStudent.addEventListener("submit", handleAddStudentSubmit);

  // Add Mutation Modal triggers & otomatisasi isian data siswa
  const btnOpenAddMutation = document.getElementById("btn-open-add-mutation");
  if (btnOpenAddMutation) btnOpenAddMutation.addEventListener("click", openAddMutationModal);

  const formNewMutation = document.getElementById("form-new-mutation");
  if (formNewMutation) formNewMutation.addEventListener("submit", handleAddMutationSubmit);

  const inputMutNama = document.getElementById("mut-add-nama");
  if (inputMutNama) {
    inputMutNama.addEventListener("input", handleMutationStudentNameInput);
    inputMutNama.addEventListener("change", handleMutationStudentNameInput);
  }

  const inputMutNisn = document.getElementById("mut-add-nisn");
  if (inputMutNisn) {
    inputMutNisn.addEventListener("input", handleMutationStudentNisnInput);
  }

  // Print Mutation SK
  const btnPrintMutation = document.getElementById("btn-print-mutation");
  if (btnPrintMutation) btnPrintMutation.addEventListener("click", printOfficialMutationSK);

  // Beasiswa Filter & Add
  const filterBeasiswa = document.getElementById("filter-beasiswa-pilar");
  if (filterBeasiswa) filterBeasiswa.addEventListener("change", renderBeasiswaTable);

  const btnOpenAddBeasiswa = document.getElementById("btn-open-add-beasiswa");
  if (btnOpenAddBeasiswa) btnOpenAddBeasiswa.addEventListener("click", openAddBeasiswaModal);

  const formNewBeasiswa = document.getElementById("form-new-beasiswa");
  if (formNewBeasiswa) formNewBeasiswa.addEventListener("submit", handleAddBeasiswaSubmit);

  const inputBeaNama = document.getElementById("bea-add-nama");
  if (inputBeaNama) {
    inputBeaNama.addEventListener("input", handleBeasiswaStudentNameInput);
    inputBeaNama.addEventListener("change", handleBeasiswaStudentNameInput);
  }

  const inputBeaNisn = document.getElementById("bea-add-nisn");
  if (inputBeaNisn) {
    inputBeaNisn.addEventListener("input", handleBeasiswaStudentNisnInput);
  }

  const btnPrintRekapBeasiswa = document.getElementById("btn-print-rekap-beasiswa");
  if (btnPrintRekapBeasiswa) btnPrintRekapBeasiswa.addEventListener("click", printRekapBeasiswaA4);

  // Program Beasiswa Custom (Pilar Baru) & Edit
  const btnOpenAddBeasiswaPillar = document.getElementById("btn-open-add-beasiswa-pillar");
  if (btnOpenAddBeasiswaPillar) btnOpenAddBeasiswaPillar.addEventListener("click", openAddBeasiswaPillarModal);

  const formNewBeasiswaPillar = document.getElementById("form-new-beasiswa-pillar");
  if (formNewBeasiswaPillar) formNewBeasiswaPillar.addEventListener("submit", handleAddBeasiswaPillarSubmit);

  const formEditBeasiswaPillar = document.getElementById("form-edit-beasiswa-pillar");
  if (formEditBeasiswaPillar) formEditBeasiswaPillar.addEventListener("submit", handleEditBeasiswaPillarSubmit);

  // Edit Penerima Beasiswa & Otomatisasi Input
  const formEditBeasiswa = document.getElementById("form-edit-beasiswa");
  if (formEditBeasiswa) formEditBeasiswa.addEventListener("submit", handleEditBeasiswaSubmit);

  const inputBeaEditNama = document.getElementById("bea-edit-nama");
  if (inputBeaEditNama) {
    inputBeaEditNama.addEventListener("input", handleBeasiswaEditStudentNameInput);
    inputBeaEditNama.addEventListener("change", handleBeasiswaEditStudentNameInput);
  }

  const inputBeaEditNisn = document.getElementById("bea-edit-nisn");
  if (inputBeaEditNisn) {
    inputBeaEditNisn.addEventListener("input", handleBeasiswaEditStudentNisnInput);
  }

  // Rapor Config triggers
  const selectRaporSiswa = document.getElementById("rapor-select-siswa");
  if (selectRaporSiswa) selectRaporSiswa.addEventListener("change", updateRaporPreview);

  const btnSaveRapor = document.getElementById("btn-save-rapor-config");
  if (btnSaveRapor) btnSaveRapor.addEventListener("click", saveRaporConfiguration);

  const btnResetRapor = document.getElementById("btn-reset-rapor-config");
  if (btnResetRapor) btnResetRapor.addEventListener("click", resetRaporConfiguration);

  const btnPrintRapor = document.getElementById("btn-print-rapor");
  if (btnPrintRapor) btnPrintRapor.addEventListener("click", printRaporCoverA4);

  // Rapor Live Inputs Listeners
  ["rapor-input-nama-madrasah", "rapor-input-nsm", "rapor-input-npsn", "rapor-input-alamat", "rapor-input-titimangsa", "rapor-input-tanggal"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", updateRaporPreview);
  });

  // Profil Lembaga & Akreditasi Live Inputs Listeners (Sync Real-time ke Live Preview & Seluruh Komponen)
  ["set-inst-name", "set-inst-akreditasi", "set-inst-sk-akreditasi", "set-inst-nsm", "set-inst-npsn", "set-inst-alamat", "set-inst-kota", "set-inst-titimangsa", "set-inst-telepon", "set-inst-email", "set-inst-kepala", "set-inst-nip-kepala", "set-inst-tu", "set-inst-nip-tu"].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("input", () => {
        if (!appData.institution) appData.institution = {};
        if (id === "set-inst-name") appData.institution.name = el.value;
        if (id === "set-inst-akreditasi") appData.institution.statusAkreditasi = el.value;
        if (id === "set-inst-sk-akreditasi") {
          appData.institution.skOperasional = el.value;
          appData.institution.skAkreditasi = el.value;
        }
        if (id === "set-inst-nsm") appData.institution.nsm = el.value;
        if (id === "set-inst-npsn") appData.institution.npsn = el.value;
        if (id === "set-inst-alamat") appData.institution.alamat = el.value;
        if (id === "set-inst-kota") appData.institution.kota = el.value;
        if (id === "set-inst-titimangsa") appData.institution.titimangsaKota = el.value;
        if (id === "set-inst-telepon") appData.institution.telepon = el.value;
        if (id === "set-inst-email") appData.institution.email = el.value;
        if (id === "set-inst-kepala") appData.institution.kepalaMadrasah = el.value;
        if (id === "set-inst-nip-kepala") appData.institution.nipKepala = el.value;
        if (id === "set-inst-tu") appData.institution.kepalaTU = el.value;
        if (id === "set-inst-nip-tu") appData.institution.nipTU = el.value;
        applyInstitutionDataToAllViews();
      });
    }
  });

  const checkWatermark = document.getElementById("rapor-check-watermark");
  if (checkWatermark) checkWatermark.addEventListener("change", updateRaporPreview);

  const checkMargin = document.getElementById("rapor-check-margin");
  if (checkMargin) checkMargin.addEventListener("change", updateRaporPreview);

  // Drawer Print Induk
  const btnDrawerPrint = document.getElementById("btn-drawer-print-induk");
  if (btnDrawerPrint) btnDrawerPrint.addEventListener("click", printSingleStudentIndukA4);

  // Restore file input
  const inputRestore = document.getElementById("input-restore-file");
  if (inputRestore) inputRestore.addEventListener("change", handleRestoreFile);
}

const ACTIVE_TAB_KEY = "SIDASI_ACTIVE_TAB";
const ACTIVE_SETTINGS_SUBTAB_KEY = "SIDASI_ACTIVE_SETTINGS_SUBTAB";

/**
 * Responsive Mobile Drawer Sidebar Controls
 */
function openMobileSidebar() {
  const sidebar = document.getElementById("app-sidebar");
  const backdrop = document.getElementById("sidebar-backdrop");
  if (sidebar) {
    sidebar.classList.add("sidebar-open");
    sidebar.classList.remove("-translate-x-full");
    sidebar.classList.add("translate-x-0");
  }
  if (backdrop) {
    backdrop.classList.remove("hidden");
  }
  document.body.classList.add("overflow-hidden");
}

function closeMobileSidebar() {
  const sidebar = document.getElementById("app-sidebar");
  const backdrop = document.getElementById("sidebar-backdrop");
  if (sidebar) {
    sidebar.classList.remove("sidebar-open");
    sidebar.classList.add("-translate-x-full");
    sidebar.classList.remove("translate-x-0");
  }
  if (backdrop) {
    backdrop.classList.add("hidden");
  }
  document.body.classList.remove("overflow-hidden");
}

let _lastSidebarToggle = 0;
function toggleMobileSidebar(e) {
  if (e) {
    if (typeof e.preventDefault === "function") e.preventDefault();
    if (typeof e.stopPropagation === "function") e.stopPropagation();
  }
  const now = Date.now();
  if (now - _lastSidebarToggle < 250) {
    return; // Cegah double trigger onclick + touch/click
  }
  _lastSidebarToggle = now;

  const sidebar = document.getElementById("app-sidebar");
  if (!sidebar) return;
  const isOpen = sidebar.classList.contains("sidebar-open") || sidebar.classList.contains("translate-x-0");
  if (isOpen) {
    closeMobileSidebar();
  } else {
    openMobileSidebar();
  }
}

window.openMobileSidebar = openMobileSidebar;
window.closeMobileSidebar = closeMobileSidebar;
window.toggleMobileSidebar = toggleMobileSidebar;

/**
 * Switch Navigation Tab (Modul 1 - 6)
 * Menyimpan tab aktif ke localStorage & URL hash agar tetap bertahan saat refresh
 */
function switchTab(tabId) {
  if (!tabId) return;
  currentTab = tabId;

  // 1. Simpan ke localStorage & update URL hash
  try {
    localStorage.setItem(ACTIVE_TAB_KEY, tabId);
    if (tabId === "tab-pengaturan") {
      const savedSub = localStorage.getItem(ACTIVE_SETTINGS_SUBTAB_KEY) || "sub-profil";
      try { history.replaceState(null, "", `#${tabId}/${savedSub}`); } catch (e) {}
    } else {
      try { history.replaceState(null, "", `#${tabId}`); } catch (e) {}
    }
  } catch (e) {}

  // 2. Update nav item active state di sidebar
  document.querySelectorAll(".nav-item").forEach(button => {
    if (button.getAttribute("data-tab") === tabId) {
      button.classList.add("active", "text-emerald-700", "bg-emerald-50");
      button.classList.remove("text-slate-600", "hover:bg-slate-100");
      const icon = button.querySelector("i");
      if (icon) icon.classList.add("text-emerald-600");
    } else {
      button.classList.remove("active", "text-emerald-700", "bg-emerald-50");
      button.classList.add("text-slate-600", "hover:bg-slate-100");
      const icon = button.querySelector("i");
      if (icon) icon.classList.remove("text-emerald-600");
    }
  });

  // 3. Sembunyikan semua tab dan tampilkan yang dipilih
  document.querySelectorAll(".tab-content").forEach(section => {
    section.classList.add("hidden");
  });

  const targetTab = document.getElementById(tabId);
  if (targetTab) {
    targetTab.classList.remove("hidden");
  }

  // 4. Jika membuka tab Pengaturan, pulihkan juga sub-tab aktif terakhir
  if (tabId === "tab-pengaturan") {
    let savedSub = "sub-profil";
    try {
      savedSub = localStorage.getItem(ACTIVE_SETTINGS_SUBTAB_KEY) || "sub-profil";
    } catch (e) {}
    switchSettingsSubTab(savedSub);
  }

  // 5. Update Judul Halaman Dinamis
  const titleEl = document.getElementById("page-title");
  if (titleEl) {
    const titles = {
      "tab-dashboard": "Data Umum Kesiswaan (Dashboard)",
      "tab-buku-induk": "Buku Induk Siswa Digital",
      "tab-mutasi": "Manajemen Mutasi Siswa",
      "tab-beasiswa": "Program Beasiswa & Bantuan Pendidikan",
      "tab-rapor": "Identitas Rapor (Standar KMA 450/2024)",
      "tab-pengaturan": "Pengaturan & Konfigurasi Sistem"
    };
    titleEl.textContent = titles[tabId] || "SIDASI MTs Al-Fadlliyah";
  }

  // 6. Tutup sidebar mobile otomatis setelah navigasi dipilih
  closeMobileSidebar();

  // Refresh icons
  lucide.createIcons();
}

/**
 * Memulihkan menu tab & sub-tab yang aktif sebelumnya (Stay on Refresh)
 */
function restoreActiveTab() {
  let tabToActivate = "tab-dashboard";
  let subTabToActivate = null;

  // 1. Cek dari URL hash (misal: #tab-buku-induk atau #tab-pengaturan/sub-tingkat-rombel)
  if (window.location.hash) {
    const hash = window.location.hash.replace("#", "");
    const parts = hash.split("/");
    const validTabs = ["tab-dashboard", "tab-buku-induk", "tab-mutasi", "tab-beasiswa", "tab-rapor", "tab-pengaturan"];
    if (validTabs.includes(parts[0])) {
      tabToActivate = parts[0];
      if (parts[1]) subTabToActivate = parts[1];
    }
  }

  // 2. Jika tidak ada di hash, cek dari localStorage
  if (tabToActivate === "tab-dashboard") {
    try {
      const savedTab = localStorage.getItem(ACTIVE_TAB_KEY);
      const validTabs = ["tab-dashboard", "tab-buku-induk", "tab-mutasi", "tab-beasiswa", "tab-rapor", "tab-pengaturan"];
      if (savedTab && validTabs.includes(savedTab)) {
        tabToActivate = savedTab;
      }
    } catch (e) {}
  }

  if (subTabToActivate) {
    try {
      localStorage.setItem(ACTIVE_SETTINGS_SUBTAB_KEY, subTabToActivate);
    } catch (e) {}
  }

  switchTab(tabToActivate);
}

/**
 * Render All Modules
 */
function renderAllModules() {
  populateTingkatDropdowns();
  populateRombelDropdowns();
  renderDashboard();
  filterAndRenderStudents();
  renderMutations();
  populateBeasiswaCategoryDropdowns();
  renderBeasiswaPillars();
  renderBeasiswaTable();
  updateRaporPreview();
  renderUsersTable();
  renderTingkatTable();
  renderRombelTable();
  applyInstitutionDataToAllViews();
  renderCalendarSettings();
}

/* ========================================================
   MODUL 1: DATA UMUM (DASHBOARD)
   ======================================================== */
/**
 * Menghitung ulang rekapitulasi rombel dan kapasitas per jenjang secara dinamis
 * berdasarkan data tingkatList, rombelList, dan students saat ini.
 */
function recalculateRombelSummary() {
  if (!appData) return;
  const tingkatList = appData.tingkatList || [
    { kode: "VII", nama: "Kelas VII" },
    { kode: "VIII", nama: "Kelas VIII" },
    { kode: "IX", nama: "Kelas IX" }
  ];
  const rombelList = appData.rombelList || [];
  const students = appData.students || [];

  appData.rombelSummary = tingkatList.map(t => {
    const rombels = rombelList.filter(r => r.tingkat === t.kode);
    const rombelCount = rombels.length;
    const kapasitas = rombels.reduce((acc, r) => acc + (parseInt(r.kapasitas) || 36), 0);
    const stds = students.filter(s => s.tingkat === t.kode || (s.rombel && s.rombel.startsWith(t.kode)));
    const totalSiswa = stds.length;
    const laki = stds.filter(s => s.gender === 'L' || s.gender === 'Laki-laki').length;
    const perempuan = stds.filter(s => s.gender === 'P' || s.gender === 'Perempuan').length;
    const persen = kapasitas > 0 ? Math.min(100, Math.round((totalSiswa / kapasitas) * 100)) : 0;
    let status = "Belum Ada Rombel";
    if (kapasitas > 0) {
      status = totalSiswa >= kapasitas ? "Kapasitas Penuh" : `Tersedia ${kapasitas - totalSiswa} Kursi`;
    }
    return {
      tingkat: t.kode,
      rombelCount,
      totalSiswa,
      kapasitas,
      persen,
      laki,
      perempuan,
      status
    };
  });
}

function renderDashboard() {
  const stats = appData.stats || {
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

  const total = stats.totalSiswa || 0;
  const persenVal = typeof stats.persenValidasi === "number" ? stats.persenValidasi : 0;

  // 1. Total Siswa Aktif
  const totalEl = document.getElementById("dash-total-siswa");
  if (totalEl) totalEl.textContent = stats.totalSiswa.toLocaleString("id-ID");

  const badgeValidEl = document.getElementById("dash-badge-valid");
  const textValidEl = document.getElementById("dash-text-valid");
  if (badgeValidEl) {
    if (total === 0) {
      badgeValidEl.className = "text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200";
      badgeValidEl.textContent = "0% Valid";
    } else {
      badgeValidEl.className = "text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200";
      badgeValidEl.textContent = `${persenVal}% Valid`;
    }
  }
  if (textValidEl) {
    if (total === 0) {
      textValidEl.innerHTML = `<i data-lucide="info" class="w-3.5 h-3.5 text-slate-400 mr-1"></i> Belum ada data siswa`;
    } else {
      textValidEl.innerHTML = `<i data-lucide="check-circle" class="w-3.5 h-3.5 text-emerald-600 mr-1"></i> Validitas NIK & NISN (${persenVal}%)`;
    }
  }

  // 2. Rasio Gender
  const lakiEl = document.getElementById("dash-siswa-laki");
  const perempuanEl = document.getElementById("dash-siswa-perempuan");
  const persenLakiEl = document.getElementById("dash-persen-laki");
  const persenPerempuanEl = document.getElementById("dash-persen-perempuan");
  const barLakiEl = document.getElementById("dash-bar-laki");
  const barPerempuanEl = document.getElementById("dash-bar-perempuan");

  const persenLaki = total > 0 ? ((stats.siswaLaki / total) * 100).toFixed(1) : "0";
  const persenPerempuan = total > 0 ? ((stats.siswaPerempuan / total) * 100).toFixed(1) : "0";

  if (lakiEl) lakiEl.innerHTML = `${stats.siswaLaki} <span class="text-xs font-medium text-slate-500">L</span>`;
  if (perempuanEl) perempuanEl.innerHTML = `${stats.siswaPerempuan} <span class="text-xs font-medium text-slate-500">P</span>`;
  if (persenLakiEl) persenLakiEl.textContent = `(${persenLaki}%)`;
  if (persenPerempuanEl) persenPerempuanEl.textContent = `(${persenPerempuan}%)`;
  if (barLakiEl) barLakiEl.style.width = `${persenLaki}%`;
  if (barPerempuanEl) barPerempuanEl.style.width = `${persenPerempuan}%`;

  // 3. Mutasi Berjalan
  const mutasiTotalEl = document.getElementById("dash-mutasi-total");
  const mutasiMasukEl = document.getElementById("dash-mutasi-masuk");
  const mutasiKeluarEl = document.getElementById("dash-mutasi-keluar");
  if (mutasiTotalEl) mutasiTotalEl.textContent = stats.mutasiBulanIni || 0;
  if (mutasiMasukEl) mutasiMasukEl.textContent = `↑ ${stats.mutasiMasuk || 0} Masuk`;
  if (mutasiKeluarEl) mutasiKeluarEl.textContent = `↓ ${stats.mutasiKeluar || 0} Keluar`;

  // 4. Penerima Beasiswa
  const beasiswaEl = document.getElementById("dash-penerima-beasiswa");
  if (beasiswaEl) beasiswaEl.textContent = stats.penerimaBeasiswa || 0;

  // 5. Domisili Mukim vs Non-Mukim di Dashboard
  const mukimSummaryEl = document.getElementById("dash-mukim-summary");
  const nonMukimSummaryEl = document.getElementById("dash-nonmukim-summary");
  const persenMukim = total > 0 ? Math.round((stats.siswaMukim / total) * 100) : 0;
  const persenNonMukim = total > 0 ? (100 - persenMukim) : 0;
  if (mukimSummaryEl) mukimSummaryEl.textContent = `${stats.siswaMukim || 0} (${persenMukim}%)`;
  if (nonMukimSummaryEl) nonMukimSummaryEl.textContent = `${stats.siswaNonMukim || 0} (${persenNonMukim}%)`;

  // 6. Kartu Metrik di Modul 2 Buku Induk
  const biMukim = document.getElementById("bi-stat-mukim");
  const biNonMukim = document.getElementById("bi-stat-nonmukim");
  const biValiditas = document.getElementById("bi-stat-validitas");
  const biBerkas = document.getElementById("bi-stat-berkas");
  if (biMukim) biMukim.innerHTML = `${stats.siswaMukim || 0} <span class="text-xs font-normal text-slate-500">siswa</span>`;
  if (biNonMukim) biNonMukim.innerHTML = `${stats.siswaNonMukim || 0} <span class="text-xs font-normal text-slate-500">siswa</span>`;
  if (biValiditas) {
    if (total === 0) {
      biValiditas.className = "text-2xl font-extrabold text-slate-700 mt-1";
      biValiditas.innerHTML = `0% <span class="text-xs font-normal text-slate-400">belum ada data</span>`;
    } else {
      biValiditas.className = "text-2xl font-extrabold text-emerald-700 mt-1";
      biValiditas.innerHTML = `${persenVal}% <span class="text-xs font-normal text-slate-500">terverifikasi</span>`;
    }
  }
  if (biBerkas) biBerkas.innerHTML = `${stats.berkasKurang || 0} <span class="text-xs font-normal text-slate-500">perlu tindak lanjut</span>`;

  // 7. Rombel Summary (DU-03)
  recalculateRombelSummary();
  const rombelContainer = document.getElementById("container-rombel-summary");
  if (rombelContainer && appData.rombelSummary) {
    if (appData.rombelSummary.length === 0) {
      rombelContainer.innerHTML = `
        <div class="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400">
          <p class="text-xs font-semibold">Belum ada jenjang / rombongan belajar yang terdaftar.</p>
          <button type="button" onclick="openAddRombelModal()" class="mt-2 text-xs font-bold text-emerald-700 hover:underline">
            + Tambah Rombel Baru
          </button>
        </div>
      `;
    } else {
      rombelContainer.innerHTML = appData.rombelSummary.map(r => {
        const rombelItems = (appData.rombelList || []).filter(item => item.tingkat === r.tingkat);
        const badgesHtml = rombelItems.length > 0
          ? rombelItems.map(item => `
            <div class="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200/80 text-slate-800 border border-slate-200 transition-colors">
              <span class="cursor-pointer" onclick="openEditRombelModal('${item.id}')" title="Klik untuk edit rombel ${item.kode}">${item.kode}</span>
              <button type="button" onclick="event.stopPropagation(); deleteRombel('${item.id}')" title="Hapus Rombel ${item.kode}" class="text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded p-0.5 transition-colors">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
              </button>
            </div>
          `).join("")
          : `<span class="text-xs text-slate-400 italic">Belum ada rombel pada jenjang ini</span>`;

        return `
        <div class="p-4 rounded-xl border border-slate-200/80 hover:border-emerald-300 transition-colors bg-white">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center space-x-2.5">
              <span class="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center text-xs">
                ${r.tingkat}
              </span>
              <div>
                <h4 class="text-sm font-bold text-slate-900">Jenjang Kelas ${r.tingkat}</h4>
                <p class="text-[11px] text-slate-500">${r.rombelCount} Rombongan Belajar • ${r.laki || 0} Laki-laki / ${r.perempuan || 0} Perempuan</p>
              </div>
            </div>
            <div class="text-right">
              <span class="text-sm font-black text-slate-900">${r.totalSiswa || 0}</span>
              <span class="text-xs text-slate-400">/ ${r.kapasitas} Siswa</span>
              <span class="block text-[10px] font-bold ${r.persen === 100 ? 'text-emerald-700' : 'text-slate-500'}">${r.status || 'Tersedia Kursi'} (${r.persen || 0}%)</span>
            </div>
          </div>
          <div class="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div class="bg-gradient-to-r from-emerald-600 to-green-500 h-2.5 rounded-full" style="width: ${r.persen || 0}%"></div>
          </div>

          <!-- Daftar Rombel Interaktif dengan Menu Hapus per Rombel -->
          <div class="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
            <span class="text-[11px] font-bold text-slate-500 mr-1 flex items-center">
              <i data-lucide="layers" class="w-3.5 h-3.5 mr-1 text-slate-400"></i> Rombel:
            </span>
            ${badgesHtml}
            <button type="button" onclick="openAddRombelModalWithTingkat('${r.tingkat}')" title="Tambah Rombel Kelas ${r.tingkat}" class="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors">
              <i data-lucide="plus" class="w-3.5 h-3.5"></i>
              <span>Tambah</span>
            </button>
          </div>
        </div>
        `;
      }).join("");
    }
  }

  // 8. Rombel Unggulan (DU-04)
  const unggulanContainer = document.getElementById("container-rombel-unggulan");
  if (unggulanContainer) {
    const unggulanList = appData.rombelUnggulan || [];
    if (unggulanList.length === 0) {
      unggulanContainer.innerHTML = `
        <div class="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400">
          <i data-lucide="layers" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>
          <p class="text-xs font-semibold">Belum ada rombel unggulan</p>
          <button type="button" onclick="openAddRombelUnggulanModal()" class="mt-2 text-xs font-bold text-emerald-700 hover:underline">
            + Tambah Rombel Unggulan
          </button>
        </div>
      `;
    } else {
      unggulanContainer.innerHTML = unggulanList.map((u, index) => `
        <div class="p-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-emerald-50/30 transition-all relative group">
          <div class="flex items-center justify-between">
            <span class="font-bold text-xs text-slate-900">${u.nama}</span>
            <div class="flex items-center space-x-1">
              <span class="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">${u.totalSiswa || 0} Siswa</span>
              <button type="button" onclick="deleteRombelUnggulan(${index})" title="Hapus Rombel Unggulan ${u.nama}" class="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1 rounded-md transition-colors">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
              </button>
            </div>
          </div>
          <p class="text-[11px] text-slate-600 mt-1"><strong class="text-slate-700">Wali:</strong> ${u.wali || '-'}</p>
          <p class="text-[10px] text-emerald-800 font-medium mt-0.5 italic flex items-center">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-1.5"></span>
            ${u.fokus || '-'}
          </p>
        </div>
      `).join("");
    }
  }

  lucide.createIcons();
}

/* ========================================================
   MODUL 2: BUKU INDUK SISWA DIGITAL (BI-01 S/D BI-04)
   ======================================================== */

function filterAndRenderStudents() {
  const query = (document.getElementById("filter-search-student")?.value || "").toLowerCase().trim();
  const tingkat = document.getElementById("filter-tingkat")?.value || "ALL";
  const rombel = document.getElementById("filter-rombel")?.value || "ALL";
  const domisili = document.getElementById("filter-domisili")?.value || "ALL";
  const status = document.getElementById("filter-status-siswa")?.value || "ALL";

  let filtered = appData.students.filter(s => {
    const matchQuery = !query || 
      (s.nama && s.nama.toLowerCase().includes(query)) ||
      (s.nisn && s.nisn.includes(query)) ||
      (s.nik && s.nik.includes(query)) ||
      (s.nis && s.nis.includes(query));

    const matchTingkat = (tingkat === "ALL") || (s.tingkat === tingkat);
    const matchRombel = (rombel === "ALL") || (s.rombel === rombel);
    const matchDomisili = (domisili === "ALL") || (s.domisili === domisili);
    const matchStatus = (status === "ALL") || (s.statusSiswa === status);

    return matchQuery && matchTingkat && matchRombel && matchDomisili && matchStatus;
  });

  // Render Header Tabel Lengkap (Format 34 Kolom Resmi EMIS + Aksi)
  const thead = document.getElementById("student-table-header");
  if (thead) {
    thead.innerHTML = `
      <tr class="bg-emerald-800 text-white text-[11px] font-extrabold uppercase tracking-wider divide-x divide-emerald-700/60 shadow-xs">
        <th class="py-3 px-3 w-10 text-center whitespace-nowrap">NO</th>
        <th class="py-3 px-3 whitespace-nowrap">NISN</th>
        <th class="py-3 px-3 whitespace-nowrap">NIS</th>
        <th class="py-3 px-3 whitespace-nowrap">NIK SISWA</th>
        <th class="py-3 px-3 whitespace-nowrap">NAMA SISWA</th>
        <th class="py-3 px-3 whitespace-nowrap">TEMPAT LAHIR</th>
        <th class="py-3 px-3 whitespace-nowrap">TANGGAL LAHIR</th>
        <th class="py-3 px-3 text-center whitespace-nowrap">JK</th>
        <th class="py-3 px-3 whitespace-nowrap">KELAS</th>
        <th class="py-3 px-3 whitespace-nowrap">TINGKAT KELAS</th>
        <th class="py-3 px-3 whitespace-nowrap">AGAMA</th>
        <th class="py-3 px-3 text-center whitespace-nowrap">JML SAUDARA</th>
        <th class="py-3 px-3 whitespace-nowrap">NIK IBU</th>
        <th class="py-3 px-3 whitespace-nowrap">NAMA AYAH</th>
        <th class="py-3 px-3 whitespace-nowrap">NIK AYAH</th>
        <th class="py-3 px-3 whitespace-nowrap">PEKERJAAN AYAH</th>
        <th class="py-3 px-3 whitespace-nowrap">PENDIDIKAN AYAH</th>
        <th class="py-3 px-3 whitespace-nowrap">PENGHASILAN AYAH</th>
        <th class="py-3 px-3 whitespace-nowrap">NAMA IBU</th>
        <th class="py-3 px-3 whitespace-nowrap">PEKERJAAN IBU</th>
        <th class="py-3 px-3 whitespace-nowrap">PENGHASILAN IBU</th>
        <th class="py-3 px-3 whitespace-nowrap min-w-[200px]">ALAMAT</th>
        <th class="py-3 px-3 whitespace-nowrap">RT/RW</th>
        <th class="py-3 px-3 whitespace-nowrap">KELURAHAN</th>
        <th class="py-3 px-3 whitespace-nowrap">KECAMATAN</th>
        <th class="py-3 px-3 whitespace-nowrap">KABUPATEN</th>
        <th class="py-3 px-3 whitespace-nowrap">NAMA SEKOLAH ASAL</th>
        <th class="py-3 px-3 whitespace-nowrap">NPSN</th>
        <th class="py-3 px-3 whitespace-nowrap">KELOMPOK</th>
        <th class="py-3 px-3 whitespace-nowrap">KEBUTUHAN</th>
        <th class="py-3 px-3 whitespace-nowrap">NO. PESERTA UJIAN</th>
        <th class="py-3 px-3 whitespace-nowrap">NO. IJAZAH</th>
        <th class="py-3 px-3 whitespace-nowrap min-w-[180px]">KETERANGAN</th>
        <th class="py-3 px-3 whitespace-nowrap">TANGGAL MASUK MADRASAH</th>
        <th class="py-3 px-3 text-center whitespace-nowrap sticky right-0 bg-emerald-800 z-10 shadow-sm">AKSI</th>
      </tr>
    `;
  }

  const tbody = document.getElementById("student-table-body");
  const countLabel = document.getElementById("label-student-count");

  if (countLabel) {
    if (appData.students.length === 0) {
      countLabel.textContent = "Belum ada data siswa (Klik + Tambah Siswa atau gunakan Impor Data dari Excel)";
    } else {
      countLabel.textContent = `Menampilkan ${filtered.length} dari total ${appData.students.length} data siswa aktif`;
    }
  }

  if (!tbody) return;

  if (filtered.length === 0) {
    const isTotallyEmpty = appData.students.length === 0;
    tbody.innerHTML = `
      <tr>
        <td colspan="35" class="py-12 text-center text-slate-400">
          <i data-lucide="${isTotallyEmpty ? 'inbox' : 'search-x'}" class="w-9 h-9 mx-auto mb-2 opacity-60 text-slate-400"></i>
          <p class="font-bold text-sm text-slate-700">${isTotallyEmpty ? 'Basis Data Siswa Masih Kosong' : 'Tidak ditemukan data siswa yang sesuai'}</p>
          <p class="text-xs text-slate-500 mt-1">${isTotallyEmpty ? 'Silakan tambahkan data via tombol "+ Tambah Siswa" atau gunakan menu "Impor Data dari Excel".' : 'Silakan periksa kata kunci atau reset filter Anda.'}</p>
        </td>
      </tr>
    `;
    lucide.createIcons();
    return;
  }

  // Render Baris Data Siswa: 34 Kolom Lengkap Langsung (Dengan Sanitasi XSS)
  tbody.innerHTML = filtered.map((s, index) => {
    const sId = escapeHtml(s.id);
    return `
      <tr class="hover:bg-emerald-50/50 transition-colors border-b border-slate-200/80 divide-x divide-slate-100 text-xs">
        <td class="py-2.5 px-3 text-center font-bold text-slate-500 whitespace-nowrap bg-slate-50/50">${index + 1}</td>
        <td class="py-2.5 px-3 font-mono font-bold text-slate-800 whitespace-nowrap">${escapeHtml(s.nisn || '-')}</td>
        <td class="py-2.5 px-3 font-mono text-slate-700 whitespace-nowrap">${escapeHtml(s.nis || '-')}</td>
        <td class="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap text-[11px]">${escapeHtml(s.nik || '-')}</td>
        <td class="py-2.5 px-3 whitespace-nowrap">
          <span onclick="openStudentDrawer('${sId}')" class="font-extrabold text-slate-900 hover:text-emerald-700 cursor-pointer transition-colors block" title="Buka Detail & Edit Siswa">
            ${escapeHtml(s.nama || '-')}
          </span>
        </td>
        <td class="py-2.5 px-3 text-slate-700 whitespace-nowrap">${escapeHtml(s.tempatLahir || '-')}</td>
        <td class="py-2.5 px-3 text-slate-700 whitespace-nowrap">${escapeHtml(s.tanggalLahir || '-')}</td>
        <td class="py-2.5 px-3 text-center whitespace-nowrap">
          <span class="inline-block w-5 h-5 rounded-full font-bold text-[10px] leading-5 ${s.jk === 'L' ? 'bg-emerald-100 text-emerald-800' : 'bg-pink-100 text-pink-800'}">
            ${escapeHtml(s.jk || 'L')}
          </span>
        </td>
        <td class="py-2.5 px-3 font-bold text-slate-800 whitespace-nowrap">${escapeHtml(s.rombel || '-')}</td>
        <td class="py-2.5 px-3 font-bold text-emerald-800 whitespace-nowrap">${escapeHtml(s.tingkat || '-')}</td>
        <td class="py-2.5 px-3 text-slate-700 whitespace-nowrap">${escapeHtml(s.agama || 'Islam')}</td>
        <td class="py-2.5 px-3 text-center font-semibold text-slate-700 whitespace-nowrap">${escapeHtml(s.jmlSaudara !== undefined && s.jmlSaudara !== '' ? s.jmlSaudara : '0')}</td>
        <td class="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap text-[11px]">${escapeHtml(s.nikIbu || '-')}</td>
        <td class="py-2.5 px-3 text-slate-800 font-semibold whitespace-nowrap">${escapeHtml(s.namaAyah || '-')}</td>
        <td class="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap text-[11px]">${escapeHtml(s.nikAyah || '-')}</td>
        <td class="py-2.5 px-3 text-slate-700 whitespace-nowrap">${escapeHtml(s.pekerjaanAyah || s.pekerjaanOrtu || '-')}</td>
        <td class="py-2.5 px-3 text-slate-700 whitespace-nowrap">${escapeHtml(s.pendidikanAyah || '-')}</td>
        <td class="py-2.5 px-3 text-slate-700 whitespace-nowrap">${escapeHtml(s.penghasilanAyah || '-')}</td>
        <td class="py-2.5 px-3 text-slate-800 font-semibold whitespace-nowrap">${escapeHtml(s.namaIbu || '-')}</td>
        <td class="py-2.5 px-3 text-slate-700 whitespace-nowrap">${escapeHtml(s.pekerjaanIbu || '-')}</td>
        <td class="py-2.5 px-3 text-slate-700 whitespace-nowrap">${escapeHtml(s.penghasilanIbu || '-')}</td>
        <td class="py-2.5 px-3 text-slate-700 whitespace-nowrap max-w-xs truncate" title="${escapeHtml(s.alamat || '-')}">${escapeHtml(s.alamat || '-')}</td>
        <td class="py-2.5 px-3 text-slate-700 whitespace-nowrap">${escapeHtml(s.rtRw || '-')}</td>
        <td class="py-2.5 px-3 text-slate-700 whitespace-nowrap">${escapeHtml(s.kelurahan || '-')}</td>
        <td class="py-2.5 px-3 text-slate-700 whitespace-nowrap">${escapeHtml(s.kecamatan || '-')}</td>
        <td class="py-2.5 px-3 text-slate-700 whitespace-nowrap">${escapeHtml(s.kabupaten || '-')}</td>
        <td class="py-2.5 px-3 text-slate-700 whitespace-nowrap">${escapeHtml(s.sekolahAsal || '-')}</td>
        <td class="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">${escapeHtml(s.npsnAsal || '-')}</td>
        <td class="py-2.5 px-3 whitespace-nowrap">
          <span class="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">${escapeHtml(s.kelompok || 'Reguler')}</span>
        </td>
        <td class="py-2.5 px-3 whitespace-nowrap">
          <span class="inline-block px-2 py-0.5 rounded text-[10px] font-medium ${s.kebutuhan && s.kebutuhan !== 'Tidak Ada' ? 'bg-amber-100 text-amber-800 font-bold' : 'bg-slate-50 text-slate-500'}">${escapeHtml(s.kebutuhan || 'Tidak Ada')}</span>
        </td>
        <td class="py-2.5 px-3 font-mono text-slate-700 whitespace-nowrap">${escapeHtml(s.noUjian || '-')}</td>
        <td class="py-2.5 px-3 font-mono text-slate-700 whitespace-nowrap">${escapeHtml(s.noIjazah || '-')}</td>
        <td class="py-2.5 px-3 text-slate-600 italic whitespace-nowrap max-w-xs truncate" title="${escapeHtml(s.keterangan || s.catatanBK || '-')}">${escapeHtml(s.keterangan || s.catatanBK || '-')}</td>
        <td class="py-2.5 px-3 text-slate-700 whitespace-nowrap">${escapeHtml(s.tanggalMasuk || '-')}</td>
        <td class="py-2.5 px-3 text-center whitespace-nowrap sticky right-0 bg-white/95 shadow-sm space-x-1">
          <button onclick="openStudentDrawer('${sId}')" title="Edit Data Siswa" class="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[11px] font-bold transition-colors">
            Edit
          </button>
          <button onclick="deleteStudent('${sId}')" title="Hapus Data Siswa" class="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[11px] font-bold transition-colors">
            Hapus
          </button>
          <button onclick="quickPrintInduk('${sId}')" title="Cetak Lembar Induk A4" class="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
            <i data-lucide="printer" class="w-3.5 h-3.5"></i>
          </button>
        </td>
      </tr>
    `;
  }).join("");

  lucide.createIcons();
}

function resetStudentFilters() {
  const s = document.getElementById("filter-search-student");
  const t = document.getElementById("filter-tingkat");
  const r = document.getElementById("filter-rombel");
  const d = document.getElementById("filter-domisili");
  const st = document.getElementById("filter-status-siswa");

  if (s) s.value = "";
  if (t) t.value = "ALL";
  if (r) r.value = "ALL";
  if (d) d.value = "ALL";
  if (st) st.value = "ALL";

  populateRombelDropdowns();
  filterAndRenderStudents();
  showToast("Filter siswa berhasil direset");
}

/**
 * BI-04 Open Drawer Samping Buku Induk Siswa (View Mode & Edit Mode)
 */
function openStudentDrawer(studentId, startInEditMode = false) {
  const student = appData.students.find(s => s.id === studentId);
  if (!student) return;

  selectedStudentForDrawer = student;
  isDrawerEditMode = !!startInEditMode;

  const drawer = document.getElementById("drawer-student-detail");
  if (!drawer) return;

  renderStudentDrawer();
  drawer.classList.remove("hidden");
  lucide.createIcons();
}

function renderStudentDrawer() {
  if (!selectedStudentForDrawer) return;
  const student = selectedStudentForDrawer;

  const content = document.getElementById("drawer-student-content");
  const footer = document.getElementById("drawer-footer-actions");
  const badge = document.getElementById("drawer-badge-title");
  const title = document.getElementById("drawer-main-title");
  const editBtn = document.getElementById("btn-drawer-edit-toggle");

  if (!content) return;

  if (!isDrawerEditMode) {
    // --- MODE 1: DETAIL LIHAT (VIEW MODE) ---
    if (badge) {
      badge.className = "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800 uppercase";
      badge.textContent = "Lembar Buku Induk Digital (34 Data)";
    }
    if (title) title.textContent = "Detail Catatan Siswa";
    if (editBtn) {
      editBtn.className = "inline-flex items-center space-x-1 px-2.5 py-1.5 bg-white border border-slate-300 hover:border-emerald-600 hover:text-emerald-700 text-slate-700 rounded-lg text-xs font-bold transition-all shadow-sm";
      editBtn.title = "Ubah ke Mode Edit Data";
      editBtn.setAttribute("onclick", "toggleEditStudentDrawer(true)");
      editBtn.innerHTML = `<i data-lucide="edit-3" class="w-3.5 h-3.5 text-emerald-600"></i><span>Edit</span>`;
    }

    content.innerHTML = `
      <!-- Kartu Identitas Siswa -->
      <div class="flex items-center space-x-3 p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl shadow-sm">
        <div class="w-12 h-12 rounded-xl bg-emerald-600 text-white font-extrabold flex items-center justify-center text-lg shrink-0 shadow-md">
          ${(student.nama || "S").charAt(0)}
        </div>
        <div class="overflow-hidden flex-1">
          <div class="flex items-center justify-between gap-2">
            <h4 class="text-sm font-extrabold text-slate-900 leading-tight truncate">${student.nama || '-'}</h4>
            <span class="px-2.5 py-0.5 text-[10px] font-bold rounded-full whitespace-nowrap shrink-0 ${student.statusSiswa === 'Aktif' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
              ${student.statusSiswa || 'Aktif'}
            </span>
          </div>
          <p class="text-xs text-slate-500 font-mono mt-0.5 whitespace-nowrap">NISN: ${student.nisn || '-'} | NIS: ${student.nis || '-'}</p>
          <span class="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-100 text-emerald-800 whitespace-nowrap">
            ${student.rombel || '-'} (Kelas ${student.tingkat || 'VII'}) • ${student.domisili || 'Non-Mukim'}
          </span>
        </div>
      </div>

      <!-- 1. Data Identitas Pokok Siswa -->
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <h5 class="font-extrabold text-xs uppercase tracking-wider text-emerald-800 flex items-center space-x-1.5">
            <i data-lucide="user" class="w-3.5 h-3.5 text-emerald-600"></i>
            <span>1. Data Identitas Pokok & Kependudukan</span>
          </h5>
          <span class="text-[10px] text-slate-400 font-mono">ID: ${student.id}</span>
        </div>
        <div class="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 text-xs">
          <div>
            <span class="text-slate-400 block text-[10px]">NIK Siswa:</span>
            <span class="font-bold font-mono text-[11px]">${student.nik || '-'}</span>
          </div>
          <div>
            <span class="text-slate-400 block text-[10px]">Jenis Kelamin:</span>
            <span class="font-bold">${student.jk === 'L' ? 'Laki-laki (L)' : 'Perempuan (P)'}</span>
          </div>
          <div>
            <span class="text-slate-400 block text-[10px]">Tempat, Tgl Lahir:</span>
            <span class="font-bold">${student.tempatLahir || '-'}, ${student.tanggalLahir || '-'}</span>
          </div>
          <div>
            <span class="text-slate-400 block text-[10px]">Agama:</span>
            <span class="font-bold">${student.agama || 'Islam'}</span>
          </div>
          <div class="col-span-2">
            <span class="text-slate-400 block text-[10px]">Jumlah Saudara Kandung:</span>
            <span class="font-bold">${student.jmlSaudara !== undefined && student.jmlSaudara !== '' ? student.jmlSaudara : '0'} Bersaudara</span>
          </div>
        </div>
      </div>

      <!-- 2. Data Akademik, Kelas & Rombel -->
      <div class="space-y-2">
        <h5 class="font-extrabold text-xs uppercase tracking-wider text-emerald-800 flex items-center space-x-1.5">
          <i data-lucide="graduation-cap" class="w-3.5 h-3.5 text-emerald-600"></i>
          <span>2. Data Akademik & Status Madrasah</span>
        </h5>
        <div class="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 text-xs">
          <div>
            <span class="text-slate-400 block text-[10px]">Tingkat Kelas:</span>
            <span class="font-bold text-emerald-800">Kelas ${student.tingkat || 'VII'}</span>
          </div>
          <div>
            <span class="text-slate-400 block text-[10px]">Kelas / Rombel:</span>
            <span class="font-bold">${student.rombel || '-'}</span>
          </div>
          <div>
            <span class="text-slate-400 block text-[10px]">Kelompok / Program:</span>
            <span class="font-bold">${student.kelompok || 'Reguler'}</span>
          </div>
          <div>
            <span class="text-slate-400 block text-[10px]">Tgl Masuk Madrasah:</span>
            <span class="font-bold">${student.tanggalMasuk || '-'}</span>
          </div>
          <div>
            <span class="text-slate-400 block text-[10px]">Status Siswa:</span>
            <span class="font-bold">${student.statusSiswa || 'Aktif'}</span>
          </div>
          <div>
            <span class="text-slate-400 block text-[10px]">Domisili / Asrama:</span>
            <span class="font-bold">${student.domisili || 'Non-Mukim'} ${student.asrama && student.asrama !== '-' ? `(${student.asrama})` : ''}</span>
          </div>
        </div>
      </div>

      <!-- 3. Data Orang Tua Kandung & Wali -->
      <div class="space-y-2">
        <h5 class="font-extrabold text-xs uppercase tracking-wider text-emerald-800 flex items-center space-x-1.5">
          <i data-lucide="users" class="w-3.5 h-3.5 text-emerald-600"></i>
          <span>3. Data Orang Tua Kandung & Wali</span>
        </h5>
        <div class="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 text-xs">
          <!-- Ayah -->
          <div class="pb-2 border-b border-slate-200">
            <span class="text-[10px] font-bold text-slate-500 uppercase block mb-1">Ayah Kandung:</span>
            <div class="grid grid-cols-2 gap-1.5">
              <div>
                <span class="text-slate-400 block text-[10px]">Nama Ayah:</span>
                <span class="font-bold">${student.namaAyah || '-'}</span>
              </div>
              <div>
                <span class="text-slate-400 block text-[10px]">NIK Ayah:</span>
                <span class="font-mono text-[11px]">${student.nikAyah || '-'}</span>
              </div>
              <div>
                <span class="text-slate-400 block text-[10px]">Pendidikan Ayah:</span>
                <span>${student.pendidikanAyah || '-'}</span>
              </div>
              <div>
                <span class="text-slate-400 block text-[10px]">Pekerjaan & Penghasilan:</span>
                <span>${student.pekerjaanAyah || student.pekerjaanOrtu || '-'} (${student.penghasilanAyah || '-'})</span>
              </div>
            </div>
          </div>
          <!-- Ibu -->
          <div class="pb-2 border-b border-slate-200">
            <span class="text-[10px] font-bold text-slate-500 uppercase block mb-1">Ibu Kandung:</span>
            <div class="grid grid-cols-2 gap-1.5">
              <div>
                <span class="text-slate-400 block text-[10px]">Nama Ibu:</span>
                <span class="font-bold">${student.namaIbu || '-'}</span>
              </div>
              <div>
                <span class="text-slate-400 block text-[10px]">NIK Ibu:</span>
                <span class="font-mono text-[11px]">${student.nikIbu || '-'}</span>
              </div>
              <div>
                <span class="text-slate-400 block text-[10px]">Pekerjaan Ibu:</span>
                <span>${student.pekerjaanIbu || '-'}</span>
              </div>
              <div>
                <span class="text-slate-400 block text-[10px]">Penghasilan Ibu:</span>
                <span>${student.penghasilanIbu || '-'}</span>
              </div>
            </div>
          </div>
          <!-- Kontak -->
          <div class="flex justify-between items-center pt-0.5">
            <span class="text-slate-500 text-[11px] font-bold">No. HP / WhatsApp Wali:</span>
            <span class="font-mono font-bold text-emerald-700 text-xs">${student.teleponOrtu || '-'}</span>
          </div>
        </div>
      </div>

      <!-- 4. Alamat Lengkap Domisili Siswa -->
      <div class="space-y-2">
        <h5 class="font-extrabold text-xs uppercase tracking-wider text-emerald-800 flex items-center space-x-1.5">
          <i data-lucide="map-pin" class="w-3.5 h-3.5 text-emerald-600"></i>
          <span>4. Alamat Lengkap Domisili Siswa</span>
        </h5>
        <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 text-xs space-y-1.5">
          <div>
            <span class="text-slate-400 text-[10px] block">Alamat Rumah:</span>
            <span class="font-bold text-slate-800">${student.alamat || '-'}</span>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1 text-[11px]">
            <div>
              <span class="text-slate-400 block text-[10px]">RT / RW:</span>
              <span>${student.rtRw || '-'}</span>
            </div>
            <div>
              <span class="text-slate-400 block text-[10px]">Kelurahan / Desa:</span>
              <span>${student.kelurahan || '-'}</span>
            </div>
            <div>
              <span class="text-slate-400 block text-[10px]">Kecamatan:</span>
              <span>${student.kecamatan || '-'}</span>
            </div>
            <div>
              <span class="text-slate-400 block text-[10px]">Kabupaten / Kota:</span>
              <span>${student.kabupaten || '-'}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 5. Riwayat Sekolah Asal & Ijazah -->
      <div class="space-y-2">
        <h5 class="font-extrabold text-xs uppercase tracking-wider text-emerald-800 flex items-center space-x-1.5">
          <i data-lucide="book-marked" class="w-3.5 h-3.5 text-emerald-600"></i>
          <span>5. Riwayat Sekolah Asal & Ijazah</span>
        </h5>
        <div class="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 text-xs">
          <div>
            <span class="text-slate-400 block text-[10px]">Nama Sekolah Asal:</span>
            <span class="font-bold">${student.sekolahAsal || '-'}</span>
          </div>
          <div>
            <span class="text-slate-400 block text-[10px]">NPSN Sekolah Asal:</span>
            <span class="font-mono">${student.npsnAsal || '-'}</span>
          </div>
          <div>
            <span class="text-slate-400 block text-[10px]">No. Peserta Ujian:</span>
            <span class="font-mono">${student.noUjian || '-'}</span>
          </div>
          <div>
            <span class="text-slate-400 block text-[10px]">No. Seri Ijazah SD/MI:</span>
            <span class="font-mono">${student.noIjazah || '-'}</span>
          </div>
        </div>
      </div>

      <!-- 6. Kebutuhan Khusus, Keterangan & Berkas Fisik -->
      <div class="space-y-2">
        <h5 class="font-extrabold text-xs uppercase tracking-wider text-emerald-800 flex items-center space-x-1.5">
          <i data-lucide="check-square" class="w-3.5 h-3.5 text-emerald-600"></i>
          <span>6. Kebutuhan Khusus, Catatan & Berkas Fisik</span>
        </h5>
        
        <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 text-xs space-y-2">
          <div class="grid grid-cols-2 gap-2">
            <div>
              <span class="text-slate-400 block text-[10px]">Kebutuhan Khusus:</span>
              <span class="font-bold">${student.kebutuhan || 'Tidak Ada'}</span>
            </div>
            <div>
              <span class="text-slate-400 block text-[10px]">Program Beasiswa:</span>
              <span class="font-bold text-emerald-800">${student.beasiswa || '-'}</span>
            </div>
          </div>
          <div>
            <span class="text-slate-400 block text-[10px]">Keterangan / Catatan BK:</span>
            <p class="italic text-[11px] text-slate-700 leading-relaxed">${student.keterangan || student.catatanBK || 'Tidak ada catatan khusus.'}</p>
          </div>
        </div>

        <!-- Checklist Berkas Fisik -->
        <div class="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
          <span class="text-[10px] font-bold text-slate-500 uppercase block">Checklist Berkas Fisik (Arsip TU):</span>
          <label class="flex items-center justify-between cursor-pointer p-1 hover:bg-slate-50 rounded-lg text-xs">
            <span class="text-slate-700">Akta Kelahiran (Fotokopi Legalisir)</span>
            <input type="checkbox" ${student.berkas && student.berkas.aktaKelahiran ? 'checked' : ''} onchange="toggleStudentDoc('${student.id}', 'aktaKelahiran', this.checked)" class="w-4 h-4 text-emerald-600 rounded">
          </label>
          <label class="flex items-center justify-between cursor-pointer p-1 hover:bg-slate-50 rounded-lg text-xs">
            <span class="text-slate-700">Kartu Keluarga (KK Asli/Legalisir)</span>
            <input type="checkbox" ${student.berkas && student.berkas.kartuKeluarga ? 'checked' : ''} onchange="toggleStudentDoc('${student.id}', 'kartuKeluarga', this.checked)" class="w-4 h-4 text-emerald-600 rounded">
          </label>
          <label class="flex items-center justify-between cursor-pointer p-1 hover:bg-slate-50 rounded-lg text-xs">
            <span class="text-slate-700">Ijazah SD/MI Asli</span>
            <input type="checkbox" ${student.berkas && student.berkas.ijazahSD ? 'checked' : ''} onchange="toggleStudentDoc('${student.id}', 'ijazahSD', this.checked)" class="w-4 h-4 text-emerald-600 rounded">
          </label>
          <label class="flex items-center justify-between cursor-pointer p-1 hover:bg-slate-50 rounded-lg text-xs">
            <span class="text-slate-700">Surat Perjanjian Siswa & Santri</span>
            <input type="checkbox" ${student.berkas && student.berkas.suratPerjanjian ? 'checked' : ''} onchange="toggleStudentDoc('${student.id}', 'suratPerjanjian', this.checked)" class="w-4 h-4 text-emerald-600 rounded">
          </label>
        </div>
      </div>
    `;

    if (footer) {
      footer.innerHTML = `
        <button id="btn-drawer-print-induk" onclick="printSingleStudentIndukA4()" class="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-sm transition-all">
          <i data-lucide="printer" class="w-4 h-4"></i>
          <span>Cetak A4</span>
        </button>
        <button onclick="toggleEditStudentDrawer(true)" class="py-2 px-3 bg-white border border-slate-300 hover:border-emerald-600 hover:text-emerald-700 text-slate-700 font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-sm transition-all">
          <i data-lucide="edit-3" class="w-4 h-4 text-emerald-600"></i>
          <span>Edit Data</span>
        </button>
        <button onclick="deleteStudent('${student.id}')" class="py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-xl text-xs flex items-center space-x-1 transition-all" title="Hapus Siswa">
          <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          <span>Hapus</span>
        </button>
        <button onclick="closeStudentDrawer()" class="py-2 px-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition-all">
          Tutup
        </button>
      `;
    }

  } else {
    // --- MODE 2: FORM PENGEDITAN & SIMPAN (EDIT MODE LENGKAP 34 FIELD) ---
    if (badge) {
      badge.className = "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-800 uppercase";
      badge.textContent = "Mode Pengeditan (34 Kolom EMIS)";
    }
    if (title) title.textContent = "Edit Buku Induk Siswa";
    if (editBtn) {
      editBtn.className = "inline-flex items-center space-x-1 px-2.5 py-1.5 bg-amber-50 border border-amber-300 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-bold transition-all shadow-sm";
      editBtn.title = "Batalkan Pengeditan";
      editBtn.setAttribute("onclick", "toggleEditStudentDrawer(false)");
      editBtn.innerHTML = `<i data-lucide="x" class="w-3.5 h-3.5 text-amber-700"></i><span>Batal</span>`;
    }

    const tingkatList = appData.tingkatList || [
      { kode: "VII", nama: "Kelas VII" },
      { kode: "VIII", nama: "Kelas VIII" },
      { kode: "IX", nama: "Kelas IX" }
    ];
    const tingkatOptions = tingkatList.map(t => 
      `<option value="${t.kode}" ${student.tingkat === t.kode ? 'selected' : ''}>${t.nama || t.kode}</option>`
    ).join("");

    const rombelSet = new Set(appData.students.map(s => s.rombel).filter(Boolean));
    if (student.rombel) rombelSet.add(student.rombel);
    if (rombelSet.size === 0) {
      rombelSet.add("VII-A");
      rombelSet.add("VII-B");
      rombelSet.add("VIII-A");
      rombelSet.add("IX-A");
    }
    const rombelOptions = Array.from(rombelSet).map(r => `<option value="${r}">${r}</option>`).join("");

    content.innerHTML = `
      <form id="form-drawer-student-edit" onsubmit="event.preventDefault(); saveStudentDrawerEdit();" class="space-y-4 text-xs">
        
        <!-- Info Banner Mode Edit -->
        <div class="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center space-x-2 text-amber-800 text-xs">
          <i data-lucide="info" class="w-4 h-4 shrink-0 text-amber-600"></i>
          <span>Perubahan data mencakup 34 kolom resmi EMIS Kemenag dan akan langsung tersinkron ke Buku Induk.</span>
        </div>

        <!-- 1. Identitas Pokok Siswa -->
        <div class="p-3 bg-slate-50/70 border border-slate-200 rounded-xl space-y-2.5">
          <h5 class="font-extrabold text-xs uppercase tracking-wider text-emerald-800 flex items-center space-x-1">
            <i data-lucide="user" class="w-3.5 h-3.5 text-emerald-600"></i>
            <span>1. Data Identitas Pokok Siswa</span>
          </h5>
          
          <div>
            <label class="block text-[11px] font-bold text-slate-700 mb-0.5">Nama Lengkap Siswa*</label>
            <input type="text" id="edit-drawer-nama" value="${student.nama || ''}" required class="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-600">
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-[11px] font-bold text-slate-700 mb-0.5">NISN*</label>
              <input type="text" id="edit-drawer-nisn" value="${student.nisn || ''}" maxlength="10" required class="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-emerald-600">
            </div>
            <div>
              <label class="block text-[11px] font-bold text-slate-700 mb-0.5">NIS Madrasah*</label>
              <input type="text" id="edit-drawer-nis" value="${student.nis || ''}" required class="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-emerald-600">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-[11px] font-bold text-slate-700 mb-0.5">NIK Siswa (16 Digit)*</label>
              <input type="text" id="edit-drawer-nik" value="${student.nik || ''}" maxlength="16" class="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-medium text-slate-800 focus:outline-none focus:border-emerald-600">
            </div>
            <div>
              <label class="block text-[11px] font-bold text-slate-700 mb-0.5">Jenis Kelamin*</label>
              <select id="edit-drawer-jk" class="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-600">
                <option value="L" ${student.jk === 'L' ? 'selected' : ''}>Laki-laki (L)</option>
                <option value="P" ${student.jk === 'P' ? 'selected' : ''}>Perempuan (P)</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-[11px] font-bold text-slate-700 mb-0.5">Tempat Lahir</label>
              <input type="text" id="edit-drawer-tempat-lahir" value="${student.tempatLahir || ''}" class="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-600">
            </div>
            <div>
              <label class="block text-[11px] font-bold text-slate-700 mb-0.5">Tanggal Lahir</label>
              <input type="date" id="edit-drawer-tanggal-lahir" value="${dateToIso(student.tanggalLahir)}" onclick="this.showPicker && this.showPicker()" class="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-600 cursor-pointer">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-[11px] font-bold text-slate-700 mb-0.5">Agama</label>
              <select id="edit-drawer-agama" class="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-600">
                <option value="Islam" ${(!student.agama || student.agama === 'Islam') ? 'selected' : ''}>Islam</option>
                <option value="Kristen" ${student.agama === 'Kristen' ? 'selected' : ''}>Kristen</option>
                <option value="Katholik" ${student.agama === 'Katholik' ? 'selected' : ''}>Katholik</option>
                <option value="Hindu" ${student.agama === 'Hindu' ? 'selected' : ''}>Hindu</option>
                <option value="Buddha" ${student.agama === 'Buddha' ? 'selected' : ''}>Buddha</option>
                <option value="Konghucu" ${student.agama === 'Konghucu' ? 'selected' : ''}>Konghucu</option>
              </select>
            </div>
            <div>
              <label class="block text-[11px] font-bold text-slate-700 mb-0.5">Jumlah Saudara Kandung</label>
              <input type="number" id="edit-drawer-jml-saudara" min="0" value="${student.jmlSaudara !== undefined ? student.jmlSaudara : '0'}" class="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-600">
            </div>
          </div>
        </div>

        <!-- 2. Akademik & Rombel Belajar -->
        <div class="p-3 bg-slate-50/70 border border-slate-200 rounded-xl space-y-2.5">
          <h5 class="font-extrabold text-xs uppercase tracking-wider text-emerald-800 flex items-center space-x-1">
            <i data-lucide="graduation-cap" class="w-3.5 h-3.5 text-emerald-600"></i>
            <span>2. Data Akademik, Kelas & Rombel</span>
          </h5>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-[11px] font-bold text-slate-700 mb-0.5">Tingkat Kelas</label>
              <select id="edit-drawer-tingkat" class="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-600">
                ${tingkatOptions}
              </select>
            </div>
            <div>
              <label class="block text-[11px] font-bold text-slate-700 mb-0.5">Kelas / Rombel</label>
              <input type="text" id="edit-drawer-rombel" list="drawer-rombel-list" value="${student.rombel || ''}" class="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-600">
              <datalist id="drawer-rombel-list">
                ${rombelOptions}
              </datalist>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-[11px] font-bold text-slate-700 mb-0.5">Kelompok / Program</label>
              <input type="text" id="edit-drawer-kelompok" value="${student.kelompok || 'Reguler'}" placeholder="Reguler / Unggulan / Tahfidz" class="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-600">
            </div>
            <div>
              <label class="block text-[11px] font-bold text-slate-700 mb-0.5">Tgl Masuk Madrasah</label>
              <input type="date" id="edit-drawer-tanggal-masuk" value="${dateToIso(student.tanggalMasuk || '15 Juli 2024')}" onclick="this.showPicker && this.showPicker()" class="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-600 cursor-pointer">
            </div>
          </div>

          <div class="grid grid-cols-3 gap-2">
            <div>
              <label class="block text-[11px] font-bold text-slate-700 mb-0.5">Status Siswa</label>
              <select id="edit-drawer-status" class="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-600">
                <option value="Aktif" ${student.statusSiswa === 'Aktif' ? 'selected' : ''}>Aktif</option>
                <option value="Mutasi Keluar" ${student.statusSiswa === 'Mutasi Keluar' ? 'selected' : ''}>Mutasi Keluar</option>
                <option value="Lulus" ${student.statusSiswa === 'Lulus' ? 'selected' : ''}>Lulus</option>
                <option value="Non-Aktif" ${student.statusSiswa === 'Non-Aktif' ? 'selected' : ''}>Non-Aktif</option>
              </select>
            </div>
            <div>
              <label class="block text-[11px] font-bold text-slate-700 mb-0.5">Status Domisili</label>
              <select id="edit-drawer-domisili" class="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-600">
                <option value="Mukim (Pondok)" ${student.domisili && student.domisili.includes('Mukim') ? 'selected' : ''}>Mukim (Pondok)</option>
                <option value="Non-Mukim" ${!student.domisili || !student.domisili.includes('Mukim') ? 'selected' : ''}>Non-Mukim (Laju)</option>
              </select>
            </div>
            <div>
              <label class="block text-[11px] font-bold text-slate-700 mb-0.5">Asrama / Kamar</label>
              <input type="text" id="edit-drawer-asrama" value="${student.asrama || '-'}" placeholder="Nama Kamar / -" class="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-600">
            </div>
          </div>
        </div>

        <!-- 3. Orang Tua & Wali -->
        <div class="p-3 bg-slate-50/70 border border-slate-200 rounded-xl space-y-2.5">
          <h5 class="font-extrabold text-xs uppercase tracking-wider text-emerald-800 flex items-center space-x-1">
            <i data-lucide="users" class="w-3.5 h-3.5 text-emerald-600"></i>
            <span>3. Data Orang Tua Kandung & Wali</span>
          </h5>

          <!-- Ayah -->
          <div class="p-2.5 bg-white border border-slate-200 rounded-lg space-y-2">
            <span class="text-[10px] font-bold text-slate-500 uppercase block">Ayah Kandung:</span>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-[10px] text-slate-600 mb-0.5">Nama Ayah</label>
                <input type="text" id="edit-drawer-ayah" value="${student.namaAyah || ''}" class="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium">
              </div>
              <div>
                <label class="block text-[10px] text-slate-600 mb-0.5">NIK Ayah</label>
                <input type="text" id="edit-drawer-nik-ayah" value="${student.nikAyah || ''}" maxlength="16" class="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono">
              </div>
            </div>
            <div class="grid grid-cols-3 gap-2">
              <div>
                <label class="block text-[10px] text-slate-600 mb-0.5">Pendidikan</label>
                <input type="text" id="edit-drawer-pendidikan-ayah" value="${student.pendidikanAyah || ''}" class="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs">
              </div>
              <div>
                <label class="block text-[10px] text-slate-600 mb-0.5">Pekerjaan</label>
                <input type="text" id="edit-drawer-pekerjaan-ayah" value="${student.pekerjaanAyah || student.pekerjaanOrtu || ''}" class="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs">
              </div>
              <div>
                <label class="block text-[10px] text-slate-600 mb-0.5">Penghasilan</label>
                <input type="text" id="edit-drawer-penghasilan-ayah" value="${student.penghasilanAyah || ''}" class="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs">
              </div>
            </div>
          </div>

          <!-- Ibu -->
          <div class="p-2.5 bg-white border border-slate-200 rounded-lg space-y-2">
            <span class="text-[10px] font-bold text-slate-500 uppercase block">Ibu Kandung:</span>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-[10px] text-slate-600 mb-0.5">Nama Ibu</label>
                <input type="text" id="edit-drawer-ibu" value="${student.namaIbu || ''}" class="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium">
              </div>
              <div>
                <label class="block text-[10px] text-slate-600 mb-0.5">NIK Ibu</label>
                <input type="text" id="edit-drawer-nik-ibu" value="${student.nikIbu || ''}" maxlength="16" class="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono">
              </div>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-[10px] text-slate-600 mb-0.5">Pekerjaan Ibu</label>
                <input type="text" id="edit-drawer-pekerjaan-ibu" value="${student.pekerjaanIbu || ''}" class="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs">
              </div>
              <div>
                <label class="block text-[10px] text-slate-600 mb-0.5">Penghasilan Ibu</label>
                <input type="text" id="edit-drawer-penghasilan-ibu" value="${student.penghasilanIbu || ''}" class="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs">
              </div>
            </div>
          </div>

          <div>
            <label class="block text-[11px] font-bold text-slate-700 mb-0.5">No. WhatsApp / HP Wali</label>
            <input type="text" id="edit-drawer-telepon" value="${student.teleponOrtu || ''}" class="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono">
          </div>
        </div>

        <!-- 4. Alamat Lengkap Domisili -->
        <div class="p-3 bg-slate-50/70 border border-slate-200 rounded-xl space-y-2.5">
          <h5 class="font-extrabold text-xs uppercase tracking-wider text-emerald-800 flex items-center space-x-1">
            <i data-lucide="map-pin" class="w-3.5 h-3.5 text-emerald-600"></i>
            <span>4. Alamat Lengkap Domisili Siswa</span>
          </h5>

          <div>
            <label class="block text-[11px] font-bold text-slate-700 mb-0.5">Alamat Rumah (Jalan / Dusun)</label>
            <input type="text" id="edit-drawer-alamat" value="${student.alamat || ''}" class="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs">
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div>
              <label class="block text-[10px] text-slate-600 mb-0.5">RT / RW</label>
              <input type="text" id="edit-drawer-rt-rw" value="${student.rtRw || ''}" placeholder="003/004" class="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs">
            </div>
            <div>
              <label class="block text-[10px] text-slate-600 mb-0.5">Kelurahan / Desa</label>
              <input type="text" id="edit-drawer-kelurahan" value="${student.kelurahan || ''}" class="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs">
            </div>
            <div>
              <label class="block text-[10px] text-slate-600 mb-0.5">Kecamatan</label>
              <input type="text" id="edit-drawer-kecamatan" value="${student.kecamatan || ''}" class="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs">
            </div>
            <div>
              <label class="block text-[10px] text-slate-600 mb-0.5">Kabupaten / Kota</label>
              <input type="text" id="edit-drawer-kabupaten" value="${student.kabupaten || ''}" class="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs">
            </div>
          </div>
        </div>

        <!-- 5. Riwayat Sekolah Asal & Ijazah -->
        <div class="p-3 bg-slate-50/70 border border-slate-200 rounded-xl space-y-2.5">
          <h5 class="font-extrabold text-xs uppercase tracking-wider text-emerald-800 flex items-center space-x-1">
            <i data-lucide="book-marked" class="w-3.5 h-3.5 text-emerald-600"></i>
            <span>5. Riwayat Sekolah Asal & Ijazah</span>
          </h5>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-[11px] font-bold text-slate-700 mb-0.5">Nama Sekolah Asal (SD/MI)</label>
              <input type="text" id="edit-drawer-sekolah-asal" value="${student.sekolahAsal || ''}" class="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs">
            </div>
            <div>
              <label class="block text-[11px] font-bold text-slate-700 mb-0.5">NPSN Sekolah Asal</label>
              <input type="text" id="edit-drawer-npsn-asal" value="${student.npsnAsal || ''}" class="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-[11px] font-bold text-slate-700 mb-0.5">No. Peserta Ujian</label>
              <input type="text" id="edit-drawer-no-ujian" value="${student.noUjian || ''}" class="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono">
            </div>
            <div>
              <label class="block text-[11px] font-bold text-slate-700 mb-0.5">No. Seri Ijazah SD/MI</label>
              <input type="text" id="edit-drawer-no-ijazah" value="${student.noIjazah || ''}" class="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono">
            </div>
          </div>
        </div>

        <!-- 6. Kebutuhan Khusus, Keterangan & Berkas Fisik -->
        <div class="p-3 bg-slate-50/70 border border-slate-200 rounded-xl space-y-2.5">
          <h5 class="font-extrabold text-xs uppercase tracking-wider text-emerald-800 flex items-center space-x-1">
            <i data-lucide="check-square" class="w-3.5 h-3.5 text-emerald-600"></i>
            <span>6. Kebutuhan Khusus, Catatan & Berkas Fisik</span>
          </h5>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-[11px] font-bold text-slate-700 mb-0.5">Kebutuhan Khusus</label>
              <select id="edit-drawer-kebutuhan" class="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs">
                <option value="Tidak Ada" ${(!student.kebutuhan || student.kebutuhan === 'Tidak Ada') ? 'selected' : ''}>Tidak Ada</option>
                <option value="Disabilitas Netra" ${student.kebutuhan === 'Disabilitas Netra' ? 'selected' : ''}>Disabilitas Netra</option>
                <option value="Disabilitas Rungu" ${student.kebutuhan === 'Disabilitas Rungu' ? 'selected' : ''}>Disabilitas Rungu</option>
                <option value="Disabilitas Daksa" ${student.kebutuhan === 'Disabilitas Daksa' ? 'selected' : ''}>Disabilitas Daksa</option>
                <option value="Disabilitas Grahita" ${student.kebutuhan === 'Disabilitas Grahita' ? 'selected' : ''}>Disabilitas Grahita</option>
                <option value="Lamban Belajar" ${student.kebutuhan === 'Lamban Belajar' ? 'selected' : ''}>Lamban Belajar</option>
                <option value="Autis" ${student.kebutuhan === 'Autis' ? 'selected' : ''}>Autis</option>
                <option value="Lainnya" ${student.kebutuhan === 'Lainnya' ? 'selected' : ''}>Lainnya</option>
              </select>
            </div>
            <div>
              <label class="block text-[11px] font-bold text-slate-700 mb-0.5">Program Beasiswa</label>
              <input type="text" id="edit-drawer-beasiswa" value="${student.beasiswa || '-'}" class="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs">
            </div>
          </div>

          <div>
            <label class="block text-[11px] font-bold text-slate-700 mb-0.5">Keterangan / Catatan BK</label>
            <textarea id="edit-drawer-catatan-bk" rows="2" class="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs">${student.keterangan || student.catatanBK || ''}</textarea>
          </div>

          <!-- Checklist Berkas Fisik -->
          <div class="space-y-1.5 p-2 bg-white rounded-lg border border-slate-200">
            <span class="text-[10px] font-bold text-slate-500 uppercase block">Checklist Berkas Fisik:</span>
            <label class="flex items-center justify-between cursor-pointer p-1 hover:bg-slate-50 rounded text-xs">
              <span class="text-slate-700">Akta Kelahiran</span>
              <input type="checkbox" id="edit-drawer-b-akta" ${student.berkas && student.berkas.aktaKelahiran ? 'checked' : ''} class="w-4 h-4 text-emerald-600 rounded">
            </label>
            <label class="flex items-center justify-between cursor-pointer p-1 hover:bg-slate-50 rounded text-xs">
              <span class="text-slate-700">Kartu Keluarga (KK)</span>
              <input type="checkbox" id="edit-drawer-b-kk" ${student.berkas && student.berkas.kartuKeluarga ? 'checked' : ''} class="w-4 h-4 text-emerald-600 rounded">
            </label>
            <label class="flex items-center justify-between cursor-pointer p-1 hover:bg-slate-50 rounded text-xs">
              <span class="text-slate-700">Ijazah SD/MI Asli</span>
              <input type="checkbox" id="edit-drawer-b-ijazah" ${student.berkas && student.berkas.ijazahSD ? 'checked' : ''} class="w-4 h-4 text-emerald-600 rounded">
            </label>
            <label class="flex items-center justify-between cursor-pointer p-1 hover:bg-slate-50 rounded text-xs">
              <span class="text-slate-700">Surat Perjanjian Siswa & Santri</span>
              <input type="checkbox" id="edit-drawer-b-perjanjian" ${student.berkas && student.berkas.suratPerjanjian ? 'checked' : ''} class="w-4 h-4 text-emerald-600 rounded">
            </label>
          </div>
        </div>

      </form>
    `;

    if (footer) {
      footer.innerHTML = `
        <button type="button" onclick="saveStudentDrawerEdit()" class="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-extrabold rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-600/20 transition-all">
          <i data-lucide="check" class="w-4 h-4"></i>
          <span>Simpan Perubahan</span>
        </button>
        <button type="button" onclick="toggleEditStudentDrawer(false)" class="py-2.5 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition-all">
          Batal
        </button>
      `;
    }
  }

  lucide.createIcons();
}

function closeStudentDrawer() {
  const drawer = document.getElementById("drawer-student-detail");
  if (drawer) drawer.classList.add("hidden");
  isDrawerEditMode = false;
}

function toggleEditStudentDrawer(forceMode) {
  if (typeof forceMode === "boolean") {
    isDrawerEditMode = forceMode;
  } else {
    isDrawerEditMode = !isDrawerEditMode;
  }
  renderStudentDrawer();
}

function saveStudentDrawerEdit() {
  if (!selectedStudentForDrawer) return;

  const nama = document.getElementById("edit-drawer-nama")?.value.trim();
  const nisn = document.getElementById("edit-drawer-nisn")?.value.trim();
  const nis = document.getElementById("edit-drawer-nis")?.value.trim();
  const nik = document.getElementById("edit-drawer-nik")?.value.trim();

  if (!nama || !nisn || !nis) {
    showToast("Nama Lengkap, NISN, dan NIS wajib diisi!");
    return;
  }

  const sIndex = appData.students.findIndex(s => s.id === selectedStudentForDrawer.id);
  if (sIndex === -1) {
    showToast("Data siswa tidak ditemukan dalam sistem");
    return;
  }

  // 1. Identitas Pokok
  const jk = document.getElementById("edit-drawer-jk")?.value || "L";
  const tempatLahir = document.getElementById("edit-drawer-tempat-lahir")?.value.trim() || "-";
  const rawTanggalLahir = document.getElementById("edit-drawer-tanggal-lahir")?.value.trim();
  const tanggalLahir = rawTanggalLahir ? isoToIndoDate(rawTanggalLahir) : (selectedStudentForDrawer.tanggalLahir || "-");
  const agama = document.getElementById("edit-drawer-agama")?.value || "Islam";
  const jmlSaudara = document.getElementById("edit-drawer-jml-saudara")?.value.trim() || "0";

  // 2. Akademik
  const tingkat = document.getElementById("edit-drawer-tingkat")?.value || selectedStudentForDrawer.tingkat;
  const rombel = document.getElementById("edit-drawer-rombel")?.value.trim() || selectedStudentForDrawer.rombel;
  const kelompok = document.getElementById("edit-drawer-kelompok")?.value.trim() || selectedStudentForDrawer.kelompok || "Reguler";
  const rawTanggalMasuk = document.getElementById("edit-drawer-tanggal-masuk")?.value.trim();
  const tanggalMasuk = rawTanggalMasuk ? isoToIndoDate(rawTanggalMasuk) : (selectedStudentForDrawer.tanggalMasuk || "15 Juli 2024");
  const statusSiswa = document.getElementById("edit-drawer-status")?.value || selectedStudentForDrawer.statusSiswa || "Aktif";
  const domisili = document.getElementById("edit-drawer-domisili")?.value || "Non-Mukim";
  const asrama = document.getElementById("edit-drawer-asrama")?.value.trim() || "-";

  // 3. Orang Tua & Wali
  const namaAyah = document.getElementById("edit-drawer-ayah")?.value.trim() || "-";
  const nikAyah = document.getElementById("edit-drawer-nik-ayah")?.value.trim() || "-";
  const pendidikanAyah = document.getElementById("edit-drawer-pendidikan-ayah")?.value.trim() || "-";
  const pekerjaanAyah = document.getElementById("edit-drawer-pekerjaan-ayah")?.value.trim() || "-";
  const penghasilanAyah = document.getElementById("edit-drawer-penghasilan-ayah")?.value.trim() || "-";

  const namaIbu = document.getElementById("edit-drawer-ibu")?.value.trim() || "-";
  const nikIbu = document.getElementById("edit-drawer-nik-ibu")?.value.trim() || "-";
  const pekerjaanIbu = document.getElementById("edit-drawer-pekerjaan-ibu")?.value.trim() || "-";
  const penghasilanIbu = document.getElementById("edit-drawer-penghasilan-ibu")?.value.trim() || "-";
  const teleponOrtu = document.getElementById("edit-drawer-telepon")?.value.trim() || "-";

  // 4. Alamat
  const alamat = document.getElementById("edit-drawer-alamat")?.value.trim() || "-";
  const rtRw = document.getElementById("edit-drawer-rt-rw")?.value.trim() || "-";
  const kelurahan = document.getElementById("edit-drawer-kelurahan")?.value.trim() || "-";
  const kecamatan = document.getElementById("edit-drawer-kecamatan")?.value.trim() || "-";
  const kabupaten = document.getElementById("edit-drawer-kabupaten")?.value.trim() || "-";

  // 5. Sekolah Asal & Ijazah
  const sekolahAsal = document.getElementById("edit-drawer-sekolah-asal")?.value.trim() || "-";
  const npsnAsal = document.getElementById("edit-drawer-npsn-asal")?.value.trim() || "-";
  const noUjian = document.getElementById("edit-drawer-no-ujian")?.value.trim() || "-";
  const noIjazah = document.getElementById("edit-drawer-no-ijazah")?.value.trim() || "-";

  // 6. Kebutuhan & Catatan
  const kebutuhan = document.getElementById("edit-drawer-kebutuhan")?.value || "Tidak Ada";
  const beasiswa = document.getElementById("edit-drawer-beasiswa")?.value.trim() || "-";
  const catatanBK = document.getElementById("edit-drawer-catatan-bk")?.value.trim() || "";

  const bAkta = document.getElementById("edit-drawer-b-akta")?.checked || false;
  const bKK = document.getElementById("edit-drawer-b-kk")?.checked || false;
  const bIjazah = document.getElementById("edit-drawer-b-ijazah")?.checked || false;
  const bPerjanjian = document.getElementById("edit-drawer-b-perjanjian")?.checked || false;

  // Update data objek siswa
  const updatedStudent = {
    ...appData.students[sIndex],
    nama,
    nisn,
    nis,
    nik: nik || appData.students[sIndex].nik,
    jk,
    tempatLahir,
    tanggalLahir,
    tingkat,
    rombel,
    agama,
    jmlSaudara,
    statusSiswa,
    domisili,
    asrama,
    namaAyah,
    nikAyah,
    pendidikanAyah,
    pekerjaanAyah,
    penghasilanAyah,
    namaIbu,
    nikIbu,
    pekerjaanIbu,
    penghasilanIbu,
    pekerjaanOrtu: pekerjaanAyah !== "-" ? pekerjaanAyah : (pekerjaanIbu !== "-" ? pekerjaanIbu : "-"),
    teleponOrtu,
    alamat,
    rtRw,
    kelurahan,
    kecamatan,
    kabupaten,
    sekolahAsal,
    npsnAsal,
    kelompok,
    kebutuhan,
    noUjian,
    noIjazah,
    keterangan: catatanBK,
    tanggalMasuk,
    beasiswa,
    catatanBK,
    berkas: {
      aktaKelahiran: bAkta,
      kartuKeluarga: bKK,
      ijazahSD: bIjazah,
      suratPerjanjian: bPerjanjian
    }
  };

  appData.students[sIndex] = updatedStudent;
  selectedStudentForDrawer = updatedStudent;

  // Simpan ke local storage / backend
  saveAppData(appData);

  // Perbarui tampilan antarmuka
  filterAndRenderStudents();
  populateRaporStudentSelect();
  renderDashboard();

  // Kembali ke mode lihat detail
  isDrawerEditMode = false;
  renderStudentDrawer();

  showToast(`Data siswa "${updatedStudent.nama}" berhasil disimpan!`);
}

function toggleStudentDoc(studentId, docField, isChecked) {
  const student = appData.students.find(s => s.id === studentId);
  if (student && student.berkas) {
    student.berkas[docField] = isChecked;
    saveAppData(appData);
    filterAndRenderStudents();
    showToast(`Status berkas fisik ${student.nama} diperbarui`);
  }
}

/**
 * Hapus Data Siswa dari Buku Induk
 */
function deleteStudent(studentId) {
  const student = appData.students.find(s => s.id === studentId);
  if (!student) {
    showToast("Data siswa tidak ditemukan dalam sistem!");
    return;
  }

  const confirmDelete = confirm(`Apakah Anda yakin ingin menghapus data siswa ini?\n\nNama: ${student.nama}\nNISN: ${student.nisn}\nKelas: ${student.rombel}\n\nPerhatian: Data yang dihapus akan dihilangkan dari Buku Induk.`);
  if (!confirmDelete) return;

  const sIndex = appData.students.findIndex(s => s.id === studentId);
  if (sIndex !== -1) {
    appData.students.splice(sIndex, 1);
  }

  // Update statistik
  if (appData.stats.totalSiswa > 0) appData.stats.totalSiswa -= 1;
  if (student.jk === 'L' && appData.stats.siswaLaki > 0) appData.stats.siswaLaki -= 1;
  if (student.jk === 'P' && appData.stats.siswaPerempuan > 0) appData.stats.siswaPerempuan -= 1;
  if (student.domisili && student.domisili.includes('Mukim') && appData.stats.siswaMukim > 0) {
    appData.stats.siswaMukim -= 1;
  } else if (appData.stats.siswaNonMukim > 0) {
    appData.stats.siswaNonMukim -= 1;
  }

  // Tutup drawer jika siswa yang sedang terbuka dihapus
  if (selectedStudentForDrawer && selectedStudentForDrawer.id === studentId) {
    closeStudentDrawer();
    selectedStudentForDrawer = null;
  }

  recalculateStudentStats();

  // Simpan ke local storage
  saveAppData(appData);

  // Perbarui antarmuka
  filterAndRenderStudents();
  populateRaporStudentSelect();
  renderDashboard();

  showToast(`Data siswa "${student.nama}" berhasil dihapus.`);
}

/**
 * BI-01 Modal Tambah Siswa Baru (Standar 34 Kolom Resmi EMIS Kemenag)
 */
function openAddStudentModal() {
  const modal = document.getElementById("modal-add-student");
  if (modal) modal.classList.remove("hidden");
  const tglMasuk = document.getElementById("add-tanggal-masuk");
  if (tglMasuk && !tglMasuk.value) {
    tglMasuk.value = new Date().toISOString().split("T")[0];
  }
  updateAddStudentRombelOptions();
  lucide.createIcons();
}

function closeAddStudentModal() {
  const modal = document.getElementById("modal-add-student");
  if (modal) modal.classList.add("hidden");
}

function handleAddStudentSubmit(e) {
  e.preventDefault();

  // 1. Identitas Pokok Siswa
  const nisn = document.getElementById("add-nisn")?.value.trim() || "";
  const nis = document.getElementById("add-nis")?.value.trim() || "";
  const nik = document.getElementById("add-nik")?.value.trim() || "";
  const nama = document.getElementById("add-nama")?.value.trim() || "";
  const tempatLahir = document.getElementById("add-tempat-lahir")?.value.trim() || "-";
  const rawTanggalLahir = document.getElementById("add-tanggal-lahir")?.value.trim() || "";
  const tanggalLahir = rawTanggalLahir ? isoToIndoDate(rawTanggalLahir) : "-";
  const jk = document.getElementById("add-jk")?.value || "L";
  const agama = document.getElementById("add-agama")?.value || "Islam";
  const jmlSaudara = document.getElementById("add-jml-saudara")?.value.trim() || "0";

  // 2. Data Akademik & Rombel Belajar
  const tingkat = document.getElementById("add-tingkat")?.value || "VII";
  const rombel = document.getElementById("add-rombel")?.value || `${tingkat}-A`;
  const kelompok = document.getElementById("add-kelompok")?.value.trim() || "Reguler";
  const rawTanggalMasuk = document.getElementById("add-tanggal-masuk")?.value.trim() || "";
  const tanggalMasuk = rawTanggalMasuk ? isoToIndoDate(rawTanggalMasuk) : "15 Juli 2024";
  const domisili = document.getElementById("add-domisili")?.value || "Non-Mukim";
  const asrama = document.getElementById("add-asrama")?.value.trim() || "-";

  // 3. Data Orang Tua Kandung & Wali
  const namaAyah = document.getElementById("add-ayah")?.value.trim() || "-";
  const nikAyah = document.getElementById("add-nik-ayah")?.value.trim() || "-";
  const pendidikanAyah = document.getElementById("add-pendidikan-ayah")?.value.trim() || "-";
  const pekerjaanAyah = document.getElementById("add-pekerjaan-ayah")?.value.trim() || "-";
  const penghasilanAyah = document.getElementById("add-penghasilan-ayah")?.value.trim() || "-";

  const namaIbu = document.getElementById("add-nama-ibu")?.value.trim() || "-";
  const nikIbu = document.getElementById("add-nik-ibu")?.value.trim() || "-";
  const pekerjaanIbu = document.getElementById("add-pekerjaan-ibu")?.value.trim() || "-";
  const penghasilanIbu = document.getElementById("add-penghasilan-ibu")?.value.trim() || "-";
  const teleponOrtu = document.getElementById("add-telepon")?.value.trim() || "-";

  // 4. Alamat Lengkap Domisili
  const alamat = document.getElementById("add-alamat")?.value.trim() || "-";
  const rtRw = document.getElementById("add-rt-rw")?.value.trim() || "-";
  const kelurahan = document.getElementById("add-kelurahan")?.value.trim() || "-";
  const kecamatan = document.getElementById("add-kecamatan")?.value.trim() || "-";
  const kabupaten = document.getElementById("add-kabupaten")?.value.trim() || "-";

  // 5. Riwayat Sekolah Asal & Ijazah
  const sekolahAsal = document.getElementById("add-sekolah-asal")?.value.trim() || "-";
  const npsnAsal = document.getElementById("add-npsn-asal")?.value.trim() || "-";
  const noUjian = document.getElementById("add-no-ujian")?.value.trim() || "-";
  const noIjazah = document.getElementById("add-no-ijazah")?.value.trim() || "-";

  // 6. Kebutuhan Khusus, Keterangan & Berkas Fisik
  const kebutuhan = document.getElementById("add-kebutuhan")?.value || "Tidak Ada";
  const keterangan = document.getElementById("add-keterangan")?.value.trim() || "-";

  const akta = document.getElementById("add-b-akta")?.checked ?? true;
  const kk = document.getElementById("add-b-kk")?.checked ?? true;
  const ijazah = document.getElementById("add-b-ijazah")?.checked ?? true;
  const perjanjian = document.getElementById("add-b-perjanjian")?.checked ?? true;

  const newId = `SIS-${String(appData.students.length + 1).padStart(3, '0')}`;

  const newStudent = {
    id: newId,
    nisn,
    nis,
    nik,
    nama,
    tempatLahir,
    tanggalLahir,
    jk,
    tingkat,
    rombel,
    agama,
    jmlSaudara,
    nikIbu,
    namaAyah,
    nikAyah,
    pekerjaanAyah,
    pendidikanAyah,
    penghasilanAyah,
    namaIbu,
    pekerjaanIbu,
    penghasilanIbu,
    alamat,
    rtRw,
    kelurahan,
    kecamatan,
    kabupaten,
    sekolahAsal,
    npsnAsal,
    kelompok,
    kebutuhan,
    noUjian,
    noIjazah,
    keterangan,
    tanggalMasuk,
    pekerjaanOrtu: pekerjaanAyah !== "-" ? pekerjaanAyah : (pekerjaanIbu !== "-" ? pekerjaanIbu : "Wiraswasta"),
    teleponOrtu,
    domisili,
    asrama,
    statusSiswa: "Aktif",
    beasiswa: "-",
    catatanBK: keterangan !== "-" ? keterangan : "Siswa baru terdaftar pada Buku Induk Digital TA 2024/2025.",
    berkas: {
      aktaKelahiran: akta,
      kartuKeluarga: kk,
      ijazahSD: ijazah,
      suratPerjanjian: perjanjian
    }
  };

  appData.students.unshift(newStudent);
  appData.stats.totalSiswa += 1;
  if (jk === "L") appData.stats.siswaLaki += 1;
  else appData.stats.siswaPerempuan += 1;

  if (domisili.includes("Mukim")) appData.stats.siswaMukim += 1;
  else appData.stats.siswaNonMukim += 1;

  saveAppData(appData);
  filterAndRenderStudents();
  populateRaporStudentSelect();
  renderDashboard();
  closeAddStudentModal();
  document.getElementById("form-new-student")?.reset();
  showToast(`Siswa "${nama}" berhasil ditambahkan ke Buku Induk!`);
}

/* ========================================================
   MODUL INTEGRASI EXCEL (SHEETJS): EXPORT & IMPORT
   SESUAI DENGAN 34 KOLOM RESMI BUKU INDUK / EMIS KEMENAG
   ======================================================== */

let parsedImportedStudents = [];

/**
 * BI-02 Export Data Siswa ke Berkas Asli Excel (.xlsx) dengan 34 Kolom Resmi
 */
async function exportStudentsToExcel() {
  if (typeof XLSX === "undefined") {
    alert("Pustaka SheetJS belum selesai dimuat dari CDN. Silakan periksa koneksi internet Anda.");
    return;
  }

  // Jika terhubung ke Backend Server, pastikan data sinkron sebelum ekspor
  if (window.SIDASI_API && window.SIDASI_API.isOnline()) {
    try {
      const serverData = await window.SIDASI_API.fetchData();
      if (serverData && Array.isArray(serverData.students)) {
        appData.students = serverData.students;
      }
    } catch (e) {
      console.warn("Sinkronisasi backend sebelum ekspor tertunda:", e);
    }
  }

  const list = appData.students || [];
  if (list.length === 0) {
    alert("Tidak ada data siswa untuk diekspor!");
    return;
  }

  // Siapkan baris data dengan susunan 34 kolom persis format EMIS Buku Induk
  const rows = list.map((s, idx) => ({
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

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Atur lebar 34 kolom yang proporsional dan rapi
  worksheet["!cols"] = [
    { wch: 6 },  // NO
    { wch: 15 }, // NISN
    { wch: 15 }, // NIS
    { wch: 20 }, // NIK SISWA
    { wch: 32 }, // NAMA SISWA
    { wch: 18 }, // TEMPAT LAHIR
    { wch: 18 }, // TANGGAL LAHIR
    { wch: 6 },  // JK
    { wch: 12 }, // KELAS
    { wch: 15 }, // TINGKAT KELAS
    { wch: 12 }, // AGAMA
    { wch: 14 }, // JML SAUDARA
    { wch: 20 }, // NIK IBU
    { wch: 26 }, // NAMA AYAH
    { wch: 20 }, // NIK AYAH
    { wch: 20 }, // PEKERJAAN AYAH
    { wch: 18 }, // PENDIDIKAN AYAH
    { wch: 20 }, // PENGHASILAN AYAH
    { wch: 26 }, // NAMA IBU
    { wch: 20 }, // PEKERJAAN IBU
    { wch: 20 }, // PENGHASILAN IBU
    { wch: 35 }, // ALAMAT
    { wch: 12 }, // RT/RW
    { wch: 18 }, // KELURAHAN
    { wch: 18 }, // KECAMATAN
    { wch: 18 }, // KABUPATEN
    { wch: 28 }, // NAMA SEKOLAH ASAL
    { wch: 14 }, // NPSN
    { wch: 18 }, // KELOMPOK
    { wch: 18 }, // KEBUTUHAN
    { wch: 22 }, // NO. PESERTA UJIAN
    { wch: 24 }, // NO. IJAZAH
    { wch: 28 }, // KETERANGAN
    { wch: 24 }  // TANGGAL MASUK MADRASAH
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Buku_Induk_Siswa");

  const currentTA = (appData.academicYears || []).find(a => a.id === appData.activeAcademicYearId);
  const taLabel = currentTA ? currentTA.label.replace(/[^a-zA-Z0-9]/g, '_') : 'Aktif';
  const filename = `Buku_Induk_Siswa_MTs_Al-Fadlliyah_${taLabel}_${new Date().toISOString().slice(0, 10)}.xlsx`;

  XLSX.writeFile(workbook, filename);
  showToast(`Berkas Excel 34 Kolom berhasil diunduh: ${filename}`);
}

/**
 * Unduh Template Resmi Excel dengan 34 Kolom Persis Header Pengguna
 */
function downloadStudentExcelTemplate() {
  if (typeof XLSX === "undefined") {
    alert("Pustaka SheetJS belum selesai dimuat dari CDN.");
    return;
  }

  const sampleRows = [
    {
      "NO": 1,
      "NISN": "0098432190",
      "NIS": "242507001",
      "NIK SISWA": "3206231405090001",
      "NAMA SISWA": "Muhammad Rayhan Al-Ghifari",
      "TEMPAT LAHIR": "Tasikmalaya",
      "TANGGAL LAHIR": "14 Mei 2011",
      "JK": "L",
      "KELAS": "VII-A",
      "TINGKAT KELAS": "VII",
      "AGAMA": "Islam",
      "JML SAUDARA": 2,
      "NIK IBU": "3206234502800001",
      "NAMA AYAH": "H. Dani Ramdani",
      "NIK AYAH": "3206230101780002",
      "PEKERJAAN AYAH": "Wiraswasta",
      "PENDIDIKAN AYAH": "S1",
      "PENGHASILAN AYAH": "Rp 4.000.000",
      "NAMA IBU": "Hj. Imas Masitoh",
      "PEKERJAAN IBU": "Ibu Rumah Tangga",
      "PENGHASILAN IBU": "Tidak Ada",
      "ALAMAT": "Kp. Babakan Salam No. 12",
      "RT/RW": "003/004",
      "KELURAHAN": "Cikunten",
      "KECAMATAN": "Singaparna",
      "KABUPATEN": "Tasikmalaya",
      "NAMA SEKOLAH ASAL": "MI Al-Fadlliyah",
      "NPSN": "60728901",
      "KELOMPOK": "Unggulan Tahfidz",
      "KEBUTUHAN": "Tidak Ada",
      "NO. PESERTA UJIAN": "24-02-12-0012",
      "NO. IJAZAH": "DN-02/D-MI/13/0012345",
      "KETERANGAN": "Hafal Al-Qur'an Juz 30",
      "TANGGAL MASUK MADRASAH": "15 Juli 2024"
    },
    {
      "NO": 2,
      "NISN": "0098712344",
      "NIS": "242507002",
      "NIK SISWA": "3206235608100002",
      "NAMA SISWA": "Nabila Nur Az-Zahra",
      "TEMPAT LAHIR": "Garut",
      "TANGGAL LAHIR": "16 Agustus 2011",
      "JK": "P",
      "KELAS": "VII-A",
      "TINGKAT KELAS": "VII",
      "AGAMA": "Islam",
      "JML SAUDARA": 3,
      "NIK IBU": "3206234809820003",
      "NAMA AYAH": "Drs. H. Maman Suratman",
      "NIK AYAH": "3206231204750001",
      "PEKERJAAN AYAH": "PNS Guru",
      "PENDIDIKAN AYAH": "S2",
      "PENGHASILAN AYAH": "Rp 5.500.000",
      "NAMA IBU": "Hj. Siti Rohmah",
      "PEKERJAAN IBU": "PNS",
      "PENGHASILAN IBU": "Rp 4.500.000",
      "ALAMAT": "Jl. Raya Singaparna Barat No. 89",
      "RT/RW": "001/002",
      "KELURAHAN": "Singaparna",
      "KECAMATAN": "Singaparna",
      "KABUPATEN": "Tasikmalaya",
      "NAMA SEKOLAH ASAL": "SDN 1 Singaparna",
      "NPSN": "20268412",
      "KELOMPOK": "Reguler",
      "KEBUTUHAN": "Tidak Ada",
      "NO. PESERTA UJIAN": "24-02-12-0013",
      "NO. IJAZAH": "DN-02/D-SD/13/0067890",
      "KETERANGAN": "Peringkat 1 Kelas VI SD",
      "TANGGAL MASUK MADRASAH": "15 Juli 2024"
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleRows);

  worksheet["!cols"] = [
    { wch: 6 },  // NO
    { wch: 15 }, // NISN
    { wch: 15 }, // NIS
    { wch: 20 }, // NIK SISWA
    { wch: 32 }, // NAMA SISWA
    { wch: 18 }, // TEMPAT LAHIR
    { wch: 18 }, // TANGGAL LAHIR
    { wch: 6 },  // JK
    { wch: 12 }, // KELAS
    { wch: 15 }, // TINGKAT KELAS
    { wch: 12 }, // AGAMA
    { wch: 14 }, // JML SAUDARA
    { wch: 20 }, // NIK IBU
    { wch: 26 }, // NAMA AYAH
    { wch: 20 }, // NIK AYAH
    { wch: 20 }, // PEKERJAAN AYAH
    { wch: 18 }, // PENDIDIKAN AYAH
    { wch: 20 }, // PENGHASILAN AYAH
    { wch: 26 }, // NAMA IBU
    { wch: 20 }, // PEKERJAAN IBU
    { wch: 20 }, // PENGHASILAN IBU
    { wch: 35 }, // ALAMAT
    { wch: 12 }, // RT/RW
    { wch: 18 }, // KELURAHAN
    { wch: 18 }, // KECAMATAN
    { wch: 18 }, // KABUPATEN
    { wch: 28 }, // NAMA SEKOLAH ASAL
    { wch: 14 }, // NPSN
    { wch: 18 }, // KELOMPOK
    { wch: 18 }, // KEBUTUHAN
    { wch: 22 }, // NO. PESERTA UJIAN
    { wch: 24 }, // NO. IJAZAH
    { wch: 28 }, // KETERANGAN
    { wch: 24 }  // TANGGAL MASUK MADRASAH
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Format_Data_Siswa");

  XLSX.writeFile(workbook, "Template_Import_Siswa_MTs_Al-Fadlliyah_34_Kolom.xlsx");
  showToast("Template Excel resmi 34 kolom berhasil diunduh!");
}

/**
 * Buka Modal Import Excel
 */
function openImportExcelModal() {
  parsedImportedStudents = [];
  const modal = document.getElementById("modal-import-excel");
  if (!modal) return;

  const fileInput = document.getElementById("input-excel-file");
  if (fileInput) fileInput.value = "";

  const infoEl = document.getElementById("excel-file-info");
  if (infoEl) {
    infoEl.innerHTML = `
      <p class="text-xs font-bold text-slate-800">Klik untuk memilih berkas atau seret berkas ke sini</p>
      <p class="text-[11px] text-slate-400">Mendukung format Microsoft Excel (.xlsx, .xls) dengan 34 kolom resmi EMIS atau format bebas</p>
    `;
  }

  const prevContainer = document.getElementById("import-preview-container");
  if (prevContainer) prevContainer.classList.add("hidden");

  const btnImport = document.getElementById("btn-execute-import");
  if (btnImport) {
    btnImport.disabled = true;
    const btnLabel = document.getElementById("btn-execute-import-label");
    if (btnLabel) btnLabel.textContent = "Pilih Berkas Dulu";
  }

  modal.classList.remove("hidden");
  lucide.createIcons();
}

/**
 * Tutup Modal Import Excel & Reset Input State
 */
function closeImportExcelModal() {
  const modal = document.getElementById("modal-import-excel");
  if (modal) modal.classList.add("hidden");
  parsedImportedStudents = [];

  const btnImport = document.getElementById("btn-execute-import");
  const btnLabel = document.getElementById("btn-execute-import-label");
  if (btnImport) btnImport.disabled = true;
  if (btnLabel) btnLabel.textContent = "Pilih Berkas Dulu";

  const fileInput = document.getElementById("input-excel-file");
  if (fileInput) fileInput.value = "";

  const prevContainer = document.getElementById("import-preview-container");
  if (prevContainer) prevContainer.classList.add("hidden");
}

/**
 * Helper: Mencari Nilai Sel dari Berbagai Kemungkinan Nama Kolom Excel
 */
function findExcelValue(row, targets) {
  const keys = Object.keys(row);
  for (const k of keys) {
    const cleanKey = k.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const target of targets) {
      const cleanTarget = target.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleanKey === cleanTarget || cleanKey.includes(cleanTarget)) {
        const val = row[k];
        if (val !== undefined && val !== null && String(val).trim() !== "") {
          return val;
        }
      }
    }
  }
  return "";
}

/**
 * Helper: Parsing Tanggal dari Nilai Excel (baik serial angka maupun string)
 */
function parseExcelDate(val) {
  if (!val) return "01 Januari 2011";
  if (typeof val === "number") {
    // Tanggal serial Excel (hari semenjak 1899-12-30)
    const utcDays = Math.floor(val - 25569);
    const date = new Date(utcDays * 86400 * 1000);
    if (!isNaN(date.getTime())) {
      const day = date.getDate();
      const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
      return `${day} ${months[date.getMonth()]} ${date.getFullYear()}`;
    }
  }
  if (val instanceof Date && !isNaN(val.getTime())) {
    const day = val.getDate();
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    return `${day} ${months[val.getMonth()]} ${val.getFullYear()}`;
  }
  return String(val).trim();
}

/**
 * Membaca dan Mem-parsing Berkas Excel yang Dipilih Pengguna (Mendukung 34 Kolom Lengkap)
 */
function handleExcelFileSelect(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  if (typeof XLSX === "undefined") {
    alert("Pustaka SheetJS belum tersedia. Pastikan terhubung internet.");
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array', cellDates: true });
      
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

      if (!rawRows || rawRows.length === 0) {
        alert("Lembar kerja Excel kosong atau tidak terbaca!");
        return;
      }

      // Normalisasi setiap baris ke struktur data 34 field
      const validStudents = [];
      rawRows.forEach((r, idx) => {
        const rawNama = findExcelValue(r, ["nama siswa", "nama lengkap siswa", "nama lengkap", "nama", "student name"]);
        if (!rawNama || String(rawNama).trim() === "") return; // Lewati baris tanpa nama

        const nama = String(rawNama).trim();
        const nisn = String(findExcelValue(r, ["nisn", "nomor induk siswa nasional", "no nisn", "nomor nisn"])).trim() || `00${Date.now().toString().slice(-8)}`;
        const nis = String(findExcelValue(r, ["nis", "nomor induk siswa", "no induk", "nomor induk", "nis madrasah"])).trim() || `2425${String(idx + 1).padStart(4, '0')}`;
        const nik = String(findExcelValue(r, ["nik siswa", "nik", "nomor induk kependudukan", "no nik", "nomor nik", "no ktp"])).trim() || `3206${Date.now().toString().slice(-12)}`;

        // Jenis Kelamin
        const rawJk = String(findExcelValue(r, ["jk", "jenis kelamin", "l/p", "gender", "kelamin", "sex"])).trim().toLowerCase();
        let jk = "L";
        if (rawJk.startsWith("p") || rawJk.includes("perempuan") || rawJk.includes("wanita") || rawJk === "f") {
          jk = "P";
        }

        // Tingkat & Rombel (KELAS & TINGKAT KELAS)
        const rawTingkat = String(findExcelValue(r, ["tingkat kelas", "tingkat", "fase", "grade"])).trim().toUpperCase();
        let tingkat = "VII";
        if (rawTingkat.includes("IX") || rawTingkat.includes("9")) tingkat = "IX";
        else if (rawTingkat.includes("VIII") || rawTingkat.includes("8")) tingkat = "VIII";
        else if (rawTingkat.includes("VII") || rawTingkat.includes("7")) tingkat = "VII";

        let rombel = String(findExcelValue(r, ["kelas", "rombongan belajar", "rombel", "ruang"])).trim();
        if (!rombel) rombel = `${tingkat}-A`;

        // Tempat & Tanggal Lahir
        const tempatLahir = String(findExcelValue(r, ["tempat lahir", "tmplahir", "tempat", "kota lahir"])).trim() || "-";
        const rawTglLahir = findExcelValue(r, ["tanggal lahir", "tgllahir", "tgl lahir", "tgl"]);
        const tanggalLahir = parseExcelDate(rawTglLahir);

        // Agama & Jumlah Saudara
        const agama = String(findExcelValue(r, ["agama", "religion"])).trim() || "Islam";
        const jmlSaudara = String(findExcelValue(r, ["jml saudara", "jumlah saudara", "saudara", "jml saudara kandung"])).trim() || "0";

        // Orang Tua Kandung & Wali
        const nikIbu = String(findExcelValue(r, ["nik ibu", "nik ibu kandung", "no nik ibu"])).trim() || "-";
        const namaAyah = String(findExcelValue(r, ["nama ayah", "nama ayah / wali", "nama wali", "ayah", "wali", "nama orang tua"])).trim() || "-";
        const nikAyah = String(findExcelValue(r, ["nik ayah", "nik ayah kandung", "no nik ayah"])).trim() || "-";
        const pekerjaanAyah = String(findExcelValue(r, ["pekerjaan ayah", "pekerjaan ayah kandung", "pekerjaan orang tua", "pekerjaan ortu", "pekerjaan"])).trim() || "-";
        const pendidikanAyah = String(findExcelValue(r, ["pendidikan ayah", "pendidikan ayah kandung", "pendidikan"])).trim() || "-";
        const penghasilanAyah = String(findExcelValue(r, ["penghasilan ayah", "penghasilan ayah kandung", "penghasilan"])).trim() || "-";

        const namaIbu = String(findExcelValue(r, ["nama ibu", "nama ibu kandung", "ibu"])).trim() || "-";
        const pekerjaanIbu = String(findExcelValue(r, ["pekerjaan ibu", "pekerjaan ibu kandung"])).trim() || "-";
        const penghasilanIbu = String(findExcelValue(r, ["penghasilan ibu", "penghasilan ibu kandung"])).trim() || "-";
        const teleponOrtu = String(findExcelValue(r, ["telepon wali", "telepon ortu", "telepon", "no hp", "no telepon", "nomor telepon", "whatsapp", "no wa"])).trim() || "-";

        // Alamat Domisili Siswa
        const alamat = String(findExcelValue(r, ["alamat", "alamat lengkap", "alamat rumah", "domisili siswa"])).trim() || "-";
        const rtRw = String(findExcelValue(r, ["rt/rw", "rt rw", "rt", "rw"])).trim() || "-";
        const kelurahan = String(findExcelValue(r, ["kelurahan", "desa", "kelurahan / desa", "kelurahan/desa"])).trim() || "-";
        const kecamatan = String(findExcelValue(r, ["kecamatan"])).trim() || "-";
        const kabupaten = String(findExcelValue(r, ["kabupaten", "kabupaten / kota", "kabupaten/kota", "kota"])).trim() || "-";

        // Riwayat Sekolah Asal & Ijazah
        const sekolahAsal = String(findExcelValue(r, ["nama sekolah asal", "sekolah asal", "madrasah asal", "sd/mi asal", "asal sekolah"])).trim() || "-";
        const npsnAsal = String(findExcelValue(r, ["npsn", "npsn asal", "npsn sekolah asal"])).trim() || "-";
        const kelompok = String(findExcelValue(r, ["kelompok", "program", "program belajar", "kelompok belajar"])).trim() || "Reguler";
        const kebutuhan = String(findExcelValue(r, ["kebutuhan", "kebutuhan khusus", "disabilitas"])).trim() || "Tidak Ada";
        const noUjian = String(findExcelValue(r, ["no. peserta ujian", "no peserta ujian", "nomor peserta ujian", "no ujian"])).trim() || "-";
        const noIjazah = String(findExcelValue(r, ["no. ijazah", "no ijazah", "nomor ijazah", "no seri ijazah"])).trim() || "-";
        const keterangan = String(findExcelValue(r, ["keterangan", "ket", "catatan", "catatan bk"])).trim() || "-";
        const rawTanggalMasuk = findExcelValue(r, ["tanggal masuk madrasah", "tanggal masuk", "tgl masuk", "masuk madrasah", "tgl masuk madrasah"]);
        const tanggalMasuk = rawTanggalMasuk ? parseExcelDate(rawTanggalMasuk) : "15 Juli 2024";

        // Domisili Santri & Asrama
        const rawDomisili = String(findExcelValue(r, ["status domisili", "domisili", "status santri", "mukim"])).trim().toLowerCase();
        let domisili = "Non-Mukim";
        if (rawDomisili.includes("mukim") || rawDomisili.includes("pondok") || rawDomisili.includes("santri") || rawDomisili.includes("asrama")) {
          domisili = "Mukim (Pondok)";
        }
        const asrama = String(findExcelValue(r, ["kamar asrama", "asrama", "kamar", "kobong"])).trim() || "-";

        // Status Kelengkapan Berkas Fisik
        const rawAkta = String(findExcelValue(r, ["akta kelahiran", "akta"])).toLowerCase();
        const rawKk = String(findExcelValue(r, ["kartu keluarga", "kk"])).toLowerCase();
        const rawIjazah = String(findExcelValue(r, ["ijazah sd/mi", "ijazah"])).toLowerCase();
        const rawPerjanjian = String(findExcelValue(r, ["surat perjanjian santri", "surat perjanjian", "perjanjian"])).toLowerCase();

        const isTrueVal = (v) => v === "1" || v === "ya" || v === "lengkap" || v === "ada" || v === "true";

        const berkas = {
          aktaKelahiran: rawAkta ? isTrueVal(rawAkta) : true,
          kartuKeluarga: rawKk ? isTrueVal(rawKk) : true,
          ijazahSD: rawIjazah ? isTrueVal(rawIjazah) : true,
          suratPerjanjian: rawPerjanjian ? isTrueVal(rawPerjanjian) : true
        };

        const beasiswa = String(findExcelValue(r, ["program beasiswa", "beasiswa", "bantuan"])).trim() || "-";
        const statusSiswa = String(findExcelValue(r, ["status keaktifan", "status siswa", "status"])).trim() || "Aktif";
        const catatanBK = keterangan !== "-" ? keterangan : (String(findExcelValue(r, ["catatan bk / prestasi", "catatan bk", "catatan", "prestasi"])).trim() || "Data diimpor dari berkas Excel.");

        validStudents.push({
          id: `SIS-EXCEL-${Date.now().toString().slice(-4)}-${String(idx + 1).padStart(3, '0')}`,
          nisn,
          nis,
          nik,
          nama,
          jk,
          tingkat,
          rombel,
          tempatLahir,
          tanggalLahir,
          agama,
          jmlSaudara,
          nikIbu,
          namaAyah,
          nikAyah,
          pekerjaanAyah,
          pendidikanAyah,
          penghasilanAyah,
          namaIbu,
          pekerjaanIbu,
          penghasilanIbu,
          alamat,
          rtRw,
          kelurahan,
          kecamatan,
          kabupaten,
          sekolahAsal,
          npsnAsal,
          kelompok,
          kebutuhan,
          noUjian,
          noIjazah,
          keterangan,
          tanggalMasuk,
          domisili,
          asrama,
          statusSiswa,
          pekerjaanOrtu: pekerjaanAyah !== "-" ? pekerjaanAyah : (pekerjaanIbu !== "-" ? pekerjaanIbu : "Wiraswasta"),
          teleponOrtu,
          beasiswa,
          catatanBK,
          berkas
        });
      });

      if (validStudents.length === 0) {
        alert("Tidak ditemukan baris data siswa yang valid dalam berkas Excel ini. Pastikan berkas memiliki kolom nama siswa.");
        return;
      }

      parsedImportedStudents = validStudents;

      // Update Tampilan Info File
      const infoEl = document.getElementById("excel-file-info");
      if (infoEl) {
        infoEl.innerHTML = `
          <p class="text-xs font-extrabold text-emerald-800">${file.name}</p>
          <p class="text-[11px] text-slate-500 font-medium">${(file.size / 1024).toFixed(1)} KB • Sheet: "${firstSheetName}"</p>
        `;
      }

      // Update Ringkasan Preview
      const summaryText = document.getElementById("preview-summary-text");
      if (summaryText) summaryText.textContent = `Pratinjau Data: ${validStudents.length} Siswa Terbaca`;
      const badgeCount = document.getElementById("preview-badge-count");
      if (badgeCount) badgeCount.textContent = `${validStudents.length} Siswa Siap Impor`;

      // Render 5 Sampel Baris Pertama
      const tbody = document.getElementById("import-preview-tbody");
      if (tbody) {
        tbody.innerHTML = validStudents.slice(0, 5).map((s, idx) => `
          <tr class="hover:bg-slate-50 transition-colors">
            <td class="py-2 px-3 font-mono font-bold text-slate-500">${idx + 1}</td>
            <td class="py-2 px-3 font-mono text-slate-700 whitespace-nowrap">${s.nisn}</td>
            <td class="py-2 px-3 font-bold text-slate-900 whitespace-nowrap">${s.nama}</td>
            <td class="py-2 px-3 text-center whitespace-nowrap">
              <span class="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${s.jk === 'L' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'}">
                ${s.jk}
              </span>
            </td>
            <td class="py-2 px-3 text-center font-bold text-emerald-800 whitespace-nowrap">${s.tingkat}</td>
            <td class="py-2 px-3 font-bold text-slate-700 whitespace-nowrap">${s.rombel}</td>
            <td class="py-2 px-3 text-slate-600 whitespace-nowrap">${s.domisili}</td>
            <td class="py-2 px-3 text-slate-500 text-[10px] whitespace-nowrap">${s.namaAyah} (${s.teleponOrtu})</td>
          </tr>
        `).join("");
      }

      // Tampilkan area pratinjau & aktifkan tombol eksekusi
      const prevContainer = document.getElementById("import-preview-container");
      if (prevContainer) prevContainer.classList.remove("hidden");

      const btnImport = document.getElementById("btn-execute-import");
      if (btnImport) {
        btnImport.disabled = false;
        const btnLabel = document.getElementById("btn-execute-import-label");
        if (btnLabel) btnLabel.textContent = `Konfirmasi & Impor ${validStudents.length} Siswa`;
      }

      lucide.createIcons();
    } catch (err) {
      console.error("Gagal membaca berkas Excel:", err);
      alert("Terjadi kesalahan saat memproses berkas Excel: " + err.message);
    }
  };
  reader.readAsArrayBuffer(file);
}

/**
 * Eksekusi Penyimpanan Siswa Hasil Impor ke Basis Data Lokal & Backend Server
 */
async function executeExcelImport() {
  if (!parsedImportedStudents || parsedImportedStudents.length === 0) {
    alert("Tidak ada data siswa yang siap diimpor!");
    return;
  }

  const count = parsedImportedStudents.length;
  const btnImport = document.getElementById("btn-execute-import");
  const btnLabel = document.getElementById("btn-execute-import-label");

  // Status visual tombol saat proses simpan
  if (btnImport) btnImport.disabled = true;
  if (btnLabel) btnLabel.textContent = "⏳ Menyimpan & Menyinkronkan...";

  try {
    const modeRadio = document.querySelector('input[name="import-mode"]:checked');
    const mode = modeRadio ? modeRadio.value : "append";

    if (mode === "replace") {
      const ok = confirm(`Perhatian: Anda memilih opsi TIMPA. Seluruh data siswa yang ada saat ini (${appData.students ? appData.students.length : 0} siswa) akan digantikan penuh oleh ${count} siswa dari berkas Excel. Lanjutkan?`);
      if (!ok) {
        if (btnImport) btnImport.disabled = false;
        if (btnLabel) btnLabel.textContent = `Konfirmasi & Impor ${count} Siswa`;
        return;
      }
      appData.students = [...parsedImportedStudents];
    } else {
      // Mode Tambahkan (Append)
      const existingIds = new Set((appData.students || []).map(s => s.id));
      const newItems = parsedImportedStudents.filter(s => !existingIds.has(s.id));
      appData.students = [...newItems, ...(appData.students || [])];
    }

    // Daftarkan rombel baru secara otomatis jika belum ada dalam daftar rombel
    if (!appData.rombelList) appData.rombelList = [];
    parsedImportedStudents.forEach(s => {
      if (s.rombel && !appData.rombelList.some(r => r.kode === s.rombel || r.nama === s.rombel)) {
        const rombelUpper = s.rombel.toUpperCase();
        let autoTingkat = s.tingkat;
        if (!autoTingkat || autoTingkat === "VII") {
          if (rombelUpper.includes("IX") || rombelUpper.includes("9")) autoTingkat = "IX";
          else if (rombelUpper.includes("VIII") || rombelUpper.includes("8")) autoTingkat = "VIII";
          else autoTingkat = "VII";
        }

        appData.rombelList.push({
          id: `RMB-EXCEL-${Date.now().toString().slice(-4)}-${appData.rombelList.length + 1}`,
          tingkat: autoTingkat,
          kode: s.rombel,
          nama: s.rombel,
          wali: "Wali Kelas Terpilih",
          kapasitas: 36,
          terisi: 1,
          fokus: "Reguler"
        });
      }
    });

    // Rekalkulasi statistik kesiswaan dan sinkronisasi tahun ajaran aktif
    recalculateStudentStats();

    // Simpan ke storage lokal
    saveAppData(appData);

    let backendSynced = false;
    let targetPort = 9090;
    if (window.SIDASI_API && window.SIDASI_API.isOnline()) {
      try {
        targetPort = window.SIDASI_API.getPort() || 9090;
        // 1. Panggil endpoint resmi import siswa backend
        await window.SIDASI_API.importStudents(parsedImportedStudents, mode);
        // 2. Sinkronkan juga seluruh dataset database utuh agar stats & rombel presisi
        await window.SIDASI_API.syncData(appData, true);
        backendSynced = true;
      } catch (e) {
        console.warn("Sinkronisasi langsung import ke backend tertunda:", e);
      }
    }

    // Perbarui antarmuka pengguna
    filterAndRenderStudents();
    populateRaporStudentSelect();
    renderDashboard();
    populateRombelDropdown();
    if (typeof renderRombelList === "function") renderRombelList();

    // Tutup modal impor terlebih dahulu agar pengguna tidak menunggu di form
    closeImportExcelModal();

    // Berikan pemberitahuan tegas & jelas
    if (backendSynced) {
      showToast(`🟢 Sukses! ${count} data siswa berhasil disimpan & tersinkron.`);
      alert(`✅ PENYIMPANAN & SINKRONISASI SELESAI!\n\nSebanyak ${count} data siswa telah berhasil diimpor dan disinkronkan ke:\n• Basis Data Server Backend (Port ${targetPort})\n• Basis Data Lokal Peramban (Local Storage)\n\nFormulir telah ditutup. Tabel data siswa dan dashboard kini menampilkan data terbaru.`);
    } else {
      showToast(`Sukses! ${count} data siswa berhasil diimpor ke sistem.`);
      alert(`✅ PENYIMPANAN SELESAI!\n\nSebanyak ${count} data siswa telah berhasil disimpan ke Basis Data Lokal.\n\nFormulir telah ditutup dan tabel data siswa telah diperbarui.`);
    }

  } catch (err) {
    console.error("Gagal saat eksekusi impor siswa:", err);
    alert(`❌ Terjadi kendala saat menyimpan data: ${err.message}`);
    closeImportExcelModal();
  } finally {
    if (btnImport) btnImport.disabled = false;
    if (btnLabel) btnLabel.textContent = "Simpan & Impor ke Basis Data";
  }
}

/**
 * Rekalkulasi Statistik Siswa Otomatis Berdasarkan Data Nyata
 */
function recalculateStudentStats() {
  if (!appData.stats) appData.stats = {};
  const allStudents = appData.students || [];
  const activeStudents = allStudents.filter(s => s.statusSiswa === "Aktif");

  const total = activeStudents.length;
  const laki = activeStudents.filter(s => s.jk === "L").length;
  const perempuan = activeStudents.filter(s => s.jk === "P").length;
  const mukim = activeStudents.filter(s => s.domisili && s.domisili.includes("Mukim")).length;
  const nonMukim = total - mukim;

  const berkasKurang = activeStudents.filter(s => !s.berkas || !s.berkas.aktaKelahiran || !s.berkas.kartuKeluarga || !s.berkas.ijazahSD || !s.berkas.suratPerjanjian).length;
  const validNikNisnCount = activeStudents.filter(s => {
    const nikOk = s.nik && String(s.nik).trim().length === 16;
    const nisnOk = s.nisn && String(s.nisn).trim().length === 10;
    return nikOk && nisnOk;
  }).length;
  const persenValidasi = total > 0 ? Math.round((validNikNisnCount / total) * 100) : 0;
  const penerimaBeasiswa = Math.max(
    activeStudents.filter(s => s.beasiswa && s.beasiswa !== "-" && s.beasiswa !== "Tidak Ada").length,
    (appData.beasiswaList || []).length
  );
  const allMutations = appData.mutations || [];
  const mutasiMasuk = allMutations.filter(m => m.jenis && m.jenis.includes("Masuk")).length;
  const mutasiKeluar = allMutations.filter(m => m.jenis && m.jenis.includes("Keluar")).length;
  const mutasiBulanIni = allMutations.length;

  appData.stats.totalSiswa = total;
  appData.stats.siswaLaki = laki;
  appData.stats.siswaPerempuan = perempuan;
  appData.stats.siswaMukim = mukim;
  appData.stats.siswaNonMukim = nonMukim;
  appData.stats.berkasKurang = berkasKurang;
  appData.stats.persenValidasi = persenValidasi;
  appData.stats.penerimaBeasiswa = penerimaBeasiswa;
  appData.stats.mutasiMasuk = mutasiMasuk;
  appData.stats.mutasiKeluar = mutasiKeluar;
  appData.stats.mutasiBulanIni = mutasiBulanIni;

  // Sinkronkan ke yearlyData tahun akademik saat ini
  if (appData.yearlyData && appData.activeAcademicYearId) {
    if (!appData.yearlyData[appData.activeAcademicYearId]) {
      appData.yearlyData[appData.activeAcademicYearId] = {};
    }
    appData.yearlyData[appData.activeAcademicYearId].students = JSON.parse(JSON.stringify(appData.students));
    appData.yearlyData[appData.activeAcademicYearId].stats = JSON.parse(JSON.stringify(appData.stats));
    if (appData.rombelList) {
      appData.yearlyData[appData.activeAcademicYearId].rombelList = JSON.parse(JSON.stringify(appData.rombelList));
    }
  }
}

/* ========================================================
   MODUL 3: MANAJEMEN MUTASI SISWA (MS-01 S/D MS-03)
   ======================================================== */
function filterMutationTab(type) {
  currentMutationFilter = type;
  
  // Update button active states
  const btnAll = document.getElementById("mut-tab-all");
  const btnMasuk = document.getElementById("mut-tab-masuk");
  const btnKeluar = document.getElementById("mut-tab-keluar");

  [btnAll, btnMasuk, btnKeluar].forEach(btn => {
    if (btn) {
      btn.className = "px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200";
    }
  });

  if (type === "ALL" && btnAll) {
    btnAll.className = "px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white";
  } else if (type === "Mutasi Masuk" && btnMasuk) {
    btnMasuk.className = "px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white";
  } else if (type === "Mutasi Keluar" && btnKeluar) {
    btnKeluar.className = "px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white";
  }

  renderMutations();
}

function renderMutations() {
  const allMutations = appData.mutations || [];
  const countMasuk = allMutations.filter(m => m.jenis && m.jenis.includes("Masuk")).length;
  const countKeluar = allMutations.filter(m => m.jenis && m.jenis.includes("Keluar")).length;
  const countAll = allMutations.length;

  // 1. Update Teks Tombol Filter Kategori Mutasi dengan Angka Real-Time
  const btnAll = document.getElementById("mut-tab-all");
  const btnMasuk = document.getElementById("mut-tab-masuk");
  const btnKeluar = document.getElementById("mut-tab-keluar");
  if (btnAll) btnAll.textContent = `Semua (${countAll})`;
  if (btnMasuk) btnMasuk.textContent = `Masuk (${countMasuk})`;
  if (btnKeluar) btnKeluar.textContent = `Keluar (${countKeluar})`;

  // 2. Update 3 Kartu Metrik Mutasi Semester Berjalan
  const elStatMasuk = document.getElementById("mut-stat-masuk");
  const elStatMasukSub = document.getElementById("mut-stat-masuk-sub");
  const elStatKeluar = document.getElementById("mut-stat-keluar");
  const elStatKeluarSub = document.getElementById("mut-stat-keluar-sub");
  const elStatKuota = document.getElementById("mut-stat-kuota");
  const elStatKuotaSub = document.getElementById("mut-stat-kuota-sub");

  if (elStatMasuk) elStatMasuk.textContent = `${countMasuk} Siswa`;
  if (elStatMasukSub) elStatMasukSub.textContent = countMasuk > 0 ? "Asal SMP/MTs Jawa Barat" : "Belum ada mutasi masuk";

  if (elStatKeluar) elStatKeluar.textContent = `${countKeluar} Siswa`;
  if (elStatKeluarSub) elStatKeluarSub.textContent = countKeluar > 0 ? "Siswa pindah madrasah" : "Belum ada mutasi keluar";

  const totalKapasitas = (appData.rombelSummary || []).reduce((acc, r) => acc + (r.kapasitas || 0), 0);
  const totalSiswa = (appData.students || []).filter(s => s.statusSiswa === "Aktif").length;
  const sisaKursi = Math.max(0, totalKapasitas - totalSiswa);

  if (elStatKuota) elStatKuota.textContent = `${sisaKursi} Kursi`;
  if (elStatKuotaSub) elStatKuotaSub.textContent = totalKapasitas > 0 ? `Dari total kapasitas ${totalKapasitas} kursi` : "Belum ada rombel terdaftar";

  // 3. Filter Daftar Riwayat Berdasarkan Tab Aktif
  let list = allMutations;
  if (currentMutationFilter !== "ALL") {
    list = list.filter(m => m.jenis === currentMutationFilter);
  }

  const tbody = document.getElementById("mutation-table-body");
  if (!tbody) return;

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="py-8 text-center text-slate-400">Belum ada riwayat mutasi siswa tercatat.</td></tr>`;
    
    // Reset Kartu Pratinjau SK di sebelah kanan jika tidak ada mutasi
    if (allMutations.length === 0) {
      const elNo = document.getElementById("sk-preview-no");
      const elNama = document.getElementById("sk-preview-nama");
      const elNisn = document.getElementById("sk-preview-nisn");
      const elKelas = document.getElementById("sk-preview-kelas");
      const elJenis = document.getElementById("sk-preview-jenis");
      const elSekolah = document.getElementById("sk-preview-sekolah");
      const elAlasan = document.getElementById("sk-preview-alasan");
      const elTanggal = document.getElementById("sk-preview-tanggal");

      if (elNo) elNo.textContent = "Nomor: -";
      if (elNama) elNama.textContent = "(Belum ada mutasi tercatat)";
      if (elNisn) elNisn.textContent = "-";
      if (elKelas) elKelas.textContent = "-";
      if (elJenis) elJenis.textContent = "-";
      if (elSekolah) elSekolah.textContent = "-";
      if (elAlasan) elAlasan.textContent = '"-"';
      if (elTanggal) elTanggal.textContent = (appData.institution && appData.institution.tanggalRapor) || "-";
      activeMutationForPreview = null;
      applyInstitutionDataToAllViews();
    }
    return;
  }

  // Jika ada mutasi dan belum ada yang dipilih untuk preview, set ke elemen pertama
  if (!activeMutationForPreview && list.length > 0) {
    activeMutationForPreview = list[0];
    previewMutationSK(list[0].id, false);
  }

  tbody.innerHTML = list.map(m => {
    const isMasuk = m.jenis && m.jenis.includes("Masuk");
    return `
      <tr class="hover:bg-slate-50 transition-colors">
        <td class="py-3 px-3.5 font-mono text-[11px] font-bold text-slate-900 whitespace-nowrap">${m.noSurat || '-'}</td>
        <td class="py-3 px-3.5 whitespace-nowrap">
          <span class="font-bold text-slate-900 block whitespace-nowrap">${m.siswaNama}</span>
          <span class="text-[10px] text-slate-500 font-mono whitespace-nowrap">NISN: ${m.nisn || '-'}</span>
        </td>
        <td class="py-3 px-3.5 whitespace-nowrap">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-extrabold whitespace-nowrap ${isMasuk ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">
            ${m.jenis}
          </span>
        </td>
        <td class="py-3 px-3.5 text-slate-600 whitespace-nowrap">
          <span class="block truncate max-w-[200px] whitespace-nowrap" title="${isMasuk ? m.sekolahAsal : m.sekolahTujuan}">${isMasuk ? m.sekolahAsal : m.sekolahTujuan}</span>
        </td>
        <td class="py-3 px-3.5 text-right whitespace-nowrap">
          <div class="inline-flex items-center space-x-1.5">
            <button onclick="previewMutationSK('${m.id}')" class="px-2.5 py-1 bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 text-slate-700 rounded-lg text-[11px] font-bold transition-colors whitespace-nowrap">
              Review SK
            </button>
            <button onclick="openEditMutationModalById('${m.id}')" title="Edit SK Mutasi" class="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
              <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
            </button>
            <button onclick="deleteMutation('${m.id}')" title="Hapus Berkas Mutasi" class="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");

  lucide.createIcons();
}

function deleteMutation(mutationId) {
  const mut = (appData.mutations || []).find(m => m.id === mutationId);
  if (!mut) return;

  if (confirm(`Apakah Anda yakin ingin menghapus arsip surat mutasi untuk "${mut.siswaNama}" (${mut.noSurat})?`)) {
    appData.mutations = appData.mutations.filter(m => m.id !== mutationId);
    if (activeMutationForPreview && activeMutationForPreview.id === mutationId) {
      activeMutationForPreview = appData.mutations[0] || null;
    }
    // Update stats mutasi
    if (appData.stats) {
      if (mut.jenis && mut.jenis.includes("Masuk") && appData.stats.mutasiMasuk > 0) appData.stats.mutasiMasuk -= 1;
      if (mut.jenis && mut.jenis.includes("Keluar") && appData.stats.mutasiKeluar > 0) appData.stats.mutasiKeluar -= 1;
      if (appData.stats.mutasiBulanIni > 0) appData.stats.mutasiBulanIni -= 1;
    }
    saveAppData(appData);
    renderMutations();
    renderDashboard();
    showToast(`Arsip surat mutasi untuk "${mut.siswaNama}" berhasil dihapus.`);
  }
}

function previewMutationSK(mutationId, triggerToast = true) {
  const mut = (appData.mutations || []).find(m => m.id === mutationId);
  if (!mut) return;

  activeMutationForPreview = mut;

  // Update card preview elements
  const elNo = document.getElementById("sk-preview-no");
  const elNama = document.getElementById("sk-preview-nama");
  const elNisn = document.getElementById("sk-preview-nisn");
  const elKelas = document.getElementById("sk-preview-kelas");
  const elJenis = document.getElementById("sk-preview-jenis");
  const elSekolah = document.getElementById("sk-preview-sekolah");
  const elAlasan = document.getElementById("sk-preview-alasan");
  const elTanggal = document.getElementById("sk-preview-tanggal");
  const elKepala = document.getElementById("sk-preview-kepala-madrasah");
  const elNipKepala = document.getElementById("sk-preview-nip-kepala");
  const elTU = document.getElementById("sk-preview-kepala-tu");
  const elNipTU = document.getElementById("sk-preview-nip-tu");

  const inst = (appData && appData.institution) || {};

  if (elNo) elNo.textContent = `Nomor: ${mut.noSurat || '-'}`;
  if (elNama) elNama.textContent = mut.siswaNama || '-';
  if (elNisn) elNisn.textContent = `${mut.nisn || '-'} / ${mut.nis || '-'}`;
  const rombelDisplay = mut.rombelTujuan && mut.rombelTujuan !== '-' ? `(${mut.rombelTujuan})` : '';
  if (elKelas) elKelas.textContent = `Kelas ${mut.tingkat || '-'} ${rombelDisplay}`.trim();
  if (elJenis) elJenis.textContent = mut.jenis || '-';
  if (elSekolah) elSekolah.textContent = (mut.jenis && mut.jenis.includes("Masuk")) ? (mut.sekolahAsal || '-') : (mut.sekolahTujuan || '-');
  if (elAlasan) elAlasan.textContent = `"${mut.alasan || '-'}"`;
  if (elTanggal) elTanggal.textContent = mut.tanggalSurat || mut.tanggal || '-';

  if (elKepala) elKepala.textContent = mut.pejabatPenandatangan || inst.kepalaMadrasah || 'Drs. H. Ahmad Fadlli, M.Pd.I';
  if (elNipKepala) elNipKepala.textContent = `NIP. ${inst.nipKepala || '196908151994031002'}`;
  if (elTU) elTU.textContent = mut.verifikatorTU || inst.kepalaTU || 'Hj. Siti Rahmawati, S.Pd';
  if (elNipTU) elNipTU.textContent = `NIP. ${inst.nipTU || '197804122005012004'}`;

  // Update Kop & Titimangsa Lembaga pada Dokumen Live Pratinjau SK
  const skKemenag = document.getElementById("sk-preview-kop-kemenag");
  if (skKemenag) {
    const kotaUpper = (inst.kota || 'KABUPATEN TASIKMALAYA').toUpperCase();
    skKemenag.textContent = kotaUpper.startsWith("KANTOR") ? kotaUpper : `KANTOR KEMENTERIAN AGAMA ${kotaUpper}`;
  }
  const skMadrasah = document.getElementById("sk-preview-kop-madrasah");
  if (skMadrasah && inst.name) skMadrasah.textContent = inst.name.toUpperCase();

  const skAlamatNsm = document.getElementById("sk-preview-kop-alamat-nsm");
  if (skAlamatNsm) {
    const parts = [];
    if (inst.alamat && inst.alamat !== "-") parts.push(inst.alamat);
    if (inst.kota) parts.push(inst.kota);
    if (inst.kodePos) parts.push(inst.kodePos);
    let addressStr = parts.join(", ");
    let nsmStr = inst.nsm ? `NSM: ${inst.nsm}` : '';
    let akredStr = inst.statusAkreditasi ? `Akreditasi: ${inst.statusAkreditasi}` : '';
    skAlamatNsm.textContent = [addressStr, nsmStr, akredStr].filter(Boolean).join(" | ");
  }

  const skLead = document.getElementById("sk-preview-lead-inst");
  if (skLead && inst.name) skLead.textContent = `Kepala ${inst.name}`;

  const skKota = document.getElementById("sk-preview-titimangsa-kota");
  if (skKota) skKota.textContent = inst.titimangsaKota || inst.kota || "Singaparna";

  if (triggerToast) {
    showToast(`Pratinjau SK untuk ${mut.siswaNama} dimuat`);
  }
}

function openEditActiveMutationModal() {
  const mut = activeMutationForPreview;
  const tingkatSelect = document.getElementById("mut-edit-tingkat");
  if (tingkatSelect) {
    const list = appData.tingkatList || [
      { kode: "VII", nama: "Kelas VII" },
      { kode: "VIII", nama: "Kelas VIII" },
      { kode: "IX", nama: "Kelas IX" }
    ];
    tingkatSelect.innerHTML = list.map(t => `<option value="${t.kode}">${t.nama || `Kelas ${t.kode}`}</option>`).join("");
  }

  const romanMonth = ["I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII"][new Date().getMonth()];
  const defaultNo = `${String((appData.mutations || []).length + 101).padStart(3, '0')}/MTs.10.06/PP.00.4/${romanMonth}/${new Date().getFullYear()}`;
  const defaultDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  if (mut) {
    document.getElementById("mut-edit-id").value = mut.id || "";
    document.getElementById("mut-edit-no").value = mut.noSurat || defaultNo;
    document.getElementById("mut-edit-tanggal").value = dateToIso(mut.tanggalSurat || mut.tanggal || defaultDate);
    document.getElementById("mut-edit-jenis").value = mut.jenis || "Mutasi Masuk";
    document.getElementById("mut-edit-nama").value = mut.siswaNama || "";
    document.getElementById("mut-edit-nisn").value = mut.nisn || "";
    document.getElementById("mut-edit-nis").value = mut.nis || "";
    if (tingkatSelect) tingkatSelect.value = mut.tingkat || "VII";
    document.getElementById("mut-edit-sekolah-asal").value = mut.sekolahAsal || "";
    document.getElementById("mut-edit-sekolah-tujuan").value = mut.sekolahTujuan || "";
    document.getElementById("mut-edit-alasan").value = mut.alasan || "";
    document.getElementById("mut-edit-kepala").value = mut.pejabatPenandatangan || appData.institution.kepalaMadrasah || "";
    document.getElementById("mut-edit-tu").value = mut.verifikatorTU || appData.institution.kepalaTU || "";
  } else {
    document.getElementById("mut-edit-id").value = "";
    document.getElementById("mut-edit-no").value = defaultNo;
    document.getElementById("mut-edit-tanggal").value = dateToIso(defaultDate) || new Date().toISOString().split("T")[0];
    document.getElementById("mut-edit-jenis").value = "Mutasi Masuk";
    document.getElementById("mut-edit-nama").value = "";
    document.getElementById("mut-edit-nisn").value = "";
    document.getElementById("mut-edit-nis").value = "";
    if (tingkatSelect) tingkatSelect.value = "VII";
    document.getElementById("mut-edit-sekolah-asal").value = "SMP / MTs Asal";
    document.getElementById("mut-edit-sekolah-tujuan").value = appData.institution.name || "MTs Al-Fadlliyah";
    document.getElementById("mut-edit-alasan").value = "Mengikuti kepindahan domisili orang tua dan santri mukim di pondok pesantren";
    document.getElementById("mut-edit-kepala").value = appData.institution.kepalaMadrasah || "";
    document.getElementById("mut-edit-tu").value = appData.institution.kepalaTU || "";
  }

  const modal = document.getElementById("modal-edit-mutation");
  if (modal) modal.classList.remove("hidden");
  if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
}

function openEditMutationModalById(mutationId) {
  const mut = (appData.mutations || []).find(m => m.id === mutationId);
  if (!mut) return;
  activeMutationForPreview = mut;
  previewMutationSK(mut.id, false);
  openEditActiveMutationModal();
}

function closeEditMutationModal() {
  const modal = document.getElementById("modal-edit-mutation");
  if (modal) modal.classList.add("hidden");
}

function handleEditMutationSubmit(e) {
  e.preventDefault();

  const id = document.getElementById("mut-edit-id").value;
  const noSurat = document.getElementById("mut-edit-no").value.trim();
  const rawTglSurat = document.getElementById("mut-edit-tanggal").value.trim();
  const tanggalSurat = rawTglSurat ? isoToIndoDate(rawTglSurat) : new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const jenis = document.getElementById("mut-edit-jenis").value;
  const nama = document.getElementById("mut-edit-nama").value.trim();
  const nisn = document.getElementById("mut-edit-nisn").value.trim();
  const nis = document.getElementById("mut-edit-nis").value.trim();
  const tingkat = document.getElementById("mut-edit-tingkat").value;
  const sekolahAsal = document.getElementById("mut-edit-sekolah-asal").value.trim();
  const sekolahTujuan = document.getElementById("mut-edit-sekolah-tujuan").value.trim();
  const alasan = document.getElementById("mut-edit-alasan").value.trim();
  const pejabatPenandatangan = document.getElementById("mut-edit-kepala").value.trim();
  const verifikatorTU = document.getElementById("mut-edit-tu").value.trim();

  if (!appData.mutations) appData.mutations = [];

  const existingIdx = id ? appData.mutations.findIndex(m => m.id === id) : -1;
  let targetMut = null;

  if (existingIdx !== -1) {
    appData.mutations[existingIdx] = {
      ...appData.mutations[existingIdx],
      noSurat,
      tanggalSurat,
      tanggal: tanggalSurat,
      jenis,
      siswaNama: nama,
      nisn,
      nis,
      tingkat,
      sekolahAsal,
      sekolahTujuan,
      alasan,
      pejabatPenandatangan,
      verifikatorTU
    };
    targetMut = appData.mutations[existingIdx];
  } else {
    targetMut = {
      id: `MUT-${Date.now().toString().slice(-4)}`,
      noSurat,
      tanggalSurat,
      tanggal: tanggalSurat,
      jenis,
      siswaNama: nama,
      nisn,
      nis,
      tingkat,
      rombelTujuan: jenis.includes("Masuk") ? `${tingkat}-A` : "-",
      sekolahAsal,
      sekolahTujuan,
      alasan,
      status: "Disetujui & Diterbitkan",
      pejabatPenandatangan,
      verifikatorTU
    };
    appData.mutations.unshift(targetMut);
  }

  activeMutationForPreview = targetMut;

  recalculateStudentStats();
  saveAppData(appData);
  renderMutations();
  previewMutationSK(targetMut.id, false);
  renderDashboard();
  closeEditMutationModal();

  showToast(`Surat Keterangan Mutasi untuk "${nama}" berhasil disimpan!`);
}

/**
 * Otomatisasi Isian NISN dan Tingkat Kelas saat Nama Siswa Dimasukkan pada Form Mutasi
 */
function handleMutationStudentNameInput() {
  const inputNama = document.getElementById("mut-add-nama");
  const inputNisn = document.getElementById("mut-add-nisn");
  const selectTingkat = document.getElementById("mut-add-tingkat");
  const hint = document.getElementById("mut-add-student-hint");

  if (!inputNama) return;
  const rawVal = inputNama.value.trim().toLowerCase();
  if (!rawVal) {
    if (hint) {
      hint.textContent = "";
      hint.classList.add("hidden");
    }
    return;
  }

  const students = appData.students || [];
  // 1. Cari kecocokan persis atau awalan nama
  let found = students.find(s => {
    if (!s.nama) return false;
    const sName = s.nama.toLowerCase().trim();
    return sName === rawVal || (rawVal.length >= 3 && sName.startsWith(rawVal));
  });

  // 2. Jika belum ditemukan dan input >= 3 karakter, cari kata di dalam nama siswa
  if (!found && rawVal.length >= 3) {
    found = students.find(s => {
      if (!s.nama) return false;
      return s.nama.toLowerCase().includes(rawVal);
    });
  }

  if (found) {
    if (inputNisn && found.nisn && found.nisn !== "-") {
      inputNisn.value = found.nisn;
    }
    if (selectTingkat) {
      let targetTingkat = found.tingkat || "VII";
      const rombelUpper = (found.rombel || "").toUpperCase();
      if (rombelUpper.includes("IX") || rombelUpper.includes("9")) targetTingkat = "IX";
      else if (rombelUpper.includes("VIII") || rombelUpper.includes("8")) targetTingkat = "VIII";
      selectTingkat.value = targetTingkat;
    }
    if (hint) {
      hint.textContent = `✓ Siswa terdaftar: ${found.nama} | NISN: ${found.nisn || "-"} | Kelas: ${found.rombel || found.tingkat}`;
      hint.classList.remove("hidden");
    }
  } else {
    if (hint) {
      hint.textContent = "";
      hint.classList.add("hidden");
    }
  }
}

function handleMutationStudentNisnInput() {
  const inputNama = document.getElementById("mut-add-nama");
  const inputNisn = document.getElementById("mut-add-nisn");
  const selectTingkat = document.getElementById("mut-add-tingkat");
  const hint = document.getElementById("mut-add-student-hint");

  if (!inputNisn) return;
  const rawNisn = inputNisn.value.trim();
  if (rawNisn.length < 5) return;

  const students = appData.students || [];
  const found = students.find(s => s.nisn && s.nisn.trim() === rawNisn);

  if (found) {
    if (inputNama && (!inputNama.value || inputNama.value.trim().toLowerCase() !== found.nama.toLowerCase())) {
      inputNama.value = found.nama;
    }
    if (selectTingkat) {
      let targetTingkat = found.tingkat || "VII";
      const rombelUpper = (found.rombel || "").toUpperCase();
      if (rombelUpper.includes("IX") || rombelUpper.includes("9")) targetTingkat = "IX";
      else if (rombelUpper.includes("VIII") || rombelUpper.includes("8")) targetTingkat = "VIII";
      selectTingkat.value = targetTingkat;
    }
    if (hint) {
      hint.textContent = `✓ Siswa terdaftar: ${found.nama} | NISN: ${found.nisn} | Kelas: ${found.rombel || found.tingkat}`;
      hint.classList.remove("hidden");
    }
  }
}

function openAddMutationModal() {
  const modal = document.getElementById("modal-add-mutation");
  if (modal) {
    const tingkatSelect = document.getElementById("mut-add-tingkat");
    if (tingkatSelect) {
      const list = appData.tingkatList || [
        { kode: "VII", nama: "Kelas VII" },
        { kode: "VIII", nama: "Kelas VIII" },
        { kode: "IX", nama: "Kelas IX" }
      ];
      tingkatSelect.innerHTML = list.map(t => `<option value="${t.kode}">${t.nama || `Kelas ${t.kode}`}</option>`).join("");
    }

    // Isi opsi datalist siswa secara dinamis untuk memudahkan pencarian nama
    const datalist = document.getElementById("datalist-mut-students");
    if (datalist) {
      const students = appData.students || [];
      datalist.innerHTML = students.map(s => {
        return `<option value="${escapeHtml(s.nama)}">${escapeHtml(s.nama)} - NISN: ${s.nisn || '-'} (${s.rombel || s.tingkat})</option>`;
      }).join("");
    }

    const hint = document.getElementById("mut-add-student-hint");
    if (hint) {
      hint.textContent = "";
      hint.classList.add("hidden");
    }

    const inputTgl = document.getElementById("mut-add-tanggal");
    if (inputTgl) inputTgl.value = new Date().toISOString().split("T")[0];

    modal.classList.remove("hidden");
    if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
  }
}

function closeAddMutationModal() {
  const modal = document.getElementById("modal-add-mutation");
  if (modal) modal.classList.add("hidden");
  const form = document.getElementById("form-new-mutation");
  if (form) form.reset();
  const hint = document.getElementById("mut-add-student-hint");
  if (hint) {
    hint.textContent = "";
    hint.classList.add("hidden");
  }
}

function handleAddMutationSubmit(e) {
  e.preventDefault();

  const jenis = document.getElementById("mut-add-jenis").value;
  const nama = document.getElementById("mut-add-nama").value.trim();
  const nisn = document.getElementById("mut-add-nisn").value.trim();
  const tingkat = document.getElementById("mut-add-tingkat").value;
  const sekolah = document.getElementById("mut-add-sekolah").value.trim();
  const alasan = document.getElementById("mut-add-alasan").value.trim();

  const nextNumber = String((appData.mutations || []).length + 105).padStart(3, '0');
  const romanMonth = ["I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII"][new Date().getMonth()];
  const noSurat = `${nextNumber}/MTs.10.06/PP.00.4/${romanMonth}/${new Date().getFullYear()}`;
  const rawTgl = document.getElementById("mut-add-tanggal")?.value;
  const tanggalSurat = rawTgl ? isoToIndoDate(rawTgl) : new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  const newMut = {
    id: `MUT-${Date.now().toString().slice(-4)}`,
    noSurat,
    tanggalSurat,
    tanggal: tanggalSurat,
    jenis,
    siswaNama: nama,
    nisn,
    tingkat,
    rombelTujuan: jenis.includes("Masuk") ? `${tingkat}-B` : "-",
    sekolahAsal: jenis.includes("Masuk") ? sekolah : (appData.institution.name || "MTs Al-Fadlliyah Singaparna"),
    sekolahTujuan: jenis.includes("Masuk") ? (appData.institution.name || "MTs Al-Fadlliyah Singaparna") : sekolah,
    alasan,
    status: "Disetujui & Diterbitkan",
    pejabatPenandatangan: appData.institution.kepalaMadrasah,
    verifikatorTU: appData.institution.kepalaTU
  };

  if (!appData.mutations) appData.mutations = [];
  appData.mutations.unshift(newMut);

  recalculateStudentStats();
  saveAppData(appData);
  renderMutations();
  renderDashboard();
  previewMutationSK(newMut.id, false);
  closeAddMutationModal();
  document.getElementById("form-new-mutation").reset();
  showToast(`Surat Keterangan Mutasi ${nama} berhasil diterbitkan!`);
}

/**
 * MS-03 Cetak Resmi SK Mutasi Standar Kemenag (ISO A4)
 */
function printOfficialMutationSK() {
  const mut = activeMutationForPreview || (appData.mutations && appData.mutations[0]);
  if (!mut) {
    showToast("Belum ada data mutasi untuk dicetak!");
    return;
  }

  const printArea = document.getElementById("printable-area");
  if (!printArea) return;

  const isMasuk = mut.jenis.includes("Masuk");

  printArea.innerHTML = `
    <div class="printable-document p-10 font-serif leading-relaxed text-black max-w-[210mm] mx-auto bg-white">
      
      <!-- Kop Surat Resmi Standar Kemenag RI -->
      <div class="text-center pb-3 border-b-4 border-double border-black font-sans relative">
        ${appData.institution.logo ? `
          <div class="absolute left-0 top-0 bottom-0 w-20 flex items-center justify-center">
            <img src="${appData.institution.logo}" class="max-h-16 max-w-20 object-contain">
          </div>
        ` : ''}
        <p class="text-xs uppercase font-bold tracking-wider">KEMENTERIAN AGAMA REPUBLIK INDONESIA</p>
        <p class="text-sm font-extrabold uppercase tracking-wide">KANTOR KEMENTERIAN AGAMA ${(appData.institution.kota || 'KABUPATEN TASIKMALAYA').toUpperCase()}</p>
        <h2 class="text-lg font-black uppercase text-emerald-900 tracking-tight mt-0.5">${appData.institution.name}</h2>
        <p class="text-[10px] text-gray-700 mt-0.5">
          NSM: ${appData.institution.nsm} | NPSN: ${appData.institution.npsn} | Status Akreditasi: ${appData.institution.statusAkreditasi || 'A (Unggul)'}
        </p>
        <p class="text-[9px] text-gray-600">
          ${appData.institution.alamat}, ${appData.institution.kota} ${appData.institution.kodePos || ''} • Telp: ${appData.institution.telepon || '-'}
        </p>
      </div>

      <!-- Judul Surat -->
      <div class="text-center my-6 font-sans">
        <h3 class="text-sm font-black uppercase tracking-wider underline">SURAT KETERANGAN PINDAH / MUTASI SISWA</h3>
        <p class="text-xs font-semibold mt-1">Nomor: ${mut.noSurat || '-'}</p>
      </div>

      <!-- Isi Surat Keterangan -->
      <div class="space-y-4 text-xs font-sans text-justify">
        <p>Yang bertanda tangan di bawah ini, Kepala ${appData.institution.name} ${appData.institution.kota || ''}, menerangkan dengan sesungguhnya bahwa:</p>
        
        <div class="my-4 pl-6 space-y-1.5 border-l-2 border-gray-400">
          <div class="grid grid-cols-12">
            <span class="col-span-4 font-semibold">Nama Lengkap Siswa</span>
            <span class="col-span-8 font-black uppercase">: ${mut.siswaNama}</span>
          </div>
          <div class="grid grid-cols-12">
            <span class="col-span-4 font-semibold">Nomor Induk Siswa Nasional (NISN)</span>
            <span class="col-span-8 font-mono">: ${mut.nisn}</span>
          </div>
          <div class="grid grid-cols-12">
            <span class="col-span-4 font-semibold">Tingkat Kelas / Rombel</span>
            <span class="col-span-8">: Kelas ${mut.tingkat} (${mut.rombelTujuan})</span>
          </div>
          <div class="grid grid-cols-12">
            <span class="col-span-4 font-semibold">Jenis Mutasi</span>
            <span class="col-span-8 font-bold text-emerald-900">: ${mut.jenis}</span>
          </div>
          <div class="grid grid-cols-12">
            <span class="col-span-4 font-semibold">${isMasuk ? 'Madrasah / Sekolah Asal' : 'Madrasah / Sekolah Tujuan'}</span>
            <span class="col-span-8">: ${isMasuk ? mut.sekolahAsal : mut.sekolahTujuan}</span>
          </div>
        </div>

        <p>
          Berdasarkan permohonan kepindahan yang diajukan orang tua/wali siswa dengan alasan: 
          <strong>"${mut.alasan}"</strong>. Yang bersangkutan telah memenuhi ketentuan administratif perpindahan peserta didik yang berlaku di lingkungan Kementerian Agama Republik Indonesia.
        </p>

        <p>Demikian Surat Keterangan Pindah ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.</p>
      </div>

      <!-- Tanda Tangan & Legalisasi Stempel -->
      <div class="mt-12 flex justify-between items-end font-sans text-xs">
        <div class="text-center w-56">
          <p>Mengetahui,</p>
          <p class="font-bold">Kepala Madrasah,</p>
          
          <div class="h-20 flex items-center justify-center text-gray-400 italic text-[10px]">
            [Tanda Tangan Digital]
          </div>
          <p class="font-bold underline uppercase">${mut.pejabatPenandatangan || appData.institution.kepalaMadrasah || 'Drs. H. Ahmad Fadlli, M.Pd.I'}</p>
          <p class="text-[10px] text-gray-600">NIP. ${appData.institution.nipKepala || '196908151994031002'}</p>
        </div>

        <div class="text-center w-56">
          <p>${appData.institution.titimangsaKota || appData.institution.kota || 'Singaparna'}, ${mut.tanggalSurat || mut.tanggal || appData.institution.tanggalRapor}</p>
          <p class="font-bold">Kepala Tata Usaha,</p>
          <div class="h-20 flex items-center justify-center text-gray-400 italic text-[10px]">
            [Tanda Tangan & Paraf]
          </div>
          <p class="font-bold underline uppercase">${mut.verifikatorTU || appData.institution.kepalaTU || 'Hj. Siti Rahmawati, S.Pd'}</p>
          <p class="text-[10px] text-gray-600">NIP. ${appData.institution.nipTU || '197804122005012004'}</p>
        </div>
      </div>

    </div>
  `;

  window.print();
}

/* ========================================================
   MODUL 4: PROGRAM BEASISWA & BANTUAN PENDIDIKAN (BS-01 S/D BS-04)
   ======================================================== */

/**
 * Mengisi Dropdown Pilihan Kategori Beasiswa secara Dinamis
 * Menyinkronkan Filter dan Pilihan Form dengan appData.beasiswaPillars
 */
function populateBeasiswaCategoryDropdowns() {
  if (!appData.beasiswaPillars || !Array.isArray(appData.beasiswaPillars)) {
    appData.beasiswaPillars = [
      { id: "ksm", title: "Prestasi KSM & Akademik", badgeColor: "emerald", icon: "award", totalAlokasi: 15000000, deskripsi: "Bantuan pembebasan iuran/SPP & pembinaan intensif kompetisi sains madrasah." },
      { id: "baznas", title: "Afirmasi Dhuafa (Kerjasama BAZNAS)", badgeColor: "blue", icon: "heart-handshake", totalAlokasi: 20000000, deskripsi: "Paket perlengkapan kitab, seragam madrasah, dan subsidi operasional santri dhuafa." },
      { id: "pip", title: "Program Indonesia Pintar (PIP)", badgeColor: "amber", icon: "wallet", totalAlokasi: 25000000, deskripsi: "Penyaluran dana tunai bantuan pendidikan bersumber dari APBN bantuan pendidikan." }
    ];
  }

  const pillars = appData.beasiswaPillars;

  // 1. Filter dropdown di tab-beasiswa
  const filterSelect = document.getElementById("filter-beasiswa-pilar");
  if (filterSelect) {
    const curVal = filterSelect.value || "ALL";
    let opts = `<option value="ALL">Semua Program Beasiswa</option>`;
    pillars.forEach(p => {
      opts += `<option value="${escapeHtml(p.title)}">${escapeHtml(p.title)}</option>`;
    });
    filterSelect.innerHTML = opts;
    if (curVal && [...filterSelect.options].some(o => o.value === curVal)) {
      filterSelect.value = curVal;
    }
  }

  // 2. Select kategori di form tambah penerima beasiswa
  const addSelect = document.getElementById("bea-add-kategori");
  if (addSelect) {
    const curAddVal = addSelect.value;
    addSelect.innerHTML = pillars.map(p => 
      `<option value="${escapeHtml(p.title)}">${escapeHtml(p.title)}</option>`
    ).join("");
    if (curAddVal && [...addSelect.options].some(o => o.value === curAddVal)) {
      addSelect.value = curAddVal;
    }
  }

  // 3. Select kategori di form edit penerima beasiswa
  const editSelect = document.getElementById("bea-edit-kategori");
  if (editSelect) {
    const curEditVal = editSelect.value;
    editSelect.innerHTML = pillars.map(p => 
      `<option value="${escapeHtml(p.title)}">${escapeHtml(p.title)}</option>`
    ).join("");
    if (curEditVal && [...editSelect.options].some(o => o.value === curEditVal)) {
      editSelect.value = curEditVal;
    }
  }
}

function renderBeasiswaPillars() {
  const container = document.getElementById("beasiswa-pillar-cards");
  if (!container) return;

  populateBeasiswaCategoryDropdowns();

  const beasiswaList = appData.beasiswaList || [];
  const pillars = appData.beasiswaPillars || [];

  container.innerHTML = pillars.map(p => {
    const matchingItems = beasiswaList.filter(b => 
      b.kategori === p.title || 
      (p.id === 'ksm' && b.kategori && b.kategori.includes('KSM')) || 
      (p.id === 'baznas' && b.kategori && b.kategori.includes('BAZNAS')) || 
      (p.id === 'pip' && b.kategori && b.kategori.includes('PIP'))
    );
    const penerimaCount = matchingItems.length;
    const realisasiSum = matchingItems.reduce((acc, b) => acc + (Number(b.nominal) || 0), 0);
    const totalAlokasi = Number(p.totalAlokasi) || 0;
    const persenSerapan = totalAlokasi > 0 ? Math.min(100, Math.round((realisasiSum / totalAlokasi) * 100)) : 0;
    const badgeColor = p.badgeColor || 'emerald';

    return `
    <div class="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative group">
      <div>
        <div class="flex items-center justify-between mb-3">
          <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold bg-${badgeColor}-100 text-${badgeColor}-800 uppercase">
            ${escapeHtml(p.id.toUpperCase())}
          </span>
          <div class="flex items-center space-x-1">
            <span class="text-xs font-bold text-slate-500 mr-1.5">${penerimaCount} Penerima</span>
            <button onclick="openEditBeasiswaPillarModal('${p.id}')" title="Edit Program Beasiswa" class="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
              <i data-lucide="pencil" class="w-3.5 h-3.5"></i>
            </button>
            <button onclick="deleteBeasiswaPillar('${p.id}')" title="Hapus Program Beasiswa" class="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </div>
        <h4 class="font-extrabold text-slate-900 text-sm">${escapeHtml(p.title)}</h4>
        <p class="text-xs text-slate-500 mt-1 leading-relaxed">${escapeHtml(p.deskripsi || '-')}</p>
      </div>

      <div class="mt-4 pt-3 border-t border-slate-100">
        <div class="flex items-baseline justify-between mb-1 text-[11px] text-slate-500">
          <span>Pagu Alokasi:</span>
          <span class="font-semibold text-slate-700">Rp ${totalAlokasi.toLocaleString("id-ID")}</span>
        </div>
        <div class="flex items-baseline justify-between mb-1.5">
          <span class="text-xs text-slate-500">Serapan Dana:</span>
          <span class="text-sm font-extrabold text-slate-900">Rp ${realisasiSum.toLocaleString("id-ID")}</span>
        </div>
        <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
          <div class="bg-emerald-600 h-2 rounded-full transition-all" style="width: ${persenSerapan}%"></div>
        </div>
        <span class="block text-right text-[10px] font-bold text-emerald-700 mt-1">${persenSerapan}% Realisasi</span>
      </div>
    </div>
  `;
  }).join("");

  lucide.createIcons();
}

function renderBeasiswaTable() {
  const filterPilar = document.getElementById("filter-beasiswa-pilar")?.value || "ALL";
  let list = appData.beasiswaList || [];

  const totalRealisasiEl = document.getElementById("beasiswa-total-realisasi");
  const totalRealisasi = (appData.beasiswaList || []).reduce((sum, b) => sum + (Number(b.nominal) || 0), 0);
  if (totalRealisasiEl) {
    totalRealisasiEl.textContent = `Total Realisasi: Rp ${totalRealisasi.toLocaleString("id-ID")}`;
  }

  if (filterPilar !== "ALL") {
    list = list.filter(b => b.kategori === filterPilar);
  }

  const tbody = document.getElementById("beasiswa-table-body");
  if (!tbody) return;

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="py-8 text-center text-slate-400">Belum ada data penerima beasiswa terdaftar.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(b => {
    const isTersalurkan = b.status === "Tersalurkan";
    return `
      <tr class="hover:bg-slate-50 transition-colors">
        <td class="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">${escapeHtml(b.siswaNama)}</td>
        <td class="py-3 px-4 whitespace-nowrap">
          <span class="font-mono text-[11px] block text-slate-700 whitespace-nowrap">${escapeHtml(b.nisn)}</span>
          <span class="text-[10px] text-slate-400 font-semibold whitespace-nowrap">Kelas ${escapeHtml(b.kelas)}</span>
        </td>
        <td class="py-3 px-4 whitespace-nowrap">
          <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 whitespace-nowrap">
            ${escapeHtml(b.kategori)}
          </span>
        </td>
        <td class="py-3 px-4 font-mono font-extrabold text-slate-900 whitespace-nowrap">
          Rp ${(Number(b.nominal) || 0).toLocaleString("id-ID")}
        </td>
        <td class="py-3 px-4 text-center whitespace-nowrap">
          <button onclick="toggleBeasiswaStatus('${b.id}')" title="Klik untuk mengubah status penyaluran"
            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold whitespace-nowrap cursor-pointer transition-transform hover:scale-105 ${isTersalurkan ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
            ${escapeHtml(b.status)}
          </button>
        </td>
        <td class="py-3 px-4 text-slate-600 text-xs italic whitespace-nowrap max-w-xs truncate" title="${escapeHtml(b.evaluasi || '')}">
          ${escapeHtml(b.evaluasi || '-')}
        </td>
        <td class="py-3 px-4 text-right whitespace-nowrap">
          <div class="inline-flex items-center space-x-1.5">
            <button onclick="openEditBeasiswaModal('${b.id}')" title="Edit Data Penerima Beasiswa" class="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
              <i data-lucide="pencil" class="w-3.5 h-3.5"></i>
            </button>
            <button onclick="deleteBeasiswa('${b.id}')" title="Hapus Data Beasiswa" class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");

  lucide.createIcons();
}

function toggleBeasiswaStatus(beasiswaId) {
  const b = (appData.beasiswaList || []).find(x => x.id === beasiswaId);
  if (!b) return;

  if (b.status === "Tersalurkan") {
    b.status = "Proses Verifikasi";
    b.tglPencairan = "-";
  } else {
    b.status = "Tersalurkan";
    b.tglPencairan = new Date().toISOString().split("T")[0];
  }

  saveAppData(appData);
  renderBeasiswaTable();
  renderBeasiswaPillars();
  renderDashboard();
  showToast(`Status beasiswa "${b.siswaNama}" diubah menjadi: ${b.status}`);
}

function deleteBeasiswa(beasiswaId) {
  const b = (appData.beasiswaList || []).find(x => x.id === beasiswaId);
  if (!b) return;

  if (confirm(`Apakah Anda yakin ingin menghapus data penerima beasiswa "${b.siswaNama}" (${b.kategori})?`)) {
    appData.beasiswaList = appData.beasiswaList.filter(x => x.id !== beasiswaId);
    if (appData.stats) {
      appData.stats.penerimaBeasiswa = appData.beasiswaList.length;
    }
    saveAppData(appData);
    renderBeasiswaPillars();
    renderBeasiswaTable();
    renderDashboard();
    showToast(`Data penerima beasiswa "${b.siswaNama}" berhasil dihapus.`);
  }
}

/**
 * Edit Penerima Beasiswa
 */
function openEditBeasiswaModal(beasiswaId) {
  const b = (appData.beasiswaList || []).find(x => x.id === beasiswaId);
  if (!b) {
    alert("Data penerima beasiswa tidak ditemukan!");
    return;
  }

  populateBeasiswaCategoryDropdowns();

  document.getElementById("bea-edit-id").value = b.id;
  document.getElementById("bea-edit-nama").value = b.siswaNama || "";
  document.getElementById("bea-edit-nisn").value = b.nisn || "";
  document.getElementById("bea-edit-kelas").value = b.kelas || "";
  document.getElementById("bea-edit-kategori").value = b.kategori || "";
  document.getElementById("bea-edit-nominal").value = b.nominal || 1500000;
  document.getElementById("bea-edit-status").value = b.status || "Proses Verifikasi";
  document.getElementById("bea-edit-tgl-pencairan").value = dateToIso(b.tglPencairan);
  document.getElementById("bea-edit-evaluasi").value = b.evaluasi || "";

  const hint = document.getElementById("bea-edit-student-hint");
  if (hint) {
    hint.textContent = `✓ ID Beasiswa: ${b.id} | Siswa: ${b.siswaNama}`;
    hint.classList.remove("hidden");
  }

  const modal = document.getElementById("modal-edit-beasiswa");
  if (modal) {
    modal.classList.remove("hidden");
    if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
  }
}

function closeEditBeasiswaModal() {
  const modal = document.getElementById("modal-edit-beasiswa");
  if (modal) modal.classList.add("hidden");
  const form = document.getElementById("form-edit-beasiswa");
  if (form) form.reset();
  const hint = document.getElementById("bea-edit-student-hint");
  if (hint) {
    hint.textContent = "";
    hint.classList.add("hidden");
  }
}

function handleEditBeasiswaSubmit(e) {
  e.preventDefault();

  const id = document.getElementById("bea-edit-id").value;
  const nama = document.getElementById("bea-edit-nama").value.trim();
  const nisn = document.getElementById("bea-edit-nisn").value.trim();
  const kelas = document.getElementById("bea-edit-kelas").value.trim();
  const kategori = document.getElementById("bea-edit-kategori").value;
  const nominal = parseInt(document.getElementById("bea-edit-nominal").value) || 1500000;
  const status = document.getElementById("bea-edit-status").value;
  let tglPencairan = document.getElementById("bea-edit-tgl-pencairan").value.trim();
  const evaluasi = document.getElementById("bea-edit-evaluasi").value.trim() || "Terverifikasi kriteria penerima bantuan pendidikan";

  if (!tglPencairan || tglPencairan === "-") {
    if (status === "Tersalurkan") {
      tglPencairan = new Date().toISOString().split("T")[0];
    } else {
      tglPencairan = "-";
    }
  }

  const target = (appData.beasiswaList || []).find(x => x.id === id);
  if (!target) {
    alert("Data beasiswa tidak ditemukan!");
    return;
  }

  target.siswaNama = nama;
  target.nisn = nisn;
  target.kelas = kelas;
  target.kategori = kategori;
  target.nominal = nominal;
  target.status = status;
  target.tglPencairan = tglPencairan;
  target.evaluasi = evaluasi;

  saveAppData(appData);
  renderBeasiswaTable();
  renderBeasiswaPillars();
  renderDashboard();
  closeEditBeasiswaModal();
  showToast(`Data penerima beasiswa "${nama}" berhasil diperbarui!`);
}

function handleBeasiswaEditStudentNameInput() {
  const inputNama = document.getElementById("bea-edit-nama");
  const inputNisn = document.getElementById("bea-edit-nisn");
  const inputKelas = document.getElementById("bea-edit-kelas");
  const hint = document.getElementById("bea-edit-student-hint");

  if (!inputNama) return;
  const rawVal = inputNama.value.trim().toLowerCase();
  if (!rawVal) {
    if (hint) {
      hint.textContent = "";
      hint.classList.add("hidden");
    }
    return;
  }

  const students = appData.students || [];
  let found = students.find(s => {
    if (!s.nama) return false;
    const sName = s.nama.toLowerCase().trim();
    return sName === rawVal || (rawVal.length >= 3 && sName.startsWith(rawVal));
  });

  if (!found && rawVal.length >= 3) {
    found = students.find(s => s.nama && s.nama.toLowerCase().includes(rawVal));
  }

  if (found) {
    if (inputNisn && found.nisn && found.nisn !== "-") {
      inputNisn.value = found.nisn;
    }
    if (inputKelas) {
      inputKelas.value = found.rombel || found.tingkat || "";
    }
    if (hint) {
      hint.textContent = `✓ Siswa terdaftar: ${found.nama} | NISN: ${found.nisn || "-"} | Kelas: ${found.rombel || found.tingkat}`;
      hint.classList.remove("hidden");
    }
  } else {
    if (hint) {
      hint.textContent = "";
      hint.classList.add("hidden");
    }
  }
}

function handleBeasiswaEditStudentNisnInput() {
  const inputNama = document.getElementById("bea-edit-nama");
  const inputNisn = document.getElementById("bea-edit-nisn");
  const inputKelas = document.getElementById("bea-edit-kelas");
  const hint = document.getElementById("bea-edit-student-hint");

  if (!inputNisn) return;
  const rawNisn = inputNisn.value.trim();
  if (rawNisn.length < 5) return;

  const students = appData.students || [];
  const found = students.find(s => s.nisn && s.nisn.trim() === rawNisn);

  if (found) {
    if (inputNama && (!inputNama.value || inputNama.value.trim().toLowerCase() !== found.nama.toLowerCase())) {
      inputNama.value = found.nama;
    }
    if (inputKelas) {
      inputKelas.value = found.rombel || found.tingkat || "";
    }
    if (hint) {
      hint.textContent = `✓ Siswa terdaftar: ${found.nama} | NISN: ${found.nisn} | Kelas: ${found.rombel || found.tingkat}`;
      hint.classList.remove("hidden");
    }
  }
}

/**
 * Manajemen Program / Pilar Beasiswa Kustom (Add, Edit, Delete)
 */
function openAddBeasiswaPillarModal() {
  const form = document.getElementById("form-new-beasiswa-pillar");
  if (form) form.reset();
  const modal = document.getElementById("modal-add-beasiswa-pillar");
  if (modal) {
    modal.classList.remove("hidden");
    if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
  }
}

function closeAddBeasiswaPillarModal() {
  const modal = document.getElementById("modal-add-beasiswa-pillar");
  if (modal) modal.classList.add("hidden");
  const form = document.getElementById("form-new-beasiswa-pillar");
  if (form) form.reset();
}

function handleAddBeasiswaPillarSubmit(e) {
  e.preventDefault();

  const nama = document.getElementById("pillar-add-nama").value.trim();
  const alokasi = parseInt(document.getElementById("pillar-add-alokasi").value) || 10000000;
  const warna = document.getElementById("pillar-add-warna").value;
  const deskripsi = document.getElementById("pillar-add-deskripsi").value.trim();

  if (!nama) {
    alert("Nama program beasiswa wajib diisi!");
    return;
  }

  if (!appData.beasiswaPillars) appData.beasiswaPillars = [];

  // Periksa duplikasi nama program
  if (appData.beasiswaPillars.some(p => p.title.toLowerCase() === nama.toLowerCase())) {
    alert(`Program beasiswa dengan nama "${nama}" sudah terdaftar!`);
    return;
  }

  const newPillar = {
    id: `custom-${Date.now().toString().slice(-4)}`,
    title: nama,
    badgeColor: warna,
    icon: "award",
    penerima: 0,
    totalAlokasi: alokasi,
    realisasi: 0,
    persenSerapan: 0,
    deskripsi
  };

  appData.beasiswaPillars.push(newPillar);
  saveAppData(appData);

  populateBeasiswaCategoryDropdowns();
  renderBeasiswaPillars();
  renderBeasiswaTable();
  closeAddBeasiswaPillarModal();
  showToast(`Program beasiswa kustom "${nama}" berhasil ditambahkan!`);
}

function openEditBeasiswaPillarModal(pillarId) {
  const p = (appData.beasiswaPillars || []).find(x => x.id === pillarId);
  if (!p) {
    alert("Program beasiswa tidak ditemukan!");
    return;
  }

  document.getElementById("pillar-edit-id").value = p.id;
  document.getElementById("pillar-edit-nama").value = p.title || "";
  document.getElementById("pillar-edit-alokasi").value = p.totalAlokasi || 10000000;
  document.getElementById("pillar-edit-warna").value = p.badgeColor || "emerald";
  document.getElementById("pillar-edit-deskripsi").value = p.deskripsi || "";

  const modal = document.getElementById("modal-edit-beasiswa-pillar");
  if (modal) {
    modal.classList.remove("hidden");
    if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
  }
}

function closeEditBeasiswaPillarModal() {
  const modal = document.getElementById("modal-edit-beasiswa-pillar");
  if (modal) modal.classList.add("hidden");
  const form = document.getElementById("form-edit-beasiswa-pillar");
  if (form) form.reset();
}

function handleEditBeasiswaPillarSubmit(e) {
  e.preventDefault();

  const id = document.getElementById("pillar-edit-id").value;
  const nama = document.getElementById("pillar-edit-nama").value.trim();
  const alokasi = parseInt(document.getElementById("pillar-edit-alokasi").value) || 10000000;
  const warna = document.getElementById("pillar-edit-warna").value;
  const deskripsi = document.getElementById("pillar-edit-deskripsi").value.trim();

  const target = (appData.beasiswaPillars || []).find(x => x.id === id);
  if (!target) {
    alert("Program beasiswa tidak ditemukan!");
    return;
  }

  const oldTitle = target.title;
  target.title = nama;
  target.totalAlokasi = alokasi;
  target.badgeColor = warna;
  target.deskripsi = deskripsi;

  // Jika nama program beasiswa diubah, otomatis update kategori di data penerima
  if (nama !== oldTitle && appData.beasiswaList) {
    appData.beasiswaList.forEach(b => {
      if (b.kategori === oldTitle) {
        b.kategori = nama;
      }
    });
  }

  saveAppData(appData);
  populateBeasiswaCategoryDropdowns();
  renderBeasiswaPillars();
  renderBeasiswaTable();
  closeEditBeasiswaPillarModal();
  showToast(`Program beasiswa "${nama}" berhasil diperbarui!`);
}

function deleteBeasiswaPillar(pillarId) {
  const p = (appData.beasiswaPillars || []).find(x => x.id === pillarId);
  if (!p) return;

  const countPenerima = (appData.beasiswaList || []).filter(b => b.kategori === p.title).length;

  let msg = `Apakah Anda yakin ingin menghapus program beasiswa "${p.title}"?`;
  if (countPenerima > 0) {
    msg += `\n\nPerhatian: Saat ini terdapat ${countPenerima} siswa terdaftar pada program ini.`;
  }

  if (confirm(msg)) {
    appData.beasiswaPillars = appData.beasiswaPillars.filter(x => x.id !== pillarId);
    saveAppData(appData);
    populateBeasiswaCategoryDropdowns();
    renderBeasiswaPillars();
    renderBeasiswaTable();
    showToast(`Program beasiswa "${p.title}" berhasil dihapus.`);
  }
}

/**
 * Otomatisasi Isian NISN dan Rombel/Kelas saat Nama Siswa Dimasukkan pada Form Tambah Beasiswa
 */
function handleBeasiswaStudentNameInput() {
  const inputNama = document.getElementById("bea-add-nama");
  const inputNisn = document.getElementById("bea-add-nisn");
  const inputKelas = document.getElementById("bea-add-kelas");
  const hint = document.getElementById("bea-add-student-hint");

  if (!inputNama) return;
  const rawVal = inputNama.value.trim().toLowerCase();
  if (!rawVal) {
    if (hint) {
      hint.textContent = "";
      hint.classList.add("hidden");
    }
    return;
  }

  const students = appData.students || [];
  // 1. Cari kecocokan persis atau awalan nama
  let found = students.find(s => {
    if (!s.nama) return false;
    const sName = s.nama.toLowerCase().trim();
    return sName === rawVal || (rawVal.length >= 3 && sName.startsWith(rawVal));
  });

  // 2. Jika belum ditemukan dan input >= 3 karakter, cari kata di dalam nama siswa
  if (!found && rawVal.length >= 3) {
    found = students.find(s => {
      if (!s.nama) return false;
      return s.nama.toLowerCase().includes(rawVal);
    });
  }

  if (found) {
    if (inputNisn && found.nisn && found.nisn !== "-") {
      inputNisn.value = found.nisn;
    }
    if (inputKelas) {
      inputKelas.value = found.rombel || found.tingkat || "";
    }
    if (hint) {
      hint.textContent = `✓ Siswa terdaftar: ${found.nama} | NISN: ${found.nisn || "-"} | Kelas: ${found.rombel || found.tingkat}`;
      hint.classList.remove("hidden");
    }
  } else {
    if (hint) {
      hint.textContent = "";
      hint.classList.add("hidden");
    }
  }
}

function handleBeasiswaStudentNisnInput() {
  const inputNama = document.getElementById("bea-add-nama");
  const inputNisn = document.getElementById("bea-add-nisn");
  const inputKelas = document.getElementById("bea-add-kelas");
  const hint = document.getElementById("bea-add-student-hint");

  if (!inputNisn) return;
  const rawNisn = inputNisn.value.trim();
  if (rawNisn.length < 5) return;

  const students = appData.students || [];
  const found = students.find(s => s.nisn && s.nisn.trim() === rawNisn);

  if (found) {
    if (inputNama && (!inputNama.value || inputNama.value.trim().toLowerCase() !== found.nama.toLowerCase())) {
      inputNama.value = found.nama;
    }
    if (inputKelas) {
      inputKelas.value = found.rombel || found.tingkat || "";
    }
    if (hint) {
      hint.textContent = `✓ Siswa terdaftar: ${found.nama} | NISN: ${found.nisn} | Kelas: ${found.rombel || found.tingkat}`;
      hint.classList.remove("hidden");
    }
  }
}

function openAddBeasiswaModal() {
  const modal = document.getElementById("modal-add-beasiswa");
  if (modal) {
    populateBeasiswaCategoryDropdowns();

    // Isi opsi datalist siswa secara dinamis untuk memudahkan pencarian nama
    const datalist = document.getElementById("datalist-bea-students");
    if (datalist) {
      const students = appData.students || [];
      datalist.innerHTML = students.map(s => {
        return `<option value="${escapeHtml(s.nama)}">${escapeHtml(s.nama)} - NISN: ${s.nisn || '-'} (${s.rombel || s.tingkat})</option>`;
      }).join("");
    }

    const hint = document.getElementById("bea-add-student-hint");
    if (hint) {
      hint.textContent = "";
      hint.classList.add("hidden");
    }

    modal.classList.remove("hidden");
    if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
  }
}

function closeAddBeasiswaModal() {
  const modal = document.getElementById("modal-add-beasiswa");
  if (modal) modal.classList.add("hidden");
  const form = document.getElementById("form-new-beasiswa");
  if (form) form.reset();
  const hint = document.getElementById("bea-add-student-hint");
  if (hint) {
    hint.textContent = "";
    hint.classList.add("hidden");
  }
}

function handleAddBeasiswaSubmit(e) {
  e.preventDefault();

  const kategori = document.getElementById("bea-add-kategori").value;
  const nama = document.getElementById("bea-add-nama").value.trim();
  const nisn = document.getElementById("bea-add-nisn").value.trim();
  const kelas = document.getElementById("bea-add-kelas").value.trim();
  const nominal = parseInt(document.getElementById("bea-add-nominal").value) || 1500000;
  const evaluasi = document.getElementById("bea-add-evaluasi").value.trim() || "Terverifikasi kriteria penerima bantuan pendidikan";

  const newBea = {
    id: `BS-24-${String((appData.beasiswaList || []).length + 1).padStart(3, '0')}`,
    siswaNama: nama,
    nisn,
    kelas,
    kategori,
    nominal,
    status: "Proses Verifikasi",
    evaluasi,
    tglPencairan: "-"
  };

  if (!appData.beasiswaList) appData.beasiswaList = [];
  appData.beasiswaList.unshift(newBea);
  if (!appData.stats) appData.stats = {};
  appData.stats.penerimaBeasiswa = appData.beasiswaList.length;

  saveAppData(appData);
  renderBeasiswaTable();
  renderBeasiswaPillars();
  renderDashboard();
  closeAddBeasiswaModal();
  document.getElementById("form-new-beasiswa").reset();
  showToast(`Penerima beasiswa ${nama} berhasil didaftarkan!`);
}

function printRekapBeasiswaA4() {
  const printArea = document.getElementById("printable-area");
  if (!printArea) return;

  const rows = appData.beasiswaList.map((b, idx) => `
    <tr class="border-b border-gray-300 text-xs">
      <td class="py-2 text-center">${idx + 1}</td>
      <td class="py-2 font-bold">${b.siswaNama}</td>
      <td class="py-2 font-mono">${b.nisn}</td>
      <td class="py-2">${b.kelas}</td>
      <td class="py-2">${b.kategori}</td>
      <td class="py-2 text-right font-mono font-bold">Rp ${b.nominal.toLocaleString("id-ID")}</td>
      <td class="py-2 text-center">${b.status}</td>
    </tr>
  `).join("");

  printArea.innerHTML = `
    <div class="printable-document p-10 font-sans leading-relaxed text-black max-w-[210mm] mx-auto bg-white">
      <div class="text-center pb-3 border-b-2 border-black">
        <h2 class="text-base font-black uppercase tracking-tight">KANTOR KEMENTERIAN AGAMA ${(appData.institution.kota || 'KABUPATEN TASIKMALAYA').toUpperCase()}</h2>
        <h1 class="text-lg font-black uppercase text-emerald-900">${(appData.institution.name || 'MTs AL-FADLLIYAH').toUpperCase()}</h1>
        <p class="text-xs uppercase font-bold tracking-wider mt-1">REKAPITULASI PENYALURAN PROGRAM BEASISWA</p>
        <p class="text-[11px] text-gray-600">Tahun Ajaran ${appData.institution.tahunAjaranAktif || '2024/2025'} Semester ${appData.institution.semesterAktif || 'Ganjil'}</p>
      </div>

      <table class="w-full my-6 border-collapse text-xs">
        <thead>
          <tr class="border-b-2 border-black font-bold uppercase text-[10px] bg-gray-50">
            <th class="py-2 text-center w-8">No</th>
            <th class="py-2 text-left">Nama Siswa</th>
            <th class="py-2 text-left">NISN</th>
            <th class="py-2 text-left">Kelas</th>
            <th class="py-2 text-left">Program Beasiswa</th>
            <th class="py-2 text-right">Nominal</th>
            <th class="py-2 text-center">Status</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>

      <div class="mt-8 flex justify-between items-end text-xs">
        <div class="text-center w-52">
          <p>Mengetahui / Mengesahkan,</p>
          <p class="font-bold">Kepala Madrasah,</p>
          <div class="h-16"></div>
          <p class="font-bold underline uppercase">${appData.institution.kepalaMadrasah || 'Drs. H. Ahmad Fadlli, M.Pd.I'}</p>
          <p class="text-[10px]">NIP. ${appData.institution.nipKepala || '196908151994031002'}</p>
        </div>
        <div class="text-center w-52">
          <p>${appData.institution.titimangsaKota || appData.institution.kota || 'Singaparna'}, ${appData.institution.tanggalRapor || '21 Desember 2024'}</p>
          <p class="font-bold">Kepala Tata Usaha,</p>
          <div class="h-16"></div>
          <p class="font-bold underline uppercase">${appData.institution.kepalaTU || 'Hj. Siti Rahmawati, S.Pd'}</p>
          <p class="text-[10px]">NIP. ${appData.institution.nipTU || '197804122005012004'}</p>
        </div>
      </div>
    </div>
  `;

  window.print();
}

/* ========================================================
   MODUL 5: IDENTITAS RAPOR & FORMAT KMA 450/2024 (IR-01 S/D IR-06)
   ======================================================== */
function populateRaporStudentSelect() {
  const sel = document.getElementById("rapor-select-siswa");
  if (!sel) return;

  if (!appData.students || appData.students.length === 0) {
    sel.innerHTML = `<option value="">(Belum ada data siswa terdaftar)</option>`;
    return;
  }

  sel.innerHTML = appData.students.map((s, idx) => `
    <option value="${s.id}" ${idx === 0 ? 'selected' : ''}>${s.nama} (${s.nisn} - ${s.rombel})</option>
  `).join("");
}

function updateRaporPreview() {
  const studentId = document.getElementById("rapor-select-siswa")?.value;
  const student = (appData.students && appData.students.find(s => s.id === studentId)) || (appData.students && appData.students[0]) || {
    nama: "(DATA SISWA BELUM TERSEDIA)",
    nisn: "-",
    nis: "-"
  };

  const inst = (appData && appData.institution) || {};
  const namaMadrasah = document.getElementById("rapor-input-nama-madrasah")?.value || inst.name || "Madrasah Tsanawiyah Al-Fadlliyah";
  const nsm = document.getElementById("rapor-input-nsm")?.value || inst.nsm || "-";
  const npsn = document.getElementById("rapor-input-npsn")?.value || inst.npsn || "-";
  const alamat = document.getElementById("rapor-input-alamat")?.value || inst.alamat || "-";
  const titimangsa = document.getElementById("rapor-input-titimangsa")?.value || inst.titimangsaKota || inst.kota || "Tasikmalaya";
  const rawRaporTgl = document.getElementById("rapor-input-tanggal")?.value;
  const tanggal = rawRaporTgl ? isoToIndoDate(rawRaporTgl) : (inst.tanggalRapor || "21 Desember 2024");

  const showWatermark = document.getElementById("rapor-check-watermark")?.checked ?? true;
  const showMargin = document.getElementById("rapor-check-margin")?.checked ?? true;

  // Update Preview Elements
  const elNama = document.getElementById("rapor-display-nama");
  const elNisn = document.getElementById("rapor-display-nisn");
  const elMadrasah = document.getElementById("rapor-display-madrasah");
  const elNsmNpsn = document.getElementById("rapor-display-nsm-npsn");
  const elAlamat = document.getElementById("rapor-display-alamat");
  const elKota = document.getElementById("rapor-display-kota");
  const elTanggal = document.getElementById("rapor-display-tanggal");
  const elWatermark = document.getElementById("rapor-watermark-el");
  const elBorder = document.getElementById("rapor-margin-border");

  if (elNama && student) elNama.textContent = student.nama;
  if (elNisn && student) elNisn.textContent = (student.nis && student.nis !== "-") ? `${student.nisn} / ${student.nis}` : (student.nisn || "-");
  if (elMadrasah) elMadrasah.textContent = namaMadrasah;
  if (elNsmNpsn) elNsmNpsn.textContent = `NSM: ${nsm} | NPSN: ${npsn}`;
  if (elAlamat) elAlamat.textContent = alamat;
  if (elKota) elKota.textContent = titimangsa;
  if (elTanggal) elTanggal.textContent = tanggal;

  if (elWatermark) elWatermark.style.display = showWatermark ? "flex" : "none";
  if (elBorder) elBorder.className = showMargin ? "border-2 border-slate-800 p-8 flex flex-col justify-between h-full relative z-10" : "p-8 flex flex-col justify-between h-full relative z-10";
}

function saveRaporConfiguration() {
  const inst = appData.institution || (appData.institution = {});
  const nama = document.getElementById("rapor-input-nama-madrasah")?.value.trim();
  const nsm = document.getElementById("rapor-input-nsm")?.value.trim();
  const npsn = document.getElementById("rapor-input-npsn")?.value.trim();
  const alamat = document.getElementById("rapor-input-alamat")?.value.trim();
  const kepala = document.getElementById("rapor-input-kepala")?.value.trim();
  const nip = document.getElementById("rapor-input-nip")?.value.trim();
  const titimangsa = document.getElementById("rapor-input-titimangsa")?.value.trim();
  const rawTanggal = document.getElementById("rapor-input-tanggal")?.value.trim();
  const tanggal = rawTanggal ? isoToIndoDate(rawTanggal) : (inst.tanggalRapor || "21 Desember 2024");

  if (nama) inst.name = nama;
  if (nsm) inst.nsm = nsm;
  if (npsn) inst.npsn = npsn;
  if (alamat) inst.alamat = alamat;
  if (kepala) inst.kepalaMadrasah = kepala;
  if (nip) inst.nipKepala = nip;
  if (titimangsa) inst.titimangsaKota = titimangsa;
  if (tanggal) inst.tanggalRapor = tanggal;

  saveAppData(appData);
  applyInstitutionDataToAllViews();
  showToast("Konfigurasi parameter Rapor KMA 450 berhasil disimpan dan disinkronkan ke seluruh sistem!");
}

function resetRaporConfiguration() {
  const defaultInst = DEFAULT_DATA.institution;
  appData.institution = {
    ...appData.institution,
    ...defaultInst
  };

  saveAppData(appData);
  applyInstitutionDataToAllViews();
  showToast("Formulir Rapor dikembalikan ke standar awal KMA 450");
}

function printRaporCoverA4() {
  const studentId = document.getElementById("rapor-select-siswa")?.value;
  const student = (appData.students && appData.students.find(s => s.id === studentId)) || (appData.students && appData.students[0]);
  if (!student) {
    showToast("Belum ada data siswa terdaftar untuk mencetak sampul rapor.");
    return;
  }

  const printArea = document.getElementById("printable-area");
  if (!printArea) return;

  printArea.innerHTML = `
    <div class="printable-document p-10 font-sans leading-relaxed text-black max-w-[210mm] min-h-[297mm] mx-auto bg-white flex flex-col justify-between border-4 border-black">
      
      <!-- Bagian Atas -->
      <div class="text-center pt-8 space-y-4">
        <div class="w-24 h-24 mx-auto flex items-center justify-center">
          ${appData.institution.logo ? `
            <img src="${appData.institution.logo}" class="max-h-24 max-w-24 object-contain">
          ` : `
            <div class="w-20 h-20 mx-auto rounded-2xl bg-emerald-800 text-white flex items-center justify-center font-bold text-3xl">
              ☪
            </div>
          `}
        </div>

        <div class="space-y-1">
          <p class="text-sm uppercase tracking-widest font-bold text-gray-700">KEMENTERIAN AGAMA REPUBLIK INDONESIA</p>
          <h1 class="text-3xl font-black uppercase tracking-tight">RAPOR PESERTA DIDIK</h1>
          <h2 class="text-xl font-bold uppercase text-emerald-900">MADRASAH TSANAWIYAH (MTs)</h2>
          <p class="text-xs text-gray-600 italic">Standar Keputusan Menteri Agama (KMA) No. 450 Tahun 2024</p>
        </div>
      </div>

      <!-- Kotak Tengah Identitas Siswa -->
      <div class="my-auto py-12 text-center space-y-6">
        <p class="text-xs uppercase tracking-wider font-semibold text-gray-600">Nama Peserta Didik:</p>
        <div class="border-2 border-black px-8 py-5 inline-block max-w-lg w-full bg-white">
          <h2 class="text-2xl font-black uppercase tracking-wide">${student.nama}</h2>
        </div>
        <div class="space-y-1">
          <p class="text-xs text-gray-600">Nomor Induk Siswa Nasional (NISN) / NIS:</p>
          <p class="text-xl font-black tracking-widest font-mono">${student.nisn} / ${student.nis}</p>
        </div>
      </div>

      <!-- Bagian Bawah Lembaga -->
      <div class="text-center pb-8 space-y-2 border-t-2 border-gray-400 pt-6">
        <h3 class="text-lg font-black uppercase">${appData.institution.name}</h3>
        <p class="text-xs font-semibold">NSM: ${appData.institution.nsm} | NPSN: ${appData.institution.npsn}</p>
        <p class="text-xs text-gray-600 max-w-md mx-auto">${appData.institution.alamat}</p>
        <p class="text-xs font-bold text-emerald-900 pt-2">${appData.institution.titimangsaKota}, ${appData.institution.tanggalRapor}</p>
      </div>

    </div>
  `;

  window.print();
}

/**
 * Print Lembar Buku Induk Tunggal Siswa (A4)
 */
function printSingleStudentIndukA4() {
  if (!selectedStudentForDrawer) {
    showToast("Pilih siswa terlebih dahulu");
    return;
  }
  quickPrintInduk(selectedStudentForDrawer.id);
}

function quickPrintInduk(studentId) {
  const s = appData.students.find(st => st.id === studentId);
  if (!s) return;

  const printArea = document.getElementById("printable-area");
  if (!printArea) return;

  const hasBerkas = (b) => b ? "Lengkap" : "Belum";
  const berkas = s.berkas || {};

  printArea.innerHTML = `
    <div class="printable-document p-8 font-sans leading-relaxed text-black max-w-[210mm] mx-auto bg-white border border-gray-400">
      
      <!-- Kop Buku Induk -->
      <div class="text-center pb-3 border-b-2 border-black relative">
        ${appData.institution.logo ? `
          <div class="absolute left-0 top-0 bottom-0 w-16 flex items-center justify-center">
            <img src="${appData.institution.logo}" class="max-h-14 max-w-16 object-contain">
          </div>
        ` : ''}
        <h2 class="text-xs uppercase font-bold text-gray-700">KEMENTERIAN AGAMA REPUBLIK INDONESIA</h2>
        <h1 class="text-base font-black uppercase text-emerald-900">LEMBAR BUKU INDUK PESERTA DIDIK DIGITAL</h1>
        <p class="text-xs font-bold">${appData.institution.name} • ${(appData.institution.kota || 'KABUPATEN TASIKMALAYA').toUpperCase()}</p>
        <p class="text-[10px] text-gray-500">NSM: ${appData.institution.nsm || '-'} | NPSN: ${appData.institution.npsn || '-'} | Akreditasi: ${appData.institution.statusAkreditasi || '-'}</p>
      </div>

      <div class="my-3 flex justify-between items-center bg-gray-100 p-3 rounded">
        <div>
          <h2 class="text-base font-extrabold uppercase text-slate-900">${s.nama}</h2>
          <p class="text-xs font-mono">NISN: ${s.nisn} | NIS: ${s.nis} | NIK: ${s.nik}</p>
        </div>
        <div class="text-right text-xs">
          <p class="font-bold">Kelas ${s.tingkat} • ${s.rombel}</p>
          <p class="text-emerald-800 font-semibold">${s.domisili || 'Non-Mukim'} ${s.asrama && s.asrama !== '-' ? `(${s.asrama})` : ''}</p>
          <p class="text-[10px] text-slate-500">Status: ${s.statusSiswa || 'Aktif'}</p>
        </div>
      </div>

      <!-- Tabel Lengkap 34 Kolom EMIS -->
      <table class="w-full text-xs border border-gray-300 border-collapse mb-4">
        <tbody>
          <!-- 1. Identitas Pokok -->
          <tr class="bg-gray-200 font-bold text-gray-800"><td colspan="2" class="p-1.5 uppercase text-[11px]">I. Data Identitas Pokok Siswa</td></tr>
          <tr class="border-b"><td class="p-1.5 w-56 font-semibold bg-gray-50">Nama Lengkap Siswa</td><td class="p-1.5 font-bold">${s.nama}</td></tr>
          <tr class="border-b"><td class="p-1.5 font-semibold bg-gray-50">NISN / NIS / NIK</td><td class="p-1.5 font-mono">${s.nisn} / ${s.nis} / ${s.nik}</td></tr>
          <tr class="border-b"><td class="p-1.5 font-semibold bg-gray-50">Tempat, Tanggal Lahir</td><td class="p-1.5">${s.tempatLahir || '-'}, ${s.tanggalLahir || '-'}</td></tr>
          <tr class="border-b"><td class="p-1.5 font-semibold bg-gray-50">Jenis Kelamin / Agama</td><td class="p-1.5">${s.jk === 'L' ? 'Laki-laki (L)' : 'Perempuan (P)'} • Agama: ${s.agama || 'Islam'}</td></tr>
          <tr class="border-b"><td class="p-1.5 font-semibold bg-gray-50">Jumlah Saudara Kandung</td><td class="p-1.5">${s.jmlSaudara !== undefined && s.jmlSaudara !== '' ? s.jmlSaudara : '0'} Bersaudara</td></tr>

          <!-- 2. Data Akademik -->
          <tr class="bg-gray-200 font-bold text-gray-800"><td colspan="2" class="p-1.5 uppercase text-[11px]">II. Data Akademik & Status Madrasah</td></tr>
          <tr class="border-b"><td class="p-1.5 font-semibold bg-gray-50">Tingkat / Rombel / Kelompok</td><td class="p-1.5">Kelas ${s.tingkat || 'VII'} • Rombel: ${s.rombel || '-'} • Kelompok: ${s.kelompok || 'Reguler'}</td></tr>
          <tr class="border-b"><td class="p-1.5 font-semibold bg-gray-50">Tanggal Masuk Madrasah</td><td class="p-1.5">${s.tanggalMasuk || '-'}</td></tr>
          <tr class="border-b"><td class="p-1.5 font-semibold bg-gray-50">Domisili Santri & Kamar Asrama</td><td class="p-1.5">${s.domisili || 'Non-Mukim'} ${s.asrama && s.asrama !== '-' ? `(Asrama/Kamar: ${s.asrama})` : ''}</td></tr>

          <!-- 3. Orang Tua -->
          <tr class="bg-gray-200 font-bold text-gray-800"><td colspan="2" class="p-1.5 uppercase text-[11px]">III. Data Orang Tua Kandung & Wali</td></tr>
          <tr class="border-b"><td class="p-1.5 font-semibold bg-gray-50">Ayah Kandung (Nama / NIK)</td><td class="p-1.5">${s.namaAyah || '-'} (NIK: ${s.nikAyah || '-'})</td></tr>
          <tr class="border-b"><td class="p-1.5 font-semibold bg-gray-50">Pendidikan / Pekerjaan / Penghasilan Ayah</td><td class="p-1.5">${s.pendidikanAyah || '-'} • ${s.pekerjaanAyah || s.pekerjaanOrtu || '-'} • Penghasilan: ${s.penghasilanAyah || '-'}</td></tr>
          <tr class="border-b"><td class="p-1.5 font-semibold bg-gray-50">Ibu Kandung (Nama / NIK)</td><td class="p-1.5">${s.namaIbu || '-'} (NIK: ${s.nikIbu || '-'})</td></tr>
          <tr class="border-b"><td class="p-1.5 font-semibold bg-gray-50">Pekerjaan & Penghasilan Ibu</td><td class="p-1.5">${s.pekerjaanIbu || '-'} • Penghasilan: ${s.penghasilanIbu || '-'}</td></tr>
          <tr class="border-b"><td class="p-1.5 font-semibold bg-gray-50">No. HP / WhatsApp Wali</td><td class="p-1.5 font-mono font-bold">${s.teleponOrtu || '-'}</td></tr>

          <!-- 4. Alamat Lengkap -->
          <tr class="bg-gray-200 font-bold text-gray-800"><td colspan="2" class="p-1.5 uppercase text-[11px]">IV. Alamat Lengkap Tempat Tinggal</td></tr>
          <tr class="border-b"><td class="p-1.5 font-semibold bg-gray-50">Alamat Rumah</td><td class="p-1.5">${s.alamat || '-'}</td></tr>
          <tr class="border-b"><td class="p-1.5 font-semibold bg-gray-50">RT/RW • Kelurahan • Kecamatan • Kab</td><td class="p-1.5">RT/RW: ${s.rtRw || '-'}, Desa: ${s.kelurahan || '-'}, Kec: ${s.kecamatan || '-'}, Kab: ${s.kabupaten || '-'}</td></tr>

          <!-- 5. Sekolah Asal -->
          <tr class="bg-gray-200 font-bold text-gray-800"><td colspan="2" class="p-1.5 uppercase text-[11px]">V. Riwayat Sekolah Asal & Ujian</td></tr>
          <tr class="border-b"><td class="p-1.5 font-semibold bg-gray-50">Nama Sekolah Asal (SD/MI) • NPSN</td><td class="p-1.5">${s.sekolahAsal || '-'} (NPSN: ${s.npsnAsal || '-'})</td></tr>
          <tr class="border-b"><td class="p-1.5 font-semibold bg-gray-50">No. Peserta Ujian • No. Seri Ijazah</td><td class="p-1.5">No. Ujian: ${s.noUjian || '-'} • No. Ijazah: ${s.noIjazah || '-'}</td></tr>

          <!-- 6. Kebutuhan & Berkas -->
          <tr class="bg-gray-200 font-bold text-gray-800"><td colspan="2" class="p-1.5 uppercase text-[11px]">VI. Kebutuhan Khusus, Berkas & Catatan</td></tr>
          <tr class="border-b"><td class="p-1.5 font-semibold bg-gray-50">Kebutuhan Khusus / Beasiswa</td><td class="p-1.5">${s.kebutuhan || 'Tidak Ada'} • Beasiswa: ${s.beasiswa || '-'}</td></tr>
          <tr class="border-b"><td class="p-1.5 font-semibold bg-gray-50">Kelengkapan Berkas Fisik (Arsip TU)</td><td class="p-1.5">Akta: ${hasBerkas(berkas.aktaKelahiran)} | KK: ${hasBerkas(berkas.kartuKeluarga)} | Ijazah SD: ${hasBerkas(berkas.ijazahSD)} | Surat Perjanjian: ${hasBerkas(berkas.suratPerjanjian)}</td></tr>
          <tr><td class="p-1.5 font-semibold bg-gray-50">Keterangan / Catatan BK</td><td class="p-1.5 italic">${s.keterangan || s.catatanBK || 'Tidak ada catatan khusus.'}</td></tr>
        </tbody>
      </table>

      <div class="mt-6 flex justify-between text-xs">
        <div class="text-center w-52">
          <p>Mengetahui,</p>
          <p class="font-bold">Kepala Madrasah,</p>
          <div class="h-16"></div>
          <p class="font-bold underline uppercase">${appData.institution.kepalaMadrasah || 'Drs. H. Ahmad Fadlli, M.Pd.I'}</p>
          <p class="text-[10px]">NIP. ${appData.institution.nipKepala || '196908151994031002'}</p>
        </div>
        <div class="text-center w-52">
          <p>${appData.institution.titimangsaKota || appData.institution.kota || 'Singaparna'}, ${appData.institution.tanggalRapor || '21 Desember 2024'}</p>
          <p class="font-bold">Kepala Tata Usaha,</p>
          <div class="h-16"></div>
          <p class="font-bold underline uppercase">${appData.institution.kepalaTU || 'Hj. Siti Rahmawati, S.Pd'}</p>
          <p class="text-[10px]">NIP. ${appData.institution.nipTU || '197804122005012004'}</p>
        </div>
      </div>

    </div>
  `;

  window.print();
}

/* ========================================================
   MODUL 6: PENGATURAN SISTEM (PG-01 S/D PG-04)
   ======================================================== */
function switchSettingsSubTab(subTabId) {
  if (!subTabId) subTabId = "sub-profil";

  // Simpan sub-tab aktif ke localStorage & URL hash
  try {
    localStorage.setItem(ACTIVE_SETTINGS_SUBTAB_KEY, subTabId);
    if (currentTab === "tab-pengaturan") {
      try { history.replaceState(null, "", `#tab-pengaturan/${subTabId}`); } catch (e) {}
    }
  } catch (e) {}

  document.querySelectorAll(".settings-subnav").forEach(b => {
    b.classList.remove("active", "border-b-2", "border-emerald-600", "text-emerald-700", "bg-white");
    b.classList.add("text-slate-600");
  });

  const activeNav = document.getElementById(`subnav-${subTabId.replace('sub-', '')}`);
  if (activeNav) {
    activeNav.classList.add("active", "border-b-2", "border-emerald-600", "text-emerald-700", "bg-white");
    activeNav.classList.remove("text-slate-600");
  }

  document.querySelectorAll(".settings-subtab").forEach(tab => tab.classList.add("hidden"));
  const target = document.getElementById(subTabId);
  if (target) target.classList.remove("hidden");

  if (subTabId === "sub-profil") {
    applyInstitutionDataToAllViews();
    updateLogoSettingsUI(appData?.institution?.logo || "");
  } else if (subTabId === "sub-kalender") {
    renderCalendarSettings();
  } else if (subTabId === "sub-pengguna") {
    renderUsersTable();
  } else if (subTabId === "sub-tingkat-rombel") {
    renderRombelTable();
    renderTingkatTable();
  }

  lucide.createIcons();
}

let editingUserId = null;

function renderUsersTable() {
  const tbody = document.getElementById("users-table-body");
  if (!tbody || !appData.users) return;

  if (appData.users.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="py-6 text-center text-slate-400">Belum ada akun pengguna terdaftar.</td></tr>`;
    return;
  }

  tbody.innerHTML = appData.users.map(u => {
    const isCurrentUser = currentUser && currentUser.id === u.id;
    return `
      <tr class="hover:bg-slate-50 transition-colors">
        <td class="py-2.5 px-4 whitespace-nowrap">
          <div class="flex items-center space-x-2">
            <div>
              <span class="font-bold text-slate-900 block whitespace-nowrap">${u.nama}</span>
              <span class="text-[10px] text-slate-500 font-mono whitespace-nowrap">NIP: ${u.nip || '-'}</span>
            </div>
            ${isCurrentUser ? `
              <span class="inline-block px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-blue-100 text-blue-800 uppercase whitespace-nowrap">
                Sedang Digunakan
              </span>
            ` : ''}
          </div>
        </td>
        <td class="py-2.5 px-4 font-mono text-slate-600 whitespace-nowrap">${u.username}</td>
        <td class="py-2.5 px-4 font-bold text-emerald-800 whitespace-nowrap">${u.peran}</td>
        <td class="py-2.5 px-4 text-slate-500 text-[11px] max-w-xs truncate whitespace-nowrap" title="${u.akses}">${u.akses}</td>
        <td class="py-2.5 px-4 text-center whitespace-nowrap">
          <span class="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${u.status === 'Aktif' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'} whitespace-nowrap">
            ${u.status}
          </span>
        </td>
        <td class="py-2.5 px-4 text-right whitespace-nowrap">
          <button onclick="openEditUserModal('${u.id}')" class="px-2.5 py-1 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 rounded-lg text-[11px] font-bold transition-colors whitespace-nowrap mr-1">
            Edit
          </button>
          <button onclick="deleteUser('${u.id}')" class="px-2.5 py-1 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg text-[11px] font-bold transition-colors whitespace-nowrap">
            Hapus
          </button>
        </td>
      </tr>
    `;
  }).join("");

  lucide.createIcons();
}

function openAddUserModal() {
  editingUserId = null;
  const modal = document.getElementById("modal-user");
  if (!modal) return;

  const title = document.getElementById("modal-user-title");
  if (title) title.textContent = "Tambah Pengguna Baru";
  const btn = document.getElementById("btn-submit-user");
  if (btn) btn.textContent = "Simpan Pengguna";

  document.getElementById("form-user")?.reset();
  const selectStatus = document.getElementById("usr-input-status");
  if (selectStatus) selectStatus.value = "Aktif";
  const inPassword = document.getElementById("usr-input-password");
  if (inPassword) inPassword.value = "123";

  modal.classList.remove("hidden");
  document.getElementById("usr-input-nama")?.focus();
}

function openEditUserModal(userId) {
  const user = (appData.users || []).find(u => u.id === userId);
  if (!user) return;

  editingUserId = userId;
  const modal = document.getElementById("modal-user");
  if (!modal) return;

  const title = document.getElementById("modal-user-title");
  if (title) title.textContent = `Edit Pengguna: ${user.nama}`;
  const btn = document.getElementById("btn-submit-user");
  if (btn) btn.textContent = "Simpan Perubahan";

  const inNama = document.getElementById("usr-input-nama");
  const inUsername = document.getElementById("usr-input-username");
  const inPassword = document.getElementById("usr-input-password");
  const inNip = document.getElementById("usr-input-nip");
  const inPeran = document.getElementById("usr-input-peran");
  const inStatus = document.getElementById("usr-input-status");
  const inAkses = document.getElementById("usr-input-akses");

  if (inNama) inNama.value = user.nama || "";
  if (inUsername) inUsername.value = user.username || "";
  if (inPassword) inPassword.value = user.password || "123";
  if (inNip) inNip.value = user.nip || "";
  if (inPeran) inPeran.value = user.peran || "";
  if (inStatus) inStatus.value = user.status || "Aktif";
  if (inAkses) inAkses.value = user.akses || "";

  modal.classList.remove("hidden");
  inNama?.focus();
}

function closeUserModal() {
  const modal = document.getElementById("modal-user");
  if (modal) modal.classList.add("hidden");
  editingUserId = null;
}

function handleUserSubmit(e) {
  e.preventDefault();

  const nama = document.getElementById("usr-input-nama")?.value.trim();
  const username = document.getElementById("usr-input-username")?.value.trim();
  const password = document.getElementById("usr-input-password")?.value.trim() || "123";
  const nip = document.getElementById("usr-input-nip")?.value.trim() || "-";
  const peran = document.getElementById("usr-input-peran")?.value.trim();
  const status = document.getElementById("usr-input-status")?.value || "Aktif";
  const akses = document.getElementById("usr-input-akses")?.value.trim();

  if (!nama || !username || !peran || !akses) {
    alert("Harap lengkapi semua kolom yang bertanda bintang (*).");
    return;
  }

  if (!appData.users) appData.users = [];

  // Validasi keunikan username
  const duplicate = appData.users.find(u => u.id !== editingUserId && u.username.toLowerCase() === username.toLowerCase());
  if (duplicate) {
    alert(`Username "${username}" sudah digunakan oleh ${duplicate.nama}. Harap gunakan username lain.`);
    return;
  }

  if (editingUserId) {
    // Mode Edit
    const user = appData.users.find(u => u.id === editingUserId);
    if (!user) return;

    user.nama = nama;
    user.username = username;
    user.password = password;
    user.nip = nip;
    user.peran = peran;
    user.status = status;
    user.akses = akses;

    // Jika yang diedit adalah akun yang sedang aktif login, sinkronkan currentUser
    if (currentUser && currentUser.id === editingUserId) {
      currentUser = { ...user };
      updateCurrentUserUI();
    }

    saveAppData(appData);
    renderUsersTable();
    closeUserModal();
    showToast(`Data pengguna ${nama} berhasil diperbarui!`);
  } else {
    // Mode Tambah Baru
    const newId = `USR-${Date.now().toString().slice(-4)}`;
    const newUser = {
      id: newId,
      nama,
      username,
      password,
      nip,
      peran,
      status,
      akses
    };

    appData.users.push(newUser);
    saveAppData(appData);
    renderUsersTable();
    closeUserModal();
    showToast(`Pengguna baru ${nama} berhasil ditambahkan!`);
  }
}

function deleteUser(userId) {
  if (currentUser && currentUser.id === userId) {
    alert("Akun yang sedang aktif digunakan untuk login tidak dapat dihapus!");
    return;
  }

  if (!appData.users || appData.users.length <= 1) {
    alert("Minimal harus ada 1 akun pengguna terdaftar dalam sistem!");
    return;
  }

  const target = appData.users.find(u => u.id === userId);
  if (!target) return;

  if (confirm(`Apakah Anda yakin ingin menghapus akun pengguna "${target.nama}" (${target.username})?`)) {
    appData.users = appData.users.filter(u => u.id !== userId);
    saveAppData(appData);
    renderUsersTable();
    showToast(`Pengguna ${target.nama} berhasil dihapus.`);
  }
}

/**
 * Sinkronisasi Menyeluruh Data Profil Lembaga & Akreditasi
 * Menerapkan data nama, NSM, NPSN, akreditasi, alamat, kota, kontak, dan legitimasi pejabat ke:
 * 1. Sidebar Brand & Logo
 * 2. Top Header Title & School Name
 * 3. Halaman Login
 * 4. Dashboard DU-04 Akreditasi & Legalitas Madrasah
 * 5. Dashboard Welcome Banner
 * 6. Live Pratinjau SK Mutasi Resmi (#sk-preview-card: Kop, Kemenag, No, Lead, Signatories)
 * 7. Modul 5 Formulir Konfigurasi Rapor (Input Fields)
 * 8. Live Pratinjau Sampul Rapor KMA (#rapor-a4-sheet)
 * 9. Formulir Pengaturan Profil Lembaga (sub-profil)
 */
function applyInstitutionDataToAllViews() {
  const inst = (appData && appData.institution) || {};

  // 1. Sidebar School Name & Branding
  const sidebarSchool = document.getElementById("sidebar-school-name");
  if (sidebarSchool && inst.name) sidebarSchool.textContent = inst.name;

  // 2. Top Header Title & School Name
  const headerSchool = document.getElementById("header-school-name");
  if (headerSchool && inst.name) {
    headerSchool.textContent = `${inst.name} ${inst.titimangsaKota || inst.kota || ''}`.trim();
  }

  // 3. Login Screen School Name
  const loginSchool = document.getElementById("login-school-name");
  if (loginSchool && inst.name) loginSchool.textContent = inst.name;

  // 4. Dashboard Welcome Banner School Name
  const dashWelcome = document.getElementById("dash-welcome-school");
  if (dashWelcome && inst.name) dashWelcome.textContent = inst.name;

  // 5. Dashboard DU-04 Rombel Unggulan & Akreditasi BAN-S/M
  const dashAkreditasi = document.getElementById("dash-akreditasi-badge");
  if (dashAkreditasi) {
    dashAkreditasi.textContent = inst.statusAkreditasi ? `BAN-S/M: ${inst.statusAkreditasi}` : "BAN-S/M: A (96)";
  }
  const dashInstTitle = document.getElementById("dash-inst-title");
  if (dashInstTitle && inst.name) dashInstTitle.textContent = inst.name;

  const dashAkreditasiLabel = document.getElementById("dash-akreditasi-label");
  if (dashAkreditasiLabel) {
    const isUnggul = (inst.statusAkreditasi || '').includes('Unggul') || (inst.statusAkreditasi || '').startsWith('A');
    dashAkreditasiLabel.textContent = isUnggul ? "Terakreditasi Unggul" : (inst.statusAkreditasi || "Terakreditasi");
  }
  const dashLegalitas = document.getElementById("dash-legalitas-deskripsi");
  if (dashLegalitas) {
    const skDesc = inst.skOperasional || inst.skAkreditasi || "SK BAN-S/M No. 1857/BAN-SM/SK/2023";
    dashLegalitas.textContent = `${skDesc}. Memenuhi standar nasional sarana, pendidik, dan mutu lulusan madrasah.`;
  }

  // 6. Mutasi Subtitle
  const mutSchoolSub = document.getElementById("sk-preview-school-sub");
  if (mutSchoolSub && inst.name) mutSchoolSub.textContent = `Standar Resmi ${inst.name}`;

  // 7. Live Pratinjau SK Mutasi Resmi Kop & TTD
  const skKemenag = document.getElementById("sk-preview-kop-kemenag");
  if (skKemenag) {
    const kotaUpper = (inst.kota || 'KABUPATEN TASIKMALAYA').toUpperCase();
    skKemenag.textContent = kotaUpper.startsWith("KANTOR") ? kotaUpper : `KANTOR KEMENTERIAN AGAMA ${kotaUpper}`;
  }
  const skMadrasah = document.getElementById("sk-preview-kop-madrasah");
  if (skMadrasah && inst.name) skMadrasah.textContent = inst.name.toUpperCase();

  const skAlamatNsm = document.getElementById("sk-preview-kop-alamat-nsm");
  if (skAlamatNsm) {
    const parts = [];
    if (inst.alamat && inst.alamat !== "-") parts.push(inst.alamat);
    if (inst.kota) parts.push(inst.kota);
    if (inst.kodePos) parts.push(inst.kodePos);
    let addressStr = parts.join(", ");
    let nsmStr = inst.nsm ? `NSM: ${inst.nsm}` : '';
    let akredStr = inst.statusAkreditasi ? `Akreditasi: ${inst.statusAkreditasi}` : '';
    skAlamatNsm.textContent = [addressStr, nsmStr, akredStr].filter(Boolean).join(" | ");
  }

  const skLead = document.getElementById("sk-preview-lead-inst");
  if (skLead && inst.name) skLead.textContent = `Kepala ${inst.name}`;

  const skKota = document.getElementById("sk-preview-titimangsa-kota");
  if (skKota) skKota.textContent = inst.titimangsaKota || inst.kota || "Singaparna";

  const skKepala = document.getElementById("sk-preview-kepala-madrasah");
  if (skKepala && (!activeMutationForPreview || !activeMutationForPreview.pejabatPenandatangan)) {
    skKepala.textContent = inst.kepalaMadrasah || 'Drs. H. Ahmad Fadlli, M.Pd.I';
  }
  const skNipKepala = document.getElementById("sk-preview-nip-kepala");
  if (skNipKepala) skNipKepala.textContent = `NIP. ${inst.nipKepala || '196908151994031002'}`;

  const skTU = document.getElementById("sk-preview-kepala-tu");
  if (skTU && (!activeMutationForPreview || !activeMutationForPreview.verifikatorTU)) {
    skTU.textContent = inst.kepalaTU || 'Hj. Siti Rahmawati, S.Pd';
  }
  const skNipTU = document.getElementById("sk-preview-nip-tu");
  if (skNipTU) skNipTU.textContent = `NIP. ${inst.nipTU || '197804122005012004'}`;

  // 8. Sinkronisasi Formulir Pengaturan Profil Lembaga (sub-profil)
  // Cegah penimpaan nilai jika kursor pengguna sedang aktif berada di input tersebut
  const activeEl = document.activeElement;
  const isEditingSubProfil = activeEl && activeEl.id && activeEl.id.startsWith("set-inst-");

  if (!isEditingSubProfil) {
    const setInstName = document.getElementById("set-inst-name");
    if (setInstName && inst.name !== undefined) setInstName.value = inst.name;

    const setInstAkred = document.getElementById("set-inst-akreditasi");
    if (setInstAkred && inst.statusAkreditasi !== undefined) setInstAkred.value = inst.statusAkreditasi;

    const setInstSk = document.getElementById("set-inst-sk-akreditasi");
    if (setInstSk && (inst.skOperasional || inst.skAkreditasi)) setInstSk.value = inst.skOperasional || inst.skAkreditasi;

    const setInstNsm = document.getElementById("set-inst-nsm");
    if (setInstNsm && inst.nsm !== undefined) setInstNsm.value = inst.nsm;

    const setInstNpsn = document.getElementById("set-inst-npsn");
    if (setInstNpsn && inst.npsn !== undefined) setInstNpsn.value = inst.npsn;

    const setInstAlamat = document.getElementById("set-inst-alamat");
    if (setInstAlamat && inst.alamat !== undefined) setInstAlamat.value = inst.alamat;

    const setInstKota = document.getElementById("set-inst-kota");
    if (setInstKota && inst.kota !== undefined) setInstKota.value = inst.kota;

    const setInstTitimangsa = document.getElementById("set-inst-titimangsa");
    if (setInstTitimangsa && (inst.titimangsaKota !== undefined || inst.kota !== undefined)) {
      setInstTitimangsa.value = inst.titimangsaKota || inst.kota || "";
    }

    const setInstTelp = document.getElementById("set-inst-telepon");
    if (setInstTelp && inst.telepon !== undefined) setInstTelp.value = inst.telepon;

    const setInstEmail = document.getElementById("set-inst-email");
    if (setInstEmail && inst.email !== undefined) setInstEmail.value = inst.email;

    const setInstKepala = document.getElementById("set-inst-kepala");
    if (setInstKepala && inst.kepalaMadrasah !== undefined) setInstKepala.value = inst.kepalaMadrasah;

    const setInstNipKepala = document.getElementById("set-inst-nip-kepala");
    if (setInstNipKepala && inst.nipKepala !== undefined) setInstNipKepala.value = inst.nipKepala;

    const setInstTU = document.getElementById("set-inst-tu");
    if (setInstTU && inst.kepalaTU !== undefined) setInstTU.value = inst.kepalaTU;

    const setInstNipTU = document.getElementById("set-inst-nip-tu");
    if (setInstNipTU && inst.nipTU !== undefined) setInstNipTU.value = inst.nipTU;
  }

  // 9. Sinkronisasi Formulir Konfigurasi Rapor (Modul 5 Form Input)
  const isEditingRapor = activeEl && activeEl.id && activeEl.id.startsWith("rapor-input-");
  if (!isEditingRapor) {
    const raporName = document.getElementById("rapor-input-nama-madrasah");
    if (raporName && inst.name) raporName.value = inst.name;

    const raporNsm = document.getElementById("rapor-input-nsm");
    if (raporNsm && inst.nsm) raporNsm.value = inst.nsm;

    const raporNpsn = document.getElementById("rapor-input-npsn");
    if (raporNpsn && inst.npsn) raporNpsn.value = inst.npsn;

    const raporAlamat = document.getElementById("rapor-input-alamat");
    if (raporAlamat && inst.alamat) {
      raporAlamat.value = `${inst.alamat}${inst.kota ? ', ' + inst.kota : ''}`;
    }

    const raporKepala = document.getElementById("rapor-input-kepala");
    if (raporKepala && inst.kepalaMadrasah) raporKepala.value = inst.kepalaMadrasah;

    const raporNip = document.getElementById("rapor-input-nip");
    if (raporNip && inst.nipKepala) raporNip.value = inst.nipKepala;

    const raporKota = document.getElementById("rapor-input-titimangsa");
    if (raporKota && (inst.titimangsaKota || inst.kota)) raporKota.value = inst.titimangsaKota || inst.kota;

    const raporTgl = document.getElementById("rapor-input-tanggal");
    if (raporTgl && inst.tanggalRapor) raporTgl.value = dateToIso(inst.tanggalRapor);
  }

  // 10. Terapkan Logo & Live Preview Sampul Rapor
  applyInstitutionLogo();
  updateRaporPreview();
  if (typeof lucide !== "undefined" && lucide.createIcons) {
    try { lucide.createIcons(); } catch (e) {}
  }
}

function saveInstitutionSettings() {
  const name = document.getElementById("set-inst-name")?.value.trim();
  const akreditasi = document.getElementById("set-inst-akreditasi")?.value.trim();
  const skAkreditasi = document.getElementById("set-inst-sk-akreditasi")?.value.trim();
  const nsm = document.getElementById("set-inst-nsm")?.value.trim();
  const npsn = document.getElementById("set-inst-npsn")?.value.trim();
  const alamat = document.getElementById("set-inst-alamat")?.value.trim();
  const kota = document.getElementById("set-inst-kota")?.value.trim();
  const titimangsa = document.getElementById("set-inst-titimangsa")?.value.trim();
  const telepon = document.getElementById("set-inst-telepon")?.value.trim();
  const email = document.getElementById("set-inst-email")?.value.trim();
  const kepala = document.getElementById("set-inst-kepala")?.value.trim();
  const nipKepala = document.getElementById("set-inst-nip-kepala")?.value.trim();
  const tu = document.getElementById("set-inst-tu")?.value.trim();
  const nipTU = document.getElementById("set-inst-nip-tu")?.value.trim();

  if (!appData.institution) appData.institution = {};

  if (name) appData.institution.name = name;
  if (akreditasi) appData.institution.statusAkreditasi = akreditasi;
  if (skAkreditasi) {
    appData.institution.skOperasional = skAkreditasi;
    appData.institution.skAkreditasi = skAkreditasi;
  }
  if (nsm) appData.institution.nsm = nsm;
  if (npsn) appData.institution.npsn = npsn;
  if (alamat) appData.institution.alamat = alamat;
  if (kota) appData.institution.kota = kota;
  if (titimangsa) appData.institution.titimangsaKota = titimangsa;
  if (telepon) appData.institution.telepon = telepon;
  if (email) appData.institution.email = email;
  if (kepala) appData.institution.kepalaMadrasah = kepala;
  if (nipKepala) appData.institution.nipKepala = nipKepala;
  if (tu) appData.institution.kepalaTU = tu;
  if (nipTU) appData.institution.nipTU = nipTU;

  saveAppData(appData);
  applyInstitutionDataToAllViews();
  showToast("Profil Lembaga & Akreditasi berhasil disimpan dan diperbarui ke semua modul!");
}

/**
 * Terapkan Logo Lembaga secara dinamis ke seluruh sistem:
 * Sidebar Website, Sampul Rapor, Watermark, dan Preview Pengaturan
 */
function applyInstitutionLogo(customLogo) {
  const logo = (customLogo !== undefined) ? customLogo : ((appData && appData.institution && appData.institution.logo) || "");

  // 1. Sidebar Brand Logo
  const sidebarLogo = document.getElementById("sidebar-logo-container");
  if (sidebarLogo) {
    if (logo) {
      sidebarLogo.innerHTML = `<img src="${logo}" alt="Logo Lembaga" class="w-full h-full object-contain p-1 bg-white">`;
    } else {
      sidebarLogo.innerHTML = `
        <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
      `;
    }
  }

  // 2. Rapor Cover Top Logo
  const raporLogo = document.getElementById("rapor-cover-logo");
  if (raporLogo) {
    if (logo) {
      raporLogo.innerHTML = `<img src="${logo}" alt="Logo Rapor" class="w-full h-full object-contain p-1.5 bg-white rounded-xl">`;
    } else {
      raporLogo.innerHTML = `
        <svg class="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
      `;
    }
  }

  // 3. Rapor Watermark Logo
  const watermarkEl = document.getElementById("rapor-watermark-el");
  if (watermarkEl) {
    if (logo) {
      watermarkEl.innerHTML = `<img src="${logo}" alt="Watermark Logo" class="w-64 h-64 object-contain grayscale opacity-25">`;
    } else {
      watermarkEl.innerHTML = `
        <svg class="w-64 h-64 text-emerald-900" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
      `;
    }
  }

  // 4. Update UI di Kartu Pengaturan
  updateLogoSettingsUI(logo);

  // 5. Update Logo & Nama di Layar Login
  const loginLogo = document.getElementById("login-logo-container");
  if (loginLogo) {
    if (logo) {
      loginLogo.innerHTML = `<img src="${logo}" alt="Logo Lembaga" class="w-full h-full object-contain p-1 bg-white">`;
    } else {
      loginLogo.innerHTML = `
        <svg class="w-9 h-9 text-emerald-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
      `;
    }
  }

  const loginSchool = document.getElementById("login-school-name");
  if (loginSchool && appData?.institution?.name) {
    loginSchool.textContent = appData.institution.name;
  }
}

/**
 * Perbarui elemen preview, tombol hapus, dan badge di Pengaturan Profil Lembaga
 */
function updateLogoSettingsUI(logo) {
  const previewBox = document.getElementById("inst-logo-preview-box");
  const btnRemove = document.getElementById("btn-remove-logo");
  const badge = document.getElementById("logo-status-badge");

  if (previewBox) {
    if (logo) {
      previewBox.innerHTML = `<img src="${logo}" alt="Preview Logo" class="max-w-full max-h-full object-contain">`;
    } else {
      previewBox.innerHTML = `
        <div class="text-center text-slate-400">
          <i data-lucide="image" class="w-8 h-8 mx-auto mb-1 stroke-1 text-slate-300"></i>
          <span class="text-[10px] block font-semibold text-slate-400">Logo Standar</span>
        </div>
      `;
    }
  }

  if (btnRemove) {
    if (logo) {
      btnRemove.classList.remove("hidden");
    } else {
      btnRemove.classList.add("hidden");
    }
  }

  if (badge) {
    if (logo) {
      badge.className = "px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 whitespace-nowrap";
      badge.textContent = "Logo Kustom Aktif";
    } else {
      badge.className = "px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700 whitespace-nowrap";
      badge.textContent = "Logo Bawaan Sistem";
    }
  }

  lucide.createIcons();
}

/**
 * Handle Upload Berkas Logo Baru
 */
function handleInstitutionLogoUpload(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    alert("Harap pilih berkas gambar yang valid (PNG, JPG, JPEG, SVG, WebP)!");
    event.target.value = "";
    return;
  }

  if (file.size > 2 * 1024 * 1024) {
    alert("Ukuran berkas logo terlalu besar (maksimal 2MB)! Disarankan kompresi gambar sebelum diunggah.");
    event.target.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = function(evt) {
    const base64Data = evt.target.result;
    if (!appData.institution) appData.institution = {};
    appData.institution.logo = base64Data;
    saveAppData(appData);
    applyInstitutionLogo(base64Data);
    updateRaporPreview();
    showToast("Logo resmi madrasah berhasil diperbarui di website dan seluruh dokumen cetak!");
  };
  reader.onerror = function() {
    alert("Terjadi kesalahan saat membaca berkas gambar. Silakan coba lagi.");
  };
  reader.readAsDataURL(file);
}

/**
 * Kembalikan ke Logo Bawaan Sistem
 */
function removeInstitutionLogo() {
  if (confirm("Apakah Anda yakin ingin menghapus logo khusus dan kembali menggunakan logo standar sistem?")) {
    if (appData.institution) {
      appData.institution.logo = "";
    }
    saveAppData(appData);
    applyInstitutionLogo("");
    updateRaporPreview();
    const input = document.getElementById("input-inst-logo");
    if (input) input.value = "";
    showToast("Logo khusus dihapus. Menggunakan logo standar sistem.");
  }
}

/**
 * PG-04 Pencadangan Mandiri (Backup Snapshot JSON / SQL Format)
 */
async function doBackupData() {
  // Jika backend online, pastikan dataset terbaru tersinkron sebelum pencadangan
  if (window.SIDASI_API && window.SIDASI_API.isOnline()) {
    try {
      const serverData = await window.SIDASI_API.fetchData();
      if (serverData && typeof serverData === 'object' && serverData.institution) {
        appData = serverData;
      }
    } catch (e) {
      console.warn("Sinkronisasi backend sebelum backup tertunda:", e);
    }
  }

  const backupObj = {
    app: "SIDASI_MTS_ALFADLLIYAH",
    version: "2.4",
    generatedAt: new Date().toISOString(),
    activeAcademicYearId: appData.activeAcademicYearId,
    institution: appData.institution,
    stats: appData.stats,
    students: appData.students,
    mutations: appData.mutations,
    beasiswaList: appData.beasiswaList,
    academicYears: appData.academicYears,
    yearlyData: appData.yearlyData
  };

  const jsonStr = JSON.stringify(backupObj, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const a = document.createElement("a");
  a.href = url;
  a.download = `backup_sidasi_alfadlliyah_${timestamp}.sql.gz.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast("Cadangan basis data lengkap berhasil diunduh!");
}

function handleRestoreFile(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async function(evt) {
    try {
      const restored = JSON.parse(evt.target.result);
      if (restored && (restored.students || restored.institution)) {
        appData = {
          ...DEFAULT_DATA,
          ...restored
        };
        if (!appData.yearlyData) {
          appData.yearlyData = initDefaultYearlyData(appData);
        }
        saveAppData(appData);

        // Sinkronkan ke Backend Server jika aktif
        let backendRestored = false;
        if (window.SIDASI_API && window.SIDASI_API.isOnline()) {
          try {
            await window.SIDASI_API.restoreData(appData);
            await window.SIDASI_API.syncData(appData, true);
            backendRestored = true;
          } catch (err) {
            console.warn("Gagal sinkronisasi restore ke backend:", err);
          }
        }

        populateAcademicYearDropdown();
        renderAllModules();

        if (backendRestored) {
          showToast(`🟢 Basis data berhasil dipulihkan & disinkronkan ke Backend Server (Port ${window.SIDASI_API.getPort()}) serta Lokal!`);
        } else {
          showToast("Basis data lokal berhasil dipulihkan dari berkas cadangan!");
        }
      } else {
        alert("Format berkas cadangan tidak valid atau tidak dikenali.");
      }
    } catch (err) {
      alert("Gagal membaca berkas cadangan. Pastikan format berkas sesuai.");
    }
  };
  reader.readAsText(file);
}

// ========================================================
// KONTROL POP-UP & EKSEKUSI HAPUS SELURUH BASIS DATA
// ========================================================

function openWipeDatabaseModal() {
  const modal = document.getElementById("modal-wipe-database");
  if (modal) {
    modal.classList.remove("hidden");
    if (window.lucide && typeof window.lucide.createIcons === "function") {
      window.lucide.createIcons();
    }
  }
}
window.openWipeDatabaseModal = openWipeDatabaseModal;

function closeWipeDatabaseModal() {
  const modal = document.getElementById("modal-wipe-database");
  if (modal) {
    modal.classList.add("hidden");
  }
}
window.closeWipeDatabaseModal = closeWipeDatabaseModal;

function resetToFactoryDefault() {
  openWipeDatabaseModal();
}
window.resetToFactoryDefault = resetToFactoryDefault;

async function executeWipeDatabase() {
  const btn = document.getElementById("btn-confirm-wipe-database");
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i><span>Menghapus...</span>`;
    if (window.lucide && typeof window.lucide.createIcons === "function") {
      window.lucide.createIcons();
    }
  }

  try {
    // 1. Kosongkan seluruh data operasional kesiswaan
    appData.students = [];
    appData.mutations = [];
    appData.beasiswaList = [];
    appData.rombelList = [];
    appData.rombelSummary = [];
    appData.rombelUnggulan = [];
    appData.stats = {
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

    // Pertahankan akun login administrator (hanya admin yang dipertahankan)
    if (!appData.users || !Array.isArray(appData.users) || appData.users.length === 0) {
      appData.users = JSON.parse(JSON.stringify(DEFAULT_DATA.users));
    } else {
      const adminUser = appData.users.find(u => u.username === "admin") || DEFAULT_DATA.users[0];
      appData.users = [adminUser];
    }

    // Reset pagu dan serapan pilar beasiswa
    if (appData.beasiswaPillars && Array.isArray(appData.beasiswaPillars)) {
      appData.beasiswaPillars.forEach(p => {
        p.penerima = 0;
        p.totalAlokasi = 0;
        p.realisasi = 0;
        p.persenSerapan = 0;
      });
    }

    // Reset data arsip tahunan kesiswaan
    if (typeof initDefaultYearlyData === "function") {
      appData.yearlyData = initDefaultYearlyData(appData);
    } else {
      appData.yearlyData = {};
    }

    // 2. Simpan kondisi bersih ke LocalStorage
    saveAppData(appData);

    // 3. Sinkronkan reset ke Server Backend jika sedang terhubung
    let backendSuccess = false;
    if (window.SIDASI_API && window.SIDASI_API.isOnline()) {
      try {
        if (typeof window.SIDASI_API.resetData === "function") {
          await window.SIDASI_API.resetData();
          backendSuccess = true;
        } else if (typeof window.SIDASI_API.syncData === "function") {
          await window.SIDASI_API.syncData(appData, true);
          backendSuccess = true;
        }
      } catch (e) {
        console.warn("Gagal sinkronisasi reset ke backend:", e);
      }
    }

    // 4. Tutup modal pop-up konfirmasi
    closeWipeDatabaseModal();

    // 5. Perbarui seluruh tampilan modul dan statistik
    populateAcademicYearDropdown();
    renderAllModules();
    if (typeof renderStudentsTable === "function") renderStudentsTable();
    if (typeof renderMutationsTable === "function") renderMutationsTable();
    if (typeof renderBeasiswaTable === "function") renderBeasiswaTable();
    if (typeof renderRombelList === "function") renderRombelList();
    if (typeof renderDashboardStats === "function") renderDashboardStats();

    showToast(backendSuccess
      ? "🗑️ Seluruh basis data berhasil dihapus dan dikosongkan (Server & Lokal). Akun login tetap aktif."
      : "🗑️ Seluruh basis data lokal berhasil dihapus dan dikosongkan. Akun login tetap aktif."
    );
  } catch (err) {
    console.error("Gagal mengosongkan database:", err);
    showToast("⚠️ Gagal mengosongkan database: " + err.message, "error");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<i data-lucide="trash-2" class="w-4 h-4"></i><span>Ya, Hapus Semua Data</span>`;
      if (window.lucide && typeof window.lucide.createIcons === "function") {
        window.lucide.createIcons();
      }
    }
  }
}
window.executeWipeDatabase = executeWipeDatabase;

/* ========================================================
   MODUL 0: OTENTIKASI & FORM LOGIN (LG-00 & LG-01)
   ======================================================== */

/**
 * Tampilkan Tampilan Login
 */
function showLoginView() {
  const viewLogin = document.getElementById("view-login");
  const appWrapper = document.getElementById("app-wrapper");
  if (viewLogin) viewLogin.classList.remove("hidden");
  if (appWrapper) appWrapper.classList.add("hidden");

  applyInstitutionLogo();
  lucide.createIcons();
}

/**
 * Sembunyikan Tampilan Login dan Tampilkan Dasbor Aplikasi
 */
function hideLoginView() {
  const viewLogin = document.getElementById("view-login");
  const appWrapper = document.getElementById("app-wrapper");
  if (viewLogin) viewLogin.classList.add("hidden");
  if (appWrapper) appWrapper.classList.remove("hidden");

  lucide.createIcons();
}

/**
 * Toggle Tampilkan / Sembunyikan Kata Sandi
 */
function toggleLoginPasswordVisibility() {
  const passInput = document.getElementById("login-password");
  const eyeIcon = document.getElementById("login-eye-icon");
  if (!passInput) return;

  if (passInput.type === "password") {
    passInput.type = "text";
    if (eyeIcon) eyeIcon.setAttribute("data-lucide", "eye-off");
  } else {
    passInput.type = "password";
    if (eyeIcon) eyeIcon.setAttribute("data-lucide", "eye");
  }
  lucide.createIcons();
}

/**
 * Eksekusi Autentikasi Pengguna saat Formulir Login Disubmit
 */
function handleUserLogin() {
  const uInput = document.getElementById("login-username");
  const pInput = document.getElementById("login-password");
  const rInput = document.getElementById("login-remember");
  const errBox = document.getElementById("login-error-box");
  const errMsg = document.getElementById("login-error-message");

  const username = uInput ? uInput.value.trim() : "";
  const password = pInput ? pInput.value.trim() : "";
  const remember = rInput ? rInput.checked : true;

  if (!username) {
    if (errBox && errMsg) {
      errMsg.textContent = "Silakan masukkan username Anda.";
      errBox.classList.remove("hidden");
    }
    return;
  }

  const user = (appData.users || []).find(u => u.username.toLowerCase() === username.toLowerCase());
  if (!user) {
    if (errBox && errMsg) {
      errMsg.textContent = `Username "${username}" tidak terdaftar dalam sistem.`;
      errBox.classList.remove("hidden");
    }
    return;
  }

  if (user.status !== "Aktif") {
    if (errBox && errMsg) {
      errMsg.textContent = `Akun ${user.nama} berstatus Non-Aktif. Hubungi Administrator.`;
      errBox.classList.remove("hidden");
    }
    return;
  }

  // Verifikasi Password: cocokkan dengan password akun terdaftar
  const validPass = user.password || "admin";
  if (password !== validPass) {
    if (errBox && errMsg) {
      errMsg.textContent = "Kata sandi yang Anda masukkan salah. Silakan periksa kembali.";
      errBox.classList.remove("hidden");
    }
    return;
  }

  // Sukses login
  if (errBox) errBox.classList.add("hidden");
  currentUser = user;

  if (remember) {
    localStorage.setItem("SIDASI_AUTH_USER_ID", user.id);
    sessionStorage.removeItem("SIDASI_AUTH_USER_ID");
  } else {
    sessionStorage.setItem("SIDASI_AUTH_USER_ID", user.id);
    localStorage.removeItem("SIDASI_AUTH_USER_ID");
  }

  updateCurrentUserUI();
  hideLoginView();
  showToast(`Selamat datang, ${user.nama}!`);
}

/**
 * Keluar / Logout dari Sistem
 */
function handleLogout() {
  const userName = currentUser ? currentUser.nama : "Pengguna";
  if (confirm(`Apakah Anda yakin ingin keluar dari akun ${userName}?`)) {
    localStorage.removeItem("SIDASI_AUTH_USER_ID");
    sessionStorage.removeItem("SIDASI_AUTH_USER_ID");
    
    // Reset form login
    const uInput = document.getElementById("login-username");
    const pInput = document.getElementById("login-password");
    const errBox = document.getElementById("login-error-box");
    if (uInput) uInput.value = "";
    if (pInput) pInput.value = "";
    if (errBox) errBox.classList.add("hidden");

    showLoginView();
    showToast("Anda telah berhasil keluar dari sistem.");
  }
}

/**
 * Pemeriksaan Sesi Saat Aplikasi Dimuat
 */
function checkAuthSession() {
  const savedUserId = localStorage.getItem("SIDASI_AUTH_USER_ID") || sessionStorage.getItem("SIDASI_AUTH_USER_ID");
  if (savedUserId && appData.users) {
    const user = appData.users.find(u => u.id === savedUserId && u.status === "Aktif");
    if (user) {
      currentUser = user;
      updateCurrentUserUI();
      hideLoginView();
      return true;
    }
  }

  // Jika belum ada sesi login, tampilkan layar login
  showLoginView();
  return false;
}

function openAuthModal() {
  const modal = document.getElementById("modal-auth");
  const list = document.getElementById("auth-users-list");
  if (!modal || !list) return;

  list.innerHTML = appData.users.map(u => `
    <div onclick="selectUser('${u.id}')" class="p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 cursor-pointer transition-all flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <div class="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
          ${u.nama.charAt(0)}
        </div>
        <div>
          <p class="text-xs font-bold text-slate-900">${u.nama}</p>
          <p class="text-[11px] text-emerald-700 font-semibold">${u.peran}</p>
        </div>
      </div>
      <span class="text-[10px] font-bold text-slate-400">${u.username}</span>
    </div>
  `).join("");

  modal.classList.remove("hidden");
  lucide.createIcons();
}

function closeAuthModal() {
  const modal = document.getElementById("modal-auth");
  if (modal) modal.classList.add("hidden");
}

function selectUser(userId) {
  const user = appData.users.find(u => u.id === userId);
  if (user) {
    currentUser = user;
    if (localStorage.getItem("SIDASI_AUTH_USER_ID")) {
      localStorage.setItem("SIDASI_AUTH_USER_ID", user.id);
    } else {
      sessionStorage.setItem("SIDASI_AUTH_USER_ID", user.id);
    }
    updateCurrentUserUI();
    closeAuthModal();
    showToast(`Masuk sebagai: ${user.nama} (${user.peran})`);
  }
}

function updateCurrentUserUI() {
  if (!currentUser && appData && appData.users && appData.users.length > 0) {
    currentUser = appData.users[0];
  }

  const elAvatar = document.getElementById("current-user-avatar");
  const elName = document.getElementById("current-user-name");
  const elRole = document.getElementById("current-user-role");

  const hName = document.getElementById("header-user-name");
  const hRole = document.getElementById("header-user-role");
  const hAvatar = document.getElementById("header-user-avatar") || document.getElementById("btn-open-user-modal");

  const userName = currentUser ? currentUser.nama : "Administrator SIDASI";
  const userRole = currentUser ? currentUser.peran : "Administrator Sistem";
  const initials = userName.split(" ").slice(0, 2).map(n => n[0]).join("") || "AD";

  if (elAvatar) elAvatar.textContent = initials;
  if (elName) elName.textContent = userName;
  if (elRole) elRole.textContent = userRole;

  if (hName) hName.textContent = userName;
  if (hRole) hRole.textContent = userRole;
  if (hAvatar) hAvatar.textContent = initials;
}

/**
 * Toast Notification Helper
 */
function showToast(message) {
  const toast = document.getElementById("toast");
  const msg = document.getElementById("toast-message");
  if (!toast || !msg) return;

  msg.textContent = message;
  toast.classList.remove("translate-y-20", "opacity-0");
  toast.classList.add("translate-y-0", "opacity-100");

  setTimeout(() => {
    toast.classList.remove("translate-y-0", "opacity-100");
    toast.classList.add("translate-y-20", "opacity-0");
  }, 3200);
}

/* ========================================================
   KUSTOMISASI TINGKAT KELAS
   ======================================================== */

/**
 * Render Tabel Tingkat Kelas
 */
function renderTingkatTable() {
  const tbody = document.getElementById("table-tingkat-body");
  if (!tbody) return;

  const list = appData.tingkatList || [];
  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="py-6 text-center text-slate-400">Belum ada tingkat kelas yang dikonfigurasi.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(t => {
    const rombelCount = (appData.rombelList || []).filter(r => r.tingkat === t.kode).length;
    return `
    <tr class="hover:bg-slate-50 transition-colors">
      <td class="py-2.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">${t.kode}</td>
      <td class="py-2.5 px-4 font-bold text-slate-800 whitespace-nowrap">${t.nama}</td>
      <td class="py-2.5 px-4 whitespace-nowrap">
        <span class="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 whitespace-nowrap">${t.fase}</span>
      </td>
      <td class="py-2.5 px-4 text-center whitespace-nowrap">
        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap">
          ${rombelCount} Rombel
        </span>
      </td>
      <td class="py-2.5 px-4 text-slate-500">${t.deskripsi || '-'}</td>
      <td class="py-2.5 px-4 text-right whitespace-nowrap space-x-1">
        <button onclick="openEditTingkatModal('${t.id}')" class="px-2.5 py-1 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 rounded-lg text-[11px] font-bold transition-colors whitespace-nowrap">
          Edit
        </button>
        <button onclick="deleteTingkat('${t.id}')" class="px-2.5 py-1 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg text-[11px] font-bold transition-colors whitespace-nowrap">
          Hapus
        </button>
      </td>
    </tr>
  `;
  }).join("");

  lucide.createIcons();
}

/**
 * Sinkronisasi Dropdown Tingkat ke Formulir & Filter
 */
function populateTingkatDropdowns() {
  const tingkatList = appData.tingkatList || [];

  // 1. Filter Tingkat di Buku Induk
  const filterTingkat = document.getElementById("filter-tingkat");
  if (filterTingkat) {
    const curVal = filterTingkat.value || "ALL";
    filterTingkat.innerHTML = `<option value="ALL">Semua Jenjang</option>` +
      tingkatList.map(t => `<option value="${t.kode}" ${curVal === t.kode ? 'selected' : ''}>${t.nama} (${t.fase})</option>`).join("");
  }

  // 2. Tambah Siswa - Tingkat
  const addTingkat = document.getElementById("add-tingkat");
  if (addTingkat) {
    addTingkat.innerHTML = tingkatList.map((t, idx) => 
      `<option value="${t.kode}" ${idx === 0 ? 'selected' : ''}>${t.nama} (${t.fase})</option>`
    ).join("");
  }

  // 3. Mutasi Modal - Tingkat
  const mutTingkat = document.getElementById("mut-add-tingkat");
  if (mutTingkat) {
    mutTingkat.innerHTML = tingkatList.map(t => 
      `<option value="${t.kode}">${t.nama}</option>`
    ).join("");
  }

  // 4. Sinkronkan Rombel
  populateRombelDropdowns();
}

let editingTingkatId = null;

// Modal Handlers untuk Tingkat
function openAddTingkatModal() {
  editingTingkatId = null;
  const modal = document.getElementById("modal-add-tingkat");
  if (!modal) return;
  const title = document.getElementById("modal-tingkat-title");
  if (title) title.textContent = "Tambah Tingkat Kelas Baru";
  const btn = document.getElementById("btn-submit-tingkat");
  if (btn) btn.textContent = "Simpan Tingkat";
  document.getElementById("form-new-tingkat")?.reset();
  const faseInput = document.getElementById("tkt-add-fase");
  if (faseInput) faseInput.value = "Fase D";
  modal.classList.remove("hidden");
  document.getElementById("tkt-add-kode")?.focus();
}

function openEditTingkatModal(tingkatId) {
  const target = (appData.tingkatList || []).find(t => t.id === tingkatId);
  if (!target) return;
  editingTingkatId = tingkatId;

  const modal = document.getElementById("modal-add-tingkat");
  if (!modal) return;
  const title = document.getElementById("modal-tingkat-title");
  if (title) title.textContent = `Edit Tingkat Kelas: ${target.kode}`;
  const btn = document.getElementById("btn-submit-tingkat");
  if (btn) btn.textContent = "Simpan Perubahan";

  document.getElementById("tkt-add-kode").value = target.kode;
  document.getElementById("tkt-add-nama").value = target.nama;
  document.getElementById("tkt-add-fase").value = target.fase || "Fase D";
  document.getElementById("tkt-add-deskripsi").value = target.deskripsi || "";

  modal.classList.remove("hidden");
  document.getElementById("tkt-add-nama")?.focus();
}

function closeAddTingkatModal() {
  editingTingkatId = null;
  const modal = document.getElementById("modal-add-tingkat");
  if (modal) modal.classList.add("hidden");
}

function handleAddTingkatSubmit(e) {
  e.preventDefault();

  const kode = document.getElementById("tkt-add-kode").value.trim().toUpperCase();
  const nama = document.getElementById("tkt-add-nama").value.trim();
  const fase = document.getElementById("tkt-add-fase").value.trim();
  const deskripsi = document.getElementById("tkt-add-deskripsi").value.trim() || "-";

  if (!appData.tingkatList) appData.tingkatList = [];

  if (editingTingkatId) {
    const target = appData.tingkatList.find(t => t.id === editingTingkatId);
    if (!target) return;

    if (appData.tingkatList.some(t => t.id !== editingTingkatId && t.kode === kode)) {
      alert(`Tingkat dengan kode ${kode} sudah digunakan oleh tingkat lain!`);
      return;
    }

    const oldKode = target.kode;
    target.kode = kode;
    target.nama = nama;
    target.fase = fase;
    target.deskripsi = deskripsi;

    // Jika kode tingkat diubah, sinkronkan rombel dan siswa yang terkait
    if (oldKode !== kode) {
      if (appData.rombelList) {
        appData.rombelList.forEach(r => {
          if (r.tingkat === oldKode) r.tingkat = kode;
        });
      }
      if (appData.students) {
        appData.students.forEach(s => {
          if (s.tingkat === oldKode) s.tingkat = kode;
        });
      }
    }

    saveAppData(appData);
    renderTingkatTable();
    renderRombelTable();
    populateTingkatDropdowns();
    closeAddTingkatModal();
    showToast(`Tingkat ${nama} (${kode}) berhasil diperbarui!`);
    return;
  }

  // Tambah Tingkat Baru
  if (appData.tingkatList.some(t => t.kode === kode)) {
    alert(`Tingkat dengan kode ${kode} sudah terdaftar!`);
    return;
  }

  const newTingkat = {
    id: `TKT-${kode}`,
    kode,
    nama,
    fase,
    deskripsi
  };

  appData.tingkatList.push(newTingkat);
  saveAppData(appData);

  renderTingkatTable();
  populateTingkatDropdowns();
  closeAddTingkatModal();
  document.getElementById("form-new-tingkat").reset();
  showToast(`Tingkat ${nama} (${kode}) berhasil ditambahkan!`);
}

function deleteTingkat(tingkatId) {
  const target = (appData.tingkatList || []).find(t => t.id === tingkatId);
  if (!target) return;

  const linkedRombel = (appData.rombelList || []).filter(r => r.tingkat === target.kode).length;
  let confirmMsg = `Apakah Anda yakin ingin menghapus ${target.nama} (${target.kode})?`;
  if (linkedRombel > 0) {
    confirmMsg += `\n\nPerhatian: Ada ${linkedRombel} rombongan belajar yang saat ini terhubung dengan tingkat ini.`;
  }

  if (confirm(confirmMsg)) {
    appData.tingkatList = appData.tingkatList.filter(t => t.id !== tingkatId);
    saveAppData(appData);
    renderTingkatTable();
    populateTingkatDropdowns();
    showToast(`Tingkat ${target.nama} berhasil dihapus.`);
  }
}

/* ========================================================
   KUSTOMISASI ROMBONGAN BELAJAR (ROMBEL)
   ======================================================== */

/**
 * Render Tabel Rombongan Belajar
 */
function renderRombelTable() {
  const tbody = document.getElementById("table-rombel-body");
  if (!tbody) return;

  const list = appData.rombelList || [];
  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="py-6 text-center text-slate-400">Belum ada rombongan belajar yang dikonfigurasi.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(r => `
    <tr class="hover:bg-slate-50 transition-colors">
      <td class="py-2.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">${r.kode}</td>
      <td class="py-2.5 px-4 font-bold text-slate-800 whitespace-nowrap">${r.nama}</td>
      <td class="py-2.5 px-4 text-center whitespace-nowrap">
        <span class="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 whitespace-nowrap">Kelas ${r.tingkat}</span>
      </td>
      <td class="py-2.5 px-4 text-slate-700 whitespace-nowrap">${r.wali || '-'}</td>
      <td class="py-2.5 px-4 text-center whitespace-nowrap font-mono">
        <span class="font-bold text-slate-800">${r.kapasitas || 36}</span> <span class="text-slate-400 text-[10px]">Siswa</span>
      </td>
      <td class="py-2.5 px-4 text-slate-500 text-xs">${r.fokus || '-'}</td>
      <td class="py-2.5 px-4 text-right whitespace-nowrap space-x-1">
        <button onclick="openEditRombelModal('${r.id}')" class="px-2.5 py-1 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 rounded-lg text-[11px] font-bold transition-colors whitespace-nowrap">
          Edit
        </button>
        <button onclick="deleteRombel('${r.id}')" class="px-2.5 py-1 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg text-[11px] font-bold transition-colors whitespace-nowrap inline-flex items-center space-x-1">
          <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          <span>Hapus</span>
        </button>
      </td>
    </tr>
  `).join("");

  lucide.createIcons();
}

/**
 * Sinkronisasi Dropdown Rombel ke Formulir & Filter
 */
function populateRombelDropdowns() {
  const rombelList = appData.rombelList || [];
  const tingkatList = appData.tingkatList || [];

  // 1. Filter Rombel di Buku Induk Siswa
  const filterRombel = document.getElementById("filter-rombel");
  const filterTingkat = document.getElementById("filter-tingkat");
  if (filterRombel) {
    const curVal = filterRombel.value || "ALL";
    const selectedTingkat = filterTingkat ? filterTingkat.value : "ALL";
    const filteredRombel = (selectedTingkat && selectedTingkat !== "ALL")
      ? rombelList.filter(r => r.tingkat === selectedTingkat)
      : rombelList;

    filterRombel.innerHTML = `<option value="ALL">Semua Rombel</option>` +
      filteredRombel.map(r => `<option value="${r.kode}" ${curVal === r.kode ? 'selected' : ''}>${r.kode} (${r.nama})</option>`).join("");
  }

  // 2. Tambah Siswa - Rombel Options (berdasarkan tingkat yang dipilih)
  updateAddStudentRombelOptions();

  // 3. Dropdown Tingkat di Modal Tambah Rombel Baru
  const rmbAddTingkat = document.getElementById("rmb-add-tingkat");
  if (rmbAddTingkat) {
    rmbAddTingkat.innerHTML = tingkatList.map(t => 
      `<option value="${t.kode}">${t.nama} (${t.kode})</option>`
    ).join("");
  }
}

function updateAddStudentRombelOptions() {
  const addTingkat = document.getElementById("add-tingkat");
  const addRombel = document.getElementById("add-rombel");
  if (!addRombel) return;

  const selectedTingkat = addTingkat ? addTingkat.value : "VII";
  const rombelList = appData.rombelList || [];
  const filtered = rombelList.filter(r => r.tingkat === selectedTingkat);

  let displayList = filtered.length > 0 ? filtered : rombelList;
  if (displayList.length === 0) {
    // Sediakan opsi standar otomatis jika rombel belum dikonfigurasi
    displayList = [
      { kode: `${selectedTingkat}-A`, nama: `Kelas ${selectedTingkat}-A` },
      { kode: `${selectedTingkat}-B`, nama: `Kelas ${selectedTingkat}-B` },
      { kode: `${selectedTingkat}-C`, nama: `Kelas ${selectedTingkat}-C` },
      { kode: `${selectedTingkat}-D`, nama: `Kelas ${selectedTingkat}-D` }
    ];
  }

  addRombel.innerHTML = displayList.map(r => 
    `<option value="${r.kode}">${r.kode} - ${r.nama || r.kode}</option>`
  ).join("");
}

let editingRombelId = null;

// Modal Handlers untuk Rombel
function openAddRombelModal() {
  editingRombelId = null;
  const modal = document.getElementById("modal-add-rombel");
  if (!modal) return;

  const title = document.getElementById("modal-rombel-title");
  if (title) title.textContent = "Tambah Rombel Belajar Baru";
  const btn = document.getElementById("btn-submit-rombel");
  if (btn) btn.textContent = "Simpan Rombel";

  document.getElementById("btn-delete-rombel-modal")?.classList.add("hidden");

  document.getElementById("form-new-rombel")?.reset();
  const kapInput = document.getElementById("rmb-add-kapasitas");
  if (kapInput) kapInput.value = "36";

  const tingkatList = appData.tingkatList || [];
  const rmbAddTingkat = document.getElementById("rmb-add-tingkat");
  if (rmbAddTingkat) {
    rmbAddTingkat.innerHTML = tingkatList.map(t => 
      `<option value="${t.kode}">${t.nama} (${t.kode})</option>`
    ).join("");
  }

  modal.classList.remove("hidden");
  document.getElementById("rmb-add-kode")?.focus();
}

function openAddRombelModalWithTingkat(tingkat) {
  openAddRombelModal();
  const sel = document.getElementById("rmb-add-tingkat");
  if (sel && tingkat) {
    sel.value = tingkat;
  }
}

function openEditRombelModal(rombelId) {
  const target = (appData.rombelList || []).find(r => r.id === rombelId);
  if (!target) return;
  editingRombelId = rombelId;

  const modal = document.getElementById("modal-add-rombel");
  if (!modal) return;

  const title = document.getElementById("modal-rombel-title");
  if (title) title.textContent = `Edit Rombel Belajar: ${target.kode}`;
  const btn = document.getElementById("btn-submit-rombel");
  if (btn) btn.textContent = "Simpan Perubahan";

  document.getElementById("btn-delete-rombel-modal")?.classList.remove("hidden");

  const tingkatList = appData.tingkatList || [];
  const rmbAddTingkat = document.getElementById("rmb-add-tingkat");
  if (rmbAddTingkat) {
    rmbAddTingkat.innerHTML = tingkatList.map(t => 
      `<option value="${t.kode}" ${t.kode === target.tingkat ? 'selected' : ''}>${t.nama} (${t.kode})</option>`
    ).join("");
  }

  document.getElementById("rmb-add-kode").value = target.kode;
  document.getElementById("rmb-add-kapasitas").value = target.kapasitas || 36;
  document.getElementById("rmb-add-nama").value = target.nama;
  document.getElementById("rmb-add-wali").value = target.wali || "";
  document.getElementById("rmb-add-fokus").value = target.fokus || "";

  modal.classList.remove("hidden");
  document.getElementById("rmb-add-nama")?.focus();
}

function closeAddRombelModal() {
  editingRombelId = null;
  const modal = document.getElementById("modal-add-rombel");
  if (modal) modal.classList.add("hidden");
  document.getElementById("btn-delete-rombel-modal")?.classList.add("hidden");
}

function deleteRombelFromModal() {
  if (!editingRombelId) return;
  const idToDelete = editingRombelId;
  closeAddRombelModal();
  deleteRombel(idToDelete);
}

function handleAddRombelSubmit(e) {
  e.preventDefault();

  const tingkat = document.getElementById("rmb-add-tingkat").value;
  const kode = document.getElementById("rmb-add-kode").value.trim().toUpperCase();
  const nama = document.getElementById("rmb-add-nama").value.trim();
  const wali = document.getElementById("rmb-add-wali").value.trim() || "Wali Kelas Belum Ditentukan";
  const kapasitas = parseInt(document.getElementById("rmb-add-kapasitas").value) || 36;
  const fokus = document.getElementById("rmb-add-fokus").value.trim() || "Reguler";

  if (!appData.rombelList) appData.rombelList = [];

  if (editingRombelId) {
    const target = appData.rombelList.find(r => r.id === editingRombelId);
    if (!target) return;

    if (appData.rombelList.some(r => r.id !== editingRombelId && r.kode.toUpperCase() === kode)) {
      alert(`Rombel dengan kode ${kode} sudah digunakan rombel lain!`);
      return;
    }

    const oldKode = target.kode;
    target.tingkat = tingkat;
    target.kode = kode;
    target.nama = nama;
    target.wali = wali;
    target.kapasitas = kapasitas;
    target.fokus = fokus;

    // Jika kode rombel berubah, sinkronkan data siswa yang terdaftar di rombel ini
    if (oldKode !== kode && appData.students) {
      appData.students.forEach(s => {
        if (s.rombel === oldKode) {
          s.rombel = kode;
          s.tingkat = tingkat;
        }
      });
      filterAndRenderStudents();
    }

    recalculateRombelSummary();
    saveAppData(appData);
    renderDashboard();
    renderRombelTable();
    renderTingkatTable();
    populateRombelDropdowns();
    closeAddRombelModal();
    showToast(`Rombel ${nama} (${kode}) berhasil diperbarui!`);
    return;
  }

  // Tambah Rombel Baru
  if (appData.rombelList.some(r => r.kode.toUpperCase() === kode)) {
    alert(`Rombel dengan kode ${kode} sudah terdaftar! Gunakan kode lain.`);
    return;
  }

  const newRombel = {
    id: `RMB-${Date.now().toString().slice(-4)}`,
    tingkat,
    kode,
    nama,
    wali,
    kapasitas,
    terisi: 0,
    fokus
  };

  appData.rombelList.push(newRombel);
  recalculateRombelSummary();
  saveAppData(appData);

  renderDashboard();
  renderRombelTable();
  renderTingkatTable();
  populateRombelDropdowns();
  closeAddRombelModal();
  document.getElementById("form-new-rombel").reset();
  showToast(`Rombel ${nama} (${kode}) berhasil ditambahkan!`);
}

function deleteRombel(rombelId) {
  const target = (appData.rombelList || []).find(r => r.id === rombelId);
  if (!target) return;

  const countStudents = (appData.students || []).filter(s => s.rombel === target.kode).length;
  let confirmMsg = `Apakah Anda yakin ingin menghapus Rombel ${target.nama || target.kode} (${target.kode})?`;
  if (countStudents > 0) {
    confirmMsg += `\n\nPerhatian: Ada ${countStudents} siswa yang saat ini terdaftar pada rombel ini.`;
  }

  if (confirm(confirmMsg)) {
    appData.rombelList = appData.rombelList.filter(r => r.id !== rombelId);
    if (appData.rombelUnggulan) {
      appData.rombelUnggulan = appData.rombelUnggulan.filter(u => !u.nama.includes(target.kode));
    }
    recalculateRombelSummary();
    saveAppData(appData);
    renderDashboard();
    renderRombelTable();
    renderTingkatTable();
    populateRombelDropdowns();
    showToast(`Rombel ${target.nama || target.kode} berhasil dihapus.`);
  }
}

function deleteAllRombel() {
  const rombelList = appData.rombelList || [];
  if (rombelList.length === 0) {
    alert("Daftar rombongan belajar sudah kosong.");
    return;
  }

  const countStudents = (appData.students || []).filter(s => !!s.rombel).length;
  let confirmMsg = `⚠️ PERINGATAN: Apakah Anda yakin ingin MENGHAPUS SEMUA (${rombelList.length}) rombongan belajar?`;
  if (countStudents > 0) {
    confirmMsg += `\n\nPerhatian: Ada ${countStudents} siswa yang terdaftar di rombel-rombel tersebut.`;
  }

  if (confirm(confirmMsg)) {
    if (confirm("Konfirmasi ulang: Tindakan ini tidak dapat dibatalkan. Seluruh rombel belajar akan dikosongkan.")) {
      appData.rombelList = [];
      appData.rombelUnggulan = [];
      recalculateRombelSummary();
      saveAppData(appData);
      renderDashboard();
      renderRombelTable();
      renderTingkatTable();
      populateRombelDropdowns();
      showToast("Semua data rombongan belajar berhasil dihapus.");
    }
  }
}

// Menu Navigasi & Aksi DU-03
function toggleRombelActionMenu() {
  const menu = document.getElementById("dropdown-menu-rombel");
  if (menu) menu.classList.toggle("hidden");
}

function navigateToRombelSettings() {
  switchTab('tab-pengaturan');
  switchSettingsSubTab('sub-tingkat-rombel');
  setTimeout(() => {
    const section = document.getElementById("table-rombel-body");
    if (section) section.scrollIntoView({ behavior: 'smooth' });
  }, 150);
}

// Handler Rombel Unggulan (DU-04)
function openAddRombelUnggulanModal() {
  const modal = document.getElementById("modal-add-rombel-unggulan");
  if (!modal) return;
  const sel = document.getElementById("u-add-rombel-select");
  if (sel) {
    const list = appData.rombelList || [];
    if (list.length === 0) {
      sel.innerHTML = `<option value="">Belum ada rombel terdaftar (buat rombel dulu)</option>`;
    } else {
      sel.innerHTML = list.map(r => `<option value="${r.kode}">${r.kode} - ${r.nama}</option>`).join("");
      handleSelectRombelUnggulanChange(list[0].kode);
    }
  }
  modal.classList.remove("hidden");
}

function closeAddRombelUnggulanModal() {
  const modal = document.getElementById("modal-add-rombel-unggulan");
  if (modal) modal.classList.add("hidden");
}

function handleSelectRombelUnggulanChange(kode) {
  if (!kode) return;
  const rombel = (appData.rombelList || []).find(r => r.kode === kode);
  if (rombel) {
    const namaInput = document.getElementById("u-add-nama");
    const waliInput = document.getElementById("u-add-wali");
    const fokusInput = document.getElementById("u-add-fokus");
    if (namaInput && !namaInput.value) namaInput.value = `Kelas ${rombel.nama || rombel.kode} Unggulan`;
    if (waliInput) waliInput.value = rombel.wali || "";
    if (fokusInput) fokusInput.value = rombel.fokus || "Program Binaan Khusus";
  }
}

function handleAddRombelUnggulanSubmit(e) {
  e.preventDefault();
  const kode = document.getElementById("u-add-rombel-select")?.value;
  const nama = document.getElementById("u-add-nama")?.value.trim() || kode;
  const wali = document.getElementById("u-add-wali")?.value.trim() || "-";
  const fokus = document.getElementById("u-add-fokus")?.value.trim() || "Program Binaan Khusus";

  if (!appData.rombelUnggulan) appData.rombelUnggulan = [];
  appData.rombelUnggulan.push({
    nama: nama,
    wali,
    fokus,
    totalSiswa: 0,
    akreditasi: "A (Unggul)"
  });

  saveAppData(appData);
  renderDashboard();
  closeAddRombelUnggulanModal();
  showToast(`Rombel unggulan ${nama} berhasil ditambahkan!`);
}

function deleteRombelUnggulan(index) {
  if (!appData.rombelUnggulan || !appData.rombelUnggulan[index]) return;
  const target = appData.rombelUnggulan[index];
  if (confirm(`Hapus rombel "${target.nama}" dari daftar Rombel Unggulan?`)) {
    appData.rombelUnggulan.splice(index, 1);
    saveAppData(appData);
    renderDashboard();
    showToast(`Rombel unggulan ${target.nama} berhasil dihapus.`);
  }
}

function deleteAllRombelUnggulan() {
  if (!appData.rombelUnggulan || appData.rombelUnggulan.length === 0) {
    alert("Daftar rombel unggulan sudah kosong.");
    return;
  }
  if (confirm("Apakah Anda yakin ingin mengosongkan SEMUA daftar Rombel Unggulan?")) {
    appData.rombelUnggulan = [];
    saveAppData(appData);
    renderDashboard();
    showToast("Semua rombel unggulan berhasil dihapus.");
  }
}

// Tutup Dropdown Menu Rombel jika klik di luar area
document.addEventListener("click", function(e) {
  const wrapper = document.getElementById("rombel-action-dropdown-wrapper");
  const menu = document.getElementById("dropdown-menu-rombel");
  if (wrapper && menu && !wrapper.contains(e.target)) {
    menu.classList.add("hidden");
  }
});

/* ========================================================
   MODUL 7: TAHUN AKADEMIK & KALENDER PENDIDIKAN (PG-02)
   ======================================================== */

/**
 * Beralih ke Tahun Akademik lain.
 * Menyimpan dataset tahun berjalan dan memuat dataset spesifik tahun target.
 */
function switchAcademicYear(yearId) {
  if (!appData.academicYears || appData.academicYears.length === 0) return;
  const targetYear = appData.academicYears.find(a => a.id === yearId);
  if (!targetYear) return;

  const currentYearId = appData.activeAcademicYearId || "2024-2025-1";

  // 1. Simpan dataset aktif saat ini ke yearlyData
  if (!appData.yearlyData) appData.yearlyData = {};
  appData.yearlyData[currentYearId] = {
    students: JSON.parse(JSON.stringify(appData.students || [])),
    stats: JSON.parse(JSON.stringify(appData.stats || DEFAULT_DATA.stats)),
    mutations: JSON.parse(JSON.stringify(appData.mutations || [])),
    beasiswaList: JSON.parse(JSON.stringify(appData.beasiswaList || [])),
    rombelSummary: JSON.parse(JSON.stringify(appData.rombelSummary || DEFAULT_DATA.rombelSummary))
  };

  // 2. Set status aktif di list academicYears
  appData.activeAcademicYearId = yearId;
  appData.academicYears.forEach(a => {
    a.active = (a.id === yearId);
    if (a.id === yearId) a.status = "Aktif";
    else if (a.status === "Aktif") a.status = "Tersedia";
  });

  // 3. Muat dataset untuk tahun ajaran target
  if (appData.yearlyData[yearId]) {
    const yData = appData.yearlyData[yearId];
    appData.students = JSON.parse(JSON.stringify(yData.students || []));
    appData.stats = JSON.parse(JSON.stringify(yData.stats || DEFAULT_DATA.stats));
    appData.mutations = JSON.parse(JSON.stringify(yData.mutations || []));
    appData.beasiswaList = JSON.parse(JSON.stringify(yData.beasiswaList || []));
    appData.rombelSummary = JSON.parse(JSON.stringify(yData.rombelSummary || DEFAULT_DATA.rombelSummary));
  } else {
    // Inisialisasi data tahun baru
    const freshYearData = {
      students: JSON.parse(JSON.stringify(appData.students || [])),
      stats: JSON.parse(JSON.stringify(appData.stats || DEFAULT_DATA.stats)),
      mutations: [],
      beasiswaList: JSON.parse(JSON.stringify(appData.beasiswaList || [])),
      rombelSummary: JSON.parse(JSON.stringify(appData.rombelSummary || DEFAULT_DATA.rombelSummary))
    };
    appData.yearlyData[yearId] = freshYearData;
  }

  // 4. Sinkronisasi parameter lembaga
  if (!appData.institution) appData.institution = {};
  appData.institution.tahunAjaranAktif = targetYear.tahun;
  appData.institution.semesterAktif = targetYear.semester;
  if (targetYear.tglBagiRapor) {
    appData.institution.tanggalRapor = targetYear.tglBagiRapor;
  }

  // 5. Simpan ke local storage
  saveAppData(appData);

  // 6. Sinkronisasi dropdown dan badge di navbar
  populateAcademicYearDropdown();

  // 7. Render ulang seluruh modul
  renderAllModules();
  showToast(`Tahun Ajaran beralih ke ${targetYear.label}. Data kesiswaan & kalender disinkronkan.`);
}

/**
 * Sinkronisasi Dropdown Tahun Ajaran di Navbar & Badge Status
 */
function populateAcademicYearDropdown() {
  const selectTA = document.getElementById("select-academic-year");
  if (!selectTA || !appData.academicYears) return;

  const currentId = appData.activeAcademicYearId || "2024-2025-1";
  selectTA.innerHTML = appData.academicYears.map(ta => 
    `<option value="${ta.id}" ${ta.id === currentId ? 'selected' : ''}>${ta.label}</option>`
  ).join("");

  const activeObj = appData.academicYears.find(a => a.id === currentId) || appData.academicYears[0];
  const badge = document.getElementById("active-ta-badge");
  if (badge && activeObj) {
    badge.textContent = `Tahun Ajaran ${activeObj.tahun || '2024/2025'} (Semester ${activeObj.semester || 'Ganjil'})`;
  }
}

/**
 * Render Tabel Tahun Akademik & Semester
 */
function renderCalendarSettings() {
  const currentId = appData.activeAcademicYearId || "2024-2025-1";
  const activeYear = (appData.academicYears || []).find(a => a.id === currentId) || (appData.academicYears && appData.academicYears[0]);

  // 1. Render Tabel Tahun Akademik
  const tbodyAY = document.getElementById("table-academic-years-body");
  if (tbodyAY) {
    const list = appData.academicYears || [];
    tbodyAY.innerHTML = list.map(ay => {
      const isCurrent = (ay.id === currentId);
      return `
        <tr class="hover:bg-slate-50 transition-colors ${isCurrent ? 'bg-emerald-50/40 font-semibold' : ''}">
          <td class="py-2.5 px-4 font-bold text-slate-900 whitespace-nowrap">
            ${ay.tahun}
            ${isCurrent ? '<span class="ml-1.5 inline-block w-2 h-2 rounded-full bg-emerald-500"></span>' : ''}
          </td>
          <td class="py-2.5 px-4 text-center whitespace-nowrap">
            <span class="inline-block px-2 py-0.5 rounded text-[10px] font-bold ${ay.semester === 'Ganjil' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}">
              ${ay.semester}
            </span>
          </td>
          <td class="py-2.5 px-4 text-slate-600 whitespace-nowrap">${ay.tglMulai || '-'} s/d ${ay.tglSelesai || '-'}</td>
          <td class="py-2.5 px-4 text-slate-600 whitespace-nowrap">${ay.tglKunciNilai || '-'}</td>
          <td class="py-2.5 px-4 font-bold text-emerald-800 whitespace-nowrap">${ay.tglBagiRapor || '-'}</td>
          <td class="py-2.5 px-4 text-center whitespace-nowrap">
            <span class="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${isCurrent ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-100 text-slate-600'}">
              ${isCurrent ? 'AKTIF SEKARANG' : (ay.status || 'Tersedia')}
            </span>
          </td>
          <td class="py-2.5 px-4 text-right whitespace-nowrap space-x-1">
            ${!isCurrent ? `
              <button onclick="switchAcademicYear('${ay.id}')" class="px-2 py-1 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-100 rounded-lg text-[11px] font-bold transition-colors whitespace-nowrap">
                Aktifkan
              </button>
            ` : ''}
            <button onclick="openEditAcademicYearModal('${ay.id}')" class="px-2 py-1 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg text-[11px] font-bold transition-colors whitespace-nowrap">
              Edit
            </button>
            ${!isCurrent && list.length > 1 ? `
              <button onclick="deleteAcademicYear('${ay.id}')" class="px-2 py-1 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg text-[11px] font-bold transition-colors whitespace-nowrap">
                Hapus
              </button>
            ` : ''}
          </td>
        </tr>
      `;
    }).join("");
  }

  lucide.createIcons();
}

let editingAcademicYearId = null;

function openAddAcademicYearModal() {
  editingAcademicYearId = null;
  const modal = document.getElementById("modal-academic-year");
  if (!modal) return;

  const title = document.getElementById("modal-academic-year-title");
  if (title) title.textContent = "Tambah Tahun Pelajaran Baru";
  const btn = document.getElementById("btn-submit-academic-year");
  if (btn) btn.textContent = "Simpan Konfigurasi";

  const optContainer = document.getElementById("ay-data-option-container");
  if (optContainer) optContainer.classList.remove("hidden");

  document.getElementById("form-academic-year")?.reset();
  modal.classList.remove("hidden");
  document.getElementById("ay-input-tahun")?.focus();
}

function openEditAcademicYearModal(yearId) {
  const target = (appData.academicYears || []).find(a => a.id === yearId);
  if (!target) return;
  editingAcademicYearId = yearId;

  const modal = document.getElementById("modal-academic-year");
  if (!modal) return;

  const title = document.getElementById("modal-academic-year-title");
  if (title) title.textContent = `Edit Konfigurasi: ${target.label}`;
  const btn = document.getElementById("btn-submit-academic-year");
  if (btn) btn.textContent = "Simpan Perubahan";

  const optContainer = document.getElementById("ay-data-option-container");
  if (optContainer) optContainer.classList.add("hidden");

  document.getElementById("ay-input-tahun").value = target.tahun;
  document.getElementById("ay-input-semester").value = target.semester;
  document.getElementById("ay-input-mulai").value = dateToIso(target.tglMulai);
  document.getElementById("ay-input-selesai").value = dateToIso(target.tglSelesai);
  document.getElementById("ay-input-kunci").value = dateToIso(target.tglKunciNilai);
  document.getElementById("ay-input-rapor").value = dateToIso(target.tglBagiRapor);

  modal.classList.remove("hidden");
  document.getElementById("ay-input-mulai")?.focus();
}

function closeAcademicYearModal() {
  editingAcademicYearId = null;
  const modal = document.getElementById("modal-academic-year");
  if (modal) modal.classList.add("hidden");
}

function handleAcademicYearSubmit(e) {
  e.preventDefault();

  const tahun = document.getElementById("ay-input-tahun").value.trim();
  const semester = document.getElementById("ay-input-semester").value;
  const tglMulai = isoToIndoDate(document.getElementById("ay-input-mulai").value.trim());
  const tglSelesai = isoToIndoDate(document.getElementById("ay-input-selesai").value.trim());
  const tglKunciNilai = isoToIndoDate(document.getElementById("ay-input-kunci").value.trim()) || "-";
  const tglBagiRapor = isoToIndoDate(document.getElementById("ay-input-rapor").value.trim()) || "-";
  const dataMode = document.getElementById("ay-input-data-mode")?.value || "copy";

  if (!appData.academicYears) appData.academicYears = [];

  if (editingAcademicYearId) {
    const target = appData.academicYears.find(a => a.id === editingAcademicYearId);
    if (!target) return;

    target.tahun = tahun;
    target.semester = semester;
    target.label = `TA ${tahun} ${semester}`;
    target.tglMulai = tglMulai;
    target.tglSelesai = tglSelesai;
    target.tglKunciNilai = tglKunciNilai;
    target.tglBagiRapor = tglBagiRapor;

    if (target.id === appData.activeAcademicYearId) {
      if (!appData.institution) appData.institution = {};
      appData.institution.tahunAjaranAktif = tahun;
      appData.institution.semesterAktif = semester;
      appData.institution.tanggalRapor = tglBagiRapor;
      updateRaporPreview();
    }

    saveAppData(appData);
    populateAcademicYearDropdown();
    renderCalendarSettings();
    closeAcademicYearModal();
    showToast(`Konfigurasi ${target.label} berhasil diperbarui!`);
    return;
  }

  // Tambah Tahun Akademik Baru
  const newId = `${tahun.replace('/', '-')}-${semester === 'Ganjil' ? '1' : '2'}`;
  if (appData.academicYears.some(a => a.id === newId)) {
    alert(`Tahun Pelajaran ${tahun} Semester ${semester} sudah terdaftar!`);
    return;
  }

  const newAY = {
    id: newId,
    tahun,
    semester,
    label: `TA ${tahun} ${semester}`,
    active: false,
    tglMulai,
    tglSelesai,
    tglKunciNilai,
    tglBagiRapor,
    status: "Tersedia"
  };

  if (!appData.yearlyData) appData.yearlyData = {};
  if (dataMode === "copy") {
    appData.yearlyData[newId] = {
      students: JSON.parse(JSON.stringify(appData.students || [])),
      stats: JSON.parse(JSON.stringify(appData.stats || DEFAULT_DATA.stats)),
      mutations: [],
      beasiswaList: JSON.parse(JSON.stringify(appData.beasiswaList || [])),
      rombelSummary: JSON.parse(JSON.stringify(appData.rombelSummary || DEFAULT_DATA.rombelSummary))
    };
  } else {
    appData.yearlyData[newId] = {
      students: [],
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
      mutations: [],
      beasiswaList: [],
      rombelSummary: JSON.parse(JSON.stringify(DEFAULT_DATA.rombelSummary || []))
    };
  }

  appData.academicYears.push(newAY);
  saveAppData(appData);

  populateAcademicYearDropdown();
  renderCalendarSettings();
  closeAcademicYearModal();
  document.getElementById("form-academic-year").reset();
  showToast(`Tahun Pelajaran ${newAY.label} berhasil ditambahkan!`);
}

function deleteAcademicYear(yearId) {
  if (yearId === appData.activeAcademicYearId) {
    alert("Tahun ajaran yang sedang aktif tidak dapat dihapus! Silakan aktifkan tahun ajaran lain terlebih dahulu.");
    return;
  }

  const target = (appData.academicYears || []).find(a => a.id === yearId);
  if (!target) return;

  if (confirm(`Apakah Anda yakin ingin menghapus ${target.label} beserta seluruh data kalender dan arsipnya?`)) {
    appData.academicYears = appData.academicYears.filter(a => a.id !== yearId);
    if (appData.yearlyData && appData.yearlyData[yearId]) {
      delete appData.yearlyData[yearId];
    }
    saveAppData(appData);
    populateAcademicYearDropdown();
    renderCalendarSettings();
    showToast(`${target.label} berhasil dihapus.`);
  }
}

