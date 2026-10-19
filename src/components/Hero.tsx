'use client';

import { motion } from 'framer-motion';
import { Calendar, Compass, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageProvider';
import { SITE_IMAGES } from '@/data/siteImages';

export default function Hero() {
  const { t, data } = useLanguage();
  const handleScrollTo = (id: string) => {
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleQuickBook = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const category = formData.get('quick-category') as string;
    const date = formData.get('quick-date') as string;

    // Save selection to dispatch custom event or write to global event/session state
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('quick-booking-select', {
          detail: { category, date },
        })
      );
    }

    handleScrollTo('contact');
  };

  return (
    <section className="relative min-h-[95vh] flex items-center justify-center pt-24 pb-12 overflow-hidden bg-aura-bg bg-aura-glow">
      {/* Background Zen Pattern Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#F8E7E9_1.5px,transparent_1.5px)] [background-size:24px_24px] opacity-30 z-0"></div>

      {/* Hero Visual Container */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
        
        {/* Text Content Block */}
        <div className="lg:col-span-7 flex flex-col items-start text-start space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }}
            className="inline-flex items-center space-x-2 bg-aura-primary/50 border border-aura-primary px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-[0.2em] text-aura-accent"
          >
            <span>{t.hero.badge}</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] as const }}
            className="text-5xl md:text-6xl lg:text-7xl font-serif text-aura-text leading-[1.1]"
          >
            {t.hero.line1}<br />
            {t.hero.line2}<br />
            <span className="text-aura-metallic font-light italic pe-2">{t.hero.line3}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] as const }}
            className="text-base md:text-lg text-aura-muted max-w-xl font-light leading-relaxed"
          >
            {t.hero.intro}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] as const }}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto"
          >
            <button
              onClick={() => handleScrollTo('contact')}
              className="inline-flex items-center justify-center px-8 py-4 bg-aura-accent bg-aura-gradient text-white font-semibold tracking-widest uppercase rounded-full shadow-md shadow-aura-accent/20 hover:bg-aura-gradient-hover hover:shadow-lg hover:shadow-aura-accent/30 hover:-translate-y-0.5 transition-all duration-300 group"
            >
              <span>{t.hero.bookAppointment}</span>
              <ArrowRight className="w-4 h-4 ms-2 rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => handleScrollTo('services')}
              className="inline-flex items-center justify-center px-8 py-4 border border-aura-accent/40 text-aura-text font-semibold tracking-widest uppercase rounded-full hover:border-aura-accent hover:bg-white hover:-translate-y-0.5 transition-all duration-300"
            >
              {t.hero.explore}
            </button>
          </motion.div>
        </div>

        {/* Image & Floating Interactive Booking Card */}
        <div className="lg:col-span-5 relative w-full flex flex-col items-center">
          {/* Main Visual Image Wrapper */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] as const }}
            className="relative w-full aspect-[4/5] rounded-[20px] overflow-hidden shadow-premium z-10 border-4 border-white"
          >
            <div className="absolute inset-0 bg-black/5 z-10"></div>
            {/* Smooth Zoom Image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={SITE_IMAGES.hero}
              alt={t.hero.imageAlt}
              className="absolute inset-0 w-full h-full object-cover animate-image-zoom brightness-[1.03] saturate-[1.04] contrast-[1.02]"
            />
          </motion.div>

          {/* Floating Appointment Card */}
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4, type: 'spring', damping: 20 }}
            className="absolute -bottom-8 lg:-left-12 rtl:lg:left-auto rtl:lg:-right-12 left-1/2 -translate-x-1/2 lg:translate-x-0 z-20 w-[90%] sm:w-[80%] lg:w-[110%] bg-white p-6 rounded-[20px] shadow-premium border border-aura-border transition-all duration-300 hover:-translate-y-1 hover:shadow-premium-hover"
          >
            <form onSubmit={handleQuickBook} className="flex flex-col space-y-4">
              <div className="flex items-center space-x-3 border-b border-aura-border pb-3">
                <div className="p-2 rounded-full bg-aura-primary/50 text-aura-accent">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-base text-aura-text">{t.hero.quickTitle}</h3>
                  <p className="text-[10px] uppercase tracking-wider text-aura-muted">{t.hero.quickSubtitle}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Category Selection */}
                <div className="flex flex-col space-y-1.5">
                  <label htmlFor="quick-category" className="text-[10px] font-semibold tracking-wider text-aura-muted uppercase">{t.hero.treatmentType}</label>
                  <select
                    id="quick-category"
                    name="quick-category"
                    className="w-full bg-aura-bg/50 border border-aura-border rounded-lg px-3 py-2 text-xs text-aura-text outline-none focus:border-aura-accent focus:bg-white transition-all cursor-pointer"
                  >
                    <option value="">{t.hero.anyCategory}</option>
                    {data.SERVICES_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Input */}
                <div className="flex flex-col space-y-1.5">
                  <label htmlFor="quick-date" className="text-[10px] font-semibold tracking-wider text-aura-muted uppercase">{t.hero.preferredDate}</label>
                  <div className="relative">
                    <input
                      id="quick-date"
                      type="date"
                      name="quick-date"
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full bg-aura-bg/50 border border-aura-border rounded-lg px-3 py-2 text-xs text-aura-text outline-none focus:border-aura-accent focus:bg-white transition-all cursor-pointer"
                    />
                    <Calendar className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-aura-muted pointer-events-none" />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-aura-text text-white font-semibold text-xs tracking-widest uppercase rounded-lg hover:bg-aura-espresso transition-colors shadow-sm"
              >
                {t.hero.checkAvailability}
              </button>
            </form>
          </motion.div>
        </div>

      </div>
    </section>
  );
}
