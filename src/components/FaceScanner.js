'use client';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';

export default function FaceScanner({ imageUrl }) {
  const [textIndex, setTextIndex] = useState(0);
  const { t } = useLanguage();
  
  const scanTexts = t('scanner.texts');

  useEffect(() => {
    const interval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % scanTexts.length);
    }, 600);
    return () => clearInterval(interval);
  }, [scanTexts.length]);

  return (
    <div className="flex flex-col items-center justify-center py-4">
      {/* Scanner Container */}
      <div className="relative w-64 h-64 rounded-2xl overflow-hidden bg-slate-900 border border-indigo-500/30 shadow-[0_0_40px_rgba(99,102,241,0.15)] ring-1 ring-white/5">
        
        {/* User Image (Background) */}
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt="Scanning target" 
            className="absolute inset-0 w-full h-full object-cover opacity-50 grayscale"
          />
        ) : (
          <div className="absolute inset-0 bg-slate-800" />
        )}
        
        {/* Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.15)_1px,transparent_1px)] bg-[size:20px_20px]" />

        {/* Sci-Fi HUD Corners */}
        <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-indigo-400 rounded-tl-lg opacity-80" />
        <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-indigo-400 rounded-tr-lg opacity-80" />
        <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-indigo-400 rounded-bl-lg opacity-80" />
        <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-indigo-400 rounded-br-lg opacity-80" />

        {/* Target Reticle */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="w-40 h-40 border border-dashed border-indigo-500/30 rounded-full"
          />
          <motion.div 
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute w-2 h-2 bg-indigo-400 rounded-full shadow-[0_0_15px_#818cf8]"
          />
          <motion.div 
            animate={{ width: ["40%", "45%", "40%"], height: ["50%", "55%", "50%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute border border-indigo-400/40 rounded-lg"
          />
        </div>

        {/* Scanning Laser Line */}
        <motion.div
          initial={{ top: "-10%" }}
          animate={{ top: "110%" }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute left-0 right-0 h-1 bg-indigo-400 shadow-[0_0_20px_#818cf8] z-10"
        >
          <div className="absolute bottom-full left-0 right-0 h-24 bg-gradient-to-t from-indigo-500/40 to-transparent" />
        </motion.div>

        {/* Glitch Overlay Effect (Simplified) */}
        <motion.div 
          animate={{ opacity: [0, 0.1, 0] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="absolute inset-0 bg-indigo-500/20 pointer-events-none"
        />
      </div>

      {/* Status Text Display */}
      <div className="mt-6 h-12 flex flex-col items-center">
        <motion.p 
          key={textIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="text-xs sm:text-sm font-mono text-indigo-300 tracking-[0.2em]"
        >
          {scanTexts[textIndex]}
        </motion.p>
        <p className="text-[10px] text-slate-500 mt-2 font-mono">
          {t('scanner.system')}
        </p>
      </div>
    </div>
  );
}
