import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CEMAC Connect',
    short_name: 'CEMAC',
    description: 'Marketplace B2B régionale CEMAC',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#15803d',
    icons: []
  };
}
