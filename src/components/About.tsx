'use client';

import { motion } from 'framer-motion';
import { Sparkles, Leaf, Award, ShieldCheck } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageProvider';

const stats = [
  { id: 1, number: '12+', label: 'years', icon: Award },
  { id: 2, number: '15K+', label: 'clients', icon: Sparkles },
  { id: 3, number: '20+', label: 'therapists', icon: ShieldCheck },
  { id: 4, number: '100%', label: 'organic', icon: Leaf },
] as const;

export default function About() {
  const { t } = useLanguage();
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as any },
    },
  };

  return (
    <section id="about" className="py-28 bg-aura-bg-alt relative overflow-hidden">
      {/* Subtle organic decorative background elements */}
      <div className="absolute right-0 top-1/4 w-96 h-96 bg-aura-primary/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute left-0 bottom-1/4 w-96 h-96 bg-aura-bg/60 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        
        {/* Story Section Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center mb-24">
          
          {/* Images Grid */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] as any }}
            className="lg:col-span-6 grid grid-cols-12 gap-4 relative"
          >
            {/* Primary/Main interior image */}
            <div className="col-span-8 aspect-[4/5] rounded-[20px] overflow-hidden shadow-premium border-4 border-aura-bg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&w=800&q=80"
                alt={t.about.img1Alt}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700 brightness-[1.03] saturate-[1.04] contrast-[1.02]"
              />
            </div>
            
            {/* Secondary offset image */}
            <div className="col-span-7 absolute end-0 bottom-[-2rem] aspect-square rounded-[20px] overflow-hidden shadow-premium border-8 border-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1560750588-73207b1ef5b8?auto=format&fit=crop&w=800&q=80"
                alt={t.about.img2Alt}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700 brightness-[1.03] saturate-[1.04] contrast-[1.02]"
              />
            </div>
          </motion.div>

          {/* Text Story Block */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] as any }}
            className="lg:col-span-6 flex flex-col space-y-6 lg:ps-6"
          >
            <span className="text-xs font-semibold tracking-[0.2em] text-aura-accent uppercase">{t.about.eyebrow}</span>
            <h2 className="text-3xl md:text-4xl font-serif text-aura-text leading-tight">
              {t.about.title}
            </h2>
            <div className="h-[2px] w-12 bg-aura-accent"></div>
            
            <p className="text-sm md:text-base text-aura-muted leading-relaxed font-light">
              {t.about.p1}
            </p>
            <p className="text-sm md:text-base text-aura-muted leading-relaxed font-light">
              {t.about.p2}
            </p>

            {/* Mission Quote block */}
            <div className="border-s-4 border-aura-primary ps-4 py-2 my-2 bg-aura-bg/30 rounded-e-lg">
              <p className="font-serif italic text-base text-aura-text/95">
                &ldquo;{t.about.quote}&rdquo;
              </p>
              <p className="text-[10px] tracking-widest uppercase font-semibold text-aura-accent mt-2">{t.about.quoteAuthor}</p>
            </div>
          </motion.div>

        </div>

        {/* Stats metrics row */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-16 border-t border-aura-border"
        >
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <motion.div
                variants={itemVariants}
                key={stat.id}
                className="flex flex-col items-center text-center p-6 bg-white rounded-[20px] border border-aura-border shadow-premium hover:-translate-y-1 hover:shadow-premium-hover transition-all duration-300 group"
              >
                <div className="p-3 bg-white rounded-full text-aura-accent shadow-sm group-hover:bg-aura-primary/50 transition-colors mb-4">
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-3xl md:text-4xl font-serif text-aura-text font-semibold mb-1">
                  {stat.number}
                </span>
                <span className="text-[11px] uppercase tracking-wider text-aura-muted font-medium">
                  {t.about.stats[stat.label]}
                </span>
              </motion.div>
            );
          })}
        </motion.div>

      </div>
    </section>
  );
}
