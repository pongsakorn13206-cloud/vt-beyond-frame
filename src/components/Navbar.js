'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { HiMenu, HiX, HiSearch, HiHome, HiCog } from 'react-icons/hi';
import { useLanguage } from '@/context/LanguageContext';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { lang, toggleLanguage, t } = useLanguage();

  const navLinks = [
    { href: '/', label: t('nav.home'), icon: HiHome },
    { href: '/search', label: t('nav.search'), icon: HiSearch },
    { href: '/admin', label: t('nav.admin'), icon: HiCog },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <img src="/college-logo.png" alt="College Logo" className="h-10 w-10 object-cover rounded-full drop-shadow-md" onError={(e) => e.target.style.display = 'none'} />
            <div className="hidden sm:block w-px h-6 bg-white/20"></div>
            <img src="/beyond-logo.png" alt="Beyond Frame" className="h-10 w-10 object-cover rounded-full drop-shadow-md" onError={(e) => e.target.style.display = 'none'} />
            <span className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent ml-1 hidden md:block">
              VT BEYOND FRAME
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || 
                (link.href !== '/' && pathname.startsWith(link.href));
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-indigo-500/20 text-indigo-300 shadow-lg shadow-indigo-500/10'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="text-base" />
                  {link.label}
                </Link>
              );
            })}

            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="ml-2 flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-full text-xs font-bold transition-all duration-200"
              title={lang === 'th' ? 'Switch to English' : 'เปลี่ยนเป็นภาษาไทย'}
            >
              <span className={`transition-colors ${lang === 'th' ? 'text-indigo-400' : 'text-slate-500'}`}>TH</span>
              <span className="text-slate-600">/</span>
              <span className={`transition-colors ${lang === 'en' ? 'text-indigo-400' : 'text-slate-500'}`}>EN</span>
            </button>
          </div>

          {/* Mobile: Lang toggle + menu button */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={toggleLanguage}
              className="px-2.5 py-1.5 bg-slate-800 border border-white/10 rounded-full text-xs font-bold"
            >
              <span className={lang === 'th' ? 'text-indigo-400' : 'text-slate-500'}>TH</span>
              <span className="text-slate-600">/</span>
              <span className={lang === 'en' ? 'text-indigo-400' : 'text-slate-500'}>EN</span>
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              {isOpen ? <HiX className="text-xl" /> : <HiMenu className="text-xl" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-slate-900/95 backdrop-blur-xl border-b border-white/10 overflow-hidden"
          >
            <div className="px-4 py-3 space-y-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-indigo-500/20 text-indigo-300'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="text-lg" />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
