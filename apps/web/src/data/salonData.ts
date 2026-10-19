import type { Lang } from '@/i18n/config';
import { SITE_IMAGES } from '@/data/siteImages';

export interface ServiceItem {
  id: string;
  name: string;
  category: 'massage' | 'moroccan-bath' | 'pedicure';
  description: string;
  duration: string;
  price: number;
  image: string;
}

export interface PackageItem {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  isHighlighted?: boolean;
}

export interface GalleryItem {
  id: string;
  title: string;
  category: 'rooms' | 'bath' | 'pedicure' | 'lounge';
  image: string;
}

export interface Testimonial {
  id: string;
  name: string;
  review: string;
  rating: number;
  date: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

// A piece of text in every supported language
type L<T = string> = Record<Lang, T>;

// Turns every translated field of T into an L<...> so the raw data holds both languages
type Translatable<T, K extends keyof T> = Omit<T, K> & { [P in K]: L<T[P]> };

const localize = <T extends object>(item: T, lang: Lang) =>
  Object.fromEntries(
    Object.entries(item).map(([key, value]) => [
      key,
      value && typeof value === 'object' && 'en' in value && 'ar' in value ? value[lang] : value,
    ])
  );

const SERVICES_CATEGORIES_RAW = [
  { id: 'massage', name: { en: 'Massage', ar: 'المساج' } },
  { id: 'moroccan-bath', name: { en: 'Moroccan Bath', ar: 'الحمام المغربي' } },
  { id: 'pedicure', name: { en: 'Pedicure', ar: 'البديكير' } },
] as const;

const SERVICES_RAW: Translatable<ServiceItem, 'name' | 'description' | 'duration'>[] = [
  {
    id: 'msg-60',
    name: { en: 'One-Hour Massage', ar: 'ساعة مساج' },
    category: 'massage',
    description: {
      en: 'A full hour of relaxing massage to release tension, ease tired muscles, and restore your calm.',
      ar: 'ساعة كاملة من المساج المريح لتخفيف التوتر وإراحة العضلات المتعبة واستعادة هدوئك.',
    },
    duration: { en: '60 Mins', ar: '60 دقيقة' },
    price: 250,
    image: SITE_IMAGES.services['msg-60'],
  },
  {
    id: 'msg-45',
    name: { en: '45-Minute Massage', ar: '45 دقيقة مساج' },
    category: 'massage',
    description: {
      en: 'A focused massage session that relieves stress and refreshes body and mind.',
      ar: 'جلسة مساج مركّزة تخفف الضغوط وتجدد نشاط الجسد والذهن.',
    },
    duration: { en: '45 Mins', ar: '45 دقيقة' },
    price: 200,
    image: SITE_IMAGES.services['msg-45'],
  },
  {
    id: 'bath',
    name: { en: 'Moroccan Bath', ar: 'حمام مغربي' },
    category: 'moroccan-bath',
    description: {
      en: 'A traditional Moroccan bath with steam, black soap, and a deep exfoliating scrub for soft, glowing skin.',
      ar: 'حمام مغربي تقليدي بالبخار والصابون البلدي وتقشير عميق لبشرة ناعمة ومشرقة.',
    },
    duration: { en: '30 Mins', ar: '30 دقيقة' },
    price: 180,
    image: SITE_IMAGES.services['bath'],
  },
  {
    id: 'pedicure',
    name: { en: 'Pedicure', ar: 'بديكير' },
    category: 'pedicure',
    description: {
      en: 'A soothing foot soak, gentle exfoliation, nail shaping, and cuticle care for refreshed feet.',
      ar: 'نقع مريح للقدمين وتقشير لطيف وتشكيل الأظافر والعناية بالجلد المحيط لقدمين منتعشتين.',
    },
    duration: { en: '45 Mins', ar: '45 دقيقة' },
    price: 200,
    image: SITE_IMAGES.services['pedicure'],
  },
];

const PACKAGES_RAW: Translatable<PackageItem, 'name' | 'description' | 'features'>[] = [
  {
    id: 'pkg-1',
    name: { en: 'Half-Hour Massage Package', ar: 'باكيج نصف ساعة مساج' },
    price: 250,
    description: {
      en: 'A quick reset for body and mind.',
      ar: 'جلسة سريعة تعيد لك النشاط والحيوية.',
    },
    features: {
      en: ['30-minute massage', '30-minute Moroccan bath'],
      ar: ['نصف ساعة مساج', 'نصف ساعة حمام مغربي'],
    },
  },
  {
    id: 'pkg-2',
    name: { en: '45-Minute Massage Package', ar: 'باكيج 45 دقيقة مساج' },
    price: 300,
    description: {
      en: 'The perfect balance of massage and bath.',
      ar: 'توازن مثالي بين المساج والحمام المغربي.',
    },
    features: {
      en: ['45-minute massage', '30-minute Moroccan bath'],
      ar: ['45 دقيقة مساج', 'نصف ساعة حمام مغربي'],
    },
  },
  {
    id: 'pkg-3',
    name: { en: 'One-Hour Massage Package', ar: 'باكيج ساعة مساج' },
    price: 350,
    description: {
      en: 'A full hour of deep relaxation.',
      ar: 'ساعة كاملة من الاسترخاء العميق.',
    },
    features: {
      en: ['60-minute massage', '30-minute Moroccan bath'],
      ar: ['ساعة مساج', 'نصف ساعة حمام مغربي'],
    },
  },
  {
    id: 'pkg-4',
    name: { en: 'The Royal Package', ar: 'الباكيج الملكي' },
    price: 500,
    description: {
      en: 'The complete relaxation experience.',
      ar: 'تجربة الاسترخاء المتكاملة.',
    },
    features: {
      en: ['60-minute massage', '30-minute Moroccan bath', 'Pedicure'],
      ar: ['ساعة مساج', 'نصف ساعة حمام مغربي', 'بديكير'],
    },
    isHighlighted: true,
  },
];

const GALLERY_RAW: Translatable<GalleryItem, 'title'>[] = [
  {
    id: 'gal-rooms',
    title: { en: 'Private Massage Room', ar: 'غرفة المساج الخاصة' },
    category: 'rooms',
    image: SITE_IMAGES.gallery['gal-rooms'],
  },
  {
    id: 'gal-bath',
    title: { en: 'Moroccan Bath Room', ar: 'غرفة الحمام المغربي' },
    category: 'bath',
    image: SITE_IMAGES.gallery['gal-bath'],
  },
  {
    id: 'gal-bath-essentials',
    title: { en: 'Moroccan Bath Essentials', ar: 'مستلزمات الحمام المغربي' },
    category: 'bath',
    image: SITE_IMAGES.gallery['gal-bath-essentials'],
  },
  {
    id: 'gal-pedicure',
    title: { en: 'Pedicure Corner', ar: 'ركن البديكير' },
    category: 'pedicure',
    image: SITE_IMAGES.gallery['gal-pedicure'],
  },
  {
    id: 'gal-lounge',
    title: { en: 'Relaxation Lounge', ar: 'صالة الاسترخاء' },
    category: 'lounge',
    image: SITE_IMAGES.gallery['gal-lounge'],
  },
  {
    id: 'gal-reception',
    title: { en: 'Reception', ar: 'الاستقبال' },
    category: 'lounge',
    image: SITE_IMAGES.gallery['gal-reception'],
  },
];

// Sample reviews: replace with real guest reviews before launch
const TESTIMONIALS_RAW: Translatable<Testimonial, 'name' | 'review' | 'date'>[] = [
  {
    id: 'tst-1',
    name: { en: 'A. M.', ar: 'أ. م.' },
    review: {
      en: 'The one-hour massage was wonderful and focused exactly on where I carry tension. The place is calm and very clean.',
      ar: 'جلسة المساج لمدة ساعة كانت رائعة، وركّزت تماماً على مناطق التوتر. المكان هادئ ونظيف جداً.',
    },
    rating: 5,
    date: { en: '1 week ago', ar: 'منذ أسبوع' },
  },
  {
    id: 'tst-2',
    name: { en: 'S. F.', ar: 'س. ف.' },
    review: {
      en: 'I tried the Moroccan bath for the first time and it was a special experience. My skin felt so soft, and the service was excellent.',
      ar: 'جربت الحمام المغربي لأول مرة وكانت تجربة مميزة. صارت بشرتي ناعمة جداً والخدمة ممتازة.',
    },
    rating: 5,
    date: { en: '2 weeks ago', ar: 'منذ أسبوعين' },
  },
  {
    id: 'tst-3',
    name: { en: 'R. K.', ar: 'ر. ك.' },
    review: {
      en: 'The Royal Package is worth every riyal: massage, Moroccan bath, and pedicure in one visit. I will definitely be back.',
      ar: 'الباكيج الملكي يستحق كل ريال: مساج وحمام مغربي وبديكير في زيارة واحدة. سأعود بالتأكيد.',
    },
    rating: 5,
    date: { en: '1 month ago', ar: 'منذ شهر' },
  },
];

const FAQ_RAW: Translatable<FAQItem, 'question' | 'answer'>[] = [
  {
    id: 'faq-1',
    question: {
      en: 'How early should I arrive before my appointment?',
      ar: 'كم من الوقت يجب أن أصل قبل موعدي؟',
    },
    answer: {
      en: 'We recommend arriving 10 to 15 minutes early so you can check in and settle in calmly before your session.',
      ar: 'ننصح بالوصول قبل موعدك بـ 10 إلى 15 دقيقة لتسجيل الوصول والاستعداد للجلسة بهدوء.',
    },
  },
  {
    id: 'faq-2',
    question: {
      en: 'Can I book the Moroccan bath on its own?',
      ar: 'هل يمكنني حجز الحمام المغربي وحده؟',
    },
    answer: {
      en: 'Yes. The Moroccan bath (180 SAR) can be booked as a single service, or as part of a package with a massage at a better price.',
      ar: 'نعم، يمكنك حجز الحمام المغربي (180 ر.س) كخدمة مستقلة، أو ضمن أحد الباكيجات مع المساج بسعر أفضل.',
    },
  },
  {
    id: 'faq-3',
    question: {
      en: 'What is the difference between the packages?',
      ar: 'ما الفرق بين الباكيجات؟',
    },
    answer: {
      en: 'Every package includes a 30-minute Moroccan bath; the massage length changes: 30 minutes (250 SAR), 45 minutes (300 SAR), or one hour (350 SAR). The Royal Package (500 SAR) adds a pedicure to a one-hour massage and a 30-minute Moroccan bath.',
      ar: 'جميع الباكيجات تشمل نصف ساعة حمام مغربي، ويختلف وقت المساج: نصف ساعة (250 ر.س)، أو 45 دقيقة (300 ر.س)، أو ساعة (350 ر.س). أما الباكيج الملكي (500 ر.س) فيشمل ساعة مساج ونصف ساعة حمام مغربي وبديكير.',
    },
  },
  {
    id: 'faq-4',
    question: {
      en: 'How do I cancel or reschedule my appointment?',
      ar: 'كيف ألغي موعدي أو أغيّره؟',
    },
    answer: {
      en: 'Please let us know at least 24 hours in advance so we can offer the slot to another guest.',
      ar: 'نرجو إبلاغنا قبل 24 ساعة على الأقل حتى نتمكن من إتاحة الموعد لضيف آخر.',
    },
  },
  {
    id: 'faq-5',
    question: {
      en: 'Are the services suitable during pregnancy or with health conditions?',
      ar: 'هل الخدمات مناسبة أثناء الحمل أو مع وجود حالات صحية؟',
    },
    answer: {
      en: 'If you are pregnant or have a health condition, please tell us when booking and check with your doctor first, especially before the Moroccan bath because of the heat and steam.',
      ar: 'إذا كنتِ حاملاً أو لديك حالة صحية، يرجى إبلاغنا عند الحجز واستشارة طبيبك أولاً، خاصة قبل الحمام المغربي بسبب الحرارة والبخار.',
    },
  },
];

const BUSINESS_INFO_RAW = {
  phone: '+1 (555) 382-2872',
  email: 'concierge@auraspasalon.com',
  address: {
    en: 'Al Nuzha District, Jeddah, Saudi Arabia',
    ar: 'حي النزهة، جدة، المملكة العربية السعودية',
  },
  mapCoordinates: 'https://maps.google.com/maps?q=%D8%AD%D9%8A%20%D8%A7%D9%84%D9%86%D8%B2%D9%87%D8%A9%D8%8C%20%D8%AC%D8%AF%D8%A9&z=14&output=embed',
  hours: {
    weekdays: { en: '9:00 AM - 8:00 PM', ar: '9:00 ص - 8:00 م' },
    saturday: { en: '9:00 AM - 7:00 PM', ar: '9:00 ص - 7:00 م' },
    sunday: { en: '10:00 AM - 5:00 PM', ar: '10:00 ص - 5:00 م' },
  },
};

export function getSalonData(lang: Lang) {
  return {
    SERVICES_CATEGORIES: SERVICES_CATEGORIES_RAW.map((c) => ({ id: c.id, name: c.name[lang] })),
    SERVICES_DATA: SERVICES_RAW.map((s) => localize(s, lang) as ServiceItem),
    PACKAGES_DATA: PACKAGES_RAW.map((p) => localize(p, lang) as PackageItem),
    GALLERY_DATA: GALLERY_RAW.map((g) => localize(g, lang) as GalleryItem),
    TESTIMONIALS_DATA: TESTIMONIALS_RAW.map((t) => localize(t, lang) as Testimonial),
    FAQ_DATA: FAQ_RAW.map((f) => localize(f, lang) as FAQItem),
    BUSINESS_INFO: {
      ...BUSINESS_INFO_RAW,
      address: BUSINESS_INFO_RAW.address[lang],
      hours: {
        weekdays: BUSINESS_INFO_RAW.hours.weekdays[lang],
        saturday: BUSINESS_INFO_RAW.hours.saturday[lang],
        sunday: BUSINESS_INFO_RAW.hours.sunday[lang],
      },
    },
  };
}

export type SalonData = ReturnType<typeof getSalonData>;
