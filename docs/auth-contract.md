# Contrat d'authentification — publié par Claude1

Date : 2026-07-08
Statut : stable, applicable immédiatement par Zai, Claude2 et l'agent CTO.

Ce document est la référence unique pour tout ce qui touche à l'utilisateur authentifié, la session et les endpoints auth. Les autres agents ne modifient pas les fichiers listés en §6 sans coordination explicite avec Claude1.

## 1. Mode de session final

**Bearer token (Laravel Sanctum personal access token). Pas de cookie, pas de session Laravel côté auth API.**

- `config/sanctum.php` : `'stateful' => []`, `'expiration' => 1440` (24h).
- Le frontend envoie `Authorization: Bearer <token>` sur toute route protégée.
- Le token vit en mémoire JS + `sessionStorage` côté frontend (jamais `localStorage`). Il est restauré automatiquement au chargement du module `services/api.ts`, donc un refresh de page ne déconnecte pas l'utilisateur tant que le token n'a pas expiré.
- Pas de refresh token pour l'instant : à l'expiration (24h), l'utilisateur doit se reconnecter. Un flag `token_expired` pourra être ajouté plus tard si nécessaire — à coordonner avec Claude1 si un agent en a besoin.

## 2. Forme finale de l'utilisateur authentifié

Réponse JSON de `POST /api/auth/login`, `POST /api/auth/register`, `GET /api/auth/me` :

```json
{
  "message": "...",
  "data": {
    "user": {
      "id": 42,
      "nom": "Ngono",
      "prenom": "Marie",
      "email": "marie.ngono@example.cm",
      "telephone": "+237600000000",
      "role": "buyer",
      "company_id": null,
      "email_verified_at": "2026-07-08T10:00:00.000000Z",
      "sellerProfile": null,
      "gamificationStat": { "...": "..." }
    },
    "token": "1|abcdef123456..."
  }
}
```

Champs garantis :

