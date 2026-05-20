'use client';
import { useState, useEffect, use } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiArrowLeft, HiCalendar, HiLocationMarker, HiPhotograph, HiTrash, HiDownload, HiCheckCircle } from 'react-icons/hi';
import Link from 'next/link';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import PhotoGallery from '@/components/PhotoGallery';
import LoadingSpinner from '@/components/LoadingSpinner';
import { formatDate } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';

export default function EventPage({ params }) {
  const { id } = use(params);
  const [event, setEvent] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    fetchEventData();
  }, [id]);

  async function fetchEventData() {
    try {
      // Check admin status
      const adminRes = await fetch('/api/admin/check');
      const adminData = await adminRes.json();
      setIsAdmin(adminData.isAdmin);

      // Fetch event details
      const eventRes = await fetch(`/api/events`);
      const eventData = await eventRes.json();
      const eventInfo = eventData.events?.find((e) => e.id === id);
      setEvent(eventInfo);

      // Fetch photos
      await fetchPhotos(0);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchPhotos(pageNum) {
    try {
      const res = await fetch(`/api/photos?event_id=${id}&page=${pageNum}&limit=30`);
      const data = await res.json();
      
      if (pageNum === 0) {
        setPhotos(data.photos || []);
      } else {
        setPhotos((prev) => [...prev, ...(data.photos || [])]);
      }
      
      setHasMore(data.hasMore);
      setPage(pageNum);
    } catch (error) {
      console.error('Error fetching photos:', error);
    }
  }

  const loadMore = () => {
    if (hasMore) {
      fetchPhotos(page + 1);
    }
  };

  const handleDeletePhoto = (photoId) => {
    setPhotoToDelete(photoId);
    setDeleteModalOpen(true);
  };

  const executeDeletePhoto = async () => {
    if (!photoToDelete) return;
    setIsDeleting(true);
    
    try {
      const res = await fetch(`/api/photos/${photoToDelete}`, { method: 'DELETE' });
      if (res.ok) {
        setPhotos(photos.filter(p => p.id !== photoToDelete));
        // Decrease event photo count visually
        setEvent(prev => prev ? { ...prev, photo_count: Math.max(0, prev.photo_count - 1) } : prev);
        setDeleteModalOpen(false);
        setPhotoToDelete(null);
      } else {
        alert(t('common.error'));
      }
    } catch (err) {
      console.error(err);
      alert(t('common.error'));
    } finally {
      setIsDeleting(false);
    }
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

  const downloadZip = async (photosToDownload) => {
    if (photosToDownload.length === 0) return;
    setIsDownloadingZip(true);
    
    try {
      const zip = new JSZip();
      
      const promises = photosToDownload.map(async (photo, index) => {
        try {
          const res = await fetch(photo.original_url);
          const blob = await res.blob();
          const ext = photo.original_url.split('.').pop().split('?')[0] || 'jpg';
          const filename = `photo-${index + 1}.${ext}`;
          zip.file(filename, blob);
        } catch (err) {
          console.error(`Failed to fetch photo ${photo.original_url}:`, err);
        }
      });
      
      await Promise.all(promises);
      
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `${event?.name || 'event'}-photos.zip`);
    } catch (err) {
      console.error('Error generating ZIP:', err);
      alert(t('common.error'));
    } finally {
      setIsDownloadingZip(false);
      setIsSelectMode(false);
      setSelectedPhotos([]);
    }
  };

  const handleDownloadAll = () => downloadZip(photos);
  const handleDownloadSelected = () => {
    const photosToDownload = photos.filter(p => selectedPhotos.includes(p.id));
    downloadZip(photosToDownload);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner text={t('event.loading')} size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="relative overflow-hidden">
        {event?.cover_image && (
          <div className="absolute inset-0">
            <img
              src={event.cover_image}
              alt=""
              className="w-full h-full object-cover opacity-20 blur-xl"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 to-slate-950" />
          </div>
        )}

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Back button */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
          >
            <HiArrowLeft />
            <span className="text-sm">{t('event.back')}</span>
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl sm:text-4xl font-bold text-white">
              {event?.name || t('event.event')}
            </h1>
            {event?.description && (
              <p className="text-slate-400 mt-2 text-lg max-w-2xl">
                {event.description}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-slate-400">
              {event?.event_date && (
                <span className="flex items-center gap-1.5">
                  <HiCalendar className="text-indigo-400" />
                  {formatDate(event.event_date)}
                </span>
              )}
              {event?.location && (
                <span className="flex items-center gap-1.5">
                  <HiLocationMarker className="text-indigo-400" />
                  {event.location}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <HiPhotograph className="text-indigo-400" />
                {photos.length} {t('common.photos')}
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Action Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-800/50 p-4 rounded-2xl border border-white/5">
          <div className="flex items-center gap-4">
            {isSelectMode ? (
              <>
                <button
                  onClick={() => {
                    setIsSelectMode(false);
                    setSelectedPhotos([]);
                  }}
                  className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
                >
                  {t('results.cancel')}
                </button>
                <span className="text-sm font-medium text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full">
                  {t('results.selected')} {selectedPhotos.length} {t('results.photos')}
                </span>
                {selectedPhotos.length > 0 && (
                  <button
                    onClick={handleDownloadSelected}
                    disabled={isDownloadingZip}
                    className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-xl text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50"
                  >
                    {isDownloadingZip ? (
                      <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> {t('results.downloading')}</>
                    ) : (
                      <><HiDownload className="text-lg" /> {t('results.downloadSelected')}</>
                    )}
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsSelectMode(true)}
                  className="flex items-center gap-2 px-5 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl text-sm font-medium text-white transition-colors"
                >
                  <HiCheckCircle className="text-lg" /> {t('results.selectPhotos')}
                </button>
                <button
                  onClick={handleDownloadAll}
                  disabled={isDownloadingZip || photos.length === 0}
                  className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-xl text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50"
                >
                  {isDownloadingZip ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> {t('results.downloading')}</>
                  ) : (
                    <><HiDownload className="text-lg" /> {t('results.downloadAll')} ({photos.length})</>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Photo Gallery */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 pb-16">
        <PhotoGallery 
          photos={photos} 
          isAdmin={isAdmin} 
          onDeletePhoto={handleDeletePhoto}
          isSelectMode={isSelectMode}
          selectedPhotos={selectedPhotos}
          onPhotoSelect={togglePhotoSelection}
        />

        {/* Load more */}
        {hasMore && (
          <div className="flex justify-center mt-8">
            <button
              onClick={loadMore}
              className="px-8 py-3 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-xl text-sm font-medium text-white transition-colors"
            >
              {t('event.loadMore')}
            </button>
          </div>
        )}
      </section>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md px-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card w-full max-w-md p-8 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-rose-600" />
              
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4 border border-red-500/30">
                  <HiTrash className="text-3xl text-red-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{t('event.deletePhoto')}</h3>
                <p className="text-slate-400 mb-8">
                  {t('event.deletePhotoDesc')} <br/>
                  <span className="text-red-400 font-medium">{t('event.deletePhotoWarning')}</span>
                </p>
                
                <div className="flex gap-3 w-full">
                  <button 
                    onClick={() => { setDeleteModalOpen(false); setPhotoToDelete(null); }} 
                    disabled={isDeleting}
                    className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-xl font-medium text-white transition-colors disabled:opacity-50"
                  >
                    {t('results.cancel')}
                  </button>
                  <button 
                    onClick={executeDeletePhoto} 
                    disabled={isDeleting}
                    className="flex-1 py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 rounded-xl font-bold text-white shadow-lg shadow-red-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isDeleting ? (
                      <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> {t('event.deleting')}</>
                    ) : (
                      t('event.confirmDelete')
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
