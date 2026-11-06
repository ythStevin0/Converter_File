import React, { useState } from 'react';
import { FileText, Image as ImageIcon, RotateCcw, Minus, X, Layers, Download, FolderOpen } from 'lucide-react';
import { FileExplorerGuideModal } from '../components/FileExplorerGuideModal';
import { InteractiveTutorialShowcase } from '../components/InteractiveTutorialShowcase';

interface LandingPageProps {
  onOpenGuide: () => void;
  onGoToVerify: () => void;
  onGoToDecrypt: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenGuide,
  onGoToVerify,
  onGoToDecrypt,
}) => {
  // OS selector state
  const [selectedOS, setSelectedOS] = useState<'win' | 'mac' | 'src'>('win');

  // Workbench mode: 'radial' or 'vert'
  const [workbenchMode, setWorkbenchMode] = useState<'radial' | 'vert'>('radial');

  // Radial simulator state (matching Electron: Page_001.pdf 1.1 MB)
  const [radialFileActive, setRadialFileActive] = useState(true);
  const [radialFormat, setRadialFormat] = useState('DOCX');
  const [radialOutputSize, setRadialOutputSize] = useState('1.2 MB');
  const [radialSpeed, setRadialSpeed] = useState('0.14 detik');
  const [radialInputName, setRadialInputName] = useState('Page_001.pdf');
  const [radialInputSize, setRadialInputSize] = useState('1.1 MB');

  const handleRadialFileSelect = (file: File | null) => {
    if (!file) return;
    setRadialInputName(file.name);
    const sizeKB = (file.size / 1024).toFixed(1) + ' KB';
    setRadialInputSize(sizeKB);
    const isPdf = file.name.toLowerCase().endsWith('.pdf');
    setRadialFormat(isPdf ? 'DOCX' : 'WEBP');
    setRadialOutputSize(sizeKB);
    setRadialSpeed('0.09 detik');
    setRadialFileActive(true);
  };

  const isLocalOrDirect = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const releaseBase = 'https://github.com/ythStevin0/Converter_File/releases/latest';

  const downloadUrls = {
    win: isLocalOrDirect ? '/OrbitDrop-Setup.exe' : `${releaseBase}/download/OrbitDrop-Setup.exe`,
    mac: `${releaseBase}/download/OrbitDrop.dmg`,
    src: 'https://github.com/ythStevin0/Converter_File/archive/refs/heads/v2.zip',
  };

  const osLabels = {
    win: 'Installer Windows (.exe) • 64-bit',
    mac: 'Apple Silicon / Intel (.dmg) • Universal',
    src: 'Source Code Archive (.zip) • MIT',
  };

  const [installNotice, setInstallNotice] = useState<string | null>(null);
  const [isExplorerModalOpen, setIsExplorerModalOpen] = useState(false);
  const [lastDownloadedFormat, setLastDownloadedFormat] = useState<string | undefined>(undefined);

  const triggerDownload = (targetFormat?: string) => {
    const url = downloadUrls[selectedOS];
    const link = document.createElement('a');
    link.href = url;
    link.download = '';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

        const osLabel = selectedOS === 'win' ? 'Windows (.exe)' : selectedOS === 'mac' ? 'macOS (.dmg)' : 'Source (.zip)';
    const target = targetFormat || 'DOCX';
    setLastDownloadedFormat(target);
    setInstallNotice('✓ File installer masuk ke File Explorer (Downloads). Buka berkas untuk install.');
    setIsExplorerModalOpen(true);
    setTimeout(() => setInstallNotice(null), 8000);
    return;
  };


  return (
    <div className="space-y-20 py-4">

      {/* ======================================================================= */}
      {/* 1. HERO SECTION: BERSIH, MUDAH DIBACA & INTERACTIVE WORKBENCH           */}
      {/* ======================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Column: Typographic Pitch & Direct Download */}
        <div className="lg:col-span-6 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-signal-dim border border-[#00e575]/30 rounded-full text-xs font-medium text-[#00e575]">
            <span className="w-2 h-2 rounded-full bg-[#00e575] animate-pulse"></span>
            <span>Aplikasi Desktop Windows &amp; macOS • 100% Offline</span>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
            Konversi File Instan. <br />
            <span className="text-[#00e575]">Tepat di Kursor Anda.</span>
          </h1>

          <p className="text-base text-[#9cb3a6] leading-relaxed max-w-xl">
            Tidak perlu membuka browser atau mengunggah dokumen penting ke internet. Cukup <strong className="text-white">tekan berkas sambil diarahkan dengan menahan tombol CTRL</strong> (atau shortcut <span className="text-white font-medium">Alt+Space</span>). Selesai dalam <span className="text-[#00e575] font-semibold">&lt; 0.2 detik</span> langsung di CPU komputer Anda.
          </p>

          {/* Download & OS Switcher Block */}
          <div className="space-y-4 pt-2">
            {/* Segmented OS Pill Buttons */}
            <div className="flex items-center gap-2 p-1 bg-obsidian-900 border border-obsidian-border rounded-lg w-fit">
              <button
                type="button"
                onClick={() => setSelectedOS('win')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
                  selectedOS === 'win'
                    ? 'bg-[#00e575] !text-black shadow-sm'
                    : 'text-[#8ca396] hover:text-white font-medium'
                }`}
              >
                Windows (.exe)
              </button>
              <button
                type="button"
                onClick={() => setSelectedOS('mac')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
                  selectedOS === 'mac'
                    ? 'bg-[#00e575] !text-black shadow-sm'
                    : 'text-[#8ca396] hover:text-white font-medium'
                }`}
              >
                macOS (.dmg)
              </button>
              <button
                type="button"
                onClick={() => setSelectedOS('src')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
                  selectedOS === 'src'
                    ? 'bg-[#00e575] !text-black shadow-sm'
                    : 'text-[#8ca396] hover:text-white font-medium'
                }`}
              >
                Source (.zip)
              </button>
            </div>

            {/* Main Primary Download Button */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <a
                href={downloadUrls[selectedOS]}
                download
                onClick={() => {
                  setLastDownloadedFormat(undefined);
                  setIsExplorerModalOpen(true);
                }}
                className="flex-1 bg-[#00e575] hover:bg-[#19ff8c] !text-black font-display font-bold text-sm px-6 py-4 rounded-xl flex items-center justify-between transition shadow-[0_0_25px_rgba(0,229,117,0.25)] group cursor-pointer"
              >
                <div className="flex items-center gap-3 text-black">
                  <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" strokeWidth="2.4" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v3h16v-3M12 3v12m0 0l-4-4m4 4l4-4"/>
                  </svg>
                  <div className="text-left text-black">
                    <div className="text-base font-bold text-black">Unduh OrbitDrop v1.0</div>
                    <div className="text-xs font-semibold text-black/85 mt-0.5">
                      {osLabels[selectedOS]}
                    </div>
                  </div>
                </div>
                <span className="text-sm font-mono font-bold text-black group-hover:translate-x-1 transition">&rarr;</span>
              </a>
            </div>
                
            {/* Verification Line */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-[#6e8578] pt-1">
              <span>✓ Bebas Iklan &amp; Virus</span>
              <span>• Tanpa Batas Ukuran</span>
              <button
                type="button"
                onClick={onOpenGuide}
                className="text-[#00e575] hover:underline cursor-pointer font-medium"
              >
                Panduan Layar "Unverified" &rarr;
              </button>
            </div>

            {/* 3 Core Benefit Cards */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="p-3 bg-obsidian-900 border border-obsidian-border rounded-lg text-center">
                <div className="text-sm font-bold text-[#00e575]">&lt; 0.2 Detik</div>
                <div className="text-[11px] text-[#6e8578] mt-0.5">Proses CPU Lokal</div>
              </div>
              <div className="p-3 bg-obsidian-900 border border-obsidian-border rounded-lg text-center">
                <div className="text-sm font-bold text-white">100% Offline</div>
                <div className="text-[11px] text-[#6e8578] mt-0.5">0 Byte ke Cloud</div>
              </div>
              <div className="p-3 bg-obsidian-900 border border-obsidian-border rounded-lg text-center">
                <div className="text-sm font-bold text-white">Gratis &amp; Terbuka</div>
                <div className="text-[11px] text-[#6e8578] mt-0.5">Lisensi MIT</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Hybrid Three.js + GSAP Interactive Tutorial Showcase */}
        <div className="lg:col-span-6 flex flex-col justify-center">
          <InteractiveTutorialShowcase />
        </div>

      </div>

      {/* ======================================================================= */}
      {/* 2. PERBANDINGAN BERSIH: CLOUD WEB VS ORBITDROP LOKAL                    */}
      {/* ======================================================================= */}
      <div className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#00e575]">
            MENGAPA ORBITDROP LEBIH CEPAT?
          </span>
          <h2 className="font-display text-3xl font-bold text-white">
            Bandingkan Cara Kerja
          </h2>
          <p className="text-sm text-[#8ca396]">
            Lihat perbedaan mendasar antara konverter berbasis web cloud dengan mesin desktop lokal OrbitDrop.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {/* Card: Cloud Web Converter */}
          <div className="p-6 bg-obsidian-900 border border-obsidian-border rounded-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-obsidian-border">
              <span className="text-sm font-bold text-rose-400">Konverter Web Cloud Tradisional</span>
              <span className="text-xs px-2.5 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-900/50">
                ~30 – 60 Detik
              </span>
            </div>

            <ul className="space-y-3 text-xs text-[#9cb3a6]">
              <li className="flex items-start gap-2.5">
                <span className="text-rose-400 font-bold shrink-0">✕</span>
                <span>Harus membuka browser, mencari situs, dan melewati iklan pop-up.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-rose-400 font-bold shrink-0">✕</span>
                <span>Dokumen pribadi diunggah ke server cloud pihak ketiga (risiko privasi tinggi).</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-rose-400 font-bold shrink-0">✕</span>
                <span>Wajib koneksi internet stabil &amp; memakan kuota data Anda.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-rose-400 font-bold shrink-0">✕</span>
                <span>Sering dibatasi limit file harian atau antrean server lambat.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-rose-400 font-bold shrink-0">✕</span>
                <span>Hasil konversi harus diunduh ulang dan tercampur di folder Downloads.</span>
              </li>
            </ul>
          </div>

          {/* Card: OrbitDrop Desktop Engine */}
          <div className="p-6 bg-obsidian-900 border-2 border-[#00e575] rounded-2xl space-y-4 shadow-[0_0_30px_rgba(0,229,117,0.15)] relative">
            <div className="flex items-center justify-between pb-3 border-b border-[#00e575]/30">
              <span className="text-sm font-bold text-[#00e575]">OrbitDrop Native Desktop</span>
              <span className="text-xs px-2.5 py-0.5 rounded bg-signal-dim text-[#00e575] font-bold border border-[#00e575]/40">
                &lt; 0.2 Detik • 100% Lokal
              </span>
            </div>

            <ul className="space-y-3 text-xs text-white">
              <li className="flex items-start gap-2.5">
                <span className="text-[#00e575] font-bold shrink-0">✓</span>
                <span>Tersedia instan langsung di kursor mouse tanpa membuka browser.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-[#00e575] font-bold shrink-0">✓</span>
                <span>100% Offline — data tidak pernah meninggalkan komputer Anda (zero cloud upload).</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-[#00e575] font-bold shrink-0">✓</span>
                <span>Berjalan penuh tanpa koneksi internet sama sekali.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-[#00e575] font-bold shrink-0">✓</span>
                <span>Gratis selamanya, tanpa iklan, dan tanpa batasan ukuran file.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-[#00e575] font-bold shrink-0">✓</span>
                <span>File hasil otomatis muncul rapi tepat di sebelah file asli Anda.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* ======================================================================= */}
      {/* 3. KATEGORI FORMAT (BERSIH & TERORGANISIR)                              */}
      {/* ======================================================================= */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-obsidian-border pb-4 gap-2">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#00e575]">FORMAT POPULER</span>
            <h2 className="font-display text-2xl font-bold text-white mt-1">
              Mendukung Berbagai Kategori Format
            </h2>
          </div>
          <span className="text-xs text-[#6e8578]">40+ Ekstensi Siap Dikonversi di CPU Anda</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 1. Dokumen */}
          <div className="p-4 bg-obsidian-900 border border-obsidian-border rounded-xl space-y-2.5">
            <div className="text-xs font-bold text-[#00e575]">01 // DOKUMEN &amp; TEKS</div>
            <div className="flex flex-wrap gap-1.5">
              {['PDF', 'DOCX', 'DOC', 'TXT', 'RTF', 'ODT', 'MD', 'HTML'].map(ext => (
                <span key={ext} className="px-2 py-0.5 bg-obsidian-950 border border-obsidian-border rounded text-[11px] font-mono text-white">
                  {ext}
                </span>
              ))}
            </div>
          </div>

          {/* 2. Gambar */}
          <div className="p-4 bg-obsidian-900 border border-obsidian-border rounded-xl space-y-2.5">
            <div className="text-xs font-bold text-[#00e575]">02 // GAMBAR &amp; FOTO</div>
            <div className="flex flex-wrap gap-1.5">
              {['PNG', 'JPEG', 'JPG', 'WEBP', 'AVIF', 'GIF', 'TIFF', 'RAW'].map(ext => (
                <span key={ext} className="px-2 py-0.5 bg-obsidian-950 border border-obsidian-border rounded text-[11px] font-mono text-white">
                  {ext}
                </span>
              ))}
            </div>
          </div>

          {/* 3. Data */}
          <div className="p-4 bg-obsidian-900 border border-obsidian-border rounded-xl space-y-2.5">
            <div className="text-xs font-bold text-[#00e575]">03 // DATA &amp; SPREADSHEET</div>
            <div className="flex flex-wrap gap-1.5">
              {['XLSX', 'CSV', 'JSON', 'XML', 'YAML', 'TSV'].map(ext => (
                <span key={ext} className="px-2 py-0.5 bg-obsidian-950 border border-obsidian-border rounded text-[11px] font-mono text-white">
                  {ext}
                </span>
              ))}
            </div>
          </div>

          {/* 4. Video */}
          <div className="p-4 bg-obsidian-900 border border-obsidian-border rounded-xl space-y-2.5">
            <div className="text-xs font-bold text-[#00e575]">04 // VIDEO &amp; MEDIA</div>
            <div className="flex flex-wrap gap-1.5">
              {['MP4', 'MKV', 'WEBM', 'MOV', 'AVI', 'GIF ANIMASI'].map(ext => (
                <span key={ext} className="px-2 py-0.5 bg-obsidian-950 border border-obsidian-border rounded text-[11px] font-mono text-white">
                  {ext}
                </span>
              ))}
            </div>
          </div>

          {/* 5. Audio */}
          <div className="p-4 bg-obsidian-900 border border-obsidian-border rounded-xl space-y-2.5">
            <div className="text-xs font-bold text-[#00e575]">05 // AUDIO &amp; SUARA</div>
            <div className="flex flex-wrap gap-1.5">
              {['MP3', 'WAV', 'FLAC', 'AAC', 'OGG', 'M4A'].map(ext => (
                <span key={ext} className="px-2 py-0.5 bg-obsidian-950 border border-obsidian-border rounded text-[11px] font-mono text-white">
                  {ext}
                </span>
              ))}
            </div>
          </div>

          {/* 6. Web3 & Kriptografi */}
          <div className="p-4 bg-obsidian-900 border border-[#00e575]/40 rounded-xl space-y-2.5 bg-signal-dim/10">
            <div className="text-xs font-bold text-[#00e575]">06 // KRIPTOGRAFI &amp; PRIVASI</div>
            <div className="flex flex-wrap gap-1.5">
              {['.LOCKED (AES-256)', 'CHECKSUM (SHA-256)', 'ZIP ARSIP'].map(ext => (
                <span key={ext} className="px-2 py-0.5 bg-obsidian-950 border border-[#00e575]/40 rounded text-[11px] font-mono text-[#00e575] font-semibold">
                  {ext}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================================= */}
      {/* 4. PERTANYAAN TEKNIS & PANDUAN INSTALASI                                */}
      {/* ======================================================================= */}
      <div id="panduan-instalasi" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-4">
        <div className="lg:col-span-4 space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#00e575]">FAQ &amp; PANDUAN</span>
          <h2 className="font-display text-2xl font-bold text-white">
            Pertanyaan yang Sering Diajukan
          </h2>
          <p className="text-xs text-[#8ca396] leading-relaxed">
            Semua hal yang perlu Anda ketahui tentang instalasi dan keamanan aplikasi desktop OrbitDrop.
          </p>
        </div>

        <div className="lg:col-span-8 space-y-3">
          <div className="bg-obsidian-900 border border-obsidian-border rounded-xl p-5 space-y-2">
            <h3 className="text-sm font-bold text-white">
              Bagaimana OrbitDrop bisa bekerja 100% tanpa internet?
            </h3>
            <p className="text-xs text-[#9cb3a6] leading-relaxed">
              OrbitDrop membawa mesin konversi mandiri (*native local binaries*) di dalam installer desktop. Semua proses komputasi dieksekusi secara instan oleh prosesor (CPU) komputer Anda sendiri tanpa menghubungi server mana pun.
            </p>
          </div>

          <div className="bg-obsidian-900 border border-obsidian-border rounded-xl p-5 space-y-2">
            <h3 className="text-sm font-bold text-white">
              Apakah dokumen atau file pribadi saya aman?
            </h3>
            <p className="text-xs text-[#9cb3a6] leading-relaxed">
              Sangat aman. Kami tidak menggunakan analitik file dan tidak mengirimkan 1 byte pun ke jaringan luar. File Anda tetap berada di penyimpanan hard drive/SSD perangkat Anda.
            </p>
          </div>

          <div className="bg-obsidian-900 border border-[#00e575]/50 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center justify-between">
              <span>Mengapa muncul notifikasi "Unverified Developer" di Windows / macOS?</span>
              <span className="text-[10px] font-mono text-[#00e575] bg-signal-dim px-2 py-0.5 rounded border border-[#00e575]/30">
                PANDUAN
              </span>
            </h3>
            <p className="text-xs text-[#9cb3a6] leading-relaxed">
              OrbitDrop adalah proyek perangkat lunak bebas (*open-source*) gratis tanpa sertifikat digital tahunan berbayar dari Microsoft/Apple.
            </p>
            <div className="p-3 bg-obsidian-950 border border-obsidian-border rounded-lg text-xs space-y-1">
              <div className="text-white font-medium">Cara melanjutkan instalasi di Windows:</div>
              <div className="text-[#00e575] font-mono text-[11px]">
                1. Klik "More info" &rarr; 2. Klik tombol "Run anyway"
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================================= */}
      {/* 5. BOTTOM CTA BANNER (CLEAN & SLEEK)                                     */}
      {/* ======================================================================= */}
      <div className="bg-gradient-to-r from-obsidian-900 to-obsidian-950 border border-[#00e575] rounded-2xl p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-[0_0_40px_rgba(0,229,117,0.1)]">
        <div className="space-y-1">
          <h2 className="font-display text-2xl font-bold text-white">
            Siap Mengonversi File Lebih Cepat?
          </h2>
          <p className="text-xs text-[#8ca396]">
            Gratis selamanya, tanpa iklan, dan langsung jalan di Windows 10/11 &amp; macOS.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <a
            href={downloadUrls[selectedOS]}
            download
            className="px-6 py-3 bg-[#00e575] hover:bg-[#19ff8c] !text-black font-display font-bold text-sm rounded-xl transition shadow-lg cursor-pointer"
          >
            <span className="!text-black">Unduh Sekarang &rarr;</span>
          </a>
          <a
            href="https://github.com/ythStevin0/Converter_File"
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-3 bg-obsidian-900 border border-obsidian-border hover:border-[#00e575] rounded-xl text-xs text-white transition"
          >
            Audit Repo GitHub
          </a>
        </div>
      </div>


      {/* File Explorer Installation Guide Modal */}
      <FileExplorerGuideModal
        isOpen={isExplorerModalOpen}
        onClose={() => setIsExplorerModalOpen(false)}
        fileName={selectedOS === 'win' ? 'OrbitDrop-Setup.exe' : selectedOS === 'mac' ? 'OrbitDrop.dmg' : 'OrbitDrop-Source.zip'}
        targetFormat={lastDownloadedFormat}
        onOpenSecurityGuide={onOpenGuide}
      />
    </div>
  );
};
