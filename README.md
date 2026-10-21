# Product Requirements Document (PRD): OrbitDrop — Contextual Radial File Converter & Web3 Utility

|**Informasi Dokumen**|**Rincian Spesifikasi**|
|---|---|
|**Nama Produk (Working Title)**|**OrbitDrop**|
|**Versi Dokumen**|1.0 (MVP hingga Full Release)|
|**Platform Target**|Desktop Cross-Platform (Windows 10/11 & macOS Intel/Apple Silicon) + Web Portal Pendamping|
|**Arsitektur Mesin**|100% Local Conversion Engine (Offline-First) + Hybrid Web3 SDK|
|**Model Biaya Operasional**|Rp 0 (Zero-Server Cost via Local Processing, GitHub Releases & Vercel Free Tier)|

## 1. Visi & Ringkasan Produk

**OrbitDrop** adalah aplikasi utilitas desktop yang menyederhanakan proses konversi berbagai ekstensi file, pengeditan visual cepat, dan pengamanan file berbasis Web3 menjadi satu gerakan **Drag-and-Drop (Seret dan Lepas)** langsung di layar Desktop.

Saat pengguna menyeret sebuah file, aplikasi memunculkan menu melingkar (**Radial/Pie Menu**) tepat di posisi kursor mouse yang secara cerdas hanya menampilkan format konversi atau aksi yang relevan dengan jenis file tersebut. Seluruh pemrosesan konversi dilakukan secara lokal di perangkat pengguna sehingga hasilnya muncul secara instan di sebelah file asli tanpa memerlukan proses unggah/unduh ke server.

## 2. Masalah Utama & Solusi

- **Masalah 1 (Alur Konversi Lambat):** Mengonversi file biasanya mengharuskan pengguna membuka browser, mencari situs konverter, mengunggah file, menunggu antrean, dan mengunduh hasilnya.
    
    - **Solusi:** Menu melingkar kontekstual di layar Desktop yang langsung menghasilkan file baru begitu file dilepas (_drop_).
        
- **Masalah 2 (Edit Visual Sederhana Terlalu Rumit):** Memotong gambar atau memberi latar belakang estetik sering kali mengharuskan pengguna membuka aplikasi desain berat.
    
    - **Solusi:** Jendela _pop-up_ mini (`Crop Image` dan `Add BG`) yang langsung terbuka dari menu melingkar dengan pengaturan rasio, _padding_, sudut melengkung, dan bayangan instan.
        
- **Masalah 3 (Keamanan, Bukti Keaslian & Berbagi File):** Berbagi file secara permanen, menyegel keaslian dokumen, atau mengenkripsi file rahasia membutuhkan banyak alat terpisah.
    
    - **Solusi:** Integrasi menu Web3 (`IPFS DROP`, `STAMP`, dan `ENCRYPT`) langsung di dalam menu melingkar disertai Web Portal pendamping bagi penerima file.
        

## 3. Alur Pengguna & Spesifikasi UX/UI (User Experience)

### 3.1. Interaksi Dasar Radial Menu

1. **Kondisi Siaga (Idle):** Aplikasi berjalan di latar belakang (_System Tray_ pada Windows / _Menu Bar_ pada macOS) tanpa menampilkan jendela di layar.
    
2. **Pemicu (Trigger):** Pengguna mengklik dan menyeret file dari Desktop atau Explorer/Finder (misalnya `Page 001.pdf`) sambil menekan tombol pemicu (misal: tahan `Alt`/`Option` atau goyangkan kursor).
    
3. **Kemunculan Menu:**
    
    - Jendela transparan tanpa bingkai muncul tepat di koordinat kursor.
        
    - Lingkaran tengah menampilkan informasi ukuran file secara _real-time_ (seperti `1.1 MB` atau `1.2 MB`) saat file berada di tengah, lalu berubah menampilkan nama aksi/format tujuan (seperti `JPG`, `TIFF`, atau `ADD BG`) saat kursor diarahkan ke salah satu juring menu.
        
4. **Eksekusi & Output:** Saat klik mouse dilepas pada salah satu juring menu, file diproses dan file baru (misalnya `Page 001.jpg`) langsung muncul di folder yang sama di sebelah file asli.
    

### 3.2. Dua Lapisan Menu Melingkar

