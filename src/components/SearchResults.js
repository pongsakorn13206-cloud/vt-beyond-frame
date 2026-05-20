'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { HiDownload, HiPhotograph, HiSparkles, HiArchive, HiCheckCircle } from 'react-icons/hi';
import { BsStars } from 'react-icons/bs';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { getConfidenceColor, downloadImage, formatDate } from '@/lib/utils';
import MemoryStory from '@/components/MemoryStory';
import { useLanguage } from '@/context/LanguageContext';

export default function SearchResults({ results = [], isLoading = false }) {
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
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
        className="bg-gradient-to-r from-indigo-500/10 to-violet-500/10 border border-indigo-500/20 rounded-2xl p-5 flex items-center gap-4"
      >
        <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center">
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
        <div className="ml-auto flex items-center gap-3">
          {results.length > 0 && (
            <>
              {isSelectMode ? (
                <>
                  <button
                    onClick={() => {
                      setIsSelectMode(false);
                      setSelectedPhotos([]);
                    }}
                    className="px-4 py-2 sm:py-3 text-sm font-medium text-slate-400 hover:text-white transition-colors whitespace-nowrap"
                  >
                    {t('results.cancel')}
                  </button>
                  <span className="hidden sm:inline text-sm font-medium text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-full whitespace-nowrap">
                    {t('results.selected')} {selectedPhotos.length} {t('results.photos')}
                  </span>
                  {selectedPhotos.length > 0 && (
                    <button
                      onClick={handleDownloadSelected}
                      disabled={isZipping}
                      className="flex items-center gap-2 px-4 py-2 sm:px-4 sm:py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-xl text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50 whitespace-nowrap"
                    >
                      {isZipping ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <HiDownload className="text-xl" />
                      )}
                      <span className="hidden sm:inline">{isZipping ? t('results.downloading') : t('results.downloadSelected')}</span>
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsSelectMode(true)}
                    className="flex items-center gap-2 px-4 py-2 sm:px-4 sm:py-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-sm font-medium text-white transition-colors whitespace-nowrap"
                  >
                    <HiCheckCircle className="text-xl text-indigo-400" />
                    <span className="hidden sm:inline">{t('results.selectPhotos')}</span>
                  </button>
                  
                  <button
                    onClick={handleDownloadAll}
                    disabled={isZipping || results.length === 0}
                    className="flex items-center gap-2 px-4 py-2 sm:px-4 sm:py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium border border-white/10 transition-colors disabled:opacity-50 whitespace-nowrap"
                  >
                    {isZipping ? (
                      <div className="w-5 h-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                    ) : (
                      <HiArchive className="text-xl text-indigo-400" />
                    )}
                    <span className="hidden sm:inline">{isZipping ? t('results.compressing') : t('results.downloadAll')}</span>
                  </button>
                </>
              )}
              
              <button
                onClick={() => setShowStoryModal(true)}
                className="flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white rounded-xl font-bold shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 transition-all hover:-translate-y-1 transform scale-95 sm:scale-100 whitespace-nowrap"
              >
                <HiSparkles className="text-xl" />
                <span className="hidden sm:inline">{t('results.createStory')}</span>
                <span className="sm:hidden">{t('results.createStoryShort')}</span>
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
                    // Normal click action if any, e.g. open lightbox
                  }
                }}
              >
                <img
                  src={photo.thumbnail_url || photo.original_url}
                  alt={`Match ${index + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
    </div>
  );
}
