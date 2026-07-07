import type { Metadata } from 'next';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api').replace(/\/$/, '');

interface RawCompanyForSeo {
  nom?: string;
  description?: string | null;
  logo_url?: string | null;
  ville?: string | null;
  region?: string | null;
  telephone?: string | null;
  trust_score?: number;
}

async function fetchCompanyForSeo(slug: string): Promise<RawCompanyForSeo | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/catalogue/companies/${slug}`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const company = await fetchCompanyForSeo(slug);

  if (!company) {
    return { title: 'Profil entreprise' };
  }

  const title = company.nom ?? 'Profil entreprise';
  const description =
    company.description?.slice(0, 160) ??
    `Découvrez ${title} sur C-Connect : profil vérifié, catalogue et score de confiance.`;

  return {
    title,
    description,
    openGraph: {
      title: `${title} · C-Connect`,
      description,
      images: company.logo_url ? [{ url: company.logo_url }] : undefined,
    },
  };
}

export default async function CompanyLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const company = await fetchCompanyForSeo(slug);

  const jsonLd = company
    ? {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: company.nom,
        description: company.description ?? undefined,
        logo: company.logo_url ?? undefined,
        address: company.ville || company.region
          ? { '@type': 'PostalAddress', addressLocality: company.ville, addressRegion: company.region, addressCountry: 'CM' }
          : undefined,
        telephone: company.telephone ?? undefined,
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
