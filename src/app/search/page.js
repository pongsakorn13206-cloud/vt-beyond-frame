'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HiSearch, HiRefresh, HiUpload, HiCamera, HiX } from 'react-icons/hi';
import { BsStars } from 'react-icons/bs';
import SearchResults from '@/components/SearchResults';
import LoadingSpinner from '@/components/LoadingSpinner';
import FaceScanner from '@/components/FaceScanner';
import { useLanguage } from '@/context/LanguageContext';

export default function SearchPage() {
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('all');
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const { t } = useLanguage();

  // Fetch events on mount
  useEffect(() => {
    fetch('/api/events')
      .then(res => res.json())
      .then(data => setEvents(data.events || []))
      .catch(err => console.error('Failed to load events', err));
  }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
    setError(null);
    setHasSearched(false);
    setResults([]);
  };

  const handleSearch = useCallback(async () => {
    if (!selectedFile) return;

    setError(null);
    setIsSearching(true);
    setHasSearched(false);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      if (selectedEvent !== 'all') {
        formData.append('eventId', selectedEvent);
      }

      // Add artificial delay to show off the cool scanner animation (min 2.5s)
      const [res] = await Promise.all([
        fetch('/api/faces/search', {
          method: 'POST',
          body: formData,
        }),
        new Promise(resolve => setTimeout(resolve, 2500))
      ]);

      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        setResults(data.results || []);
      }
      setHasSearched(true);
    } catch (err) {
      console.error('Search error:', err);
      setError(t('search.searchError'));
    } finally {
      setIsSearching(false);
    }
  }, [selectedFile, selectedEvent, t]);

  const handleRetry = () => {
    setResults([]);
    setHasSearched(false);
    setError(null);
    setPreview(null);
    setSelectedFile(null);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/15 via-indigo-500/5 to-transparent rounded-full translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-violet-500/15 via-violet-500/5 to-transparent rounded-full -translate-x-1/2 translate-y-1/2" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 mb-4">
              <BsStars className="text-indigo-400" />
              <span className="text-indigo-300 text-sm font-medium">{t('search.badge')}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white">
              {t('search.title')}<span className="gradient-text">{t('search.titleHighlight')}</span>
            </h1>
            <p className="text-slate-400 mt-3 text-lg">
              {t('search.subtitle')}
            </p>
          </motion.div>

          {/* Upload Area */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-6"
          >
            {!preview ? (
              <div className="text-center py-8">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center mx-auto mb-5">
                  <HiCamera className="text-3xl text-indigo-400" />
                </div>
                <p className="text-white font-semibold text-lg mb-2">{t('search.uploadTitle')}</p>
                <p className="text-slate-500 text-sm mb-6">{t('search.uploadFormats')}</p>
                
                {/* Event Selector */}
                <div className="max-w-xs mx-auto mb-6 text-left">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    {t('search.filterEvent') || 'ระบุกิจกรรมที่ต้องการค้นหา (ทางเลือก)'}
                  </label>
                  <select
                    value={selectedEvent}
                    onChange={(e) => setSelectedEvent(e.target.value)}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  >
                    <option value="all">{t('search.allEvents') || 'ค้นหาทุกกิจกรรม'}</option>
                    {events.map((event) => (
                      <option key={event.id} value={event.id}>
                        {event.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-xl text-sm font-medium text-white shadow-lg shadow-indigo-500/25 transition-all"
                  >
                    <HiUpload /> {t('search.selectPhoto')}
                  </button>
                  <button
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-xl text-sm font-medium text-white transition-colors"
                  >
                    <HiCamera /> {t('search.takePhoto')}
                  </button>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
                <input ref={cameraInputRef} type="file" accept="image/*" capture="user" className="hidden" onChange={handleFileSelect} />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="relative w-48 h-48 rounded-2xl overflow-hidden ring-4 ring-indigo-500/30">
                  <img src={preview} alt="Your selfie" className="w-full h-full object-cover" />
                  <button
                    onClick={handleRetry}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 rounded-full transition-colors"
                  >
                    <HiX className="text-white text-sm" />
                  </button>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleSearch}
                    disabled={isSearching}
                    className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-xl text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50"
                  >
                    {isSearching ? (
                      <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> {t('search.searching')}</>
                    ) : (
                      <><HiSearch /> {t('search.searchBtn')}</>
                    )}
                  </button>
                  <button
                    onClick={handleRetry}
                    className="flex items-center gap-2 px-5 py-3 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-xl text-sm font-medium text-white transition-colors"
                  >
                    <HiRefresh /> {t('search.changePhoto')}
                  </button>
                </div>
              </div>
            )}
          </motion.div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center"
            >
              <p className="text-red-300 text-sm">{error}</p>
            </motion.div>
          )}
        </div>
      </section>

      {/* Results */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {isSearching && (
          <div className="py-12">
            <FaceScanner imageUrl={preview} />
          </div>
        )}

        <SearchResults results={results} isLoading={false} />

        {hasSearched && !isSearching && results.length === 0 && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card p-12 text-center"
          >
            <HiSearch className="text-5xl text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">{t('search.noResults')}</p>
            <p className="text-slate-500 text-sm mt-2">
              {t('search.noResultsHint')}
            </p>
          </motion.div>
        )}
      </section>
    </div>
  );
}
