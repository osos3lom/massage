'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageProvider';

export default function FAQ() {
  const { t, data } = useLanguage();
  const { FAQ_DATA } = data;
  const [openId, setOpenId] = useState<string | null>('faq-1'); // Keep first item open by default

  const toggleFAQ = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <section id="faq" className="py-28 bg-aura-bg-alt relative">
      <div className="max-w-4xl mx-auto px-6 md:px-12">
        
        {/* Header Block */}
        <div className="text-center max-w-2xl mx-auto mb-16 flex flex-col items-center">
          <span className="text-xs font-semibold tracking-[0.2em] text-aura-accent uppercase mb-2">{t.faq.eyebrow}</span>
          <h2 className="text-3xl md:text-4xl font-serif text-aura-text">
            {t.faq.title}
          </h2>
          <div className="h-[2px] w-12 bg-aura-accent my-4"></div>
          <p className="text-sm md:text-base text-aura-muted font-light leading-relaxed">
            {t.faq.intro}
          </p>
        </div>

        {/* FAQ Accordions List */}
        <div className="space-y-4">
          {FAQ_DATA.map((faq) => {
            const isOpen = openId === faq.id;
            return (
              <div
                key={faq.id}
                className={`border rounded-[20px] overflow-hidden bg-white transition-all duration-300 shadow-premium ${
                  isOpen ? 'border-aura-accent bg-white' : 'border-aura-border hover:border-aura-accent/30'
                }`}
              >
                {/* Header/Trigger Accordion */}
                <button
                  onClick={() => toggleFAQ(faq.id)}
                  className="w-full flex items-center justify-between p-6 text-start focus:outline-none cursor-pointer"
                >
                  <span className="font-serif text-base md:text-lg text-aura-text pe-4 leading-snug">
                    {faq.question}
                  </span>
                  
                  {/* +/- toggle icon */}
                  <div className={`p-1.5 rounded-full flex-shrink-0 transition-colors ${isOpen ? 'bg-aura-accent text-white' : 'bg-aura-bg text-aura-muted'}`}>
                    {isOpen ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  </div>
                </button>

                {/* Collapsible Content wrapper */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                      <div className="px-6 pb-6 pt-0 border-t border-aura-border/40 text-xs md:text-sm text-aura-muted font-light leading-relaxed">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
