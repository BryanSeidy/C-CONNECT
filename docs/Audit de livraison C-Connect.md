# Audit de livraison C-Connect — marketplace Made in Cameroon

Date d'audit : 2026-07-07  
Objectif : identifier les anomalies bloquantes et proposer un plan d'action exécutable pour une mise en production accélérée sous 48 h.

## 1. Synthèse exécutive

Le projet dispose d'une base fonctionnelle avancée : API Laravel, frontend Next.js 15, routes catalogue/auth/commandes/RFQ, services frontend typés et build frontend valide. En revanche, l'état actuel ne doit pas être livré tel quel : plusieurs incompatibilités schéma/modèles/contrôleurs bloquent les flux critiques d'inscription, création de commande, auth SPA et webhooks.

Verdict : **pré-production uniquement après correction des tâches Critiques C01 à C08**. Pour tenir 48 h, il faut réduire le MVP à : catalogue public, inscription/connexion, dashboard vendeur simple, création produit, checkout Mobile Money simulé/initié, commandes basiques, admin minimal.

## 2. Anomalies par domaine

### 2.1 Database et migrations

- **Schéma `users` incompatible avec l'auth actuelle** : la migration crée `nom` et `prenom` obligatoires, mais le contrôleur d'inscription écrit `name` et `fullName`, colonnes absentes de la migration initiale. Impact : inscription impossible sur base fraîche.
- **Types d'identifiants incohérents** : les migrations utilisent majoritairement `bigIncrements`, mais plusieurs contrôleurs valident des UUID (`product_id` en commande) et plusieurs commentaires/docblocks évoquent des UUID. Impact : validations qui rejettent des IDs numériques.
- **Lifecycle commande incohérent** : la migration initiale définit des valeurs anglaises (`confirmed`, `shipped`, `released`), la migration B2B laisse le changement d'enum commenté et le code métier utilise des valeurs françaises (`en_preparation`, `complete`, `annule`). Impact PostgreSQL : mises à jour potentiellement rejetées par contrainte enum/check.
- **Colonnes `sync_ref` / `synced` incomplètes** : la migration de résilience ne cible pas `categories`, `order_items`, `reviews`, `rfq_bids`, `notifications`, `personal_access_tokens`, etc. Impact : synchronisation offline partielle et conflits non traçables.
- **Migration non parfaitement réversible** : `2026_07_06_000001_add_sync_resilience_columns` rend `password` nullable via `change()` sans rollback inverse ; certains `dropColumn` groupés peuvent être fragiles SQLite selon versions.
- **`disputes.id` en `increments` alors que le reste est `bigIncrements`**. Impact faible immédiat, mais incohérence de capacité/types.

### 2.2 Backend Laravel

- **Version déclarée vs installée** : le contexte annonce Laravel 12, mais `composer.lock` installe Laravel Framework 13.17.0. Impact : documentation, compatibilités middleware et hébergement à valider.
- **Contrôleur Auth non aligné au schéma** : validation `email:rfc,dns` peut rejeter des emails valides en environnement sans DNS ; création utilisateur utilise des champs non migrés ; rôle `admin` peut être choisi publiquement. Impact : fail sécurité critique.
- **Commande impossible** : `OrderController::store` exige `product_id` UUID alors que `products.id` est numérique, crée `seller_id` dans `order_items` alors que la migration ne le prévoit pas, et appelle `stock_disponible`, `reserverStock()` et `libererStock()` à vérifier/standardiser côté modèle Product. Impact : checkout cassé.
- **Modèle Order désaligné** : `$fillable` contient `montant_net_vendeur` et `statut`, alors que les migrations utilisent `montant_vendeur` et `escrow_status`. Impact : mass assignment incomplet et états non persistés correctement.
- **Autorisations faibles** : routes de création produit non protégées par middleware seller ; admin categories seulement commenté, mais routes protégées par auth sans middleware admin. Impact : tout utilisateur authentifié peut créer/modifier certains domaines selon contrôleur.
- **Webhooks paiement à durcir** : vérifier signature, idempotence transactionnelle, verrouillage de commande, journalisation et replay protection. La colonne `transaction_reference` existe, mais le contrat webhook doit être verrouillé par tests.
- **Failover DB global dangereux** : middleware de failover sur toutes les requêtes API peut masquer les erreurs de prod et modifier dynamiquement la connexion. Impact : observabilité et cohérence transactionnelle à risque.

