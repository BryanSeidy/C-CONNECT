import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'C-Connect',
    short_name: 'C-Connect',
    description: 'Marketplace B2B nationale pour le Cameroun',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#15803d',
    icons: []
  };
}
