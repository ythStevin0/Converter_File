import React, { useState } from 'react';

const ALL_FORMATS = [
  '.png', '.jpeg', '.jpg',
  '.webp', '.gif', '.hdr',
  '.jpe', '.mat', '.pbm',
  '.pfm', '.pgm', '.pnm',
  '.ppm', '.raw', '.tif',
  '.tiff', '.jfi', '.avif'
];

export const VertBatchSimulator: React.FC = () => {
  const [globalFormat, setGlobalFormat] = useState('.png');
  const [showFormatPopover, setShowFormatPopover] = useState(false);
  const [formatSearch, setFormatSearch] = useState('');
  const [vertStatusNotice, setVertStatusNotice] = useState('Antrean siap dikonversi di memori lokal.');
  const [filesQueue, setFilesQueue] = useState([
    {
      id: 1,
      name: 'Mister Alpaca.jpg',
      format: '.png',
      status: 'ready' as 'ready' | 'done',
      thumb: 'https://images.unsplash.com/photo-1511885663737-eea53f6d6187?auto=format&fit=crop&w=300&q=80',
    },
  ]);

  const handleAddFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const newItems = Array.from(fileList).map(file => {
      const isImg = file.type.startsWith('image/');
      const url = isImg
        ? URL.createObjectURL(file)
        : 'https://images.unsplash.com/photo-1511885663737-eea53f6d6187?auto=format&fit=crop&w=300&q=80';
      return {
        id: Date.now() + Math.random(),
        name: file.name,
        format: globalFormat,
        status: 'ready' as const,
        thumb: url,
      };
    });
    setFilesQueue(prev => [...prev, ...newItems]);
    setVertStatusNotice(`${fileList.length} file ditambahkan ke antrean lokal.`);
  };

  const handleConvertSingle = (id: number) => {
    setFilesQueue(prev => prev.map(f => (f.id === id ? { ...f, status: 'done' } : f)));
    setVertStatusNotice('Konversi lokal selesai dalam 0.12 detik.');
  };

  const handleConvertAll = () => {
    setFilesQueue(prev => prev.map(f => ({ ...f, status: 'done' })));
    setVertStatusNotice(`Semua file (${filesQueue.length}) berhasil dikonversi secara lokal.`);
  };

  const handleClear = () => {
    setFilesQueue([]);
    setVertStatusNotice('Antrean dikosongkan.');
  };

  const handleRemove = (id: number) => {
    setFilesQueue(prev => prev.filter(f => f.id !== id));
  };

  const filteredFormats = ALL_FORMATS.filter(f => f.toLowerCase().includes(formatSearch.toLowerCase()));

  return (
    <div className="p-5 space-y-4">
      {/* Batch Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-obsidian-950 p-2.5 rounded-xl border border-obsidian-border">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleConvertAll}
            className="px-3 py-1.5 bg-[#00e575] hover:bg-[#19ff8c] !text-black text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <span className="!text-black">Konversi Semua</span>
          </button>

          <button
            type="button"
            onClick={handleClear}
            className="px-2.5 py-1.5 bg-obsidian-900 border border-obsidian-border hover:text-rose-400 text-xs rounded-lg text-[#6e8578] transition cursor-pointer"
          >
            Kosongkan
          </button>
        </div>

        {/* Global Format Selector */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowFormatPopover(!showFormatPopover)}
            className="px-3 py-1.5 bg-obsidian-900 border border-[#00e575] text-[#00e575] text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer"
          >
            <span>Format: {globalFormat}</span>
            <span className="text-[10px]">▼</span>
          </button>

          {/* Popover */}
          {showFormatPopover && (
            <div className="absolute right-0 top-10 z-30 w-60 bg-obsidian-900 border border-[#00e575] p-3 rounded-xl shadow-2xl space-y-2">
              <input
                type="text"
                placeholder="Cari format (.png, .webp)..."
                value={formatSearch}
                onChange={(e) => setFormatSearch(e.target.value)}
                className="w-full bg-obsidian-950 border border-obsidian-border px-2.5 py-1.5 rounded text-xs text-white placeholder-[#6e8578] focus:outline-none"
              />
              <div className="grid grid-cols-3 gap-1 max-h-40 overflow-y-auto">
                {filteredFormats.map(fmt => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => {
                      setGlobalFormat(fmt);
                      setFilesQueue(prev => prev.map(f => ({ ...f, format: fmt })));
                      setShowFormatPopover(false);
                    }}
                    className={`py-1 text-xs font-mono font-bold rounded transition ${
                      fmt === globalFormat
                        ? 'bg-[#00e575] !text-black'
                        : 'bg-obsidian-950 text-[#8ca396] hover:text-white'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Queue Cards */}
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {filesQueue.map(item => (
          <div
            key={item.id}
            className="p-3 bg-obsidian-950 border border-obsidian-border rounded-xl flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3 truncate">
              <img
                src={item.thumb}
                alt={item.name}
                className="w-10 h-10 rounded-lg object-cover bg-obsidian-900 shrink-0 border border-obsidian-border"
              />
              <div className="truncate">
                <div className="text-xs font-bold text-white truncate">{item.name}</div>
                <div className="text-[11px] text-[#6e8578] font-mono">
                  Target: <span className="text-[#00e575]">{item.format}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {item.status === 'done' ? (
                <span className="text-xs font-semibold text-[#00e575] bg-signal-dim px-2.5 py-1 rounded-md border border-[#00e575]/30">
                  ✓ Selesai
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleConvertSingle(item.id)}
                  className="px-3 py-1 bg-[#00e575] hover:bg-[#19ff8c] !text-black text-xs font-bold rounded-md transition cursor-pointer"
                >
                  <span className="!text-black">Konversi</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => handleRemove(item.id)}
                className="text-[#6e8578] hover:text-rose-400 p-1 text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Files Dropzone */}
      <label
        htmlFor="vertAddFiles"
        className="p-4 border-2 border-dashed border-obsidian-border hover:border-[#00e575] rounded-xl flex flex-col items-center justify-center cursor-pointer transition text-center group bg-obsidian-950/40"
      >
        <input
          id="vertAddFiles"
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleAddFiles(e.target.files)}
        />
        <span className="text-xs font-bold text-white group-hover:text-[#00e575] transition">
          + Tambah File ke Antrean Batch
        </span>
        <span className="text-[11px] text-[#6e8578] mt-0.5">
          Mendukung multi-file gambar, dokumen, dan media
        </span>
      </label>

      {/* Status Notice */}
      <div className="text-[11px] text-[#8ca396] pt-1">
        STATUS: {vertStatusNotice}
      </div>
    </div>
  );
};