Pengguna dapat berpindah antara dua mode lingkaran (misalnya dengan menekan tombol `Tab` atau _Scroll Wheel_ saat menyeret file):

- **Ring 1 — Contextual Format Converter:** Menampilkan pilihan ekstensi file tujuan sesuai kategori file yang diseret.
    
- **Ring 2 — Quick Action & Web3 Tools:** Menampilkan alat manipulasi visual, dokumen, dan aksi Web3.
    

## 4. Spesifikasi Fitur Fungsional (Functional Requirements)

### Modul A: Mesin Konversi File Kontekstual (Local Engine)

Aplikasi wajib mendeteksi ekstensi/_MIME-type_ file yang diseret dan memetakan pilihan konversi berikut:

|**Kategori Input**|**Ekstensi File Asal**|**Pilihan Output di Radial Menu**|**Mesin Pemroses Lokal**|
|---|---|---|---|
|**Dokumen PDF**|`.pdf`|`DOCX`, `JPG`, `PNG`, `TXT`|MuPDF / PDFium + pdf2docx|
|**Gambar & Foto**|`.jpg`, `.jpeg`, `.png`, `.webp`, `.heic`, `.tiff`, `.avif`, `.bmp`, `.svg`|`PNG`, `WEBP`, `HEIC`, `TIFF`, `AVIF`, `BMP`, `PDF`, `DOCX`, `JPG`|libvips (`sharp` / `image-rs`)|
|**Dokumen Office & Teks**|`.docx`, `.txt`, `.md`, `.html`, `.epub`|`PDF`, `DOCX`, `TXT`, `HTML`, `EPUB`, `MD`|Pandoc|
|**Video**|`.mp4`, `.mov`, `.mkv`, `.avi`, `.webm`|`MP4`, `GIF`, `MP3` (Audio), `WEBM`, `MOV`|FFmpeg Static Binary|
|**Audio**|`.mp3`, `.wav`, `.flac`, `.m4a`, `.ogg`|`MP3`, `WAV`, `AAC`, `FLAC`, `OGG`|FFmpeg Static Binary|
|**Data & Arsip**|`.csv`, `.xlsx`, `.json`, `.zip`, `.7z`|`XLSX`, `CSV`, `JSON`, `PDF`, `ZIP`|SheetJS + 7-Zip SDK|

### Modul B: Alat Manipulasi Cepat & Editor Mini (Quick Actions)

Saat pengguna beralih ke menu aksi cepat, juring lingkaran menampilkan opsi berikut:

1. **`CROP` (Pemotong Gambar Interaktif)**:
    
    - Membuka jendela modal **Crop Image** dengan pratinjau dokumen/gambar dan bingkai potong berwarna oranye yang dapat digeser.
        
    - Menyediakan tombol pilihan **Aspect Ratio**: `Free`, `1:1`, `16:9`, `9:16`, `4:3`, dan `3:4`.
        
    - Menampilkan dan mengizinkan input manual ukuran piksel **Width (`W`)** dan **Height (`H`)** (misalnya `2550 px` x `3300 px` menjadi `2550 px` x `2550 px`).
        
    - Menyediakan tombol `Reset` di kiri bawah dan tombol `Apply` di kanan bawah untuk menyimpan hasil potongan sebagai file baru (contoh: `Page 001 Cropped.jpg`).
        
2. **`ADD BG` (Pembuat Latar Belakang Estetik)**:
    
    - Membuka jendela modal **Add BG** dengan pratinjau langsung (_live preview_).
        
    - **Background Picker:** Pilihan palet warna solid, transparan (kotak-kotak), dan gradasi warna modern.
        
    - **Slider Pengaturan Visual:**
        
        - `Padding`: Mengatur jarak ruang kosong di sekeliling gambar (dalam satuan `px`, misal `342 px` hingga `869 px`).
            
        - `Corners`: Mengatur kelengkungan sudut gambar (`border-radius` dalam `px`, misal `184 px`).
            
        - `Shadow`: Mengatur ketebalan bayangan di belakang gambar (dalam `px`, misal `24 px`).
            
    - **Ratio Selector:** Pilihan rasio kanvas akhir (`Auto`, `1:1`, `16:9`, `4:5`).
        
    - **Tombol Aksi:** Tombol `Reset` dan `Save with Background` yang mengekspor hasil akhir menjadi file `.png` (contoh: `Page 001 Cropped With Background.png`).
        