- `id` : identifiant numérique.
- `nom`, `prenom` : colonnes réelles en base (PAS `name`, PAS `fullName` — ces colonnes n'existent pas sur `users`). Un accesseur `fullName` (`prenom + nom`) est disponible sur le modèle et apparaît automatiquement dans le JSON (`$appends`).
- `email`.
- `telephone` : nullable.
- `role` : `buyer` | `seller` | `admin`. Un compte `admin` ne peut **jamais** être créé via `POST /api/auth/register` public (validation stricte à `['buyer', 'seller']` sur cet endpoint) — seul un seeder ou une création manuelle en base peut créer un admin.
- `company_id` : nullable, FK vers `companies`. Toujours `null` à l'inscription ; rempli plus tard via le flux company (propriété de Zai).
- `email_verified_at` : nullable, timestamp. `null` tant que l'email n'est pas vérifié.
- `sellerProfile` : objet ou `null`. Auto-créé à l'inscription si `role=seller` (business_name = fullName, region par défaut "Centre" — à affiner par le vendeur ensuite).
- `gamificationStat` : géré par un autre système, chargé en eager-load ici par confort.

Champs qui n'existent PAS et ne doivent JAMAIS être envoyés au backend : `name`, `fullName`, `companyName`, `country`. Ces trois derniers n'ont pas de colonne sur `users` — l'info entreprise/région vit sur `SellerProfile`/`Company`, propriété de Zai.

## 3. Endpoints auth disponibles

| Méthode | Route | Auth | Body | Notes |
| --- | --- | --- | --- | --- |
| POST | `/api/auth/register` | non | `{ name, email, password, password_confirmation, role? }` | `role` : `buyer` (défaut) ou `seller` uniquement. Throttle 6/min. |
| POST | `/api/auth/login` | non | `{ email, password }` | Throttle 6/min. |
| POST | `/api/auth/logout` | Bearer | — | Révoque le token courant uniquement (pas tous les tokens de l'utilisateur). |
| GET | `/api/auth/me` | Bearer | — | |
| PUT | `/api/auth/me` | Bearer | `{ fullName?, telephone? }` | Découpe `fullName` en `nom`/`prenom` côté serveur. N'accepte PAS `companyName`/`country`. |
| POST | `/api/auth/forgot-password` | non | `{ email }` | Message générique toujours identique, ne révèle jamais si l'email existe. Throttle 6/min. |
| POST | `/api/auth/reset-password` | non | `{ email, token, password, password_confirmation }` | Throttle 6/min. |
| GET | `/api/auth/email/verify/{id}/{hash}` | signé | — | Lien cliqué depuis l'email, redirige vers `{FRONTEND_URL}/login?email_verification=success|invalid`. |
| POST | `/api/auth/email/verification-notification` | Bearer | — | Renvoie l'email de vérification. Throttle 6/min. |
| GET | `/api/auth/social/google/redirect` | non | — | Navigation directe (pas XHR), redirige vers Google. |
| GET | `/api/auth/social/google/callback` | non | — | Navigation directe depuis Google. Redirige vers `{FRONTEND_URL}/auth/social/callback#token=...` en succès, ou `{FRONTEND_URL}/login?social_error=...` en échec. |

## 4. Codes d'erreur attendus

- `401` : identifiants invalides (`{"message": "Invalid credentials."}`) ou token absent/invalide/expiré sur route protégée (`{"message": "Unauthenticated."}`).
- `422` : erreurs de validation Laravel standard (`{"message": "...", "errors": {"champ": ["message"]}}`), y compris email dupliqué à l'inscription et tentative de `role=admin` sur `/register`.
- `429` : rate limit dépassé sur `login`, `register`, `forgot-password`, `reset-password`, `verification-notification` (6 requêtes/minute).
- Aucune route auth ne fait de redirection HTTP en cas d'erreur API (sauf les deux routes OAuth qui sont des navigations navigateur par nature, pas des appels XHR).

## 5. Sécurité déjà en place

- Rate limiting 6/min sur `login`, `register`, `forgot-password`, `reset-password`, `verification-notification`.
- Mots de passe : `Hash::check()` / cast Eloquent `'hashed'`, jamais de comparaison en clair.
- `password` toujours dans `$hidden` du modèle `User` — jamais sérialisé dans les réponses JSON.
- Message de login volontairement générique (`Invalid credentials.`) — ne précise pas si c'est l'email ou le mot de passe qui est faux.
- `forgot-password` retourne toujours le même message, que l'email existe ou non.
- Token Sanctum sans cookie associé : pas de risque CSRF sur les routes auth (`supports_credentials: false` en CORS).
- `role=admin` bloqué à l'inscription publique (voir §2).

## 6. Fichiers possédés par Claude1 — ne pas modifier sans coordination

- `backend/app/Http/Controllers/Api/AuthController.php`
- `backend/app/Http/Controllers/Api/SocialAuthController.php`
- `backend/app/Models/User.php`
- `backend/database/migrations/2026_01_01_000001_create_users_table.php` et toute migration corrective users
- `backend/routes/api.php` — uniquement le groupe `Route::prefix('auth')` (Zai peut modifier le reste du fichier pour ses routes métier)
- `backend/config/sanctum.php`, `backend/config/cors.php` (partie liée à l'auth)
- `backend/tests/Feature/AuthTest.php`
- `frontend/src/services/auth.ts`
- `frontend/src/services/session.ts`
- `frontend/src/hooks/useAuth.tsx`
- `frontend/src/app/login/page.tsx`
- `frontend/src/app/register/page.tsx`
- `frontend/src/app/forgot-password/page.tsx`
- `frontend/src/app/reset-password/page.tsx`
- `frontend/src/app/auth/social/callback/page.tsx`
- `frontend/src/components/AuthForm.tsx` (+ `AuthForm.module.css`)

Claude2 peut lire `frontend/src/services/api.ts` (token/intercepteurs) mais ne doit pas changer la logique d'attache du Bearer token ni le comportement de redirection sur 401 sans coordination — ce fichier est partagé pour les patterns publics de routes (`PUBLIC_PATTERNS`), donc Claude2 peut y ajouter ses propres patterns publics métier sans toucher à la partie token.

## 7. Ce qui n'est PAS encore livré / connu limité

- Pas de refresh token — expiration = déconnexion forcée après 24h.
- `forgot-password`/`reset-password`/vérification email ne sont pas testables end-to-end dans le sandbox (pas de driver mail configuré, pas de DB réelle) — logique vérifiée par lecture de code et `php -l` uniquement. À valider en environnement réel avant démo.
- Pas de 2FA, pas de gestion de sessions multiples/révocation globale (logout ne révoque que le token courant, pas tous les appareils).
- Le rôle `admin` n'a pas de flux de création dédié dans l'app — actuellement seeder uniquement. Si un flux d'invitation admin est nécessaire, c'est un nouveau scope à ouvrir avec Claude1.
