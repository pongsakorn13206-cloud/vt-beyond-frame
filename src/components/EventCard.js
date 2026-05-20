'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { HiPhotograph, HiCalendar } from 'react-icons/hi';
import { formatDate } from '@/lib/utils';

export default function EventCard({ event, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Link href={`/event/${event.id}`} className="group block">
        <div className="relative overflow-hidden rounded-2xl bg-slate-800/50 border border-white/5 hover:border-indigo-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1">
          {/* Cover Image */}
          <div className="relative h-48 sm:h-56 overflow-hidden">
            {event.cover_image ? (
              <img
                src={event.cover_image}
                alt={event.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-indigo-600/30 to-violet-600/30 flex items-center justify-center">
                <HiPhotograph className="text-5xl text-indigo-400/50" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
            
            {/* Photo count badge */}
            <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md rounded-full px-3 py-1 flex items-center gap-1.5">
              <HiPhotograph className="text-indigo-400 text-sm" />
              <span className="text-white text-xs font-medium">
                {event.photo_count || 0} รูป
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-5">
            <h3 className="text-lg font-semibold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
              {event.name}
            </h3>
            {event.description && (
              <p className="text-sm text-slate-400 mt-1.5 line-clamp-2">
                {event.description}
              </p>
            )}
            <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <HiCalendar className="text-indigo-400" />
                {formatDate(event.event_date)}
              </span>
              {event.location && (
                <span className="truncate">{event.location}</span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
