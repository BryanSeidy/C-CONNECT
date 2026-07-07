# C-CONNECT Backlog

## Completed

- [x] Harden authentication redirects to prevent open-redirect abuse while preserving safe deep links.
- [x] Improve login/register UX with client-side validation, field-level errors, disabled loading submit states, autocomplete hints, and post-registration success feedback.
- [x] Restore production frontend build compatibility on Next.js 15 dynamic route typing.
- [x] Add the missing ESLint toolchain dependency so the configured Next.js lint stack can be installed and evolved intentionally.
- [x] Fix the reusable Input component hook ordering issue detected by the stricter React lint rules.

- [x] Fix PostgreSQL table casing for `users` and `products` model/query references.
- [x] Open product and category browse routes for guest marketplace access while keeping mutations authenticated.
- [x] Replace auth and product service `any` usage with typed API contracts and a session service abstraction.
- [x] Replace interface emoji markers with Lucide React SVG icons.
- [x] Launch a premium SaaS homepage focused on Made in Cameroon commerce outcomes.

## Completed — B2B Repositioning (2026-06-30)

- [x] `Company` entity (RCCM, NIU, type, region, badges, trust score) linked to `users` and `seller_profiles`.
- [x] Trust & verification model: verified business / cooperative / women-led / Made in Cameroon badges, dynamic trust score.
- [x] RFQ system: buyers publish sourcing requests, sellers submit bids, buyer accepts/rejects (flagship B2B feature).
- [x] Recurring orders: weekly/biweekly/monthly procurement schedules with pause/resume/cancel.
- [x] Professional order lifecycle: `pending → escrow_locked → en_preparation → expedie → en_transit → livre → complete`, with `annule`/`dispute` exception states.
- [x] Dispute resolution workflow blocking escrow release until an admin resolves (refund / release / request info).
- [x] Inventory safety: `stock_reserve` / `stock_minimum` on products, auto reserve/release on order lifecycle changes.
- [x] Automatic commission split (10% platform / 90% seller) computed on order creation.
- [x] Print-ready business documents (Purchase Order, Invoice, Delivery Note) served as browser-printable HTML with RCCM/NIU.
- [x] New dashboard pages: RFQs, Recurring Orders, Disputes, Company Profile — wired into sidebar nav.
- [x] **Bug fix (found during this work):** `OrderController` referenced non-existent columns (`isActive`, `producerId`, `amount`, `transaction_reference`) that didn't match the real `products`/`orders` schema — order creation was broken. Rewritten against the real schema with inventory reservation.
- [x] **Bug fix:** `EscrowTimeline.module.css` referenced undefined CSS variables (`--color-muted`, `--color-success`...) — rewritten against real design tokens and extended for the new 9-state lifecycle.

## Completed — Brand Integration (2026-07-01)

- [x] Integrated the official C-Connect logo (icon + wordmark) across the app: public navbar, dashboard sidebar, auth pages, footer, favicon, PWA manifest icons, and social sharing (OpenGraph/Twitter) image.
- [x] Generated a full asset pipeline from the single source PNG: transparent square icon crop, dark-green and white monochrome silhouettes, favicon.ico (16/32/48), apple-touch-icon, PWA icons (192/512), a maskable icon with safe-area padding, and a branded 1200×630 OG image — all under `frontend/public/brand/`.
- [x] **Bug fix (found during this work):** dashboard `Sidebar` was `position: fixed; top: 64px` assuming a global navbar that no longer renders on `/dashboard` routes (the navbar returns `null` there) — this left a blank 64px void above the sidebar and a 4px misalignment against the 60px topbar. Fixed by giving the sidebar its own 60px brand header and anchoring it to `top: 0`.
- [x] **Bug fix (found during this work):** on mobile (≤768px) the dashboard sidebar collapsed to `width: 0` with no way to reopen it, and the public navbar's nav links (`Marketplace`, `Fonctionnement`, `À propos`) simply disappeared with no hamburger fallback — mobile users had no way to reach primary navigation. Given the brand's stated phone-first, unstable-connectivity target users, this is a functional gap, not cosmetic — added a working slide-in drawer with backdrop for the sidebar, and a hamburger dropdown panel for the public navbar.
- [x] Fixed `manifest.ts`: `theme_color` (`#15803d`) didn't match the documented brand primary (`#13352E`), and `icons: []` meant the PWA had no installable icon at all.
- [x] Added a global `prefers-reduced-motion` rule (`globals.css`) — none existed anywhere in the app despite the brand guidelines requiring accessible motion.
- [x] Removed six stray `.rej` patch-reject files left in the repo from earlier failed patch applications (dead clutter, not wired into the app).

