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

export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
  keywords: ["spa", "massage", "facial", "hair styling", "nail care", "luxury wellness", "مساج", "سبا", "واحة الإسترخاء", "beauty treatments"],
  authors: [{ name: brand.name }],
  openGraph: {
    title: meta.ogTitle,
    description: meta.ogDescription,
    siteName: brand.name,
    locale: meta.locale,
    alternateLocale: meta.locale === "ar_SA" ? ["en_US"] : ["ar_SA"],
    type: "website",
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
      <body className="min-h-full bg-aura-bg text-aura-text font-sans">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
