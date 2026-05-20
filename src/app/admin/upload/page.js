'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { HiUpload, HiX, HiCheckCircle, HiArrowLeft, HiExclamationCircle } from 'react-icons/hi';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';
import CustomSelect from '@/components/CustomSelect';
import { useLanguage } from '@/context/LanguageContext';
import { supabase } from '@/lib/supabase';

function UploadContent() {
  const searchParams = useSearchParams();
  const preselectedEvent = searchParams.get('event');
  const { t } = useLanguage();

  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(preselectedEvent || '');
  const [photographerName, setPhotographerName] = useState('');
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, phase: '' });
  const [results, setResults] = useState({ uploaded: 0, scanned: 0, faces: 0 });
  const [errors, setErrors] = useState([]);
  const [isDone, setIsDone] = useState(false);
  const fileInputRef = useRef(null);

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuthAndFetchEvents();
  }, []);

  async function checkAuthAndFetchEvents() {
    try {
      // Check auth first
      const authRes = await fetch('/api/admin/check');
      const authData = await authRes.json();
      
      if (!authData.isAdmin) {
        router.push('/admin');
        return;
      }
      
      setIsCheckingAuth(false);
      // Fetch events
      const res = await fetch('/api/events');
      const data = await res.json();
      setEvents(data.events || []);
    } catch (error) {
      console.error('Auth check error:', error);
      router.push('/admin');
    }
  }

  const handleFiles = (newFiles) => {
    const imageFiles = Array.from(newFiles).filter(f => f.type.startsWith('image/'));
    setFiles(prev => [...prev, ...imageFiles]);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (!selectedEvent || files.length === 0) return;
    setUploading(true);
    setErrors([]);
    setProgress({ current: 0, total: files.length, phase: t('upload.uploading') });
    let uploadedCount = 0, scannedCount = 0, facesCount = 0;
    const uploadErrors = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = file.name.split('.').pop();
        const storagePath = `${selectedEvent}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${ext}`;

        setProgress({
          current: i,
          total: files.length,
          phase: `${t('upload.uploading')} (${i + 1}/${files.length})`,
        });

        try {
          // Step 1: Upload directly to Supabase Storage from browser (bypasses Netlify 6MB limit)
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('event-photos')
            .upload(storagePath, file, {
              contentType: file.type,
              upsert: false,
            });

          if (uploadError) {
            console.error(`Storage upload error for ${file.name}:`, uploadError);
            uploadErrors.push(`${file.name}: ${uploadError.message}`);
            continue;
          }

          // Step 2: Get public URL
          const { data: urlData } = supabase.storage
            .from('event-photos')
            .getPublicUrl(storagePath);

          const publicUrl = urlData.publicUrl;

          // Step 3: Save metadata via lightweight API (only JSON, no file — tiny request)
          const regRes = await fetch('/api/photos/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event_id: selectedEvent,
              storage_path: storagePath,
              original_url: publicUrl,
              photographer_name: photographerName.trim(),
            }),
          });

          const regData = await regRes.json();

          if (!regRes.ok) {
            console.error(`Register error for ${file.name}:`, regData.error);
            uploadErrors.push(`${file.name}: ${regData.error}`);
            continue;
          }

          uploadedCount++;

          setProgress({
            current: i + 1,
            total: files.length,
            phase: `${t('upload.uploading')} (${i + 1}/${files.length})`,
          });

          // Step 4: Scan faces (optional — won't block upload if it fails)
          if (regData.photo) {
            const photo = regData.photo;
            setProgress(p => ({
              ...p,
              phase: `สแกนใบหน้า ${scannedCount + 1}/${uploadedCount}`,
            }));

            try {
              const scanRes = await fetch('/api/faces/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  photo_id: photo.id,
                  event_id: selectedEvent,
                  photo_url: photo.original_url,
                }),
              });
              const scanData = await scanRes.json();
              facesCount += scanData.saved || 0;
              scannedCount++;
            } catch (err) {
              console.error('Scan error:', err);
              scannedCount++;
            }
          }
        } catch (err) {
          console.error(`Error processing ${file.name}:`, err);
          uploadErrors.push(`${file.name}: ${err.message}`);
          continue;
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
    }

    setResults({ uploaded: uploadedCount, scanned: scannedCount, faces: facesCount });
    setErrors(uploadErrors);
    setIsDone(true);
    setUploading(false);
  };

  if (isDone) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-8 max-w-md w-full text-center">
          <div className={`w-16 h-16 rounded-full ${results.uploaded > 0 ? 'bg-green-500/20' : 'bg-red-500/20'} flex items-center justify-center mx-auto mb-4`}>
            {results.uploaded > 0 ? <HiCheckCircle className="text-3xl text-green-400" /> : <HiExclamationCircle className="text-3xl text-red-400" />}
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">{results.uploaded > 0 ? t('upload.success') : 'อัปโหลดไม่สำเร็จ'}</h2>
          <div className="space-y-2 text-sm text-slate-400 mb-2">
            <p>{t('upload.uploadedCount')}: <span className="text-white font-semibold">{results.uploaded}</span> {t('common.photos')}</p>
            <p>{t('upload.scannedCount')}: <span className="text-white font-semibold">{results.scanned}</span> {t('common.photos')}</p>
            <p>{t('upload.facesFound')}: <span className="text-white font-semibold">{results.faces}</span></p>
          </div>
          {errors.length > 0 && (
            <div className="mt-3 mb-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-left max-h-32 overflow-y-auto">
              <p className="text-xs text-red-400 font-semibold mb-1">ข้อผิดพลาด ({errors.length}):</p>
              {errors.map((err, i) => (
                <p key={i} className="text-xs text-red-300/80 truncate">{err}</p>
              ))}
            </div>
          )}
          <p className="text-xs text-indigo-400 mb-6">ขับเคลื่อนโดย InsightFace ArcFace (512D)</p>
          <div className="flex gap-3">
            <button onClick={() => { setFiles([]); setIsDone(false); setErrors([]); setResults({ uploaded: 0, scanned: 0, faces: 0 }); }} className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-xl text-sm font-medium text-white transition-colors">{t('upload.uploadMore')}</button>
            <Link href="/admin/dashboard" className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl text-sm font-medium text-white text-center">{t('upload.backDashboard')}</Link>
          </div>
        </motion.div>
      </div>
    );
  }

  if (isCheckingAuth) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner text={t('admin.loading')} size="lg" /></div>;

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/admin/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"><HiArrowLeft /><span className="text-sm">{t('upload.backDashboard')}</span></Link>

        <h1 className="text-3xl font-bold text-white mb-2">{t('upload.title')}</h1>
        <p className="text-slate-400 mb-8">{t('upload.subtitle')}</p>

        {/* Event selector */}
        <div className="mb-6">
          <CustomSelect
            value={selectedEvent}
            onChange={setSelectedEvent}
            options={[
              { value: '', label: t('upload.selectEventDefault') || 'เลือกกิจกรรม...' },
              ...events.map(ev => ({ value: ev.id, label: ev.name }))
            ]}
            label={t('upload.selectEvent')}
          />
        </div>

        {/* Photographer Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-300 mb-2">{t('upload.photographer')}</label>
          <input 
            type="text" 
            placeholder={t('upload.photographerHint')}
            value={photographerName} 
            onChange={(e) => setPhotographerName(e.target.value)} 
            className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-600"
          />
        </div>

        {/* Dropzone */}
        <div className="border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 border-slate-600 hover:border-indigo-500/50 hover:bg-slate-800/50 mb-6"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
          onClick={() => fileInputRef.current?.click()}>
          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
          <HiUpload className="text-4xl text-indigo-400 mx-auto mb-3" />
          <p className="text-white font-semibold">{t('upload.dropzone')}</p>
          <p className="text-slate-500 text-sm mt-1">{t('upload.dropzoneHint')}</p>
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div className="glass-card p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-white font-medium">{t('upload.selectedPhotos')} ({files.length})</p>
              <button onClick={() => setFiles([])} className="text-xs text-slate-400 hover:text-red-400 transition-colors">{t('upload.clearAll')}</button>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto">
              {files.map((file, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-slate-800 group">
                  <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                  <button onClick={(e) => { e.stopPropagation(); removeFile(i); }} className="absolute top-1 right-1 p-0.5 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><HiX className="text-white text-xs" /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload progress */}
        {uploading && (
          <div className="glass-card p-6 mb-6">
            <p className="text-white font-medium mb-2">{progress.phase}</p>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-2">
              <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-300" style={{ width: `${(progress.current / progress.total) * 100}%` }} />
            </div>
            <p className="text-xs text-slate-500">{progress.current} / {progress.total}</p>
          </div>
        )}

        {/* Upload button */}
        <button onClick={handleUpload} disabled={!selectedEvent || files.length === 0 || uploading} className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-xl text-white font-semibold shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
          {uploading ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> {t('upload.uploading')}</> : <><HiUpload className="text-lg" /> {t('upload.uploadBtn')} {files.length} {t('common.photos')}</>}
        </button>
      </div>
    </div>
  );
}

export default function AdminUploadPage() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>}><UploadContent /></Suspense>;
}
