'use client';

import { motion } from 'framer-motion';
import { Check, Crown } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageProvider';
import { currencyLabel } from '@/i18n/config';

export default function Pricing() {
  const { t, data, lang } = useLanguage();
  const { PACKAGES_DATA } = data;
  const handleScrollTo = (id: string) => {
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="packages" className="py-28 bg-aura-bg-alt relative overflow-hidden">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute left-1/4 top-1/3 w-80 h-80 bg-aura-primary/30 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute right-1/4 bottom-1/3 w-80 h-80 bg-aura-primary/25 rounded-full blur-[80px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        
        {/* Header Block */}
        <div className="text-center max-w-2xl mx-auto mb-20 flex flex-col items-center">
          <span className="text-xs font-semibold tracking-[0.2em] text-aura-accent uppercase mb-2">{t.pricing.eyebrow}</span>
          <h2 className="text-3xl md:text-4xl font-serif text-aura-text">
            {t.pricing.title}
          </h2>
          <div className="h-[2px] w-12 bg-aura-accent my-4"></div>
          <p className="text-sm md:text-base text-aura-muted font-light leading-relaxed">
            {t.pricing.intro}
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 items-stretch">
          {PACKAGES_DATA.map((pkg, idx) => (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.8, delay: idx * 0.15, ease: [0.16, 1, 0.3, 1] as any }}
              key={pkg.id}
              className={`relative rounded-[20px] bg-white p-8 flex flex-col justify-between border transition-all duration-500 hover:-translate-y-1.5 ${
                pkg.isHighlighted
                  ? 'border-aura-accent border-2 shadow-premium shadow-aura-accent/15 lg:-translate-y-4 lg:hover:-translate-y-5'
                  : 'border-aura-border shadow-premium'
              }`}
            >
              {/* Highlight ribbon / tag */}
              {pkg.isHighlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-aura-accent text-white text-[10px] font-semibold tracking-[0.2em] uppercase px-4 py-1.5 rounded-full flex items-center space-x-1">
                  <Crown className="w-3.5 h-3.5" />
                  <span>{t.pricing.mostSelected}</span>
                </div>
              )}

              {/* Package Header details */}
              <div className="space-y-6">
                <div>
                  <h3 className="font-serif text-2xl text-aura-text">{pkg.name}</h3>
                  <p className="text-xs text-aura-muted font-light mt-2 min-h-[32px]">
                    {pkg.description}
                  </p>
                </div>

                <div className="flex items-baseline space-x-1">
                  <span className="font-serif text-5xl font-semibold text-aura-text">{pkg.price}</span>
                  <span className="text-sm text-aura-muted uppercase tracking-widest">{currencyLabel(lang)}</span>
                </div>

                {/* Separator line */}
                <div className="h-[1px] bg-aura-border" />

                {/* Features List */}
                <ul className="space-y-4">
                  {pkg.features.map((feature, featureIdx) => (
                    <li key={featureIdx} className="flex items-start space-x-3 text-xs text-aura-text/90 font-light">
                      <div className={`p-0.5 rounded-full mt-0.5 ${pkg.isHighlighted ? 'bg-aura-accent/15 text-aura-accent' : 'bg-aura-bg text-aura-muted'}`}>
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <span className="leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA Action button */}
              <div className="mt-8 pt-6 border-t border-aura-border">
                <button
                  onClick={() => handleScrollTo('contact')}
                  className={`w-full py-4 text-xs font-semibold tracking-widest uppercase rounded-full transition-all duration-300 hover:-translate-y-0.5 cursor-pointer ${
                    pkg.isHighlighted
                      ? 'bg-aura-accent text-white shadow-md shadow-aura-accent/20 hover:bg-aura-accent-hover hover:shadow-lg'
                      : 'bg-white hover:bg-aura-primary/30 text-aura-accent border border-aura-accent/25 hover:border-aura-accent shadow-sm'
                  }`}
                >
                  {t.pricing.join}
                </button>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
