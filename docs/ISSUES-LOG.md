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

## 2026-07-11 — Claude2 : RÉSOLU — Le prix négocié n'était jamais honoré à la commande

**Statut : corrigé de bout en bout** (backend + frontend), avec l'accord explicite du product owner pour sortir de mon périmètre strict frontend sur ce point précis, vu la criticité (intégrité de la facturation/revenu).

**Correctif backend :**
- Nouvelle migration `2026_07_11_000001_add_order_id_to_negotiations.php` : colonne `order_id` nullable sur `negotiations`, pour savoir si une négociation acceptée a déjà été convertie (empêche la réutilisation du même accord sur plusieurs commandes).
- `Negotiation::finalPrice()` : retourne `counter_price ?? proposed_price`.
- `OrderController::store` accepte désormais un `negotiation_id` optionnel. Si présent : vérifie que la négociation appartient bien à l'acheteur authentifié, porte sur le même produit, est `ACCEPTED`, et n'a pas déjà été convertie — sinon rejet 422 explicite. Si valide : le prix unitaire de la commande devient `negotiation->finalPrice()` au lieu de `product.prix`, et la négociation est marquée comme convertie (`order_id` renseigné) dans la même transaction que la création de la commande.
- `NegotiationController` : ajout de `slug` aux eager-loads du produit (nécessaire pour rediriger correctement vers la fiche produit réelle, voir ci-dessous).

**Correctif frontend :**
- Le lien « Passer commande » sur `dashboard/negotiations/page.tsx` pointait vers `/marketplace/product/{id}` — une route supprimée depuis (voir entrée Claude1/Dashboard-01 plus haut) — et ne transmettait même pas la négociation. Corrigé : pointe vers `/marketplace/{slug}?negotiation={id}&qty=...&price=...`, et affiche « Commande déjà passée — voir le paiement » (vers `/checkout?order=...`) si `orderId` est déjà renseigné, au lieu de permettre une double conversion.
- `marketplace/[slug]/page.tsx` (`OrderForm`) : quand le contexte de négociation est présent dans l'URL, la quantité est verrouillée à la valeur négociée, le prix unitaire affiché et le total facturé utilisent le prix négocié, avec un bandeau « Prix négocié appliqué » explicite. Le `negotiation_id` est transmis à `orderService.createOrder`. **Le prix affiché côté client n'est qu'un affichage** — la source de vérité reste le calcul serveur dans `OrderController::store`, donc aucune manipulation du prix n'est possible en modifiant l'URL.
- Badge de statut enrichi : « Accepté — commande passée » une fois `orderId` renseigné, pour ne plus jamais laisser croire qu'une négociation acceptée équivaut à une commande passée (l'ambiguïté originelle de ce bug).

**Fichiers touchés :** `backend/database/migrations/2026_07_11_000001_add_order_id_to_negotiations.php`, `backend/app/Models/Negotiation.php`, `backend/app/Http/Controllers/OrderController.php`, `backend/app/Http/Controllers/Api/NegotiationController.php`, `frontend/src/types/index.ts`, `frontend/src/services/negotiations.ts`, `frontend/src/services/orders.ts`, `frontend/src/app/dashboard/negotiations/page.tsx`, `frontend/src/app/marketplace/[slug]/page.tsx`, `frontend/src/app/marketplace/[slug]/ProductDetail.module.css`.

