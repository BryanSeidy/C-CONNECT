import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Navbar } from '@/components/Navbar';
import { Providers } from './providers';
import OfflineBanner from '@/components/OfflineBanner';

const SITE_URL = 'https://c-connect.com';
const DESCRIPTION = 'Marketplace B2B nationale pour le Cameroun — producteurs, PME, coopératives et acheteurs professionnels connectés en confiance.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'C-Connect — Connecting Cameroon. Creating Opportunities.',
    template: '%s · C-Connect',
  },
  description: DESCRIPTION,
  icons: {
    icon: [
      { url: '/brand/icon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/brand/icon-16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [{ url: '/brand/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: SITE_URL,
    siteName: 'C-Connect',
    title: 'C-Connect — Connecting Cameroon. Creating Opportunities.',
    description: DESCRIPTION,
    images: [{ url: '/brand/og-image.jpg', width: 1200, height: 630, alt: 'C-Connect' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'C-Connect — Connecting Cameroon. Creating Opportunities.',
    description: DESCRIPTION,
    images: ['/brand/og-image.jpg'],
  },
};

export const viewport: Viewport = {
  themeColor: '#13352E',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <Providers>
          <Navbar />
          <OfflineBanner />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
