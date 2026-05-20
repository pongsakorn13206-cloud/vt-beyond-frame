'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiX, HiDownload, HiChevronLeft, HiChevronRight, HiTrash, HiCheckCircle } from 'react-icons/hi';
import { downloadImage } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';

export default function PhotoGallery({ photos = [], columns = 3, isAdmin = false, onDeletePhoto, isSelectMode = false, selectedPhotos = [], onPhotoSelect }) {
  const [lightbox, setLightbox] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const { t } = useLanguage();

  const openLightbox = (index) => {
    setLightboxIndex(index);
    setLightbox(photos[index]);
  };

  const closeLightbox = () => setLightbox(null);

  const navigate = (dir) => {
    const newIndex = (lightboxIndex + dir + photos.length) % photos.length;
    setLightboxIndex(newIndex);
    setLightbox(photos[newIndex]);
  };

  if (!photos.length) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500 text-lg">{t('event.noPhotos')}</p>
      </div>
    );
  }

  return (
    <>
      {/* Photo Grid */}
      <div className={`grid grid-cols-2 sm:grid-cols-${columns} lg:grid-cols-${columns + 1} gap-3`}>
        {photos.map((photo, index) => {
          const isSelected = selectedPhotos.includes(photo.id);
          return (
          <motion.div
            key={photo.id || index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.03 }}
            className={`group relative aspect-square rounded-xl overflow-hidden cursor-pointer bg-slate-800 border-2 transition-colors ${isSelected ? 'border-indigo-500' : 'border-transparent'}`}
            onClick={() => {
              if (isSelectMode) {
                onPhotoSelect(photo.id);
              } else {
                openLightbox(index);
              }
            }}
          >
            <img
              src={photo.thumbnail_url || photo.original_url}
              alt={`Photo ${index + 1}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
            {isSelectMode && (
              <div className="absolute top-2 right-2 z-10">
                <HiCheckCircle className={`text-2xl transition-colors ${isSelected ? 'text-indigo-500 bg-white rounded-full' : 'text-white/50 hover:text-white/80'}`} />
              </div>
            )}
            {!isSelectMode && (
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadImage(photo.original_url, `photo-${index + 1}.jpg`);
                  }}
                  className="p-2.5 bg-white/20 backdrop-blur-md rounded-full hover:bg-white/30 transition-colors"
                  title={t('event.download')}
                >
                  <HiDownload className="text-white text-lg" />
                </button>
                {isAdmin && onDeletePhoto && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeletePhoto(photo.id);
                    }}
                    className="p-2.5 bg-red-500/80 backdrop-blur-md rounded-full hover:bg-red-500 transition-colors shadow-lg"
                    title={t('event.deleteImg')}
                  >
                    <HiTrash className="text-white text-lg" />
                  </button>
                )}
              </div>
            </div>
            )}
          </motion.div>
        )})}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center"
            onClick={closeLightbox}
          >
            {/* Close button */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors z-10"
            >
              <HiX className="text-white text-xl" />
            </button>

            {/* Navigation */}
            <button
              onClick={(e) => { e.stopPropagation(); navigate(-1); }}
              className="absolute left-4 p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors z-10"
            >
              <HiChevronLeft className="text-white text-2xl" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); navigate(1); }}
              className="absolute right-4 p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors z-10"
            >
              <HiChevronRight className="text-white text-2xl" />
            </button>

            {/* Image */}
            <motion.img
              key={lightboxIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              src={lightbox.original_url}
              alt="Full size"
              className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Bottom bar */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white/10 backdrop-blur-md rounded-full px-6 py-3">
              <span className="text-white text-sm">
                {lightboxIndex + 1} / {photos.length}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  downloadImage(lightbox.original_url, `photo-${lightboxIndex + 1}.jpg`);
                }}
                className="flex items-center gap-2 text-sm text-indigo-300 hover:text-indigo-200 transition-colors"
              >
                <HiDownload />
                {t('event.download')}
              </button>
              {isAdmin && onDeletePhoto && (
                <>
                  <div className="w-px h-4 bg-white/20 mx-2" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      closeLightbox();
                      onDeletePhoto(lightbox.id);
                    }}
                    className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors"
                  >
                    <HiTrash />
                    {t('event.deleteImg')}
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