**Non vérifié en conditions réelles** (pas d'accès DB/Postgres dans ce sandbox) : lancer `php artisan migrate` puis tester le parcours complet négociation → commande → paiement avant démo.

---

## 2026-07-10 — Claude2 (archive — voir résolution ci-dessus)

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

### 🟢 Décision produit — Orange Money confirmé comme intégration réelle, MTN en attente

**Contexte :** décision explicite du product owner de remplacer la simulation Mobile Money par une vraie intégration, en commençant par Orange Money.

**Fait cette session :** identifié et documenté l'API Orange Money réelle (`OrangeMoneyCoreAPIS` sur https://apiis.orange.cm/store/, flux `mp/*` merchant-payment, auth OAuth2/Bearer/X-AUTH-TOKEN), swagger complet capturé, points d'ambiguïté à lever avec le support Orange listés (notamment le rôle du champ `pin` dans `/mp/pay`, et la contrainte de port 80 sur `notifUrl`). MTN : aucune API sélectionnée, décision explicite de traiter "au fur et à mesure" — ne pas basculer MTN vers un vrai appel avant qu'une intégration équivalente soit documentée.

**Détail complet :** `docs/payment-integration-orange-mtn.md` (nouveau fichier dédié). Contient aussi le besoin de composants visuels/animations dédiés par opérateur (logos officiels, micro-animation à l'étape PIN) — bloqué sur l'obtention des assets de marque.

**Prochaine action (Backend-01/Zai) :** inscription développeur sur le portail Orange, obtention des identifiants sandbox, avant tout code d'intégration.

**Fichiers touchés :** `docs/payment-integration-orange-mtn.md`, `TASKS.md`.

---

---

## 2026-07-10 (suite 2) — Claude1 (Dashboard-01)

> **⚠️ Correctif ci-dessous remplacé** : Claude2 a trouvé indépendamment le même bug (voir entrée "2026-07-10 — Claude2" ci-dessus) et a identifié une solution plus correcte — `POST /payments/mobile-money` (`PaymentController::processMobileMoney`) confirme l'escrow de façon **synchrone**, donc pas besoin de polling. Mon `pollOrderStatus` a été supprimé au merge au profit de son appel direct. Entrée conservée pour la traçabilité du diagnostic initial.

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

---

## 2026-07-10 (suite 3) — Claude1 (Dashboard-01)

### 🔴 CRITIQUE — La fiche produit renvoyait 404 pour (quasiment) tout accès normal depuis la marketplace

**C'est probablement le bug le plus grave trouvé cette session.** `Product` a une vraie colonne `slug` (unique, auto-générée), et `ProductCard` lie systématiquement vers `/marketplace/${product.slug || product.id}`. Mais `ProductController::show(Product $product)` utilise le binding Laravel implicite **par défaut**, qui ne résout `{product}` que par la clé primaire `id` (un simple entier auto-incrémenté) — aucun `resolveRouteBinding()`/`getRouteKeyName()` ne l'overridait. Résultat : chaque clic sur une carte produit envoyait au backend un slug texte (`tomates-fraiches-ab12cd`) contre une colonne `id` numérique → aucune ligne trouvée → 404 sur la quasi-totalité des accès à une fiche produit, le cœur du tunnel d'achat.

**Exactement le même bug, avec le même correctif, que j'avais déjà trouvé et corrigé sur `Company`** un peu plus tôt dans la session (`entreprises/[slug]`) — je n'avais pas pensé à vérifier si `Product` avait le même problème à ce moment-là.

**Correctif** (`app/Models/Product.php`) : ajout de `resolveRouteBinding()` acceptant slug OU id, identique au pattern déjà utilisé sur `Company`.

**Effet de bord découvert en corrigeant** : le lien "Passer commande" sur `dashboard/negotiations` pointait vers `/marketplace/product/${neg.productId}` — la route morte que j'avais supprimée dans un commit précédent. Corrigé vers `/marketplace/${neg.productId}` (fonctionne maintenant grâce au fix ci-dessus, qui accepte aussi l'id numérique).

**Règle pour la suite :** toute entité avec une colonne `slug` distincte de `id` **doit** avoir un `resolveRouteBinding()` explicite si elle est censée être accessible par slug via une route API — le binding implicite de Laravel ne le devine jamais tout seul. À vérifier sur toute future entité "publique" (RFQ ? Category ?).

**Bonus dans le même commit :** conversion de `dashboard/negotiations` d'un tableau HTML à 8 colonnes (illisible et cassé sur mobile, `overflow-x: auto` en seul filet de sécurité) vers une liste de cartes empilables, cohérente avec le reste du dashboard et mobile-first par construction.

**Fichiers touchés :** `backend/app/Models/Product.php`, `frontend/src/app/dashboard/negotiations/page.tsx`.

---

---

## 2026-07-11 — Claude1 (Dashboard-01)

### 🟡 Mobile — Timeline de commande coupée (invisible), pas juste compressée

`EscrowTimeline.tsx` (4 étapes + libellés, utilisé dans `dashboard/orders`) avait `overflow: hidden` sur son conteneur avec des étapes en `flex-shrink: 0`. Sur un écran <640px, les dernières étapes ne rétrécissent jamais et sont **découpées silencieusement** plutôt que scrollables — l'acheteur/vendeur ne voit pas où en est sa commande. Ajout d'une variante mobile compacte (barre de progression + "Étape X/4 : Libellé"), affichée uniquement sous 640px, timeline complète conservée au-dessus.

### 🔴 `dashboard/products/Products.module.css` était intégralement dupliqué

Toute la section Table/Banners/EmptyState/Responsive (`.thead`, `.trow`, `.cell`, etc.) était définie **deux fois** dans le même fichier. La cascade CSS faisait que seule la deuxième copie s'appliquait réellement — la première (~187 lignes) était du code mort. Supprimée.

**Bugs trouvés dans la copie qui s'appliquait réellement (donc en prod) :**
- `.thead`/`.trow` définissaient seulement 7 pistes de grille (`grid-template-columns`) pour 8 colonnes réelles (Produit/Catégorie/Région/Prix/Stock/Unité/Statut/Actions) — la 8ᵉ (Actions) n'avait donc pas la largeur prévue, juste une taille implicite par défaut. Corrigé à 8 valeurs.
- Sous 768px, le responsive masquait 2 colonnes par `nth-child` puis réduisait à `grid-template-columns: 1fr 1fr 1fr` — il restait quand même 5 cellules hétérogènes à ranger dans 3 colonnes, complètement désynchronisées de l'en-tête (même symptôme que le tableau `negotiations` corrigé plus tôt). Remplacé par un vrai empilement en carte sous 768px (masquage de l'en-tête, `.trow` en `flex-direction: column`).

