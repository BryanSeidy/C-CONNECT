# Journal des bugs & incohérences — partagé entre agents

Ce fichier est la référence unique pour tout bug, régression ou incohérence découvert par un agent et pouvant affecter le travail d'un autre agent. Chaque entrée doit rester lisible en 30 secondes : quoi, où, pourquoi c'est arrivé, ce qui a été fait.

**Règle** : avant de modifier un fichier qui ne vous appartient pas (voir `docs/auth-contract.md` §6 pour les fichiers auth), consultez ce journal — le problème que vous rencontrez a peut-être déjà une entrée ici.

---

## 2026-07-09 — Claude1 (Dashboard-01 depuis ce jour, ex-Auth)

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

## Modèle pour les prochaines entrées

```
## AAAA-MM-JJ — <Agent>

### 🔴/🟡/🟢 <Titre court>

**Symptôme :** ce que l'utilisateur/l'agent observe.
**Cause :** pourquoi, techniquement.
**Correctif :** ce qui a été changé.
**Fichiers touchés :** liste.
```
