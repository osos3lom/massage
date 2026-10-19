// Every photo on the landing page, in one place. IMAGE_PROMPTS.md has a generation prompt for each key.

import { asset } from '@/i18n/config';

export const SITE_IMAGES = {
  hero: asset('/images/hero.jpg'),
  about: {
    main: asset('/images/about-main.jpg'),
    detail: asset('/images/about-detail.jpg'),
  },
  services: {
    'msg-60': asset('/images/service-massage-60.jpg'),
    'msg-45': asset('/images/service-massage-45.jpg'),
    bath: asset('/images/service-moroccan-bath.jpg'),
    pedicure: asset('/images/service-pedicure.jpg'),
  },
  gallery: {
    'gal-rooms': asset('/images/gallery-massage-room.jpg'),
    'gal-bath': asset('/images/gallery-moroccan-bath.jpg'),
    'gal-bath-essentials': asset('/images/gallery-bath-essentials.jpg'),
    'gal-pedicure': asset('/images/gallery-pedicure.jpg'),
    'gal-lounge': asset('/images/gallery-lounge.jpg'),
    'gal-reception': asset('/images/gallery-reception.jpg'),
  },
  instagram: [
    asset('/images/insta-1.jpg'),
    asset('/images/insta-2.jpg'),
    asset('/images/insta-3.jpg'),
    asset('/images/insta-4.jpg'),
    asset('/images/insta-5.jpg'),
    asset('/images/insta-6.jpg'),
  ],
} as const;

