'use client';
import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { HiUpload, HiCamera, HiX, HiCheckCircle } from 'react-icons/hi';
import { BsPersonBoundingBox } from 'react-icons/bs';

export default function FaceUploader({ onFaceDetected, isProcessing = false }) {
  const [preview, setPreview] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const fileInputRef = useRef(null);
  const imageRef = useRef(null);

  const handleFile = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
      setFaceDetected(false);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleImageLoad = async () => {
    if (imageRef.current && onFaceDetected) {
      try {
        const result = await onFaceDetected(imageRef.current);
        setFaceDetected(!!result);
      } catch (err) {
        console.error('Face detection error:', err);
      }
    }
  };

  const clearImage = () => {
    setPreview(null);
    setFaceDetected(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openCamera = async () => {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'user';
      input.onchange = (e) => handleFile(e.target.files[0]);
      input.click();
    } catch (err) {
      console.error('Camera error:', err);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      {!preview ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 cursor-pointer ${
            dragOver
              ? 'border-indigo-400 bg-indigo-500/10'
              : 'border-slate-600 hover:border-indigo-500/50 hover:bg-slate-800/50'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files[0])}
          />
          
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center">
              <BsPersonBoundingBox className="text-4xl text-indigo-400" />
            </div>
            <div>
              <p className="text-white font-semibold text-lg">อัปโหลดรูปหน้าของคุณ</p>
              <p className="text-slate-400 text-sm mt-1">ลากไฟล์มาวาง หรือคลิกเพื่อเลือก</p>
              <p className="text-slate-500 text-xs mt-2">รองรับ JPG, PNG, WEBP</p>
            </div>
            
            <div className="flex gap-3 mt-2">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-medium text-white transition-colors"
              >
                <HiUpload className="text-base" />
                เลือกรูป
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); openCamera(); }}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-xl text-sm font-medium text-white transition-colors"
              >
                <HiCamera className="text-base" />
                ถ่ายรูป
              </button>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-2xl overflow-hidden bg-slate-800 border border-white/10"
        >
          {/* Preview Image */}
          <div className="relative aspect-square max-h-96 flex items-center justify-center bg-slate-900">
            <img
              ref={imageRef}
              src={preview}
              alt="Preview"
              className="max-w-full max-h-full object-contain"
              crossOrigin="anonymous"
              onLoad={handleImageLoad}
            />
            
            {/* Status badge */}
            {faceDetected && (
              <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-green-500/20 backdrop-blur-md rounded-full px-3 py-1.5">
                <HiCheckCircle className="text-green-400" />
                <span className="text-green-300 text-xs font-medium">ตรวจพบใบหน้า</span>
              </div>
            )}

            {/* Clear button */}
            <button
              onClick={clearImage}
              className="absolute top-3 right-3 p-2 bg-black/50 backdrop-blur-md rounded-full hover:bg-black/70 transition-colors"
            >
              <HiX className="text-white" />
            </button>
          </div>

          {/* Processing state */}
          {isProcessing && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 border-3 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                <p className="text-white font-medium">กำลังค้นหาใบหน้า...</p>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
