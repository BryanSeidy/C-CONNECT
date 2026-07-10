# Journal des bugs & incohérences — partagé entre agents

Ce fichier est la référence unique pour tout bug, régression ou incohérence découvert par un agent et pouvant affecter le travail d'un autre agent. Chaque entrée doit rester lisible en 30 secondes : quoi, où, pourquoi c'est arrivé, ce qui a été fait.

**Règle** : avant de modifier un fichier qui ne vous appartient pas (voir `docs/auth-contract.md` §6 pour les fichiers auth), consultez ce journal — le problème que vous rencontrez a peut-être déjà une entrée ici.

---

## 2026-07-09 — Claude1 (Dashboard-01 depuis ce jour, ex-Auth)

### 🟡 Blocage cross-agent — Aucune API pour les notifications

**Constat :** en démarrant l'audit Dashboard-01, aucune UI de notifications n'existe côté frontend (attendu dans le scope Dashboard-01). Côté backend, seule la table `notifications` (migration Laravel standard, `database/migrations/2026_06_29_181704_create_notifications_table.php`) et un `app/Jobs/SendOrderNotificationJob.php` existent — **aucune route API pour lister/marquer comme lue une notification**.

**Ce qu'il faut côté Backend-01/Zai** (pas dans mon scope de fichiers, je ne le fais pas moi-même) :
- `GET /api/notifications` (paginé, filtrable par lu/non-lu)
- `PATCH /api/notifications/{id}/read` ou `POST /api/notifications/mark-all-read`
- Idéalement le nombre de non-lus dans le header ou un endpoint dédié `GET /api/notifications/unread-count` pour un badge léger dans la topbar sans charger toute la liste.

**En attendant**, je me concentre sur les écrans dashboard qui ne dépendent pas de cette API manquante.



### 🔴 Critique — Boucle de redirection après connexion Google + 401 répétés sur `/auth/me`

**Symptôme :** après une connexion Google réussie, l'app redirige vers `/dashboard` puis rebondit en boucle, avec des appels répétés à `GET /auth/me` retournant 401.

