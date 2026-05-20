'use client';
import { HiDownload } from 'react-icons/hi';
import { downloadImage } from '@/lib/utils';

export default function DownloadButton({ url, filename, className = '', variant = 'icon' }) {
  const handleDownload = (e) => {
    e.preventDefault();
    e.stopPropagation();
    downloadImage(url, filename);
  };

  if (variant === 'full') {
    return (
      <button
        onClick={handleDownload}
        className={`flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-medium text-white transition-colors ${className}`}
      >
        <HiDownload className="text-base" />
        ดาวน์โหลด
      </button>
    );
  }

  return (
    <button
      onClick={handleDownload}
      className={`p-2 bg-white/20 backdrop-blur-md rounded-full hover:bg-white/30 transition-colors ${className}`}
      title="ดาวน์โหลด"
    >
      <HiDownload className="text-white text-lg" />
    </button>
  );
}
