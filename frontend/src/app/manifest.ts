import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'C-Connect — Connecting Cameroon',
    short_name: 'C-Connect',
    description: 'Marketplace B2B nationale pour le Cameroun',
    start_url: '/',
    display: 'standalone',
    background_color: '#F2EFE6',
    theme_color: '#13352E',
    icons: [
      { src: '/brand/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/brand/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/brand/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