**Autre :** `console.log('Rendu du produit:', ...)` retiré — tournait à chaque rendu de chaque produit.

**Fichiers touchés :** `frontend/src/components/EscrowTimeline.tsx`, `EscrowTimeline.module.css`, `frontend/src/app/dashboard/products/{page.tsx,Products.module.css}`. Cleanup : `backend/scratch_debug.php` supprimé (script de debug personnel committé par erreur, non référencé nulle part).

---

---

## 2026-07-11 (suite 2) — Claude1 (retour ponctuel sur Auth)

### 🔴 RÉSOLU — Les 5 échecs d'`AuthTest` signalés par Zai

**Diagnostic** (sans pouvoir exécuter les tests moi-même — pas de vendor/DB dans mon sandbox, analyse statique uniquement) : trois causes distinctes, cumulées.

1. **`email:rfc,dns` dans `AuthController::register()`** — exige une résolution DNS réelle au moment de la validation. Mes tests utilisent des domaines `@example.cm` (pas `example.com`, réservé IANA et résolvable) qui n'ont aucun enregistrement DNS réel → validation échoue → 422 au lieu du 201 attendu sur les tests d'inscription. Risque identique en production pour tout acheteur/vendeur dont le domaine mail pro a une résolution DNS lente ou capricieuse — **une règle de validation qui fait dépendre l'inscription du réseau est une mauvaise pratique en soi**, corrigée indépendamment de son rôle dans ces échecs précis.
2. **`throttle:6,1` sur `/auth/register` et `/auth/login`** (ajouté par mes soins il y a peu, protection brute-force légitime) — mais `RefreshDatabase` ne réinitialise pas le cache du rate limiter entre tests, et `AuthTest` envoie ~8 requêtes vers ces deux routes dans le même process PHPUnit. Les derniers tests recevaient un 429 inattendu.
3. **Bug dans mon propre fichier de test** : `User::factory()->create(['password' => 'Password@123!'])` — passer `password` dans le tableau de `create()` **remplace** entièrement la valeur par défaut de la factory (qui fait `Hash::make('password')`), donc le mot de passe partait en clair. `Hash::check('Password@123!', 'Password@123!')` échoue forcément (la comparaison attend un hash bcrypt en second argument) → le test "login réussit avec les bons identifiants" échouait.

