'use client';

import { motion } from 'framer-motion';
import { useLanguage } from '@/i18n/LanguageProvider';

const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    width="16"
    height="16"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    width="16"
    height="16"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const TwitterIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    width="16"
    height="16"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

export default function Specialists() {
  const { t, data } = useLanguage();
  const { SPECIALISTS_DATA } = data;
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as any },
    },
  };

  return (
    <section id="specialists" className="py-28 bg-aura-bg relative">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        
        {/* Header Block */}
        <div className="text-center max-w-2xl mx-auto mb-20 flex flex-col items-center">
          <span className="text-xs font-semibold tracking-[0.2em] text-aura-accent uppercase mb-2">{t.specialists.eyebrow}</span>
          <h2 className="text-3xl md:text-4xl font-serif text-aura-text">
            {t.specialists.title}
          </h2>
          <div className="h-[2px] w-12 bg-aura-accent my-4"></div>
          <p className="text-sm md:text-base text-aura-muted font-light leading-relaxed">
            {t.specialists.intro}
          </p>
        </div>

        {/* Specialists Cards Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {SPECIALISTS_DATA.map((specialist) => (
            <motion.div
              variants={cardVariants}
              key={specialist.id}
              className="bg-white rounded-[20px] overflow-hidden border border-aura-border group shadow-premium hover:-translate-y-1 hover:shadow-premium-hover transition-all duration-300"
            >
              {/* Specialist Meta details */}
              <div className="p-8 text-center space-y-4">
                {/* Initial badge */}
                <div className="w-16 h-16 mx-auto rounded-full bg-aura-primary/60 text-aura-accent flex items-center justify-center font-serif text-2xl group-hover:bg-aura-accent group-hover:text-white transition-colors duration-300">
                  {specialist.name.charAt(0)}
                </div>

                <div className="space-y-1">
                  <h3 className="font-serif text-xl text-aura-text">{specialist.name}</h3>
                  <p className="text-xs text-aura-accent uppercase tracking-widest font-semibold">{specialist.role}</p>
                </div>
                
                <div className="h-[1px] bg-aura-border w-1/2 mx-auto" />

                <div className="space-y-2 text-xs text-aura-muted font-light leading-relaxed">
                  <p>
                    <span className="font-semibold text-aura-text">{t.specialists.experience}</span> {specialist.experience}
                  </p>
                  <p className="px-4">
                    <span className="font-semibold text-aura-text">{t.specialists.expertise}</span> {specialist.specialization}
                  </p>
                </div>
                {/* Social links */}
                <div className="flex items-center justify-center gap-3 pt-2">
                  {specialist.socials.instagram && (
                    <a
                      href={specialist.socials.instagram}
                      className="p-2.5 rounded-full bg-aura-bg text-aura-text hover:bg-aura-accent hover:text-white transition-colors duration-300"
                      aria-label="Instagram Link"
                    >
                      <InstagramIcon className="w-4 h-4" />
                    </a>
                  )}
                  {specialist.socials.facebook && (
                    <a
                      href={specialist.socials.facebook}
                      className="p-2.5 rounded-full bg-aura-bg text-aura-text hover:bg-aura-accent hover:text-white transition-colors duration-300"
                      aria-label="Facebook Link"
                    >
                      <FacebookIcon className="w-4 h-4" />
                    </a>
                  )}
                  {specialist.socials.twitter && (
                    <a
                      href={specialist.socials.twitter}
                      className="p-2.5 rounded-full bg-aura-bg text-aura-text hover:bg-aura-accent hover:text-white transition-colors duration-300"
                      aria-label="Twitter Link"
                    >
                      <TwitterIcon className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}
