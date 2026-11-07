/**
 * SIDASI (SISTEM INFORMASI DATA SISWA) MTs AL-FADLLIYAH
 * Client-Side API Bridge & Real-Time Sync Service
 * Menghubungkan Antarmuka Web dengan Server Backend Node.js / Express
 * Mendukung Auto-Discovery Multi-Port (9090, 5050, 5051, 5052, 5000, 3000)
 * Kompatibel dengan macOS AirPlay (Port 9090 Default) & Mode Standalone Offline.
 * Copyright © 2026 by Ravi SQ. Moh. Zein Permana
 */

(function () {
  'use strict';

  // Daftar port kandidat backend yang dipindai otomatis (Port default: 9090)
  const CANDIDATE_PORTS = [9090, 5050, 5051, 5052, 5000, 3000];
  let activePort = CANDIDATE_PORTS[0];

  // Tentukan Base URL awal
  let activeBaseUrl = window.location.protocol.startsWith('http')
    ? window.location.origin
    : `http://localhost:${activePort}`;

  let isOnline = false;
  let isSyncing = false;
  let pendingSyncData = null;
  let syncTimeout = null;
  let healthInterval = null;

  /**
   * Helper Fetch dengan Timeout
   */
  async function fetchWithTimeout(resource, options = {}) {
    const { timeout = 2500 } = options;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(resource, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(id);
      return response;
    } catch (err) {
      clearTimeout(id);
      throw err;
    }
  }

  /**
   * Perbarui Tampilan Badge Status di Sidebar
   */
  function updateStatusUI(online, details = {}) {
    const container = document.getElementById('backend-status-container');
    const title = document.getElementById('backend-status-title');
    const dot = document.getElementById('backend-status-dot');
    const text = document.getElementById('backend-status-text');
    const badge = document.getElementById('backend-status-badge');

    if (!container || !dot || !text || !badge) return;

    if (online) {
      const displayPort = details.port || activePort;
      container.className = 'px-5 py-2.5 bg-emerald-50/90 border-b border-emerald-200 flex items-center justify-between text-[11px] transition-colors';
      if (title) title.className = 'flex items-center space-x-1.5 text-emerald-800 font-semibold';
      dot.className = 'w-2 h-2 rounded-full bg-emerald-500 animate-pulse';
      text.className = 'font-semibold text-emerald-800';
      text.textContent = 'Server Backend Terhubung';
      badge.className = 'text-emerald-700 bg-white px-1.5 py-0.5 rounded text-[10px] font-bold border border-emerald-300 shadow-xs';
      badge.textContent = `Port ${displayPort} (JSON DB)`;
      badge.title = 'Data tersimpan otomatis di berkas backend/data/sidasi_database.json';
    } else {
      container.className = 'px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-[11px] transition-colors';
      if (title) title.className = 'flex items-center space-x-1.5 text-slate-700 font-semibold';
      dot.className = 'w-2 h-2 rounded-full bg-slate-400';
      text.className = 'font-semibold text-slate-700';
      text.textContent = 'Basis Data Lokal Standalone';
      badge.className = 'text-slate-600 bg-white px-1.5 py-0.5 rounded text-[10px] font-bold border border-slate-200';
      badge.textContent = 'Offline (Storage)';
      badge.title = 'Server backend belum dijalankan. Buka Buka_SIDASI.command untuk mengaktifkan.';
    }
  }

  /**
   * Periksa Kesehatan & Ketersediaan Server Backend (Multi-Port Auto Detection)
   */
  async function checkHealth() {
    // 1. Coba periksa URL aktif saat ini terlebih dahulu
    try {
      const res = await fetchWithTimeout(`${activeBaseUrl}/api/health`, { timeout: 1500 });
      if (res.ok) {
        const data = await res.json();
        if (data && data.status === 'ok' && data.app === 'SIDASI') {
          const wasOffline = !isOnline;
          isOnline = true;
          if (data.port) activePort = data.port;
          updateStatusUI(true, data);
          if (wasOffline && typeof window.showToast === 'function') {
            window.showToast(`🟢 Terhubung ke Server Backend (Port ${activePort})`);
          }
          return true;
        }
      }
    } catch (e) {
      // Gagal pada URL aktif, lanjutkan pemindaian port kandidat
    }

    // 2. Jika diakses via file:// atau port lain, pindai daftar port kandidat
    for (const port of CANDIDATE_PORTS) {
      const testUrl = `http://localhost:${port}`;
      if (testUrl === activeBaseUrl) continue;

      try {
        const res = await fetchWithTimeout(`${testUrl}/api/health`, { timeout: 1200 });
        if (res.ok) {
          const data = await res.json();
          if (data && data.status === 'ok' && data.app === 'SIDASI') {
            activeBaseUrl = testUrl;
            activePort = data.port || port;
            const wasOffline = !isOnline;
            isOnline = true;
            updateStatusUI(true, data);
            if (wasOffline && typeof window.showToast === 'function') {
              window.showToast(`🟢 Terhubung ke Server Backend (Port ${activePort})`);
            }
            return true;
          }
        }
      } catch (err) {
        // Port tidak aktif, coba port berikutnya
      }
    }

    isOnline = false;
    updateStatusUI(false);
    return false;
  }

  /**
   * Mengambil Data Utuh dari Server Backend
   */
  async function fetchData() {
    if (!isOnline) {
      const available = await checkHealth();
      if (!available) return null;
    }

    try {
      const res = await fetchWithTimeout(`${activeBaseUrl}/api/data`, { timeout: 5000 });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch (err) {
      console.warn('⚠️ Gagal mengambil data backend:', err);
    }
    return null;
  }

  /**
   * Sinkronisasi Seluruh Data ke Server Backend dengan Antrean (Sync Queue)
   * Bebas batasan kuota 64KB dan tidak membuang request konkruen.
   */
  function syncData(data, immediate = true) {
    if (syncTimeout) {
      clearTimeout(syncTimeout);
      syncTimeout = null;
    }

    return new Promise((resolve) => {
      const performSync = async (dataToSync) => {
        if (isSyncing) {
          pendingSyncData = dataToSync;
          return resolve(false);
        }
        isSyncing = true;
        try {
          const res = await fetch(`${activeBaseUrl}/api/data`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToSync)
          });
          if (res.ok) {
            isOnline = true;
            updateStatusUI(true, { port: activePort });
            resolve(true);
          } else {
            resolve(false);
          }
        } catch (err) {
          console.warn('⚠️ Gagal sinkronisasi data ke backend:', err);
          resolve(false);
        } finally {
          isSyncing = false;
          if (pendingSyncData) {
            const nextData = pendingSyncData;
            pendingSyncData = null;
            performSync(nextData);
          }
        }
      };

      if (immediate) {
        performSync(data);
      } else {
        syncTimeout = setTimeout(() => performSync(data), 250);
      }
    });
  }

  /**
   * Endpoint Khusus: Mengimpor Data Siswa Massal (Excel) ke Backend
   */
  async function importStudents(studentsList, mode = 'append') {
    if (!isOnline) await checkHealth();
    if (!isOnline) return { success: false, offline: true, message: 'Backend offline' };

    try {
      const res = await fetch(`${activeBaseUrl}/api/students/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students: studentsList, mode })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('⚠️ Gagal mengirim import siswa ke backend:', err);
    }
    return { success: false, message: 'Gagal menghubungi backend untuk import.' };
  }

  /**
   * Endpoint Khusus: Mengekspor Data Siswa 34 Kolom dari Backend
   */
  async function exportStudents(format = 'json') {
    if (!isOnline) await checkHealth();
    if (!isOnline) return null;

    try {
      const res = await fetch(`${activeBaseUrl}/api/students/export?format=${format}`);
      if (res.ok) {
        if (format === 'csv') return await res.text();
        const json = await res.json();
        return json.data;
      }
    } catch (err) {
      console.warn('⚠️ Gagal ekspor siswa dari backend:', err);
    }
    return null;
  }

  /**
   * Endpoint Khusus: Memulihkan Basis Data Utuh ke Backend
   */
  async function restoreData(backupObj) {
    if (!isOnline) await checkHealth();
    if (!isOnline) return false;

    try {
      const res = await fetch(`${activeBaseUrl}/api/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backupObj)
      });
      return res.ok;
    } catch (err) {
      console.warn('⚠️ Gagal restore data ke backend:', err);
      return false;
    }
  }

  /**
   * Endpoint Khusus: Reset Basis Data Backend ke Setelan Awal
   */
  async function resetData() {
    if (!isOnline) await checkHealth();
    if (!isOnline) return false;

    try {
      const res = await fetch(`${activeBaseUrl}/api/reset`, { method: 'POST' });
      return res.ok;
    } catch (err) {
      console.warn('⚠️ Gagal reset data backend:', err);
      return false;
    }
  }

  // Jaminan persistensi data saat halaman di-refresh / ditutup (Page Unload Handler)
  const flushPendingSync = () => {
    if (typeof window.getAppDataRef === 'function') {
      const latest = window.getAppDataRef();
      try {
        // Beacon API atau synchronous XHR jika didukung, tanpa keepalive payload > 64KB
        const payload = JSON.stringify(latest);
        if (payload.length < 60000) {
          fetch(`${activeBaseUrl}/api/data`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
            keepalive: true
          });
        }
      } catch (e) {}
    }
  };
  window.addEventListener('beforeunload', flushPendingSync);
  window.addEventListener('pagehide', flushPendingSync);

  /**
   * Autentikasi Pengguna ke Backend
   */
  async function login(username, password) {
    if (!isOnline) {
      await checkHealth();
    }

    if (!isOnline) {
      return null; // Fallback ke pemeriksaan lokal di app.js
    }

    try {
      const res = await fetch(`${activeBaseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      return await res.json();
    } catch (err) {
      return null;
    }
  }

  /**
   * Unduh Berkas Cadangan Basis Data dari Backend
   */
  function downloadBackup() {
    if (isOnline) {
      window.location.href = `${activeBaseUrl}/api/backup`;
      return true;
    }
    return false;
  }

  /**
   * Inisialisasi Deteksi Backend Otomatis dengan Handshake Cerdas
   */
  async function init() {
    await checkHealth();

    // Auto-polling status backend setiap 15 detik
    if (!healthInterval) {
      healthInterval = setInterval(checkHealth, 15000);
    }

    // Jika backend online, sinkronkan data dari backend ke tampilan aplikasi (Backend adalah sumber data utama)
    if (isOnline) {
      try {
        const serverData = await fetchData();
        if (serverData && typeof serverData === 'object' && (serverData.users || serverData.institution)) {
          // Sinkronkan data dari backend ke tampilan aplikasi
          if (typeof window.updateAppDataFromBackend === 'function') {
            window.updateAppDataFromBackend(serverData);
          } else if (typeof window.appData !== 'undefined') {
            window.appData = serverData;
            if (typeof window.renderAllModules === 'function') {
              window.renderAllModules();
            }
          }
        }
      } catch (e) {
        console.error('Error saat sinkronisasi awal data:', e);
      }
    }
  }

  // Objek Publik Global
  window.SIDASI_API = {
    getBaseUrl: () => activeBaseUrl,
    getPort: () => activePort,
    isOnline: () => isOnline,
    checkHealth,
    fetchData,
    syncData,
    importStudents,
    exportStudents,
    restoreData,
    resetData,
    login,
    downloadBackup,
    init
  };

  // Jalankan inisialisasi saat dokumen siap
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