### 2.3 Frontend Next.js

- **Build OK, mais routing marketing cassé** : la home page pointe vers `/auth/register`, alors que les routes existantes sont `/register` et `/login`. Impact : CTA d'acquisition cassés.
- **Services non couverts par backend** : frontend appelle `/matching`, `/negotiations`, `/products/{id}/reviews`, `/payments`, alors que ces routes ne sont pas présentes dans `routes/api.php`. Impact : écrans dashboard partiellement non fonctionnels.
- **Auth mixte fragile** : sessionService conserve un token côté client alors que l'objectif indique Bearer en mémoire + cookies Sanctum. Impact : surface XSS et incohérence avec `proxy.ts` qui cherche un cookie `auth-token` non créé par Laravel.
- **Doublon config Next** : présence de `next.config.ts` et `next.config.mjs`. Impact : ambiguïté de configuration selon tooling.
- **Pages placeholders** : admin users indique explicitement endpoint à implémenter ; certaines pages dashboard dépendent d'endpoints manquants. Impact : périmètre MVP à réduire ou endpoints à ajouter.

### 2.4 Infrastructure, tests, sécurité

- **Tests backend quasi vides et non exécutables sans clé APP_KEY** : PHPUnit échoue sur `No application encryption key has been specified` après installation des dépendances. Impact : absence de filet de sécurité.
- **Absence CI/CD** : pas de workflow GitHub Actions détecté. Impact : régressions non bloquées.
- **`.env.example` incomplet pour production** : secrets Mobile Money, webhook secrets, URLs frontend/backend, drivers queue/cache/session et paramètres Sanctum doivent être explicités et documentés.
- **Headers sécurité frontend/backend à compléter** : CSP, HSTS, X-Frame-Options/frame-ancestors, Referrer-Policy, Permissions-Policy.
- **Documentation API absente** : pas d'OpenAPI/Swagger exploitable. Impact : intégration frontend/back lente.

## 3. Task list priorisée

