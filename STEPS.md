# Urutan Langkah Teknis Implementasi (STEPS.md)
## Proyek: OrbitDrop — Contextual Radial File Converter & Web3 Utility

Dokumen ini merupakan panduan eksekusi teknis terstruktur berdasarkan Product Requirements Document (PRD).

---

### Langkah 1: Inisialisasi Proyek & Jendela Transparan (Core OS)
**Tujuan:** Membuat fondasi aplikasi desktop lintas OS (Windows & macOS) yang dapat berjalan tanpa bingkai di atas Desktop.
- **Tugas Teknis:**
  1. Inisialisasi proyek desktop menggunakan Electron + Vite + React + TypeScript, Tailwind CSS, Lucide Icons, dan Framer Motion.
  2. Konfigurasi jendela Electron (`BrowserWindow`):
     - `transparent: true`
     - `frame: false`
     - `alwaysOnTop: true`
     - `resizable: false`
     - `hasShadow: false`
     - `webPreferences: { preload: ..., contextIsolation: true, nodeIntegration: false }`
  3. Konfigurasi System Tray & Global Shortcuts (atau shortcut mouse/keyboard) agar aplikasi berjalan di background saat idle dan muncul instan (<100ms) saat file diseret atau tombol pemicu aktif.

---

### Langkah 2: Pembuatan UI RadialMenu.tsx & Format Router Kontekstual
**Tujuan:** Membangun menu melingkar dinamis yang otomatis menyesuaikan pilihan berdasarkan ekstensi file yang diseret.
- **Tugas Teknis:**
  1. Buat komponen SVG melingkar (`RadialMenu.tsx`) yang membagi lingkaran menjadi juring-juring (pie slices) interaktif dengan perhitungan busur SVG (`M`, `A`, `L`, `Z`).
  2. Buat indikator lingkaran tengah:
     - Menampilkan ukuran file secara real-time (contoh: `1.1 MB` atau `1.2 MB`) saat idle / kursor berada di tengah.
     - Berubah dinamis menjadi nama format/aksi tujuan (contoh: `JPG`, `TIFF`, `ADD BG`, `IPFS DROP`) saat kursor diarahkan ke juring tertentu.
  3. Buat modul `src/utils/formatRouter.ts` untuk memetakan ekstensi input:
     - Input `.pdf` $\rightarrow$ `DOCX`, `JPG`, `PNG`, `TXT`.
     - Input Gambar (`.jpg`, `.png`, dll.) $\rightarrow$ `PNG`, `WEBP`, `HEIC`, `TIFF`, `AVIF`, `BMP`, `PDF`, `DOCX`.
  4. Tambahkan mode menu kedua (**Ring 2 — Quick Action & Web3 Ring**):
     - Berisi juring: `COMPRESS`, `METADATA`, `EDIT`, `ANNOTATE`, `ADD BG`, `CROP`, `REDACT`, serta Web3 actions (`IPFS DROP`, `STAMP`, `ENCRYPT`).
     - Navigasi antar ring melalui toggle, tombol `Tab`, atau scroll wheel.

---

### Langkah 3: Integrasi Drag-and-Drop & Mesin Konversi Lokal
**Tujuan:** Menangkap file yang di-drop ke juring format dan memproses konversi secara instan 100% lokal.
- **Tugas Teknis:**
  1. Tangkap path absolut dan metadata file dari event drop (`dragover`, `drop`) melalui Electron IPC.
  2. Mesin konversi lokal di proses Node.js / Electron Main:
     - Gambar: menggunakan library `sharp` (libvips) untuk konversi super cepat antar format (`jpg`, `png`, `webp`, `avif`, `tiff`, `bmp`).
     - PDF: ekstraksi halaman / konversi PDF ke gambar atau teks menggunakan parser/renderer lokal (`pdf-lib`, `pdf-poppler` / `canvas` / `mupdf`).
  3. Simpan file hasil konversi di direktori yang sama persis dengan file asal (contoh: `Page 001.pdf` $\rightarrow$ `Page 001.jpg`).

---

### Langkah 4: Pembuatan Editor Visual Mini (CropModal.tsx & AddBgModal.tsx)
**Tujuan:** Menghadirkan jendela pop-up pengeditan cepat tanpa software berat.
- **Tugas Teknis:**
  1. **Modal Crop Image (`CropModal.tsx`):**
     - Bingkai potong interaktif warna aksen oranye.
     - Pilihan rasio aspek: `Free`, `1:1`, `16:9`, `9:16`, `4:3`, `3:4`.
     - Input manual ukuran piksel `W` dan `H`.
     - Tombol `Reset` dan `Apply` $\rightarrow$ simpan sebagai `<NamaFile> Cropped.<ext>`.
  2. **Modal Add BG (`AddBgModal.tsx`):**
     - HTML5 Canvas preview dengan pilihan warna solid, transparan, dan gradasi modern.
     - Slider pengaturan: `Padding` (px), `Corners` (border-radius px), `Shadow` (px).
     - Rasio kanvas: `Auto`, `1:1`, `16:9`, `4:5`.
     - Tombol `Save with Background` $\rightarrow$ simpan sebagai `<NamaFile> With Background.png`.

---

### Langkah 5: Integrasi 3 Fitur Web3 (ipfs.ts, stamp.ts, encrypt.ts)
**Tujuan:** Menyematkan utilitas Web3 tanpa ketergantungan server terpusat.
- **Tugas Teknis:**
  1. `ipfs.ts` (**IPFS DROP**): Unggah file via IPFS SDK (Pinata/Lighthouse), tampilkan progress persentase di tengah lingkaran menu, dan salin link IPFS ke clipboard.
  2. `stamp.ts` (**VERIFY / STAMP**): Hitung hash SHA-256 file secara lokal, tautkan verifikasi on-chain EAS (Ethereum Attestation Service) via `viem`.
  3. `encrypt.ts` (**ENCRYPT / UNLOCK**): Enkripsi file lokal dengan AES-256-GCM / Lit Protocol menjadi format `.locked`, serta deteksi otomatis file `.locked` untuk membuka modal unlock.

---

### Langkah 6: Web Portal Pendamping & Auto-Release GitHub
**Tujuan:** Menyediakan web portal unduhan dan portal verifikasi/dekripsi browser-based.
- **Tugas Teknis:**
  1. Aplikasi Next.js di `/web-portal` dengan rute `/`, `/verify`, dan `/unlock`.
  2. Setup CI/CD GitHub Actions (`.github/workflows/release.yml`) untuk build multi-platform otomatis (`.exe` Windows dan `.dmg` macOS).