**Correctifs :**
- `AuthController::register()` : `email:rfc,dns` → `email:rfc` (validation syntaxique uniquement, aucune dépendance réseau).
- `AuthTest::setUp()` : `$this->withoutMiddleware(ThrottleRequests::class)` — le comportement de throttle en lui-même n'est pas ce que cette suite teste.
- `AuthTest` : les deux `User::factory()->create(['password' => ...])` utilisent maintenant `Hash::make(...)` explicitement.

**Non re-vérifié en conditions réelles** (toujours pas d'accès DB/vendor de mon côté) — Zai ou un agent avec un environnement fonctionnel doit relancer `php artisan test --filter=AuthTest` pour confirmer les 9 tests passants avant de considérer ce point clos.

**Fichiers touchés :** `backend/app/Http/Controllers/Api/AuthController.php`, `backend/tests/Feature/AuthTest.php`.

---

---

## 2026-07-11 (suite 3) — Claude1 (nouvelle fonctionnalité transverse)

### ✨ Nouveau : Assistant IA C-Connect

Fonctionnalité que personne ne possédait encore — prise en charge de bout en bout (backend + frontend), documentée ici pour que Zai/Claude2/QA-01 sachent où elle vit et comment elle se comporte.

**Ce qui a été ajouté :**
- `backend/app/Http/Controllers/Api/AssistantController.php` — deux endpoints, tous deux dans le groupe `auth:sanctum`, throttle dédié `20,1` (indépendant du throttle générique, pour maîtriser le coût des appels API) :
  - `POST /api/assistant/chat` — chat contextuel (rôle + page courante envoyés par le frontend), historique limité à 12 messages.
  - `POST /api/assistant/improve-text` — réécrit une description produit ou un besoin RFQ à partir d'un brouillon/mots-clés.
- Appelle l'API Anthropic (`config/services.php` → `services.anthropic.api_key`/`model`, variables d'env `ANTHROPIC_API_KEY`/`ANTHROPIC_MODEL` documentées dans `.env.example`).
- **Dégradation gracieuse obligatoire** : si `ANTHROPIC_API_KEY` n'est pas configurée, l'endpoint répond quand même en 200 avec un message explicatif ("l'assistant n'est pas encore configuré") au lieu de planter — le widget reste démontrable sans clé API en environnement de dev/jury.
- Frontend : `components/AIAssistantWidget.tsx` (bulle flottante + panneau de chat, montée dans `dashboard/layout.tsx`, visible sur tout le dashboard) + bouton "Améliorer avec l'IA" sur la description produit (`dashboard/products/add`) et le besoin RFQ (`dashboard/rfqs`).

**⚠️ Pour que ça fonctionne réellement en démo :** il faut une vraie clé `ANTHROPIC_API_KEY` dans le `.env` du serveur qui fera la démo. Sans elle, le widget s'ouvre et répond, mais avec le message de dégradation — pas une panne visible, mais pas non plus la fonctionnalité complète. **Qui gère le déploiement/les secrets de prod doit s'assurer que cette clé est configurée avant la présentation au jury.**

