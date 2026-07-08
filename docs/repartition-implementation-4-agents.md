# Répartition d'implémentation optimisée — 4 agents C-Connect

Date : 2026-07-08  
Objectif : livrer l'application C-Connect complètement fonctionnelle dans les plus brefs délais, avec un découpage parallèle clair entre quatre agents : Claude1, Zai, Claude2 et l'agent CTO courant.

## 1. Principe d'organisation

La livraison doit se faire en parallèle, mais avec une règle stricte : chaque agent possède un périmètre principal, des fichiers prioritaires et des interfaces de coordination précises. Le but est de réduire les conflits Git, éviter que plusieurs agents modifient les mêmes modules critiques, et obtenir un MVP complet plutôt qu'une accumulation de corrections isolées.

Claude1 garde la responsabilité exclusive de l'authentification. Les trois autres agents ne doivent pas modifier les mécanismes de login, register, session, reset password, email verification ou stockage de token, sauf coordination explicite avec Claude1.

## 2. Répartition finale des agents

| Agent | Mission principale | Objectif de livraison | Priorité |
| --- | --- | --- | --- |
| Claude1 | Authentification et session | Stabiliser register/login/logout/me, reset password, email verification, rôle utilisateur et persistance de session | Critique |
| Zai | Backend métier transactionnel | Stabiliser commandes, escrow, paiement, inventory, RFQ, litiges et autorisations métier | Critique |
| Claude2 | Frontend produit et UX MVP | Rendre les écrans visibles réellement utilisables de bout en bout, responsive, cohérents et branchés aux bons endpoints | Critique |
| Agent CTO courant | Orchestration, intégration finale, tests, CI, production hardening | Sécuriser la livraison, intégrer les streams, corriger les conflits, ajouter les garde-fous de production et valider le MVP | Critique |

## 3. Claude1 — Authentification, comptes et session

### Objectif business

Permettre à un acheteur, vendeur ou administrateur légitime d'accéder à l'application de manière fiable, sécurisée et cohérente, sans bloquer les autres workflows métier.

### Scope technique

- Corriger définitivement l'alignement entre migration `users`, modèle `User`, `AuthController` et frontend auth.
- Stabiliser register buyer/seller sans création publique d'admin.
- Stabiliser login/logout/me/update profile.
- Stabiliser forgot password, reset password et email verification.
- Décider et documenter le mode de session final : Bearer token, cookie Sanctum, ou transition progressive.
- Fournir aux autres agents un contrat clair : champs user, rôle, statut email, company_id, seller_profile, permissions.
- Ajouter les tests auth nécessaires.

### Fichiers principaux

- `backend/app/Http/Controllers/Api/AuthController.php`
- `backend/app/Http/Controllers/Api/SocialAuthController.php`
- `backend/app/Models/User.php`
- `backend/database/migrations/2026_01_01_000001_create_users_table.php`
- Migrations correctives liées aux utilisateurs
- `backend/routes/api.php` uniquement pour routes auth
- `frontend/src/services/auth.ts`
- `frontend/src/services/session.ts`
- `frontend/src/hooks/useAuth.tsx`
- `frontend/src/app/login/page.tsx`
- `frontend/src/app/register/page.tsx`
- `frontend/src/app/forgot-password/page.tsx`
- `frontend/src/app/reset-password/page.tsx`
- `frontend/src/components/AuthForm.tsx`
- Tests auth backend et, si possible, smoke tests frontend

### Livrables obligatoires

- Inscription buyer et seller fonctionnelle sur base fraîche.
- Impossibilité de créer un compte admin depuis l'inscription publique.
- Login/logout/me fonctionnels et documentés.
- Reset password et email verification validés ou clairement feature-gated si non livrables.
- Contrat `AuthenticatedUser` publié pour Zai et Claude2.
- Tests auth critiques passants.

### Dépendances

- Bloque partiellement Zai pour les tests protégés.
- Bloque partiellement Claude2 pour le comportement dashboard/protected routes.
- Doit communiquer rapidement le contrat final de session à l'agent CTO courant.

### Ordre conseillé

1. Fix schéma user et modèle.
2. Fix register/login/me/logout.
3. Fix rôles et interdiction admin public.
4. Fix reset password/email verification.
5. Publier contrat user/session.
6. Ajouter tests.

## 4. Zai — Backend métier transactionnel

### Objectif business

Rendre les workflows métier centraux fiables : un vendeur publie un produit, un acheteur commande, le stock est réservé, le paiement verrouille l'escrow, les RFQ et litiges respectent les règles de propriété, et l'admin peut contrôler les cas sensibles.

### Scope technique