| ID | Criticité | Description | Impact | Solution proposée | Estimation |
|---|---|---|---|---|---|
| C01 | Critique | Aligner `users` migration, modèle et AuthController (`nom/prenom` vs `name/fullName`). | Inscription/login impossibles sur base fraîche. | Ajouter migration corrective ou modifier AuthController pour écrire `nom`, `prenom`; retirer `name/fullName` de fillable si non migrés ou les migrer explicitement. Ajouter test register/login. | 2-3 h |
| C02 | Critique | Interdire le rôle `admin` à l'inscription publique. | Escalade de privilèges immédiate. | Validation publique limitée à `buyer/seller`; création admin via seeder/commande protégée. | 30 min |
| C03 | Critique | Corriger IDs numériques vs UUID dans commandes/produits/RFQ. | Checkout et APIs rejettent les entités existantes. | Remplacer règles `uuid` par `integer|exists` ou migrer tout le schéma en UUID. Choix 48 h : conserver `bigIncrements`. | 1 h |
| C04 | Critique | Aligner lifecycle `orders.escrow_status`. | Statuts rejetés en PostgreSQL, escrow cassé. | Créer migration PostgreSQL/SQLite safe qui convertit la colonne en string/check cohérent avec `pending, escrow_locked, en_preparation, expedie, en_transit, livre, complete, annule, dispute`. | 2-4 h |
| C05 | Critique | Corriger `Order` fillable/casts et `OrderController::store`. | Création de commande échoue ou données financières perdues. | Remplacer `montant_net_vendeur` par `montant_vendeur`, `statut` par `escrow_status`; retirer `seller_id` de `OrderItem::create` ou migrer la colonne; standardiser stock disponible. | 2 h |
| C06 | Critique | Sécuriser routes seller/admin. | Utilisateurs authentifiés peuvent atteindre des fonctions non autorisées. | Ajouter middleware `seller` sur création/édition produit vendeur; `admin` sur catégories et badges admin; ajouter Policies pour Product/Order/Company. | 2 h |
| C07 | Critique | Durcir webhooks Mobile Money. | Double paiement, spoofing webhook, perte escrow. | Exiger signature HMAC par provider, idempotence via `transaction_reference`, transactions DB, journal `payment_events`, tests replay. | 4-6 h |
| C08 | Critique | Faire passer backend tests avec APP_KEY et SQLite. | Impossible de valider une release. | Ajouter `.env.testing` ou config phpunit `APP_KEY=base64...`; ajouter tests migration/register/order. | 1-2 h |
| H01 | Haute | Compléter `sync_ref/synced` sur toutes tables métier. | Offline sync partielle. | Étendre migration à categories, order_items, reviews, rfq_bids, payment events; générer UUID à la création via trait commun. | 3 h |
| H02 | Haute | Remplacer failover DB global par mode explicite. | Risque de masquer incident prod et divergence SQLite/Neon. | Activer uniquement en local/offline via env `DB_FAILOVER_ENABLED`; logs structurés; healthcheck DB séparé. | 2 h |
| H03 | Haute | Résoudre endpoints frontend manquants. | Dashboard erreurs 404. | Pour MVP, cacher pages matching/negotiations/reviews/payments ou ajouter routes stub contrôlées. | 2-6 h |
| H04 | Haute | Auth Sanctum cohérente. | Sessions instables, token exposé. | Choisir cookie SPA Sanctum en priorité; si Bearer mémoire, ne pas persister token en localStorage; aligner middleware/proxy sur cookie réel. | 3 h |
| H05 | Haute | Normaliser enveloppes JSON. | Frontend parsing fragile. | Réponse uniforme `{success,data,message,errors?}` pour Auth et erreurs validation via handler. | 2 h |
| H06 | Haute | Ajouter CI minimale. | Régressions non bloquées. | GitHub Actions : composer install, php artisan test SQLite, npm ci, npm run lint, npm run build. | 1 h |
| M01 | Moyenne | Générer OpenAPI. | Contrat API flou. | Installer Scramble ou Scribe; publier `/docs/api`; exporter JSON pour frontend. | 2 h |
| M02 | Moyenne | Nettoyer scripts racine backend ad hoc. | Risque exploitation/maintenance. | Déplacer scripts de dépannage dans `tools/` ou supprimer avant prod. | 1 h |
| M03 | Moyenne | Ajouter seeders MVP fiables. | Démo/prod initiale lente. | Seeds catégories, vendeur vérifié, produits, admin; commande `php artisan app:bootstrap-prod --safe`. | 2 h |
| M04 | Moyenne | Index recherche catalogue. | Performance catalogue limitée. | PostgreSQL GIN full text + fallback LIKE SQLite; index composés statut/disponible/category/region. | 2 h |
| M05 | Moyenne | Accessibilité/SEO marketplace. | Acquisition plus faible. | Corriger CTA `/register`, métadonnées pages produit, alt images, états chargement. | 1-2 h |
| F01 | Faible | Unifier `next.config`. | Ambiguïté tooling. | Conserver un seul fichier (`next.config.ts` recommandé) et supprimer l'autre. | 15 min |
| F02 | Faible | Harmoniser langue des statuts. | Dette UX/API. | Documenter mapping API français/anglais ou adopter un enum unique. | 1 h |
| F03 | Faible | Ajouter README livraison. | Onboarding lent. | Guide install, variables, commandes test/deploy, rollback. | 1 h |

## 4. Plan d'action 48 h

### H0-H6 — Stabilisation critique

1. Corriger auth/users et désactiver inscription admin.
2. Corriger commandes : ID integer, fillable, order_items, stock.
3. Ajouter `.env.testing` et faire passer migrations + tests SQLite.
4. Ajouter tests Feature : register buyer/seller, login, catalogue index/show, create product seller, create order buyer.

