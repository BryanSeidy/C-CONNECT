# C-Connect final implementation orchestrator plan

Audit date: 2026-07-08  
Role: Lead Software Architect / Acting CTO  
Scope: production-readiness audit and four-way parallel implementation plan  
Constraint: authentication is already assigned to a dedicated engineer and is excluded from the four implementation streams.

## 1. Project health assessment

C-Connect is in advanced pre-MVP state, not production-ready. The product has a coherent Laravel API, Next.js frontend, public catalogue, dashboards, RFQ, escrow, recurring orders, negotiations, disputes, company profiles and admin screens. The codebase shows significant recent progress: typed frontend service modules, route-level loading and error states, a public company profile, public marketplace filters, payment webhook hardening work, and admin dispute support.

The major remaining risk is not lack of features; it is contract drift between database schema, Eloquent models, controllers, frontend services and business workflows. Several critical flows can compile but still fail on a clean environment or under realistic production conditions because fields, status enums, role boundaries and route contracts are not fully aligned.

### Current strengths

- Public catalogue and company discovery are structurally present through `/catalogue/products`, `/catalogue/categories` and `/catalogue/companies` routes.
- Core B2B modules exist: companies, products, orders, RFQ, bids, recurring orders, negotiations, disputes, escrow, payment initiation and payment webhooks.
- Frontend structure is readable, with domain service modules under `frontend/src/services` and route groups for marketplace, checkout, dashboard and admin.
- Basic authorization middleware exists for seller and admin roles.
- Payment webhook controller already includes signature checking, transaction wrapping, amount verification and idempotent replay behavior, but its persistence model still needs schema/test hardening.
- Product ownership instructions are clear: production-quality UX, no prototype placeholders, accessible interfaces, typed contracts and professional SaaS standards.

### Current weaknesses

- Backend schema/model/controller alignment is still inconsistent around orders and escrow status names.
- Some protected routes are only inside `auth:sanctum` and are not additionally protected by seller/admin middleware where the business domain requires it.
- Several frontend screens assume endpoints and response shapes that must be validated end-to-end before MVP release.
- Production readiness is under-tested: the backend test suite is skeletal, feature workflows lack automated coverage, and CI is absent.
- Operational controls are incomplete: environment documentation, security headers, rate limiting, audit logging, webhook event persistence, and observability need finalization.
- The database failover middleware is globally applied to API traffic and may hide incidents or create data consistency surprises in production.

## 2. Remaining production blockers

### Blocker A: order, escrow and payment data contract drift

The `orders` migration creates `montant_vendeur` and `escrow_status`, while the `Order` model fillable/casts still refer to `montant_net_vendeur` and `statut`. Order creation writes `escrow_status` and computed financials, but Eloquent mass assignment can drop or mis-handle fields until the model is corrected. The initial `orders.escrow_status` enum still contains older English lifecycle values, while controllers use the French/B2B lifecycle values.

Impact: checkout, payment locking, lifecycle transitions, release funds, disputes and dashboards can fail or show inconsistent states.

### Blocker B: role and authorization boundaries outside authentication

Authentication itself is excluded from this plan, but domain authorization is still in scope. Product management, company badge management, category management, dispute resolution and lifecycle transitions need explicit role/policy enforcement. Some routes are protected only by login, not by domain-level seller/admin ownership rules.

Impact: authenticated users may access actions outside their business role or ownership scope.

### Blocker C: backend migrations and feature tests are insufficient as a release gate

The project lacks reliable automated verification of the complete MVP path: catalogue, seller product creation, checkout, payment initiation, webhook locking, order lifecycle, dispute opening/resolution, RFQ bid/acceptance, and admin actions.

Impact: regressions can ship unnoticed, especially because current issues are integration-contract issues rather than syntax-only issues.

### Blocker D: frontend-to-backend contract validation is incomplete

The frontend includes screens and services for orders, RFQs, negotiations, recurring orders, disputes, company management, matching and reviews. The backend now has negotiations and several B2B endpoints, but the complete route names, payload shapes, pagination envelopes, status values, empty states and error states must be reconciled domain by domain.

Impact: dashboards can appear complete but fail at runtime with 404s, malformed payloads or unhandled workflow states.

### Blocker E: production operations are incomplete