### Design decision — resolved (2026-07-04)

The delivered logo's icon colors (mint green `#46F78D`, blue `#0298C6`, yellow `#F4EF47`) did not match `Brand_Identity_Guidelines.md`. Resolved by recoloring the mark rather than amending the guidelines: the geometry is untouched (same four quadrant arcs + wedge, same shading/bevel), only hue was remapped via HSV so the original anti-aliasing and depth are preserved. Final: top-left/bottom-left arcs Secondary Green `#406A5A`, top-right/bottom-right arcs Primary Green `#13352E`, wedge and wordmark use Gold `#D9A441` and Primary Green respectively — the wedge recoloring actually restores the guidelines' own "golden connection node" spec, which the original PNG hadn't matched. No blue or yellow remain anywhere in the mark. Documented in `DESIGN_SYSTEM.md` → "Logo & Brand Mark System".

## Priority 1 — Remaining brand touchpoints (lower urgency, no user-facing UI exists yet)

- [ ] Loading screen / route-transition state — no dedicated loading UI exists yet to brand (Next.js default only).
- [ ] Empty states — few exist yet; brand the icon/illustration once each module's empty state is built.
- [ ] Transactional email templates and PDF export headers (Purchase Order / Invoice / Delivery Note) — currently plain browser-printable HTML with no visual branding pass.

- [x] `services/auth.ts` / backend `/auth/*` routes verified in sync (both use the `auth` prefix: `/auth/login`, `/auth/register`, `/auth/me`, `/auth/logout`) — resolved by commit `4814f36`, this note was stale.
- [ ] Run `php artisan migrate` against a real Postgres instance and verify the B2B migrations (companies, rfqs, rfq_bids, recurring_orders, disputes, inventory, order lifecycle enum rename) apply cleanly — could not run migrations in the sandbox (no DB, no Composer/Packagist network access).
- [ ] Continue typed API response contracts across remaining dashboard, negotiations, and reviews modules.
- [ ] Complete migration from localStorage bearer-token fallback to httpOnly Sanctum cookie sessions once backend cookie mode is enabled.
- [ ] Re-enable full ESLint enforcement in `next build` after resolving legacy lint debt.
- [ ] Add automated frontend tests for auth, marketplace filtering, protected dashboard routing, RFQ bidding, and order lifecycle transitions.
- [ ] Add backend feature tests for auth, product CRUD, order lifecycle, escrow release, RFQ bidding, dispute resolution, and payment webhooks.

## Priority 1 — MVP conversion and trust

- [x] Marketplace search filters for B2B criteria (region, verified business, women-led, cooperative, availability) — `CompanyFilters` already exists in `services/companies.ts`; wired via `SellerProfile` scopes directly on `ProductController::index` (`verified`, `cooperative`, `womenLed`, `availableOnly` query params) and exposed as toggle chips on the marketplace page.
- [ ] Professional company profile page (public-facing, by slug) showing catalog + badges + trust score — `companyService.getCompanyBySlugOrId` is ready, page not yet built.
- [ ] Business dashboard overview cards for RFQ count, recurring order count, low-stock warnings, open disputes (currently only on dedicated pages).
- [ ] Add password recovery and email verification flows.
- [ ] Add seller onboarding completion states and verified business trust signals.
- [ ] Add marketplace SEO metadata and product structured data.

## Priority 2 — Operational readiness

- [ ] Add centralized frontend error boundaries and observability hooks.
- [ ] Add API rate limiting and audit logging documentation.
- [ ] Add CI pipeline for frontend type-check/build and backend PHPUnit.
- [ ] Wire admin UI for dispute resolution (`DisputeController::resolve` exists; no admin screen yet).
