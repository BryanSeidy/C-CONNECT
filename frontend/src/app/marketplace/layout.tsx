import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Marketplace National',
  description:
    'Sourcez des produits agricoles, agroalimentaires et industriels auprès de producteurs, coopératives et PME vérifiés partout au Cameroun.',
  openGraph: {
    title: 'Marketplace National · C-Connect',
    description:
      'Sourcez des produits agricoles, agroalimentaires et industriels auprès de producteurs, coopératives et PME vérifiés partout au Cameroun.',
  },
};

export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