No CI workflow is present. Security headers, rate limiting, audit logs, webhook event storage, environment variable documentation, staging smoke tests and deployment rollback procedures need to be finalized.

Impact: production deployment would lack standard safety rails and incident visibility.

## 3. Priority matrix

| Priority | Issue | Domain | Reason | Recommended owner mission |
| --- | --- | --- | --- | --- |
| Critical | Align order schema, `Order` model, escrow statuses and lifecycle methods | Backend / DB / Escrow | Blocks checkout, payment, disputes and dashboards | Mission 1 |
| Critical | Verify payment initiation/webhook persistence and idempotency against schema | Backend / Payments | Prevents fake/double/incorrect payment state | Mission 1 |
| Critical | Apply domain authorization policies for seller/admin/participant ownership | Backend / Security | Prevents privilege and ownership violations | Mission 2 |
| Critical | Add backend feature tests for product, order, escrow, RFQ and disputes | Quality | Creates release gate for core MVP | Mission 4 |
| High | Reconcile frontend dashboard service contracts with backend routes | Frontend / API | Prevents runtime dashboard failures | Mission 3 |
| High | Add CI for frontend typecheck/build and backend tests | DevOps | Prevents regression merges | Mission 4 |
| High | Gate or complete non-MVP screens with feature flags and clear empty states | Frontend / UX | Avoids demo-dead screens | Mission 3 |
| High | Disable or constrain global DB failover for production | Backend / Ops | Avoids masked incidents and split-brain data | Mission 4 |
| High | Add audit logging/rate limiting docs and minimal implementation | Security / Ops | Required for admin, payment and dispute traceability | Mission 4 |
| Medium | Improve inventory thresholds, reserved stock consistency and low-stock UX | Inventory | Needed for useful seller operations | Mission 2 |
| Medium | Polish commercial documents and transactional branding | Documents / UX | Trust and professionalism | Mission 3 |
| Medium | Add OpenAPI or generated API contract | DX / API | Speeds parallel work and reduces drift | Mission 4 |
| Medium | Add production seeders and bootstrap command | Ops / Data | Makes staging/prod initialization repeatable | Mission 4 |
| Low | Remove duplicate/obsolete rescue scripts from backend root | Maintainability | Reduces operational risk before handoff | Mission 4 |
| Low | Normalize status language across UI copy | UX / API | Reduces confusion, can follow blocker fixes | Mission 3 |

## 4. Recommended implementation order

1. Freeze authentication surface with the dedicated authentication engineer and publish the final user/session assumptions to the other teams.
2. Mission 1 fixes order, escrow, payment and lifecycle data contracts first because other domains depend on stable order state.
3. Mission 2 implements domain authorization, company/product/inventory/RFQ ownership controls in parallel, avoiding authentication internals.
4. Mission 3 reconciles frontend dashboards and UX once Mission 1 publishes stable order/payment/RFQ/dispute contracts; it can start immediately on route inventory and feature flags.
5. Mission 4 establishes the release gate in parallel: CI, backend/frontend checks, smoke test scripts, environment docs and staging readiness.
6. After all four streams merge, run one integrated staging smoke test: register/login handled by auth engineer, seller onboarding, company profile, product creation, marketplace discovery, checkout, payment initiation, webhook lock, order lifecycle, RFQ bid acceptance, dispute resolution and admin review.

## 5. Risk assessment

### Highest risks

- Data contract risk: schema/model mismatch around orders and escrow can silently corrupt or drop fields.
- Workflow risk: payment and escrow states are cross-cutting and affect orders, disputes, dashboards, documents and admin stats.
- Authorization risk: domain actions need ownership checks even after authentication is fixed.
- Parallel merge risk: many teams could touch `routes/api.php`, shared services and dashboard components. Missions below deliberately split ownership boundaries to reduce collisions.
- Release confidence risk: without CI and workflow tests, production readiness cannot be defended.

### Mitigations

- Mission 1 owns order/payment/escrow files and publishes status constants/contracts early.
- Mission 2 owns domain policies and business write boundaries, not authentication mechanisms.
- Mission 3 owns frontend screens/services and consumes published contracts rather than changing backend behavior.
- Mission 4 owns tests, CI, documentation and operational hardening, and should avoid functional rewrites.
- All missions must add or update tests for their changed behavior and avoid broad refactors outside their file scope.

