'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { HiSearch, HiPhotograph, HiSparkles, HiArrowRight } from 'react-icons/hi';
import { BsStars, BsPersonBoundingBox } from 'react-icons/bs';
import EventCard from '@/components/EventCard';
import { SkeletonCard } from '@/components/LoadingSpinner';
import { useLanguage } from '@/context/LanguageContext';

export default function HomePage() {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    try {
      const res = await fetch('/api/events');
      const data = await res.json();
      setEvents(data.events || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/15 via-indigo-500/5 to-transparent rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-violet-500/15 via-violet-500/5 to-transparent rounded-full translate-x-1/2 translate-y-1/2" />
          <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-500/10 via-transparent to-transparent rounded-full -translate-x-1/2 -translate-y-1/2" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-40">
          <div className="text-center max-w-3xl mx-auto">
            {/* Logos */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="flex items-center justify-center gap-6 mb-8"
            >
              <img src="/college-logo.png" alt="College Logo" className="h-24 w-24 sm:h-32 sm:w-32 object-cover rounded-full drop-shadow-2xl ring-4 ring-white/10" onError={(e) => e.target.style.display = 'none'} />
              <img src="/beyond-logo.png" alt="Beyond Frame" className="h-24 w-24 sm:h-32 sm:w-32 object-cover rounded-full drop-shadow-2xl ring-4 ring-white/10" onError={(e) => e.target.style.display = 'none'} />
            </motion.div>

            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 mb-6"
            >
              <BsStars className="text-indigo-400 text-sm" />
              <span className="text-indigo-300 text-sm font-medium">
                {t('home.badge')}
              </span>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-7xl font-bold leading-tight"
            >
              <span className="text-white">{t('home.title1')}</span>
              <span className="gradient-text">{t('home.title2')}</span>
              <br />
              <span className="text-white">{t('home.title3')}</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg sm:text-xl text-slate-400 mt-6 max-w-xl mx-auto leading-relaxed"
            >
              {t('home.subtitle')}
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10"
            >
              <Link
                href="/search"
                className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-2xl text-lg font-semibold text-white shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-300 hover:-translate-y-0.5"
              >
                <HiSearch className="text-xl" />
                {t('home.cta')}
                <HiArrowRight className="text-lg group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </div>

          {/* Feature cards */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-20 max-w-3xl mx-auto"
          >
            {[
              {
                icon: BsPersonBoundingBox,
                title: t('home.step1'),
                desc: t('home.step1Desc'),
              },
              {
                icon: HiSparkles,
                title: t('home.step2'),
                desc: t('home.step2Desc'),
              },
              {
                icon: HiPhotograph,
                title: t('home.step3'),
                desc: t('home.step3Desc'),
              },
            ].map((item, i) => (
              <div
                key={i}
                className="glass-card p-5 text-center hover:border-indigo-500/30 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center mx-auto mb-3">
                  <item.icon className="text-xl text-indigo-400" />
                </div>
                <h3 className="text-white font-semibold">{item.title}</h3>
                <p className="text-slate-400 text-sm mt-1">{item.desc}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Events Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              {t('home.recentEvents')}
            </h2>
            <p className="text-slate-400 mt-1">{t('home.recentEventsDesc')}</p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : events.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event, index) => (
              <EventCard key={event.id} event={event} index={index} />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 glass-card"
          >
            <HiPhotograph className="text-6xl text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">{t('home.noEvents')}</p>
            <p className="text-slate-500 text-sm mt-1">
              {t('home.noEventsDesc')}
            </p>
          </motion.div>
        )}
      </section>
    </div>
  );
}
