'use client';

import { useState } from 'react';
import { Send, ArrowUp } from 'lucide-react';
import Image from 'next/image';
import { useLanguage } from '@/i18n/LanguageProvider';
import { SITE_IMAGES } from '@/data/siteImages';
import { asset } from '@/i18n/config';

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

const instagramPhotos = SITE_IMAGES.instagram;

const footerLinks = ['about', 'services', 'packages', 'gallery', 'faq'] as const;

export default function Footer() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
    setEmail('');
  };

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-aura-text text-[#EFEBE6] pt-20 pb-10 relative overflow-hidden">
      {/* Decorative Line divider */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 pb-16 border-b border-[#EFEBE6]/10">
        
        {/* Col 1: Brand & Bio */}
        <div className="lg:col-span-4 space-y-6">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              handleScrollToTop();
            }}
            aria-label={t.brand.name}
            className="inline-block bg-aura-bg rounded-[20px] p-4 hover:opacity-90 transition-opacity"
          >
            <Image
              src={asset('/logo.png')}
              alt={t.brand.name}
              width={600}
              height={520}
              className="w-36 h-auto"
            />
          </a>
          <p className="text-xs text-[#FCFAF8]/70 leading-relaxed font-light">
            {t.footer.bio}
          </p>
          {/* Social Icons desaturated */}
          <div className="flex items-center space-x-3 pt-2">
            <a
              href="#"
              className="p-2.5 rounded-full bg-white/5 hover:bg-aura-accent hover:text-white transition-colors duration-300 border border-white/5"
              aria-label="Instagram Link"
            >
              <InstagramIcon className="w-4 h-4" />
            </a>
            <a
              href="#"
              className="p-2.5 rounded-full bg-white/5 hover:bg-aura-accent hover:text-white transition-colors duration-300 border border-white/5"
              aria-label="Facebook Link"
            >
              <FacebookIcon className="w-4 h-4" />
            </a>
            <a
              href="#"
              className="p-2.5 rounded-full bg-white/5 hover:bg-aura-accent hover:text-white transition-colors duration-300 border border-white/5"
              aria-label="Twitter Link"
            >
              <TwitterIcon className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Col 2: Quick Links */}
        <div className="lg:col-span-2 space-y-6">
          <h4 className="font-serif text-base tracking-wider text-white">{t.footer.quickLinks}</h4>
          <ul className="space-y-3 text-xs text-[#FCFAF8]/70 font-light">
            {footerLinks.map((key) => (
              <li key={key}>
                <a href={`#${key}`} onClick={(e) => handleNavClick(e, `#${key}`)} className="hover:text-aura-primary transition-colors">
                  {t.footer.links[key]}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Col 3: Newsletter SignUp */}
        <div className="lg:col-span-3 space-y-6">
          <h4 className="font-serif text-base tracking-wider text-white font-medium">{t.footer.newsletterTitle}</h4>
          <p className="text-xs text-[#FCFAF8]/70 leading-relaxed font-light">
            {t.footer.newsletterText}
          </p>

          <form onSubmit={handleSubscribe} className="space-y-3">
            {subscribed ? (
              <p className="text-xs text-green-400 font-medium">{t.footer.subscribed}</p>
            ) : (
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.footer.emailPlaceholder}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs outline-none focus:border-aura-accent focus:bg-white/10 transition-all pe-12 text-[#EFEBE6]"
                  required
                />
                <button
                  type="submit"
                  className="absolute end-2 top-1/2 -translate-y-1/2 p-2 text-aura-accent hover:text-white transition-colors"
                  aria-label={t.footer.subscribe}
                >
                  <Send className="w-3.5 h-3.5 rtl:-scale-x-100" />
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Col 4: Instagram Feed grid */}
        <div className="lg:col-span-3 space-y-6">
          <h4 className="font-serif text-base tracking-wider text-white">{t.footer.instagram}</h4>
          <div className="grid grid-cols-3 gap-2">
            {instagramPhotos.map((photo, idx) => (
              <a
                key={idx}
                href="#"
                className="relative aspect-square rounded-lg overflow-hidden group border border-white/5 bg-[#EFEBE6]/5 block"
              >
                <div className="absolute inset-0 bg-aura-accent/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"></div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo}
                  alt={`${t.footer.instagramAlt} ${idx + 1}`}
                  className="w-full h-full object-cover desaturate-[50%] contrast-[95%] group-hover:scale-105 group-hover:desaturate-0 transition-all duration-500 brightness-[1.03] saturate-[1.04] contrast-[1.02]"
                />
              </a>
            ))}
          </div>
        </div>

      </div>

      {/* Bottom bar */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 pt-8 flex flex-col md:flex-row items-center justify-between text-[11px] text-[#FCFAF8]/50 font-light gap-4">
        <p>© {new Date().getFullYear()} {t.brand.name}. {t.footer.rights}</p>
        <div className="flex items-center space-x-6">
          <a href="#" className="hover:text-white transition-colors">{t.footer.privacy}</a>
          <a href="#" className="hover:text-white transition-colors">{t.footer.terms}</a>
          {/* Scroll to Top circular button */}
          <button
            onClick={handleScrollToTop}
            className="p-2 rounded-full bg-white/5 hover:bg-aura-accent hover:text-white border border-white/10 transition-colors flex items-center justify-center cursor-pointer"
            aria-label={t.footer.toTop}
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </footer>
  );
}
