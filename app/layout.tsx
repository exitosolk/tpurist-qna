import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL('https://oneceylon.space'),
  title: {
    default: 'OneCeylon - Sri Lanka Travel Q&A Community',
    template: '%s | OneCeylon',
  },
  description: 'Get expert Sri Lanka travel advice. Ask questions about destinations, transportation, accommodations from travelers and locals who know best.',
  keywords: [
    'Sri Lanka travel',
    'Sri Lanka tourism',
    'travel questions Sri Lanka',
    'Sri Lanka advice',
    'Ceylon travel',
    'visit Sri Lanka',
    'Sri Lanka destinations',
    'Colombo',
    'Kandy',
    'Galle',
    'Ella',
    'travel community',
    'Q&A travel',
  ],
  authors: [{ name: 'OneCeylon' }],
  creator: 'OneCeylon',
  publisher: 'OneCeylon',
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://oneceylon.space',
    title: 'OneCeylon - Sri Lanka Travel Q&A Community',
    description: 'Ask the island. Get expert travel advice for Sri Lanka from travelers and locals who know it best.',
    siteName: 'OneCeylon',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'OneCeylon - Sri Lanka Travel Community',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OneCeylon - Sri Lanka Travel Q&A Community',
    description: 'Ask the island. Get expert travel advice for Sri Lanka from travelers and locals who know it best.',
    images: ['/og-image.png'],
    site: '@oneceylon',
    creator: '@oneceylon',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
    // bing: 'your-bing-verification-code',
  },
  alternates: {
    canonical: 'https://oneceylon.space',
  },
  category: 'travel',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563eb" />
      </head>
      <body className={inter.className}>
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-PC2E5MKLXJ"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-PC2E5MKLXJ');
          `}
        </Script>
        
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
