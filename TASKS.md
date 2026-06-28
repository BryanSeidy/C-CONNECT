# C-CONNECT Backlog

## Completed

- [x] Harden authentication redirects to prevent open-redirect abuse while preserving safe deep links.
- [x] Improve login/register UX with client-side validation, field-level errors, disabled loading submit states, autocomplete hints, and post-registration success feedback.
- [x] Restore production frontend build compatibility on Next.js 15 dynamic route typing.
- [x] Add the missing ESLint toolchain dependency so the configured Next.js lint stack can be installed and evolved intentionally.
- [x] Fix the reusable Input component hook ordering issue detected by the stricter React lint rules.

## Priority 0 — Production blockers

- [ ] Complete typed API response contracts to remove `any` usage across dashboard, marketplace, auth, and service modules.
- [ ] Re-enable full ESLint enforcement in `next build` after resolving legacy lint debt.
- [ ] Replace localStorage bearer-token persistence with an httpOnly cookie/session strategy coordinated with the Laravel API.
- [ ] Add automated frontend tests for auth, marketplace filtering, protected dashboard routing, and order creation.
- [ ] Add backend feature tests for auth, product CRUD, order lifecycle, escrow release, roles, and payment webhooks.

## Priority 1 — MVP conversion and trust

- [ ] Add password recovery and email verification flows.
- [ ] Add seller onboarding completion states and verified business trust signals.
- [ ] Add marketplace SEO metadata and product structured data.
- [ ] Improve payment/escrow status UX with clear buyer and seller timelines.

## Priority 2 — Operational readiness

- [ ] Add centralized frontend error boundaries and observability hooks.
- [ ] Add API rate limiting and audit logging documentation.
- [ ] Add CI pipeline for frontend type-check/build and backend PHPUnit.