3. **Alat Utilitas Dokumen & Gambar Lainnya**:
    
    - **`COMPRESS`:** Mengurangi ukuran byte file gambar/PDF/video secara otomatis tanpa merusak kualitas visual secara signifikan.
        
    - **`METADATA`:** Melihat dan menghapus informasi EXIF/Metadata tersembunyi dari file.
        
    - **`REDACT`:** Membuka jendela cepat untuk menyensor (menghitamkan) teks atau area sensitif pada dokumen/gambar.
        
    - **`ANNOTATE` & `EDIT`:** Menambahkan coretan, tanda panah, atau teks cepat pada gambar/PDF.
        

### Modul C: Fitur Utilitas Web3

Ketiga fitur Web3 diintegrasikan sebagai aksi _drag-and-drop_ di dalam menu melingkar:

1. **`IPFS DROP` (Penyimpanan Desentralisasi Instan):**
    
    - **Input:** Segala jenis file yang dilepas ke juring `IPFS DROP`.
        
    - **Proses:** Mengunggah file ke jaringan IPFS menggunakan Pinata/Lighthouse SDK (atau _local node_ Helia) dengan indikator persentase di lingkaran tengah.
        
    - **Output:** Menyalin URL IPFS (`https://.../ipfs/CID`) langsung ke _clipboard_ pengguna dan menampilkan notifikasi sukses.
        
2. **`VERIFY / STAMP` (Bukti Keaslian Dokumen On-Chain):**
    
    - **Input:** Dokumen atau karya asli (misal `.pdf`, `.jpg`, `.png`).
        
    - **Proses:** Menghitung kode kriptografi `SHA-256 Hash` secara lokal di perangkat (0 detik, Rp 0).
        
    - **Output Modal:**
        
        - Mode **Verify (Gratis/Tanpa Wallet):** Mengecek ke jaringan Layer-2 (Base/Polygon via _Ethereum Attestation Service_) apakah kode _hash_ file tersebut sudah terdaftar beserta waktu dan alamat pembuatnya.
            
        - Mode **Stamp (On-Chain):** Mencatat _hash_ file ke blockchain menggunakan tanda tangan dompet pengguna dan menyematkan bukti transaksi ke metadata file.
            
3. **`ENCRYPT / UNLOCK` (Enkripsi File Berbasis Wallet):**
    
    - **Proses Encrypt:** Saat file dilepas ke menu `ENCRYPT`, muncul input alamat wallet penerima (`0x...` / `.eth`) atau kata sandi. File dienkripsi menggunakan `AES-256-GCM` + kontrol akses _Lit Protocol_ dan disimpan sebagai `namafile.ext.locked`.
        
    - **Proses Unlock:** Saat pengguna menyeret file berekstensi `.locked`, menu melingkar otomatis menampilkan tombol `UNLOCK` untuk mendekripsi file kembali ke bentuk aslinya.
        

### Modul D: Website Landing Page & Web Portal Pendamping (Opsi 1)

Satu aplikasi web terpadu yang di-hosting gratis di **Vercel** dengan tiga rute utama:

1. **Halaman Utama (`/`):**
    
    - Menampilkan video demonstrasi penggunaan _Radial Menu_.
        
    - Tombol unduh cerdas yang mendeteksi OS pengunjung dan mengarahkan langsung ke file installer di **GitHub Releases** (`.dmg` untuk macOS, `.exe` untuk Windows).
        
    - Panduan singkat melewati layar _Unverified Developer_ (klik kanan _Open_ di Mac / _Run Anyway_ di Windows) agar pengguna tidak bingung.
        
2. **Portal Verifikasi (`/verify`):**
    
    - Area _Drag-and-Drop_ berbasis browser bagi klien atau pihak ketiga (yang belum menginstal aplikasi desktop) untuk mengecek keaslian file yang telah di-`STAMP`.
        
3. **Portal Dekripsi (`/unlock`):**
    
    - Area _Drag-and-Drop_ berbasis browser bagi penerima file `.locked` untuk menghubungkan _wallet_ mereka, melakukan tanda tangan _off-chain_ gratis, dan mengunduh file asli.
        

## 5. Arsitektur Teknis & Tech Stack

