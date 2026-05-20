'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiDownload, HiX, HiCursorClick, HiZoomIn, HiZoomOut } from 'react-icons/hi';
import { BsStars } from 'react-icons/bs';

const IG_W = 1080;
const IG_H = 1920;

function PolaroidCell({ photo, conf, index, transform, onTransformChange, frameTransform, onFrameTransformChange }) {
  const containerRef = useRef(null);
  const frameRef = useRef(null);
  const [imgDims, setImgDims] = useState({ w: '100%', h: '100%', left: 0, top: 0, loaded: false });

  if (!photo) return null;

  const handleZoom = (e, delta) => {
    e.stopPropagation();
    const newScale = Math.max(1, Math.min(transform.scale + delta, 3));
    if (onTransformChange) onTransformChange(index, { scale: newScale });
  };

  const left = (conf.x / IG_W) * 100 + '%';
  const top = (conf.y / IG_H) * 100 + '%';
  const width = (conf.w / IG_W) * 100 + '%';
  const height = (conf.h / IG_H) * 100 + '%';
  
  const pTop = 20;
  const pSide = 20;
  const pBottom = 100;
  
  const imgLeft = (pSide / conf.w) * 100 + '%';
  const imgTop = (pTop / conf.h) * 100 + '%';
  const imgWidth = ((conf.w - pSide * 2) / conf.w) * 100 + '%';
  const imgHeight = ((conf.h - pTop - pBottom) / conf.h) * 100 + '%';

  return (
    <motion.div
      ref={frameRef}
      drag
      dragMomentum={false}
      onDragEnd={(e, info) => {
        // Calculate ratio
        const parentW = frameRef.current.parentElement.offsetWidth;
        const ratio = IG_W / parentW;
        if (onFrameTransformChange) {
          onFrameTransformChange(index, { 
            x: info.offset.x * ratio, 
            y: info.offset.y * ratio 
          });
        }
      }}
      className="absolute bg-white shadow-2xl group cursor-move"
      style={{
        left, top, width, height,
        rotate: conf.angle,
        x: frameTransform ? frameTransform.x / (IG_W / 100) + '%' : 0, // This is an approximation for initial render, actual drag uses Framer's x/y
      }}
    >
      <div 
        ref={containerRef}
        className="absolute overflow-hidden bg-slate-200 cursor-auto"
        onPointerDown={(e) => e.stopPropagation()} // Prevent frame drag when interacting with image
        style={{ left: imgLeft, top: imgTop, width: imgWidth, height: imgHeight }}
        onWheel={(e) => {
          const zoomDelta = e.deltaY * -0.001;
          handleZoom(e, zoomDelta);
        }}
      >
        <motion.img 
          drag
          dragMomentum={false}
          animate={{ scale: transform.scale }}
          whileHover={{ scale: transform.scale * 1.02 }}
          whileDrag={{ scale: transform.scale * 1.02, cursor: 'grabbing' }}
          onDragEnd={(e, info) => {
            // Get the physical width of this container to calculate exact ratio
            const boxW = containerRef.current.offsetWidth;
            if (onTransformChange) {
              onTransformChange(index, { 
                x: info.offset.x, 
                y: info.offset.y,
                boxW: boxW 
              });
            }
          }}
          onLoad={(e) => {
            const { naturalWidth, naturalHeight } = e.target;
            const imgRatio = naturalWidth / naturalHeight;
            const containerW = conf.w - (pSide * 2);
            const containerH = conf.h - pTop - pBottom;
            const containerRatio = containerW / containerH;

            // Calculate CSS percentages relative to container
            if (imgRatio > containerRatio) {
              const scaledWidthPct = (containerH * imgRatio / containerW) * 100;
              const offsetPct = (100 - scaledWidthPct) / 2;
              setImgDims({ w: `${scaledWidthPct}%`, h: '100%', left: `${offsetPct}%`, top: '0%', loaded: true });
            } else {
              const scaledHeightPct = (containerW / imgRatio / containerH) * 100;
              const offsetPct = (100 - scaledHeightPct) / 2;
              setImgDims({ w: '100%', h: `${scaledHeightPct}%`, left: '0%', top: `${offsetPct}%`, loaded: true });
            }
          }}
          src={photo.thumbnail_url || photo.original_url} 
          alt="Memory"
          style={{ 
            width: imgDims.w, 
            height: imgDims.h, 
            left: imgDims.left, 
            top: imgDims.top 
          }}
          className={`absolute max-w-none max-h-none cursor-grab transition-opacity duration-300 ${imgDims.loaded ? 'opacity-100' : 'opacity-0'}`}
        />
        
        {/* Zoom UI controls */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <button 
            onClick={(e) => handleZoom(e, 0.2)}
            className="p-1.5 bg-black/50 hover:bg-black/80 backdrop-blur-md rounded-full text-white transition-colors"
          >
            <HiZoomIn className="text-sm" />
          </button>
          <button 
            onClick={(e) => handleZoom(e, -0.2)}
            className="p-1.5 bg-black/50 hover:bg-black/80 backdrop-blur-md rounded-full text-white transition-colors"
          >
            <HiZoomOut className="text-sm" />
          </button>
        </div>
        
        {/* Drag Hint Overlay */}
        <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-md px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex items-center gap-1">
          <HiCursorClick className="text-white/80 text-xs" />
          <span className="text-white/80 text-[10px] font-medium">ลากจัดตำแหน่ง</span>
        </div>
      </div>
    </motion.div>
  );
}

export default function MemoryStory({ photos, onClose }) {
  const canvasRef = useRef(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const displayPhotos = photos.slice(0, 4);
  const count = displayPhotos.length;
  const [transforms, setTransforms] = useState(Array(4).fill({ x: 0, y: 0, scale: 1, boxW: 100 }));
  const [frameTransforms, setFrameTransforms] = useState(Array(4).fill({ x: 0, y: 0 }));

  // Photographer name from the first photo, if admin provided it
  const photographerName = displayPhotos[0]?.photographer_name || '';

  const handleTransformChange = (index, newTransform) => {
    setTransforms(prev => {
      const newArr = [...prev];
      newArr[index] = { 
        x: newArr[index].x + (newTransform.x || 0), 
        y: newArr[index].y + (newTransform.y || 0),
        scale: newTransform.scale !== undefined ? newTransform.scale : newArr[index].scale,
        boxW: newTransform.boxW !== undefined ? newTransform.boxW : newArr[index].boxW
      };
      return newArr;
    });
  };

  const handleFrameTransformChange = (index, newTransform) => {
    setFrameTransforms(prev => {
      const newArr = [...prev];
      newArr[index] = { 
        x: newArr[index].x + newTransform.x, 
        y: newArr[index].y + newTransform.y 
      };
      return newArr;
    });
  };

  // Dynamic Polaroid Config for Canvas & UI
  let polaroids = [];
  if (count === 1) {
    polaroids = [
      { x: 140, y: 400, w: 800, h: 1000, angle: -2 }
    ];
  } else if (count === 2) {
    polaroids = [
      { x: 140, y: 350, w: 800, h: 650, angle: -3 },
      { x: 140, y: 1050, w: 800, h: 650, angle: 2 }
    ];
  } else if (count === 3) {
    polaroids = [
      { x: 140, y: 350, w: 800, h: 700, angle: -2 },
      { x: 100, y: 1100, w: 420, h: 500, angle: 4 },
      { x: 560, y: 1100, w: 420, h: 500, angle: -3 }
    ];
  } else {
    polaroids = [
      { x: 100, y: 350, w: 420, h: 600, angle: -4 },
      { x: 560, y: 400, w: 420, h: 600, angle: 3 },
      { x: 100, y: 1050, w: 420, h: 600, angle: 2 },
      { x: 560, y: 1100, w: 420, h: 600, angle: -2 }
    ];
  }

  const generateAndDownloadCollage = async () => {
    setIsDownloading(true);
    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      canvas.width = IG_W;
      canvas.height = IG_H;

      // Draw Background
      const gradient = ctx.createLinearGradient(0, 0, IG_W, IG_H);
      gradient.addColorStop(0, '#0f172a');
      gradient.addColorStop(1, '#312e81');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, IG_W, IG_H);

      // Header Texts
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.font = '800 70px "Inter", sans-serif';
      ctx.fillText('VT BEYOND FRAME', IG_W / 2, 180);
      
      ctx.fillStyle = '#a5b4fc';
      ctx.font = '500 40px "Inter", sans-serif';
      ctx.fillText('My Memory Story', IG_W / 2, 250);

      const loadedImages = await Promise.all(
        displayPhotos.map((photo) => {
          return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous'; // Prevent canvas tainting
            img.onload = () => resolve({ img, eventName: photo.event_name || 'กิจกรรม' });
            img.onerror = () => {
              console.error('Failed to load image for canvas:', photo.original_url);
              resolve(null); // Resolve with null so Promise.all doesn't reject
            };
            img.src = photo.original_url || photo.thumbnail_url;
          });
        })
      );

      for (let i = 0; i < loadedImages.length; i++) {
        const item = loadedImages[i];
        if (!item) continue;
        const conf = polaroids[i];
        const transform = transforms[i];
        const frameTransform = frameTransforms[i];
        
        ctx.save();
        ctx.translate(conf.x + conf.w/2 + frameTransform.x, conf.y + conf.h/2 + frameTransform.y);
        ctx.rotate((conf.angle * Math.PI) / 180);

        // Shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 30;
        ctx.shadowOffsetX = 10;
        ctx.shadowOffsetY = 15;

        // White paper
        ctx.fillStyle = '#ffffff';
        const pX = -conf.w/2;
        const pY = -conf.h/2;
        ctx.fillRect(pX, pY, conf.w, conf.h);
        ctx.shadowColor = 'transparent';

        const pTop = 20;
        const pSide = 20;
        const pBottom = 100;
        const imgW = conf.w - (pSide * 2);
        const imgH = conf.h - pTop - pBottom;
        
        const zoom = transform.scale;
        const boxRatio = imgW / imgH;
        let sWidth = item.img.width / zoom;
        let sHeight = item.img.height / zoom;
        let sX = 0, sY = 0;

        if ((item.img.width / item.img.height) > boxRatio) {
          sWidth = sHeight * boxRatio;
          sX = (item.img.width - sWidth) / 2;
        } else {
          sHeight = sWidth / boxRatio;
          sY = (item.img.height - sHeight) / 2;
        }

        // Apply pan offset
        // Map UI pixels to Canvas native image pixels
        // Canvas box width = imgW. UI box width = transform.boxW.
        // So 1 UI pixel = (imgW / transform.boxW) canvas pixels.
        // And inside canvas, 1 canvas pixel = (sWidth / imgW) native pixels.
        // Therefore, 1 UI pixel = (sWidth / transform.boxW) native pixels.
        const uiToNativeRatio = sWidth / transform.boxW;
        sX -= transform.x * uiToNativeRatio;
        sY -= transform.y * uiToNativeRatio;

        // Clamp
        sX = Math.max(0, Math.min(sX, item.img.width - sWidth));
        sY = Math.max(0, Math.min(sY, item.img.height - sHeight));

        ctx.drawImage(
          item.img,
          sX, sY, sWidth, sHeight,
          pX + pSide, pY + pTop, imgW, imgH
        );

        ctx.restore();
      }

      ctx.textAlign = 'center';
      ctx.fillStyle = '#818cf8';
      ctx.font = '30px "Inter", sans-serif';
      if (photographerName.trim()) {
        ctx.fillText(`Photographer : ${photographerName}`, IG_W / 2, IG_H - 60);
      } else {
        ctx.fillText('VT BEYOND FRAME', IG_W / 2, IG_H - 60);
      }

      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `VT-BEYOND-FRAME-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

    } catch (err) {
      console.error('Download error:', err);
      alert('เกิดข้อผิดพลาดในการดาวน์โหลดภาพ');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex flex-col items-center bg-slate-950/95 backdrop-blur-3xl overflow-y-auto"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[50vh] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />

        {/* Close Button (Mobile Friendly) */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 bg-slate-800/80 hover:bg-slate-700 backdrop-blur-md rounded-full text-white transition-colors"
        >
          <HiX className="text-xl" />
        </button>

        {/* Content Wrapper — vertical on mobile, horizontal on desktop */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 w-full h-full p-4 sm:p-8">

        {/* Left Side: Info & Actions */}
        <div className="w-full md:w-1/3 max-w-md flex flex-col justify-center gap-4 md:gap-6 z-10 shrink-0 text-center md:text-left order-2 md:order-1">
          <div>
            <h2 className="text-white text-3xl sm:text-5xl font-extrabold tracking-tight mb-2">
              YOUR <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">STORY</span>
            </h2>
            <p className="text-slate-400 font-medium flex items-center justify-center md:justify-start gap-2">
              <BsStars className="text-indigo-400" /> WYSIWYG Polaroid Editor
            </p>
          </div>
          
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 text-sm text-slate-300">
            <p className="mb-2">💡 <strong>เคล็ดลับ:</strong></p>
            <ul className="list-disc pl-5 space-y-1 text-left">
              <li>ลากกรอบสีขาว เพื่อขยับโพลารอยด์ทั้งใบ</li>
              <li>ลากรูปด้านใน เพื่อจัดตำแหน่งใบหน้า (ซูมโดยกด +/-)</li>
            </ul>
          </div>

          <div className="flex flex-col gap-3 mt-2">
            <button
              onClick={generateAndDownloadCollage}
              disabled={isDownloading}
              className="group relative inline-flex items-center justify-center gap-3 w-full py-4 bg-white text-slate-900 rounded-2xl font-bold text-lg overflow-hidden transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 shadow-[0_0_40px_rgba(255,255,255,0.15)]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-100 to-violet-100 opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative z-10 flex items-center gap-3">
                {isDownloading ? (
                  <><div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" /> สร้างภาพ...</>
                ) : (
                  <><HiDownload className="text-xl" /> ดาวน์โหลดภาพ Story</>
                )}
              </span>
            </button>
            <button 
              onClick={onClose}
              className="py-4 rounded-2xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors font-medium"
            >
              ยกเลิก
            </button>
          </div>
        </div>

        {/* Right Side: WYSIWYG Canvas Preview */}
        <div className="relative w-full max-w-[280px] sm:max-w-[320px] md:max-w-[400px] lg:max-w-[450px] aspect-[9/16] shrink-0 shadow-2xl rounded-lg overflow-hidden flex items-center justify-center order-1 md:order-2" style={{ containerType: 'inline-size' }}>
          {/* Exact Canvas Background Simulation */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-indigo-900" />
          
          <div className="absolute top-[8%] left-0 w-full text-center">
            <h1 className="text-white font-extrabold text-[4cqw] tracking-wider drop-shadow-lg">VT BEYOND FRAME</h1>
            <p className="text-indigo-300 font-medium text-[2.5cqw] mt-1">My Memory Story</p>
          </div>

          <div className="absolute bottom-[3%] left-0 w-full text-center">
            <p className="text-indigo-300 font-medium text-[2cqw]">
              {photographerName.trim() ? `Photographer : ${photographerName}` : 'VT BEYOND FRAME'}
            </p>
          </div>

          {/* Render Polaroids Exactly as Canvas */}
          {polaroids.map((conf, i) => (
            <PolaroidCell 
              key={i}
              photo={displayPhotos[i]} 
              conf={conf} 
              index={i}
              transform={transforms[i]}
              onTransformChange={handleTransformChange}
              frameTransform={frameTransforms[i]}
              onFrameTransformChange={handleFrameTransformChange}
            />
          ))}
        </div>

        </div> {/* End Content Wrapper */}

        {/* Hidden canvas for downloading */}
        <canvas ref={canvasRef} className="hidden" />
      </motion.div>
    </AnimatePresence>
  );
}
