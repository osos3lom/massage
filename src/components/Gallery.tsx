'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageProvider';

const categories = ['all', 'interior', 'spa', 'hair', 'skin', 'nails'] as const;

export default function Gallery() {
  const { t, data, dir } = useLanguage();
  const { GALLERY_DATA } = data;
  const [activeFilter, setActiveFilter] = useState('all');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const filteredItems = GALLERY_DATA.filter(
    (item) => activeFilter === 'all' || item.category === activeFilter
  );

  const handlePrev = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (lightboxIndex !== null) {
      setLightboxIndex((prev) =>
        prev === 0 ? filteredItems.length - 1 : (prev ?? 0) - 1
      );
    }
  }, [lightboxIndex, filteredItems.length]);

  const handleNext = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (lightboxIndex !== null) {
      setLightboxIndex((prev) =>
        prev === filteredItems.length - 1 ? 0 : (prev ?? 0) + 1
      );
    }
  }, [lightboxIndex, filteredItems.length]);

  // Keyboard navigation for Lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === 'Escape') setLightboxIndex(null);
      // In RTL the "previous" image sits on the right
      if (e.key === 'ArrowLeft') (dir === 'rtl' ? handleNext : handlePrev)();
      if (e.key === 'ArrowRight') (dir === 'rtl' ? handlePrev : handleNext)();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, handlePrev, handleNext, dir]);

  return (
    <section id="gallery" className="py-28 bg-aura-bg-alt relative">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        
        {/* Header Block */}
        <div className="text-center max-w-2xl mx-auto mb-16 flex flex-col items-center">
          <span className="text-xs font-semibold tracking-[0.2em] text-aura-accent uppercase mb-2">{t.gallery.eyebrow}</span>
          <h2 className="text-3xl md:text-4xl font-serif text-aura-text">
            {t.gallery.title}
          </h2>
          <div className="h-[2px] w-12 bg-aura-accent my-4"></div>
          <p className="text-sm md:text-base text-aura-muted font-light leading-relaxed">
            {t.gallery.intro}
          </p>
        </div>

        {/* Gallery Categories Tab Filter */}
        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 mb-12">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setActiveFilter(cat);
                setLightboxIndex(null); // Reset lightbox to avoid index misalignment when switching filter
              }}
              className={`px-4 py-2 rounded-full text-xs font-medium uppercase tracking-widest transition-all duration-300 ${
                activeFilter === cat
                  ? 'bg-aura-accent text-white shadow-sm'
                  : 'bg-aura-bg border border-aura-border text-aura-text hover:border-aura-accent/30'
              }`}
            >
              {t.gallery.categories[cat]}
            </button>
          ))}
        </div>

        {/* Masonry CSS Column Layout Grid */}
        <motion.div
          layout
          className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item, idx) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
                key={item.id}
                onClick={() => setLightboxIndex(idx)}
                className="break-inside-avoid relative rounded-[20px] overflow-hidden shadow-premium border border-aura-border group cursor-pointer aspect-auto mb-6 block hover:-translate-y-1 hover:shadow-premium-hover transition-all duration-300"
              >
                {/* Image element */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700 block brightness-[1.03] saturate-[1.04] contrast-[1.02]"
                />

                {/* Cover Overlay detailing item info and click search/zoom CTA */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6 z-10">
                  <div className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white absolute top-4 end-4 shadow-sm hover:scale-105 transition-transform">
                    <ZoomIn className="w-4 h-4" />
                  </div>
                  <div className="space-y-1 text-white">
                    <p className="text-[9px] uppercase tracking-widest font-semibold text-white/80">{t.gallery.categories[item.category]}</p>
                    <h3 className="font-serif text-lg leading-snug">{item.title}</h3>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Lightbox Popout Overlay (Modal) */}
        <AnimatePresence>
          {lightboxIndex !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setLightboxIndex(null)}
              className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-6"
            >
              {/* Close Button */}
              <button
                onClick={() => setLightboxIndex(null)}
                className="absolute top-6 end-6 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-50"
                aria-label={t.gallery.close}
              >
                <X className="w-5 h-5" />
              </button>

              {/* Prev Slide Navigation */}
              <button
                onClick={handlePrev}
                className="absolute start-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-50 hidden sm:block"
                aria-label={t.gallery.prev}
              >
                <ChevronLeft className="w-6 h-6 rtl:rotate-180" />
              </button>

              {/* Central Lightbox Image Content */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                onClick={(e) => e.stopPropagation()} // Stop clicking image from closing lightbox
                className="relative max-w-5xl max-h-[80vh] aspect-auto flex flex-col items-center justify-center"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={filteredItems[lightboxIndex].image}
                  alt={filteredItems[lightboxIndex].title}
                  className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-2xl border border-white/10"
                />
                
                {/* Description details bar */}
                <div className="text-center mt-4 space-y-1 text-white">
                  <p className="text-xs tracking-widest text-aura-primary uppercase">
                    {t.gallery.categories[filteredItems[lightboxIndex].category]}
                  </p>
                  <h4 className="font-serif text-lg md:text-xl">
                    {filteredItems[lightboxIndex].title}
                  </h4>
                </div>
              </motion.div>

              {/* Next Slide Navigation */}
              <button
                onClick={handleNext}
                className="absolute end-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-50 hidden sm:block"
                aria-label={t.gallery.next}
              >
                <ChevronRight className="w-6 h-6 rtl:rotate-180" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </section>
  );
}
