import type { Metadata } from 'next';
import { Outfit, Italiana } from 'next/font/google';
import './globals.css';

const GA_ID = 'G-TF7WRXVYLC';

const sans = Outfit({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const display = Italiana({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-display',
  display: 'swap',
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://photos.nicogaray.com';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Nico Garay · Photographie de voyage',
    template: '%s · Nico Garay',
  },
  description:
    "Photographies de voyage en édition numérique haute résolution. Voyageur avant photographe, je capture les paysages et les sujets qui m'inspirent.",
  applicationName: 'Nico Garay Photography',
  authors: [{ name: 'Nico Garay', url: 'https://nicogaray.com' }],
  creator: 'Nico Garay',
  publisher: 'Nico Garay',
  keywords: [
    'photographie de voyage',
    'travel photography',
    'Nico Garay',
    'tirage photo',
    'édition numérique',
    'paysage',
    'photographe',
    'fine art print',
  ],
  category: 'photography',
  formatDetection: { email: false, address: false, telephone: false },
  alternates: {
    canonical: '/',
    languages: {
      fr: '/fr',
      en: '/en',
      'x-default': '/fr',
    },
  },
  openGraph: {
    type: 'website',
    siteName: 'Nico Garay Photography',
    title: 'Nico Garay · Photographie de voyage',
    description:
      "Photographies de voyage en édition numérique haute résolution. Voyageur avant photographe, je capture les paysages et les sujets qui m'inspirent.",
    url: SITE_URL,
    locale: 'fr_FR',
    alternateLocale: ['en_GB'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nico Garay · Photographie de voyage',
    description: 'Photographies de voyage en édition numérique haute résolution.',
    creator: '@nicogaray',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  icons: {
    icon: '/icon.svg',
    apple: '/apple-icon',
  },
};

export const viewport = {
  themeColor: '#0F0F0F',
  colorScheme: 'dark light' as const,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${sans.variable} ${display.variable}`}>
      <head>
        <meta name="google-adsense-account" content="ca-pub-5435447054359850" />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5435447054359850"
          crossOrigin="anonymous"
        />
        {/* Vérification de domaine Pinterest */}
        <meta name="p:domain_verify" content="3f8bc414d1d7c5975758b57acd5e4768" />
        {/* Google tag (gtag.js) */}
        <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = gtag;
              gtag('consent', 'default', {
                ad_storage: 'denied',
                ad_user_data: 'denied',
                ad_personalization: 'denied',
                analytics_storage: 'granted',
                functionality_storage: 'granted',
                security_storage: 'granted'
              });
              gtag('js', new Date());
              gtag('config', '${GA_ID}', { anonymize_ip: true });
            `,
          }}
        />
        {/* Pinterest Tag */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              !function(e){if(!window.pintrk){window.pintrk = function () {
              window.pintrk.queue.push(Array.prototype.slice.call(arguments))};var
                n=window.pintrk;n.queue=[],n.version="3.0";var
                t=document.createElement("script");t.async=!0,t.src=e;var
                r=document.getElementsByTagName("script")[0];
                r.parentNode.insertBefore(t,r)}}("https://s.pinimg.com/ct/core.js");
              pintrk('load', '2613010427118');
              pintrk('page');
            `,
          }}
        />
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            alt=""
            src="https://ct.pinterest.com/v3/?event=init&tid=2613010427118&noscript=1"
          />
        </noscript>
      </head>
      <body>{children}</body>
    </html>
  );
}
