# Intégration paiement mobile — Orange Money (OMAPI) & MTN MoMo

Date : 2026-07-18  
Statut : **Orange Money OMAPI opérationnel** (sandbox). MTN reste en simulation.

Référence officielle : `docs/Guide_Utilisateur_OMAPI___SANDBOX V2.pdf` (Guide Utilisateur OMAPI — SANDBOX v3.0.0, Dec 2025).

---

## 1. Orange Money — flux opérationnel

**Portail** : https://apiis.orange.cm/store/  
**Host sandbox** : `https://api-s1.orange.cm`  
**API** : `omcoreapis/1.0.2`

### 1.1 Prérequis (guide § Mode Sandbox)

| Paramètre | Source | Sandbox (guide) |
|---|---|---|
| Consumer Key / Secret | Portail → Application → Clés SANDBOX | *(générés après souscription)* |
| `X-AUTH-TOKEN` | Mail Orange / guide | `UFJPVEFJU0NQVEVURVNUSU5UT006UFJPVEFJU0NQVEVURVNUSU5UT00yMDIz` |
| `channelUserMsisdn` | Mail Orange / guide | `691301143` |
| PIN marchand | Mail Orange / guide | `2222` |

Variables `.env` : voir `backend/.env.example` (`ORANGE_MONEY_*`).

Sans `ORANGE_MONEY_CONSUMER_KEY` + `SECRET`, le backend **reste en simulation** (pas d’appel réseau).

### 1.2 Authentification (guide §2.1)

```
POST https://api-s1.orange.cm/token
Authorization: Basic base64(consumer_key:consumer_secret)
Body (form): grant_type=client_credentials
→ access_token (TTL 3600s, mis en cache Laravel ~3500s)
```

Chaque appel métier : `Authorization: Bearer {token}` **et** header `X-AUTH-TOKEN`.

### 1.3 Merchant Payment (guide §2.2)

Enchaînement implémenté dans `App\Services\OrangeMoneyService` :

| Étape | Endpoint | Rôle |
|---|---|---|
| 1 | `POST /mp/init` | Génère `payToken` (body vide) |
| 2 | `POST /mp/pay` | Débit initié (PIN **marchand**, MSISDN client, `notifUrl`) |
| 3 | `GET /mp/push/{payToken}` | Push confirmation PIN sur le téléphone client |
| 4 | `GET /mp/paymentstatus/{payToken}` | Polling statut final |

Corps `/mp/pay` (conforme au guide) :
```json
{
  "subscriberMsisdn": "699123456",
  "channelUserMsisdn": "691301143",
  "amount": "15000",
  "description": "C-Connect commande #42",
  "orderId": "CC42",
  "pin": "2222",
  "payToken": "...",
  "notifUrl": "https://…/api/webhooks/payments/orange"
}
```

Notes :
- MSISDN = **9 chiffres** sans `+237` (normalisé côté service).
- `orderId` tronqué à 20 caractères.
- Le PIN est celui du **compte canal marchand**, pas celui du client (le client confirme via push).

### 1.4 Endpoints C-Connect

| Méthode | Route | Auth | Rôle |
|---|---|---|---|
| POST | `/api/payments/mobile-money/initiate` | Sanctum | Init OMAPI (ou simu) |
| GET | `/api/payments/mobile-money/status?order_id=` | Sanctum | Poll `/mp/paymentstatus` → lock escrow |
| POST | `/api/webhooks/payments/orange` | Public | Callback `notifUrl` |
| POST | `/api/payments/mobile-money` | Sanctum | **Simulation only** (MTN / Orange hors OMAPI) |

Frontend (`PaymentPanel.tsx`) :
- Orange + `mode: omapi` → initiate puis poll status toutes les 3s (timeout 120s).
- MTN / simu → initiate puis `POST /mobile-money` (simulation).

### 1.5 Fichiers clés

- `backend/app/Services/OrangeMoneyService.php`
- `backend/app/Http/Controllers/Api/PaymentWebhookController.php`
- `backend/config/services.php` → `orange_money`
- `frontend/src/components/checkout/PaymentPanel.tsx`
- Tests : `backend/tests/Feature/OrangeMoneyPaymentTest.php`

---

## 2. MTN Mobile Money

**Statut : simulation.** Aucune API MTN branchée. Le sélecteur UI affiche MTN ; le flux utilise `PaymentController::processMobileMoney`.

---

## 3. Mise en service sandbox

1. Créer un compte sur https://apiis.orange.cm/store/
2. Créer une Application → Souscrire à **OrangeMoney** → Générer les clés SANDBOX
3. Renseigner dans `backend/.env` :
   ```
   ORANGE_MONEY_ENABLED=true
   ORANGE_MONEY_MODE=sandbox
   ORANGE_MONEY_CONSUMER_KEY=…
   ORANGE_MONEY_CONSUMER_SECRET=…
   ORANGE_MONEY_AUTH_TOKEN=…   # mail Orange ou valeur guide
   ORANGE_MONEY_CHANNEL_MSISDN=691301143
   ORANGE_MONEY_PIN=2222
   ```
4. Exposer `POST /api/webhooks/payments/orange` (tunnel ngrok en local si besoin — le guide mentionne souvent HTTP/port 80 pour `notifUrl`)
5. `php artisan migrate` (colonne `orders.pay_token`)
6. Tester un checkout Orange Money avec un MSISDN sandbox

---

## 4. Production

Après homologation Orange : remplacer les credentials sandbox, `ORANGE_MONEY_MODE=production`, confirmer le host de production avec Orange, et ne plus utiliser les valeurs par défaut du guide.
