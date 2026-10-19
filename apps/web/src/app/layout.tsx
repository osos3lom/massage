import type { Metadata } from "next";
import { Inter, Playfair_Display, Tajawal, El_Messiri } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/i18n/LanguageProvider";
import { dictionaries } from "@/i18n/dictionaries";
import { DEFAULT_LANG, getDir } from "@/i18n/config";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const tajawal = Tajawal({
  variable: "--font-tajawal",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

const elMessiri = El_Messiri({
  variable: "--font-el-messiri",
  subsets: ["arabic", "latin"],
  display: "swap",
});

const { brand, meta } = dictionaries[DEFAULT_LANG];
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://relaxation-oasis.sa";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: meta.title,
    template: `%s | ${brand.name}`,
  },
  description: meta.description,
  keywords: [
    "مساج جدة",
    "حمام مغربي جدة",
    "بديكير رجالي جدة",
    "واحة الإسترخاء",
    "مساج شارع حراء",
    "مساج حي النزهة",
    "massage Jeddah",
    "Moroccan bath Jeddah",
    "pedicure Jeddah",
    "Relaxation Oasis",
  ],
  authors: [{ name: brand.name }],
  creator: brand.name,
  publisher: brand.name,
  formatDetection: {
    email: false,
    address: true,
    telephone: true,
  },
  alternates: {
    canonical: siteUrl,
    languages: {
      "ar-SA": `${siteUrl}/?lang=ar`,
      "en-US": `${siteUrl}/?lang=en`,
    },
  },
  openGraph: {
    title: meta.ogTitle,
    description: meta.ogDescription,
    url: siteUrl,
    siteName: brand.name,
    locale: "ar_SA",
    alternateLocale: ["en_US"],
    type: "website",
    images: [
      {
        url: "/logo.png",
        width: 800,
        height: 600,
        alt: brand.name,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: meta.ogTitle,
    description: meta.ogDescription,
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": ["DaySpa", "HealthAndBeautyBusiness"],
  name: "واحة الإسترخاء للمساج والحمام المغربي",
  alternateName: "Relaxation Oasis Massage & Moroccan Bath",
  url: siteUrl,
  logo: `${siteUrl}/logo.png`,
  image: `${siteUrl}/logo.png`,
  description: "مركز واحة الإسترخاء المتخصص في جلسات المساج العلاجي والاسترخائي والحمام المغربي الملكي والعناية بالقدمين واليدين في جدة.",
  telephone: "+966555555555",
  priceRange: "SAR 150 - SAR 600",
  address: {
    "@type": "PostalAddress",
    streetAddress: "شارع حراء، حي النزهة",
    addressLocality: "جدة",
    addressRegion: "منطقة مكة المكرمة",
    postalCode: "23532",
    addressCountry: "SA",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 21.6166,
    longitude: 39.1637,
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      opens: "10:00",
      closes: "02:00",
    },
  ],
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "قائمة خدمات واحة الإسترخاء",
    itemListElement: [
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "مساج استرخائي سويدي",
          description: "جلسة مساج استرخائي لتخفيف التوتر وإعادة الحيوية للجسم",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "حمام مغربي ملكي",
          description: "حمام مغربي أصيل بالصابون البلدي والأعشاب الطبيعية والبخار",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "بديكير وعناية بالقدمين",
          description: "تقشير ناعم ونقع استرخائي وعناية متكاملة للقدمين",
        },
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang={DEFAULT_LANG}
      dir={getDir(DEFAULT_LANG)}
      className={`${inter.variable} ${playfair.variable} ${tajawal.variable} ${elMessiri.variable} h-full scroll-smooth antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full bg-aura-bg text-aura-text font-sans">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
