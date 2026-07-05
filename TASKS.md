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

## Priority 0 — Production blockers

- [ ] **Critical:** `services/auth.ts` calls `/auth/login`, `/auth/register`, `/auth/profile` — these routes don't exist in `routes/api.php` (real routes are `/login`, `/register`, `/me`). Login/register/profile-update are likely broken end-to-end. Needs a full audit of `AuthController` + `useAuth.tsx` + `auth.ts` together, not a quick patch — flagging rather than guessing at the wiring blind.
- [ ] Run `php artisan migrate` against a real Postgres instance and verify the B2B migrations (companies, rfqs, rfq_bids, recurring_orders, disputes, inventory, order lifecycle enum rename) apply cleanly — could not run migrations in the sandbox (no DB, no Composer/Packagist network access).
- [ ] Continue typed API response contracts across remaining dashboard, negotiations, and reviews modules.
- [ ] Complete migration from localStorage bearer-token fallback to httpOnly Sanctum cookie sessions once backend cookie mode is enabled.
- [ ] Re-enable full ESLint enforcement in `next build` after resolving legacy lint debt.
- [ ] Add automated frontend tests for auth, marketplace filtering, protected dashboard routing, RFQ bidding, and order lifecycle transitions.
- [ ] Add backend feature tests for auth, product CRUD, order lifecycle, escrow release, RFQ bidding, dispute resolution, and payment webhooks.

## Priority 1 — MVP conversion and trust

- [ ] Marketplace search filters for B2B criteria (region, verified business, women-led, cooperative, availability) — `CompanyFilters` already exists in `services/companies.ts`, just needs marketplace UI wiring.
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