## 6. Four engineering missions

## Mission 1: Escrow, Orders and Payment Reliability

### Business objective

Make the commercial transaction path trustworthy and production-safe: an authenticated buyer can create an order, reserve inventory, initiate Mobile Money payment, have the webhook lock funds in escrow exactly once, and progress through a coherent lifecycle.

### Technical scope

- Align `orders` migration, `Order` model fillable/casts/attributes/scopes and controller writes.
- Standardize the MVP escrow lifecycle values in one backend source of truth.
- Verify order item creation and product stock reservation/release semantics.
- Validate payment initiation writes `transaction_reference` consistently.
- Ensure webhook idempotency depends on reliable schema fields and cannot match an unrelated pending order by amount alone unless explicitly accepted as a documented fallback.
- Add payment event persistence or a minimal audit table if not already present.
- Add backend feature tests for order creation, insufficient stock, payment initiation, valid webhook, replay webhook, wrong amount and unauthorized lifecycle change.

### Files likely to be modified

- `backend/app/Models/Order.php`
- `backend/app/Models/OrderItem.php`
- `backend/app/Models/Product.php`
- `backend/app/Http/Controllers/OrderController.php`
- `backend/app/Http/Controllers/Api/EscrowController.php`
- `backend/app/Http/Controllers/Api/PaymentWebhookController.php`
- `backend/database/migrations/2026_06_26_000005_create_orders_table.php`
- `backend/database/migrations/2026_06_26_000006_create_order_items_table.php`
- `backend/database/migrations/2026_06_30_000008_update_order_b2b_lifecycle.php`
- New corrective migration under `backend/database/migrations/`
- `backend/tests/Feature/` order/payment/escrow tests

### Dependencies

- Authentication engineer must provide a stable authenticated user for tests.
- Mission 2 must coordinate on who can update order lifecycle states.
- Mission 3 needs the final response contract for order/payment screens.

### Estimated complexity

High. This stream touches money, inventory and state transitions.

### Acceptance criteria

- `Order::create()` persists `montant_total`, `commission_plateforme`, `montant_vendeur`, `escrow_status`, `transaction_reference` and payment fields correctly.
- `escrow_status` database values match every value used by controllers, services and UI.
- Creating an order reserves stock; cancelling or terminal failure releases reserved stock according to one documented rule.
- Payment webhook with a valid signature and exact transaction reference locks escrow once.
- Replaying the same webhook returns success without duplicating side effects.
- Wrong amount, unknown transaction reference and invalid signature are rejected or quarantined with explicit logs.
- Feature tests cover the full order-to-escrow happy path and at least three failure paths.

### Definition of Done

- Backend tests for this stream pass locally.
- No model fillable/cast references fields absent from the migrations.
- The lifecycle is documented in a short backend comment or docs section consumed by Mission 3.
- No authentication internals are changed.

### Suggested implementation order

1. Inventory exact fields in `orders`, `order_items` and payment-related controller writes.
2. Add a corrective migration for missing payment/audit fields and lifecycle alignment.
3. Fix `Order` model fillable, casts, attributes and scopes.
4. Fix order creation and lifecycle transitions.
5. Harden webhook lookup/idempotency and event persistence.
6. Add feature tests and publish final status contract.

### Potential risks

- PostgreSQL enum migrations can be brittle; prefer a string plus validation/check strategy if speed and reversibility are priorities.
- Over-tightening webhook lookup may break simulated local payment flows; preserve a testing-only explicit simulation path.
- Stock reservation rules must avoid double-release when moving between terminal statuses.

## Mission 2: Domain Authorization, Company Management, RFQ and Inventory Integrity

### Business objective

Ensure that every business action is performed by the right actor: sellers manage only their products/company data, buyers manage their RFQs/orders, sellers bid only where appropriate, and admins perform administrative actions with traceability.

### Technical scope

- Add or complete Laravel policies for Product, Company, Order, Rfq, RfqBid, Dispute and Category where necessary.
- Apply seller/admin middleware only where domain role is required, excluding authentication implementation.
- Protect category writes and company badge verification as admin-only.
- Protect product creation/update/delete as seller-owned actions.
- Protect RFQ bid creation/acceptance/rejection by buyer/seller ownership rules.
- Review company profile creation/update rules for duplicate ownership and verified badge tampering.
- Review inventory fields (`stock`, `stock_minimum`, reserved/available quantities) and low-stock calculations for consistency.
- Add backend feature tests for unauthorized seller/admin/company/RFQ/product actions.