- Corriger commandes, order items, inventory et escrow lifecycle.
- Aligner `Order` model, migrations et controllers autour de `montant_vendeur`, `escrow_status`, `transaction_reference` et statuts finaux.
- Stabiliser payment initiation et webhook Mobile Money.
- Ajouter idempotence robuste et journalisation minimale des événements paiement.
- Sécuriser routes métier par rôle/propriété sans toucher à l'authentification.
- Stabiliser product CRUD vendeur, company management, RFQ, bids, disputes et admin actions.
- Ajouter tests backend métier.

### Fichiers principaux

- `backend/routes/api.php` pour routes métier hors auth
- `backend/app/Http/Controllers/OrderController.php`
- `backend/app/Http/Controllers/ProductController.php`
- `backend/app/Http/Controllers/CategoryController.php`
- `backend/app/Http/Controllers/PaymentController.php`
- `backend/app/Http/Controllers/Api/EscrowController.php`
- `backend/app/Http/Controllers/Api/PaymentWebhookController.php`
- `backend/app/Http/Controllers/Api/RfqController.php`
- `backend/app/Http/Controllers/Api/CompanyController.php`
- `backend/app/Http/Controllers/Api/DisputeController.php`
- `backend/app/Http/Controllers/Api/RecurringOrderController.php`
- `backend/app/Http/Controllers/Api/NegotiationController.php`
- `backend/app/Models/Order.php`
- `backend/app/Models/OrderItem.php`
- `backend/app/Models/Product.php`
- `backend/app/Models/Company.php`
- `backend/app/Models/Rfq.php`
- `backend/app/Models/RfqBid.php`
- `backend/app/Models/Dispute.php`
- Migrations correctives métier
- `backend/app/Policies/` si nécessaire
- `backend/tests/Feature/` workflows métier

### Livrables obligatoires

- Product CRUD vendeur fonctionnel et protégé.
- Order creation fonctionnelle avec stock réservé.
- Escrow lifecycle cohérent et accepté par la base.
- Payment initiation fonctionnel.
- Webhook signé/idempotent fonctionnel.
- RFQ create, bid, accept/reject fonctionnels avec règles d'autorisation.
- Dispute create/resolve fonctionnels avec règles d'autorisation.
- Admin stats/users/disputes/company verification protégés.
- Tests backend métier passants.

### Dépendances

- Dépend de Claude1 pour l'utilisateur authentifié, les rôles et le `sellerProfile` fiable.
- Fournit à Claude2 les contrats API finaux pour commandes, paiements, RFQ, litiges, produits et entreprises.
- Coordonne avec l'agent CTO courant pour CI, migrations et tests.

### Ordre conseillé

1. Aligner commandes, model Order et migrations.
2. Stabiliser stock/inventory.
3. Stabiliser payment initiation/webhook.
4. Ajouter autorisations métier.
5. Stabiliser RFQ/litiges/company/product.
6. Ajouter tests métier.
7. Publier les contrats API pour Claude2.

## 5. Claude2 — Frontend produit, dashboard et UX MVP

### Objectif business

Faire en sorte que l'application perçue par l'utilisateur soit complète, professionnelle, fluide et sans écran cassé. Tous les chemins visibles doivent être utilisables ou volontairement masqués.

### Scope technique

- Aligner tous les services frontend sur les endpoints réels publiés par Claude1 et Zai.
- Finaliser marketplace, company profile, checkout, dashboard seller/buyer/admin.
- Corriger les CTA, routes cassées, empty states, loading states, error states et messages UX.
- Ajouter feature flags/navigation gating pour tout module non prêt.
- Améliorer responsive mobile, accessibilité, formulaires et cohérence visuelle.
- Ne pas modifier les règles backend métier sauf bug bloquant validé avec Zai.

### Fichiers principaux

- `frontend/src/services/api.ts`
- `frontend/src/services/auth.ts` uniquement après contrat Claude1
- `frontend/src/services/orders.ts`
- `frontend/src/services/products.ts`
- `frontend/src/services/companies.ts`
- `frontend/src/services/rfqs.ts`
- `frontend/src/services/disputes.ts`
- `frontend/src/services/negotiations.ts`
- `frontend/src/services/recurring.ts`
- `frontend/src/app/page.tsx`
- `frontend/src/app/marketplace/page.tsx`
- `frontend/src/app/marketplace/[slug]/page.tsx`
- `frontend/src/app/entreprises/[slug]/page.tsx`
- `frontend/src/app/checkout/page.tsx`
- `frontend/src/app/dashboard/page.tsx`
- `frontend/src/app/dashboard/layout.tsx`
- `frontend/src/app/dashboard/orders/page.tsx`
- `frontend/src/app/dashboard/products/page.tsx`
- `frontend/src/app/dashboard/products/add/page.tsx`
- `frontend/src/app/dashboard/company/page.tsx`
- `frontend/src/app/dashboard/rfqs/page.tsx`
- `frontend/src/app/dashboard/disputes/page.tsx`
- `frontend/src/app/dashboard/recurring/page.tsx`
- `frontend/src/app/dashboard/negotiations/page.tsx`
- `frontend/src/app/dashboard/admin/*`
- `frontend/src/components/*`
- `frontend/src/components/ui/*`
- CSS modules associés

