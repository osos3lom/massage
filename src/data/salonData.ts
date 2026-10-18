import type { Lang } from '@/i18n/config';

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

export interface Specialist {
  id: string;
  name: string;
  role: string;
  shortRole: string;
  experience: string;
  specialization: string;
  socials: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
  };
}

export interface GalleryItem {
  id: string;
  title: string;
  category: 'interior' | 'spa' | 'hair' | 'skin' | 'nails';
  image: string;
}

export interface Testimonial {
  id: string;
  name: string;
  review: string;
  rating: number;
  photo: string;
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
    image: 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&w=800&q=80',
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
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80',
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
    image: 'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?auto=format&fit=crop&w=800&q=80',
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
    image: 'https://images.unsplash.com/photo-1519415510236-8a5d8431393f?auto=format&fit=crop&w=800&q=80',
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

const SPECIALISTS_RAW: Translatable<Specialist, 'name' | 'role' | 'shortRole' | 'experience' | 'specialization'>[] = [
  {
    id: 'spc-1',
    name: { en: 'Elena Rostova', ar: 'إيلينا روستوفا' },
    role: { en: 'Lead Spa Therapist & Wellness Expert', ar: 'كبيرة معالجات السبا وخبيرة العافية' },
    shortRole: { en: 'Spa Master', ar: 'خبيرة سبا' },
    experience: { en: '12 Years', ar: '12 سنة' },
    specialization: {
      en: 'Swedish, Deep Tissue & Aromatherapy Massage',
      ar: 'المساج السويدي ومساج الأنسجة العميقة والعلاج بالزيوت العطرية',
    },
    socials: { instagram: '#', facebook: '#', twitter: '#' },
  },
  {
    id: 'spc-2',
    name: { en: 'Marcus Chen', ar: 'ماركوس تشين' },
    role: { en: 'Artistic Director & Master Stylist', ar: 'المدير الفني وخبير تصفيف الشعر' },
    shortRole: { en: 'Styling Master', ar: 'خبير تصفيف' },
    experience: { en: '10 Years', ar: '10 سنوات' },
    specialization: {
      en: 'Precision Haircuts, Balayage & Creative Color',
      ar: 'القصّات الدقيقة والبالياج والألوان الإبداعية',
    },
    socials: { instagram: '#', facebook: '#' },
  },
  {
    id: 'spc-3',
    name: { en: 'Sophia Al-Jamil', ar: 'صوفيا الجميل' },
    role: { en: 'Chief Aesthetician & Skin Practitioner', ar: 'كبيرة أخصائيات التجميل والعناية بالبشرة' },
    shortRole: { en: 'Skin Master', ar: 'خبيرة بشرة' },
    experience: { en: '8 Years', ar: '8 سنوات' },
    specialization: {
      en: 'Advanced Microcurrents, Custom Peels & Hydrafacials',
      ar: 'التيارات الدقيقة المتقدمة والتقشير المخصص والهيدرافيشل',
    },
    socials: { instagram: '#', twitter: '#' },
  },
];

const GALLERY_RAW: Translatable<GalleryItem, 'title'>[] = [
  {
    id: 'gal-1',
    title: { en: 'Oasis Thermal Relaxation Suite', ar: 'جناح الاسترخاء الحراري' },
    category: 'interior',
    image: 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'gal-2',
    title: { en: 'Hot Stone Treatment Lounge', ar: 'صالة العلاج بالأحجار الساخنة' },
    category: 'spa',
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'gal-3',
    title: { en: 'Precision Color Styling Bar', ar: 'ركن تصفيف وصبغ الشعر' },
    category: 'hair',
    image: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'gal-4',
    title: { en: 'Oxygen Infusion Treatment', ar: 'جلسة العلاج بالأكسجين' },
    category: 'skin',
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'gal-5',
    title: { en: 'Milk & Honey Manicure Station', ar: 'ركن مانيكير الحليب والعسل' },
    category: 'nails',
    image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'gal-6',
    title: { en: 'Oasis Zen Water Garden', ar: 'حديقة الماء الهادئة' },
    category: 'interior',
    image: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=800&q=80',
  },
];

const TESTIMONIALS_RAW: Translatable<Testimonial, 'name' | 'review' | 'date'>[] = [
  {
    id: 'tst-1',
    name: { en: 'Alexandra Vance', ar: 'ألكسندرا فانس' },
    review: {
      en: 'Relaxation Oasis is a masterpiece of tranquility. The moment you walk through the doors, you leave the noise of the city behind. The aromatherapy Swedish massage was simply transcendent. Clean, highly professional, and gorgeous interiors.',
      ar: 'واحة الإسترخاء تحفة من الهدوء. بمجرد أن تعبر الأبواب تترك ضجيج المدينة خلفك. كان المساج السويدي بالزيوت العطرية رائعاً بحق. مكان نظيف واحترافي للغاية وديكور داخلي خلّاب.',
    },
    rating: 5,
    photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
    date: { en: '2 weeks ago', ar: 'منذ أسبوعين' },
  },
  {
    id: 'tst-2',
    name: { en: 'Julianne Thorne', ar: 'جوليان ثورن' },
    review: {
      en: 'Marcus Chen is a magician. I went in for a full balayage and style, and the results exceeded my expectations. The color is incredibly rich, natural, and my hair feels healthier than ever. The tea service was also a lovely touch.',
      ar: 'ماركوس تشين ساحر حقيقي. ذهبت لعمل بالياج كامل وتصفيف، وفاقت النتائج توقعاتي. اللون غني وطبيعي بشكل مذهل، وشعري يبدو أكثر صحة من أي وقت مضى. وكانت ضيافة الشاي لمسة جميلة أيضاً.',
    },
    rating: 5,
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    date: { en: '3 weeks ago', ar: 'منذ 3 أسابيع' },
  },
  {
    id: 'tst-3',
    name: { en: 'Genevieve Dupond', ar: 'جينيفيف دوبون' },
    review: {
      en: 'The Hydra-Radiance facial here is worth every dollar. My skin has never felt this hydrated and glowing. Sophia was extremely informative and tailored the treatment to my sensitive skin. Highly recommend the monthly membership.',
      ar: 'جلسة الأكسجين للترطيب والإشراق هنا تستحق كل دولار. لم تكن بشرتي بهذا الترطيب والإشراق من قبل. كانت صوفيا غنية بالمعلومات وصمّمت العلاج ليناسب بشرتي الحساسة. أنصح بشدة بالعضوية الشهرية.',
    },
    rating: 5,
    photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80',
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
      en: 'We recommend arriving 15 to 20 minutes prior to your scheduled time. This allows you to check in, complete our briefly tailored skin/health questionnaire, change into a plush organic robe, and unwind in our thermal steam lounge with a complimentary herbal infusion.',
      ar: 'ننصح بالوصول قبل موعدك بـ 15 إلى 20 دقيقة. يتيح لك ذلك تسجيل الوصول، وتعبئة استبيان قصير عن البشرة والصحة، وارتداء رداء عضوي ناعم، والاسترخاء في صالة البخار الحرارية مع مشروب أعشاب مجاني.',
    },
  },
  {
    id: 'faq-2',
    question: {
      en: 'What is Relaxation Oasis’s cancellation and rescheduling policy?',
      ar: 'ما هي سياسة الإلغاء وإعادة الجدولة في واحة الإسترخاء؟',
    },
    answer: {
      en: 'We value our specialists’ schedules and our clients’ needs. We kindly ask for at least 24 hours notice for any rescheduling or cancellations. Cancellations within 24 hours of the service time will incur a 50% service charge. No-shows will be charged at 100%.',
      ar: 'نحن نقدّر جداول أخصائيينا واحتياجات عملائنا، لذا نرجو إبلاغنا قبل 24 ساعة على الأقل لأي إعادة جدولة أو إلغاء. يترتب على الإلغاء خلال 24 ساعة من موعد الخدمة رسوم بنسبة 50% من قيمتها، ويُحتسب عدم الحضور بنسبة 100%.',
    },
  },
  {
    id: 'faq-3',
    question: {
      en: 'Can I request a specific therapist or specialist for my treatments?',
      ar: 'هل يمكنني طلب معالج أو أخصائي محدد لعلاجاتي؟',
    },
    answer: {
      en: 'Absolutely. When booking online through our custom client form or over the phone, you can choose a specific therapist (e.g., Elena, Marcus, Sophia). If you prefer any available specialist, our booking algorithm will assign the best suited match.',
      ar: 'بالتأكيد. عند الحجز عبر نموذج الحجز الإلكتروني أو عبر الهاتف، يمكنك اختيار معالج محدد (مثل إيلينا أو ماركوس أو صوفيا). وإذا كنت تفضّل أي أخصائي متاح، فسيختار نظام الحجز الأنسب لك.',
    },
  },
  {
    id: 'faq-4',
    question: {
      en: 'Are all treatments suitable during pregnancy?',
      ar: 'هل جميع العلاجات مناسبة أثناء الحمل؟',
    },
    answer: {
      en: 'Many of our massage treatments, facials, and nail care therapies can be customized for pre-natal care. Please notify us during booking so our specialists can use safe, organic pregnancy-approved botanical oils and position you comfortably.',
      ar: 'يمكن تكييف العديد من جلسات المساج والفيشل والعناية بالأظافر لتناسب فترة الحمل. يرجى إبلاغنا عند الحجز ليستخدم أخصائيونا زيوتاً نباتية عضوية آمنة ومعتمدة للحوامل ويضعوك في وضعية مريحة.',
    },
  },
  {
    id: 'faq-5',
    question: {
      en: 'Can I purchase the skincare products used during my facial?',
      ar: 'هل يمكنني شراء منتجات العناية بالبشرة المستخدمة في جلسة الفيشل؟',
    },
    answer: {
      en: 'Yes! We carry complete retail product lines of the organic, medical-grade botanical brands used in our facials and skin therapies. Your aesthetician will provide a personalized skincare chart and recommendations after your treatment.',
      ar: 'نعم! نوفّر مجموعات كاملة من منتجات العلامات النباتية العضوية الطبية المستخدمة في جلسات الفيشل وعلاجات البشرة، وستقدّم لك أخصائية التجميل جدولاً شخصياً للعناية بالبشرة وتوصيات بعد العلاج.',
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
    SPECIALISTS_DATA: SPECIALISTS_RAW.map((s) => localize(s, lang) as Specialist),
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
