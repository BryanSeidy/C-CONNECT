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

**Fichiers touchés :** `frontend/src/app/marketplace/[slug]/page.tsx`, `frontend/src/app/marketplace/[slug]/ProductDetail.module.css`. Route morte supprimée : `frontend/src/app/marketplace/product/[id]/`.

---

---

## 2026-07-10 (suite 2) — Claude1 (Dashboard-01)

### 🔴 Critique — Le paiement affichait toujours "succès" après 8 secondes, peu importe le résultat réel

**Symptôme potentiel :** dans `PaymentPanel.tsx` (composant de paiement Mobile Money du checkout), après avoir soumis le numéro de téléphone, le code faisait `await new Promise(resolve => setTimeout(resolve, 8000))` puis passait **inconditionnellement** à l'étape "succès" — sans jamais vérifier si le paiement avait réellement abouti.

**Cause :** la confirmation réelle d'un paiement Mobile Money arrive de façon asynchrone via un webhook opérateur (`POST /payments`, traité par `PaymentWebhookController`), qui met à jour `order.escrow_status`. Le frontend n'a aucun moyen de savoir quand ce webhook arrive — il n'existe pas d'endpoint de statut dédié ni de WebSocket/SSE. Le délai fixe de 8s était visiblement un placeholder jamais remplacé.

**Correctif** (`components/checkout/PaymentPanel.tsx`) : après l'initiation, le composant interroge maintenant `GET /orders/{id}` (endpoint déjà existant) toutes les 3 secondes pendant 60 secondes maximum, jusqu'à ce que `escrowStatus` change de `pending`. Trois issues possibles : succès réel (statut changé), échec explicite (`annule`), ou **timeout honnête** — un nouvel état `timeout` qui informe l'utilisateur que ça continue en arrière-plan plutôt que d'annoncer un faux succès.

**Autres corrections mineures dans la même zone :**
- `app/checkout/page.tsx` : le garde `if (!user)` ne tenait pas compte de `isLoading` — un utilisateur déjà connecté rechargeant `/checkout?order=X` voyait un flash "Connectez-vous" avant que la session ne se résolve.
- Incohérence bouton activé à 8 chiffres / validation exigeant 9 — aligné sur 9.

**Fichiers touchés :** `frontend/src/components/checkout/PaymentPanel.tsx`, `frontend/src/app/checkout/page.tsx`.

**Amélioration future pour Backend-01** : un vrai endpoint `GET /payments/{reference}/status` ou un WebSocket serait plus efficace que ce polling toutes les 3s ; pas bloquant pour l'MVP.

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
