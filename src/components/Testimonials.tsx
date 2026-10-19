'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Star, Quote } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageProvider';

export default function Testimonials() {
  const { t, data } = useLanguage();
  const { TESTIMONIALS_DATA } = data;
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(0); // -1 for left, 1 for right
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const stopAutoplay = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, []);

  const startAutoplay = useCallback(() => {
    stopAutoplay();
    timerRef.current = setInterval(() => {
      setDirection(1);
      setActiveIndex((prev) => (prev === TESTIMONIALS_DATA.length - 1 ? 0 : prev + 1));
    }, 6000);
  }, [TESTIMONIALS_DATA.length, stopAutoplay]);

  useEffect(() => {
    startAutoplay();
    return () => stopAutoplay();
  }, [activeIndex, startAutoplay, stopAutoplay]); // Reset timer on slide change to avoid quick double jumps

  const handlePrev = () => {
    setDirection(-1);
    setActiveIndex((prev) => (prev === 0 ? TESTIMONIALS_DATA.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setDirection(1);
    setActiveIndex((prev) => (prev === TESTIMONIALS_DATA.length - 1 ? 0 : prev + 1));
  };

  const handleDotClick = (index: number) => {
    setDirection(index > activeIndex ? 1 : -1);
    setActiveIndex(index);
  };

  // Slider animation variants
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 100 : -100,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: 'easeInOut' as const },
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -100 : 100,
      opacity: 0,
      transition: { duration: 0.5, ease: 'easeInOut' as const },
    }),
  };

  return (
    <section className="py-28 bg-aura-bg relative overflow-hidden">
      {/* Decorative Zen circular background */}
      <div className="absolute -left-20 top-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-aura-primary rounded-full opacity-35 pointer-events-none z-0"></div>

      <div className="max-w-4xl mx-auto px-6 md:px-12 relative z-10 flex flex-col items-center">
        
        {/* Header Block */}
        <div className="text-center mb-12 flex flex-col items-center">
          <span className="text-xs font-semibold tracking-[0.2em] text-aura-accent uppercase mb-2">{t.testimonials.eyebrow}</span>
          <h2 className="text-3xl md:text-4xl font-serif text-aura-text">
            {t.testimonials.title}
          </h2>
          <div className="h-[2px] w-12 bg-aura-accent my-4"></div>
        </div>

        {/* Testimonial Active Slide Container */}
        <div
          onMouseEnter={stopAutoplay}
          onMouseLeave={startAutoplay}
          className="relative w-full min-h-[300px] md:min-h-[260px] bg-white rounded-[20px] border border-aura-border p-8 md:p-12 shadow-premium flex flex-col justify-between overflow-hidden transition-all duration-300 hover:shadow-premium-hover hover:-translate-y-0.5"
        >
          {/* Quote mark decorator */}
          <div className="absolute end-8 top-8 text-aura-primary/30 pointer-events-none">
            <Quote className="w-16 h-16 transform rotate-180" />
          </div>

          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              key={activeIndex}
              className="flex flex-col md:flex-row gap-8 items-center"
            >
              {/* Initial & Rating column */}
              <div className="flex flex-col items-center space-y-4 md:border-e md:border-aura-border md:pe-8 flex-shrink-0">
                <div className="w-20 h-20 rounded-full border-2 border-aura-accent bg-aura-primary/50 text-aura-accent flex items-center justify-center font-serif text-2xl">
                  {TESTIMONIALS_DATA[activeIndex].name.charAt(0)}
                </div>
                
                {/* Review Star Rating */}
                <div className="flex items-center space-x-1">
                  {[...Array(TESTIMONIALS_DATA[activeIndex].rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-aura-accent text-aura-accent" />
                  ))}
                </div>
              </div>

              {/* Message text block */}
              <div className="flex-grow space-y-4 text-center md:text-start">
                <p className="text-sm md:text-base text-aura-text leading-relaxed font-light italic">
                  &ldquo;{TESTIMONIALS_DATA[activeIndex].review}&rdquo;
                </p>
                <div>
                  <h4 className="font-serif text-lg text-aura-text">
                    {TESTIMONIALS_DATA[activeIndex].name}
                  </h4>
                  <span className="text-[10px] uppercase tracking-wider text-aura-muted font-medium">
                    {t.testimonials.verified} • {TESTIMONIALS_DATA[activeIndex].date}
                  </span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Slide Navigation Buttons */}
          <div className="absolute end-8 bottom-8 flex space-x-2">
            <button
              onClick={handlePrev}
              className="p-2 rounded-full border border-aura-border text-aura-text hover:bg-aura-primary/50 hover:border-aura-accent/30 transition-colors"
              aria-label={t.testimonials.prev}
            >
              <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
            </button>
            <button
              onClick={handleNext}
              className="p-2 rounded-full border border-aura-border text-aura-text hover:bg-aura-primary/50 hover:border-aura-accent/30 transition-colors"
              aria-label={t.testimonials.next}
            >
              <ChevronRight className="w-4 h-4 rtl:rotate-180" />
            </button>
          </div>
        </div>

        {/* Carousel Indicators / Dots */}
        <div className="flex items-center space-x-2 mt-8 z-10">
          {TESTIMONIALS_DATA.map((_, idx) => (
            <button
              key={idx}
              onClick={() => handleDotClick(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                activeIndex === idx ? 'w-6 bg-aura-accent' : 'w-2 bg-aura-primary'
              }`}
              aria-label={`${t.testimonials.goTo} ${idx + 1}`}
            />
          ))}
        </div>

      </div>
    </section>
  );
}