|**Komponen**|**Teknologi yang Digunakan**|**Alasan Pemilihan**|
|---|---|---|
|**Desktop Core Framework**|**Tauri v2** (Rust + TypeScript) _atau_ **Electron**|Mendukung jendela transparan tanpa bingkai, lintas OS (Windows & macOS), serta fitur _Auto-Updater_ gratis via GitHub.|
|**Frontend UI & Animasi**|**React + TypeScript + Tailwind CSS + Framer Motion**|Memudahkan pembuatan geometri SVG _Radial Menu_ dan transisi modal `Crop Image` serta `Add BG` yang mulus.|
|**Visual Canvas Processing**|**HTML5 Canvas API + `react-easy-crop`**|Memproses fitur `CROP` dan `ADD BG` (`Padding`, `Corners`, `Shadow`) secara _real-time_ di sisi klien.|
|**Local Conversion Engine**|**Sharp (libvips), MuPDF/PDFium, Pandoc, FFmpeg**|Semua berlisensi _open-source_ (Rp 0), super cepat, dan berjalan tanpa koneksi internet.|
|**Web3 Libraries**|**`viem`, `eas-sdk`, `@lit-protocol/lit-node-client`, `pinata-web3`**|Pustaka standar industri yang ringan dan tidak membebani biaya server kepada pembuat aplikasi.|
|**Web Portal & CI/CD**|**Next.js (Vercel) + GitHub Actions & GitHub Releases**|Mengotomatiskan pembuatan file `.exe` dan `.dmg` di _cloud_ serta menyediakan _hosting_ dan _bandwidth_ unduhan gratis.|

## 6. Target Performa & Keamanan (Non-Functional Requirements)

1. **Waktu Respons UI:** Menu melingkar harus muncul di layar dalam waktu **< 100 milidetik** sejak gerakan _drag_ + pemicu dideteksi.
    
2. **Kecepatan Konversi Lokal:** Konversi dokumen atau gambar berukuran `1.1 MB` – `1.2 MB` seperti pada referensi video harus selesai dalam waktu **< 1 detik**.
    
3. **Konsumsi Memori (RAM):** Saat aplikasi berada dalam mode siaga (_background tray_), penggunaan RAM tidak boleh melebihi **50 MB** (dengan Tauri) atau **150 MB** (dengan Electron).
    
4. **Privasi Data:** Tidak ada satu pun file yang dikirim keluar dari laptop pengguna saat menggunakan fitur konversi dan pengeditan visual (`CROP`, `ADD BG`, `COMPRESS`, `REDACT`). Koneksi internet hanya digunakan jika pengguna secara eksplisit memilih menu `IPFS DROP` atau `STAMP`.
    

## 7. Peta Jalan Pengembangan (Roadmap & Milestones)

### Fase 1: Core Desktop & Radial Converter (Minggu 1–2)

- Inisialisasi proyek lintas platform (Windows & macOS) dengan jendela transparan _always-on-top_.
    
- Pembuatan komponen **Radial Menu** interaktif beserta indikator ukuran file di lingkaran tengah.
    
- Integrasi mesin konversi lokal untuk Gambar (`JPG`, `PNG`, `WEBP`, `AVIF`, `TIFF`, `BMP`, `HEIC`) dan Dokumen (`PDF`, `DOCX`, `TXT`).
    

### Fase 2: Quick Action Editors & Web3 Integration (Minggu 3–4)

- Pembuatan jendela modal **Crop Image** (rasio `Free`, `1:1`, `16:9`, `9:16`, `4:3`, `3:4` dan input piksel).
    
- Pembuatan jendela modal **Add BG** (pilihan latar gradasi, _slider_ `Padding`, `Corners`, `Shadow`, dan rasio).
    
- Penambahan fitur `COMPRESS`, `METADATA`, dan `REDACT`.
    
- Integrasi ketiga modul Web3: `IPFS DROP`, `VERIFY / STAMP` (SHA-256 + EAS), dan `ENCRYPT / UNLOCK`.
    

### Fase 3: Web Portal, Auto-Build & Rilis Publik (Minggu 5)

- Pembuatan website **Next.js** dengan halaman Landing Page (`/`), `/verify`, dan `/unlock` di Vercel.
    
- Konfigurasi **GitHub Actions** untuk menghasilkan installer `.exe` (Windows) dan `.dmg` (macOS) secara otomatis ke **GitHub Releases**.
    
- Pengujian akhir lintas OS dan peluncuran publik.