**Non testé en conditions réelles** (pas de clé API dans ce sandbox, pas de moyen d'exécuter une vraie requête HTTP sortante non plus). Vérifié uniquement par lecture de code, `php -l`, `tsc --noEmit` et `next build`.

**Fichiers touchés :** `backend/app/Http/Controllers/Api/AssistantController.php` (nouveau), `backend/config/services.php`, `backend/routes/api.php`, `backend/.env.example`, `frontend/src/services/assistant.ts` (nouveau), `frontend/src/components/AIAssistantWidget.{tsx,module.css}` (nouveau), `frontend/src/app/dashboard/layout.tsx`, `frontend/src/app/dashboard/products/add/page.tsx`, `frontend/src/app/dashboard/rfqs/page.tsx`, `frontend/src/app/globals.css` (ajout d'un `@keyframes spin` global, réutilisable par tout style inline).

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

---

## 2026-07-11 — Zai (Backend métier transactionnel)

### 🔴 Corrigé — `escrow_status` enum incohérent entre modèle, contrôleur et base (tests SQLite)

**Symptôme :** `OrderController::update` validait des statuts B2B (`en_preparation`, `expedie`, `complete`...) que l'ancien `enum` de la migration `2026_06_26_000005` refusait sur SQLite (CHECK constraint). La migration corrective `2026_06_30_000008` censée corriger cela était **entièrement commentée**. Sur Neon (production), `escrow_status` est un `varchar(255)` sans contrainte, donc ça marchait en prod mais explosait les tests.

**Correctif :**
- Migration source `2026_06_26_000005_create_orders_table.php` : enum `escrow_status` aligné sur les 9 états finaux.
- Nouvelle migration `2026_07_08_100000_align_orders_escrow_lifecycle.php` : additive (garde-fou multi-DB, ajoute les colonnes manquantes).
- `Order` model : `$fillable` corrigé (`montant_vendeur` au lieu de `montant_net_vendeur`, `escrow_status`, `transaction_reference`), constantes `STATUS_*` et `STATUSES`, `$casts` complet.

**Fichiers touchés :** `backend/database/migrations/2026_06_26_000005_create_orders_table.php`, `backend/database/migrations/2026_07_08_100000_align_orders_escrow_lifecycle.php`, `backend/app/Models/Order.php`, `backend/app/Models/OrderItem.php`.

---

### 🔴 Corrigé — `disputes.resolu_par` était `uuid` alors que `users.id` est `bigint`

**Symptôme :** La résolution d'un litige par un admin échouait silencieusement — impossible de stocker un `users.id` (bigint) dans une colonne `uuid`.

**Correctif :** Migration `2026_07_08_100001_fix_disputes_resolu_par_type.php` : recrée la colonne en `foreignId` (bigint) avec contrainte FK vers `users`.

**Fichiers touchés :** `backend/database/migrations/2026_07_08_100001_fix_disputes_resolu_par_type.php`, `backend/app/Models/Dispute.php`.

---

### 🔴 Corrigé — `PaymentController` écrivait sur une colonne inexistante et validait une table inexistante

**Symptôme :** `PaymentController::processMobileMoney` validait `exists:Order,id` (table inexistante — le bon nom est `orders`) et faisait `$order->update(['statut' => 'paid'])` — la colonne `statut` n'existe pas sur `orders`.

**Correctif :** `PaymentController` réécrit — valide `exists:orders,id`, verrouille l'escrow via `Order::STATUS_ESCROW_LOCKED`, génère une `transaction_reference`, journalise via `Log::info`.

**Fichiers touchés :** `backend/app/Http/Controllers/PaymentController.php`.

---

### 🟡 Corrigé — `companies.seller_id` NOT NULL cassait la création d'entreprise

**Symptôme :** `Company::create()` (via `CompanyController::store` ou factory) échouait car `seller_id` est NOT NULL FK, mais le contrôleur ne le définit jamais (une company peut être créée indépendamment du seller).

**Correctif :** Migration source `2026_06_30_000001_create_companies_table.php` : `seller_id` rendu nullable avec `nullOnDelete`.

**Fichiers touchés :** `backend/database/migrations/2026_06_30_000001_create_companies_table.php`.

---

### 🟡 Corrigé — `GamificationService::updateVendorSales` incrémentait une colonne inexistante

**Symptôme :** Le webhook de paiement (`PaymentWebhookController`) dispatchait `OrderCompleted` → listener `AwardPointsForCompletedOrder` → `GamificationService::updateVendorSales()` → `increment('total_sales')`. Or la colonne s'appelle `total_sales_count` (pas `total_sales`). Le webhook retournait 500.

**Correctif :** `increment('total_sales')` → `increment('total_sales_count')`. ⚠️ **Attention :** `evaluateBadges()` contient encore 6 lectures `$stat->total_sales` qui retournent `null` (colonnes inexistantes) — les badges basés sur le nombre de ventes ne se déclencheront pas tant que ces références ne seront pas corrigées en `total_sales_count`. Je n'ai corrigé que le crash bloquant (l'`increment`), pas les lectures de badges (gamification n'est pas dans mon scope principal). À corriger côté GamificationService.

**Fichiers touchés :** `backend/app/Services/GamificationService.php`.

---

### 🟡 Découverte — `CategoryController` utilisait des colonnes inexistantes (`name_fr`, `name_en`, `icon`)

**Symptôme :** `CategoryController::store/update` validaient et écrivaient `name_fr`/`name_en`/`icon`, mais le schéma réel est `nom`/`icone`.

**Correctif :** `CategoryController` réécrit pour utiliser `nom`/`icone`/`description`/`is_active`/`order`.

**Fichiers touchés :** `backend/app/Http/Controllers/CategoryController.php`.

---

### 🟢 Amélioration — Routes admin extraites des closures vers `AdminController`

**Ancien état :** `admin/stats` et `admin/users` étaient des closures inline dans `routes/api.php`. Pas de route disputes/companies pour l'admin.

**Correctif :** Nouveau `App\Http\Controllers\Api\AdminController` avec `stats()`, `users()`, `disputes()`, `companies()`. Routes ajoutées : `GET /api/admin/disputes`, `GET /api/admin/companies`.

**Fichiers touchés :** `backend/app/Http/Controllers/Api/AdminController.php`, `backend/routes/api.php`.

---

### 🟢 Livrable — Contrats API publiés

`docs/api-contracts.md` : statuts escrow, payloads order/payment/RFQ/dispute/product/company, règles d'autorisation, liste des tests. Référence pour Claude2 et le CTO.

---

### 📋 Tests backend métier — 41 tests passants

Factories créées : `CategoryFactory`, `SellerProfileFactory`, `ProductFactory`, `OrderFactory`, `OrderItemFactory`, `CompanyFactory`, `RfqFactory`, `RfqBidFactory`, `DisputeFactory`. `UserFactory` étendue avec `buyer()`/`seller()`/`admin()`.

Suites : `OrderLifecycleTest` (7), `ProductCrudTest` (8), `PaymentWebhookTest` (6), `RfqWorkflowTest` (7), `DisputeWorkflowTest` (7), `AdminAccessTest` (6) — **toutes passantes**.

**⚠️ Bloquant côté Claude1 :** `AuthTest` a 5 échecs (register/login/logout/token-revocation) — c'est le scope de Claude1, pas le mien. Mes tests métier qui utilisent `actingAs($user, 'sanctum')` fonctionnent car ils créent le token directement via la factory, sans passer par l'API d'auth.

---

## 2026-07-11 (suite) — Zai (Backend métier transactionnel)

### 🟢 Complété — `GamificationService` : lectures `total_sales` corrigées en `total_sales_count`

**Suite de l'entrée précédente.** En plus du crash (`increment`), les 6 lectures `$stat->total_sales` dans `evaluateBadges()` et `updateQualityRating()` référençaient la colonne inexistante `total_sales` (la vraie colonne est `total_sales_count`). Les badges basés sur le nombre de ventes (woman_pioneer, trusted_producer, top_seller, quality_star, cooperative_hero) ne se déclenchaient donc jamais.

**Correctif :** `$salesCount = (int) ($stat->total_sales_count ?? 0)` extrait une fois, utilisé dans toutes les comparaisons. Les badges se déclenchent maintenant correctement.

**Fichiers touchés :** `backend/app/Services/GamificationService.php`.

---

### 🟢 Tests complémentaires — Flux négociation → commande (prix négocié honoré)

Ajout de `NegotiationOrderTest` (6 tests, tous passants) qui valide le correctif Claude2 du 2026-07-11 :

1. **Prix contre-offert honoré** — counter_price=4000 utilisé (pas le catalogue 5000), commission et montant_vendeur calculés sur le prix négocié.
2. **Prix proposé honoré** — sans contre-offre, proposed_price utilisé.
3. **Sans négociation** — prix catalogue utilisé.
4. **Négociation non-ACCEPTED** — rejet 422.
5. **Négociation déjà convertie** — rejet 422 (anti-double-conversion).
6. **Négociation d'un autre acheteur** — rejet 422.

**Total tests backend métier : 47 tests passants** (7 suites).

**Fichiers touchés :** `backend/tests/Feature/NegotiationOrderTest.php`, `backend/database/factories/NegotiationFactory.php`.
