'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { HiDownload, HiPhotograph, HiSparkles, HiArchive, HiCheckCircle, HiX } from 'react-icons/hi';
import { BsStars } from 'react-icons/bs';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import Image from 'next/image';
import { getConfidenceColor, downloadImage, formatDate } from '@/lib/utils';
import MemoryStory from '@/components/MemoryStory';
import { useLanguage } from '@/context/LanguageContext';

export default function SearchResults({ results = [], isLoading = false }) {
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [lightboxPhoto, setLightboxPhoto] = useState(null);
  const { t } = useLanguage();

  const downloadZip = async (photosToDownload) => {
    if (!photosToDownload.length) return;
    setIsZipping(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder("My_Event_Photos");
      
      const promises = photosToDownload.map(async (photo, index) => {
        try {
          const response = await fetch(photo.original_url);
          const blob = await response.blob();
          // Extract extension from URL or fallback to jpg
          const ext = photo.original_url.split('.').pop().split('?')[0] || 'jpg';
          const filename = `photo_${index + 1}_${photo.event_name.replace(/[^a-z0-9]/gi, '_')}.${ext}`;
          folder.file(filename, blob);
        } catch (err) {
          console.error(`Failed to download ${photo.original_url}`, err);
        }
      });
      
      await Promise.all(promises);
      const zipContent = await zip.generateAsync({ type: "blob" });
      saveAs(zipContent, "My_Event_Photos.zip");
    } catch (error) {
      console.error("Error creating ZIP:", error);
      alert(t('common.error'));
    } finally {
      setIsZipping(false);
      setIsSelectMode(false);
      setSelectedPhotos([]);
    }
  };

  const handleDownloadAll = () => downloadZip(results);
  
  const handleDownloadSelected = () => {
    const photosToDownload = results.filter(p => selectedPhotos.includes(p.photo_id));
    downloadZip(photosToDownload);
  };

  const togglePhotoSelection = (photoId) => {
    setSelectedPhotos((prev) => {
      if (prev.includes(photoId)) {
        return prev.filter(id => id !== photoId);
      } else {
        return [...prev, photoId];
      }
    });
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square rounded-xl bg-slate-800/50 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!results.length) {
    return null;
  }

  // Group by event
  const grouped = results.reduce((acc, item) => {
    const key = item.event_id || 'unknown';
    if (!acc[key]) {
      acc[key] = {
        event_name: item.event_name || t('results.unknownEvent'),
        event_date: item.event_date,
        photos: [],
      };
    }
    acc[key].photos.push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      {/* Summary */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-indigo-500/10 to-violet-500/10 border border-indigo-500/20 rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row items-start lg:items-center gap-4"
      >
        <div className="flex items-center gap-4 w-full lg:w-auto">
          <div className="w-12 h-12 shrink-0 rounded-xl bg-indigo-500/20 flex items-center justify-center">
            <HiPhotograph className="text-2xl text-indigo-400" />
          </div>
          <div>
            <p className="text-white font-semibold text-lg sm:text-xl">
              {t('results.found')} {results.length} {t('results.photosMatch')}
            </p>
            <p className="text-slate-400 text-sm">
              {t('results.fromEvents')} {Object.keys(grouped).length} {t('results.events')}
            </p>
          </div>
        </div>
        
        <div className="w-full lg:w-auto lg:ml-auto flex flex-wrap items-center gap-2 sm:gap-3">
          {results.length > 0 && (
            <>
              {isSelectMode ? (
                <>
                  <button
                    onClick={() => {
                      setIsSelectMode(false);
                      setSelectedPhotos([]);
                    }}
                    className="px-3 py-2 sm:px-4 sm:py-3 text-sm font-medium text-slate-400 hover:text-white transition-colors whitespace-nowrap"
                  >
                    {t('results.cancel')}
                  </button>
                  <span className="text-sm font-medium text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-full whitespace-nowrap">
                    {t('results.selected')} {selectedPhotos.length}
                  </span>
                  {selectedPhotos.length > 0 && (
                    <button
                      onClick={handleDownloadSelected}
                      disabled={isZipping}
                      className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-xl text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50 whitespace-nowrap"
                    >
                      {isZipping ? (
                        <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <HiDownload className="text-lg sm:text-xl" />
                      )}
                      <span>{isZipping ? t('results.downloading') : t('results.downloadSelected')}</span>
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsSelectMode(true)}
                    className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-3 py-2.5 sm:px-4 sm:py-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-sm font-medium text-white transition-colors whitespace-nowrap"
                  >
                    <HiCheckCircle className="text-lg sm:text-xl text-indigo-400" />
                    <span>{t('results.selectPhotos')}</span>
                  </button>
                  
                  <button
                    onClick={handleDownloadAll}
                    disabled={isZipping || results.length === 0}
                    className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-3 py-2.5 sm:px-4 sm:py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium border border-white/10 transition-colors disabled:opacity-50 whitespace-nowrap"
                  >
                    {isZipping ? (
                      <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                    ) : (
                      <HiArchive className="text-lg sm:text-xl text-indigo-400" />
                    )}
                    <span>{isZipping ? t('results.compressing') : t('results.downloadAll')}</span>
                  </button>
                </>
              )}
              
              <button
                onClick={() => setShowStoryModal(true)}
                className="w-full lg:w-auto flex items-center justify-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white rounded-xl font-bold shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 transition-all hover:-translate-y-1 whitespace-nowrap"
              >
                <HiSparkles className="text-lg sm:text-xl" />
                <span>{t('results.createStory')}</span>
              </button>
            </>
          )}
        </div>
      </motion.div>

      {/* Results grouped by event */}
      {Object.entries(grouped).map(([eventId, group]) => (
        <div key={eventId} className="space-y-4">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-white">{group.event_name}</h3>
            {group.event_date && (
              <span className="text-xs text-slate-500 bg-slate-800 rounded-full px-3 py-1">
                {formatDate(group.event_date)}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {group.photos.map((photo, index) => {
              const isSelected = selectedPhotos.includes(photo.photo_id);
              return (
              <motion.div
                key={photo.photo_id || index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className={`group relative aspect-square rounded-xl overflow-hidden bg-slate-800 cursor-pointer border-2 transition-colors ${isSelected ? 'border-indigo-500' : 'border-transparent'}`}
                onClick={() => {
                  if (isSelectMode) {
                    togglePhotoSelection(photo.photo_id);
                  } else {
                    setLightboxPhoto(photo);
                  }
                }}
              >
                <Image
                  src={photo.thumbnail_url || photo.original_url}
                  alt={`Match ${index + 1}`}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                
                {/* Confidence badge */}
                <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md rounded-full px-2.5 py-1 z-10">
                  <span className={`text-xs font-bold ${getConfidenceColor(photo.similarity)}`}>
                    {Math.round(photo.similarity * 100)}%
                  </span>
                </div>

                {isSelectMode && (
                  <div className="absolute top-2 right-2 z-10">
                    <HiCheckCircle className={`text-2xl transition-colors ${isSelected ? 'text-indigo-500 bg-white rounded-full' : 'text-white/50 hover:text-white/80'}`} />
                  </div>
                )}

                {/* Hover overlay */}
                {!isSelectMode && (
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-end">
                  <div className="w-full p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-medium ${getConfidenceColor(photo.similarity)}`}>
                        {photo.similarity >= 0.85 ? t('confidence.veryHigh') : 
                         photo.similarity >= 0.7 ? t('confidence.high') : 
                         photo.similarity >= 0.6 ? t('confidence.medium') : t('confidence.low')}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadImage(photo.original_url, `match-${index + 1}.jpg`);
                        }}
                        className="p-2 bg-white/20 backdrop-blur-md rounded-full hover:bg-white/30 transition-colors"
                      >
                        <HiDownload className="text-white text-sm" />
                      </button>
                    </div>
                  </div>
                </div>
                )}
              </motion.div>
            )})}
          </div>
        </div>
      ))}

      {/* Memory Story Modal */}
      {showStoryModal && (
        <MemoryStory 
          photos={results} 
          onClose={() => setShowStoryModal(false)} 
        />
      )}

      {/* Lightbox Modal */}
      {lightboxPhoto && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 sm:p-8 backdrop-blur-sm"
          onClick={() => setLightboxPhoto(null)}
        >
          <button 
            className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10"
            onClick={(e) => { e.stopPropagation(); setLightboxPhoto(null); }}
          >
            <HiX className="text-2xl" />
          </button>
          
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            <img 
              src={lightboxPhoto.original_url} 
              alt="Full size" 
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            
            <div className="mt-6" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => downloadImage(lightboxPhoto.original_url, `photo.jpg`)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/25 transition-all"
              >
                <HiDownload className="text-lg" /> {t('results.download')} รูปนี้
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
