/**
 * SIDASI MTs AL-FADLLIYAH - BACKEND SERVER
 * Server API RESTful & Static Web Server mandiri berbasis Node.js & Express
 * Tidak memerlukan instalasi MySQL atau Python.
 * Copyright © 2026 by Ravi SQ. Moh. Zein Permana
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const db = require('./database');

const app = express();
const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 9090;
let activePort = DEFAULT_PORT;

// Middleware CORS komprehensif & Private Network Access (mendukung file://, localhost, dan lintas browser)
app.use((req, res, next) => {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Private-Network', 'true');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Security Headers untuk proteksi XSS, MIME sniffing, Clickjacking, dan Referrer Policy
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Proteksi Direktori & Berkas Internal: Cegah akses langsung ke folder backend/ dan dotfiles
app.use((req, res, next) => {
  const p = req.path.toLowerCase();
  if (p.startsWith('/backend') || p.includes('/.') || p.startsWith('/.')) {
    return res.status(403).json({ success: false, message: 'Akses ditolak: Direktori sistem internal dilindungi.' });
  }
  next();
});

// Logging sederhana untuk request API
app.use((req, res, next) => {
  if (req.url.startsWith('/api')) {
    const timestamp = new Date().toLocaleTimeString('id-ID');
    console.log(`[${timestamp}] ${req.method} ${req.url}`);
  }
  next();
});

// Serve frontend static files dari folder root dengan pengamanan dotfiles
const STATIC_ROOT = path.join(__dirname, '..');
app.use(express.static(STATIC_ROOT, {
  dotfiles: 'ignore',
  index: ['index.html']
}));

// ==========================================
// 1. HEALTH CHECK & STATUS
// ==========================================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'SIDASI',
    appName: 'Sistem Informasi Data Siswa MTs Al-Fadlliyah',
    version: '2.4',
    author: 'Ravi SQ. Moh. Zein Permana',
    port: activePort,
    timestamp: new Date().toISOString()
  });
});

// ==========================================
// 2. AUTENTIKASI PENGGUNA
// ==========================================
app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username dan kata sandi wajib diisi!' });
    }
    const result = db.authenticate(username, password);
    if (!result.success) {
      return res.status(401).json(result);
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 3. DATA GLOBAL (GET & SYNC FULL DATA)
// ==========================================
app.get('/api/data', (req, res) => {
  try {
    const data = db.getAllData();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/data', (req, res) => {
  try {
    const success = db.saveAllData(req.body);
    if (success) {
      res.json({ success: true, message: 'Seluruh data berhasil disimpan ke backend!' });
    } else {
      res.status(500).json({ success: false, message: 'Gagal menulis berkas database.' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 4. SISWA / BUKU INDUK
// ==========================================
app.get('/api/students', (req, res) => {
  try {
    const students = db.getStudents(req.query);
    res.json({ success: true, count: students.length, data: students });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/students/:id', (req, res) => {
  try {
    const student = db.getStudentById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Data siswa tidak ditemukan.' });
    }
    res.json({ success: true, data: student });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/students', (req, res) => {
  try {
    const created = db.createStudent(req.body);
    res.status(201).json({ success: true, message: 'Data siswa berhasil ditambahkan!', data: created });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/students/:id', (req, res) => {
  try {
    const updated = db.updateStudent(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Data siswa tidak ditemukan untuk diperbarui.' });
    }
    res.json({ success: true, message: 'Data siswa berhasil diperbarui!', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/students/:id', (req, res) => {
  try {
    const deleted = db.deleteStudent(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Data siswa tidak ditemukan untuk dihapus.' });
    }
    res.json({ success: true, message: 'Data siswa berhasil dihapus!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/students/import', (req, res) => {
  try {
    const { students, mode } = req.body;
    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ success: false, message: 'Daftar data siswa import kosong atau tidak valid!' });
    }
    const result = db.importStudents(students, mode || 'append');
    res.json({
      success: true,
      message: `Berhasil mengimpor ${result.count} data siswa! Total siswa kini: ${result.total}.`,
      data: result
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/students/export', (req, res) => {
  try {
    const format = req.query.format || 'json';
    const rows = db.exportStudents();

    if (format === 'csv') {
      const headers = rows.length > 0 
        ? Object.keys(rows[0]) 
        : ["NO", "NISN", "NIS", "NIK SISWA", "NAMA SISWA"];
      const csvLines = [headers.join(',')];
      rows.forEach(r => {
        const line = headers.map(h => {
          const val = String(r[h] !== undefined && r[h] !== null ? r[h] : '').split('"').join('""');
          return `"${val}"`;
        }).join(',');
        csvLines.push(line);
      });
      const filename = `Data_Siswa_EMIS_34_Kolom_${new Date().toISOString().slice(0, 10)}.csv`;
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      return res.send(csvLines.join('\n'));
    }

    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 5. MUTASI SISWA
// ==========================================
app.get('/api/mutations', (req, res) => {
  try {
    const mutations = db.getMutations();
    res.json({ success: true, data: mutations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/mutations', (req, res) => {
  try {
    const mutation = db.createMutation(req.body);
    res.status(201).json({ success: true, message: 'Catatan mutasi siswa berhasil disimpan!', data: mutation });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/mutations/:id', (req, res) => {
  try {
    const deleted = db.deleteMutation(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Data mutasi tidak ditemukan.' });
    }
    res.json({ success: true, message: 'Data mutasi berhasil dihapus!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 6. BEASISWA
// ==========================================
app.get('/api/beasiswa', (req, res) => {
  try {
    const list = db.getBeasiswaList();
    res.json({ success: true, data: list });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/beasiswa', (req, res) => {
  try {
    const created = db.createBeasiswa(req.body);
    res.status(201).json({ success: true, message: 'Data beasiswa berhasil ditambahkan!', data: created });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/beasiswa/:id', (req, res) => {
  try {
    const updated = db.updateBeasiswa(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Data beasiswa tidak ditemukan.' });
    }
    res.json({ success: true, message: 'Data beasiswa berhasil diperbarui!', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/beasiswa/:id', (req, res) => {
  try {
    const deleted = db.deleteBeasiswa(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Data beasiswa tidak ditemukan.' });
    }
    res.json({ success: true, message: 'Data beasiswa berhasil dihapus!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Program / Pilar Beasiswa (Custom & Default)
app.get('/api/beasiswa-pillars', (req, res) => {
  try {
    const list = db.getBeasiswaPillars();
    res.json({ success: true, data: list });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/beasiswa-pillars', (req, res) => {
  try {
    const created = db.createBeasiswaPillar(req.body);
    res.status(201).json({ success: true, message: 'Program beasiswa berhasil ditambahkan!', data: created });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/beasiswa-pillars/:id', (req, res) => {
  try {
    const updated = db.updateBeasiswaPillar(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Program beasiswa tidak ditemukan.' });
    }
    res.json({ success: true, message: 'Program beasiswa berhasil diperbarui!', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/beasiswa-pillars/:id', (req, res) => {
  try {
    const deleted = db.deleteBeasiswaPillar(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Program beasiswa tidak ditemukan.' });
    }
    res.json({ success: true, message: 'Program beasiswa berhasil dihapus!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 7. ROMBEL (ROMBONGAN BELAJAR)
// ==========================================
app.get('/api/rombel', (req, res) => {
  try {
    const list = db.getRombelList();
    res.json({ success: true, data: list });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/rombel', (req, res) => {
  try {
    const created = db.createRombel(req.body);
    res.status(201).json({ success: true, message: 'Data rombel berhasil ditambahkan!', data: created });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/rombel/:id', (req, res) => {
  try {
    const updated = db.updateRombel(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Data rombel tidak ditemukan.' });
    }
    res.json({ success: true, message: 'Data rombel berhasil diperbarui!', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/rombel/:id', (req, res) => {
  try {
    const deleted = db.deleteRombel(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Data rombel tidak ditemukan.' });
    }
    res.json({ success: true, message: 'Data rombel berhasil dihapus!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 8. TAHUN AKADEMIK & KALENDER AKADEMIK
// ==========================================
app.get('/api/academic-years', (req, res) => {
  try {
    const list = db.getAcademicYears();
    res.json({ success: true, data: list });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/academic-years', (req, res) => {
  try {
    const created = db.createAcademicYear(req.body);
    res.status(201).json({ success: true, message: 'Tahun akademik baru berhasil ditambahkan!', data: created });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/academic-years/:id', (req, res) => {
  try {
    const updated = db.updateAcademicYear(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Tahun akademik tidak ditemukan.' });
    }
    res.json({ success: true, message: 'Konfigurasi tahun akademik berhasil diperbarui!', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/academic-years/:id', (req, res) => {
  try {
    const deleted = db.deleteAcademicYear(req.params.id);
    if (!deleted) {
      return res.status(400).json({ success: false, message: 'Tidak dapat menghapus tahun akademik aktif atau data tidak ditemukan.' });
    }
    res.json({ success: true, message: 'Tahun akademik berhasil dihapus!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/academic-years/switch', (req, res) => {
  try {
    const { yearId } = req.body;
    if (!yearId) {
      return res.status(400).json({ success: false, message: 'yearId wajib dikirimkan!' });
    }
    const result = db.switchAcademicYear(yearId);
    if (!result) {
      return res.status(404).json({ success: false, message: 'Tahun akademik tujuan tidak ditemukan.' });
    }
    res.json({
      success: true,
      message: `Tahun akademik aktif berhasil dialihkan ke: ${result.academicYear.nama}`,
      data: result
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 9. PROFIL MADRASAH / LEMBAGA
// ==========================================
app.get('/api/institution', (req, res) => {
  try {
    const inst = db.getInstitution();
    res.json({ success: true, data: inst });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/institution', (req, res) => {
  try {
    const updated = db.updateInstitution(req.body);
    res.json({ success: true, message: 'Profil madrasah berhasil diperbarui!', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 10. PENGGUNA & HAK AKSES
// ==========================================
app.get('/api/users', (req, res) => {
  try {
    const users = db.getUsers();
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/users', (req, res) => {
  try {
    const created = db.createUser(req.body);
    res.status(201).json({ success: true, message: 'Pengguna baru berhasil ditambahkan!', data: created });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/users/:id', (req, res) => {
  try {
    const updated = db.updateUser(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
    }
    res.json({ success: true, message: 'Data pengguna berhasil diperbarui!', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/users/:id', (req, res) => {
  try {
    const deleted = db.deleteUser(req.params.id);
    if (!deleted) {
      return res.status(400).json({ success: false, message: 'Gagal menghapus pengguna. Minimal tersisa 1 pengguna aktif di sistem.' });
    }
    res.json({ success: true, message: 'Pengguna berhasil dihapus!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 11. BACKUP, RESTORE & RESET
// ==========================================
app.get('/api/backup', (req, res) => {
  try {
    const data = db.getAllData();
    const filename = `SIDASI_BACKUP_${new Date().toISOString().slice(0, 10)}.json`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(data, null, 2));
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/restore', (req, res) => {
  try {
    const data = req.body;
    if (!data || typeof data !== 'object') {
      return res.status(400).json({ success: false, message: 'Format data restore tidak valid!' });
    }
    const success = db.saveAllData(data);
    if (success) {
      res.json({ success: true, message: 'Basis data berhasil dipulihkan dari backup!' });
    } else {
      res.status(500).json({ success: false, message: 'Gagal memulihkan database.' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/reset', (req, res) => {
  try {
    const resetData = db.resetToDefault();
    res.json({ success: true, message: 'Basis data berhasil dikembalikan ke setelan awal default!', data: resetData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 12. FALLBACK ROUTE - BUKA INDEX.HTML
// ==========================================
app.get('*', (req, res) => {
  const indexPath = path.join(STATIC_ROOT, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('SIDASI: Berkas index.html tidak ditemukan di direktori utama.');
  }
});

// ==========================================
// JALANKAN SERVER DENGAN AUTO-PORT FALLBACK
// ==========================================
function startServer(port, maxAttempts = 10) {
  const server = app.listen(port, () => {
    activePort = port;
    console.log('================================================================');
    console.log('  🏛️  SIDASI MTs AL-FADLLIYAH - SERVER BACKEND AKTIF           ');
    console.log('  Sistem Informasi Data Siswa Mandiri (Bebas MySQL / Python)    ');
    console.log('================================================================');
    console.log(`  🌐 Website & Dashboard : http://localhost:${port}`);
    console.log(`  🔌 REST API Endpoint   : http://localhost:${port}/api`);
    console.log(`  💾 Penyimpanan Berkas  : backend/data/sidasi_database.json`);
    console.log(`  ⚡ Status Kesehatan    : http://localhost:${port}/api/health`);
    console.log('  --------------------------------------------------------------');
    console.log('  Copyright © 2026 by Ravi SQ. Moh. Zein Permana');
    console.log('================================================================\n');

    // Tulis port aktif agar launcher dan klien dapat mendeteksinya
    try {
      const dataDir = path.join(__dirname, 'data');
      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
      fs.writeFileSync(path.join(dataDir, '.active_port'), String(port), 'utf-8');
    } catch (e) {}
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      if (maxAttempts > 0) {
        console.warn(`⚠️ Port ${port} sedang digunakan. Mencoba port alternatif ${port + 1}...`);
        startServer(port + 1, maxAttempts - 1);
      } else {
        console.error('❌ Gagal mengaktifkan server: Seluruh port alternatif sedang terpakai.');
      }
    } else {
      console.error('❌ Terjadi kesalahan pada server:', err);
    }
  });
}

startServer(DEFAULT_PORT);