### Files likely to be modified

- `backend/routes/api.php`
- `backend/app/Http/Middleware/EnsureUserIsSeller.php`
- `backend/app/Http/Middleware/EnsureUserIsAdmin.php`
- `backend/app/Http/Controllers/ProductController.php`
- `backend/app/Http/Controllers/CategoryController.php`
- `backend/app/Http/Controllers/Api/CompanyController.php`
- `backend/app/Http/Controllers/Api/RfqController.php`
- `backend/app/Http/Controllers/Api/DisputeController.php`
- `backend/app/Models/Product.php`
- `backend/app/Models/Company.php`
- `backend/app/Models/Rfq.php`
- `backend/app/Models/RfqBid.php`
- New or existing `backend/app/Policies/` files
- `backend/tests/Feature/` authorization and RFQ tests

### Dependencies

- Authentication engineer owns identity/session mechanics and role assignment at login/register.
- Mission 1 owns order state semantics; Mission 2 should not redefine escrow lifecycle.
- Mission 3 depends on precise 403/422 error messages for UX.

### Estimated complexity

High. The surface area is broad, but files are mostly backend-domain-specific.

### Acceptance criteria

- A buyer cannot create/update/delete seller products.
- A seller cannot update another seller's products, company data or bids.
- Non-admin users cannot modify categories, verification badges, admin stats or admin disputes.
- RFQ acceptance is restricted to the RFQ owner; bid creation is restricted to eligible sellers.
- Dispute resolution is admin-only; dispute creation is restricted to order participants.
- Low-stock and available-stock values are consistent between product model, dashboard API and order reservation logic.
- Authorization failures return predictable JSON with 403 and user-safe messages.

### Definition of Done

- Domain policies/middleware are registered and covered by tests.
- Route file remains organized by domain without changing authentication route behavior.
- No frontend-only security assumptions remain for protected business actions.
- No authentication implementation files are modified except if strictly required to read role helpers already defined.

### Suggested implementation order

1. Map every protected route to required role and ownership rule.
2. Add policies for ownership-heavy models.
3. Apply middleware to broad role gates and policies inside controllers for ownership gates.
4. Add negative authorization tests before polishing positive flows.
5. Align low-stock/available-stock helpers and document expected fields for Mission 3.

### Potential risks

- Adding middleware too broadly can block legitimate buyers from mixed dashboards.
- Seller profile auto-creation inside product creation may conflict with onboarding requirements; preserve current behavior only if product leadership accepts it.
- Policy naming/registration can differ in Laravel 13 conventions; verify with framework version in this repo.

## Mission 3: Frontend MVP Workflow Completion and UX Consistency

### Business objective

Make the visible MVP feel complete and reliable for real users: marketplace discovery, company trust, seller product/inventory management, buyer checkout, orders, RFQs, disputes and admin screens should either work end-to-end or be deliberately hidden behind feature flags.

### Technical scope

- Reconcile frontend service payloads with backend route contracts for products, orders, payment initiation, companies, RFQs, negotiations, recurring orders and disputes.
- Update dashboard pages to use consistent loading, empty, error and success states.
- Add feature flags or navigation gating for modules that are not MVP-ready after backend audit.
- Polish checkout and order detail UX around escrow status, payment instructions and next actions.
- Improve responsive layout for mobile-first target users, especially marketplace, dashboard tables and forms.
- Improve accessibility: labels, keyboard navigation, focus states, status text, color contrast and semantic table/form structure.
- Apply consistent business copy and status labels without changing backend status values.
- Polish commercial document/PDF templates and transactional presentation if backend contract is stable.

### Files likely to be modified