### Livrables obligatoires

- Aucun CTA principal ne pointe vers une route inexistante.
- Marketplace et fiche produit fonctionnent.
- Company profile public fonctionne.
- Checkout affiche clairement paiement, escrow et prochaine action.
- Dashboard seller : produits, stock, commandes, RFQ/litiges selon scope prêt.
- Dashboard buyer : commandes, RFQ, litiges selon scope prêt.
- Dashboard admin : stats, users, disputes, companies selon endpoints prêts.
- Modules non prêts masqués par feature flag ou état clair.
- UI responsive mobile sans overflow majeur.
- Formulaires avec labels, validation, loading, disabled state et erreurs utiles.
- `npm run type-check` et `npm run build` passants.

### Dépendances

- Dépend de Claude1 pour le contrat auth/user/session.
- Dépend de Zai pour les contrats API métier.
- Dépend de l'agent CTO courant pour valider la stratégie de feature flags et le go/no-go MVP.

### Ordre conseillé

1. Cartographier les appels frontend vs routes backend.
2. Corriger services API et types.
3. Corriger marketplace/company/checkout.
4. Corriger dashboards buyer/seller/admin.
5. Masquer les modules non prêts.
6. Polish responsive/accessibilité.
7. Build/type-check.

## 6. Agent CTO courant — intégration finale, QA, CI et production hardening

### Objectif business

Assurer que les trois streams se rejoignent en une application livrable, testée, sécurisée et exploitable, sans dérive de scope ni conflit de responsabilités.

### Scope technique

- Maintenir le plan global, arbitrer les conflits et intégrer les branches.
- Ajouter ou finaliser CI, scripts de test, documentation de déploiement et checklist staging.
- Vérifier migrations sur environnement propre.
- Vérifier que frontend et backend convergent sur les mêmes contrats.
- Réduire les risques opérationnels : DB failover, env examples, logs, audit, rate limiting, scripts dangereux.
- Effectuer le smoke test final et corriger les derniers bloqueurs d'intégration.
- Produire le rapport go/no-go final.

### Fichiers principaux

- `.github/workflows/ci.yml`
- `README.md`
- `docs/`
- `backend/phpunit.xml`
- `backend/.env.example`
- `frontend/.env.example`
- `backend/bootstrap/app.php`
- `backend/app/Http/Middleware/DatabaseFailoverMiddleware.php`
- Tests transverses dans `backend/tests/Feature/`
- Scripts de smoke test éventuels
- Ajustements mineurs dans frontend/backend uniquement pour résoudre les conflits d'intégration

### Livrables obligatoires

- CI minimale active : backend tests, frontend type-check/build.
- `.env.example` backend/frontend complets.
- DB failover contrôlé par variable d'environnement et non dangereux en production.
- Documentation runbook : install, test, migrate, deploy, rollback, smoke test.
- Checklist go/no-go finale validée.
- Merge/integration final des travaux Claude1, Zai et Claude2.
- Rapport final de livraison.

### Dépendances

- Dépend des trois agents pour livrer leurs contrats et tests.
- Doit éviter de modifier lourdement les fichiers possédés par les autres agents pendant leur implémentation.
- Intervient en dernier ressort sur bugs bloquants d'intégration.

### Ordre conseillé

1. Créer la CI et la stratégie de validation.
2. Mettre à jour docs/env/runbook.
3. Suivre les contrats publiés par Claude1/Zai/Claude2.
4. Intégrer les branches par ordre : Claude1, Zai, Claude2, hardening final.
5. Exécuter smoke test complet.
6. Corriger les derniers blockers.
7. Publier go/no-go.

## 7. Contrats de coordination obligatoires

### Contrat Claude1 vers tous

Claude1 doit publier rapidement :

- Format final de l'utilisateur authentifié.
- Champs disponibles : `id`, `email`, `fullName` ou équivalent, `role`, `company_id`, `sellerProfile`, `email_verified_at`.
- Mode session final.
- Endpoints auth utilisables.
- Codes d'erreur attendus pour 401/403/422.

