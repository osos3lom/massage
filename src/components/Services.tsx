'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Tag, CalendarCheck } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageProvider';
import { formatPrice } from '@/i18n/config';

export default function Services() {
  const { t, data, lang } = useLanguage();
  const { SERVICES_DATA } = data;

  const handleBookService = (serviceId: string, serviceName: string) => {
    // Save selection to dispatch a custom event that our Contact/Booking form will listen to
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('service-booking-select', {
          detail: { serviceId, serviceName },
        })
      );
    }
    // Scroll down to the contact section
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="services" className="py-24 bg-aura-bg relative">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        
        {/* Header Block */}
        <div className="text-center max-w-2xl mx-auto mb-16 flex flex-col items-center">
          <span className="text-xs font-semibold tracking-[0.2em] text-aura-accent uppercase mb-2">{t.services.eyebrow}</span>
          <h2 className="text-3xl md:text-4xl font-serif text-aura-text">
            {t.services.title}
          </h2>
          <div className="h-[2px] w-12 bg-aura-accent my-4"></div>
          <p className="text-sm md:text-base text-aura-muted font-light leading-relaxed">
            {t.services.intro}
          </p>
        </div>

        {/* Services Grid with Framer Motion AnimatePresence */}
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          <AnimatePresence mode="popLayout">
            {SERVICES_DATA.map((service) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4 }}
                key={service.id}
                className="bg-white rounded-[20px] overflow-hidden border border-aura-border flex flex-col justify-between shadow-premium hover:-translate-y-1 hover:shadow-premium-hover transition-all duration-300 group h-full"
              >
                {/* Image Container with Zoom effect */}
                <div className="relative aspect-[4/3] w-full overflow-hidden">
                  <div className="absolute inset-0 bg-black/5 group-hover:bg-black/10 transition-colors z-10"></div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={service.image}
                    alt={service.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-[1.03] saturate-[1.04] contrast-[1.02]"
                  />
                </div>

                {/* Details Container */}
                <div className="p-6 flex flex-col flex-grow justify-between space-y-6">
                  <div className="space-y-3">
                    <h3 className="font-serif text-lg text-aura-text leading-snug group-hover:text-aura-accent transition-colors">
                      {service.name}
                    </h3>
                    <p className="text-xs text-aura-muted font-light leading-relaxed line-clamp-3">
                      {service.description}
                    </p>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-aura-border">
                    {/* Duration and Pricing details */}
                    <div className="flex items-center justify-between text-xs text-aura-text/80">
                      <div className="flex items-center space-x-1.5">
                        <Clock className="w-3.5 h-3.5 text-aura-accent" />
                        <span>{service.duration}</span>
                      </div>
                      <div className="flex items-center space-x-1.5 font-medium">
                        <Tag className="w-3.5 h-3.5 text-aura-accent" />
                        <span>{formatPrice(service.price, lang)}</span>
                      </div>
                    </div>

                    {/* Book Now Button */}
                    <button
                      onClick={() => handleBookService(service.id, service.name)}
                      className="w-full py-3 bg-aura-accent text-white font-semibold text-[10px] tracking-widest uppercase rounded-full shadow-sm hover:bg-aura-accent-hover hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <CalendarCheck className="w-3.5 h-3.5" />
                      <span>{t.services.book}</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

      </div>
    </section>
  );
}
