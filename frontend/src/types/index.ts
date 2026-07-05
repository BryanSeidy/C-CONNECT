// ============================================================================
// C-Connect — Central TypeScript Interface Registry
// All interfaces mirror the backend snake_case PostgreSQL schema
// ============================================================================

export type UserRole = 'buyer' | 'seller' | 'admin';

export interface User {
  id: number | string;
  email: string;
  name?: string | null;
  fullName?: string | null;
  companyName?: string | null;
  companyId?: number | string | null;
  country?: string | null;
  role: UserRole;
  isVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SellerProfile {
  id: number | string;
  userId: number | string;
  businessName?: string | null;
  businessSector?: string | null;
  businessRegion?: string | null;
  nationalIdRef?: string | null;
  bankAccountType?: string | null;
  isOnboardingComplete: boolean;
  verificationScore?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface GamificationStat {
  id: number | string;
  userId: number | string;
  points: number;
  level: number;
  ordersCompleted: number;
  reviewsGiven: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Review {
  id: number | string;
  rating: number;
  comment?: string | null;
  productId: number | string;
  buyerId: number | string;
  buyer?: Pick<User, 'id' | 'fullName' | 'companyName'>;
  createdAt?: string;
}

export interface Product {
  id: number | string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  price: number;
  country: string;
  category: string;
  stock: number;
  isActive: boolean;
  producerId: number | string;
  producer?: Pick<User, 'id' | 'fullName' | 'companyName' | 'country' | 'isVerified'>;
  reviews?: Review[];
  createdAt?: string;
  updatedAt?: string;
}

export type EscrowStatus =
  | 'pending'
  | 'escrow_locked'
  | 'en_preparation'
  | 'expedie'
  | 'en_transit'
  | 'livre'
  | 'complete'
  | 'annule'
  | 'dispute';

export interface OrderItem {
  id: number | string;
  orderId: number | string;
  productId: number | string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  product?: Pick<Product, 'id' | 'name' | 'country' | 'category' | 'stock'> | null;
}

export interface Order {
  id: number | string;
  buyerId: number | string;
  sellerId: number | string;
  montantTotal: number;
  commissionPlateforme: number;
  montantVendeur: number;
  escrowStatus: EscrowStatus;
  villeLivraison?: string | null;
  adresseLivraison?: string | null;
  telephoneLivraison?: string | null;
  items?: OrderItem[];
  dispute?: Dispute | null;
  buyer?: Pick<User, 'id' | 'fullName' | 'email' | 'companyName'> | null;
  seller?: Pick<User, 'id' | 'fullName' | 'companyName'> | null;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================================================
// B2B Repositioning — Companies, RFQs, Recurring Orders, Disputes
// ============================================================================

export type CompanyType =
  | 'cooperative'
  | 'producteur'
  | 'fabricant'
  | 'restaurant'
  | 'hotel'
  | 'supermarche'
  | 'grossiste'
  | 'distributeur'
  | 'ong'
  | 'institution'
  | 'pme'
  | 'autre';

export type VerificationStatus = 'non_verifie' | 'en_attente' | 'verifie' | 'rejete';

export interface CompanyBadge {
  code: string;
  label: string;
}

export interface Company {
  id: number | string;
  nom: string;
  slug: string;
  rccm?: string | null;
  niu?: string | null;
  typeEntreprise: CompanyType;
  ville?: string | null;
  quartier?: string | null;
  region?: string | null;
  telephone?: string | null;
  emailProfessionnel?: string | null;
  siteWeb?: string | null;
  description?: string | null;
  logoUrl?: string | null;
  banniereUrl?: string | null;
  certifications?: string[] | null;
  badgeEntrepriseVerifiee: boolean;
  badgeCooperativeVerifiee: boolean;
  badgeFemmesEntrepreneures: boolean;
  badgeMadeInCameroon: boolean;
  trustScore: number;
  statutVerification: VerificationStatus;
  badges?: CompanyBadge[];
  createdAt?: string;
}

export type RfqStatus = 'active' | 'en_negociation' | 'satisfaite' | 'expiree' | 'annulee';
export type RfqBidStatus = 'en_attente' | 'acceptee' | 'refusee' | 'retiree';

export interface RfqBid {
  id: number | string;
  rfqId: number | string;
  sellerId: number | string;
  prixUnitairePropose: number;
  quantiteDisponible: number;
  dateLivraisonProposee?: string | null;
  message?: string | null;
  conditions?: string | null;
  statut: RfqBidStatus;
  seller?: { id: number | string; businessName?: string | null; user?: Pick<User, 'fullName' | 'companyName'> } | null;
  createdAt?: string;
}

export interface Rfq {
  id: number | string;
  buyerId: number | string;
  categoryId?: number | string | null;
  titre: string;
  description: string;
  quantite: number;
  unite: string;
  budgetMax?: number | null;
  regionLivraison?: string | null;
  villeLivraison?: string | null;
  delaiLivraison?: string | null;
  expireLe?: string | null;
  vendeurVerifieRequis: boolean;
  cooperativeUniquement: boolean;
  femmesEntrepreneuresPrefere: boolean;
  statut: RfqStatus;
  nombreOffres: number;
  buyer?: Pick<User, 'id' | 'fullName' | 'companyName'> | null;
  category?: { id: number | string; nom: string; slug: string } | null;
  bids?: RfqBid[];
  createdAt?: string;
}

export type RecurringFrequency = 'hebdomadaire' | 'bimensuelle' | 'mensuelle';
export type RecurringStatus = 'active' | 'en_pause' | 'annulee' | 'expiree';

export interface RecurringOrder {
  id: number | string;
  buyerId: number | string;
  sellerId: number | string;
  productId: number | string;
  quantite: number;
  unite: string;
  frequence: RecurringFrequency;
  prochaineLivraison?: string | null;
  dateFin?: string | null;
  prixNegocie?: number | null;
  notes?: string | null;
  statut: RecurringStatus;
  totalCommandesGenerees: number;
  product?: Pick<Product, 'id' | 'name'> & { price?: number; imageUrl?: string | null };
  buyer?: Pick<User, 'id' | 'fullName' | 'companyName'> | null;
  seller?: { id: number | string; user?: Pick<User, 'fullName' | 'companyName'> } | null;
  createdAt?: string;
}

export type DisputeReason =
  | 'marchandise_non_recue'
  | 'qualite_non_conforme'
  | 'quantite_incorrecte'
  | 'produit_endommage'
  | 'retard_livraison'
  | 'autre';

export type DisputeStatus = 'ouvert' | 'en_instruction' | 'resolu_rembourse' | 'resolu_libere' | 'clos';

export interface Dispute {
  id: number | string;
  orderId: number | string;
  initiateurId: number | string;
  raison: DisputeReason;
  description: string;
  preuvesUrls?: string[] | null;
  statut: DisputeStatus;
  notesResolution?: string | null;
  order?: Order | null;
  createdAt?: string;
}

export interface Payment {
  id: number;
  orderId: number;
  amount: number;
  method: string;
  status: 'PENDING' | 'PAID' | 'RELEASED' | 'REFUNDED';
  escrow?: Escrow | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Escrow {
  id: number;
  paymentId: number;
  status: 'HOLDING' | 'RELEASED';
  releasedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================================================
// API Envelope — standard response wrapper from Laravel
// ============================================================================

export interface ApiEnvelope<T> {
  success?: boolean;
  data: T;
  message?: string;
}

export type ApiResponse<T> = ApiEnvelope<T>;

export interface PaginationMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  items: T[];
  meta: PaginationMeta;
}

// ============================================================================
// Raw API shapes — snake_case keys returned by the backend before camelCase
// mapping. Used only in service layer normalizers, not in UI components.
// ============================================================================

export interface RawOrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantite: number;
  prix_unitaire: string | number;
  sous_total: string | number;
  product?: Pick<Product, 'id' | 'name' | 'country' | 'category' | 'stock'> | null;
}

export interface RawOrder {
  id: number;
  buyer_id: number;
  seller_id: number;
  montant_total: string | number;
  commission_plateforme: string | number;
  montant_vendeur: string | number;
  escrow_status: EscrowStatus;
  ville_livraison?: string | null;
  adresse_livraison?: string | null;
  telephone_livraison?: string | null;
  items?: RawOrderItem[];
  dispute?: RawDispute | null;
  buyer?: Pick<User, 'id' | 'fullName' | 'email' | 'companyName'> | null;
  seller?: Pick<User, 'id' | 'fullName' | 'companyName'> | null;
  created_at?: string;
  updated_at?: string;
}

export interface RawCompany {
  id: number;
  nom: string;
  slug: string;
  rccm?: string | null;
  niu?: string | null;
  type_entreprise: CompanyType;
  ville?: string | null;
  quartier?: string | null;
  region?: string | null;
  telephone?: string | null;
  email_professionnel?: string | null;
  site_web?: string | null;
  description?: string | null;
  logo_url?: string | null;
  banniere_url?: string | null;
  certifications?: string[] | null;
  badge_entreprise_verifiee: boolean;
  badge_cooperative_verifiee: boolean;
  badge_femmes_entrepreneures: boolean;
  badge_made_in_cameroon: boolean;
  trust_score: number;
  statut_verification: VerificationStatus;
  badges?: CompanyBadge[];
  created_at?: string;
}

export interface RawRfqBid {
  id: number;
  rfq_id: number;
  seller_id: number;
  prix_unitaire_propose: string | number;
  quantite_disponible: string | number;
  date_livraison_proposee?: string | null;
  message?: string | null;
  conditions?: string | null;
  statut: RfqBidStatus;
  seller?: { id: number; business_name?: string | null; user?: Pick<User, 'fullName' | 'companyName'> } | null;
  created_at?: string;
}

export interface RawRfq {
  id: number;
  buyer_id: number;
  category_id?: number | null;
  titre: string;
  description: string;
  quantite: string | number;
  unite: string;
  budget_max?: string | number | null;
  region_livraison?: string | null;
  ville_livraison?: string | null;
  delai_livraison?: string | null;
  expire_le?: string | null;
  vendeur_verifie_requis: boolean;
  cooperative_uniquement: boolean;
  femmes_entrepreneures_prefere: boolean;
  statut: RfqStatus;
  nombre_offres: number;
  buyer?: Pick<User, 'id' | 'fullName' | 'companyName'> | null;
  category?: { id: number; nom: string; slug: string } | null;
  bids?: RawRfqBid[];
  created_at?: string;
}

export interface RawRecurringOrder {
  id: number;
  buyer_id: number;
  seller_id: number;
  product_id: number;
  quantite: string | number;
  unite: string;
  frequence: RecurringFrequency;
  prochaine_livraison?: string | null;
  date_fin?: string | null;
  prix_negocie?: string | number | null;
  notes?: string | null;
  statut: RecurringStatus;
  total_commandes_generees: number;
  product?: { id: number; nom?: string; name?: string; prix?: string | number; price?: number; image_url?: string | null } | null;
  buyer?: Pick<User, 'id' | 'fullName' | 'companyName'> | null;
  seller?: { id: number; user?: Pick<User, 'fullName' | 'companyName'> } | null;
  created_at?: string;
}

export interface RawDispute {
  id: number;
  order_id: number;
  initiateur_id: number;
  raison: DisputeReason;
  description: string;
  preuves_urls?: string[] | null;
  statut: DisputeStatus;
  notes_resolution?: string | null;
  order?: RawOrder | null;
  created_at?: string;
}

export interface RawUser {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string | null;
  role: UserRole;
  email_verified_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface RawSellerProfile {
  id: number;
  user_id: number;
  business_name: string;
  slug: string;
  biographie?: string | null;
  region: string;
  ville?: string | null;
  adresse?: string | null;
  telephone_boutique?: string | null;
  logo?: string | null;
  banniere?: string | null;
  is_female_owned: boolean;
  is_local_producer: boolean;
  is_cooperative: boolean;
  quality_score: string | number;
  total_sales: number;
  total_products: number;
  verification_status: 'unverified' | 'pending' | 'verified' | 'rejected';
  verified_at?: string | null;
  created_at?: string;
  updated_at?: string;
  user?: RawUser;
}

export interface RawProduct {
  id: number;
  seller_id: number;
  category_id?: number | null;
  nom: string;
  slug: string;
  description?: string | null;
  prix: string | number;
  stock: number;
  region: string;
  image_url?: string | null;
  statut: 'active' | 'pending' | 'disabled' | 'flagged';
  quality_rating: string | number;
  reviews_count: number;
  sales_count: number;
  created_at?: string;
  updated_at?: string;
  seller?: RawSellerProfile;
  category?: {
    id: number;
    nom: string;
    slug: string;
    description?: string | null;
    icone?: string | null;
  };
}