### H6-H18 — Sécurité et flux MVP

1. Appliquer middleware seller/admin et policies minimales.
2. Aligner escrow_status et migrations PostgreSQL/SQLite.
3. Durcir webhook paiement avec signature + idempotence.
4. Cacher ou désactiver pages frontend dont endpoints sont absents.

### H18-H30 — Livraison technique

1. Ajouter CI GitHub Actions.
2. Écrire OpenAPI minimal ou collection Postman.
3. Compléter `.env.example` production.
4. Ajouter seeds MVP et compte admin hors inscription publique.

### H30-H48 — Préproduction et go/no-go

1. Déployer backend staging avec PostgreSQL réel.
2. Déployer frontend staging avec variables prod-like.
3. Exécuter smoke E2E : inscription, login, création produit, catalogue, commande, paiement simulé, webhook, dashboard.
4. Geler périmètre, activer monitoring/logs, préparer rollback.

## 5. Recommandations stratégiques

- **Réduire le MVP** : livrer catalogue + auth + vendeur produit + commande + paiement webhook + admin stats. Reporter RFQ avancé, recurring orders, negotiations, matching et gamification avancée.
- **Feature flags frontend** : masquer les menus non prêts via `NEXT_PUBLIC_FEATURE_RFQ`, `NEXT_PUBLIC_FEATURE_RECURRING`, etc.
- **Mode maintenance backend** : prévoir `php artisan down --render` pendant migrations prod et rollback documenté.
- **Seeds production contrôlés** : créer catégories et admin via commande idempotente, jamais via inscription publique.
- **Observabilité immédiate** : logs JSON, Sentry/Bugsnag frontend+backend, alertes webhook paiement, healthcheck `/up` + `/api/health/db`.
- **Contrat API d'abord** : générer OpenAPI après corrections critiques et brancher les services frontend dessus.

## 6. Checklist pré-livraison

### Fonctionnel

- [ ] Inscription buyer/seller fonctionne sur base fraîche PostgreSQL.
- [ ] Connexion/logout Sanctum fonctionnent depuis le domaine frontend final.
- [ ] Catalogue public liste et détail produits sans auth.
- [ ] Vendeur peut créer/modifier/supprimer seulement ses produits.
- [ ] Acheteur peut créer commande avec stock réservé.
- [ ] Webhook paiement verrouille escrow une seule fois même en replay.
- [ ] Admin ne peut être créé que par commande/seeder sécurisé.

### Technique

- [ ] `php artisan migrate:fresh --seed` passe en SQLite et PostgreSQL staging.
- [ ] `php artisan test` passe.
- [ ] `npm run lint` passe.
- [ ] `npm run build` passe.
- [ ] CI verte sur branche de release.
- [ ] `.env.example` couvre toutes variables obligatoires.

### Sécurité

- [ ] CORS limité aux domaines frontend prod/staging.
- [ ] Cookies `Secure`, `HttpOnly`, `SameSite=Lax/None` selon domaine, `SESSION_DOMAIN` correct.
- [ ] CSRF Sanctum validé en SPA.
- [ ] Webhooks signés + horodatés + idempotents.
- [ ] Headers sécurité activés via Nginx/Vercel/Laravel.
- [ ] Aucun script de dépannage public en production.

## 7. Commandes exécutées pendant l'audit

- `rg --files -g '!vendor' -g '!node_modules'`
- `composer install --no-interaction --prefer-dist`
- `APP_ENV=testing DB_CONNECTION=sqlite DB_DATABASE=':memory:' php artisan migrate:fresh --force`
- `APP_ENV=testing DB_CONNECTION=sqlite DB_DATABASE=':memory:' php artisan test`
- `npm run lint`
- `npm run build`

## 8. Résultats des checks

- Backend migrations SQLite : **pass** sur base mémoire.
- Backend tests : **fail** faute de `APP_KEY` en environnement de test.
- Frontend lint/typecheck : **pass**.
- Frontend production build : **pass**.