### Contrat Zai vers Claude2 et CTO

Zai doit publier rapidement :

- Statuts finaux de commande et escrow.
- Payloads order create, payment initiate, webhook simulation locale.
- Payloads product create/update.
- Payloads RFQ/bid/accept/reject.
- Payloads dispute create/resolve.
- Règles d'autorisation métier.

### Contrat Claude2 vers CTO

Claude2 doit publier :

- Liste des écrans MVP réellement activés.
- Liste des modules feature-gated.
- Routes frontend finales.
- Commandes de build/type-check.
- Points UX encore à risque.

### Contrat CTO vers tous

L'agent CTO courant doit publier :

- Ordre d'intégration.
- Critères go/no-go.
- Commandes CI obligatoires.
- Liste des bloqueurs restants.
- Décisions de scope final.

## 8. Ordre d'exécution optimisé sur 48 à 72 heures

### Phase 1 — Stabilisation des contrats critiques, H0 à H12

- Claude1 : register/login/me/logout + rôle + contrat user.
- Zai : audit exact order/payment/schema + migration corrective initiale.
- Claude2 : inventaire des écrans et appels API, identification des pages cassées.
- CTO : CI minimale, checklist MVP et suivi des risques.

### Phase 2 — Implémentation métier et frontend, H12 à H36

- Claude1 : reset password, email verification, tests auth.
- Zai : order creation, escrow lifecycle, webhook, product/RFQ/dispute authorization.
- Claude2 : marketplace, checkout, dashboards, feature flags, responsive.
- CTO : env examples, DB failover, runbook, suivi intégration.

### Phase 3 — Intégration et durcissement, H36 à H60

- Claude1 : corrige régressions auth issues de l'intégration.
- Zai : corrige régressions backend métier issues du frontend et des tests.
- Claude2 : corrige UI selon contrats backend finaux.
- CTO : merge, migrations, CI, smoke tests, docs de release.

### Phase 4 — Go/no-go et polish final, H60 à H72

- Tous : corrections bloquantes uniquement.
- CTO : smoke test complet, gel du scope, rapport final.
- Claude2 : polish UX uniquement sur écrans MVP activés.
- Zai : bugfix backend uniquement, pas de nouvelle feature.
- Claude1 : bugfix auth uniquement, pas de changement de stratégie session.

## 9. Règles anti-conflits Git

- Claude1 possède les fichiers auth. Les autres agents évitent ces fichiers.
- Zai possède backend métier et migrations métier.
- Claude2 possède frontend pages/services hors auth profonde.
- CTO possède docs, CI, env, runbooks et intégration finale.
- `backend/routes/api.php` est partagé : Claude1 ne modifie que auth, Zai modifie métier, CTO modifie rate limiting si nécessaire.
- `frontend/src/services/auth.ts`, `frontend/src/hooks/useAuth.tsx` sont à Claude1 ; Claude2 ne les modifie qu'après validation.
- Les migrations doivent être additives/correctives, pas réécrites brutalement si une autre branche en dépend.
- Chaque agent doit publier un résumé clair des fichiers touchés et des contrats modifiés.

## 10. Definition of Done globale

L'application est considérée livrable uniquement si :

- Auth buyer/seller/admin fonctionne selon le scope Claude1.
- Catalogue public fonctionne.
- Seller peut créer et gérer ses produits.
- Buyer peut commander un produit disponible.
- Paiement Mobile Money simulé ou réel selon MVP verrouille escrow.
- Commandes affichent un statut cohérent.
- RFQ/litiges/admin fonctionnent ou sont explicitement feature-gated.
- Aucun écran visible important n'est cassé.
- Frontend build/type-check passent.
- Backend tests critiques passent.
- CI passe.
- `.env.example` et runbook sont à jour.
- Smoke test staging complet exécuté.

## 11. Décision de scope MVP recommandée

Pour livrer vite et proprement, le MVP activé doit contenir :

- Landing page professionnelle.
- Marketplace public.
- Company profile public.
- Auth complète via Claude1.
- Dashboard seller minimal : produits, stock, commandes, litiges.
- Dashboard buyer minimal : commandes, RFQ, litiges.
- Checkout + escrow + paiement Mobile Money simulé/initié.
- RFQ basique : création, offre, acceptation.
- Admin minimal : stats, users, disputes, companies verification.

À feature-gater si non stable avant H60 :

- Matching avancé.
- Negotiations avancées.
- Recurring orders avancées.
- Gamification avancée.
- Reviews avancées.
- Exports/documents commerciaux si les données ne sont pas stabilisées.
