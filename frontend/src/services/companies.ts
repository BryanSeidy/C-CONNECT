import { ApiEnvelope, Company, PaginatedResult, RawCompany } from '@/types';
import { apiClient } from './api';

function normalizeCompany(raw: RawCompany): Company {
  return {
    id: raw.id,
    nom: raw.nom,
    slug: raw.slug,
    rccm: raw.rccm ?? null,
    niu: raw.niu ?? null,
    typeEntreprise: raw.type_entreprise,
    ville: raw.ville ?? null,
    quartier: raw.quartier ?? null,
    region: raw.region ?? null,
    telephone: raw.telephone ?? null,
    emailProfessionnel: raw.email_professionnel ?? null,
    siteWeb: raw.site_web ?? null,
    description: raw.description ?? null,
    logoUrl: raw.logo_url ?? null,
    banniereUrl: raw.banniere_url ?? null,
    certifications: raw.certifications ?? null,
    badgeEntrepriseVerifiee: raw.badge_entreprise_verifiee,
    badgeCooperativeVerifiee: raw.badge_cooperative_verifiee,
    badgeFemmesEntrepreneures: raw.badge_femmes_entrepreneures,
    badgeMadeInCameroon: raw.badge_made_in_cameroon,
    trustScore: raw.trust_score,
    statutVerification: raw.statut_verification,
    badges: raw.badges,
    createdAt: raw.created_at,
  };
}

export interface CompanyFilters {
  region?: string;
  type?: string;
  verifiees?: boolean;
  cooperatives?: boolean;
  femmes?: boolean;
  q?: string;
}

export interface CompanyPayload {
  nom: string;
  typeEntreprise: string;
  region?: string;
  ville?: string;
  quartier?: string;
  telephone?: string;
  emailProfessionnel?: string;
  rccm?: string;
  niu?: string;
  description?: string;
  logoUrl?: string;
}

function toPayload(data: Partial<CompanyPayload>) {
  return {
    nom: data.nom,
    type_entreprise: data.typeEntreprise,
    region: data.region,
    ville: data.ville,
    quartier: data.quartier,
    telephone: data.telephone,
    email_professionnel: data.emailProfessionnel,
    rccm: data.rccm,
    niu: data.niu,
    description: data.description,
    logo_url: data.logoUrl,
  };
}

export const companyService = {
  getCompanies: async (filters: CompanyFilters = {}): Promise<ApiEnvelope<PaginatedResult<Company>>> => {
    const res = await apiClient.get<unknown, ApiEnvelope<{ items: RawCompany[]; meta: PaginatedResult<Company>['meta'] }>>(
      '/companies',
      { params: filters }
    );
    return {
      ...res,
      data: {
        items: res.data.items.map(normalizeCompany),
        meta: res.data.meta,
      },
    };
  },

  getCompanyBySlugOrId: async (idOrSlug: string): Promise<ApiEnvelope<Company>> => {
    const res = await apiClient.get<unknown, ApiEnvelope<RawCompany>>(`/companies/${idOrSlug}`);
    return { ...res, data: normalizeCompany(res.data) };
  },

  createCompany: async (payload: CompanyPayload): Promise<ApiEnvelope<Company>> => {
    const res = await apiClient.post<unknown, ApiEnvelope<RawCompany>>('/companies', toPayload(payload));
    return { ...res, data: normalizeCompany(res.data) };
  },

  updateCompany: async (id: number | string, payload: Partial<CompanyPayload>): Promise<ApiEnvelope<Company>> => {
    const res = await apiClient.put<unknown, ApiEnvelope<RawCompany>>(`/companies/${id}`, toPayload(payload));
    return { ...res, data: normalizeCompany(res.data) };
  },
};

export { normalizeCompany };