- `frontend/src/services/api.ts`
- `frontend/src/services/orders.ts`
- `frontend/src/services/products.ts`
- `frontend/src/services/companies.ts`
- `frontend/src/services/rfqs.ts`
- `frontend/src/services/disputes.ts`
- `frontend/src/services/negotiations.ts`
- `frontend/src/services/recurring.ts`
- `frontend/src/app/marketplace/page.tsx`
- `frontend/src/app/checkout/page.tsx`
- `frontend/src/app/dashboard/page.tsx`
- `frontend/src/app/dashboard/orders/page.tsx`
- `frontend/src/app/dashboard/products/page.tsx`
- `frontend/src/app/dashboard/products/add/page.tsx`
- `frontend/src/app/dashboard/company/page.tsx`
- `frontend/src/app/dashboard/rfqs/page.tsx`
- `frontend/src/app/dashboard/disputes/page.tsx`
- `frontend/src/app/dashboard/admin/*.tsx`
- Shared UI components under `frontend/src/components/ui/`
- `backend/resources/views/documents/order-document.blade.php` only if coordinating document styling

### Dependencies

- Mission 1 publishes final order/payment/escrow statuses and response contract.
- Mission 2 publishes final 403/422 behaviors and domain permissions.
- Authentication engineer owns login/session route behavior; this mission only consumes it.

### Estimated complexity

Medium to High. The work is broad but mostly frontend-owned and can be scoped by MVP feature flags.

### Acceptance criteria

- Marketplace, company profile, seller products, checkout, orders, RFQs, disputes and admin screens no longer call missing or mismatched endpoints.
- Every dashboard page has a purposeful loading, empty, error and success state.
- Non-ready modules are hidden or labelled as unavailable rather than exposing broken navigation.
- Checkout clearly communicates escrow payment steps and post-payment state.
- Status labels are consistent across marketplace, dashboard, orders and admin.
- Mobile layouts are usable at common phone widths without horizontal overflow.
- Key forms have labels, validation messages, disabled/loading states and keyboard support.
- Frontend typecheck/build pass.

### Definition of Done

- No broad backend behavior changes are made by this mission.
- API contract changes are coordinated with Mission 1 or Mission 2.
- UI remains professional and avoids decorative emojis in application content.
- Responsive and accessibility checks are documented in the PR.

### Suggested implementation order

1. Inventory frontend service calls and compare to `backend/routes/api.php`.
2. Add a small feature flag/navigation gate utility for non-ready modules.
3. Fix the checkout/order/RFQ/dispute service contracts first.
4. Polish dashboard loading/error/empty states using existing UI components.
5. Address responsive table/card layouts and accessible form details.
6. Run typecheck/build and smoke-test core screens.

### Potential risks

- Frontend fixes may be blocked by backend contract instability; use feature flags to keep velocity.
- Dashboard pages can cause merge conflicts if multiple agents edit shared layout files; this mission should own frontend dashboard changes exclusively.
- Avoid masking real backend errors with overly generic empty states.

## Mission 4: Release Engineering, Observability, Test Coverage and Production Hardening

### Business objective

Create the production safety rails required to launch: automated verification, deployable configuration, operational visibility, rate limiting, audit trails, documentation and staging smoke tests.

### Technical scope

- Add CI pipeline for backend install/test and frontend typecheck/build.
- Add `.env.example` and `.env.testing` completeness for required services, queues, mail, database, webhook secrets, frontend/backend URLs and Mobile Money providers.
- Add backend test harness fixes so `php artisan test` can run reliably in CI with SQLite or a documented Postgres service.
- Add high-value feature tests in coordination with Missions 1 and 2; avoid duplicating their ownership.
- Add or document rate limiting for auth-adjacent public endpoints, RFQ creation, payment initiation and webhooks. Do not implement authentication changes.
- Add audit logging for admin actions, company verification, payment webhook events and dispute resolution where not covered by Mission 1.
- Review global database failover middleware and make production behavior explicit through environment configuration.
- Add deployment/staging smoke test documentation and rollback checklist.
- Clean or quarantine ad hoc backend scripts before production.
- Optionally add OpenAPI/Scribe/Scramble generation after route contracts stabilize.

### Files likely to be modified