**Cause réelle :** condition de course dans `frontend/src/hooks/useAuth.tsx`. Au montage de `AuthProvider` (racine de l'app), un appel `getProfile()` de validation partait systématiquement, **même sans token en mémoire** — ce qui est garanti de renvoyer 401 la toute première fois qu'on atterrit sur `/auth/social/callback` (le token n'est extrait du fragment d'URL qu'ensuite, par l'effet de la page elle-même). Ce premier appel (non authentifié) pouvait résoudre **après** l'appel authentifié `refreshProfile()` déclenché par la page de callback, et son `.catch()` remettait `user` à `null` juste après qu'il ait été correctement défini → le garde d'auth du dashboard voyait `isAuthenticated=false` → redirection vers `/login` → boucle.

**Correctif** (`frontend/src/hooks/useAuth.tsx`) :
- L'appel de validation au montage est **sauté entièrement** s'il n'y a pas de token en mémoire (`getMemoryToken()`).
- Ajout d'un compteur de génération (`profileRequestId`) partagé entre la validation au montage et `refreshProfile()` : toute réponse qui arrive après qu'une requête plus récente ait déjà tranché est ignorée, au lieu d'écraser l'état.

**Fichiers touchés :** `frontend/src/hooks/useAuth.tsx`.

**Si vous recroisez un symptôme similaire ailleurs** (état qui se réinitialise de façon inattendue après un appel API) : suspectez une réponse obsolète qui arrive en retard et écrase un état plus frais. Le pattern de fix est le compteur de génération ci-dessus, réutilisable tel quel.

---

### 🔴 Critique — Mots de passe stockés en clair après réinitialisation

**Symptôme potentiel (non encore observé en prod, détecté par lecture de code) :** après un `POST /auth/reset-password`, le nouveau mot de passe aurait été stocké **en clair** en base.

**Cause :** un commit (`56a4a13`, "Update dependencies and enhance authentication flow") a retiré le cast Eloquent `'password' => 'hashed'` sur `App\Models\User` (pour éviter un double-hash sur `register()`, qui hash désormais explicitement via `Hash::make()` — ce point-là est correct). Mais `AuthController::resetPassword()` faisait `$user->forceFill(['password' => $password])->save()` en comptant sur ce cast pour hasher automatiquement. Sans le cast, `$password` (en clair, déjà validé mais jamais hashé) partait tel quel en base.

**Correctif** (`backend/app/Http/Controllers/Api/AuthController.php`) : `resetPassword()` hash désormais explicitement via `Hash::make($password)`, cohérent avec `register()` et les seeders qui font déjà de même sans compter sur le cast.

**Règle pour la suite :** le cast `'hashed'` est retiré définitivement. **Toute écriture de `password` sur `User` doit passer par `Hash::make()` explicitement** — ne jamais assumer qu'un cast le fera automatiquement. Vérifié : `AuthController` (register, resetPassword), `UserSeeder`, `UserFactory` respectent déjà cette règle.

**Fichiers touchés :** `backend/app/Http/Controllers/Api/AuthController.php`.

---

### 🟡 Répété deux fois — L'email de vérification est régulièrement commenté puis oublié

**Symptôme :** `$user->sendEmailVerificationNotification()` dans `AuthController::register()` a été commenté à deux reprises par des commits de debug différents (probablement pour isoler un bug SQL sans rapport), et jamais recommenté avant push.

**Correctif :** restauré. **Si vous devez commenter temporairement une ligne pour déboguer, remettez-la avant de committer/pusher** — sinon la fonctionnalité disparaît silencieusement pour tout le monde sans qu'aucune erreur ne le signale.

**Fichiers touchés :** `backend/app/Http/Controllers/Api/AuthController.php`.

---

### 🟢 Mineur — `console.log` de debug laissés dans le code

Deux `console.log` de debug (un dans `useAuth.tsx::register()`, un dans `api.ts` sur **chaque requête authentifiée**) sont restés dans un commit poussé. Retirés — ce genre de log en prod, surtout sur l'intercepteur de requête, pollue la console à chaque appel API et peut faire fuir des infos de debug en environnement de démo/jury.

---

### 🟢 Limite connue — Graphiques admin basés sur un échantillon de 50 entreprises

Les nouveaux graphiques de `dashboard/admin/stats` (répartition par type / statut de vérification) sont calculés côté client à partir de `companyService.getCompanies({ pageSize: 50 })` — le maximum autorisé par `CompanyController::index` (`min($pageSize, 50)`). Tant que la plateforme a moins de ~50 entreprises, les graphiques sont exacts. Au-delà, ils ne représentent qu'un échantillon (les 50 mieux classées par `trust_score`), pas la totalité.

**Amélioration future pour Backend-01** : un endpoint dédié type `GET /admin/stats/companies-by-type` faisant un vrai `GROUP BY` en base serait plus correct et plus léger que de paginer 50 lignes côté client. Pas bloquant pour l'MVP actuel.

---

## 2026-07-09 (suite) — Claude2

### 🟡 Deux modèles "profil vendeur" en parallèle — `SellerProfile` est mort côté frontend

**Constat :** en construisant un checklist d'onboarding vendeur, j'ai trouvé deux entités backend qui se recoupent : `Company` (table `companies` — rccm, niu, trustScore, badges KYB) est le modèle **réellement utilisé** par tout le frontend (`dashboard/company`, `entreprises/[slug]`, marketplace). `SellerProfile` (table `seller_profiles` — business_name, region, is_female_owned, quality_score, verification_status) existe aussi côté backend avec ses propres routes (`Route::apiResource('/seller-profiles', ...)`), mais **aucun appel frontend ne l'utilise** — le type TypeScript `SellerProfile` dans `types/index.ts` n'a même pas les bons noms de colonnes (`businessSector`/`nationalIdRef`/`isOnboardingComplete` n'existent pas dans la vraie migration).

**Second problème, plus sérieux pour Backend-01/Zai :** `SellerProfileController` (`app/Http/Controllers/SellerProfileController.php`) n'implémente que `show()` et `update()`. Les routes `index`/`store`/`destroy` sont bien enregistrées via `apiResource`, donc si quoi que ce soit les appelle un jour, ce sera une erreur fatale "Call to undefined method". Je n'ai pas touché ce contrôleur (backend, hors de mon scope) — à trancher côté Backend-01 : soit compléter le contrôleur, soit déprécier `seller_profiles` au profit de `companies` si c'est bien un doublon issu d'une itération antérieure.

**Ce que j'ai fait côté frontend (mon scope) :** l'onboarding checklist vendeur (`dashboard/page.tsx`) utilise `Company` + le nombre de produits — pas `SellerProfile`, qui reste non branché.

---

---

## 2026-07-10 — Claude1 (Dashboard-01)

### 🟡 Navigation par rôle incomplète — pages sans garde + liens manquants dans la Sidebar

**Constat en travaillant la navigation par rôle :** seule `dashboard/gamification` utilisait `RoleGuard` (composant déjà existant, solide, pas modifié). `dashboard/products`, `dashboard/products/add` (vendeur), et l'admin-guard sur `/dashboard/admin/*` (déjà ajouté par Claude2) étaient protégés, mais rien n'empêchait un acheteur de taper `/dashboard/products/add` dans l'URL et voir le formulaire de création produit.

**Corrigé :** `products`, `products/add` → `RoleGuard allowedRoles={['seller']}`.

**Découverte plus intéressante en vérifiant `negotiations` et `recurring` avant de les restreindre à un rôle :** les deux sont en réalité **bidirectionnels côté backend** (négociation : le vendeur accepte, l'acheteur contre-propose ; commande récurrente : `RecurringOrderController::updateStatus` autorise explicitement `buyer_id` OU `seller_id` à mettre en pause/annuler). Mais la Sidebar ne montrait `Négociations` qu'aux vendeurs, et `Récurrentes` qu'aux acheteurs — **un acheteur ne pouvait pas atteindre `/dashboard/negotiations` via l'UI, et un vendeur ne pouvait pas atteindre `/dashboard/recurring`**, alors que le backend attendait déjà les deux.

**Corrigé :** ajout des liens manquants dans `SELLER_LINKS`/`BUYER_LINKS` (`components/Sidebar.tsx`), et `RoleGuard allowedRoles={['buyer', 'seller']}` sur les deux pages (exclut juste l'admin, qui n'a rien à y faire).

**Règle pour la suite :** avant de restreindre une page à un rôle unique, vérifier le contrôleur backend correspondant — plusieurs workflows B2B sont conçus bidirectionnels (acheteur ↔ vendeur) et une restriction trop stricte côté UI casserait un flux déjà supporté par l'API.

**Fichiers touchés :** `frontend/src/components/Sidebar.tsx`, `frontend/src/app/dashboard/{products,products/add,negotiations,recurring}/page.tsx`.

---

---

## 2026-07-10 (suite) — Claude1 (Dashboard-01)

### 🔴 Critique — Le bouton "Commander" de la fiche produit ne commandait rien

**Symptôme :** sur `/marketplace/[slug]` (la vraie page produit — `marketplace/product/[id]` était une route morte, jamais liée nulle part, supprimée), le bouton "Commander avec paiement sécurisé" faisait `<Link href="/dashboard/orders?product=X&qty=Y">`. La page `dashboard/orders` **ignore totalement ces query params** — l'acheteur atterrissait juste sur sa liste de commandes existantes, sans que rien ne se passe. `orderService.createOrder()` existait déjà dans `services/orders.ts` mais n'était appelé **nulle part dans toute l'app**.

**Correctif** (`app/marketplace/[slug]/page.tsx`) : `OrderForm` collecte maintenant ville + téléphone (adresse optionnelle) dans un mini-formulaire, appelle réellement `orderService.createOrder()`, puis redirige vers `/checkout?order={id}` (le vrai flux de paiement, qui existait déjà mais n'était jamais atteint depuis la marketplace).

**Aussi ajouté** (demande explicite mobile-first) : barre d'action fixe en bas d'écran sur mobile (prix + bouton "Commander", ancre vers le formulaire), avec support `env(safe-area-inset-bottom)` pour les iPhone à encoche.

**Fichiers touchés :** `frontend/src/app/marketplace/[slug]/page.tsx`, `frontend/src/app/marketplace/[slug]/ProductDetail.module.css`. Route morte supprimée : `frontend/src/app/marketplace/product/[id]/` (mes propres correctifs mobile/produits-similaires de la veille sur cette route sont donc caducs — reportés implicitement sur `[slug]`, à revérifier).

---

## 2026-07-10 — Claude2

### 🔴 Critique cross-agent — Le prix négocié n'est jamais honoré à la commande

**Constat :** en auditant le tunnel de conversion landing → paiement, j'ai trouvé que `NegotiationController::updateStatus` (backend) met à jour uniquement le statut de la négociation — il ne crée **aucune commande**. Pire : le frontend affichait un badge « Accepté (Commande générée) » qui laissait croire qu'une commande existait réellement. Corrigé côté frontend (badge honnête + bouton « Passer commande » vers la fiche produit).

**Le vrai problème reste côté backend, hors de mon scope :** `OrderController::store` calcule toujours `montant_total` à partir de `$product->prix` (prix catalogue en vigueur) — il n'existe **aucun paramètre pour honorer un prix négocié** (`proposedPrice`/`counterPrice` d'une négociation acceptée). Concrètement, un acheteur qui négocie et obtient un tarif réduit, puis clique sur « Passer commande », se retrouve à payer le prix catalogue plein tarif — la négociation n'a aucun effet sur le montant réellement facturé. C'est un trou critique dans la proposition de valeur B2B du produit (négociation = fonctionnalité phare), et un problème de confiance direct si un acheteur s'en aperçoit après avoir négocié de bonne foi.

**Ce qu'il faudrait côté Backend-01/Zai :** soit un endpoint `POST /negotiations/{id}/checkout` qui crée directement la commande au prix négocié (le plus propre, évite toute manipulation de prix côté client), soit un paramètre `negotiation_id` optionnel sur `OrderController::store` qui, si présent et que la négociation est `ACCEPTED` et appartient bien à l'acheteur authentifié, utilise `counter_price ?? proposed_price` au lieu de `product.prix`.

**Fichiers touchés (frontend, ce qui a pu être fait dans mon scope) :** `frontend/src/app/dashboard/negotiations/page.tsx` (badge honnête + CTA de continuation).

### 🔴 Critique — Le paiement Mobile Money simulait un succès sans jamais vérifier le paiement réel

**Constat :** `PaymentPanel.tsx` appelait `POST /payments/mobile-money/initiate` (qui ne touche jamais `escrow_status`, se contente de retourner des instructions PIN) puis affichait « Séquestre activé » après un simple `setTimeout(8000)` sans aucune vérification — l'acheteur voyait un succès que le paiement ait réellement abouti ou non.

**Correctif :** appel de confirmation ajouté vers `POST /payments/mobile-money` (`PaymentController::processMobileMoney`, déjà présent côté backend et explicitement commenté « conservé pour les tests et la simulation front-end », verrouille réellement l'escrow). Le succès n'est affiché que si cet appel réussit réellement.

**Fichiers touchés :** `frontend/src/components/checkout/PaymentPanel.tsx`, `frontend/src/app/checkout/page.tsx` (clarification de l'affichage de la commission).

### 🟡 Accueil acheteur froid + incohérence FAQ paiement

**Constat :** un nouveau buyer atterrissait sur `/dashboard` juste après inscription face à 5 KPI à zéro sans aucun guidage (le vendeur, lui, avait déjà une checklist d'onboarding chaleureuse). La FAQ de la landing page promettait aussi un « virement professionnel » comme moyen de paiement — qui n'a jamais existé dans `PaymentPanel.tsx` (Mobile Money uniquement).

**Correctif :** `BuyerWelcomePanel` (3 étapes : parcourir → commander/négocier → payer en séquestre) affiché uniquement si l'acheteur n'a encore aucune commande. FAQ corrigée pour ne promettre que le Mobile Money réellement supporté, + nouvelle question sur la commission (10%, vérifié contre `Order::computeFinancials`) pour qu'aucune surprise n'attende l'acheteur au moment de payer.

**Fichiers touchés :** `frontend/src/app/dashboard/page.tsx`, `frontend/src/app/page.tsx`.

---

## Modèle pour les prochaines entrées

```
## AAAA-MM-JJ — <Agent>

### 🔴/🟡/🟢 <Titre court>

**Symptôme :** ce que l'utilisateur/l'agent observe.
**Cause :** pourquoi, techniquement.
**Correctif :** ce qui a été changé.
**Fichiers touchés :** liste.
```
