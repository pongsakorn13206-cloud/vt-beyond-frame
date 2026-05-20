'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { HiPhotograph, HiCalendar, HiUpload, HiPlus, HiEye, HiCollection, HiTrash, HiLogout, HiPencil, HiSearch, HiClock, HiCheckCircle, HiTrendingUp } from 'react-icons/hi';
import { BsPersonBoundingBox } from 'react-icons/bs';
import LoadingSpinner from '@/components/LoadingSpinner';
import { formatDate } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';

export default function AdminDashboardPage() {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newEvent, setNewEvent] = useState({ name: '', description: '', event_date: '', location: '', cover_image: null });
  const [isCreating, setIsCreating] = useState(false);
  const [stats, setStats] = useState({ totalEvents: 0, totalPhotos: 0, totalFaces: 0 });

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [analytics, setAnalytics] = useState(null);

  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const { t } = useLanguage();

  useEffect(() => { 
    checkAuthAndFetchData(); 
  }, []);

  async function checkAuthAndFetchData() {
    try {
      const authRes = await fetch('/api/admin/check');
      const authData = await authRes.json();
      
      if (!authData.isAdmin) {
        router.push('/admin');
        return;
      }
      
      setIsCheckingAuth(false);
      await fetchData();
    } catch (error) {
      console.error('Auth check error:', error);
      router.push('/admin');
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth', { method: 'DELETE' });
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  async function fetchData() {
    try {
      const [eventsRes, statsRes, analyticsRes] = await Promise.all([
        fetch('/api/events'),
        fetch('/api/admin/stats'),
        fetch('/api/admin/analytics'),
      ]);
      const data = await eventsRes.json();
      setEvents(data.events || []);
      const totalPhotos = (data.events || []).reduce((s, e) => s + (e.photo_count || 0), 0);
      
      let totalFaces = 0;
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        totalFaces = statsData.totalFaces || 0;
      }
      
      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        setAnalytics(analyticsData);
      }
      
      setStats({ totalEvents: data.events?.length || 0, totalPhotos, totalFaces });
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  }

  async function createEvent(e) {
    e.preventDefault();
    setIsCreating(true);
    try {
      const formData = new FormData();
      formData.append('name', newEvent.name);
      formData.append('description', newEvent.description);
      formData.append('event_date', newEvent.event_date);
      formData.append('location', newEvent.location);
      if (newEvent.cover_image) {
        formData.append('cover_image', newEvent.cover_image);
      }

      const res = await fetch('/api/events', { method: 'POST', body: formData });
      if (res.ok) { setShowModal(false); setNewEvent({ name: '', description: '', event_date: '', location: '', cover_image: null }); fetchData(); }
    } catch (err) { console.error(err); }
    finally { setIsCreating(false); }
  }

  function openEditModal(ev) {
    setEventToEdit({ ...ev, cover_image: null });
    setEditModalOpen(true);
  }

  async function updateEvent(e) {
    e.preventDefault();
    if (!eventToEdit) return;
    setIsEditing(true);
    try {
      const formData = new FormData();
      formData.append('name', eventToEdit.name);
      formData.append('description', eventToEdit.description || '');
      formData.append('event_date', eventToEdit.event_date);
      formData.append('location', eventToEdit.location || '');
      if (eventToEdit.cover_image instanceof File) {
        formData.append('cover_image', eventToEdit.cover_image);
      }

      const res = await fetch(`/api/events/${eventToEdit.id}`, { method: 'PUT', body: formData });
      if (res.ok) {
        setEditModalOpen(false);
        setEventToEdit(null);
        fetchData();
      } else {
        alert(t('common.error'));
      }
    } catch (err) {
      console.error(err);
      alert(t('common.error'));
    } finally {
      setIsEditing(false);
    }
  }

  function confirmDelete(id) {
    setEventToDelete(id);
    setDeleteModalOpen(true);
  }

  async function executeDelete() {
    if (!eventToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/events/${eventToDelete}`, { method: 'DELETE' });
      if (res.ok) {
        setDeleteModalOpen(false);
        setEventToDelete(null);
        fetchData();
      } else {
        alert(t('common.error'));
      }
    } catch (err) {
      console.error(err);
      alert(t('common.error'));
    } finally {
      setIsDeleting(false);
    }
  }

  if (isCheckingAuth || isLoading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner text={t('admin.loading')} size="lg" /></div>;

  const statCards = [
    { icon: HiCollection, label: t('admin.events'), value: stats.totalEvents, color: 'from-indigo-500 to-blue-500' },
    { icon: HiPhotograph, label: t('admin.photos'), value: stats.totalPhotos, color: 'from-violet-500 to-purple-500' },
    { icon: BsPersonBoundingBox, label: t('admin.faces'), value: stats.totalFaces, color: 'from-cyan-500 to-teal-500' },
  ];

  const analyticsCards = analytics ? [
    { icon: HiSearch, label: t('admin.totalSearches'), value: analytics.totalSearches, color: 'from-blue-500 to-indigo-500' },
    { icon: HiCheckCircle, label: t('admin.successRate'), value: `${analytics.successRate}%`, color: 'from-green-500 to-emerald-500' },
    { icon: HiTrendingUp, label: t('admin.avgMatches'), value: analytics.avgMatches, color: 'from-amber-500 to-orange-500' },
    { icon: HiClock, label: t('admin.avgTime'), value: `${(analytics.avgDuration / 1000).toFixed(1)}s`, color: 'from-rose-500 to-pink-500' },
  ] : [];

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">{t('admin.dashboard')}</h1>
            <p className="text-slate-400 mt-1">{t('admin.dashboardDesc')}</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-xl text-sm font-medium text-white shadow-lg shadow-indigo-500/25 transition-all">
              <HiPlus /> {t('admin.createEvent')}
            </button>
            <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 transition-colors">
              <HiLogout /> {t('admin.logout')}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {statCards.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-card p-5">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow-lg`}><s.icon className="text-xl text-white" /></div>
                <div><p className="text-2xl font-bold text-white">{s.value}</p><p className="text-sm text-slate-400">{s.label}</p></div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Search Analytics */}
        {analytics && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <HiSearch className="text-indigo-400" /> {t('admin.searchAnalytics')}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {analyticsCards.map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.1 }} className="glass-card p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center shadow-lg`}><s.icon className="text-lg text-white" /></div>
                    <div><p className="text-xl font-bold text-white">{s.value}</p><p className="text-xs text-slate-400">{s.label}</p></div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Recent searches log */}
            {analytics.recentSearches && analytics.recentSearches.length > 0 && (
              <div className="mt-4 glass-card overflow-hidden">
                <div className="overflow-x-auto max-h-48 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-white/5">
                      <th className="text-left px-4 py-2 text-xs font-medium text-slate-400">#</th>
                      <th className="text-left px-4 py-2 text-xs font-medium text-slate-400">{t('admin.date')}</th>
                      <th className="text-center px-4 py-2 text-xs font-medium text-slate-400">Status</th>
                      <th className="text-center px-4 py-2 text-xs font-medium text-slate-400">Matches</th>
                      <th className="text-right px-4 py-2 text-xs font-medium text-slate-400">Time</th>
                    </tr></thead>
                    <tbody>
                      {analytics.recentSearches.map((s, i) => (
                        <tr key={s.id} className="border-b border-white/5">
                          <td className="px-4 py-2 text-slate-500">{i + 1}</td>
                          <td className="px-4 py-2 text-slate-300">{new Date(s.created_at).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}</td>
                          <td className="px-4 py-2 text-center">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${s.success ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                              {s.success ? '✓' : '✗'}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-center text-white font-medium">{s.match_count}</td>
                          <td className="px-4 py-2 text-right text-slate-400">{(s.duration_ms / 1000).toFixed(1)}s</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Events Table */}
        <div className="glass-card overflow-hidden">
          <div className="p-5 border-b border-white/5"><h2 className="text-lg font-semibold text-white">{t('admin.eventList')}</h2></div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-white/5">
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-400 uppercase">{t('admin.eventName')}</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-400 uppercase">{t('admin.date')}</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-400 uppercase">{t('admin.photos')}</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-slate-400 uppercase">{t('admin.manage')}</th>
              </tr></thead>
              <tbody>
                {events.length === 0 ? (
                  <tr><td colSpan={4} className="px-5 py-12 text-center text-slate-500">{t('admin.noEvents')}</td></tr>
                ) : events.map((ev) => (
                  <tr key={ev.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4"><p className="text-white font-medium">{ev.name}</p>{ev.location && <p className="text-xs text-slate-500">{ev.location}</p>}</td>
                    <td className="px-5 py-4 text-sm text-slate-400">{formatDate(ev.event_date)}</td>
                    <td className="px-5 py-4"><span className="inline-flex items-center gap-1.5 bg-slate-800 rounded-full px-3 py-1 text-xs"><HiPhotograph className="text-indigo-400" />{ev.photo_count || 0}</span></td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/upload?event=${ev.id}`} className="p-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 rounded-lg transition-colors" title={t('admin.uploadPhotos')}><HiUpload /></Link>
                        <Link href={`/event/${ev.id}`} className="p-2 bg-slate-700/50 text-slate-400 hover:bg-slate-600/50 rounded-lg transition-colors" title={t('admin.view')}><HiEye /></Link>
                        <button onClick={() => openEditModal(ev)} className="p-2 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 rounded-lg transition-colors" title={t('admin.edit')}><HiPencil /></button>
                        <button onClick={() => confirmDelete(ev.id)} className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors" title={t('admin.delete')}><HiTrash /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Event Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-white mb-6">{t('admin.createNew')}</h3>
            <form onSubmit={createEvent} className="space-y-4">
              <div><label className="block text-sm font-medium text-slate-300 mb-1.5">{t('admin.eventNameLabel')}</label><input type="text" value={newEvent.name} onChange={(e) => setNewEvent(p => ({...p, name: e.target.value}))} className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500" required /></div>
              <div><label className="block text-sm font-medium text-slate-300 mb-1.5">{t('admin.descriptionLabel')}</label><textarea value={newEvent.description} onChange={(e) => setNewEvent(p => ({...p, description: e.target.value}))} rows={2} className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-slate-300 mb-1.5">{t('admin.dateLabel')}</label><input type="date" value={newEvent.event_date} onChange={(e) => setNewEvent(p => ({...p, event_date: e.target.value}))} className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500" required /></div>
                <div><label className="block text-sm font-medium text-slate-300 mb-1.5">{t('admin.locationLabel')}</label><input type="text" value={newEvent.location} onChange={(e) => setNewEvent(p => ({...p, location: e.target.value}))} className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500" /></div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">{t('admin.coverLabel')}</label>
                <input type="file" accept="image/*" onChange={(e) => setNewEvent(p => ({...p, cover_image: e.target.files[0]}))} className="w-full px-4 py-2 bg-slate-800/50 border border-white/10 rounded-xl text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-500/20 file:text-indigo-400 hover:file:bg-indigo-500/30" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-xl text-sm font-medium text-white transition-colors">{t('common.cancel')}</button>
                <button type="submit" disabled={isCreating} className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl text-sm font-medium text-white shadow-lg shadow-indigo-500/25 disabled:opacity-50">{isCreating ? t('admin.creating') : t('admin.create')}</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Edit Event Modal */}
      {editModalOpen && eventToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-white mb-6">{t('admin.editEvent')}</h3>
            <form onSubmit={updateEvent} className="space-y-4">
              <div><label className="block text-sm font-medium text-slate-300 mb-1.5">{t('admin.eventNameLabel')}</label><input type="text" value={eventToEdit.name} onChange={(e) => setEventToEdit(p => ({...p, name: e.target.value}))} className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500" required /></div>
              <div><label className="block text-sm font-medium text-slate-300 mb-1.5">{t('admin.descriptionLabel')}</label><textarea value={eventToEdit.description || ''} onChange={(e) => setEventToEdit(p => ({...p, description: e.target.value}))} rows={2} className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-slate-300 mb-1.5">{t('admin.dateLabel')}</label><input type="date" value={eventToEdit.event_date} onChange={(e) => setEventToEdit(p => ({...p, event_date: e.target.value}))} className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500" required /></div>
                <div><label className="block text-sm font-medium text-slate-300 mb-1.5">{t('admin.locationLabel')}</label><input type="text" value={eventToEdit.location || ''} onChange={(e) => setEventToEdit(p => ({...p, location: e.target.value}))} className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500" /></div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">{t('admin.coverLabelEdit')}</label>
                <input type="file" accept="image/*" onChange={(e) => setEventToEdit(p => ({...p, cover_image: e.target.files[0]}))} className="w-full px-4 py-2 bg-slate-800/50 border border-white/10 rounded-xl text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-500/20 file:text-indigo-400 hover:file:bg-indigo-500/30" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setEditModalOpen(false); setEventToEdit(null); }} className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-xl text-sm font-medium text-white transition-colors">{t('common.cancel')}</button>
                <button type="submit" disabled={isEditing} className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl text-sm font-medium text-white shadow-lg shadow-orange-500/25 disabled:opacity-50">{isEditing ? t('admin.saving') : t('admin.save')}</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
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
              <h3 className="text-2xl font-bold text-white mb-2">{t('admin.deleteEvent')}</h3>
              <p className="text-slate-400 mb-8">
                {t('admin.deleteEventDesc')} <br/>
                <span className="text-red-400 font-medium">{t('admin.deleteEventWarning')}</span>
              </p>
              
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => { setDeleteModalOpen(false); setEventToDelete(null); }} 
                  disabled={isDeleting}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-xl font-medium text-white transition-colors disabled:opacity-50"
                >
                  {t('common.cancel')}
                </button>
                <button 
                  onClick={executeDelete} 
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
    </div>
  );
}