- `.github/workflows/ci.yml`
- `backend/phpunit.xml`
- `backend/.env.example`
- `backend/.env.testing` or documented testing env setup
- `frontend/.env.example` if absent or incomplete
- `backend/bootstrap/app.php`
- `backend/app/Http/Middleware/DatabaseFailoverMiddleware.php`
- `backend/routes/api.php` for rate limit middleware only when coordinated
- `backend/tests/Feature/` and `backend/tests/Unit/`
- `frontend/package.json` only if scripts need a stable CI alias
- `README.md`
- `docs/` deployment, API and runbook documents
- Backend root rescue scripts: `create-admin.php`, `force-fix-user.php`, `final-infra-setup.php`, `fix-user-schema.php`, `align-schema.php`, etc., either moved to `tools/` or documented as non-production utilities

### Dependencies

- Missions 1 and 2 provide final backend behavior to test.
- Mission 3 provides final frontend build expectations.
- Authentication engineer provides final auth test assumptions but owns auth-specific fixes.

### Estimated complexity

Medium. Work is cross-cutting but should avoid changing business logic except for explicit operational controls.

### Acceptance criteria

- CI runs frontend typecheck/build and backend tests on pull requests.
- Backend tests can run from a clean checkout using documented environment variables.
- A staging smoke test checklist exists and covers the MVP path.
- Production `.env.example` files list all required variables without secrets.
- DB failover is disabled or explicitly controlled in production environments.
- Webhook/admin/dispute/company verification actions have auditable logs or persisted events.
- Rate limits are documented and applied to high-risk write endpoints where appropriate.
- Obsolete rescue scripts are removed from production paths or clearly quarantined.

### Definition of Done

- CI is green after all mission branches merge.
- Documentation is concise, actionable and aligned with actual commands.
- Operational changes do not alter authentication implementation.
- All checks are listed in the PR with exact commands and outcomes.

### Suggested implementation order

1. Make the backend test environment reproducible.
2. Add CI with the current known checks, allowing backend tests to become stricter as Missions 1 and 2 land.
3. Add environment examples and deployment runbook.
4. Gate DB failover by environment variable and document behavior.
5. Add audit/rate limit controls with tests where practical.
6. Clean up production-unsafe scripts and add API documentation generation if time remains.

### Potential risks

- CI may expose pre-existing failures from other streams; use clearly named TODO/failing tests only if agreed, otherwise keep CI to passing gates.
- Moving rescue scripts may break undocumented developer workflows; document replacements.
- Adding OpenAPI too early can generate stale docs if route contracts are still changing.

## 7. Parallelization guidance

- Mission 1 owns order/payment/escrow backend logic. Other missions should not edit those files except tests or consumers.
- Mission 2 owns policies, route protection and RFQ/company/product authorization logic.
- Mission 3 owns frontend pages, services and UX. It should not patch backend business logic unless explicitly paired with Mission 1 or 2.
- Mission 4 owns CI, docs, environment, observability, rate limiting, failover configuration and production hygiene.
- `backend/routes/api.php` is a shared hotspot. Mission 2 owns role/ownership route protection, Mission 4 owns rate-limiting additions, and both must sequence changes carefully.
- `frontend/src/services/*` is owned by Mission 3. Backend missions should publish contracts rather than editing frontend consumers.
- Acceptance should happen through integrated smoke tests after all streams merge, not through isolated compile checks alone.

## 8. MVP go/no-go checklist

### Functional go/no-go

- Public catalogue lists active products and company trust indicators.
- Seller can create and manage a product with valid stock and category.
- Buyer can create an order for available stock.
- Buyer can initiate Mobile Money payment and receive clear instructions.
- Valid webhook locks escrow exactly once.
- Order status progression is visible and consistent to buyer, seller and admin.
- RFQ create, bid and accept path works or RFQ is explicitly feature-gated.
- Dispute create and admin resolve path works.
- Admin cannot be accessed by non-admin users.

### Technical go/no-go

- Frontend typecheck/build pass.
- Backend migrations run on the chosen staging database.
- Backend feature tests pass in CI.
- Security-sensitive write routes have role/ownership checks.
- Webhook signing secret is required outside local/testing.
- Production environment variables are documented.
- CI is green on the release branch.
- Staging smoke test has been executed and recorded.

### Product go/no-go

- No dashboard menu leads to a visibly broken page.
- Mobile layout is usable for core marketplace, checkout and dashboard flows.
- Empty/error/loading states tell users what happened and what to do next.
- UI copy is professional, consistent and avoids prototype language.
- MVP scope is intentionally limited rather than exposing half-built advanced workflows.
