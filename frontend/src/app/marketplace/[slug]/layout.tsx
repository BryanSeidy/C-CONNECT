import type { Metadata } from 'next';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api').replace(/\/$/, '');

interface RawProductForSeo {
  nom?: string;
  description?: string | null;
  prix?: number | string;
  image_url?: string | null;
  image_principale?: string | null;
  region?: string | null;
  stock?: number;
  seller?: { business_name?: string | null };
}

async function fetchProductForSeo(slug: string): Promise<RawProductForSeo | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/catalogue/products/${slug}`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchProductForSeo(slug);

  if (!product) {
    return { title: 'Produit' };
  }

  const title = product.nom ?? 'Produit';
  const description = product.description?.slice(0, 160) ?? 'Détails du produit sur C-Connect.';
  const image = product.image_url ?? product.image_principale ?? undefined;

  return {
    title,
    description,
    openGraph: {
      title: `${title} · C-Connect`,
      description,
      images: image ? [{ url: image }] : undefined,
    },
  };
}

export default async function ProductLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await fetchProductForSeo(slug);

  const jsonLd = product
    ? {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.nom,
        description: product.description ?? undefined,
        image: product.image_url ?? product.image_principale ?? undefined,
        brand: product.seller?.business_name
          ? { '@type': 'Organization', name: product.seller.business_name }
          : undefined,
        offers: {
          '@type': 'Offer',
          priceCurrency: 'XAF',
          price: product.prix,
          availability:
            (product.stock ?? 0) > 0
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
        },
      }
    : null;

  return (
    <>
      {jsonLd && (
        // eslint-disable-next-line react/no-danger
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  );
}
