# C-Connect release runbook

Date: 2026-07-08
Owner: CTO integration stream

## Purpose

This runbook defines the minimum repeatable path for validating, staging and releasing C-Connect. It is intentionally narrow: it protects the MVP while Claude1, Zai and Claude2 complete their assigned implementation streams.

## Local verification commands

Backend:

```bash
cd backend
composer install --no-interaction --prefer-dist
php artisan test
```

Frontend:

```bash
cd frontend
npm ci
npm run type-check
npm run build
```

## Required environment files

Backend must start from `backend/.env.example` and define at least:

- `APP_KEY`
- `APP_ENV`
- `APP_DEBUG`
- `APP_URL`
- `FRONTEND_URL`
- `DB_CONNECTION`
- `DB_HOST`
- `DB_PORT`
- `DB_DATABASE`
- `DB_USERNAME`
- `DB_PASSWORD`
- `DB_SSLMODE`
- `DB_FAILOVER_ENABLED`
- `CCONNECT_WEBHOOK_SECRET`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URL` when Google OAuth is enabled
- mail, queue, cache and session settings appropriate to the environment

Frontend must start from `frontend/.env.example` and define:

- `NEXT_PUBLIC_API_URL`
- feature flags for RFQ, recurring orders, negotiations, gamification and reviews

## Database failover policy

`DB_FAILOVER_ENABLED` must be `false` in production unless an explicit incident runbook authorizes local SQLite fallback. The default production behavior must surface database incidents instead of silently writing to a local file.

Allowed values:

- Local offline demonstration: `DB_FAILOVER_ENABLED=true`
- CI, staging and production: `DB_FAILOVER_ENABLED=false`

## Staging deployment checklist

1. Pull the release branch.
2. Install backend dependencies with Composer.
3. Install frontend dependencies with npm.
4. Generate or inject a production-grade `APP_KEY`.
5. Configure PostgreSQL and run migrations.
6. Configure `CCONNECT_WEBHOOK_SECRET`.
7. Build the frontend against the staging API URL.
8. Run backend tests.
9. Run frontend type-check and build.
10. Run the MVP smoke test below.

## MVP smoke test

1. Create or use a buyer account through Claude1's auth flow.
2. Create or use a seller account with a seller profile.
3. Seller creates a product with stock greater than zero.
4. Public marketplace lists the product.
5. Buyer opens the product and starts checkout.
6. Buyer creates an order.
7. Buyer initiates Mobile Money payment.
8. Backend receives a valid signed webhook and locks escrow once.
9. Buyer and seller can see the same order status.
10. Buyer or seller opens a dispute when allowed.
11. Admin resolves the dispute.
12. RFQ create, bid and accept flow works if the RFQ feature flag is enabled.
13. Disabled feature-flag modules are not visible in navigation.

## Rollback procedure

1. Stop new deployments.
2. Put the backend in maintenance mode if migrations or payment flows are affected.
3. Revert to the previous known-good application release.
4. Restore the previous frontend deployment.
5. Re-run the smoke test against the restored version.
6. If a migration introduced incompatible data changes, restore from the latest verified database backup.
7. Record the incident, root cause and corrective action before attempting another release.

## Go/no-go criteria

Go only if all conditions are true:

- Backend tests pass in CI.
- Frontend type-check and build pass in CI.
- Staging migrations complete successfully.
- MVP smoke test passes.
- No visible MVP screen is broken.
- Payment webhook signature is required outside local/testing.
- `DB_FAILOVER_ENABLED=false` in staging and production.
- Feature flags hide incomplete non-MVP modules.
